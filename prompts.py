# prompts.py (Updated with resume analysis and YouTube recommendations)

from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

# --- Pydantic Models for Structured Report Output ---

class ScoreMetric(BaseModel):
    parameter: str = Field(description="The name of the parameter being scored, e.g., 'Problem Volume'.")
    score: int = Field(description="The student's score on a scale of 1-10.")
    justification: str = Field(description="A brief, data-driven justification for the assigned score.")

class StrengthWeakness(BaseModel):
    strengths: List[str] = Field(description="A list of the student's key strengths, citing specific data points.")
    weaknesses: List[str] = Field(description="A list of areas for improvement, citing specific data points.")

class Recommendation(BaseModel):
    recommendations: List[str] = Field(description="A list of 2-3 actionable, personalized recommendations for the student.")

class ResumeAnalysis(BaseModel):
    summary: str = Field(description="Concise summary of the resume content")
    key_skills: List[str] = Field(description="Key technical and soft skills identified from the resume")
    professional_links: List[str] = Field(description="Professional links found in the resume (GitHub, LinkedIn, portfolio)")
    missing_elements: List[str] = Field(description="Important elements missing from the resume")

class YouTubeRecommendation(BaseModel):
    title: str = Field(description="Title of the YouTube video")
    url: str = Field(description="URL of the YouTube video")
    reason: str = Field(description="Why this video is recommended for the student")
    embed_url: str = Field(description="Embed URL for the video (convert standard URL to embed format)")

class StudentReport(BaseModel):
    """The complete structured report for a student."""
    overall_summary: str = Field(description="A one-paragraph 'HR Summary' of the student's overall profile.")
    detailed_scores: List[ScoreMetric] = Field(description="A list of scores for each parameter.")
    analysis: StrengthWeakness = Field(description="An analysis of strengths and weaknesses.")
    actionable_advice: Recommendation = Field(description="Personalized advice for improvement.")
    resume_analysis: ResumeAnalysis = Field(description="Analysis of the student's resume")
    youtube_recommendations: List[YouTubeRecommendation] = Field(description="Recommended YouTube videos for improvement")


# --- Prompt Templates ---

REPORT_PROMPT_TEMPLATE = """
You are an expert AI career coach. Your task is to generate a comprehensive performance report for a student based on the provided JSON data, including their resume analysis.

**Student Profile Data:**
{context}

**Your Instructions:**
1. Analyze all provided data thoroughly, including the resume analysis section.
2. Adhere strictly to the scoring rubric below to evaluate the student.
3. For YouTube recommendations, provide 3-5 highly relevant videos that address the student's specific weaknesses or enhance their strengths.
   - Convert standard YouTube URLs to embed format (replace 'watch?v=' with 'embed/')
   - Focus on high-quality, educational content from reputable channels
   - Prioritize recent videos (within last 2 years) for technical topics
4. You MUST output a single, valid JSON object that conforms to the schema provided. 
5. DO NOT output any text, explanation, or markdown before or after the JSON object. Your entire response must be only the JSON.

**Scoring Rubric:**
- **Problem Volume (20%):** Score based on total problems solved (LeetCode, Codeforces).
- **Problem Distribution (25%):** Score based on the ratio of Easy/Medium/Hard problems and problem ratings.
- **Acceptance Rate (10%):** Score based on LeetCode acceptance rate.
- **Consistency and Activity (10%):** Score based on streaks, active days, and recent commit/submission dates.
- **Topic Coverage/Depth (25%):** Score based on the breadth of DSA topics and project diversity.
- **Programming Language Skill (5%):** Score based on primary language and versatility.
- **Recent Activity (5%):** Score based on recent submissions and commits.

**Resume Analysis Guidelines:**
- Extract key skills mentioned in the resume
- Identify professional links (GitHub, LinkedIn, portfolio)
- Note any important elements missing (projects, education details, etc.)
- Compare resume content with coding profiles for consistency

**YouTube Recommendation Guidelines:**
- Match videos to specific weaknesses identified in the analysis
- Include videos that build on existing strengths
- Provide clear reasoning for each recommendation
- Format URLs correctly for embedding (https://www.youtube.com/embed/VIDEO_ID)

**Output Format Instructions:**
{format_instructions}
"""

QA_PROMPT_TEMPLATE = """
You are a helpful AI assistant for analyzing a student's profile. Answer the following question based *only* on the provided context.
If the context does not contain the answer, state that the information is not available in the student's profile. Do not make up information.

**Context:**
{context}

**Question:**
{question}

**Answer:**
"""

REPORT_PROMPT = PromptTemplate(
    template=REPORT_PROMPT_TEMPLATE,
    input_variables=["context", "format_instructions"],
)

QA_PROMPT = PromptTemplate(
    template=QA_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)