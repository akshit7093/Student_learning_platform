import { renderLeetCode } from './leetcode.js';
import { renderGitHub } from './github.js';
import { renderCodeforces } from './codeforces.js';
import { renderIPU } from './ipu.js';  // Import the new IPU renderer

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchBtn = document.getElementById('searchBtn');

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const leetcodeUser = document.getElementById('leetcode_user').value.trim();
        const githubUser = document.getElementById('github_user').value.trim();
        const codeforcesUser = document.getElementById('codeforces_user').value.trim();
        const enrollmentNo = document.getElementById('enrollment_no').value.trim();  // New field
        
        // Reset results container
        resultsContainer.innerHTML = '';
        
        // Validate at least one username is provided
        if (!leetcodeUser && !githubUser && !codeforcesUser && !enrollmentNo) {
            showNoResultsMessage("Please enter at least one identifier to search.");
            return;
        }
        
        // Show loading state
        loadingSpinner.classList.remove('hidden');
        searchBtn.disabled = true;
        searchBtn.textContent = "Searching...";
        
        try {
            const query = new URLSearchParams();
            if (leetcodeUser) query.append('leetcode', leetcodeUser);
            if (githubUser) query.append('github', githubUser);
            if (codeforcesUser) query.append('codeforces', codeforcesUser);
            if (enrollmentNo) query.append('enrollment', enrollmentNo);  // Add enrollment number
            
            const response = await fetch(`/api/all?${query.toString()}`);
            const data = await response.json();
            
            // Process and render results
            processResults(data, {
                leetcodeUser,
                githubUser,
                codeforcesUser,
                enrollmentNo
            });
        } catch (error) {
            showError(resultsContainer, `Error loading profiles: ${error.message || error}`);
        } finally {
            // Reset button state
            loadingSpinner.classList.add('hidden');
            searchBtn.disabled = false;
            searchBtn.innerHTML = `<span class="search-icon">🔍</span> Search Profiles <div id="loadingSpinner" class="spinner hidden"></div>`;
        }
    });
    
    function processResults(data, identifiers) {
        let hasResults = false;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Handle LeetCode
        if (data.data?.leetcode) {
            hasResults = true;
            const leetCodeCard = renderLeetCode(data.data.leetcode, identifiers.leetcodeUser);
            resultsContainer.appendChild(leetCodeCard);
        }
        
        // Handle GitHub
        if (data.data?.github) {
            hasResults = true;
            const gitHubCard = renderGitHub(data.data.github, identifiers.githubUser);
            resultsContainer.appendChild(gitHubCard);
        }
        
        // Handle Codeforces
        if (data.data?.codeforces) {
            hasResults = true;
            const codeforcesCard = renderCodeforces(data.data.codeforces, identifiers.codeforcesUser);
            resultsContainer.appendChild(codeforcesCard);
        }
        
        // Handle IPU student data
        if (data.data?.ipu) {
            hasResults = true;
            const ipuCard = renderIPU(data.data.ipu, identifiers.enrollmentNo);
            resultsContainer.appendChild(ipuCard);
        }
        
        // Show no results message if needed
        if (!hasResults) {
            showNoResultsMessage("No profile data found for the provided identifiers.");
        }
    }
    
    function showError(container, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.innerHTML = `<span class="error-icon">⚠️</span> ${message}`;
        container.appendChild(errorDiv);
    }
    
    function showNoResultsMessage(message) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No Results Found</h3>
                <p>${message}</p>
            </div>
        `;
    }
});