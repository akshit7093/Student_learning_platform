document.addEventListener('DOMContentLoaded', () => {
    const studentSelector = document.getElementById('student-selector');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const jobApplicationInput = document.getElementById('job-application-input');
    const analyzeJobBtn = document.getElementById('analyze-job-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const reportContainer = document.getElementById('report-container');
    const jobAnalysisContainer = document.getElementById('job-analysis-container');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    // 1. Populate student dropdown on page load
    fetch('/api/students')
        .then(response => response.json())
        .then(students => {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.enrollment_no;
                option.textContent = `${student.name} (${student.enrollment_no})`;
                studentSelector.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching students:', error));

    // 2. Enable buttons when inputs are filled
    studentSelector.addEventListener('change', () => {
        const hasSelection = !!studentSelector.value;
        generateReportBtn.disabled = !hasSelection;
        chatbotContainer.classList.toggle('hidden', !hasSelection);
        reportContainer.classList.add('hidden'); // Hide old report on new selection
        chatHistory.innerHTML = ''; // Clear chat history
    });

    jobApplicationInput.addEventListener('input', () => {
        analyzeJobBtn.disabled = !jobApplicationInput.value.trim();
    });

    // 3. Handle "Generate Report" button click
    generateReportBtn.addEventListener('click', () => {
        const enrollmentNo = studentSelector.value;
        if (!enrollmentNo) return;

        loadingSpinner.classList.remove('hidden');
        reportContainer.classList.add('hidden');
        jobAnalysisContainer.classList.add('hidden');
        chatbotContainer.classList.add('hidden');

        fetch(`/api/report/${enrollmentNo}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(report => {
                loadingSpinner.classList.add('hidden');
                if (report.error) {
                    alert(`Error generating report: ${report.error}`);
                } else {
                    displayReport(report);
                    reportContainer.classList.remove('hidden');
                    chatbotContainer.classList.remove('hidden');
                }
            })
            .catch(error => {
                loadingSpinner.classList.add('hidden');
                console.error('Report generation error:', error);
                alert(`An unexpected error occurred: ${error.message}`);
            });
    });

    // 4. Handle "Analyze Job Application" button click
    analyzeJobBtn.addEventListener('click', () => {
        const jobApplicationLink = jobApplicationInput.value.trim();
        if (!jobApplicationLink) return;

        loadingSpinner.classList.remove('hidden');
        reportContainer.classList.add('hidden');
        jobAnalysisContainer.classList.add('hidden');
        chatbotContainer.classList.add('hidden');

        fetch('/api/job-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_application_link: jobApplicationLink })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            loadingSpinner.classList.add('hidden');
            if (data.error) {
                alert(`Error analyzing job application: ${data.error}`);
            } else {
                displayJobAnalysis(data.data); // Access data.data as per API response structure
                jobAnalysisContainer.classList.remove('hidden');
            }
        })
        .catch(error => {
            loadingSpinner.classList.add('hidden');
            console.error('Job analysis error:', error);
            alert(`An unexpected error occurred: ${error.message}`);
        });
    });

    // 5. Handle chat form submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enrollmentNo = studentSelector.value;
        const question = chatInput.value.trim();

        if (!question || !enrollmentNo) return;
        
        appendMessage(question, 'user');
        chatInput.value = '';
        appendMessage('Thinking...', 'ai', true); // Show loading indicator

        fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollment_no: enrollmentNo, question: question })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const loadingElement = chatHistory.querySelector('.loading');
            if (loadingElement) {
                loadingElement.parentElement.remove();
            }
            appendMessage(data.answer, 'ai');
        })
        .catch(error => {
            console.error('Chat error:', error);
            const loadingElement = chatHistory.querySelector('.loading');
            if (loadingElement) {
                loadingElement.parentElement.remove();
            }
            appendMessage('Sorry, an error occurred while fetching the answer.', 'ai');
        });
    });

    // --- Helper Functions ---

    function displayReport(report) {
        document.getElementById('report-title').textContent = `Performance Report for ${studentSelector.options[studentSelector.selectedIndex].text}`;
        document.getElementById('summary-text').textContent = report.overall_summary;

        // Display resume analysis
        displayResumeAnalysis(report.resume_analysis);
        
        const scoresGrid = document.getElementById('scores-grid');
        scoresGrid.innerHTML = '';
        report.detailed_scores.forEach(item => {
            scoresGrid.innerHTML += `
                <div class="score-card">
                    <div class="parameter">
                        <span>${item.parameter}</span>
                        <span class="score">${item.score}/10</span>
                    </div>
                    <div class="justification">${item.justification}</div>
                </div>
            `;
        });

        const createListItems = (items) => items.map(item => `<li>${item}</li>`).join('');

        document.getElementById('strengths-list').innerHTML = createListItems(report.analysis.strengths);
        document.getElementById('weaknesses-list').innerHTML = createListItems(report.analysis.weaknesses);
        document.getElementById('advice-list').innerHTML = createListItems(report.actionable_advice.recommendations);
        
        // Display YouTube recommendations
        displayYouTubeRecommendations(report.youtube_recommendations);
    }
    
    function displayResumeAnalysis(resumeAnalysis) {
        // Display skills as tags
        const skillsContainer = document.getElementById('resume-skills');
        skillsContainer.innerHTML = '';
        resumeAnalysis.key_skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            skillsContainer.appendChild(tag);
        });
        
        // Display professional links
        const linksContainer = document.getElementById('resume-links');
        linksContainer.innerHTML = '';
        resumeAnalysis.professional_links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            
            // Extract domain for display
            try {
                const url = new URL(link);
                a.textContent = url.hostname.replace('www.', '');
            } catch (e) {
                a.textContent = link;
            }
            
            li.appendChild(a);
            linksContainer.appendChild(li);
        });
        
        // Display missing elements
        const missingContainer = document.getElementById('resume-missing');
        missingContainer.innerHTML = '';
        resumeAnalysis.missing_elements.forEach(item => {
            const li = document.createElement('li');
            li.className = 'missing-items';
            li.textContent = item;
            missingContainer.appendChild(li);
        });
    }
    
    function displayYouTubeRecommendations(recommendations) {
        const container = document.getElementById('youtube-recommendations');
        container.innerHTML = '';
        
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p>No YouTube recommendations available for this student.</p>';
            return;
        }
        
        recommendations.forEach(topic => {
            // Check if this is a topic with videos or a single video
            if (topic.videos && Array.isArray(topic.videos)) {
                // This is a topic with multiple videos
                const topicSection = document.createElement('div');
                topicSection.className = 'topic-section';
                
                const topicHeader = document.createElement('h3');
                topicHeader.textContent = topic.topic;
                topicSection.appendChild(topicHeader);
                
                const topicReason = document.createElement('p');
                topicReason.className = 'topic-reason';
                topicReason.textContent = topic.reason;
                topicSection.appendChild(topicReason);
                
                const videosContainer = document.createElement('div');
                videosContainer.className = 'videos-container';
                
                topic.videos.forEach(video => {
                    const card = document.createElement('div');
                    card.className = 'youtube-card';
                    
                    // Fix URL formatting - remove extra spaces
                    const embedUrl = (video.embed_url || video.url).replace(/\s+/g, '');
                    
                    card.innerHTML = `
                        <div class="youtube-embed">
                            <iframe src="${embedUrl}" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen></iframe>
                        </div>
                        <div class="youtube-info">
                            <h3 class="youtube-title">${video.title}</h3>
                            <p class="youtube-reason">${video.reason || video.description}</p>
                        </div>
                    `;
                    
                    videosContainer.appendChild(card);
                });
                
                topicSection.appendChild(videosContainer);
                container.appendChild(topicSection);
            } else {
                // This is a single video (fallback case)
                const card = document.createElement('div');
                card.className = 'youtube-card';
                
                // Fix URL formatting - remove extra spaces
                const embedUrl = (topic.embed_url || topic.url).replace(/\s+/g, '');
                
                card.innerHTML = `
                    <div class="youtube-embed">
                        <iframe src="${embedUrl}" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen></iframe>
                    </div>
                    <div class="youtube-info">
                        <h3 class="youtube-title">${topic.title}</h3>
                        <p class="youtube-reason">${topic.reason || topic.description}</p>
                    </div>
                `;
                
                container.appendChild(card);
            }
        });
    }
    
    function displayJobAnalysis(data) {
        console.log("Job analysis data:", data); // Debug log
        
        // Display strengths
        const strengthsContainer = document.getElementById('job-strengths-list');
        strengthsContainer.innerHTML = '';
        
        // Check if strengths exist and is an array
        if (data.strengths && Array.isArray(data.strengths)) {
            data.strengths.forEach(strength => {
                const item = document.createElement('div');
                item.className = 'job-strength-item';
                item.innerHTML = `
                    <div class="job-item-aspect">${strength.aspect || 'N/A'}</div>
                    <div class="job-item-description">${strength.description || 'N/A'}</div>
                    <div class="job-item-relevance">${strength.relevance || 'N/A'}</div>
                `;
                strengthsContainer.appendChild(item);
            });
        } else {
            strengthsContainer.innerHTML = '<p>No strengths data available.</p>';
        }
        
        // Display weaknesses
        const weaknessesContainer = document.getElementById('job-weaknesses-list');
        weaknessesContainer.innerHTML = '';
        
        // Check if weaknesses exist and is an array
        if (data.weaknesses && Array.isArray(data.weaknesses)) {
            data.weaknesses.forEach(weakness => {
                const item = document.createElement('div');
                item.className = 'job-weakness-item';
                item.innerHTML = `
                    <div class="job-item-aspect">${weakness.aspect || 'N/A'}</div>
                    <div class="job-item-description">${weakness.description || 'N/A'}</div>
                    <div class="job-item-importance">Importance: ${weakness.importance || 'N/A'}</div>
                    <div class="job-item-suggestion">${weakness.improvement_suggestion || 'N/A'}</div>
                `;
                weaknessesContainer.appendChild(item);
            });
        } else {
            weaknessesContainer.innerHTML = '<p>No weaknesses data available.</p>';
        }
        
        // Display enhancement recommendations
        const enhancementsContainer = document.getElementById('job-enhancements-list');
        enhancementsContainer.innerHTML = '';
        
        // Check if enhancement_recommendations exist and is an array
        if (data.enhancement_recommendations && Array.isArray(data.enhancement_recommendations)) {
            data.enhancement_recommendations.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'job-enhancement-item';
                item.innerHTML = `
                    <div class="job-item-aspect">${rec.area || 'N/A'}</div>
                    <div class="job-item-description">${rec.suggestion || 'N/A'}</div>
                    <div class="job-item-importance">Priority: ${rec.priority || 'N/A'}</div>
                `;
                enhancementsContainer.appendChild(item);
            });
        } else {
            enhancementsContainer.innerHTML = '<p>No enhancement recommendations available.</p>';
        }
        
        // Display YouTube recommendations
        displayJobYouTubeRecommendations(data.video_recommendations);
    }
    
    function displayJobYouTubeRecommendations(recommendations) {
        const container = document.getElementById('job-youtube-recommendations');
        container.innerHTML = '';
        
        if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
            container.innerHTML = '<p>No YouTube recommendations available for this job application.</p>';
            return;
        }
        
        recommendations.forEach(topic => {
            // Check if this is a topic with videos or a single video
            if (topic.videos && Array.isArray(topic.videos)) {
                // This is a topic with multiple videos
                const topicSection = document.createElement('div');
                topicSection.className = 'topic-section';
                
                const topicHeader = document.createElement('h3');
                topicHeader.textContent = topic.topic || 'Recommended Topic';
                topicSection.appendChild(topicHeader);
                
                const topicReason = document.createElement('p');
                topicReason.className = 'topic-reason';
                topicReason.textContent = topic.reason || 'Recommended to improve your skills';
                topicSection.appendChild(topicReason);
                
                const videosContainer = document.createElement('div');
                videosContainer.className = 'videos-container';
                
                topic.videos.forEach(video => {
                    const card = document.createElement('div');
                    card.className = 'youtube-card';
                    
                    // Fix URL formatting - remove extra spaces
                    const embedUrl = (video.embed_url || video.url).replace(/\s+/g, '');
                    
                    card.innerHTML = `
                        <div class="youtube-embed">
                            <iframe src="${embedUrl}" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen></iframe>
                        </div>
                        <div class="youtube-info">
                            <h3 class="youtube-title">${video.title || 'Untitled Video'}</h3>
                            <p class="youtube-reason">${video.reason || video.description || 'Recommended for skill development'}</p>
                        </div>
                    `;
                    
                    videosContainer.appendChild(card);
                });
                
                topicSection.appendChild(videosContainer);
                container.appendChild(topicSection);
            } else {
                // This is a single video (fallback case)
                const card = document.createElement('div');
                card.className = 'youtube-card';
                
                // Fix URL formatting - remove extra spaces
                const embedUrl = (topic.embed_url || topic.url).replace(/\s+/g, '');
                
                card.innerHTML = `
                    <div class="youtube-embed">
                        <iframe src="${embedUrl}" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen></iframe>
                    </div>
                    <div class="youtube-info">
                        <h3 class="youtube-title">${topic.title || 'Untitled Video'}</h3>
                        <p class="youtube-reason">${topic.reason || topic.description || 'Recommended for skill development'}</p>
                    </div>
                `;
                
                container.appendChild(card);
            }
        });
    }

    function appendMessage(text, sender, isLoading = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message', `${sender}-message`);
        
        const messageP = document.createElement('p');
        messageP.textContent = text;
        if (isLoading) {
            messageP.classList.add('loading');
        }
        
        messageWrapper.appendChild(messageP);
        chatHistory.appendChild(messageWrapper);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to bottom
    }
});