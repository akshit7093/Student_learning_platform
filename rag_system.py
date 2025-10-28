# rag.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from prompts import REPORT_PROMPT, QA_PROMPT, StudentReport
import json
from langchain_core.prompts import PromptTemplate
import os
import re
import logging
from youtube_search_tool import YouTubeSearchTool
# Import the new JobApplicationAnalyzer
from job_scraper import JobApplicationAnalyzer # Corrected import name
# Import the new dashboard analyzer logic
from dashboard_analyzer import get_dashboard_metrics # Import the main function

logger = logging.getLogger('rag_system')
DATA_PATH = "final_cleaned_student_data.json"

class StudentApiRAG:
    def __init__(self):
        print("Initializing API-based RAG system...")
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set!")
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-flash-latest", # Updated model name if needed
            google_api_key=api_key,
            temperature=0.2
        )
        # Initialize the YouTube search tool
        self.youtube_tool = YouTubeSearchTool()
        print("Loading student data into memory...")
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            self.student_data = json.load(f)
        print(f"✅ Loaded data for {len(self.student_data)} students. System ready.")
        
        # Initialize the new JobApplicationAnalyzer
        self.job_analyzer = JobApplicationAnalyzer()
        
        # Define topic categories for better search organization (kept for potential other uses)
        self.topic_categories = {
            "DSA": [
                "Arrays", "Strings", "Linked Lists", "Stacks", "Queues", 
                "Trees", "Graphs", "Heaps", "Hashing", "Binary Search",
                "Dynamic Programming", "Greedy Algorithms", "Backtracking",
                "Bit Manipulation", "Math", "Sorting", "Searching", "AIDS303", "AIDS353"
            ],
            "Web Development": [
                "HTML", "CSS", "JavaScript", "React", "Angular", "Vue",
                "Node.js", "Express", "Django", "Flask", "REST APIs",
                "TypeScript", "Webpack", "Babel", "CSS Frameworks"
            ],
            "Programming Languages": [
                "Python", "Java", "C++", "C#", "JavaScript", "TypeScript",
                "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"
            ],
            "Computer Science Fundamentals": [
                "Operating Systems", "Computer Networks", "Database Systems",
                "Compilers", "Computer Architecture", "Distributed Systems",
                "Artificial Intelligence", "Machine Learning", "Data Science",
                "Cloud Computing", "Cybersecurity"
            ]
        }

    def _determine_sources_from_query(self, query: str) -> list:
        query = query.lower()
        sources = []
        if any(keyword in query for keyword in ["dsa", "problem solving", "coding", "leetcode", "codeforces", "resume", "cv", "skills", "video", "youtube", "tutorial"]):
            sources.extend(["leetcode", "codeforces", "resume"])
        if any(keyword in query for keyword in ["project", "experience", "github", "code", "repository"]):
            sources.append("github")
        if any(keyword in query for keyword in ["academic", "grade", "gpa", "cgpa", "subject", "marks", "semester"]):
            sources.append("academic_profile")
        return list(set(sources)) if sources else ["academic_profile", "coding_profiles", "resume"]

    def _identify_learning_topics(self, student_report: dict) -> list:
        """Have the AI identify specific topic areas where the student needs improvement."""
        print("  > Identifying specific learning topics for YouTube recommendations...")
        # Extract relevant information from the report
        weaknesses = student_report.get("analysis", {}).get("weaknesses", [])
        strengths = student_report.get("analysis", {}).get("strengths", [])
        # Get scores from the report
        dev_orientation_score = 5
        dsa_orientation_score = 5
        # Try to extract scores from detailed_scores if available
        for score in student_report.get("detailed_scores", []):
            if "Development" in score["parameter"] or "Project" in score["parameter"]:
                dev_orientation_score = score["score"]
            if "DSA" in score["parameter"] or "Problem" in score["parameter"]:
                dsa_orientation_score = score["score"]
        # Create a more robust prompt template
        prompt_template = """
        Analyze this student's academic and coding profile to identify 3-5 specific topic areas 
        where they need improvement. Focus on concrete, actionable topics that have dedicated 
        learning resources on YouTube.
        Student Profile:
        - DSA Score: {dsa_orientation_score}/10
        - Development/Project Score: {dev_orientation_score}/10
        - Strengths: {strengths}
        - Weaknesses: {weaknesses}
        Identify specific topic areas where the student needs improvement. For each topic:
        1. Provide a concise, specific topic name (e.g., "Binary Search", "React Hooks", "SQL Joins")
        2. Explain why this topic is important for the student
        3. Ensure the topic is narrow enough to have dedicated YouTube tutorials
        Return ONLY a valid JSON array in this exact format:
        [
            {{
                "topic": "Binary Search",
                "reason": "The student struggles with searching algorithms and needs to understand binary search for efficient problem solving."
            }},
            {{
                "topic": "React State Management",
                "reason": "The student's projects show difficulty managing component state in complex UIs."
            }}
        ]
        Make sure your JSON is properly formatted with double quotes around all keys and string values.
        """
        try:
            # Create a chain to get the topic recommendations
            chain = PromptTemplate(
                template=prompt_template, 
                input_variables=["dsa_orientation_score", "dev_orientation_score", "strengths", "weaknesses"]
            ) | self.llm
            # Invoke the chain with the actual values
            response = chain.invoke({
                "dsa_orientation_score": dsa_orientation_score,
                "dev_orientation_score": dev_orientation_score,
                "strengths": ', '.join(strengths) if strengths else 'None specifically identified',
                "weaknesses": ', '.join(weaknesses) if weaknesses else 'None specifically identified'
            })
            response_text = response.content
            # Try to extract JSON from the response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start == -1 or json_end == 0:
                logger.error("No JSON array found in topic identification response")
                logger.debug(f"Response text: {response_text}")
                return self._get_default_topics()
            json_text = response_text[json_start:json_end]
            # Clean up common JSON issues
            json_text = json_text.replace('\n', ' ').replace('\r', '')
            try:
                # Parse JSON
                topics_data = json.loads(json_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse topic identification as JSON: {e}")
                logger.debug(f"JSON text: {json_text}")
                # Try to fix common JSON issues
                try:
                    # Replace single quotes with double quotes
                    fixed_json = json_text.replace("'", '"')
                    topics_data = json.loads(fixed_json)
                except:
                    # If still fails, return default topics
                    return self._get_default_topics()
            if not isinstance(topics_data, list):
                logger.error("Topic identification response is not a list")
                return self._get_default_topics()
            # Validate and clean the topics
            valid_topics = []
            for item in topics_data[:5]:  # Limit to 5 topics
                topic = item.get("topic", "").strip()
                reason = item.get("reason", "").strip()
                if topic and reason:
                    valid_topics.append({
                        "topic": topic,
                        "reason": reason,
                        "category": self._determine_topic_category(topic)
                    })
            if not valid_topics:
                logger.warning("No valid topics identified, using defaults")
                return self._get_default_topics()
            print(f"    > Identified {len(valid_topics)} specific learning topics.")
            return valid_topics
        except Exception as e:
            logger.error(f"Error identifying learning topics: {e}")
            return self._get_default_topics()

    def _determine_topic_category(self, topic: str) -> str:
        """Determine the most appropriate category for a topic."""
        topic_lower = topic.lower()
        # Check against our predefined categories
        for category, topics in self.topic_categories.items():
            for predefined_topic in topics:
                if predefined_topic.lower() in topic_lower or topic_lower in predefined_topic.lower():
                    return category
        # Fallback categories based on keywords
        if any(kw in topic_lower for kw in ["algorithm", "data structure", "dsa", "binary", "dynamic", "greedy", "tree", "graph", "array", "string"]):
            return "DSA"
        elif any(kw in topic_lower for kw in ["web", "react", "angular", "vue", "node", "express", "api", "html", "css", "javascript"]):
            return "Web Development"
        elif any(kw in topic_lower for kw in ["python", "java", "c++", "c#", "javascript", "go", "rust"]):
            return "Programming Languages"
        return "Computer Science Fundamentals"

    def _get_default_topics(self) -> list:
        """Return default topics in case of errors."""
        return [
            {
                "topic": "Binary Search",
                "reason": "Essential searching algorithm that forms the basis for many problem-solving techniques",
                "category": "DSA"
            },
            {
                "topic": "Dynamic Programming",
                "reason": "Fundamental technique for solving optimization problems with overlapping subproblems",
                "category": "DSA"
            },
            {
                "topic": "React Fundamentals",
                "reason": "Core concepts for building modern web applications with component-based architecture",
                "category": "Web Development"
            }
        ]

    def _get_youtube_recommendations(self, student_report: dict) -> list:
        """Generate real YouTube video recommendations based on specific learning topics."""
        print("  > Generating topic-based YouTube recommendations...")
        # First, identify specific learning topics
        learning_topics = self._identify_learning_topics(student_report)
        # Now search for videos for each topic
        topic_recommendations = []
        for topic_info in learning_topics:
            topic = topic_info["topic"]
            category = topic_info["category"]
            print(f"    > Searching for videos on topic: '{topic}' (category: {category})")
            try:
                # Search YouTube for this specific topic
                youtube_videos = self.youtube_tool.run({
                    "query": topic,
                    "max_results": 5,
                    "topic_category": category
                })
                # Format the videos for this topic
                topic_videos = [{
                    "title": video["title"],
                    "url": video["url"],
                    "embed_url": video["embed_url"],
                    "reason": video["description"]
                } for video in youtube_videos]
                # Add to recommendations
                topic_recommendations.append({
                    "topic": topic,
                    "reason": topic_info["reason"],
                    "category": category,
                    "videos": topic_videos
                })
                print(f"      > Found {len(topic_videos)} videos for topic '{topic}'")
            except Exception as e:
                print(f"    > Warning: Failed to get videos for topic '{topic}': {e}")
                # Add fallback videos for this topic
                fallback_videos = self.youtube_tool._get_fallback_videos(topic, 5, category)
                topic_videos = [{
                    "title": video["title"],
                    "url": video["url"],
                    "embed_url": video["embed_url"],
                    "reason": video["description"]
                } for video in fallback_videos]
                topic_recommendations.append({
                    "topic": topic,
                    "reason": topic_info["reason"],
                    "category": category,
                    "videos": topic_videos
                })
        print(f"    > Generated {len(topic_recommendations)} topic sections with video recommendations.")
        return topic_recommendations

    def generate_structured_report(self, enrollment_no: str) -> dict:
        """Generates the full, structured student report via API call including video suggestions."""
        print(f"Generating full report for {enrollment_no}...")
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            return {"error": "No data found for this student."}
        context = json.dumps(student_profile, indent=2)
        # Use JsonOutputParser with the Pydantic model
        parser = JsonOutputParser(pydantic_object=StudentReport)
        prompt_with_format = REPORT_PROMPT.partial(
            format_instructions=parser.get_format_instructions()
        )
        chain = prompt_with_format | self.llm | parser
        try:
            # Get the base report
            report_dict = chain.invoke({"context": context})
            # Now generate topic-based video recommendations
            try:
                youtube_recommendations = self._get_youtube_recommendations(report_dict)
                # Add video suggestions to the report
                report_dict["youtube_recommendations"] = youtube_recommendations
                print(f"    > Added {len(youtube_recommendations)} topic sections with video recommendations.")
            except Exception as e:
                print(f"    > Warning: Failed to generate video suggestions: {e}")
                report_dict["youtube_recommendations"] = self._get_default_topic_recommendations()
            return report_dict
        except Exception as e:
            print(f"Error invoking LLM or parsing output: {e}")
            return {
                "error": "Failed to generate a valid report from the LLM.",
                "overall_summary": "Error generating report. Please try again later.",
                "detailed_scores": [],
                "analysis": {
                    "strengths": ["Report generation error"],
                    "weaknesses": ["Unable to analyze profile due to system error"]
                },
                "actionable_advice": {
                    "recommendations": ["Please try generating the report again or contact support"]
                },
                "resume_analysis": {
                    "summary": "Resume analysis unavailable",
                    "key_skills": [],
                    "professional_links": [],
                    "missing_elements": ["Analysis failed"]
                },
                "youtube_recommendations": self._get_default_topic_recommendations()
            }

    def _get_default_topic_recommendations(self) -> list:
        """Return default topic-based recommendations in case of errors."""
        default_topics = self._get_default_topics()
        topic_recommendations = []
        for topic_info in default_topics:
            topic = topic_info["topic"]
            category = topic_info["category"]
            # Get fallback videos for this topic
            fallback_videos = self.youtube_tool._get_fallback_videos(topic, 5, category)
            # Format the videos
            topic_videos = [{
                "title": video["title"],
                "url": video["url"],
                "embed_url": video["embed_url"],
                "reason": video["description"]
            } for video in fallback_videos]
            topic_recommendations.append({
                "topic": topic,
                "reason": topic_info["reason"],
                "category": category,
                "videos": topic_videos
            })
        return topic_recommendations

    def analyze_job_application(self, job_application_link: str, enrollment_no: str) -> dict:
        """
        Analyzes a student's profile against a job description link using the new JobApplicationAnalyzer.
        This method now performs a comparative analysis and integrates YouTube recommendations based on specific AI-generated queries.
        It fetches the student profile internally using the enrollment_no.
        """
        print(f"  > Starting job analysis using the new analyzer for link: {job_application_link} and student: {enrollment_no}")
        
        # Fetch the student profile internally
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            logger.error(f"No data found for enrollment number: {enrollment_no}")
            return {
                "error": "No data found for the provided student enrollment number.",
                "strategic_overview": {"summary": "Error: Student data not found.", "your_key_opportunity": "Please check the enrollment number."},
                "your_core_strengths_for_this_role": [],
                "strategic_areas_for_growth": [],
                "video_recommendations": []
            }
        
        # Use the imported JobApplicationAnalyzer's analyze method
        analysis_result = self.job_analyzer.analyze(job_application_link, student_profile)
        
        return analysis_result

    def get_student_dashboard_metrics(self, enrollment_no: str) -> dict:
        """
        Retrieves and analyzes a specific student's profile data using the dashboard_analyzer logic.
        """
        print(f"  > Calculating dashboard metrics for student: {enrollment_no}")
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            logger.error(f"No data found for enrollment number: {enrollment_no}")
            return {"error": "No data found for the provided student enrollment number."}
        
        # Use the imported get_dashboard_metrics function from dashboard_analyzer.py
        metrics = get_dashboard_metrics(student_profile)
        
        return metrics


    def answer_question(self, query: str, enrollment_no: str) -> str:
        """Answers a specific question using a targeted context from the JSON."""
        print(f"Answering question for {enrollment_no}: '{query}'")
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            return "Could not find data for the selected student."

        sources_to_use = self._determine_sources_from_query(query)
        print(f"  > Targeting data sources: {sources_to_use}")

        targeted_context = {}
        if "academic_profile" in sources_to_use:
            targeted_context["academic_profile"] = student_profile.get("academic_profile")
        coding_profiles = {}
        if "leetcode" in sources_to_use:
            coding_profiles["leetcode"] = student_profile.get("coding_profiles", {}).get("leetcode")
        if "github" in sources_to_use:
            coding_profiles["github"] = student_profile.get("coding_profiles", {}).get("github")
        if "codeforces" in sources_to_use:
            coding_profiles["codeforces"] = student_profile.get("coding_profiles", {}).get("codeforces")
        if coding_profiles:
            targeted_context["coding_profiles"] = coding_profiles
        if "coding_profiles" in sources_to_use and not coding_profiles:
            targeted_context["coding_profiles"] = student_profile.get("coding_profiles")
        if "resume" in sources_to_use:
            targeted_context["resume"] = student_profile.get("resume")

        if not targeted_context:
            return "I could not find any relevant information in this student's profile to answer that question."

        context_str = json.dumps(targeted_context, indent=2)
        chain = QA_PROMPT | self.llm
        result = chain.invoke({"context": context_str, "question": query})
        return result.content
