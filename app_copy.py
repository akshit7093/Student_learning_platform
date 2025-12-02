# app_copy.py (or whatever your main Flask app file is named)

from flask import Flask, jsonify, request, render_template, redirect, url_for
import os
# Import the RAG system class
from rag_system import StudentApiRAG
import logging # Import logging module

# --- Configure logging ---
# It's generally good practice to configure logging early
logging.basicConfig(level=logging.INFO) # Adjust level as needed (DEBUG, INFO, WARNING, ERROR)
logger = logging.getLogger(__name__) # Create a logger for this module

# --- Initialize Flask App ---
app = Flask(__name__,
            static_folder='static',  # Directory for CSS/JS files
            template_folder='templates')  # Directory for HTML files

# Ensure static and templates directories exist
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# --- Initialize the RAG System ---
# This is the crucial part: create the instance and attach it to the app object
# Make sure the GOOGLE_API_KEY environment variable is set
try:
    app.rag_system = StudentApiRAG() # <-- This line is key
    logger.info("RAG System initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize RAG System: {e}")
    # Depending on your needs, you might want to exit here or disable related features
    app.rag_system = None # Or handle the error appropriately


# --- Define Routes ---

@app.route('/')
def home():
    return redirect(url_for('test_frontend'))

@app.route('/test') # Assuming this is your frontend route
def test_frontend():
    return render_template('final.html') # Make sure index.html exists in templates/

# --- Example route for students (adjust as needed) ---
import json
import os

@app.route('/api/students', methods=['GET'])
def get_students_list():
    enrollment_no = request.args.get('enrollment_no')  # Optional query param

    # Path to your JSON file
    json_path = os.path.join(os.path.dirname(__file__), 'final_cleaned_student_data.json')
    
    if not os.path.exists(json_path):
        logger.error("Student data file not found.")
        return jsonify({'error': 'Student data file not found.'}), 404

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            all_students = json.load(f)

        if enrollment_no:
            # Return specific student if enrollment_no is provided
            student = all_students.get(enrollment_no)
            if not student:
                logger.warning(f"Student with enrollment {enrollment_no} not found.")
                return jsonify({'error': 'Student not found.'}), 404
            return jsonify(student)
        else:
            # Return all students (values only, not keys)
            print(all_students.values())
            return jsonify(list(all_students.values()))

    except Exception as e:
        logger.error(f"Error reading student data: {e}", exc_info=True)
        return jsonify({'error': 'Failed to load student data.'}), 500

@app.route('/favicon.ico')
def favicon():
    return '', 204

# --- Job Analysis Route (Corrected) ---
@app.route('/api/job-analysis', methods=['POST'])
def analyze_job_application_route():
    """Endpoint for job application analysis"""
    # Check if RAG system was initialized successfully
    if not app.rag_system:
        logger.error("RAG System not initialized. Cannot perform job analysis.")
        return jsonify({
            'success': False,
            'error': 'Internal server error: Analysis system not available.'
        }), 500

    try:
        data = request.get_json()
        if not data:
             logger.warning("No JSON data received in job analysis request.")
             return jsonify({
                'success': False,
                'error': 'Invalid request: No JSON data provided.'
            }), 400

        job_application_link = data.get('job_application_link')
        job_description = data.get('job_description')
        # Get the enrollment number from the request data
        enrollment_no = data.get('enrollment_no')

        # Use job_description if link is not provided
        job_input = job_application_link or job_description

        if not job_input or not enrollment_no:
            logger.warning("Missing 'job_application_link'/'job_description' or 'enrollment_no' in job analysis request data.")
            return jsonify({
                'success': False,
                'error': 'Job application link/description and enrollment number are required.'
            }), 400

        logger.info(f"Initiating job application analysis for input: {job_input[:50]}... and student: {enrollment_no}")
        # Call the analyze_job_application method on the RAG system instance with both arguments
        result = app.rag_system.analyze_job_application(job_input, enrollment_no)

        if result.get("error"):
            logger.warning(f"Job analysis reported an error: {result['error']}")
            return jsonify({
                'success': False,
                'error': result["error"]
            }), 400 # Or maybe 500 if it's an internal processing error?

        logger.info("Job application analysis completed successfully.")
        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        # Now 'logger' is defined and can be used
        logger.error(f"Error in job analysis route: {e}", exc_info=True) # exc_info=True adds traceback
        return jsonify({
            'success': False,
            'error': 'Failed to analyze job application due to an internal server error.'
        }), 500


# Add this route to your app_copy.py
# Import ChatManager
from chat_manager import ChatManager

# Initialize Chat Manager
try:
    app.chat_manager = ChatManager()
    logger.info("Chat Manager initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Chat Manager: {e}")
    app.chat_manager = None

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Endpoint for asking questions to the RAG system with persistence."""
    if not app.rag_system:
        logger.error("RAG System not initialized. Cannot answer question.")
        return jsonify({
            'success': False,
            'error': 'Internal server error: Question answering system not available.'
        }), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid request: No JSON data provided.'}), 400

        enrollment_no = data.get('enrollment_no')
        question = data.get('question')
        session_id = data.get('session_id') # Optional session ID

        if not enrollment_no or not question:
            return jsonify({'success': False, 'error': 'Enrollment number and question are required.'}), 400

        # 1. Handle Session & User Message
        if app.chat_manager:
            if not session_id:
                # Create new session if none provided
                session = app.chat_manager.create_session(enrollment_no, question)
                session_id = session['id']
                logger.info(f"Created new chat session {session_id} for {enrollment_no}")
            
            # Save User Message
            app.chat_manager.add_message(enrollment_no, session_id, 'user', question)

        # 2. Get Answer from RAG
        logger.info(f"Answering question for enrollment {enrollment_no}: {question}")
        answer = app.rag_system.answer_question(question, enrollment_no)

        # 3. Save AI Response
        if app.chat_manager and session_id:
            app.chat_manager.add_message(enrollment_no, session_id, 'ai', answer)

        logger.info("Question answered successfully.")
        return jsonify({
            'success': True,
            'answer': answer,
            'session_id': session_id
        })

    except Exception as e:
        logger.error(f"Error in question answering route: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to answer question due to an internal server error.'
        }), 500

@app.route('/api/chat/history/<enrollment_no>', methods=['GET'])
def get_chat_history(enrollment_no):
    """Endpoint to get chat history for a student."""
    if not app.chat_manager:
        return jsonify({'error': 'Chat system not available'}), 500
    
    try:
        history = app.chat_manager.get_student_history(enrollment_no)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return jsonify({'error': 'Failed to fetch chat history'}), 500

# --- Route for getting student-specific dashboard metrics ---
@app.route('/api/dashboard/metrics/<enrollment_no>', methods=['GET'])
def get_student_dashboard_metrics(enrollment_no: str):
    """Endpoint for getting detailed dashboard metrics for a specific student."""
    if not app.rag_system:
        logger.error("RAG System not initialized. Cannot get dashboard metrics.")
        return jsonify({'error': 'Internal server error: Dashboard system not available.'}), 500

    try:
        logger.info(f"Fetching dashboard metrics for enrollment: {enrollment_no}")
        # Call the new get_student_dashboard_metrics method on the RAG system instance
        metrics_data = app.rag_system.get_student_dashboard_metrics(enrollment_no)

        if metrics_data.get("error"):
             logger.warning(f"Dashboard metrics error for {enrollment_no}: {metrics_data['error']}")
             return jsonify(metrics_data), 404 # Or appropriate error code
        return jsonify(metrics_data)
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics for {enrollment_no}: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch dashboard metrics.'}), 500

# --- Other routes (e.g., /api/report/<enrollment_no>, /api/ask, etc.) ---
# Make sure to use app.rag_system.<method_name>() for calling RAG methods
# Example placeholder for report generation:
# Import ReportManager and ResumeManager
from report_manager import ReportManager
from resume_manager import ResumeManager

# Initialize Report Manager
try:
    app.report_manager = ReportManager()
    logger.info("Report Manager initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Report Manager: {e}")
    app.report_manager = None

# Initialize Resume Manager
try:
    app.resume_manager = ResumeManager()
    logger.info("Resume Manager initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Resume Manager: {e}")
    app.resume_manager = None

# ... (existing routes) ...

@app.route('/api/report/<enrollment_no>', methods=['GET'])
def get_student_report(enrollment_no: str):
    if not app.rag_system:
        logger.error("RAG System not initialized. Cannot generate report.")
        return jsonify({'error': 'Internal server error: Report system not available.'}), 500

    try:
        logger.info(f"Generating report for enrollment: {enrollment_no}")
        report_data = app.rag_system.generate_structured_report(enrollment_no)
        
        if report_data.get("error"):
             logger.warning(f"Report generation error for {enrollment_no}: {report_data['error']}")
             return jsonify(report_data), 500
        
        # Save the generated report
        if app.report_manager:
            try:
                app.report_manager.save_report(enrollment_no, report_data)
                logger.info(f"Report saved for {enrollment_no}")
            except Exception as e:
                logger.error(f"Failed to save report: {e}")

        return jsonify(report_data)
    except Exception as e:
        logger.error(f"Error generating report for {enrollment_no}: {e}",exc_info=True)
        return jsonify({'error': 'Failed to generate report.'}), 500

@app.route('/api/reports/history/<enrollment_no>', methods=['GET'])
def get_report_history(enrollment_no):
    """Endpoint to get report history for a student."""
    if not app.report_manager:
        return jsonify({'error': 'Report system not available'}), 500
    
    try:
        history = app.report_manager.get_student_reports(enrollment_no)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error fetching report history: {e}")
        return jsonify({'error': 'Failed to fetch report history'}), 500

@app.route('/api/report/load/<enrollment_no>/<report_id>', methods=['GET'])
def load_saved_report(enrollment_no, report_id):
    """Endpoint to load a specific saved report."""
    if not app.report_manager:
        return jsonify({'error': 'Report system not available'}), 500
    
    try:
        report = app.report_manager.get_report(enrollment_no, report_id)
        if report:
            return jsonify(report['data'])
        return jsonify({'error': 'Report not found'}), 404
    except Exception as e:
        logger.error(f"Error loading saved report: {e}")
        return jsonify({'error': 'Failed to load report'}), 500

@app.route('/api/resume/generate', methods=['POST'])
def generate_resume():
    """Endpoint to generate a tailored resume."""
    if not app.rag_system:
        return jsonify({'error': 'RAG system not available'}), 500
    
    try:
        data = request.json
        enrollment_no = data.get('enrollment_no')
        job_description = data.get('job_description')
        company = data.get('company', 'Unknown Company')
        role = data.get('role', 'Unknown Role')

        if not enrollment_no or not job_description:
            return jsonify({'error': 'Missing enrollment_no or job_description'}), 400

        logger.info(f"Generating tailored resume for {enrollment_no} at {company}")
        resume_content = app.rag_system.generate_tailored_resume(enrollment_no, job_description)
        
        if resume_content.startswith("Error"):
             return jsonify({'error': resume_content}), 500

        # Save the generated resume
        if app.resume_manager:
            try:
                app.resume_manager.save_resume(enrollment_no, role, company, resume_content)
                logger.info(f"Resume saved for {enrollment_no}")
            except Exception as e:
                logger.error(f"Failed to save resume: {e}")

        return jsonify({'success': True, 'resume': resume_content})
    except Exception as e:
        logger.error(f"Error generating resume: {e}", exc_info=True)
        return jsonify({'error': 'Failed to generate resume'}), 500

@app.route('/api/resume/history/<enrollment_no>', methods=['GET'])
def get_resume_history(enrollment_no):
    """Endpoint to get resume history for a student."""
    if not app.resume_manager:
        return jsonify({'error': 'Resume system not available'}), 500
    
    try:
        history = app.resume_manager.get_student_resumes(enrollment_no)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error fetching resume history: {e}")
        return jsonify({'error': 'Failed to fetch resume history'}), 500

@app.route('/api/dashboard/students', methods=['GET'])
def get_dashboard_students():
    """Endpoint to get aggregated student data for the dashboard."""
    if not app.rag_system:
        return jsonify({'error': 'RAG system not available'}), 500

    try:
        # 1. Get base student summaries
        students = app.rag_system.get_all_students_summary()
        
        total_cgpa = 0
        valid_cgpa_count = 0

        # 2. Augment with Report and Resume data
        for student in students:
            enrollment_no = student['enrollment_no']
            
            # Report Status
            report_status = 'Pending'
            if app.report_manager:
                reports = app.report_manager.get_student_reports(enrollment_no)
                if reports:
                    report_status = 'Generated'
            student['report_status'] = report_status

            # Resume Count
            resume_count = 0
            if app.resume_manager:
                resumes = app.resume_manager.get_student_resumes(enrollment_no)
                resume_count = len(resumes)
            student['resume_count'] = resume_count

            # CGPA Calculation
            try:
                cgpa = float(student['cgpa'])
                total_cgpa += cgpa
                valid_cgpa_count += 1
            except (ValueError, TypeError):
                pass

        # 3. Calculate Class Statistics
        class_average = 0
        if valid_cgpa_count > 0:
            class_average = round(total_cgpa / valid_cgpa_count, 2)

        return jsonify({
            'total_students': len(students),
            'class_average_cgpa': class_average,
            'students': students
        })

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}", exc_info=True)
        return jsonify({'error': 'Failed to fetch dashboard data'}), 500
if __name__ == '__main__':
    # Run the app
    
    app.run(host='0.0.0.0', port=5000, debug=True) # Adjust host/port/debug as needed