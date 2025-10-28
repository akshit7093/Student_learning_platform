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
@app.route('/api/students', methods=['GET'])
def get_students_list():
    # Dummy implementation or integrate with your student data
    # This is just an example, replace with actual logic
    return jsonify([{"enrollment_no": "35214811922", "name": "Akshit Sharma"}])

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
        # Get the enrollment number from the request data
        enrollment_no = data.get('enrollment_no')

        if not job_application_link or not enrollment_no:
            logger.warning("Missing 'job_application_link' or 'enrollment_no' in job analysis request data.")
            return jsonify({
                'success': False,
                'error': 'Job application link and enrollment number are required.'
            }), 400

        logger.info(f"Initiating job application analysis for link: {job_application_link} and student: {enrollment_no}")
        # Call the analyze_job_application method on the RAG system instance with both arguments
        result = app.rag_system.analyze_job_application(job_application_link, enrollment_no)

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
@app.route('/api/ask', methods=['POST'])
def answer_question_route():
    """Endpoint for answering questions about a student"""
    # Check if RAG system was initialized successfully
    if not app.rag_system:
        logger.error("RAG System not initialized. Cannot answer question.")
        return jsonify({
            'success': False,
            'error': 'Internal server error: Question answering system not available.'
        }), 500

    try:
        data = request.get_json()
        if not data:
            logger.warning("No JSON data received in question request.")
            return jsonify({
                'success': False,
                'error': 'Invalid request: No JSON data provided.'
            }), 400

        enrollment_no = data.get('enrollment_no')
        question = data.get('question')

        if not enrollment_no or not question:
            logger.warning("Missing 'enrollment_no' or 'question' in request data.")
            return jsonify({
                'success': False,
                'error': 'Enrollment number and question are required.'
            }), 400

        logger.info(f"Answering question for enrollment {enrollment_no}: {question}")
        # Call the answer_question method on the RAG system instance
        answer = app.rag_system.answer_question(question, enrollment_no)

        logger.info("Question answered successfully.")
        return jsonify({
            'success': True,
            'answer': answer
        })

    except Exception as e:
        logger.error(f"Error in question answering route: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to answer question due to an internal server error.'
        }), 500

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
             return jsonify(report_data), 404 # Or appropriate error code
        return jsonify(report_data)
    except Exception as e:
        logger.error(f"Error generating report for {enrollment_no}: {e}", exc_info=True)
        return jsonify({'error': 'Failed to generate report.'}), 500


if __name__ == '__main__':
    # Run the app
    
    app.run(host='0.0.0.0', port=5000, debug=True) # Adjust host/port/debug as needed