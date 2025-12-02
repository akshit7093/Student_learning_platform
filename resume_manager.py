import json
import os
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ResumeManager:
    def __init__(self, history_file='generated_resumes.json'):
        self.history_file = os.path.join(os.path.dirname(__file__), history_file)
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not os.path.exists(self.history_file):
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    def _load_history(self):
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save_history(self, history):
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2)

    def get_student_resumes(self, enrollment_no):
        history = self._load_history()
        # Return list of resumes, sorted by timestamp (newest first)
        resumes = history.get(str(enrollment_no), [])
        resumes.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return resumes

    def save_resume(self, enrollment_no, job_role, company, resume_content):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no not in history:
            history[enrollment_no] = []

        resume_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Create a title like "Software Engineer at Google"
        title = f"{job_role} at {company}"

        new_resume = {
            'id': resume_id,
            'title': title,
            'company': company,
            'role': job_role,
            'timestamp': timestamp,
            'content': resume_content # This will be the Markdown/HTML content
        }

        history[enrollment_no].append(new_resume)
        self._save_history(history)
        return new_resume

    def get_resume(self, enrollment_no, resume_id):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no in history:
            for resume in history[enrollment_no]:
                if resume['id'] == resume_id:
                    return resume
        return None
