# rag_system.py - Enhanced for deeper analysis

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from prompts import REPORT_PROMPT, QA_PROMPT, StudentReport, RESUME_TAILORING_PROMPT
import json
from langchain_core.prompts import PromptTemplate
import os
import re
import logging
from youtube_search_tool import YouTubeSearchTool
from job_scraper import JobApplicationAnalyzer
from dashboard_analyzer import get_dashboard_metrics

logger = logging.getLogger('rag_system')
DATA_PATH = "final_cleaned_student_data.json"

class StudentApiRAG:
    def __init__(self):
        print("🚀 Initializing Enhanced RAG System with Deep Analysis...")
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set!")
        
        # Use more creative temperature for detailed, nuanced analysis
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-pro",  # Use Pro for better analysis
            google_api_key=api_key,
            temperature=0.4,  # Increased for more creative, detailed responses
            top_p=0.95,
            top_k=40
        )
        
        # Secondary LLM for structured output (lower temperature)
        self.structured_llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-pro",
            google_api_key=api_key,
            temperature=0.2,  # Lower for consistent JSON structure
            top_p=0.9
        )
        
        self.youtube_tool = YouTubeSearchTool()
        
        print("📚 Loading student data into memory...")
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            self.student_data = json.load(f)
        print(f"✅ Loaded data for {len(self.student_data)} students.")
        print("🎯 Enhanced analysis engine ready for comprehensive reports!")
        
        self.job_analyzer = JobApplicationAnalyzer()
        
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
        print("  🎯 Identifying personalized learning topics...")
        
        weaknesses = student_report.get("analysis", {}).get("weaknesses", [])
        strengths = student_report.get("analysis", {}).get("strengths", [])
        
        # Extract scores
        dev_orientation_score = 5
        dsa_orientation_score = 5
        
        for score in student_report.get("detailed_scores", []):
            if "Development" in score["parameter"] or "Project" in score["parameter"]:
                dev_orientation_score = score["score"]
            if "DSA" in score["parameter"] or "Problem" in score["parameter"]:
                dsa_orientation_score = score["score"]
        
        prompt_template = """
        As an expert learning advisor, analyze this student's profile and identify 4-6 specific,
        actionable learning topics where they need the most improvement.
        
        Student Profile Analysis:
        - DSA Proficiency: {dsa_orientation_score}/10
        - Development Skills: {dev_orientation_score}/10
        - Key Strengths: {strengths}
        - Areas for Growth: {weaknesses}
        
        For each recommended topic:
        1. Choose a SPECIFIC, searchable topic (e.g., "Dynamic Programming Patterns", "React Hooks", "System Design Basics")
        2. Explain WHY this is critical for the student's growth (50-100 words)
        3. Ensure the topic has quality YouTube content available
        4. Prioritize high-impact areas that address their weaknesses
        
        Return ONLY valid JSON in this EXACT format:
        [
            {{
                "topic": "Binary Search and Two Pointers",
                "reason": "Your LeetCode profile shows only 15% accuracy on searching problems. These patterns are fundamental building blocks appearing in 30% of technical interviews. Mastering binary search variants and two-pointer techniques will unlock solutions to 50+ common problem types and significantly improve your problem-solving speed."
            }},
            {{
                "topic": "React State Management with Redux",
                "reason": "Your projects show basic React knowledge but lack complex state management. As applications scale, Redux becomes essential. Learning this now will make your projects production-ready and is a must-have skill for 70% of frontend positions at product companies."
            }}
        ]
        
        Requirements:
        - Return 4-6 topics
        - Use double quotes for all JSON keys and values
        - Each reason should be 50-100 words
        - Topics must be specific and searchable
        - No extra text before or after the JSON array
        """
        
        try:
            chain = PromptTemplate(
                template=prompt_template, 
                input_variables=["dsa_orientation_score", "dev_orientation_score", "strengths", "weaknesses"]
            ) | self.llm
            
            response = chain.invoke({
                "dsa_orientation_score": dsa_orientation_score,
                "dev_orientation_score": dev_orientation_score,
                "strengths": ', '.join(strengths[:3]) if strengths else 'None specifically identified',
                "weaknesses": ', '.join(weaknesses[:3]) if weaknesses else 'None specifically identified'
            })
            
            response_text = response.content
            
            # Extract JSON
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                logger.error("No JSON array found in topic identification")
                return self._get_default_topics()
            
            json_text = response_text[json_start:json_end]
            json_text = json_text.replace('\n', ' ').replace('\r', '')
            
            try:
                topics_data = json.loads(json_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {e}")
                # Try fixing common issues
                fixed_json = json_text.replace("'", '"')
                try:
                    topics_data = json.loads(fixed_json)
                except:
                    return self._get_default_topics()
            
            if not isinstance(topics_data, list):
                logger.error("Topic data is not a list")
                return self._get_default_topics()
            
            # Validate and process topics
            valid_topics = []
            for item in topics_data[:6]:  # Max 6 topics
                topic = item.get("topic", "").strip()
                reason = item.get("reason", "").strip()
                
                if topic and reason and len(reason) > 30:  # Ensure substantial reason
                    valid_topics.append({
                        "topic": topic,
                        "reason": reason,
                        "category": self._determine_topic_category(topic)
                    })
            
            if not valid_topics:
                logger.warning("No valid topics identified, using defaults")
                return self._get_default_topics()
            
            print(f"    ✅ Identified {len(valid_topics)} personalized learning topics")
            return valid_topics
            
        except Exception as e:
            logger.error(f"Error identifying topics: {e}")
            return self._get_default_topics()

    def generate_tailored_resume(self, enrollment_no: str, job_description: str) -> str:
        """Generates a tailored resume in Markdown format based on the job description."""
        print(f"📄 Generating tailored resume for {enrollment_no}...")
        
        # 1. Get Student Profile
        student_profile = self.student_data.get(enrollment_no) # Assuming _get_student_context is replaced by direct access
        if not student_profile:
            return "Error: Student profile not found."

        # 2. Prepare Prompt
        prompt = RESUME_TAILORING_PROMPT.format(
            student_profile=json.dumps(student_profile, indent=2), # Convert dict to JSON string for prompt
            job_description=job_description
        )

        # 3. Call LLM
        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            logger.error(f"Error generating resume: {e}")
            return f"Error generating resume: {str(e)}"

    def _determine_topic_category(self, topic: str) -> str:
        """Determine the most appropriate category for a topic."""
        topic_lower = topic.lower()
        
        for category, topics in self.topic_categories.items():
            for predefined_topic in topics:
                if predefined_topic.lower() in topic_lower or topic_lower in predefined_topic.lower():
                    return category
        
        # Fallback categorization
        if any(kw in topic_lower for kw in ["algorithm", "data structure", "dsa", "binary", "dynamic", "greedy", "tree", "graph", "array", "string"]):
            return "DSA"
        elif any(kw in topic_lower for kw in ["web", "react", "angular", "vue", "node", "express", "api", "html", "css", "javascript"]):
            return "Web Development"
        elif any(kw in topic_lower for kw in ["python", "java", "c++", "c#", "javascript", "go", "rust"]):
            return "Programming Languages"
        
        return "Computer Science Fundamentals"

    def _get_default_topics(self) -> list:
        """Return default topics with detailed reasons."""
        return [
            {
                "topic": "Dynamic Programming Fundamentals",
                "reason": "Dynamic Programming is a critical problem-solving technique that appears in 25-30% of technical interviews at top companies. It's essential for optimization problems and demonstrates strong algorithmic thinking. Mastering DP patterns will significantly improve your problem-solving arsenal and interview success rate.",
                "category": "DSA"
            },
            {
                "topic": "Binary Search Variations",
                "reason": "Binary search is a fundamental algorithm that extends beyond simple array searching. Understanding its variations (rotated arrays, finding boundaries, search in unknown size arrays) unlocks solutions to 40+ LeetCode problems and is frequently tested in interviews. This skill demonstrates strong understanding of time complexity optimization.",
                "category": "DSA"
            },
            {
                "topic": "React Advanced Patterns",
                "reason": "Moving beyond basics to advanced React patterns (custom hooks, context API, render props, compound components) is crucial for building scalable applications. These patterns are used in production codebases at major companies and demonstrate senior-level frontend skills that command premium salaries.",
                "category": "Web Development"
            }
        ]

    def _get_youtube_recommendations(self, student_report: dict) -> list:
        """Generate comprehensive YouTube video recommendations."""
        print("  📺 Generating personalized YouTube recommendations...")
        
        learning_topics = self._identify_learning_topics(student_report)
        topic_recommendations = []
        
        for topic_info in learning_topics:
            topic = topic_info["topic"]
            category = topic_info["category"]
            
            print(f"    🔍 Searching videos for: '{topic}' ({category})")
            
            try:
                youtube_videos = self.youtube_tool.run({
                    "query": topic,
                    "max_results": 5,
                    "topic_category": category
                })
                
                topic_videos = [{
                    "title": video["title"],
                    "url": video["url"],
                    "embed_url": video["embed_url"],
                    "reason": video["description"]
                } for video in youtube_videos]
                
                topic_recommendations.append({
                    "topic": topic,
                    "reason": topic_info["reason"],
                    "category": category,
                    "videos": topic_videos
                })
                
                print(f"      ✅ Found {len(topic_videos)} high-quality videos")
                
            except Exception as e:
                print(f"    ⚠️ Error fetching videos for '{topic}': {e}")
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
        
        print(f"    ✅ Generated {len(topic_recommendations)} comprehensive learning modules")
        return topic_recommendations

    def generate_structured_report(self, enrollment_no: str) -> dict:
        """Generate comprehensive student report with deep analysis."""
        print(f"\n{'='*80}")
        print(f"🎓 GENERATING COMPREHENSIVE REPORT FOR: {enrollment_no}")
        print(f"{'='*80}\n")
        
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            return {"error": "No data found for this student."}
        
        context = json.dumps(student_profile, indent=2)
        
        # Use structured LLM for JSON parsing
        parser = JsonOutputParser(pydantic_object=StudentReport)
        prompt_with_format = REPORT_PROMPT.partial(
            format_instructions=parser.get_format_instructions()
        )
        
        chain = prompt_with_format | self.structured_llm | parser
        
        try:
            print("🤖 AI analyzing student profile comprehensively...")
            report_dict = chain.invoke({"context": context})
            
            # Inject CGPA Trend Data
            try:
                semester_performance = student_profile.get("academic_profile", {}).get("semester_performance", [])
                if semester_performance:
                    labels = [f"Sem {sem['semester']}" for sem in semester_performance]
                    values = [sem['sgpa'] for sem in semester_performance]
                    report_dict["cgpa_trend"] = {
                        "labels": labels,
                        "values": values
                    }
                    print(f"    📊 Injected CGPA trend: {len(values)} semesters")
                else:
                    report_dict["cgpa_trend"] = None
            except Exception as e:
                print(f"    ⚠️ CGPA trend extraction failed: {e}")
                report_dict["cgpa_trend"] = None
            
            # Generate video recommendations
            try:
                print("\n📹 Generating personalized learning resources...")
                youtube_recommendations = self._get_youtube_recommendations(report_dict)
                report_dict["youtube_recommendations"] = youtube_recommendations
                print(f"    ✅ Added {len(youtube_recommendations)} curated learning modules")
            except Exception as e:
                print(f"    ⚠️ Video recommendations failed: {e}")
                report_dict["youtube_recommendations"] = self._get_default_topic_recommendations()
            
            print(f"\n{'='*80}")
            print("✅ COMPREHENSIVE REPORT GENERATION COMPLETE!")
            print(f"{'='*80}\n")
            
            return report_dict
            
        except Exception as e:
            logger.error(f"Report generation error: {e}", exc_info=True)
            print(f"\n❌ ERROR: {e}\n")
            return {
                "error": "Failed to generate report",
                "overall_summary": "Report generation encountered an error. Please try again.",
                "executive_summary": "Error generating analysis.",
                "detailed_scores": [],
                "analysis": {
                    "strengths": ["System error occurred"],
                    "weaknesses": ["Unable to analyze due to technical issue"],
                    "hidden_talents": []
                },
                "actionable_advice": {
                    "recommendations": [{
                        "title": "System Error",
                        "description": "Please try generating the report again or contact support.",
                        "priority": "HIGH",
                        "estimated_time": "N/A",
                        "expected_impact": "N/A",
                        "mermaid_flowchart": ""
                    }]
                },
                "resume_analysis": {
                    "summary": "Analysis unavailable",
                    "key_skills": [],
                    "professional_links": [],
                    "missing_elements": [],
                    "ats_score": 0,
                    "improvement_suggestions": []
                },
                "skills": [],
                "learning_path": [],
                "career_insights": {
                    "current_trajectory": "Analysis unavailable",
                    "potential_roles": [],
                    "salary_range": "N/A",
                    "competitive_advantage": "N/A",
                    "market_positioning": "N/A"
                },
                "youtube_recommendations": self._get_default_topic_recommendations()
            }

    def _get_default_topic_recommendations(self) -> list:
        """Return default comprehensive recommendations."""
        default_topics = self._get_default_topics()
        topic_recommendations = []
        
        for topic_info in default_topics:
            topic = topic_info["topic"]
            category = topic_info["category"]
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
        
        return topic_recommendations

    def analyze_job_application(self, job_application_link: str, enrollment_no: str) -> dict:
        """Analyze student profile against job requirements."""
        print(f"\n🎯 Starting comprehensive job analysis...")
        print(f"   Student: {enrollment_no}")
        print(f"   Job Link: {job_application_link}\n")
        
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            logger.error(f"Student not found: {enrollment_no}")
            return {
                "error": "Student data not found",
                "strategic_overview": {
                    "summary": "Error: Student data unavailable",
                    "your_key_opportunity": "Please verify enrollment number"
                },
                "your_core_strengths_for_this_role": [],
                "strategic_areas_for_growth": [],
                "video_recommendations": []
            }
        
        analysis_result = self.job_analyzer.analyze(job_application_link, student_profile)
        print("✅ Job analysis complete!\n")
        
        return analysis_result

    def get_student_dashboard_metrics(self, enrollment_no: str) -> dict:
        """Get comprehensive dashboard metrics."""
        print(f"📊 Calculating comprehensive metrics for: {enrollment_no}")
        
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            logger.error(f"Student not found: {enrollment_no}")
            return {"error": "Student data not found"}
        
        metrics = get_dashboard_metrics(student_profile)
        print("✅ Dashboard metrics calculated\n")
        
        return metrics

    def answer_question(self, query: str, enrollment_no: str) -> str:
        """Answer questions with detailed, comprehensive responses."""
        print(f"\n💬 Answering question for {enrollment_no}")
        print(f"   Query: {query}\n")
        
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            return "❌ Could not find data for the selected student."

        sources_to_use = self._determine_sources_from_query(query)
        print(f"   📂 Using data sources: {', '.join(sources_to_use)}")

        # Build targeted context
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
            return "❌ Could not find relevant information in the student's profile to answer that question."

        context_str = json.dumps(targeted_context, indent=2)
        chain = QA_PROMPT | self.llm
        result = chain.invoke({"context": context_str, "question": query})
        
        print("   ✅ Response generated\n")
        return result.content

    def get_all_students_summary(self) -> list:
        """Returns a summary list of all students."""
        summaries = []
        for enrollment_no, data in self.student_data.items():
            summaries.append({
                "enrollment_no": enrollment_no,
                "name": data.get("personal_info", {}).get("name", "Unknown"),
                "cgpa": data.get("academic_performance", {}).get("current_cgpa", "N/A"),
                "key_skills": data.get("skills", {}).get("technical_skills", [])[:3] # Top 3 skills
            })
        return summaries