import json
import os
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChatManager:
    def __init__(self, history_file='chat_history.json'):
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

    def get_student_history(self, enrollment_no):
        history = self._load_history()
        # Return list of sessions, sorted by timestamp (newest first)
        sessions = history.get(str(enrollment_no), [])
        sessions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return sessions

    def create_session(self, enrollment_no, first_message):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no not in history:
            history[enrollment_no] = []

        # Generate title from first few words of the message
        title = ' '.join(first_message.split()[:5]) + '...'
        if len(title) > 50:
             title = title[:47] + '...'

        session_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()

        new_session = {
            'id': session_id,
            'title': title,
            'timestamp': timestamp,
            'messages': []
        }

        history[enrollment_no].append(new_session)
        self._save_history(history)
        return new_session

    def add_message(self, enrollment_no, session_id, sender, text):
        history = self._load_history()
        enrollment_no = str(enrollment_no)

        if enrollment_no not in history:
            return None

        for session in history[enrollment_no]:
            if session['id'] == session_id:
                message = {
                    'sender': sender,
                    'text': text,
                    'timestamp': datetime.now().isoformat()
                }
                session['messages'].append(message)
                # Update session timestamp to bring it to top
                session['timestamp'] = datetime.now().isoformat()
                self._save_history(history)
                return message
        
        return None

    def get_session(self, enrollment_no, session_id):
        history = self._load_history()
        enrollment_no = str(enrollment_no)
        
        if enrollment_no in history:
            for session in history[enrollment_no]:
                if session['id'] == session_id:
                    return session
        return None
