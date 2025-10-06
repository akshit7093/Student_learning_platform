# data_aggregator.py (Final Version)

import json
import os
import re
import time
from datetime import datetime

# Import the scraper functions and classes from your existing files
from github_scraper import get_github_profile
from codeforces_scraper import get_codeforces_profile
from leetcode_scraper import get_leetcode_profile
from ipu_scraper import StudentScraper

# --- Configuration ---
# Define the list of students you want to fetch data for.
STUDENTS_TO_FETCH = [
    {
        "enrollment_no": "35214811922",
        "leetcode_user": "akshitsharma7093",
        "github_user": "akshit7093",
        "codeforces_user": "akshit7093"
    }
    # Add more student dictionaries here
]

OUTPUT_FILE = 'final_cleaned_student_data.json'

# --- Advanced Cleaning and Filtering Functions ---

def clean_ipu_data(raw_data):
    """Transforms raw IPU academic data into a final, clean format."""
    if not raw_data or raw_data.get("status") != "success":
        return None

    overall = raw_data["academic_summary"]["overall_performance"]
    programme = raw_data["programme_info"]

    cleaned = {
        "institute": programme.get("institute", {}).get("insti_name"),
        "degree": programme.get("course", {}).get("course_name"),
        "branch": programme.get("branch", {}).get("branch_name"),
        "overall_cgpa": round(overall.get("cgpa", 0), 2),
        "overall_percentage": round(overall.get("percentage", 0), 2),
        "semester_performance": []
    }

    for sem_result in raw_data["academic_summary"]["semester_results"]:
        if sem_result.get("sgpa", 0) > 0:
            sem_data = {
                "semester": sem_result.get("result_no"),
                "sgpa": round(sem_result.get("sgpa", 0), 2), # Rounding SGPA
                "percentage": round(sem_result.get("percentage", 0), 2),
                "subjects": [
                    {
                        "subject": sub.get("subject_name"),
                        "grade": sub.get("grade"),
                        "marks": sub.get("total_marks")
                    }
                    for sub in sem_result.get("subject_results", [])
                ]
            }
            cleaned["semester_performance"].append(sem_data)
    
    return cleaned

def clean_leetcode_data(raw_data):
    """Cleans and filters LeetCode data, summarizing top skills."""
    if not raw_data:
        return None
        
    # Flatten all skills into a single list to find the absolute top skills
    all_skills = []
    for category in ["skillsAdvanced", "skillsIntermediate", "skillsFundamental"]:
        if raw_data.get(category):
            all_skills.extend(raw_data[category])
            
    # Sort by problems solved and take the top 15
    top_skills_sorted = sorted(all_skills, key=lambda x: x.get("problemsSolved", 0), reverse=True)
    top_skills_summary = [{"skill": s.get("tagName"), "solved": s.get("problemsSolved")} for s in top_skills_sorted[:15]]

    return {
        "username": raw_data.get("username"),
        "ranking": raw_data.get("ranking"),
        "totalSolved": raw_data.get("totalSolved"),
        "acceptanceRate": raw_data.get("acceptanceRate"),
        "problemsByDifficulty": raw_data.get("problemsSolvedByDifficulty"),
        "primaryLanguage": raw_data.get("languageStats", [{}])[0],
        "topSkillsSummary": top_skills_summary, # New summarized field
        "activity": {
            "currentStreak": raw_data.get("currentStreak"),
            "totalActiveDays": raw_data.get("totalActiveDays"),
        },
        "recentSubmissions": [
            {
                "title": sub.get("title"),
                "timestamp": datetime.fromtimestamp(int(sub.get("timestamp"))).strftime('%Y-%m-%d')
            }
            for sub in raw_data.get("recentAcSubmissions", [])
        ]
    }

def clean_github_data(raw_data):
    """Summarizes GitHub data, cleans README, and fixes pinned repo logic."""
    if not raw_data:
        return None
        
    def summarize_repo(repo):
        # Create a dictionary only with non-null values
        summary = {k: v for k, v in {
            "name": repo.get("name"),
            "description": repo.get("description"),
            "language": repo.get("language"),
            "stars": repo.get("stargazers_count"),
            "forks": repo.get("forks_count"),
            "last_pushed": repo.get("pushed_at", "")[:10] # Truncate to date
        }.items() if v is not None}
        return summary

    def summarize_pinned_repo(repo):
        # Pinned repo scraper uses a different key for the name ('repo')
        summary = {k: v for k, v in {
            "name": repo.get("repo", "").strip(), # Clean whitespace
            "description": repo.get("description"),
            "language": repo.get("language"),
            "stars": int(repo.get("stars", 0)),
            "forks": repo.get("forks")
        }.items() if v is not None and v != ''}
        return summary

    # Clean the README by removing HTML/Markdown tags, image links, etc.
    readme_text = raw_data.get("user_readme", "")
    # Remove HTML tags
    readme_text = re.sub(r'<[^>]+>', '', readme_text)
    # Remove Markdown images and badges
    readme_text = re.sub(r'!\[[^\]]*\]\([^\)]*\)', '', readme_text)
    # Remove standalone links but keep link text
    readme_text = re.sub(r'\[([^\]]+)\]\([^\)]*\)', r'\1', readme_text)
    # Clean up excessive newlines
    readme_text = re.sub(r'\n\s*\n', '\n', readme_text).strip()

    return {
        "username": raw_data.get("login"),
        "name": raw_data.get("name"),
        "bio": raw_data.get("bio", "").strip() if raw_data.get("bio") else None,
        "stats": {
            "public_repos": raw_data.get("public_repos"),
            "followers": raw_data.get("followers"),
            "following": raw_data.get("following")
        },
        "cleaned_profile_readme": readme_text,
        "pinned_repositories": [summarize_pinned_repo(r) for r in raw_data.get("pinned_repos", [])],
        "top_repositories": [summarize_repo(r) for r in raw_data.get("repos", [])]
    }

def clean_codeforces_data(raw_data):
    """Cleans Codeforces data, focusing on performance and simplifying contest history."""
    if not raw_data:
        return None
        
    profile = raw_data.get("profile", {})
    
    cleaned_contests = []
    for contest in raw_data.get("contests", []):
        cleaned_contests.append({
            "contestName": contest.get("contestName"),
            "rank": contest.get("rank"),
            "oldRating": contest.get("oldRating"),
            "newRating": contest.get("newRating"),
            "ratingChange": contest.get("newRating", 0) - contest.get("oldRating", 0)
        })

    return {
        "username": profile.get("handle"),
        "rating": profile.get("rating"),
        "maxRating": profile.get("maxRating"),
        "rank": profile.get("rank"),
        "maxRank": profile.get("maxRank"),
        "contest_history": cleaned_contests,
        "problem_solving_stats": raw_data.get("solved_stats"),
        "submissions": [
            {
                "problem_name": sub.get("problem", {}).get("name"),
                "problem_tags": sub.get("problem", {}).get("tags"),
                "problem_rating": sub.get("problem", {}).get("rating"),
                "language": sub.get("programmingLanguage"),
                "verdict": sub.get("verdict")
            }
            for sub in raw_data.get("submissions", [])
        ]
    }

# --- Main Execution Logic ---

def main():
    """Main function to fetch, clean, aggregate, and save student data."""
    ipu_scraper = StudentScraper(encryption_key="Qm9sRG9OYVphcmEK")
    all_student_data = {}

    print(f"Starting data aggregation for {len(STUDENTS_TO_FETCH)} student(s)...")

    for student in STUDENTS_TO_FETCH:
        enrollment_no = student.get("enrollment_no")
        if not enrollment_no:
            print("Skipping entry due to missing enrollment number.")
            continue

        print(f"\nFetching & Cleaning data for Enrollment No: {enrollment_no}")
        
        student_record = {
            "name": None,
            "enrollment_no": enrollment_no,
            "academic_profile": None,
            "coding_profiles": {
                "leetcode": None,
                "github": None,
                "codeforces": None,
            },
            "errors": {}
        }

        # Fetch, Clean, and Assign Data
        try:
            print("  - Processing IPU data...")
            raw_ipu_data = ipu_scraper.get_student_data(enrollment_no)
            student_record["academic_profile"] = clean_ipu_data(raw_ipu_data)
            if student_record["academic_profile"]:
                student_record["name"] = raw_ipu_data.get("student_info", {}).get("name")
                print("    > Success.")
            else:
                 raise Exception("Failed to process IPU data.")
        except Exception as e:
            student_record["errors"]["ipu"] = str(e)
            print(f"    > FAILED: {e}")

        if student.get("leetcode_user"):
            try:
                print(f"  - Processing LeetCode data for '{student['leetcode_user']}'...")
                raw_leetcode_result = get_leetcode_profile(student["leetcode_user"])
                if raw_leetcode_result.get("success"):
                    student_record["coding_profiles"]["leetcode"] = clean_leetcode_data(raw_leetcode_result["data"])
                    print("    > Success.")
                else:
                    raise Exception(raw_leetcode_result.get("error", "Unknown error"))
            except Exception as e:
                student_record["errors"]["leetcode"] = str(e)
                print(f"    > FAILED: {e}")
        
        if student.get("github_user"):
            try:
                print(f"  - Processing GitHub data for '{student['github_user']}'...")
                raw_github_result = get_github_profile(student["github_user"])
                if raw_github_result.get("success"):
                    student_record["coding_profiles"]["github"] = clean_github_data(raw_github_result["data"])
                    print("    > Success.")
                else:
                    raise Exception(raw_github_result.get("error", "Unknown error"))
            except Exception as e:
                student_record["errors"]["github"] = str(e)
                print(f"    > FAILED: {e}")

        if student.get("codeforces_user"):
            try:
                print(f"  - Processing Codeforces data for '{student['codeforces_user']}'...")
                raw_codeforces_result = get_codeforces_profile(student["codeforces_user"])
                if raw_codeforces_result.get("success"):
                    student_record["coding_profiles"]["codeforces"] = clean_codeforces_data(raw_codeforces_result["data"])
                    print("    > Success.")
                else:
                    raise Exception(raw_codeforces_result.get("error", "Unknown error"))
            except Exception as e:
                student_record["errors"]["codeforces"] = str(e)
                print(f"    > FAILED: {e}")
        
        all_student_data[enrollment_no] = student_record
        time.sleep(1)

    # Save the final cleaned & aggregated data
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_student_data, f, indent=4, ensure_ascii=False)
        print(f"\n✅ Final cleaning complete. Data saved to '{OUTPUT_FILE}'.")
    except Exception as e:
        print(f"\n❌ Error saving final JSON file: {e}")

if __name__ == "__main__":
    main()