document.getElementById('profileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const leetcodeUser = document.getElementById('leetcode_user').value.trim();
    const githubUser = document.getElementById('github_user').value.trim();
    const codeforcesUser = document.getElementById('codeforces_user').value.trim();
    const resultsColumn = document.getElementById('results-vertical');
    resultsColumn.innerHTML = '<div class="feature-highlight" style="text-align: center; background: #f6f8fa;">Loading profiles<span class="loading-spinner"></span></div>';
    // Check if at least one username is provided
    if (!leetcodeUser && !githubUser && !codeforcesUser) {
        resultsColumn.innerHTML = '<p class="error-msg">Please enter at least one username to search.</p>';
        return;
    }
    const query = new URLSearchParams();
    if (leetcodeUser) query.append('leetcode', leetcodeUser);
    if (githubUser) query.append('github', githubUser);
    if (codeforcesUser) query.append('codeforces', codeforcesUser);
    fetch(`/api/all?${query.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            resultsColumn.innerHTML = '';
            // Add each profile as a vertical section
            if (leetcodeUser && data.leetcode) {
                const leetSection = document.createElement('div'); 
                leetSection.className = 'section';
                leetSection.append(renderLeetCode(data.leetcode, leetcodeUser));
                resultsColumn.append(leetSection);
            }
            if (githubUser && data.github) {
                const gitSection = document.createElement('div'); 
                gitSection.className = 'section';
                gitSection.append(renderGitHub(data.github, githubUser));
                resultsColumn.append(gitSection);
            }
            if (codeforcesUser && data.codeforces) {
                const cfSection = document.createElement('div'); 
                cfSection.className = 'section';
                cfSection.append(renderCodeforces(data.codeforces, codeforcesUser));
                resultsColumn.append(cfSection);
            }
        })
        .catch(error => {
            resultsColumn.innerHTML = `<p class="error-msg">Error loading profiles: ${error.message || error}</p>`;
            console.error('Fetch error:', error);
        });
});

function createCard(title, platform) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    const heading = document.createElement('h2');
    // Add platform-specific icons/colors
    let icon = '';
    if (platform === 'github') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="github-logo"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>';
    } else if (platform === 'leetcode') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="leetcode-logo"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (platform === 'codeforces') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="codeforces-logo"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
    }
    heading.innerHTML = `${icon} ${title}`;
    card.appendChild(heading);
    return card;
}

function renderError(card, error, platform, username) {
    card.innerHTML += `<div class="error-msg">
        <strong>Error loading ${platform} profile for "${username}":</strong> ${error}
    </div>`;
    return card;
}

function renderLeetCode(response, username) {
    const card = createCard('LeetCode Profile', 'leetcode');
    if (!response || !response.success) {
        return renderError(card, response?.error || "No data available", "LeetCode", username);
    }
    const data = response.data;
    // Avatar, name, handle, and profile meta
    card.innerHTML += `
        <img src="${data.userAvatar || 'https://leetcode.com/static/images/icons/android-icon-192x192.png'}" alt="Avatar" class="profile-pic">
        <h3>${data.realName || 'Anonymous'} <span style="color:#57606a;">(@${data.username || 'N/A'})</span></h3>
        <p><strong>Ranking:</strong> ${data.ranking ?? 'Unranked'} &nbsp; <strong>Reputation:</strong> ${data.reputation ?? 0}</p>
        ${data.school ? `<p><strong>School:</strong> ${data.school}</p>` : ''}
        ${data.company ? `<p><strong>Company:</strong> ${data.company}${data.jobTitle ? ' ('+data.jobTitle+')' : ''}</p>` : ''}
        ${data.aboutMe ? `<p><strong>About:</strong> ${data.aboutMe}</p>` : ''}
        ${data.countryName ? `<p><strong>Country:</strong> ${data.countryName}</p>` : ''}
        ${(data.websites && data.websites.length) ? `<p><strong>Websites:</strong> ${data.websites.map(w=>`<a href="${w}" target="_blank">${w}</a>`).join(', ')}</p>` : ''}
        ${(data.githubUrl || data.linkedinUrl || data.twitterUrl) ? `<p><strong>Social:</strong>
            ${data.githubUrl ? `<a href="${data.githubUrl}" target="_blank">GitHub</a> ` : ''}
            ${data.linkedinUrl ? `<a href="${data.linkedinUrl}" target="_blank">LinkedIn</a> ` : ''}
            ${data.twitterUrl ? `<a href="${data.twitterUrl}" target="_blank">Twitter</a>` : ''}</p>` : ''}
        <p><strong>Total Solved:</strong> ${data.totalSolved || 0}, <strong>Acceptance Rate:</strong> ${data.acceptanceRate || 0}%</p>
        <p><strong>Current Streak:</strong> ${data.currentStreak || 0}, <strong>Active Days:</strong> ${data.totalActiveDays || 0}, <strong>Years:</strong> ${(data.activeYears || []).join(', ')}</p>
    `;
    // By-difficulty solved
    card.innerHTML += '<div style="margin:8px 0;"><strong>Problems By Difficulty:</strong> ';
    ["Easy","Medium","Hard"].forEach(k=>{
      if(data.problemsSolvedByDifficulty?.[k]) card.innerHTML += `<span class="tag">${k}: ${data.problemsSolvedByDifficulty[k]}</span> `;
    });
    card.innerHTML += "</div>";
    // Languages
    if (data.languageStats?.length) {
        card.innerHTML += `<div><strong>Languages:</strong> ` +
          data.languageStats.map(l=>`${l.languageName}: ${l.problemsSolved}`).join(", ") + `</div>`;
    }
    // ALL Skills/Topics
    card.innerHTML += `<div><strong>Advanced:</strong> `;
    card.innerHTML += (data.skillsAdvanced||[]).map(s=>`${s.tagName} (${s.problemsSolved})`).join(", ") || "N/A";
    card.innerHTML += `</div>`;
    card.innerHTML += `<div><strong>Intermediate:</strong> `;
    card.innerHTML += (data.skillsIntermediate||[]).map(s=>`${s.tagName} (${s.problemsSolved})`).join(", ") || "N/A";
    card.innerHTML += `</div>`;
    card.innerHTML += `<div><strong>Fundamental:</strong> `;
    card.innerHTML += (data.skillsFundamental||[]).map(s=>`${s.tagName} (${s.problemsSolved})`).join(", ") || "N/A";
    card.innerHTML += `</div>`;
    // Badges
    if (data.badges?.length) {
      card.innerHTML += `<div><strong>Badges:</strong> ${data.badges.map(b=>b.displayName || b.name).join(', ')}</div>`;
    }
    // Recent Accepted
    if (data.recentAcSubmissions?.length) {
        card.innerHTML += "<h4>Recent Accepted:</h4><ul>";
        data.recentAcSubmissions.slice(0, 10).forEach(sub => {
            card.innerHTML += `<li>
                <a href="https://leetcode.com/problems/${sub.titleSlug}" target="_blank">${sub.title}</a>
                <span style="color: #888;">(${new Date(parseInt(sub.timestamp)*1000).toLocaleString()})</span>
            </li>`;
        });
        card.innerHTML += "</ul>";
    }
    return card;
}


function renderGitHub(response, username) {
    const card = createCard('GitHub Profile', 'github');
    if (!response || !response.success) {
        return renderError(card, response?.error || "No data available", "GitHub", username);
    }
    const profile = response.data || {};
    // Calculate GitHub strength metrics
    const repoCount = profile.public_repos || 0;
    const followerCount = profile.followers || 0;
    const followingCount = profile.following || 0;
    const orgCount = profile.orgs ? profile.orgs.length : 0;
    // Determine if user likely uses GitHub features from knowledge base
    const hasCopilot = repoCount > 5 && followerCount > 10; // Simplified heuristic
    const hasSecurityFeatures = profile.user_readme && 
        (profile.user_readme.includes('security') || 
         profile.user_readme.includes('vulnerability') ||
         profile.user_readme.includes('secret'));
    const hasProjectManagement = profile.user_readme &&
        (profile.user_readme.includes('project') ||
         profile.user_readme.includes('issue') ||
         profile.user_readme.includes('board'));
    card.innerHTML += `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
            <img src="${profile.avatar_url || ''}" alt="Avatar" class="profile-pic">
            <div>
                <h3>${profile.name || 'GitHub User'} <span style="color:#57606a;">(@${profile.login || ''})</span></h3>
                ${profile.bio ? `<p style="color: #57606a; margin: 10px 0;">${profile.bio}</p>` : ''}
                ${profile.blog ? `<p><strong>Website:</strong> <a href="${profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog}" target="_blank" style="color: #0969da;">${profile.blog}</a></p>` : ''}
                ${profile.location ? `<p><strong>Location:</strong> ${profile.location}</p>` : ''}
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${repoCount}</div>
                <div class="stat-label">Repositories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${followerCount}</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${followingCount}</div>
                <div class="stat-label">Following</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${orgCount}</div>
                <div class="stat-label">Organizations</div>
            </div>
        </div>
    `;
    // GitHub-specific features from knowledge base
    card.innerHTML += `
        <div class="feature-highlight">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                GitHub AI & Security Features
            </h3>
            <p>Based on profile analysis, this user appears to be using GitHub's advanced developer platform features:</p>
            <div class="security-features">
                <div class="security-feature">
                    <h4><span class="security-icon">✓</span> GitHub Copilot</h4>
                    <p>AI-powered coding assistance that helps write code faster and more securely. ${hasCopilot ? 
                        'This user shows patterns consistent with Copilot usage.' : 
                        'User may benefit from GitHub\'s AI coding assistance.'}</p>
                </div>
                <div class="security-feature">
                    <h4><span class="security-icon">✓</span> Application Security</h4>
                    <p>GitHub identifies and helps fix vulnerabilities automatically. ${hasSecurityFeatures ? 
                        'This user\'s README suggests security awareness.' : 
                        'Consider enabling security features to ship more secure software.'}</p>
                </div>
                <div class="security-feature">
                    <h4><span class="security-icon">✓</span> Project Management</h4>
                    <p>Plan and track work with adaptable tools that sync with your code. ${hasProjectManagement ? 
                        'This user appears to use project management features.' : 
                        'Streamline workflows with GitHub Projects.'}</p>
                </div>
                <div class="security-feature">
                    <h4><span class="security-icon">✓</span> Collaborative Platform</h4>
                    <p>Work together on a single, integrated platform regardless of team size.</p>
                </div>
            </div>
        </div>
    `;
    // Organizations
    if (profile.orgs && profile.orgs.length) {
        card.innerHTML += `<p><strong>Organizations:</strong></p><div class="tags-container">`;
        profile.orgs.forEach(org => {
            card.innerHTML += `<a href="https://github.com/${org.login}" target="_blank" class="tag" style="display: flex; align-items: center; gap: 4px;">
                <img src="${org.avatar_url}" width="16" style="border-radius: 4px;">
                ${org.login}
            </a>`;
        });
        card.innerHTML += `</div>`;
    }
    // Followers
    if (profile.followers_sample && profile.followers_sample.length) {
        card.innerHTML += `<p style="margin: 15px 0 8px 0;"><strong>Followers (${profile.followers}):</strong></p><div class="tags-container">`;
        profile.followers_sample.slice(0, 8).forEach(f => {
            card.innerHTML += `<a href="https://github.com/${f.login}" target="_blank" class="tag" style="padding: 4px 8px; min-width: 70px; text-align: center;">
                <img src="${f.avatar_url}" width="24" style="border-radius: 50%; vertical-align: middle; margin-right: 4px;">
                ${f.login.substring(0, 6)}${f.login.length > 6 ? '...' : ''}
            </a>`;
        });
        card.innerHTML += `</div>`;
    }
    // Pinned repositories
    if (profile.pinned_repos && profile.pinned_repos.length) {
        card.innerHTML += `<h4 style="margin: 20px 0 10px 0;">Pinned Repositories:</h4>
        <div class="pinned-repos-grid">`;
        profile.pinned_repos.forEach(repo => {
            card.innerHTML += `
            <div class="pinned-repo">
                <div class="repo-name">
                    <a href="${repo.link}" target="_blank" style="color: #0969da;">
                        ${repo.repo}
                    </a>
                </div>
                <div class="repo-description">${repo.description || 'No description'}</div>
                <div class="repo-stats">
                    <div class="repo-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${repo.stars || 0}
                    </div>
                    <div class="repo-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 9 12 4 17 9"></polyline><line x1="12" y1="4" x2="12" y2="15"></line></svg>
                        ${repo.forks || 0}
                    </div>
                </div>
            </div>`;
        });
        card.innerHTML += `</div>`;
    }
    // README - convert some markdown to HTML for better display
    if (profile.user_readme) {
        let readmeHtml = profile.user_readme
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks for simplicity
            .replace(/#{1,6} (.*)/g, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to plain text
            .replace(/\n/g, '<br>');
        card.innerHTML += `<h4 style="margin: 20px 0 10px 0;">Profile README:</h4>
        <div class="readme-preview">${readmeHtml.substring(0,800)}${profile.user_readme.length > 800 ? '...' : ''}</div>`;
    }
    return card;
}

function renderCodeforces(response, username) {
    const card = createCard('Codeforces Profile', 'codeforces');
    if (!response || !response.success) {
        return renderError(card, response?.error || "No data available", "Codeforces", username);
    }
    const data = response.data;
    const profile = data.profile || {};
    // Calculate stats
    const solved = data.solved_stats?.solved_problems || 0;
    const attempts = data.solved_stats?.total_attempts || 0;
    const acceptanceRate = attempts > 0 ? Math.round((solved / attempts) * 100) : 0;
    // Determine rank color based on Codeforces color system
    let rankColor = '#808080'; // Default (unrated)
    let rankBg = '#f0f0f0';
    if (profile.rank) {
        const rank = profile.rank.toLowerCase();
        if (rank.includes('newbie')) {
            rankColor = '#808080';
            rankBg = '#f0f0f0';
        }
        else if (rank.includes('pupil')) {
            rankColor = '#739900';
            rankBg = '#e0f0e0';
        }
        else if (rank.includes('specialist')) {
            rankColor = '#03A89E';
            rankBg = '#e0f8f8';
        }
        else if (rank.includes('expert')) {
            rankColor = '#0000FF';
            rankBg = '#e0e0ff';
        }
        else if (rank.includes('candidate')) {
            rankColor = '#AA00AA';
            rankBg = '#f0e0f0';
        }
        else if (rank.includes('master') || rank.includes('international master')) {
            rankColor = '#FF8C00';
            rankBg = '#fff0e0';
        }
        else if (rank.includes('grandmaster') || rank.includes('international grandmaster') || rank.includes('legendary')) {
            rankColor = '#FF0000';
            rankBg = '#ffe0e0';
        }
    }
    card.innerHTML += `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
            <img src="${profile.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}" alt="Avatar" class="profile-pic" style="border-color: ${rankColor};">
            <div>
                <h3 style="color: ${rankColor}; font-weight: 600; background: ${rankBg}; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                    ${profile.firstName || ''} ${profile.lastName || ''} 
                    <span style="color:#57606a;">(@${profile.handle || ''})</span>
                </h3>
                <p><strong>Country:</strong> ${profile.country || 'N/A'}</p>
                <p><strong>City:</strong> ${profile.city || 'N/A'}</p>
                <p><strong>Organization:</strong> ${profile.organization || 'N/A'}</p>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" style="color: ${rankColor};">${profile.rank || 'Unrated'}</div>
                <div class="stat-label">Current Rank</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: ${rankColor};">${profile.rating || 'N/A'}</div>
                <div class="stat-label">Rating</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${solved}</div>
                <div class="stat-label">Problems Solved</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${acceptanceRate}%</div>
                <div class="stat-label">Solve Rate</div>
            </div>
        </div>
    `;
    // Max rating/rank info
    if (profile.maxRating && profile.maxRank) {
        card.innerHTML += `
        <div class="feature-highlight">
            <p><strong>Peak Performance:</strong> ${profile.maxRank} (Rating: ${profile.maxRating})</p>
        </div>`;
    }
    // Contribution info
    if (profile.contribution) {
        card.innerHTML += `
        <div class="feature-highlight">
            <p><strong>Contribution:</strong> ${profile.contribution} | <strong>Friend of:</strong> ${profile.friendOfCount || 0} users</p>
        </div>`;
    }
    // Top tags
    if (data.solved_stats?.top_tags && Object.keys(data.solved_stats.top_tags).length > 0) {
        card.innerHTML += `<p><strong>Top Problem Tags:</strong></p>
        <div class="tags-container">`;
        // Sort tags by count (descending)
        const sortedTags = Object.entries(data.solved_stats.top_tags)
            .sort((a, b) => b[1] - a[1]);
        sortedTags.slice(0, 8).forEach(([tag, count]) => {
            card.innerHTML += `<span class="tag">${tag} (${count})</span>`;
        });
        card.innerHTML += `</div>`;
    }
    // Recent contests
    if (data.contests && data.contests.length > 0) {
        card.innerHTML += `<h4 style="margin: 20px 0 10px 0;">Recent Contest Performance:</h4>
        <div class="contest-history">`;
        // Show most recent 5 contests
        data.contests.slice(-5).reverse().forEach(contest => {
            const ratingChange = contest.newRating - contest.oldRating;
            const changeColor = ratingChange > 0 ? '#1a7f37' : ratingChange < 0 ? '#cf222e' : '#57606a';
            const changeSymbol = ratingChange > 0 ? '+' : '';
            card.innerHTML += `
            <div class="contest-item">
                <div class="contest-name">${contest.contestName}</div>
                <div class="contest-details">
                    <span>Rank: ${contest.rank}</span>
                    <span style="color: ${changeColor};">Rating: ${contest.newRating} (${changeSymbol}${ratingChange})</span>
                    <span>Date: ${new Date(contest.startTime * 1000).toLocaleDateString()}</span>
                </div>
            </div>`;
        });
        card.innerHTML += `</div>`;
    }
    // Recent submissions
    if (data.submissions && data.submissions.length > 0) {
        const successfulSubs = data.submissions.filter(s => s.verdict === 'OK');
        if (successfulSubs.length > 0) {
            card.innerHTML += `<h4 style="margin: 20px 0 10px 0;">Recent Accepted Submissions:</h4>
            <ul>`;
            successfulSubs.slice(0, 5).forEach(sub => {
                const problemUrl = `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`;
                const timestamp = new Date(sub.creationTimeSeconds * 1000).toLocaleDateString();
                card.innerHTML += `
                <li>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <a href="${problemUrl}" target="_blank" style="color: #0969da; font-weight: 500;">${sub.problem.name}</a>
                            <div style="color: #57606a; font-size: 0.9em;">
                                ${sub.programmingLanguage}
                            </div>
                        </div>
                        <span style="color: #57606a; white-space: nowrap; margin-left: 10px;">
                            ${timestamp}
                        </span>
                    </div>
                </li>`;
            });
            card.innerHTML += `</ul>`;
        }
    }
    // Blog entries
    if (data.blogs && data.blogs.length > 0) {
        card.innerHTML += `<h4 style="margin: 20px 0 10px 0;">Recent Blog Entries:</h4>
        <ul>`;
        data.blogs.slice(0, 3).forEach(blog => {
            const blogUrl = `https://codeforces.com/blog/entry/${blog.id}`;
            card.innerHTML += `
            <li>
                <a href="${blogUrl}" target="_blank" style="color: #0969da; font-weight: 500;">${blog.title}</a>
                <span style="color: #57606a; margin-left: 5px;">(${blog.commentsCount || 0} comments)</span>
            </li>`;
        });
        card.innerHTML += `</ul>`;
    }
    return card;
}