export function renderCodeforces(data, username) {
    if (!data || !data.profile) {
        const card = createErrorCard('Codeforces', username, 'Profile data not available');
        return card;
    }

    const card = createProfileCard('codeforces', 'Codeforces');
    const p = data.profile;
    
    // Profile Header
    card.querySelector('.user-info').innerHTML = `
        <div class="user-name">${p.firstName || ''} ${p.lastName || ''}</div>
        <div class="username">@${p.handle || ''}</div>
    `;
    
    // Stats Grid
    const statsGrid = card.querySelector('.stats-grid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${p.rating || 'N/A'}</div>
            <div class="stat-label">Rating</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${p.maxRating || 'N/A'}</div>
            <div class="stat-label">Max Rating</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${p.rank || 'N/A'}</div>
            <div class="stat-label">Current Rank</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${p.maxRank || 'N/A'}</div>
            <div class="stat-label">Max Rank</div>
        </div>
    `;
    
    // Country and city
    if (p.country || p.city) {
        const locationSection = document.createElement('div');
        locationSection.innerHTML = '<h3 class="section-title">Location</h3>';
        
        const locationList = document.createElement('ul');
        locationList.className = 'content-list';
        
        if (p.country) {
            locationList.innerHTML += `<li><strong>Country:</strong> ${p.country}</li>`;
        }
        
        if (p.city) {
            locationList.innerHTML += `<li><strong>City:</strong> ${p.city}</li>`;
        }
        
        locationSection.appendChild(locationList);
        card.querySelector('.profile-body').appendChild(locationSection);
    }
    
    // Recent contests
    if (data.contests?.length) {
        const contestsSection = document.createElement('div');
        contestsSection.innerHTML = '<h3 class="section-title">Recent Contests</h3>';
        
        const contestsList = document.createElement('ul');
        contestsList.className = 'content-list';
        
        // Get the 5 most recent contests
        const recentContests = [...data.contests]
            .sort((a, b) => b.contestId - a.contestId)
            .slice(0, 5);
        
        recentContests.forEach(contest => {
            const ratingChange = contest.newRating - contest.oldRating;
            const changeColor = ratingChange > 0 ? '#43A047' : (ratingChange < 0 ? '#e53935' : '#757575');
            const changeSign = ratingChange > 0 ? '+' : '';
            
            contestsList.innerHTML += `
                <li>
                    <a href="https://codeforces.com/contest/${contest.contestId}" target="_blank" style="color: #FF9900;">
                        ${contest.contestName}
                    </a>
                    <span style="color: ${changeColor}; margin-left: 5px;">
                        ${changeSign}${ratingChange}
                    </span>
                    <span style="color: #888; margin-left: 5px;">
                        | Rank: ${contest.rank}
                    </span>
                </li>
            `;
        });
        
        contestsSection.appendChild(contestsList);
        card.querySelector('.profile-body').appendChild(contestsSection);
    }
    
    // Top problem tags
    if (data.solved_stats?.top_tags) {
        const tagsSection = document.createElement('div');
        tagsSection.innerHTML = '<h3 class="section-title">Top Problem Tags</h3>';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        Object.entries(data.solved_stats.top_tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .forEach(([tag, count]) => {
                tagsContainer.innerHTML += `
                    <span class="tag">
                        ${tag} (${count})
                    </span>
                `;
            });
        
        tagsSection.appendChild(tagsContainer);
        card.querySelector('.profile-body').appendChild(tagsSection);
    }
    
    // Solved stats
    if (data.solved_stats) {
        const solvedSection = document.createElement('div');
        solvedSection.innerHTML = `
            <div class="stats-grid" style="margin-top: 10px;">
                <div class="stat-card">
                    <div class="stat-value">${data.solved_stats.solved_problems || 0}</div>
                    <div class="stat-label">Solved</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.solved_stats.total_attempts || 0}</div>
                    <div class="stat-label">Attempts</div>
                </div>
            </div>
        `;
        card.querySelector('.profile-body').appendChild(solvedSection);
    }
    
    // Blog posts
    if (data.blogs?.length) {
        const blogSection = document.createElement('div');
        blogSection.innerHTML = '<h3 class="section-title">Recent Blog Posts</h3>';
        
        const blogsList = document.createElement('ul');
        blogsList.className = 'content-list';
        
        data.blogs.slice(0, 3).forEach(blog => {
            blogsList.innerHTML += `
                <li>
                    <a href="https://codeforces.com/blog/entry/${blog.id}" target="_blank" style="color: #FF9900;">
                        ${blog.title}
                    </a>
                </li>
            `;
        });
        
        blogSection.appendChild(blogsList);
        card.querySelector('.profile-body').appendChild(blogSection);
    }
    
    // Set profile picture
    const profilePic = card.querySelector('.profile-pic');
    profilePic.src = p.avatar || 'https://userpic.codeforces.org/no-avatar.jpg';
    profilePic.onerror = () => {
        profilePic.src = 'https://userpic.codeforces.org/no-avatar.jpg';
    };
    
    return card;
}

function createProfileCard(platform, title) {
    const card = document.createElement('div');
    card.className = `profile-card ${platform}-card`;
    
    card.innerHTML = `
        <div class="platform-header">
            <div class="platform-icon-large">${title.charAt(0)}</div>
            <h2 class="platform-title">${title} Profile</h2>
        </div>
        <div class="profile-body">
            <div class="profile-meta">
                <img src="" alt="Profile" class="profile-pic">
                <div class="user-info"></div>
            </div>
            <div class="stats-grid"></div>
        </div>
    `;
    
    return card;
}

function createErrorCard(platform, username, message) {
    const card = document.createElement('div');
    card.className = `profile-card ${platform}-card`;
    
    card.innerHTML = `
        <div class="platform-header">
            <div class="platform-icon-large">${platform.charAt(0).toUpperCase()}</div>
            <h2 class="platform-title">${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile</h2>
        </div>
        <div class="profile-body">
            <div class="error-msg">
                <span class="error-icon">⚠️</span>
                <div>
                    <strong>Error loading ${platform} profile for "${username}":</strong>
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    return card;
}