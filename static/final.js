// Helper function to convert basic markdown to HTML
function convertMarkdownToHTML(text) {
    if (typeof text !== 'string') {
        return text;
    }
    let htmlText = text;
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    htmlText = htmlText.replace(/\n/g, '<br>');
    return htmlText;
}

document.addEventListener('DOMContentLoaded', () => {
    const studentSelector = document.getElementById('student-selector');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const jobApplicationInput = document.getElementById('job-application-input');
    const analyzeJobBtn = document.getElementById('analyze-job-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const reportContainer = document.getElementById('reports');
    const jobAnalysisContainer = document.getElementById('job-analysis');
    const chatbotContainer = document.getElementById('chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatSessionsList = document.getElementById('chat-sessions-list');

    // Chat State
    let currentSessionId = null;

    // Chart Instances
    let skillsChart = null;
    let dsaChart = null;
    let jobMatchChart = null;
    let cgpaTrendChart = null;
    let dsaPerformanceChart = null;

    // Store pan-zoom instances to prevent memory leaks
    const panZoomInstances = new Map();

    // Initialize Mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
            primaryColor: '#00E5FF',
            primaryTextColor: '#F0F0F0',
            primaryBorderColor: '#00E5FF',
            lineColor: '#00E5FF',
            secondaryColor: '#0099CC',
            tertiaryColor: '#2C2C2C'
        },
        flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis'
        }
    });

    // Navigation Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // --- Sidebar Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            contentSections.forEach(section => {
                section.classList.add('hidden');
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                    section.classList.add('active');
                    if (targetId === 'dashboard') {
                        loadDashboardData();
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // --- Tab Navigation for Report Section ---
    initializeTabs('.ai-analysis-report', 'data-tab');
    initializeTabs('.ai-suggestion-channel', 'data-tab');

    function initializeTabs(containerSelector, attribute) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const tabButtons = container.querySelectorAll('.tab-btn');
        const tabContents = container.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute(attribute);

                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                        if (targetTab === 'performance' && studentSelector.value) {
                            loadPerformanceCharts(studentSelector.value);
                        }
                    }
                });
            });
        });
    }

    // --- Initial Navigation Setup ---
    const dashboardLink = document.querySelector('.nav-link[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.click();
    }

    // --- Populate student dropdown ---
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

    // --- Enable buttons when inputs are filled ---
    studentSelector.addEventListener('change', () => {
        const hasSelection = !!studentSelector.value;
        generateReportBtn.disabled = !hasSelection;
    });

    jobApplicationInput.addEventListener('input', () => {
        analyzeJobBtn.disabled = !jobApplicationInput.value.trim();
    });

    // --- Report History Logic ---
    const reportHistoryBtn = document.getElementById('report-history-btn');
    const reportHistoryModal = document.getElementById('report-history-modal');
    const reportHistoryList = document.getElementById('report-history-list');
    const closeModalBtn = document.querySelector('.close-modal');


    if (reportHistoryBtn) {
        reportHistoryBtn.addEventListener('click', () => {
            const enrollmentNo = studentSelector.value;
            if (!enrollmentNo) {
                alert('Please select a student first.');
                return;
            }
            loadReportHistory(enrollmentNo);
            reportHistoryModal.classList.remove('hidden');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            reportHistoryModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === reportHistoryModal) {
            reportHistoryModal.classList.add('hidden');
        }
    });

    function loadReportHistory(enrollmentNo) {
        reportHistoryList.innerHTML = '<div class="loading">Loading history...</div>';

        fetch(`/api/reports/history/${enrollmentNo}`)
            .then(response => response.json())
            .then(history => {
                reportHistoryList.innerHTML = '';
                if (history.length === 0) {
                    reportHistoryList.innerHTML = '<p style="text-align:center; color:var(--text-tertiary)">No saved reports found.</p>';
                    return;
                }

                history.forEach(report => {
                    const item = document.createElement('div');
                    item.className = 'report-item';

                    const date = new Date(report.timestamp).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    item.innerHTML = `
                        <div class="report-title">${report.title}</div>
                        <div class="report-date">${date}</div>
                    `;

                    item.addEventListener('click', () => {
                        loadSavedReport(enrollmentNo, report.id);
                        reportHistoryModal.classList.add('hidden');
                    });

                    reportHistoryList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error fetching report history:', error);
                reportHistoryList.innerHTML = '<p style="color:var(--error)">Failed to load history.</p>';
            });
    }

    function loadSavedReport(enrollmentNo, reportId) {
        loadingSpinner.classList.remove('hidden');

        fetch(`/api/report/load/${enrollmentNo}/${reportId}`)
            .then(response => response.json())
            .then(report => {
                loadingSpinner.classList.add('hidden');
                if (report.error) {
                    alert(`Error loading report: ${report.error}`);
                } else {
                    displayNewReport(report);
                }
            })
            .catch(error => {
                loadingSpinner.classList.add('hidden');
                console.error('Error loading saved report:', error);
                alert('Failed to load report.');
            });
    }

    // --- Handle "Generate Report" button click ---
    generateReportBtn.addEventListener('click', () => {
        const enrollmentNo = studentSelector.value;
        if (!enrollmentNo) return;

        loadingSpinner.classList.remove('hidden');
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
                    displayNewReport(report);
                }
            })
            .catch(error => {
                loadingSpinner.classList.add('hidden');
                console.error('Report generation error:', error);
                alert(`An unexpected error occurred: ${error.message}`);
            });
        if (enrollmentNo) {
            // Also load chat history for this student
            loadChatSessions(enrollmentNo);
        } else {
            alert('Please select a student first.');
        }
    });

    // New Chat Button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            currentSessionId = null;
            chatHistory.innerHTML = '';
            // Remove active class from all sessions
            document.querySelectorAll('.session-item').forEach(item => item.classList.remove('active'));
            appendMessage('Start a new conversation!', 'ai', false, true);
        });
    }

    // --- Handle "Analyze Job Application" button click ---
    analyzeJobBtn.addEventListener('click', () => {
        const jobDescription = jobApplicationInput.value.trim();
        const enrollmentNo = studentSelector.value;

        if (!jobDescription) {
            alert('Please paste a job description.');
            return;
        }
        if (!enrollmentNo) {
            alert('Please select a student first.');
            return;
        }

        loadingSpinner.classList.remove('hidden');
        jobAnalysisContainer.classList.add('hidden');

        fetch('/api/job-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollment_no: enrollmentNo, job_description: jobDescription })
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
                    displayJobAnalysis(data.data);
                }
            })
            .catch(error => {
                loadingSpinner.classList.add('hidden');
                console.error('Job analysis error:', error);
                alert(`An unexpected error occurred: ${error.message}`);
            });
    });

    // --- Chat form submission ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enrollmentNo = studentSelector.value;
        const question = chatInput.value.trim();

        if (!question || !enrollmentNo) {
            if (!enrollmentNo) alert('Please select a student first.');
            return;
        }

        // If not already in chat tab, switch to it
        const chatTabLink = document.querySelector('.nav-link[href="#chat"]');
        if (chatTabLink && !chatTabLink.classList.contains('active')) {
            chatTabLink.click();
        }

        appendMessage(question, 'user');
        chatInput.value = '';
        appendMessage('Thinking...', 'ai', true);

        fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enrollment_no: enrollmentNo,
                question: question,
                session_id: currentSessionId
            })
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

                if (data.success) {
                    appendMessage(data.answer, 'ai', false, true);

                    // Update session ID if it was a new session
                    if (!currentSessionId && data.session_id) {
                        currentSessionId = data.session_id;
                        // Reload sessions list to show the new one
                        loadChatSessions(enrollmentNo);
                    }
                } else {
                    appendMessage(`Error: ${data.error}`, 'ai');
                }

                chatHistory.scrollTop = chatHistory.scrollHeight;
            })
            .catch(error => {
                console.error('Chat error:', error);
                const loadingElement = chatHistory.querySelector('.loading');
                if (loadingElement) {
                    loadingElement.parentElement.remove();
                }
                appendMessage('Sorry, an error occurred while fetching the answer.', 'ai', false, true);
            });
    });

    // --- Chat History Functions ---
    function loadChatSessions(enrollmentNo) {
        if (!chatSessionsList) return;

        fetch(`/api/chat/history/${enrollmentNo}`)
            .then(res => res.json())
            .then(sessions => {
                chatSessionsList.innerHTML = '';
                if (sessions.error) {
                    console.error(sessions.error);
                    return;
                }

                if (sessions.length === 0) {
                    chatSessionsList.innerHTML = '<div style="padding:1rem; color:var(--text-tertiary); text-align:center;">No history</div>';
                    return;
                }

                sessions.forEach(session => {
                    const el = document.createElement('div');
                    el.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
                    el.innerHTML = `
                        <div class="session-title">${session.title}</div>
                        <div class="session-date">${new Date(session.timestamp).toLocaleDateString()} ${new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    `;
                    el.addEventListener('click', () => {
                        loadChatMessages(session);
                        // Update active state
                        document.querySelectorAll('.session-item').forEach(item => item.classList.remove('active'));
                        el.classList.add('active');
                    });
                    chatSessionsList.appendChild(el);
                });
            })
            .catch(err => console.error('Error loading chat sessions:', err));
    }

    function loadChatMessages(session) {
        currentSessionId = session.id;
        chatHistory.innerHTML = '';

        session.messages.forEach(msg => {
            appendMessage(msg.text, msg.sender, false, true); // Assuming stored messages are markdown safe or plain text
        });

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // --- IMPROVED: Initialize Mermaid Flowchart with Pan/Zoom ---
    function initializeMermaidFlowchart(flowchartId, mermaidCode) {
        const flowchartCanvas = document.getElementById(flowchartId);
        if (!flowchartCanvas) {
            console.error(`Flowchart canvas not found: ${flowchartId}`);
            return;
        }

        // Clean up existing pan-zoom instance if any
        if (panZoomInstances.has(flowchartId)) {
            try {
                panZoomInstances.get(flowchartId).destroy();
                panZoomInstances.delete(flowchartId);
            } catch (e) {
                console.warn('Error destroying previous pan-zoom instance:', e);
            }
        }

        // Clear existing content
        flowchartCanvas.innerHTML = '';

        // Create mermaid div
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = mermaidCode;
        flowchartCanvas.appendChild(mermaidDiv);

        // Render mermaid diagram
        mermaid.run({
            nodes: [mermaidDiv]
        }).then(() => {
            // Wait for render to complete
            setTimeout(() => {
                const svg = flowchartCanvas.querySelector('svg');
                if (!svg) {
                    console.error('SVG not found after mermaid render');
                    return;
                }

                try {
                    // Get the actual SVG dimensions
                    const bbox = svg.getBBox();
                    const padding = 40;

                    // Set viewBox with padding to prevent cutoff
                    svg.setAttribute('viewBox',
                        `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
                    );

                    // Remove fixed dimensions to allow responsive sizing
                    svg.removeAttribute('width');
                    svg.removeAttribute('height');
                    svg.style.width = '100%';
                    svg.style.height = '100%';
                    svg.style.maxWidth = 'none';
                    svg.style.maxHeight = 'none';

                    // Initialize svg-pan-zoom
                    if (typeof svgPanZoom !== 'undefined') {
                        setTimeout(() => {
                            try {
                                const panZoomInstance = svgPanZoom(svg, {
                                    zoomEnabled: true,
                                    controlIconsEnabled: false,
                                    fit: true,
                                    center: true,
                                    minZoom: 0.1,
                                    maxZoom: 10,
                                    zoomScaleSensitivity: 0.3,
                                    dblClickZoomEnabled: true,
                                    mouseWheelZoomEnabled: true,
                                    preventMouseEventsDefault: true,
                                    panEnabled: true,
                                    refreshRate: 'auto'
                                });

                                // Store instance for cleanup
                                panZoomInstances.set(flowchartId, panZoomInstance);

                                // Apply initial zoom and center
                                setTimeout(() => {
                                    panZoomInstance.resize();
                                    panZoomInstance.fit();
                                    panZoomInstance.center();
                                    // Zoom in slightly for better readability
                                    panZoomInstance.zoomBy(1.2);
                                }, 100);

                                // Add control instructions
                                if (!flowchartCanvas.querySelector('.flowchart-instructions')) {
                                    const instructions = document.createElement('div');
                                    instructions.className = 'flowchart-instructions';
                                    instructions.innerHTML = '🖱️ Drag to pan • Scroll to zoom • Double-click to reset';
                                    flowchartCanvas.appendChild(instructions);
                                }
                            } catch (panZoomError) {
                                console.error('Pan-zoom initialization error:', panZoomError);
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Error setting up flowchart:', error);
                }
            }, 200);
        }).catch(error => {
            console.error('Mermaid rendering error:', error);
            flowchartCanvas.innerHTML = '<p style="color: var(--danger-color); padding: 20px;">Error rendering flowchart. Please check the diagram syntax.</p>';
        });
    }

    // --- Display Report Function ---
    function displayNewReport(report) {
        // Update Profile Card
        document.getElementById('student-name').textContent = report.name || 'Student Name';
        document.getElementById('student-id').textContent = `ID: ${report.enrollment_no || 'N/A'}`;
        document.getElementById('student-phone').textContent = report.phone || '+91 9876543210';
        document.getElementById('student-email').textContent = report.email || 'student@example.com';

        if (report.photo) {
            document.getElementById('student-photo').src = report.photo;
        }

        // Update Summary Tab
        document.getElementById('hr-summary').innerHTML = convertMarkdownToHTML(report.overall_summary || 'No summary available.');

        const strengthsList = document.getElementById('summary-strengths');
        strengthsList.innerHTML = '';
        if (report.analysis?.strengths) {
            report.analysis.strengths.forEach(strength => {
                const li = document.createElement('li');
                li.innerHTML = convertMarkdownToHTML(strength);
                strengthsList.appendChild(li);
            });
        }

        const weaknessesList = document.getElementById('summary-weaknesses');
        weaknessesList.innerHTML = '';
        if (report.analysis?.weaknesses) {
            report.analysis.weaknesses.forEach(weakness => {
                const li = document.createElement('li');
                li.innerHTML = convertMarkdownToHTML(weakness);
                weaknessesList.appendChild(li);
            });
        }

        // Update Skills Tab
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = '';
        if (report.skills) {
            report.skills.forEach(skill => {
                const skillRow = document.createElement('div');
                skillRow.className = 'skill-row';
                skillRow.innerHTML = `
                    <div class="skill-cell">${skill.name || 'Skill'}</div>
                    <div class="skill-cell">${skill.category || 'General'}</div>
                    <div class="skill-cell">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${skill.performance || 50}%"></div>
                        </div>
                        <span class="percentage">${skill.performance || 50}%</span>
                    </div>
                `;
                skillsList.appendChild(skillRow);
            });
        }

        // Update Performance Tab (CGPA Chart)
        if (report.cgpa_trend) {
            const ctx = document.getElementById('cgpa-trend-chart');
            if (ctx) {
                if (cgpaTrendChart) {
                    cgpaTrendChart.destroy();
                }
                cgpaTrendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: report.cgpa_trend.labels || ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
                        datasets: [{
                            label: 'CGPA',
                            data: report.cgpa_trend.values || [7.5, 7.8, 8.0, 8.2, 8.1, 8.3],
                            backgroundColor: 'rgba(0, 229, 255, 0.2)',
                            borderColor: 'rgba(0, 229, 255, 1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 6,
                                max: 10
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        }

        // Update Action Plan Tab with IMPROVED flowchart rendering
        const actionPlanContent = document.querySelector('.action-plan-content');
        actionPlanContent.innerHTML = '';
        if (report.actionable_advice?.recommendations) {
            report.actionable_advice.recommendations.forEach((recommendation, index) => {
                const actionItem = document.createElement('div');
                actionItem.className = 'action-item';

                const flowchartId = `flowchart-${index}`;
                actionItem.innerHTML = `
                    <h4>${recommendation.title || 'Action Item'}</h4>
                    <p>${convertMarkdownToHTML(recommendation.description || '')}</p>
                    ${recommendation.mermaid_flowchart ? `
                        <div class="flowchart-container">
                            <div class="flowchart-canvas" id="${flowchartId}"></div>
                        </div>
                    ` : ''}
                `;
                actionPlanContent.appendChild(actionItem);

                // Render Mermaid diagram using improved function
                if (recommendation.mermaid_flowchart) {
                    // Delay to ensure DOM is ready
                    setTimeout(() => {
                        initializeMermaidFlowchart(flowchartId, recommendation.mermaid_flowchart);
                    }, 100);
                }
            });
        }

        // Update Learning Path Tab
        const learningPathContent = document.querySelector('.learning-path-content');
        learningPathContent.innerHTML = '';
        if (report.learning_path) {
            report.learning_path.forEach(path => {
                const pathItem = document.createElement('div');
                pathItem.className = 'path-item';
                pathItem.innerHTML = `
                    <h4>${path.title || 'Learning Path'}</h4>
                    <p>${convertMarkdownToHTML(path.description || '')}</p>
                `;

                if (path.resources) {
                    const resourcesDiv = document.createElement('div');
                    resourcesDiv.className = 'recommended-resources';
                    resourcesDiv.innerHTML = '<h5>Recommended Resources:</h5>';

                    path.resources.forEach(resource => {
                        const resourceItem = document.createElement('div');
                        resourceItem.className = 'resource-item';
                        resourceItem.innerHTML = `
                            <div class="resource-info">
                                <h6>${resource.title || 'Resource'}</h6>
                                <p>${resource.description || ''}</p>
                            </div>
                            <button class="btn btn-primary start-learning-btn" onclick="window.open('${resource.url}', '_blank')">
                                Start Learning
                            </button>
                        `;
                        resourcesDiv.appendChild(resourceItem);
                    });
                    pathItem.appendChild(resourcesDiv);
                }

                learningPathContent.appendChild(pathItem);
            });
        }
    }

    // --- Load Performance Charts ---
    async function loadPerformanceCharts(enrollmentNo) {
        if (!enrollmentNo) return;

        if (dsaPerformanceChart) {
            dsaPerformanceChart.destroy();
            dsaPerformanceChart = null;
        }

        try {
            const response = await fetch(`/api/dashboard/metrics/${enrollmentNo}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const dashboardData = await response.json();

            const dsaCtx = document.getElementById('dsa-performance-chart');
            if (dsaCtx && dashboardData.coding_profiles?.leetcode?.score !== undefined) {
                dsaPerformanceChart = new Chart(dsaCtx, {
                    type: 'bar',
                    data: {
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
                                max: 10
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading performance charts:', error);
        }
    }

    // --- Load Dashboard Metrics ---
    async function loadDashboardData() {
        const totalStudentsEl = document.getElementById('total-students-count');
        const reportsGeneratedEl = document.getElementById('reports-generated-count');
        const jobAnalysesEl = document.getElementById('job-analyses-count');

        try {
            const studentsResponse = await fetch('/api/students');
            const students = await studentsResponse.json();
            if (totalStudentsEl) totalStudentsEl.textContent = students.length;

            if (reportsGeneratedEl) reportsGeneratedEl.textContent = '0';
            if (jobAnalysesEl) jobAnalysesEl.textContent = '0';

        } catch (error) {
            console.error('Error loading dashboard metrics:', error);
        }
    }

    // --- Helper Functions ---
    function appendMessage(text, sender, isLoading = false, useMarkdown = false) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message', `${sender}-message`);

        const messageP = document.createElement('p');
        if (useMarkdown) {
            messageP.innerHTML = convertMarkdownToHTML(text);
        } else {
            messageP.textContent = text;
        }

        if (isLoading) {
            messageP.classList.add('loading');
        }

        messageWrapper.appendChild(messageP);
        chatHistory.appendChild(messageWrapper);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // --- Keep existing display functions for backward compatibility ---
    function displayReport(report) {
        console.warn('displayReport is deprecated. Use displayNewReport instead.');
        displayNewReport(report);
    }

    // --- Display Job Analysis Results ---
    function displayJobAnalysis(data) {
        console.log("Job Analysis Data:", data);

        const strengthsList = document.getElementById('job-strengths-list');
        if (strengthsList && data.your_core_strengths_for_this_role) {
            strengthsList.innerHTML = '';
            data.your_core_strengths_for_this_role.forEach(strength => {
                const li = document.createElement('li');
                const text = typeof strength === 'string' ? strength :
                    (strength.strength || strength.text || strength.description || JSON.stringify(strength));
                li.textContent = text;
                strengthsList.appendChild(li);
            });
        }

        const weaknessesList = document.getElementById('job-weaknesses-list');
        if (weaknessesList && data.strategic_areas_for_growth) {
            weaknessesList.innerHTML = '';
            data.strategic_areas_for_growth.forEach(area => {
                const li = document.createElement('li');
                const text = typeof area === 'string' ? area : (area.area_to_develop || JSON.stringify(area));
                li.textContent = text;
                weaknessesList.appendChild(li);
            });
        }

        const enhancementsList = document.getElementById('job-enhancements-list');
        if (enhancementsList && data.strategic_overview) {
            enhancementsList.innerHTML = '';

            if (data.strategic_overview.summary) {
                const summaryItem = document.createElement('div');
                summaryItem.className = 'enhancement-item';
                summaryItem.innerHTML = `<strong>Summary:</strong> ${data.strategic_overview.summary}`;
                enhancementsList.appendChild(summaryItem);
            }

            if (data.strategic_overview.your_key_opportunity) {
                const opportunityItem = document.createElement('div');
                opportunityItem.className = 'enhancement-item';
                opportunityItem.innerHTML = `<strong>Key Opportunity:</strong> ${data.strategic_overview.your_key_opportunity}`;
                enhancementsList.appendChild(opportunityItem);
            }
        }

        const youtubeContainer = document.getElementById('job-youtube-recommendations');
        if (youtubeContainer && data.video_recommendations) {
            youtubeContainer.innerHTML = '';

            data.video_recommendations.forEach(topic => {
                // Create Topic Section
                const topicSection = document.createElement('div');
                topicSection.className = 'video-topic-section';

                const topicTitle = document.createElement('h4');
                topicTitle.className = 'video-topic-title';
                topicTitle.textContent = topic.topic || 'Recommended Topic';
                topicSection.appendChild(topicTitle);

                const topicReason = document.createElement('p');
                topicReason.className = 'video-topic-reason';
                topicReason.textContent = topic.reason || '';
                topicSection.appendChild(topicReason);

                // Video Grid for this topic
                const videoGrid = document.createElement('div');
                videoGrid.className = 'video-grid';

                if (topic.videos && topic.videos.length > 0) {
                    topic.videos.forEach(video => {
                        const videoCard = document.createElement('div');
                        videoCard.className = 'youtube-card';

                        const embedUrl = video.embed_url || video.url.replace('watch?v=', 'embed/');
                        const title = video.title || 'Video Tutorial';

                        videoCard.innerHTML = `
                            <div class="video-wrapper">
                                <iframe 
                                    src="${embedUrl}" 
                                    title="${title}" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                                </iframe>
                            </div>
                            <div class="video-info">
                                <h5>${title}</h5>
                                <p>${video.reason || ''}</p>
                            </div>
                        `;
                        videoGrid.appendChild(videoCard);
                    });
                } else {
                    videoGrid.innerHTML = '<p>No videos found for this topic.</p>';
                }

                topicSection.appendChild(videoGrid);
                youtubeContainer.appendChild(topicSection);
            });
        }
    }

    // --- Dashboard Logic ---
    const refreshDashboardBtn = document.getElementById('refresh-dashboard-btn');
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', loadDashboardData);
    }

    function loadDashboardData() {
        console.log("Loading dashboard data...");
        fetch('/api/dashboard/students')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Error loading dashboard:", data.error);
                    return;
                }

                // Update Summary Cards
                const totalStudentsEl = document.getElementById('total-students-count');
                if (totalStudentsEl) totalStudentsEl.textContent = data.total_students;

                const classAvgEl = document.getElementById('class-avg-cgpa');
                if (classAvgEl) classAvgEl.textContent = data.class_average_cgpa;

                // Count reports ready
                const reportsReady = data.students.filter(s => s.report_status === 'Generated').length;
                const reportsReadyEl = document.getElementById('reports-ready-count');
                if (reportsReadyEl) reportsReadyEl.textContent = reportsReady;

                // Populate Student Table
                const tableBody = document.getElementById('student-table-body');
                if (tableBody) {
                    tableBody.innerHTML = '';

                    data.students.forEach(student => {
                        const row = document.createElement('tr');

                        // Status Badges
                        const reportBadgeClass = student.report_status === 'Generated' ? 'badge-success' : 'badge-pending';
                        const cgpaClass = parseFloat(student.cgpa) >= 8.0 ? 'text-success' : (parseFloat(student.cgpa) >= 6.0 ? 'text-warning' : 'text-danger');

                        row.innerHTML = `
                            <td><div class="student-name-cell">${student.name}</div></td>
                            <td>${student.enrollment_no}</td>
                            <td class="${cgpaClass}"><strong>${student.cgpa}</strong></td>
                            <td>
                                <div class="skills-tags">
                                    ${student.key_skills.map(skill => `<span class="skill-tag-mini">${skill}</span>`).join('')}
                                </div>
                            </td>
                            <td><span class="badge ${reportBadgeClass}">${student.report_status}</span></td>
                            <td><span class="badge badge-neutral">${student.resume_count} Resumes</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-profile-btn" data-enrollment="${student.enrollment_no}">
                                    View Profile
                                </button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });

                    // Add Event Listeners to "View Profile" buttons
                    document.querySelectorAll('.view-profile-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const enrollmentNo = e.target.getAttribute('data-enrollment');
                            // Switch to Reports tab
                            const reportsTab = document.querySelector('.nav-link[href="#reports"]');
                            if (reportsTab) reportsTab.click();

                            // Select student in dropdown
                            if (studentSelector) {
                                studentSelector.value = enrollmentNo;
                                // Trigger change event to load student data
                                studentSelector.dispatchEvent(new Event('change'));
                            }
                        });
                    });
                }
            })
            .catch(err => console.error("Failed to load dashboard data:", err));
    }

    // Initial load if dashboard is active
    if (document.querySelector('#dashboard.active')) {
        loadDashboardData();
    }

}); // End of DOMContentLoaded