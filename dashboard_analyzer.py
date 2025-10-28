# dashboard_analyzer.py
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# --- Constants for Scoring and Analysis ---
# These can be tweaked to adjust the analysis logic. They are data-agnostic.
THRESHOLDS = {
    'CGPA_EXCELLENT': 8.5,
    'CGPA_GOOD': 7.5,
    'LEETCODE_TOTAL_HIGH': 200,
    'LEETCODE_TOTAL_MEDIUM': 100,
    'GITHUB_STARS_HIGH': 10,
    'GITHUB_REPOS_HIGH': 20,
}

WEIGHTS = {
    'LEETCODE_EASY': 0.2,
    'LEETCODE_MEDIUM': 1.0,
    'LEETCODE_HARD': 2.5,
    'GITHUB_STARS': 2.0,
    'GITHUB_FORKS': 3.0,
    'GITHUB_REPOS': 0.5,
}

def get_dashboard_metrics(student_data: dict) -> dict:
    """
    Performs a fully data-driven, advanced analysis of a student's raw JSON data
    to extract a rich set of metrics for the dashboard without any hardcoded assumptions.

    Args:
        student_data (dict): The dictionary containing all data for one student.

    Returns:
        dict: A deeply nested dictionary with structured dashboard metrics and insights.
    """
    if not student_data:
        return {"error": "No student data provided."}

    # --- Perform analysis on different sections of the profile ---
    academics = _analyze_academics(student_data.get("academic_profile", {}))
    leetcode = _analyze_leetcode(student_data.get("coding_profiles", {}).get("leetcode", {}))
    github = _analyze_github(student_data.get("coding_profiles", {}).get("github", {}))
    skills = _extract_skills(student_data)
    completeness = _calculate_profile_completeness(student_data)
    
    # --- Synthesize overall insights from the analyses ---
    archetype = _determine_student_archetype(skills, leetcode, github)

    # --- Assemble the final, comprehensive metrics object ---
    return {
        "overall_summary": {
            "student_archetype": archetype,
            "profile_completeness": completeness
        },
        "academics": academics,
        "coding_profiles": {
            "leetcode": leetcode,
            "github": github
        },
        "skills_distribution": skills,
    }

def _analyze_academics(academic_data: dict) -> dict:
    """
    Analyzes academic performance dynamically from the data provided.
    Includes trajectory, overall subject performance, and detailed semester overviews.
    """
    cgpa = academic_data.get("overall_cgpa", 0)
    
    # Qualitative Rating based on CGPA
    if cgpa >= THRESHOLDS['CGPA_EXCELLENT']: rating = "Excellent"
    elif cgpa >= THRESHOLDS['CGPA_GOOD']: rating = "Good"
    else: rating = "Needs Improvement"

    # Academic Trajectory based on SGPA trend
    sgpa_list = [sem.get("sgpa", 0) for sem in academic_data.get("semester_performance", [])]
    trajectory = "Stable"
    if len(sgpa_list) > 2:
        first_half_avg = sum(sgpa_list[:len(sgpa_list)//2]) / (len(sgpa_list)//2)
        second_half_avg = sum(sgpa_list[len(sgpa_list)//2:]) / (len(sgpa_list) - len(sgpa_list)//2)
        if second_half_avg > first_half_avg + 0.2: trajectory = "Improving"
        elif second_half_avg < first_half_avg - 0.2: trajectory = "Declining"

    # --- Detailed Semester Overviews and Overall Subject Analysis ---
    all_subjects_overall = []
    semester_overviews = []

    for semester_info in academic_data.get("semester_performance", []):
        semester_subjects = []
        high_grades_count = 0
        
        for subject_info in semester_info.get("subjects", []):
            subject_record = {
                "name": subject_info.get("subject"),
                "marks": subject_info.get("marks", 0)
            }
            semester_subjects.append(subject_record)
            all_subjects_overall.append(subject_record)
            
            if subject_info.get("grade") in ['O', 'A+']:
                high_grades_count += 1
        
        if semester_subjects:
            semester_subjects.sort(key=lambda x: x['marks']) # Sort by marks ascending
            
            semester_overviews.append({
                "semester_number": semester_info.get("semester"),
                "sgpa": semester_info.get("sgpa"),
                "percentage": semester_info.get("percentage"),
                "top_subject": semester_subjects[-1], # Last item is highest
                "bottom_subject": semester_subjects[0], # First item is lowest
                "high_grades_count": high_grades_count
            })

    # Determine overall subject strengths and weaknesses from all semesters
    overall_strengths = []
    overall_weaknesses = []
    if all_subjects_overall:
        all_subjects_overall.sort(key=lambda x: x['marks'], reverse=True) # Sort descending
        overall_strengths = all_subjects_overall[:3] # Top 3 overall
        overall_weaknesses = all_subjects_overall[-3:] # Bottom 3 overall

    return {
        "cgpa": cgpa,
        "rating": rating,
        "trajectory": trajectory,
        "overall_subject_strengths": overall_strengths,
        "overall_subject_weaknesses": overall_weaknesses,
        "semester_overviews": semester_overviews
    }

# --- The following functions are already fully data-driven and remain unchanged ---

def _analyze_leetcode(leetcode_data: dict) -> dict:
    """Performs a nuanced analysis of LeetCode performance."""
    if not leetcode_data: return {"rating": "Not Available", "score": 0, "total_solved": 0}
    total_solved = leetcode_data.get("totalSolved", 0)
    try:
        easy = int(leetcode_data.get("problemsByDifficulty", {}).get("Easy", "0/0").split('/')[0])
        medium = int(leetcode_data.get("problemsByDifficulty", {}).get("Medium", "0/0").split('/')[0])
        hard = int(leetcode_data.get("problemsByDifficulty", {}).get("Hard", "0/0").split('/')[0])
    except (ValueError, IndexError): easy, medium, hard = 0, 0, 0
    raw_score = (easy * WEIGHTS['LEETCODE_EASY'] + medium * WEIGHTS['LEETCODE_MEDIUM'] + hard * WEIGHTS['LEETCODE_HARD'])
    target_score = (150 * WEIGHTS['LEETCODE_EASY'] + 100 * WEIGHTS['LEETCODE_MEDIUM'] + 30 * WEIGHTS['LEETCODE_HARD'])
    normalized_score = round((raw_score / target_score) * 10, 1) if target_score > 0 else 0
    final_score = min(normalized_score, 10.0)
    rating = "Beginner"
    if hard > 10 or medium > 50: rating = "Advanced Problem Solver"
    elif medium > 25 or total_solved > THRESHOLDS['LEETCODE_TOTAL_HIGH']: rating = "Active Competitor"
    elif total_solved > THRESHOLDS['LEETCODE_TOTAL_MEDIUM']: rating = "Consistent Learner"
    return {"rating": rating, "score": final_score, "total_solved": total_solved, "difficulty_breakdown": {"easy": easy, "medium": medium, "hard": hard}}

def _analyze_github(github_data: dict) -> dict:
    """Analyzes GitHub profile for activity, impact, and tech stack."""
    if not github_data: return {"rating": "Not Available", "activity_level": "Unknown"}
    stats, repos = github_data.get("stats", {}), github_data.get("top_repositories", [])
    activity_level = "Low"
    if repos:
        try:
            latest_push = max(datetime.strptime(repo['last_pushed'], "%Y-%m-%d") for repo in repos if repo.get('last_pushed'))
            if (datetime.now() - latest_push).days < 7: activity_level = "Very Active"
            elif (datetime.now() - latest_push).days < 30: activity_level = "Active"
            elif (datetime.now() - latest_push).days < 90: activity_level = "Inactive"
        except (ValueError, TypeError): pass
    impact_score = sum(repo.get('stars', 0) * WEIGHTS['GITHUB_STARS'] + repo.get('forks', 0) * WEIGHTS['GITHUB_FORKS'] for repo in repos)
    top_languages = list(dict.fromkeys([repo.get("language") for repo in repos if repo.get("language")]))[:3]
    rating = "Needs Development"
    if impact_score > 50 or stats.get('public_repos', 0) > THRESHOLDS['GITHUB_REPOS_HIGH']: rating = "Strong Profile"
    elif activity_level in ["Very Active", "Active"] or stats.get('public_repos', 0) > 10: rating = "Good Profile"
    return {"rating": rating, "activity_level": activity_level, "top_languages": top_languages, "stats": stats}

def _extract_skills(student_data: dict) -> list:
    """Extracts, combines, and cleans a list of key skills."""
    resume_skills = student_data.get("resume", {}).get("key_skills", [])
    leetcode_skills = [item.get("skill") for item in student_data.get("coding_profiles", {}).get("leetcode", {}).get("topSkillsSummary", [])]
    normalized_resume = [s.strip().title() for s in resume_skills]
    normalized_leetcode = [s.strip().title() for s in leetcode_skills]
    return list(dict.fromkeys(normalized_resume + normalized_leetcode))

def _calculate_profile_completeness(student_data: dict) -> dict:
    """Scores the profile based on the presence of key data points."""
    checks = {
        "Academics": bool(student_data.get("academic_profile", {}).get("semester_performance")),
        "Resume": bool(student_data.get("resume", {}).get("key_skills")),
        "LeetCode": bool(student_data.get("coding_profiles", {}).get("leetcode")),
        "GitHub": bool(student_data.get("coding_profiles", {}).get("github")),
        "Codeforces": bool(student_data.get("coding_profiles", {}).get("codeforces"))
    }
    score = int((sum(checks.values()) / len(checks)) * 100)
    return {"score_percentage": score, "missing_sections": [key for key, value in checks.items() if not value]}

def _determine_student_archetype(skills: list, leetcode_metrics: dict, github_metrics: dict) -> list:
    """Generates dynamic tags based on analyzed metrics."""
    archetypes = []
    skills_lower = {s.lower() for s in skills}
    if any(kw in skills_lower for kw in ["tensorflow", "pytorch", "ai", "machine learning", "nlp", "computer vision"]): archetypes.append("AI/ML Enthusiast")
    if any(kw in skills_lower for kw in ["react", "node", "flask", "django", "backend", "frontend"]): archetypes.append("Web Developer")
    if leetcode_metrics.get("rating") in ["Advanced Problem Solver", "Active Competitor"]: archetypes.append("Competitive Programmer")
    if any(kw in skills_lower for kw in ["aws", "google cloud", "docker", "kubernetes"]): archetypes.append("Cloud & DevOps Oriented")
    return archetypes if archetypes else ["Generalist"]

# --- Testing Block ---
if __name__ == '__main__':
    print("Testing advanced, fully data-driven dashboard_analyzer.py...")
    try:
        with open('final_cleaned_student_data.json', 'r', encoding='utf-8') as f:
            full_data = json.load(f)
        sample_enrollment = "35214811922"
        student_sample = full_data.get(sample_enrollment)
        if student_sample:
            metrics = get_dashboard_metrics(student_sample)
            print("\n--- Generated Advanced Metrics ---")
            print(json.dumps(metrics, indent=4))
        else:
            print(f"Error: Student with enrollment '{sample_enrollment}' not found.")
    except FileNotFoundError:
        print("Error: `final_cleaned_student_data.json` not found.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during testing: {e}", exc_info=True)