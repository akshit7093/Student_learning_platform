from flask import Flask, jsonify, request, render_template, redirect, url_for
import os
from github_scraper import get_github_profile
from codeforces_scraper import get_codeforces_profile
from leetcode_scraper import get_leetcode_profile
from ipu_scraper import StudentScraper  # Updated to use the StudentScraper class

app = Flask(__name__, 
            static_folder='static',  # Directory for CSS/JS files
            template_folder='templates')  # Directory for HTML files

# Ensure static and templates directories exist
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Initialize the StudentScraper with the correct encryption key
ipu_scraper = StudentScraper(encryption_key="Qm9sRG9OYVphcmEK")

@app.route('/')
def home():
    return redirect(url_for('test_frontend'))

@app.route('/test')
def test_frontend():
    return render_template('indexx.html')

@app.route('/api/leetcode/<username>', methods=['GET'])
def get_leetcode_profile_route(username: str):
    # Validate username
    if not username or username.strip() == "":
        return jsonify({
            'success': False,
            'error': 'Username cannot be empty'
        }), 400
    
    result = get_leetcode_profile(username)
    
    # Handle LeetCode-specific errors
    if not result.get('success', True):
        error_msg = result.get('error', 'Unknown error')
        
        # Special handling for user not found
        if "not found" in error_msg.lower() or "not exist" in error_msg.lower():
            return jsonify({
                'success': False,
                'error': f'LeetCode user "{username}" not found'
            }), 404
            
        # Generic server error
        return jsonify({
            'success': False,
            'error': f'LeetCode API error: {error_msg}'
        }), 500
    
    return jsonify(result)

@app.route('/api/github/<username>', methods=['GET'])
def get_github_profile_route(username: str):
    if not username or username.strip() == "":
        return jsonify({'success': False, 'error': 'Username cannot be empty'}), 400
    
    result = get_github_profile(username)
    return jsonify(result)

@app.route('/api/codeforces/<username>', methods=['GET'])
def get_codeforces_profile_route(username: str):
    if not username or username.strip() == "":
        return jsonify({'success': False, 'error': 'Username cannot be empty'}), 400
    
    result = get_codeforces_profile(username)
    return jsonify(result)

@app.route('/api/ipu/<enrollment_no>', methods=['GET'])
def get_ipu_student_route(enrollment_no: str):
    """New endpoint for IPU student data"""
    if not enrollment_no or enrollment_no.strip() == "":
        return jsonify({
            'success': False,
            'error': 'Enrollment number cannot be empty'
        }), 400
    
    try:
        # Get student data using the StudentScraper
        student_data = ipu_scraper.get_student_data(enrollment_no)
        
        # Transform the data to match what the frontend expects
        if student_data.get("status") == "success":
            # Create the expected structure
            transformed_data = {
                'enrollment_no': student_data['student_info'].get('enroll_no', ''),
                'name': student_data['student_info'].get('name', ''),
                'img': student_data['student_info'].get('img', ''),
                'results': student_data['academic_summary'].get('semester_results', []),
                'programme': student_data['programme_info'].get('branch', {}),
                'institute': student_data['programme_info'].get('institute', {}),
                'subjects': [subject for result in student_data['academic_summary'].get('semester_results', []) 
                            for subject in result.get('subject_results', [])],
                'cgpa': student_data['academic_summary']['overall_performance'].get('cgpa', 0)
            }
            
            return jsonify({
                'success': True,
                'data': transformed_data
            })
        else:
            # If preprocessing failed, try to extract data from raw response
            raw_data = student_data
            if "data" in raw_data and "metadata" in raw_data:
                transformed_data = {
                    'enrollment_no': raw_data['data'].get('enroll_no', ''),
                    'name': raw_data['data'].get('name', ''),
                    'img': raw_data['data'].get('img', ''),
                    'results': raw_data['data'].get('results', []),
                    'programme': raw_data['metadata'].get('programmeData', {}).get('branch', {}),
                    'institute': raw_data['metadata'].get('instituteData', {}),
                    'subjects': [],
                    'cgpa': raw_data['data'].get('cgpa', 0)
                }
                return jsonify({
                    'success': True,
                    'data': transformed_data
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to process student data'
                }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/all', methods=['GET'])
def get_all_profiles():
    leetcode_user = request.args.get('leetcode')
    github_user = request.args.get('github')
    codeforces_user = request.args.get('codeforces')
    enrollment_no = request.args.get('enrollment')  # New parameter for IPU
    
    results = {
        'success': True,
        'data': {},
        'errors': {}
    }
    
    # Validate at least one parameter is provided
    if not any([leetcode_user, github_user, codeforces_user, enrollment_no]):
        return jsonify({
            'success': False,
            'error': 'At least one parameter (leetcode/github/codeforces/enrollment) is required'
        }), 400

    # Fetch LeetCode profile
    if leetcode_user:
        leetcode_result = get_leetcode_profile(leetcode_user)
        if leetcode_result.get('success', True):
            results['data']['leetcode'] = leetcode_result['data']
        else:
            results['success'] = False
            results['errors']['leetcode'] = leetcode_result.get('error', 'Unknown error')
    
    # Fetch GitHub profile
    if github_user:
        github_result = get_github_profile(github_user)
        if github_result.get('success', True):
            results['data']['github'] = github_result['data']
        else:
            results['success'] = False
            results['errors']['github'] = github_result.get('error', 'Unknown error')
    
    # Fetch Codeforces profile
    if codeforces_user:
        codeforces_result = get_codeforces_profile(codeforces_user)
        if codeforces_result.get('success', True):
            results['data']['codeforces'] = codeforces_result['data']
        else:
            results['success'] = False
            results['errors']['codeforces'] = codeforces_result.get('error', 'Unknown error')
    
    # Fetch IPU student data
    if enrollment_no:
        try:
            student_data = ipu_scraper.get_student_data(enrollment_no)
            
            # Transform the data to match what the frontend expects
            if student_data.get("status") == "success":
                # Create the expected structure
                transformed_data = {
                    'enrollment_no': student_data['student_info'].get('enroll_no', ''),
                    'name': student_data['student_info'].get('name', ''),
                    'img': student_data['student_info'].get('img', ''),
                    'results': student_data['academic_summary'].get('semester_results', []),
                    'programme': student_data['programme_info'].get('branch', {}),
                    'institute': student_data['programme_info'].get('institute', {}),
                    'subjects': [subject for result in student_data['academic_summary'].get('semester_results', []) 
                                for subject in result.get('subject_results', [])],
                    'cgpa': student_data['academic_summary']['overall_performance'].get('cgpa', 0)
                }
                results['data']['ipu'] = transformed_data
            else:
                # If preprocessing failed, try to extract data from raw response
                raw_data = student_data
                if "data" in raw_data and "metadata" in raw_data:
                    transformed_data = {
                        'enrollment_no': raw_data['data'].get('enroll_no', ''),
                        'name': raw_data['data'].get('name', ''),
                        'img': raw_data['data'].get('img', ''),
                        'results': raw_data['data'].get('results', []),
                        'programme': raw_data['metadata'].get('programmeData', {}).get('branch', {}),
                        'institute': raw_data['metadata'].get('instituteData', {}),
                        'subjects': [],
                        'cgpa': raw_data['data'].get('cgpa', 0)
                    }
                    results['data']['ipu'] = transformed_data
                else:
                    results['success'] = False
                    results['errors']['ipu'] = "Failed to process student data"
                    
        except Exception as e:
            results['success'] = False
            results['errors']['ipu'] = str(e)
    
    # If all requests failed, return 400/500
    if not results['data']:
        return jsonify({
            'success': False,
            'error': 'All profile requests failed',
            'details': results['errors']
        }), 400 if any("not found" in str(e).lower() for e in results['errors'].values()) else 500
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)