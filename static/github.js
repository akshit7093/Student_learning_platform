export function renderGitHub(data, username) {
    if (!data) {
        const card = createErrorCard('GitHub', username, 'Profile data not available');
        return card;
    }
    
    const card = createProfileCard('github', 'GitHub');
    
    // Profile header and avatar
    card.querySelector('.user-info').innerHTML = `
        <div class="user-name">${data.name || ''}</div>
        <div class="username">@${data.login || ''}</div>
        <div><a href="${data.profile_url}" target="_blank" style="font-size:13px; color:#0366d6;">${data.profile_url}</a></div>
        ${data.bio ? `<div class="bio" style="color:#586069; margin:6px 0;">${data.bio}</div>` : ''}
        ${data.location ? `<div class="item"><strong>Location:</strong> ${data.location}</div>` : ''}
        ${data.blog ? `<div class="item"><strong>Website:</strong> <a href="${data.blog}" target="_blank">${data.blog}</a></div>` : ''}
        ${data.email ? `<div class="item"><strong>Email:</strong> ${data.email}</div>` : ''}
        ${data.twitter ? `<div class="item"><strong>Twitter:</strong> <a href="https://twitter.com/${data.twitter}" target="_blank">@${data.twitter}</a></div>` : ''}
        <div class="item"><strong>Joined:</strong> ${data.created_at?.slice(0,10)}</div>
    `;
    
    const statsGrid = card.querySelector('.stats-grid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.public_repos || 0}</div>
            <div class="stat-label">Repositories</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.public_gists || 0}</div>
            <div class="stat-label">Gists</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.followers || 0}</div>
            <div class="stat-label">Followers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.following || 0}</div>
            <div class="stat-label">Following</div>
        </div>
    `;
    
    // Orgs
    if (data.orgs?.length) {
        const orgSection = document.createElement('div');
        orgSection.innerHTML = '<h3 class="section-title">Organizations</h3>';
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        data.orgs.slice(0, 8).forEach(org => {
            tagsContainer.innerHTML += `
                <span class="tag">
                    <img src="${org.avatar_url}" width="16" style="border-radius: 50%; vertical-align: middle;">
                    ${org.login}
                </span>
            `;
        });
        
        if (data.orgs.length > 8) {
            tagsContainer.innerHTML += `<span class="tag">+${data.orgs.length - 8} more</span>`;
        }
        
        orgSection.appendChild(tagsContainer);
        card.querySelector('.profile-body').appendChild(orgSection);
    }
    
    // Pinned repos
    if (data.pinned_repos?.length) {
        const pinnedSection = document.createElement('div');
        pinnedSection.innerHTML = '<h3 class="section-title">Pinned Repositories</h3>';
        const pinList = document.createElement('ul');
        pinList.className = 'content-list';
        
        data.pinned_repos.forEach(pr => {
            pinList.innerHTML += `
                <li>
                    <a href="https://github.com/${pr.owner}/${pr.repo}" target="_blank">${pr.repo}</a>
                    <span class="tag">${pr.description ? pr.description.substring(0,40) : ''}</span>
                </li>
            `;
        });
        
        pinnedSection.appendChild(pinList);
        card.querySelector('.profile-body').appendChild(pinnedSection);
    }
    
    // Top Repositories
    if (data.repos?.length) {
        const repoSection = document.createElement('div');
        repoSection.innerHTML = '<h3 class="section-title">Top Repositories</h3>';
        const reposList = document.createElement('ul');
        reposList.className = 'content-list';
        
        data.repos.forEach(repo => {
            reposList.innerHTML += `
                <li>
                    <a href="${repo.repo_url}" target="_blank" style="color: #333;">
                        ${repo.name}
                    </a>
                    <span class="tag" style="margin-left: 8px;">
                        ★ ${repo.stargazers_count}
                    </span>
                    ${repo.language ? `<span class="tag">${repo.language}</span>` : ''}
                </li>
            `;
        });
        
        repoSection.appendChild(reposList);
        card.querySelector('.profile-body').appendChild(repoSection);
    }
    
    // Events/Activity
    if (data.events?.length) {
        const eventSection = document.createElement('div');
        eventSection.innerHTML = '<h3 class="section-title">Recent Public Activity</h3>';
        const eventList = document.createElement('ul');
        eventList.className = 'content-list';
        
        data.events.forEach(ev => {
            let evt = `${ev.type || 'Activity'} → `;
            evt += ev.repo?.name || '';
            if (ev.created_at) evt += ' @ ' + ev.created_at.split('T')[0];
            eventList.innerHTML += `<li>${evt}</li>`;
        });
        
        eventSection.appendChild(eventList);
        card.querySelector('.profile-body').appendChild(eventSection);
    }
    
    // Profile README preview if present
    if (data.user_readme) {
        const readmeSection = document.createElement('div');
        readmeSection.innerHTML = `
            <h3 class="section-title">README Preview</h3>
            <div class="readme-preview">${data.user_readme.substring(0, 1000)}${data.user_readme.length > 1000 ? '...' : ''}</div>
        `;
        card.querySelector('.profile-body').appendChild(readmeSection);
    }
    
    // Set profile picture
    const profilePic = card.querySelector('.profile-pic');
    profilePic.src = data.avatar_url || '';
    profilePic.onerror = () => {
        profilePic.src = 'https://github.com/apple-touch-icon.png';
    };

    return card;
}

// Added missing functions directly to this file
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