// job_listings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const jobListingsSection = document.getElementById('job-listings');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const jobCategorySections = document.querySelectorAll('.job-category-section');
    const studentSelector = document.getElementById('student-selector');

    // --- Sample Job Listings Data (Simulated) ---
    // --- Sample Job Listings Data (Simulated) ---
    const sampleJobs = [
        // --- On-Campus Jobs ---
        {
            id: 1,
            title: "Software Engineer Intern",
            company: "TechCorp",
            location: "New Delhi, India",
            type: "On-Campus",
            salary: "₹12-15 LPA",
            description: "Join our dynamic engineering team to build scalable software solutions. You will work closely with senior engineers to design, develop, and deploy high-quality code.",
            responsibilities: [
                "Collaborate with cross-functional teams to define, design, and ship new features.",
                "Write clean, maintainable, and efficient code.",
                "Participate in code reviews and technical discussions.",
                "Troubleshoot and debug applications."
            ],
            requirements: [
                "Pursuing B.Tech in CS/IT or related field.",
                "Strong proficiency in Python or Java.",
                "Solid understanding of Data Structures and Algorithms.",
                "Familiarity with RESTful APIs and Git."
            ],
            benefits: ["Health Insurance", "Flexible Work Hours", "Free Meals", "Learning Allowance"],
            requiredSkills: ["Python", "React", "DSA", "JavaScript"]
        },
        {
            id: 2,
            title: "Data Analyst",
            company: "DataInsights Inc.",
            location: "Gurgaon, India",
            type: "On-Campus",
            salary: "₹8-10 LPA",
            description: "We are looking for a passionate Data Analyst to turn data into information, information into insight, and insight into business decisions.",
            responsibilities: [
                "Interpret data, analyze results using statistical techniques and provide ongoing reports.",
                "Develop and implement databases, data collection systems, data analytics and other strategies that optimize statistical efficiency and quality.",
                "Acquire data from primary or secondary data sources and maintain databases/data systems."
            ],
            requirements: [
                "Strong knowledge of and experience with reporting packages (Business Objects etc), databases (SQL etc), programming (XML, Javascript, or ETL frameworks).",
                "Knowledge of statistics and experience using statistical packages for analyzing datasets (Excel, SPSS, SAS etc).",
                "Strong analytical skills with the ability to collect, organize, analyze, and disseminate significant amounts of information with attention to detail and accuracy."
            ],
            benefits: ["Performance Bonus", "Health Insurance", "Team Outings"],
            requiredSkills: ["Python", "SQL", "Tableau", "Statistics"]
        },
        {
            id: 3,
            title: "Frontend Developer",
            company: "WebSolutions",
            location: "Mumbai, India",
            type: "On-Campus",
            salary: "₹10-12 LPA",
            description: "We are seeking a Frontend Developer to join our creative team. You will be responsible for building the 'client-side' of our web applications.",
            responsibilities: [
                "Use markup languages like HTML to create user-friendly web pages.",
                "Maintain and improve website.",
                "Optimize applications for maximum speed.",
                "Design mobile-based features."
            ],
            requirements: [
                "Proven work experience as a Front-end developer.",
                "Hands on experience with markup languages.",
                "Experience with JavaScript, CSS and jQuery.",
                "Familiarity with browser testing and debugging."
            ],
            benefits: ["Remote Work Options", "Stock Options", "Gym Membership"],
            requiredSkills: ["JavaScript", "React", "CSS", "HTML", "Vue.js"]
        },
        {
            id: 4,
            title: "QA Engineer",
            company: "QualityFirst Ltd.",
            location: "Pune, India",
            type: "On-Campus",
            salary: "₹6-8 LPA",
            description: "We are looking for a QA Engineer to assess software quality through manual and automated testing.",
            responsibilities: [
                "Review requirements, specifications and technical design documents to provide timely and meaningful feedback.",
                "Create detailed, comprehensive and well-structured test plans and test cases.",
                "Estimate, prioritize, plan and coordinate testing activities."
            ],
            requirements: [
                "Proven work experience in software development.",
                "Proven work experience in software quality assurance.",
                "Strong knowledge of software QA methodologies, tools and processes.",
                "Experience in writing clear, concise and comprehensive test plans and test cases."
            ],
            benefits: ["Health Insurance", "Paid Time Off", "Certification Support"],
            requiredSkills: ["Manual Testing", "Automation Testing", "Selenium", "JIRA"]
        },
        {
            id: 5,
            title: "DevOps Associate",
            company: "CloudBridge",
            location: "Hyderabad, India",
            type: "On-Campus",
            salary: "₹14-18 LPA",
            description: "Join our DevOps team to help us build functional systems that improve customer experience.",
            responsibilities: [
                "Deploy updates and fixes.",
                "Provide technical support Level 2.",
                "Build tools to reduce occurrences of errors and improve customer experience.",
                "Develop software to integrate with internal back-end systems."
            ],
            requirements: [
                "Work experience as a DevOps Engineer or similar software engineering role.",
                "Good knowledge of Ruby or Python.",
                "Working knowledge of databases and SQL.",
                "Problem-solving attitude."
            ],
            benefits: ["Relocation Assistance", "Stock Options", "Free Snacks"],
            requiredSkills: ["Linux", "Docker", "CI/CD", "AWS Basics"]
        },

        // --- Off-Campus Jobs ---
        {
            id: 6,
            title: "Backend Developer",
            company: "CloudStartups",
            location: "Bangalore, India",
            type: "Off-Campus",
            salary: "₹18-25 LPA",
            description: "We are looking for an experienced Backend Developer to join our core team. You will be responsible for the server-side logic and integration of the front-end elements.",
            responsibilities: [
                "Integration of user-facing elements developed by a front-end developers with server side logic.",
                "Building reusable code and libraries for future use.",
                "Optimization of the application for maximum speed and scalability.",
                "Implementation of security and data protection."
            ],
            requirements: [
                "Basic understanding of front-end technologies and platforms, such as JavaScript, HTML5, and CSS3.",
                "Good understanding of server-side CSS preprocessors, such as LESS and SASS.",
                "User authentication and authorization between multiple systems, servers, and environments.",
                "Integration of multiple data sources and databases into one system."
            ],
            benefits: ["Competitive Salary", "Equity", "Remote First"],
            requiredSkills: ["Node.js", "AWS", "SQL", "REST APIs", "MongoDB"]
        },
        {
            id: 7,
            title: "Machine Learning Engineer",
            company: "AIFrontiers",
            location: "Chennai, India",
            type: "Off-Campus",
            salary: "₹20-30 LPA",
            description: "We are looking for a Machine Learning Engineer to help us build the next generation of AI-powered products.",
            responsibilities: [
                "Designing and developing machine learning and deep learning systems.",
                "Running machine learning tests and experiments.",
                "Implementing appropriate ML algorithms.",
                "Study and transform data science prototypes."
            ],
            requirements: [
                "Proven experience as a Machine Learning Engineer or similar role.",
                "Understanding of data structures, data modeling and software architecture.",
                "Deep knowledge of math, probability, statistics and algorithms.",
                "Ability to write robust code in Python, Java and R."
            ],
            benefits: ["Top-tier Health Insurance", "Conference Budget", "Latest Hardware"],
            requiredSkills: ["Python", "ML", "TensorFlow", "PyTorch", "Scikit-learn"]
        },
        {
            id: 8,
            title: "Full Stack Developer",
            company: "AppVenture",
            location: "Remote",
            type: "Off-Campus",
            salary: "₹15-22 LPA",
            description: "We are looking for a Full Stack Developer to produce scalable software solutions. You’ll be part of a cross-functional team that’s responsible for the full software development life cycle, from conception to deployment.",
            responsibilities: [
                "Work with development teams and product managers to ideate software solutions.",
                "Design client-side and server-side architecture.",
                "Build the front-end of applications through appealing visual design.",
                "Develop and manage well-functioning databases and applications."
            ],
            requirements: [
                "Proven experience as a Full Stack Developer or similar role.",
                "Experience developing desktop and mobile applications.",
                "Familiarity with common stacks.",
                "Knowledge of multiple front-end languages and libraries (e.g. HTML/ CSS, JavaScript, XML, jQuery)."
            ],
            benefits: ["Unlimited PTO", "Home Office Stipend", "Wellness Budget"],
            requiredSkills: ["JavaScript", "React", "Node.js", "Express", "PostgreSQL", "Docker"]
        },
        {
            id: 9,
            title: "Cybersecurity Specialist",
            company: "SecureNet",
            location: "Kolkata, India",
            type: "Off-Campus",
            salary: "₹12-18 LPA",
            description: "We are looking for a Cybersecurity Specialist to monitor our computer networks and systems for threats and security breaches.",
            responsibilities: [
                "Monitor computer networks for security issues.",
                "Investigate security breaches and other cybersecurity incidents.",
                "Install security measures and operate software to protect systems and information infrastructure, including firewalls and data encryption programs.",
                "Document security breaches and assess the damage they cause."
            ],
            requirements: [
                "Proven work experience as a Cybersecurity Specialist or similar role.",
                "Experience with firewalls, Internet VPN’s remote implementation, troubleshooting, and problem resolution is desired.",
                "Ability to handle proprietary and sensitive information in a confidential manner.",
                "Hands-on experience in security systems, including firewalls, intrusion detection systems, anti-virus software, authentication systems, log management, content filtering, etc."
            ],
            benefits: ["Certification Reimbursement", "Secure Work Environment", "Health Benefits"],
            requiredSkills: ["Network Security", "Ethical Hacking", "SIEM Tools", "Incident Response"]
        },
        {
            id: 10,
            title: "Mobile App Developer",
            company: "MobileMasters",
            location: "Jaipur, India",
            type: "Off-Campus",
            salary: "₹10-15 LPA",
            description: "We are looking for a Mobile App Developer to design and build the next generation of our mobile applications.",
            responsibilities: [
                "Support the entire application lifecycle (concept, design, test, release and support).",
                "Produce fully functional mobile applications writing clean code.",
                "Gather specific requirements and suggest solutions.",
                "Write unit and UI tests to identify malfunctions."
            ],
            requirements: [
                "Proven work experience as a Mobile developer.",
                "Demonstrable portfolio of released applications on the App store or the Android market.",
                "In-depth knowledge of at least one programming language like Swift and Java.",
                "Experience with third-party libraries and APIs."
            ],
            benefits: ["Flexible Schedule", "Device Lab Access", "Annual Retreat"],
            requiredSkills: ["Flutter", "Dart", "Firebase", "iOS", "Android"]
        }
    ];

    // --- Sample Student Profile Data (Simulated) ---
    // This should ideally come from the main application state or be fetched based on the selected student
    // Example profile matching some jobs, missing others
    const sampleStudentProfile = {
        keySkills: ["Python", "JavaScript", "React", "Node.js", "SQL", "DSA", "Git", "HTML", "CSS"] // Example skills from resume
    };

    // --- Modal Elements ---
    const applyModal = document.getElementById('apply-modal');
    const closeApplyModalBtn = document.getElementById('close-apply-modal');
    const applyCompany = document.getElementById('apply-company');
    const applyRole = document.getElementById('apply-role');
    const applySalary = document.getElementById('apply-salary');
    const applyDescription = document.getElementById('apply-description');
    const applyResponsibilities = document.getElementById('apply-responsibilities');
    const applyRequirements = document.getElementById('apply-requirements');
    const applyBenefits = document.getElementById('apply-benefits');
    const generateResumeBtn = document.getElementById('generate-resume-btn');

    const resumeModal = document.getElementById('resume-modal');
    const closeResumeModalBtn = document.getElementById('close-resume-modal');
    const resumeContent = document.getElementById('resume-content');
    const downloadResumeBtn = document.getElementById('download-resume-btn');

    let currentJobForApplication = null;

    // --- Tab Switching Logic ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetCategory = button.getAttribute('data-category');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show corresponding category section, hide others
            jobCategorySections.forEach(section => {
                if (section.getAttribute('data-category') === targetCategory) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });

            // Load jobs for the active tab
            loadJobsForCategory(targetCategory);
        });
    });

    // --- Function to Load Jobs for a Category ---
    function loadJobsForCategory(category) {
        // Clear existing listings
        const recommendedContainer = document.getElementById(`${category}-recommended-listings`);
        const nonRecommendedContainer = document.getElementById(`${category}-non-recommended-listings`);
        if (recommendedContainer) recommendedContainer.innerHTML = '';
        if (nonRecommendedContainer) nonRecommendedContainer.innerHTML = '';

        // Filter jobs by category
        const categoryJobs = sampleJobs.filter(job => job.type.toLowerCase().includes(category));

        // Categorize jobs based on recommendation logic
        const recommendedJobs = [];
        const nonRecommendedJobs = [];

        categoryJobs.forEach(job => {
            if (isJobRecommended(job, sampleStudentProfile)) {
                recommendedJobs.push(job);
            } else {
                nonRecommendedJobs.push(job);
            }
        });

        // Populate the UI
        if (recommendedContainer) {
            recommendedJobs.forEach(job => {
                recommendedContainer.appendChild(createJobCard(job, true));
            });
        }
        if (nonRecommendedContainer) {
            nonRecommendedJobs.forEach(job => {
                nonRecommendedContainer.appendChild(createJobCard(job, false));
            });
        }
    }

    // --- Function to Determine if Job is Recommended ---
    function isJobRecommended(job, studentProfile) {
        // Simple logic: if at least 2 of the required skills are in the student's key skills, recommend it.
        const requiredSkillsLower = job.requiredSkills.map(skill => skill.toLowerCase());
        const studentSkillsLower = studentProfile.keySkills.map(skill => skill.toLowerCase());
        const matchingSkills = requiredSkillsLower.filter(skill => studentSkillsLower.includes(skill));
        return matchingSkills.length >= 2; // Adjust threshold as needed
    }

    // --- Function to Create a Job Card Element ---
    function createJobCard(job, isRecommended) {
        const card = document.createElement('div');
        card.className = `job-card ${isRecommended ? 'recommended' : 'non-recommended'}`;

        card.innerHTML = `
            <h4>${job.title}</h4>
            <p class="company">${job.company}</p>
            <p class="location">${job.location}</p>
            <p class="salary-preview">${job.salary || 'Salary not disclosed'}</p>
            <p class="${isRecommended ? 'aligns-with' : 'mismatch'}">
                ${isRecommended
                ? `Aligns with: ${job.requiredSkills.join(', ')}`
                : `Requires: ${job.requiredSkills.join(', ')}`}
            </p>
            <div class="card-actions">
                <button class="btn btn-outline view-details-btn">View Details</button>
                <button class="btn ${isRecommended ? 'btn-primary' : 'btn-secondary'} apply-btn">
                    Apply
                </button>
            </div>
        `;

        // Add event listeners
        const applyButton = card.querySelector('.apply-btn');
        applyButton.addEventListener('click', (e) => {
            e.preventDefault();
            openApplyModal(job);
        });

        const viewDetailsButton = card.querySelector('.view-details-btn');
        viewDetailsButton.addEventListener('click', (e) => {
            e.preventDefault();
            openApplyModal(job);
        });

        return card;
    }

    // --- Modal Logic ---
    function openApplyModal(job) {
        currentJobForApplication = job;
        applyCompany.textContent = job.company;
        applyRole.textContent = job.title;
        applySalary.textContent = job.salary || 'Competitive Salary';
        applyDescription.textContent = job.description;

        // Populate Lists
        populateList(applyResponsibilities, job.responsibilities);
        populateList(applyRequirements, job.requirements);
        populateList(applyBenefits, job.benefits);

        applyModal.classList.remove('hidden');
    }

    function populateList(element, items) {
        element.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                element.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Not specified';
            element.appendChild(li);
        }
    }

    if (closeApplyModalBtn) {
        closeApplyModalBtn.addEventListener('click', () => {
            applyModal.classList.add('hidden');
        });
    }

    if (closeResumeModalBtn) {
        closeResumeModalBtn.addEventListener('click', () => {
            resumeModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === applyModal) applyModal.classList.add('hidden');
        if (e.target === resumeModal) resumeModal.classList.add('hidden');
    });

    // --- Generate Resume Logic ---
    if (generateResumeBtn) {
        generateResumeBtn.addEventListener('click', () => {
            const enrollmentNo = studentSelector.value;
            if (!enrollmentNo) {
                alert('Please select a student first.');
                return;
            }

            if (!currentJobForApplication) return;

            // Show loading state
            generateResumeBtn.disabled = true;
            generateResumeBtn.textContent = 'Generating...';

            fetch('/api/resume/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollment_no: enrollmentNo,
                    job_description: currentJobForApplication.description, // You might want to combine desc + reqs for better tailoring
                    company: currentJobForApplication.company,
                    role: currentJobForApplication.title
                })
            })
                .then(response => response.json())
                .then(data => {
                    generateResumeBtn.disabled = false;
                    generateResumeBtn.textContent = 'Generate Best Fit Resume & Apply';

                    if (data.success) {
                        applyModal.classList.add('hidden');
                        showResumeModal(data.resume);
                    } else {
                        alert(`Error generating resume: ${data.error}`);
                    }
                })
                .catch(error => {
                    generateResumeBtn.disabled = false;
                    generateResumeBtn.textContent = 'Generate Best Fit Resume & Apply';
                    console.error('Error:', error);
                    alert('An error occurred while generating the resume.');
                });
        });
    }

    function showResumeModal(markdownContent) {
        resumeContent.innerHTML = marked.parse(markdownContent);
        resumeModal.classList.remove('hidden');

        // Setup download button
        downloadResumeBtn.onclick = () => {
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tailored_Resume_${currentJobForApplication.company}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }

    // --- Resume History Logic ---
    const resumeHistoryBtn = document.getElementById('resume-history-btn');
    const resumeHistoryModal = document.getElementById('resume-history-modal');
    const resumeHistoryList = document.getElementById('resume-history-list');
    const closeResumeHistoryModalBtn = document.getElementById('close-resume-history-modal');

    if (resumeHistoryBtn) {
        resumeHistoryBtn.addEventListener('click', () => {
            const enrollmentNo = studentSelector.value;
            if (!enrollmentNo) {
                alert('Please select a student first.');
                return;
            }
            loadResumeHistory(enrollmentNo);
            resumeHistoryModal.classList.remove('hidden');
        });
    }

    if (closeResumeHistoryModalBtn) {
        closeResumeHistoryModalBtn.addEventListener('click', () => {
            resumeHistoryModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === resumeHistoryModal) resumeHistoryModal.classList.add('hidden');
    });

    function loadResumeHistory(enrollmentNo) {
        resumeHistoryList.innerHTML = '<div class="loading">Loading history...</div>';

        fetch(`/api/resume/history/${enrollmentNo}`)
            .then(response => response.json())
            .then(history => {
                resumeHistoryList.innerHTML = '';
                if (history.length === 0) {
                    resumeHistoryList.innerHTML = '<p style="text-align:center; color:var(--text-tertiary)">No saved resumes found.</p>';
                    return;
                }

                history.forEach(resume => {
                    const item = document.createElement('div');
                    item.className = 'report-item'; // Reuse report-item style

                    const date = new Date(resume.timestamp).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    item.innerHTML = `
                        <div class="report-title">${resume.title}</div>
                        <div class="report-date">${date}</div>
                    `;

                    item.addEventListener('click', () => {
                        showResumeModal(resume.content);
                        resumeHistoryModal.classList.add('hidden');
                    });

                    resumeHistoryList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error fetching resume history:', error);
                resumeHistoryList.innerHTML = '<p style="color:var(--error)">Failed to load history.</p>';
            });
    }

    // --- Initial Load ---
    if (jobListingsSection && jobListingsSection.classList.contains('active')) {
        loadJobsForCategory('on-campus');
    } else if (jobListingsSection) {
        loadJobsForCategory('on-campus');
    }

});