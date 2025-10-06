export function renderIPU(data, enrollmentNo) {
    if (!data) {
        const card = createErrorCard('IPU', enrollmentNo, 'Student data not available');
        return card;
    }
    
    const card = createProfileCard('ipu', 'Academic Profile');
    
    // Profile header
    card.querySelector('.user-info').innerHTML = `
        <div class="user-name">${data.name || 'Student'}</div>
        <div class="username">Enrollment: ${data.enrollment_no || 'N/A'}</div>
        ${data.programme?.branch_name ? 
            `<div class="item"><strong>Program:</strong> ${data.programme.branch_name}</div>` : ''}
        ${data.institute?.insti_name ? 
            `<div class="item"><strong>Institute:</strong> ${data.institute.insti_name}</div>` : ''}
        ${data.programme?.course_name ? 
            `<div class="item"><strong>Course:</strong> ${data.programme.course_name}</div>` : ''}
    `;
    
    // Add student photo if available
    if (data.img) {
        const profilePic = card.querySelector('.profile-pic');
        profilePic.src = `https://ipuranklist.com/student_images/${data.img}.jpg`;
        profilePic.onerror = () => {
            profilePic.style.display = 'none';
        };
    }
    
    // Overall stats
    const statsGrid = card.querySelector('.stats-grid');
    statsGrid.innerHTML = '';
    
    // Get latest result if available
    const validResults = data.results?.filter(r => r.sgpa > 0) || [];
    if (validResults.length > 0) {
        const latestResult = validResults[validResults.length - 1];
        
        statsGrid.innerHTML += `
            <div class="stat-card">
                <div class="stat-value">${latestResult.sgpa ? latestResult.sgpa.toFixed(2) : 'N/A'}</div>
                <div class="stat-label">Latest SGPA</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestResult.percentage ? latestResult.percentage.toFixed(2) : 'N/A'}%</div>
                <div class="stat-label">Percentage</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${validResults.length}</div>
                <div class="stat-label">Completed Semesters</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestResult.result_no || 'N/A'}</div>
                <div class="stat-label">Current Sem</div>
            </div>
        `;
    }
    
    // Overall CGPA
    if (data.cgpa && data.cgpa > 0) {
        const cgpaCard = document.createElement('div');
        cgpaCard.className = 'stat-card';
        cgpaCard.innerHTML = `
            <div class="stat-value">${data.cgpa.toFixed(2)}</div>
            <div class="stat-label">Overall CGPA</div>
        `;
        statsGrid.appendChild(cgpaCard);
    }
    
    // Academic history section
    if (validResults.length > 0) {
        const historySection = document.createElement('div');
        historySection.innerHTML = '<h3 class="section-title">Academic History</h3>';
        
        const historyList = document.createElement('ul');
        historyList.className = 'content-list';
        
        // Sort results by result_no (semester number)
        const sortedResults = [...validResults].sort((a, b) => a.result_no - b.result_no);
        
        sortedResults.forEach(result => {
            historyList.innerHTML += `
                <li>
                    <strong>Semester ${result.result_no}:</strong> 
                    SGPA: ${result.sgpa.toFixed(2)} | 
                    Percentage: ${result.percentage.toFixed(2)}%
                </li>
            `;
        });
        
        historySection.appendChild(historyList);
        card.querySelector('.profile-body').appendChild(historySection);
    }
    
    // Subject performance - per semester (SHOWS ALL SUBJECTS)
    if (validResults.length > 0) {
        // Sort results by result_no
        const sortedResults = [...validResults].sort((a, b) => a.result_no - b.result_no);
        
        // Process each semester
        sortedResults.forEach(result => {
            if (result.subject_results && result.subject_results.length > 0) {
                const semesterSection = document.createElement('div');
                semesterSection.innerHTML = `<h3 class="section-title">Semester ${result.result_no} Subjects</h3>`;
                
                const subjectsList = document.createElement('ul');
                subjectsList.className = 'content-list';
                
                // Display ALL subjects (no sorting, just show all)
                result.subject_results.forEach(subject => {
                    subjectsList.innerHTML += `
                        <li>
                            <strong>${subject.subject_name || 'Unknown Subject'}:</strong> 
                            ${subject.total_marks}/${subject.max_credits * 100} 
                            <span class="tag">${subject.grade}</span>
                            ${subject.minor !== undefined && subject.major !== undefined ? 
                                `<div style="font-size: 0.85em; color: #666; margin-left: 20px;">
                                    Minor: ${subject.minor}/25 | Major: ${subject.major}/75
                                </div>` : ''}
                        </li>
                    `;
                });
                
                semesterSection.appendChild(subjectsList);
                card.querySelector('.profile-body').appendChild(semesterSection);
            }
        });
    }
    
    // Overall grade distribution
    if (validResults.length > 0) {
        // Get all subject results from all semesters
        let allSubjectResults = [];
        validResults.forEach(result => {
            if (result.subject_results) {
                allSubjectResults = allSubjectResults.concat(result.subject_results);
            }
        });
        
        // Group by grade
        const gradeDistribution = {};
        allSubjectResults.forEach(subject => {
            const grade = subject.grade || 'N/A';
            if (!gradeDistribution[grade]) {
                gradeDistribution[grade] = 0;
            }
            gradeDistribution[grade]++;
        });
        
        // Create grade distribution section
        const gradeSection = document.createElement('div');
        gradeSection.innerHTML = '<h3 class="section-title">Grade Distribution</h3>';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        Object.entries(gradeDistribution).sort((a, b) => b[1] - a[1]).forEach(([grade, count]) => {
            tagsContainer.innerHTML += `
                <span class="tag">
                    ${grade}: ${count}
                </span>
            `;
        });
        
        gradeSection.appendChild(tagsContainer);
        card.querySelector('.profile-body').appendChild(gradeSection);
    }
    
    // Add DSA course performance if available
    if (data.subjects && validResults.length > 0) {
        const dsaSubject = data.subjects.find(s => 
            s.name && 
            (s.name.toLowerCase().includes('design and analysis of algorithms') || 
             s.paper_code === 'AIDS303' || 
             s.paper_code === 'AIDS353')
        );
        
        if (dsaSubject) {
            // Find the result for this subject
            let dsaResult = null;
            for (const result of validResults) {
                dsaResult = result.subject_results.find(sr => sr.subject_id === dsaSubject._id);
                if (dsaResult) break;
            }
            
            if (dsaResult) {
                const dsaSection = document.createElement('div');
                dsaSection.innerHTML = `
                    <h3 class="section-title" style="color: #3B5998;">DSA Course Performance</h3>
                    <div class="stats-grid" style="margin-top: 10px;">
                        <div class="stat-card">
                            <div class="stat-value">${dsaResult.total_marks}</div>
                            <div class="stat-label">Total Marks</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${dsaResult.grade}</div>
                            <div class="stat-label">Grade</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${dsaResult.minor || 'N/A'}</div>
                            <div class="stat-label">Minor Exam</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${dsaResult.major || 'N/A'}</div>
                            <div class="stat-label">Major Exam</div>
                        </div>
                    </div>
                `;
                card.querySelector('.profile-body').appendChild(dsaSection);
            }
        }
    }
    
    return card;
}

function createProfileCard(platform, title) {
    const card = document.createElement('div');
    card.className = `profile-card ${platform}-card`;
    
    card.innerHTML = `
        <div class="platform-header">
            <div class="platform-icon-large" style="background-color: #4a6fa5; color: white;">${title.charAt(0)}</div>
            <h2 class="platform-title">${title}</h2>
        </div>
        <div class="profile-body">
            <div class="profile-meta">
                <img src="" alt="Profile" class="profile-pic" style="display: block;">
                <div class="user-info"></div>
            </div>
            <div class="stats-grid"></div>
        </div>
    `;
    
    return card;
}

function createErrorCard(platform, enrollmentNo, message) {
    const card = document.createElement('div');
    card.className = `profile-card ${platform}-card`;
    
    card.innerHTML = `
        <div class="platform-header">
            <div class="platform-icon-large" style="background-color: #4a6fa5; color: white;">I</div>
            <h2 class="platform-title">Academic Profile</h2>
        </div>
        <div class="profile-body">
            <div class="error-msg">
                <span class="error-icon">⚠️</span>
                <div>
                    <strong>Error loading academic data for enrollment "${enrollmentNo}":</strong>
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    return card;
}