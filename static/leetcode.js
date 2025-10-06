export function renderLeetCode(data, username) {
    if (!data) {
        const card = createErrorCard('LeetCode', username, 'Profile data not available');
        return card;
    }

    const card = createProfileCard('leetcode', 'LeetCode');
    
    // Profile Header
    card.querySelector('.user-info').innerHTML = `
        <div class="user-name">${data.realName || 'Anonymous'}</div>
        <div class="username">@${data.username || 'N/A'}</div>
    `;
    
    // Stats Grid - Expanded to show more stats
    const statsGrid = card.querySelector('.stats-grid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.ranking ?? 'Unranked'}</div>
            <div class="stat-label">Global Rank</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.reputation ?? 0}</div>
            <div class="stat-label">Reputation</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.totalSolved || 0}</div>
            <div class="stat-label">Problems Solved</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.acceptanceRate || 0}%</div>
            <div class="stat-label">Acceptance Rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.currentStreak || 0}</div>
            <div class="stat-label">Current Streak</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.totalActiveDays || 0}</div>
            <div class="stat-label">Active Days</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.activeYears?.join(', ') || 'N/A'}</div>
            <div class="stat-label">Active Years</div>
        </div>
        ${data.contestBadge?.name ? `
        <div class="stat-card">
            <div class="stat-value">${data.contestBadge.name}</div>
            <div class="stat-label">Contest Badge</div>
        </div>` : ''}
    `;
    
    // About section
    if (data.aboutMe) {
        const aboutSection = document.createElement('div');
        aboutSection.innerHTML = '<h3 class="section-title">About</h3>';
        aboutSection.innerHTML += `<p style="color: var(--text-light); line-height: 1.5;">${data.aboutMe}</p>`;
        card.querySelector('.profile-body').appendChild(aboutSection);
    }
    
    // Professional info
    if (data.company || data.school || data.countryName || data.jobTitle) {
        const infoSection = document.createElement('div');
        infoSection.innerHTML = '<h3 class="section-title">Professional Info</h3>';
        
        const infoList = document.createElement('ul');
        infoList.className = 'content-list';
        
        if (data.company) {
            infoList.innerHTML += `<li><strong>Company:</strong> ${data.company}${data.jobTitle ? ` (${data.jobTitle})` : ''}</li>`;
        }
        
        if (data.school) {
            infoList.innerHTML += `<li><strong>School:</strong> ${data.school}</li>`;
        }
        
        if (data.countryName) {
            infoList.innerHTML += `<li><strong>Country:</strong> ${data.countryName}</li>`;
        }
        
        infoSection.appendChild(infoList);
        card.querySelector('.profile-body').appendChild(infoSection);
    }
    
    // Social links
    const socialLinks = [];
    if (data.githubUrl) socialLinks.push(`<a href="${data.githubUrl}" target="_blank" style="color: #3B5998;">GitHub</a>`);
    if (data.linkedinUrl) socialLinks.push(`<a href="${data.linkedinUrl}" target="_blank" style="color: #3B5998;">LinkedIn</a>`);
    if (data.twitterUrl) socialLinks.push(`<a href="${data.twitterUrl}" target="_blank" style="color: #3B5998;">Twitter</a>`);
    if (data.websites?.length) {
        data.websites.forEach(site => {
            if (site) socialLinks.push(`<a href="${site.startsWith('http') ? site : 'https://' + site}" target="_blank" style="color: #3B5998;">${site.replace(/^https?:\/\//, '')}</a>`);
        });
    }
    
    if (socialLinks.length > 0) {
        const socialSection = document.createElement('div');
        socialSection.innerHTML = `
            <h3 class="section-title">Social Links</h3>
            <div class="tags-container">
                ${socialLinks.map(link => `<span class="tag">${link}</span>`).join('')}
            </div>
        `;
        card.querySelector('.profile-body').appendChild(socialSection);
    }
    
    // Skill tags
    if (data.skillTags?.length) {
        const tagsSection = document.createElement('div');
        tagsSection.innerHTML = '<h3 class="section-title">Skill Tags</h3>';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        data.skillTags.forEach(tag => {
            tagsContainer.innerHTML += `<span class="tag">${tag}</span>`;
        });
        
        tagsSection.appendChild(tagsContainer);
        card.querySelector('.profile-body').appendChild(tagsSection);
    }
    
    // Problems by difficulty
    if (data.problemsSolvedByDifficulty) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        ["Easy", "Medium", "Hard"].forEach(difficulty => {
            if (data.problemsSolvedByDifficulty[difficulty]) {
                tagsContainer.innerHTML += `
                    <span class="tag">
                        ${difficulty}: ${data.problemsSolvedByDifficulty[difficulty]}
                    </span>
                `;
            }
        });
        
        if (tagsContainer.children.length > 0) {
            const difficultySection = document.createElement('div');
            difficultySection.innerHTML = `
                <h3 class="section-title">Problem Distribution</h3>
            `;
            difficultySection.appendChild(tagsContainer);
            card.querySelector('.profile-body').appendChild(difficultySection);
        }
    }
    
    // Language stats
    if (data.languageStats?.length) {
        const langSection = document.createElement('div');
        langSection.innerHTML = '<h3 class="section-title">Language Proficiency</h3>';
        
        const langList = document.createElement('ul');
        langList.className = 'content-list';
        
        data.languageStats.slice(0, 8).forEach(lang => {
            langList.innerHTML += `
                <li>
                    <strong>${lang.languageName}:</strong> ${lang.problemsSolved} problems solved
                </li>
            `;
        });
        
        if (data.languageStats.length > 8) {
            langList.innerHTML += `<li>And ${data.languageStats.length - 8} more languages...</li>`;
        }
        
        langSection.appendChild(langList);
        card.querySelector('.profile-body').appendChild(langSection);
    }
    
    // Skill proficiency sections
    const skillSections = [
        { title: 'Advanced Skills', skills: data.skillsAdvanced },
        { title: 'Intermediate Skills', skills: data.skillsIntermediate },
        { title: 'Fundamental Skills', skills: data.skillsFundamental }
    ];
    
    skillSections.forEach(section => {
        if (section.skills?.length) {
            const skillsSection = document.createElement('div');
            skillsSection.innerHTML = `<h3 class="section-title">${section.title}</h3>`;
            
            const skillsList = document.createElement('ul');
            skillsList.className = 'content-list';
            
            section.skills.slice(0, 5).forEach(skill => {
                skillsList.innerHTML += `
                    <li>
                        <strong>${skill.tagName}:</strong> ${skill.problemsSolved} problems
                    </li>
                `;
            });
            
            if (section.skills.length > 5) {
                skillsList.innerHTML += `<li>And ${section.skills.length - 5} more skills...</li>`;
            }
            
            skillsSection.appendChild(skillsList);
            card.querySelector('.profile-body').appendChild(skillsSection);
        }
    });
    
    // Badges section
    const badgesSection = document.createElement('div');
    let hasBadges = false;
    
    // Active badge
    if (data.activeBadge?.name) {
        badgesSection.innerHTML += `
            <h3 class="section-title">Active Badge</h3>
            <div class="tags-container">
                <span class="tag">${data.activeBadge.name}</span>
            </div>
        `;
        hasBadges = true;
    }
    
    // Badges collection
    if (data.badges?.length) {
        const badgesList = document.createElement('div');
        badgesList.innerHTML = '<h3 class="section-title">Badges</h3>';
        
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'tags-container';
        
        data.badges.slice(0, 5).forEach(badge => {
            badgesContainer.innerHTML += `<span class="tag">${badge.displayName || badge.name}</span>`;
        });
        
        if (data.badges.length > 5) {
            badgesContainer.innerHTML += `<span class="tag">+${data.badges.length - 5} more</span>`;
        }
        
        badgesList.appendChild(badgesContainer);
        badgesSection.appendChild(badgesList);
        hasBadges = true;
    }
    
    // Upcoming badges
    if (data.upcomingBadges?.length) {
        const upcomingSection = document.createElement('div');
        upcomingSection.innerHTML = '<h3 class="section-title">Upcoming Badges</h3>';
        
        const upcomingContainer = document.createElement('div');
        upcomingContainer.className = 'tags-container';
        
        data.upcomingBadges.slice(0, 3).forEach(badge => {
            upcomingContainer.innerHTML += `<span class="tag">${badge.name}</span>`;
        });
        
        if (data.upcomingBadges.length > 3) {
            upcomingContainer.innerHTML += `<span class="tag">+${data.upcomingBadges.length - 3} more</span>`;
        }
        
        upcomingSection.appendChild(upcomingContainer);
        badgesSection.appendChild(upcomingSection);
        hasBadges = true;
    }
    
    if (hasBadges) {
        card.querySelector('.profile-body').appendChild(badgesSection);
    }
    
    // Recent submissions
    if (data.recentAcSubmissions?.length) {
        const recentSection = document.createElement('div');
        recentSection.innerHTML = '<h3 class="section-title">Recent Submissions</h3>';
        
        const submissionsList = document.createElement('ul');
        submissionsList.className = 'content-list';
        
        data.recentAcSubmissions.slice(0, 5).forEach(sub => {
            submissionsList.innerHTML += `
                <li>
                    <a href="https://leetcode.com/problems/${sub.titleSlug}" target="_blank" style="color: #3B5998;">
                        ${sub.title}
                    </a>
                    <span style="color: #888; margin-left: 5px;">
                        (${new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString()})
                    </span>
                </li>
            `;
        });
        
        recentSection.appendChild(submissionsList);
        card.querySelector('.profile-body').appendChild(recentSection);
    }
    
    // Set profile picture
    const profilePic = card.querySelector('.profile-pic');
    profilePic.src = data.userAvatar || 'https://leetcode.com/static/images/icons/android-icon-192x192.png';
    profilePic.onerror = () => {
        profilePic.src = 'https://leetcode.com/static/images/icons/android-icon-192x192.png';
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