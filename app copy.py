# app.py
from flask import Flask, render_template, jsonify, request
from rag_system import StudentApiRAG
import json

app = Flask(__name__)

# Initialize the RAG system once when the application starts.
# This is efficient as the data is loaded into memory only once.
print("Initializing Student Analysis System...")
rag_system = StudentApiRAG()
print("System Initialized Successfully.")

# --- API Endpoints ---

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('final.html')

@app.route('/api/students', methods=['GET'])
def get_students():
    """Returns a list of all available students to populate the dropdown."""
    student_list = [
        {"enrollment_no": eno, "name": data.get("name", "Unknown")}
        for eno, data in rag_system.student_data.items()
    ]
    return jsonify(student_list)

@app.route('/api/report/<enrollment_no>', methods=['GET'])
def get_report(enrollment_no):
    """Generates and returns the full structured report for a student."""
    if not enrollment_no:
        return jsonify({"error": "Enrollment number is required."}), 400
    
    report = rag_system.generate_structured_report(enrollment_no)
    
    if "error" in report:
        return jsonify(report), 500
        
    return jsonify(report)

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Handles a chatbot question and returns the AI's answer."""
    data = request.json
    enrollment_no = data.get('enrollment_no')
    question = data.get('question')

    if not all([enrollment_no, question]):
        return jsonify({"error": "Enrollment number and question are required."}), 400

    answer = rag_system.answer_question(question, enrollment_no)
    return jsonify({"answer": answer})

if __name__ == '__main__':
    # Use host='0.0.0.0' to make it accessible from your local network
    app.run(host='0.0.0.0', port=5000, debug=True)