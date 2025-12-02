import json
import os
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ReportManager:
    def __init__(self, history_file='saved_reports.json'):
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

    def get_student_reports(self, enrollment_no):
        history = self._load_history()
        # Return list of reports, sorted by timestamp (newest first)
        reports = history.get(str(enrollment_no), [])
        reports.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return reports

    def save_report(self, enrollment_no, report_data):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no not in history:
            history[enrollment_no] = []

        report_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        # Create a summary title (e.g., "Report - Dec 03, 2025")
        date_str = datetime.now().strftime("%b %d, %Y")
        title = f"Report - {date_str}"

        new_report = {
            'id': report_id,
            'title': title,
            'timestamp': timestamp,
            'data': report_data
        }

        history[enrollment_no].append(new_report)
        self._save_history(history)
        return new_report

    def get_report(self, enrollment_no, report_id):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no in history:
            for report in history[enrollment_no]:
                if report['id'] == report_id:
                    return report
        return None
