// Helper function to convert basic markdown to HTML
// This handles **bold**, *italic*, and \n (newlines)
function convertMarkdownToHTML(text) {
    if (typeof text !== 'string') {
        return text; // Return as-is if not a string
    }
    let htmlText = text;
    // Handle **bold**
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle *italic* (single underscores might interfere with URLs, so using single asterisks here)
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle line breaks (\n)
    htmlText = htmlText.replace(/\n/g, '<br>');
    return htmlText;
}

document.addEventListener('DOMContentLoaded', () => {
    const studentSelector = document.getElementById('student-selector');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const jobApplicationInput = document.getElementById('job-application-input');
    const analyzeJobBtn = document.getElementById('analyze-job-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const reportContainer = document.getElementById('reports'); // Updated to match new HTML ID
    const jobAnalysisContainer = document.getElementById('job-analysis'); // Updated to match new HTML ID
    const chatbotContainer = document.getElementById('chat'); // Updated to match new HTML ID
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    // --- Chart Instances (To destroy/recreate when data changes) ---
    let skillsChart = null;
    let dsaChart = null;
    let jobMatchChart = null; // This one might be tricky without specific data

    // --- Navigation Elements ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // --- Sidebar Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('href').substring(1); // Get ID without '#'

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target section, hide others
            contentSections.forEach(section => {
                section.classList.add('hidden');
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                    section.classList.add('active');
                    // Load dashboard data when the dashboard section becomes active
                    if (targetId === 'dashboard') {
                        console.log("Dashboard section activated, attempting to load data.");
                        loadDashboardData(); // Call loadDashboardData here
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // --- Initial Navigation Setup (Show Dashboard by default) ---
    const dashboardLink = document.querySelector('.nav-link[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.click(); // Programmatically click the dashboard link to show it initially
    }


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
        // Note: chatbotContainer is now a section, not tied directly to student selection visibility here
        // reportContainer.classList.add('hidden'); // Hide old report on new selection - Handled by nav now
        // chatHistory.innerHTML = ''; // Clear chat history - Handled by nav or separately if needed
        console.log("Student selection changed to:", studentSelector.value);
        // Reload dashboard data if currently on the dashboard page
        if (document.querySelector('#dashboard')?.classList.contains('active')) { // Added optional chaining
             console.log("Currently on dashboard, reloading data for new selection.");
             loadDashboardData();
        }
    });

    jobApplicationInput.addEventListener('input', () => {
        analyzeJobBtn.disabled = !jobApplicationInput.value.trim();
    });

    // 3. Handle "Generate Report" button click
    generateReportBtn.addEventListener('click', () => {
        const enrollmentNo = studentSelector.value;
        if (!enrollmentNo) return;

        loadingSpinner.classList.remove('hidden');
        // Hide other sections while loading
        reportContainer.classList.add('hidden');
        jobAnalysisContainer.classList.add('hidden');
        // chatbotContainer.classList.add('hidden'); // Don't hide chat, just report

        // Navigate to the reports section
        document.querySelector('.nav-link[href="#reports"]').click();

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
                    // The section is shown by the navigation click above
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
        // Get the enrollment number from the currently selected student in the dropdown
        const enrollmentNo = studentSelector.value;

        if (!jobApplicationLink || !enrollmentNo) { // Check if both values exist
             alert('Please select a student and provide a job application link.');
             return; // Stop execution if either value is missing
        }

        loadingSpinner.classList.remove('hidden');
        // Hide other sections while loading
        reportContainer.classList.add('hidden');
        jobAnalysisContainer.classList.add('hidden');
        // chatbotContainer.classList.add('hidden'); // Don't hide chat, just job analysis

        // Navigate to the job analysis section
        document.querySelector('.nav-link[href="#job-analysis"]').click();

        fetch('/api/job-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Include both the job link and the enrollment number in the request body
            body: JSON.stringify({
                job_application_link: jobApplicationLink,
                enrollment_no: enrollmentNo // <-- Add this line
            })
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
                // The section is shown by the navigation click above
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

        // Navigate to the chat section if not already there
        document.querySelector('.nav-link[href="#chat"]').click();

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
            // Apply markdown formatting to the AI's answer before displaying
            appendMessage(data.answer, 'ai', false, true); // Pass true for markdown formatting
            chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to bottom after adding message
        })
        .catch(error => {
            console.error('Chat error:', error);
            const loadingElement = chatHistory.querySelector('.loading');
            if (loadingElement) {
                loadingElement.parentElement.remove();
            }
            appendMessage('Sorry, an error occurred while fetching the answer.', 'ai', false, true); // Apply markdown to error message too
        });
    });

    // --- Helper Functions ---

    function displayReport(report) {
        const reportTitleElement = document.getElementById('report-title');
        if (reportTitleElement) {
            reportTitleElement.textContent = `Performance Report for ${studentSelector.options[studentSelector.selectedIndex].text}`;
        }
        // Apply markdown formatting to the summary
        const summaryTextElement = document.getElementById('summary-text');
        if (summaryTextElement) {
             summaryTextElement.innerHTML = convertMarkdownToHTML(report.overall_summary);
        }

        // Display resume analysis
        displayResumeAnalysis(report.resume_analysis);

        const scoresGrid = document.getElementById('scores-grid');
        if (scoresGrid) {
            scoresGrid.innerHTML = '';
            report.detailed_scores.forEach(item => {
                // Apply markdown to justification
                scoresGrid.innerHTML += `
                    <div class="score-card">
                        <div class="parameter">
                            <span>${item.parameter}</span>
                            <span class="score">${item.score}/10</span>
                        </div>
                        <div class="justification">${convertMarkdownToHTML(item.justification)}</div>
                    </div>
                `;
            });
        }

        const createListItems = (items) => items.map(item => `<li>${convertMarkdownToHTML(item)}</li>`).join(''); // Apply to list items

        const strengthsListElement = document.getElementById('strengths-list');
        if (strengthsListElement) {
            strengthsListElement.innerHTML = createListItems(report.analysis.strengths);
        }
        const weaknessesListElement = document.getElementById('weaknesses-list');
        if (weaknessesListElement) {
            weaknessesListElement.innerHTML = createListItems(report.analysis.weaknesses);
        }
        const adviceListElement = document.getElementById('advice-list');
        if (adviceListElement) {
            adviceListElement.innerHTML = createListItems(report.actionable_advice.recommendations);
        }

        // Display YouTube recommendations
        displayYouTubeRecommendations(report.youtube_recommendations);
    }

    function displayResumeAnalysis(resumeAnalysis) {
        // Display skills as tags
        const skillsContainer = document.getElementById('resume-skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            resumeAnalysis.key_skills.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'skill-tag';
                tag.textContent = skill;
                skillsContainer.appendChild(tag);
            });
        }


        // Display professional links
        const linksContainer = document.getElementById('resume-links');
        if (linksContainer) {
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
        }


        // Display missing elements
        const missingContainer = document.getElementById('resume-missing');
        if (missingContainer) {
            missingContainer.innerHTML = '';
            resumeAnalysis.missing_elements.forEach(item => {
                const li = document.createElement('li');
                li.className = 'missing-items';
                // Apply markdown to missing elements (though unlikely to have formatting)
                li.innerHTML = convertMarkdownToHTML(item);
                missingContainer.appendChild(li);
            });
        }
    }

    function displayYouTubeRecommendations(recommendations) {
        const container = document.getElementById('youtube-recommendations');
        if (!container) {
            console.error("Container #youtube-recommendations not found.");
            return;
        }
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
                // Apply markdown to reason/description
                topicReason.innerHTML = convertMarkdownToHTML(topic.reason);
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
                            <p class="youtube-reason">${convertMarkdownToHTML(video.reason || video.description)}</p>
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
                        <p class="youtube-reason">${convertMarkdownToHTML(topic.reason || topic.description)}</p>
                    </div>
                `;

                container.appendChild(card);
            }
        });
    }

    function displayJobAnalysis(data) {
        console.log("Job analysis ", data); // Debug log

        // --- Map new structure to expected display structure ---

        // 1. Display Strategic Overview (Summary and Key Opportunity)
        const reportTitleElement = document.getElementById('report-title'); // Reuse title element or create a new one if needed for job analysis
        if (reportTitleElement) {
            reportTitleElement.textContent = `Job Application Analysis`; // Or use data.strategic_overview.summary if it's a full sentence
        }
        // Assuming you might want to display summary and key opportunity in a dedicated area if available
        // const overviewSummaryElement = document.getElementById('overview-summary'); // Add this element in HTML if needed
        // if (overviewSummaryElement && data.strategic_overview && data.strategic_overview.summary) {
        //     overviewSummaryElement.innerHTML = convertMarkdownToHTML(data.strategic_overview.summary);
        // }
        // const keyOpportunityElement = document.getElementById('key-opportunity'); // Add this element in HTML if needed
        // if (keyOpportunityElement && data.strategic_overview && data.strategic_overview.your_key_opportunity) {
        //     keyOpportunityElement.innerHTML = convertMarkdownToHTML(data.strategic_overview.your_key_opportunity);
        // }

        // 2. Display Strengths (from 'your_core_strengths_for_this_role')
        const strengthsContainer = document.getElementById('job-strengths-list');
        if (strengthsContainer) {
            strengthsContainer.innerHTML = '';

            const strengths = data['your_core_strengths_for_this_role'] || [];

            if (Array.isArray(strengths) && strengths.length > 0) {
                strengths.forEach(strength => {
                    const item = document.createElement('div');
                    item.className = 'job-strength-item';
                    // Map the new keys to the expected keys in the HTML structure
                    // Apply markdown formatting to description and relevance
                    item.innerHTML = `
                        <div class="job-item-aspect">${convertMarkdownToHTML(strength.strength_area || 'N/A')}</div>
                        <div class="job-item-description">${convertMarkdownToHTML(strength.evidence_from_your_profile || 'N/A')}</div>
                        <div class="job-item-relevance">${convertMarkdownToHTML(strength.how_it_matches_the_job || 'N/A')}</div>
                    `;
                    strengthsContainer.appendChild(item);
                });
            } else {
                strengthsContainer.innerHTML = '<p class="no-data">No strengths data available.</p>';
            }
        }

        // 3. Display Weaknesses (from 'strategic_areas_for_growth')
        const weaknessesContainer = document.getElementById('job-weaknesses-list');
        if (weaknessesContainer) {
            weaknessesContainer.innerHTML = '';

            const weaknesses = data['strategic_areas_for_growth'] || [];

            if (Array.isArray(weaknesses) && weaknesses.length > 0) {
                weaknesses.forEach(weakness => {
                    const item = document.createElement('div');
                    item.className = 'job-weakness-item';
                    // Map the new keys to the expected keys in the HTML structure
                    // Apply markdown formatting to description, importance, and suggestion
                    item.innerHTML = `
                        <div class="job-item-aspect">${convertMarkdownToHTML(weakness.area_to_develop || 'N/A')}</div>
                        <div class="job-item-description">${convertMarkdownToHTML(weakness.insight || 'N/A')}</div>
                        <div class="job-item-importance">${convertMarkdownToHTML("Importance: " + (weakness.severity || 'N/A'))}</div>
                        <div class="job-item-suggestion">${convertMarkdownToHTML(weakness.path_to_improvement ? weakness.path_to_improvement.join('<br>') : 'N/A')}</div>
                    `;
                    weaknessesContainer.appendChild(item);
                });
            } else {
                weaknessesContainer.innerHTML = '<p class="no-data">No weaknesses data available.</p>';
            }
        }

        // 4. Display Enhancement Recommendations (from 'strategic_areas_for_growth' as well)
        const enhancementsContainer = document.getElementById('job-enhancements-list');
        if (enhancementsContainer) {
            enhancementsContainer.innerHTML = '';

            // We can reuse the 'strategic_areas_for_growth' for enhancement recommendations
            const weaknessesForRecs = data['strategic_areas_for_growth'] || []; // Use the same array
            if (Array.isArray(weaknessesForRecs) && weaknessesForRecs.length > 0) {
                weaknessesForRecs.forEach(rec => {
                    const item = document.createElement('div');
                    item.className = 'job-enhancement-item';
                    // Map the new keys to the expected keys in the HTML structure
                    // Apply markdown formatting to description and priority
                    item.innerHTML = `
                        <div class="job-item-aspect">${convertMarkdownToHTML(rec.area_to_develop || 'N/A')}</div>
                        <div class="job-item-description">${convertMarkdownToHTML(rec.path_to_improvement ? rec.path_to_improvement.join('<br>') : 'N/A')}</div>
                        <div class="job-item-importance">${convertMarkdownToHTML("Priority: " + (rec.severity || 'N/A'))}</div>
                    `;
                    enhancementsContainer.appendChild(item);
                });
            } else {
                enhancementsContainer.innerHTML = '<p class="no-data">No enhancement recommendations available.</p>';
            }
        }


        // 5. Display YouTube recommendations (should already be in the correct format)
        displayJobYouTubeRecommendations(data.video_recommendations);
    }

    function displayJobYouTubeRecommendations(recommendations) {
        const container = document.getElementById('job-youtube-recommendations');
        if (!container) {
            console.error("Container #job-youtube-recommendations not found.");
            return;
        }
        container.innerHTML = '';

        if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
            container.innerHTML = '<p class="no-data">No YouTube recommendations available for this job application.</p>';
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
                // Apply markdown to reason
                topicReason.innerHTML = convertMarkdownToHTML(topic.reason || 'Recommended to improve your skills');
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
                            <p class="youtube-reason">${convertMarkdownToHTML(video.reason || video.description || 'Recommended for skill development')}</p>
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
                        <p class="youtube-reason">${convertMarkdownToHTML(topic.reason || topic.description || 'Recommended for skill development')}</p>
                    </div>
                `;

                container.appendChild(card);
            }
        });
    }

    // --- Updated Dashboard Data Loading Function with Chart.js ---
    async function loadDashboardData() {
        console.log("Loading dashboard data for selected student...");
        const selectedEnrollment = studentSelector.value;

        // Clear previous charts *first* to prevent infinite stretching if new data fails
        if (skillsChart) { skillsChart.destroy(); skillsChart = null; }
        if (dsaChart) { dsaChart.destroy(); dsaChart = null; }
        if (jobMatchChart) { jobMatchChart.destroy(); jobMatchChart = null; }

        // Get canvas elements and their contexts
        const skillsCanvas = document.getElementById('skills-chart-canvas');
        const dsaCanvas = document.getElementById('dsa-chart-canvas');
        const jobMatchCanvas = document.getElementById('job-match-chart-canvas');

        // Check if canvases exist before proceeding
        if (!skillsCanvas || !dsaCanvas || !jobMatchCanvas) {
            console.error("One or more dashboard chart canvases not found in the DOM.");
            return;
        }

        const skillsCtx = skillsCanvas.getContext('2d');
        const dsaCtx = dsaCanvas.getContext('2d');
        const jobMatchCtx = jobMatchCanvas.getContext('2d');

        // Clear canvases
        if (skillsCtx) skillsCtx.clearRect(0, 0, skillsCtx.canvas.width, skillsCtx.canvas.height);
        if (dsaCtx) dsaCtx.clearRect(0, 0, dsaCtx.canvas.width, dsaCtx.canvas.height);
        if (jobMatchCtx) jobMatchCtx.clearRect(0, 0, jobMatchCtx.canvas.width, jobMatchCtx.canvas.height);

        if (!selectedEnrollment) {
            console.log("No student selected, showing placeholder.");
            // Show placeholder text on canvases if contexts are available
            [skillsCtx, dsaCtx, jobMatchCtx].forEach(ctx => {
                if (ctx) { // Check if context exists
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "gray";
                    ctx.textAlign = "center";
                    ctx.fillText("Select a student to see details", ctx.canvas.width / 2, ctx.canvas.height / 2);
                }
            });
            // Reset metric counters if needed (e.g., to 0 or N/A)
            const totalStudentsEl = document.querySelector('#total-students-count');
            const reportsGeneratedEl = document.querySelector('#reports-generated-count');
            const jobAnalysesEl = document.querySelector('#job-analyses-count');
            if (totalStudentsEl) totalStudentsEl.textContent = 'N/A';
            if (reportsGeneratedEl) reportsGeneratedEl.textContent = 'N/A';
            if (jobAnalysesEl) jobAnalysesEl.textContent = 'N/A';
            return; // Exit if no student is selected
        }

        try {
            console.log(`Fetching dashboard metrics for enrollment: ${selectedEnrollment}`);
            const response = await fetch(`/api/dashboard/metrics/${selectedEnrollment}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const dashboardData = await response.json();
            console.log("Dashboard data for selected student:", dashboardData);

            // --- Update Dashboard Elements ---
            // 1. Metrics Cards (Example: Using data from student's profile if available)
            // document.querySelector('#total-students-count').textContent = dashboardData.academics.cgpa || 0; // Example for CGPA
            // This section requires more specific data points from your dashboard analyzer output.

            // 2. Skills Distribution Chart
            if (dashboardData.skills_distribution && skillsCtx) { // Check if data and context exist
                const topSkills = Object.entries(dashboardData.skills_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5); // Get top 5
                const labels = topSkills.map(item => item[0]);
                const data = topSkills.map(item => item[1]);

                skillsChart = new Chart(skillsCtx, {
                    type: 'bar', // or 'doughnut', 'pie', etc.
                     {
                        labels: labels,
                        datasets: [{
                            label: 'Skill Count',
                            data: data,
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 205, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)'
                            ],
                            borderColor: [
                                'rgb(255, 99, 132)',
                                'rgb(54, 162, 235)',
                                'rgb(255, 205, 86)',
                                'rgb(75, 192, 192)',
                                'rgb(153, 102, 255)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false, // Allows the chart to fill its container
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            } else if (skillsCtx) { // Check context exists before drawing
                // If no data, show a message
                skillsCtx.font = "16px Arial";
                skillsCtx.fillStyle = "gray";
                skillsCtx.textAlign = "center";
                skillsCtx.fillText("No Skills Data Available", skillsCtx.canvas.width / 2, skillsCtx.canvas.height / 2);
            }


            // 3. DSA Performance Chart
            if (dashboardData.coding_profiles?.leetcode?.score !== undefined && dsaCtx) { // Check if data and context exist
                // Example: Using a radial gauge or a simple bar chart for score
                // For simplicity, let's use a bar chart here showing score out of 10
                dsaChart = new Chart(dsaCtx, {
                    type: 'bar', // Could be 'radar', 'doughnut' for score
                     {
                        labels: ['DSA Score'],
                        datasets: [{
                            label: 'DSA Performance (0-10)',
                            data: [dashboardData.coding_profiles.leetcode.score],
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 10 // Set max scale to 10
                            }
                        }
                    }
                });
            } else if (dsaCtx) { // Check context exists before drawing
                 // If no data, show a message
                dsaCtx.font = "16px Arial";
                dsaCtx.fillStyle = "gray";
                dsaCtx.textAlign = "center";
                dsaCtx.fillText("No DSA Data Available", dsaCtx.canvas.width / 2, dsaCtx.canvas.height / 2);
            }

            // 4. Job Match Score Chart (Placeholder - requires specific data from job analysis)
            // This would need data from a job analysis call, which is tied to a specific job link.
            // For now, show a placeholder or message.
            if (jobMatchCtx) { // Check context exists before drawing
                jobMatchCtx.font = "16px Arial";
                jobMatchCtx.fillStyle = "gray";
                jobMatchCtx.textAlign = "center";
                jobMatchCtx.fillText("Job Match Score (requires Job Analysis)", jobMatchCtx.canvas.width / 2, jobMatchCtx.canvas.height / 2);
            }

        } catch (error) {
            console.error('Error loading dashboard data for selected student:', error);
            // Show error message on canvases if contexts are available
            [skillsCtx, dsaCtx, jobMatchCtx].forEach(ctx => {
                if (ctx) { // Check if context exists
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear again just in case
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "red";
                    ctx.textAlign = "center";
                    ctx.fillText("Error Loading Data", ctx.canvas.width / 2, ctx.canvas.height / 2);
                }
            });
        }

        // Example: Static metrics for Total Students, Reports Generated, Job Analyses
        // These would ideally come from a server-side counter or an aggregate API call
        // For now, keep them static or update based on global counts if available separately
        // const totalStudentsEl = document.querySelector('#total-students-count');
        // const reportsGeneratedEl = document.querySelector('#reports-generated-count');
        // const jobAnalysesEl = document.querySelector('#job-analyses-count');
        // if (totalStudentsEl) totalStudentsEl.textContent = '1'; // Total Students
        // if (reportsGeneratedEl) reportsGeneratedEl.textContent = '0'; // Reports Generated
        // if (jobAnalysesEl) jobAnalysesEl.textContent = '0'; // Job Analyses
    }


    // Modified appendMessage function to accept a markdown flag
    function appendMessage(text, sender, isLoading = false, useMarkdown = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message', `${sender}-message`);

        const messageP = document.createElement('p');
        // Apply markdown formatting if the flag is true (e.g., for AI responses)
        if (useMarkdown) {
            messageP.innerHTML = text; // Use innerHTML to render the formatted HTML
        } else {
            messageP.textContent = text; // Use textContent for plain text (e.g., user messages, loading)
        }

        if (isLoading) {
            messageP.classList.add('loading');
        }

        messageWrapper.appendChild(messageP);
        chatHistory.appendChild(messageWrapper);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to bottom
    }
});