# job_analyzer.py

import os
import json
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from youtube_search_tool import YouTubeSearchTool

logger = logging.getLogger('job_analyzer')

class JobApplicationAnalyzer:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set!")
            
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-flash-latest",  # Using a more powerful model for better comparative analysis
            google_api_key=api_key,
            temperature=0.3  # Allowing for slightly more creative and encouraging coaching language
        )
        
        self.youtube_tool = YouTubeSearchTool()
        print("Job Application Analyzer initialized successfully.")

    def analyze(self, job_application_link: str, student_profile: dict) -> dict:
        """
        Analyzes a student's profile against a job description and provides a
        personalized action plan. This is the new, primary method.
        """
        print("  > Starting personalized job analysis...")
        
        # Convert the student's profile dictionary to a formatted JSON string for the prompt
        student_context = json.dumps(student_profile, indent=2)

        # Use the new, highly detailed prompt template
        prompt = PromptTemplate(
            template=self.get_analysis_prompt_template(),
            input_variables=["job_application_link", "student_context"]
        )
        
        chain = prompt | self.llm
        
        try:
            response = chain.invoke({
                "job_application_link": job_application_link,
                "student_context": student_context
            })
            response_text = response.content
            
            # Clean and parse the JSON response from the LLM
            json_text = self._extract_json(response_text)
            if not json_text:
                logger.error("No JSON object found in the LLM response for job analysis.")
                return self._get_default_analysis("Failed to extract JSON from LLM response.")

            analysis_data = json.loads(json_text)
            
            # Enhance the analysis with YouTube recommendations based on the AI's suggestions
            if "strategic_areas_for_growth" in analysis_data:
                print("  > Generating YouTube recommendations for growth areas...")
                # Create a new key for recommendations to match the desired output format
                analysis_data["video_recommendations"] = []
                for area in analysis_data.get("strategic_areas_for_growth", []):
                    # Use the concise search query provided by the LLM to avoid errors
                    search_query = area.get("youtube_search_query")
                    if not search_query:
                        logger.warning(f"No youtube_search_query found for growth area: {area.get('area_to_develop')}")
                        continue

                    category = self._determine_skill_category(search_query)
                    
                    try:
                        videos = self.youtube_tool.run({
                            "query": search_query,
                            "max_results": 3,
                            "topic_category": category
                        })
                        
                        formatted_videos = [{
                            "title": v.get("title", "N/A"),
                            "url": v.get("url"),
                            "embed_url": v.get("embed_url"),
                            "reason": v.get("description", "A recommended video to help you learn this topic.")
                        } for v in videos]
                        
                        # Add to the new recommendations list
                        analysis_data["video_recommendations"].append({
                            "topic": area.get("area_to_develop"),
                            "reason": f"This is a key area for you to focus on to better match the job requirements.",
                            "category": category,
                            "videos": formatted_videos
                        })
                    except Exception as e:
                        logger.error(f"Error getting videos for topic '{search_query}': {e}")
            
            return analysis_data

        except Exception as e:
            logger.error(f"An error occurred during job application analysis: {e}", exc_info=True)
            return self._get_default_analysis(str(e))

    def _extract_json(self, text: str) -> str:
        """Safely extracts a JSON object from a string that might contain other text."""
        try:
            # Find the first '{' and the last '}' to isolate the JSON object
            start_index = text.find('{')
            end_index = text.rfind('}') + 1
            if start_index != -1 and end_index != 0:
                return text[start_index:end_index]
        except Exception:
            return None
        return None
        
    def get_analysis_prompt_template(self) -> str:
        """
        Returns the new, detailed prompt that forces a personalized, comparative analysis.
        """
        return """
        **Your Persona:** You are a world-class Senior Career Strategist from Google. You are a mentor speaking directly and encouragingly to a student, using "you" and "your". Your advice is insightful, strategic, and hyper-personalized.

        **Your Mission:** Analyze the provided student's profile against the requirements of the job description. Your output MUST BE a direct, comparative analysis, creating a personalized action plan to help the student land this specific job. You will not speak about a generic candidate; you will speak directly about the student's provided data.

        **1. Student's Profile (Context):**
        ```json
        {student_context}
        ```

        **2. Job Description Link:**
        {job_application_link}

        **Your Step-by-Step Thinking Process (Internal Monologue):**
        1.  **Deconstruct the Job:** I will identify the top 5 'must-have' technical and soft skills from the job description (e.g., BigQuery, Dataflow, customer-facing skills).
        2.  **Analyze the Student:** I will thoroughly review the student's resume, projects, and coding stats. I will note the specific technologies they've used (e.g., Python, SQL, React) and the outcomes of their projects.
        3.  **Perform a Comparative Gap Analysis:** This is the most critical step. I will compare the student's specific skills and projects to the job's requirements. 
            - I will find direct evidence in their profile that matches the job (e.g., "Your project 'EcoSort' uses Python and computer vision, which directly aligns with the job's need for ML skills.").
            - I will identify the most critical gaps (e.g., "The job requires Google Cloud experience, but your resume and projects only list AWS. This is your main gap to address.").
        4.  **Craft the Action Plan:** I will translate this direct comparison into the structured JSON output below, ensuring every point refers back to the student's profile and the job description.

        **The Output: Your Personalized Action Plan (JSON Format)**
        Provide your response ONLY in the valid JSON format below. Do not include any text before or after the JSON block.

        {{
            "strategic_overview": {{
                "summary": "Start with an encouraging summary directly referencing the student's background. e.g., 'With your background in [Student's Major/Key Skill], this role is a great potential fit. We need to focus on showcasing how your projects align with their needs and strategically build up your Google Cloud expertise.'",
                "your_key_opportunity": "Identify the single most important thing for you to do. e.g., 'Your biggest opportunity is to frame your AWS project experience as cloud-agnostic engineering excellence, while rapidly learning the GCP specifics.'"
            }},
            "your_core_strengths_for_this_role": [
                {{
                    "strength_area": "Reference a specific skill or project from the student's profile. e.g., 'Python and Data Manipulation Skills'",
                    "evidence_from_your_profile": "Quote or describe the evidence from the student's JSON data. e.g., 'Your 'Data-Driven-Dialogue' project on GitHub shows strong proficiency in Python with Pandas and Scikit-learn.'",
                    "how_it_matches_the_job": "Explain precisely how this evidence meets a key requirement from the job description. e.g., 'This is crucial for the role, which requires scripting and building data prototypes to solve customer problems.'"
                }}
            ],
            "strategic_areas_for_growth": [
                {{
                    "area_to_develop": "Identify a specific missing skill or experience. e.g., 'Hands-On Google Cloud Data Stack Expertise'",
                    "severity": "Categorize as 'Critical Gap', 'High-Impact Area', or 'Nice-to-Have'.",
                    "insight": "Explain why this is a gap by comparing their profile to the job description. e.g., 'The role is laser-focused on the GCP ecosystem. While your foundational data skills are strong, your resume does not mention hands-on experience with BigQuery or Dataflow, which are core requirements.'",
                    "path_to_improvement": [
                        "1. **Certify:** Rapidly study for and pass the Google Cloud Professional Data Engineer certification. This is the strongest signal you can send.",
                        "2. **Build & Showcase:** Create a small, end-to-end project using Pub/Sub, Dataflow, and BigQuery and feature it prominently on your GitHub and resume."
                    ],
                    "youtube_search_query": "Provide a short, effective search query (3-5 words) for this topic. e.g., 'Google Cloud Dataflow tutorial' or 'Technical presentation skills for engineers'"
                }}
            ]
        }}
        """

    def _determine_skill_category(self, skill: str) -> str:
        """Determines the category for a skill, optimized for short search queries."""
        skill_lower = skill.lower()
        if any(kw in skill_lower for kw in ["cloud", "aws", "azure", "gcp", "docker", "bigquery", "dataflow"]):
            return "Cloud Computing"
        if any(kw in skill_lower for kw in ["python", "java", "sql", "javascript", "c++"]):
            return "Programming Languages"
        if any(kw in skill_lower for kw in ["ml", "ai", "machine learning", "vertex"]):
            return "Machine Learning"
        if any(kw in skill_lower for kw in ["presentation", "communication", "soft skills", "customer"]):
            return "Soft Skills"
        return "Computer Science Fundamentals"

    def _get_default_analysis(self, error_message: str) -> dict:
        """Returns a default, structured analysis in case of a processing error."""
        logger.warning(f"Using default job analysis due to processing error: {error_message}")
        return {
            "strategic_overview": {
                "summary": "There was an error while generating your personalized analysis. Please try again.",
                "your_key_opportunity": "Please ensure the job link is active and publicly accessible."
            },
            "your_core_strengths_for_this_role": [],
            "strategic_areas_for_growth": [
                {
                    "area_to_develop": "System Processing Error",
                    "severity": "Critical Gap",
                    "insight": f"The analysis could not be completed due to a system error: {error_message}",
                    "path_to_improvement": ["Please try your request again in a few moments."],
                    "youtube_search_query": "Fixing application errors"
                }
            ],
            "video_recommendations": []
        }