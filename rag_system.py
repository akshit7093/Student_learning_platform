# api_rag_system.py (Updated with Robust Parsing)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser # <-- CHANGED IMPORT
from prompts import REPORT_PROMPT, QA_PROMPT, StudentReport
import json
import os

DATA_PATH = "final_cleaned_student_data.json"

class StudentApiRAG:
    def __init__(self):
        print("Initializing API-based RAG system...")
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set!")
            
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-pro",
            google_api_key=api_key,
            temperature=0.2
        )
        
        print("Loading student data into memory...")
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            self.student_data = json.load(f)
        print(f"✅ Loaded data for {len(self.student_data)} students. System ready.")

    def _determine_sources_from_query(self, query: str) -> list:
        # This function remains the same
        query = query.lower()
        sources = []
        if any(keyword in query for keyword in ["dsa", "problem solving", "coding", "leetcode", "codeforces"]):
            sources.extend(["leetcode", "codeforces"])
        if any(keyword in query for keyword in ["project", "experience", "github", "code", "repository"]):
            sources.append("github")
        if any(keyword in query for keyword in ["academic", "grade", "gpa", "cgpa", "subject", "marks", "semester"]):
            sources.append("academic_profile")
        
        return list(set(sources)) if sources else ["academic_profile", "coding_profiles"]

    def generate_structured_report(self, enrollment_no: str) -> dict:
        """Generates the full, structured student report via API call."""
        print(f"Generating full report for {enrollment_no}...")
        
        student_profile = self.student_data.get(enrollment_no)
        if not student_profile:
            return {"error": "No data found for this student."}
            
        context = json.dumps(student_profile, indent=2)
        
        # --- PARSING FIX ---
        # Use JsonOutputParser, which is more robust for this task.
        # We pass the Pydantic model to it so it knows what to expect.
        parser = JsonOutputParser(pydantic_object=StudentReport)
        
        # Update the prompt to include the parser's format instructions
        prompt_with_format = REPORT_PROMPT.partial(
            format_instructions=parser.get_format_instructions()
        )
        
        # Use the new LangChain Expression Language (LCEL) syntax
        chain = prompt_with_format | self.llm | parser
        
        try:
            # The output from this chain will be a dictionary that matches the Pydantic model
            report_dict = chain.invoke({"context": context})
            return report_dict
        except Exception as e:
            print(f"Error invoking LLM or parsing output: {e}")
            return {"error": "Failed to generate a valid report from the LLM."}

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

        if not targeted_context:
            return "I could not find any relevant information in this student's profile to answer that question."

        context_str = json.dumps(targeted_context, indent=2)
        
        chain = QA_PROMPT | self.llm
        result = chain.invoke({"context": context_str, "question": query})
        
        return result.content