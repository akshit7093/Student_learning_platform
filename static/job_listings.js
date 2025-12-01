// job_listings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const jobListingsSection = document.getElementById('job-listings');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const jobCategorySections = document.querySelectorAll('.job-category-section');
    const studentSelector = document.getElementById('student-selector');

    // --- Sample Job Listings Data (Simulated) ---
    const sampleJobs = [
        // --- On-Campus Jobs ---
        {
            id: 1,
            title: "Software Engineer Intern",
            company: "TechCorp",
            location: "New Delhi, India",
            type: "On-Campus",
            description: "Internship for software development.",
            requiredSkills: ["Python", "React", "DSA", "JavaScript"]
        },
        {
            id: 2,
            title: "Data Analyst",
            company: "DataInsights Inc.",
            location: "Gurgaon, India",
            type: "On-Campus",
            description: "Role involving data analysis and visualization.",
            requiredSkills: ["Python", "SQL", "Tableau", "Statistics"]
        },
        {
            id: 3,
            title: "Frontend Developer",
            company: "WebSolutions",
            location: "Mumbai, India",
            type: "On-Campus",
            description: "Build user interfaces using modern frameworks.",
            requiredSkills: ["JavaScript", "React", "CSS", "HTML", "Vue.js"]
        },
        {
            id: 4,
            title: "QA Engineer",
            company: "QualityFirst Ltd.",
            location: "Pune, India",
            type: "On-Campus",
            description: "Ensure software quality through testing.",
            requiredSkills: ["Manual Testing", "Automation Testing", "Selenium", "JIRA"]
        },
        {
            id: 5,
            title: "DevOps Associate",
            company: "CloudBridge",
            location: "Hyderabad, India",
            type: "On-Campus",
            description: "Support CI/CD pipelines and cloud infrastructure.",
            requiredSkills: ["Linux", "Docker", "CI/CD", "AWS Basics"]
        },

        // --- Off-Campus Jobs ---
        {
            id: 6,
            title: "Backend Developer",
            company: "CloudStartups",
            location: "Bangalore, India",
            type: "Off-Campus",
            description: "Develop and maintain server-side applications.",
            requiredSkills: ["Node.js", "AWS", "SQL", "REST APIs", "MongoDB"]
        },
        {
            id: 7,
            title: "Machine Learning Engineer",
            company: "AIFrontiers",
            location: "Chennai, India",
            type: "Off-Campus",
            description: "Design and deploy ML models for real-world problems.",
            requiredSkills: ["Python", "ML", "TensorFlow", "PyTorch", "Scikit-learn"]
        },
        {
            id: 8,
            title: "Full Stack Developer",
            company: "AppVenture",
            location: "Remote",
            type: "Off-Campus",
            description: "Work on both frontend and backend of web applications.",
            requiredSkills: ["JavaScript", "React", "Node.js", "Express", "PostgreSQL", "Docker"]
        },
        {
            id: 9,
            title: "Cybersecurity Specialist",
            company: "SecureNet",
            location: "Kolkata, India",
            type: "Off-Campus",
            description: "Protect systems and networks from cyber threats.",
            requiredSkills: ["Network Security", "Ethical Hacking", "SIEM Tools", "Incident Response"]
        },
        {
            id: 10,
            title: "Mobile App Developer",
            company: "MobileMasters",
            location: "Jaipur, India",
            type: "Off-Campus",
            description: "Develop cross-platform mobile applications.",
            requiredSkills: ["Flutter", "Dart", "Firebase", "iOS", "Android"]
        }
        // Add more sample jobs here if needed
    ];

    // --- Sample Student Profile Data (Simulated) ---
    // This should ideally come from the main application state or be fetched based on the selected student
    // Example profile matching some jobs, missing others
    const sampleStudentProfile = {
        keySkills: ["Python", "JavaScript", "React", "Node.js", "SQL", "DSA", "Git", "HTML", "CSS"] // Example skills from resume
    };

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
        console.log(`Loading jobs for category: ${category}`);
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
            <p class="type">${job.type}</p>
            <p class="${isRecommended ? 'aligns-with' : 'mismatch'}">
                ${isRecommended
                    ? `Aligns with: ${job.requiredSkills.join(', ')}`
                    : `Requires: ${job.requiredSkills.join(', ')}`}
            </p>
            <button class="btn ${isRecommended ? 'btn-primary' : 'btn-secondary'} apply-btn">
                ${isRecommended ? 'Apply Now' : 'Apply Anyway'}
            </button>
        `;

        // Add event listener to the button
        const applyButton = card.querySelector('.apply-btn');
        applyButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior if it's inside a form
            handleApplyClick(job, isRecommended);
        });

        return card;
    }

    // --- Function to Handle Apply Button Click ---
    function handleApplyClick(job, isRecommended) {
        // Example: Log the action, show an alert, or open the job link in a new tab
        console.log(`Apply button clicked for job: ${job.title} (Category: ${job.type}, Recommended: ${isRecommended})`);
        alert(`You clicked 'Apply ${isRecommended ? 'Now' : 'Anyway'}' for ${job.title} at ${job.company}. This would typically redirect you to the application portal.`);
        // window.open(job.applicationLink, '_blank'); // If you have an application link
    }

    // --- Initial Load ---
    // Load jobs for the initially active tab (On-Campus)
    if (jobListingsSection && jobListingsSection.classList.contains('active')) {
        loadJobsForCategory('on-campus');
    } else if (jobListingsSection) {
         // If the section exists but isn't active, load for on-campus by default for initial display
         loadJobsForCategory('on-campus');
    }

    // Optional: Listen for changes in the student selector if the recommendation logic depends on the selected student
    // studentSelector.addEventListener('change', () => {
    //     const selectedEnrollment = studentSelector.value;
    //     if (selectedEnrollment) {
    //         // Fetch or update the student profile based on the selection
    //         // Then reload the job listings using the new profile
    //         // loadJobsForCategory(currentActiveCategory); // You'd need to track the current active category
    //     }
    // });

});