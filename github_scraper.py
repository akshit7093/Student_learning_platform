import requests
import logging

logging.basicConfig(level=logging.INFO)

def get_github_profile(username: str):
    headers = {'Accept': 'application/vnd.github.v3+json'}
    base_api = f"https://api.github.com/users/{username}"
    repos_api = f"{base_api}/repos?per_page=100&type=owner&sort=updated"
    orgs_api = f"{base_api}/orgs"
    followers_api = f"{base_api}/followers?per_page=100"
    following_api = f"{base_api}/following?per_page=100"
    events_api = f"{base_api}/events/public"
    pinned_api = f"https://gh-pinned-repos.egoist.dev/?username={username}"
    user_readme_api = f"https://raw.githubusercontent.com/{username}/{username}/main/README.md"

    try:
        # 1. Main profile info request
        logging.info(f"Requesting user profile: {base_api}")
        user_resp = requests.get(base_api, headers=headers)
        logging.info(f"User profile response status: {user_resp.status_code}")
        user = user_resp.json()
        logging.info(f"User data: {user}")
        if 'message' in user and user['message'] == 'Not Found':
            logging.error("User not found")
            return {"success": False, "error": "GitHub user not found"}
        login = user.get('login', '')
        name = user.get('name', '')
        avatar_url = user.get('avatar_url', '')
        public_repos = user.get('public_repos', 0)
        public_gists = user.get('public_gists', 0)
        profile_url = user.get('html_url', f"https://github.com/{username}")
        bio = user.get('bio', '')
        location = user.get('location', '')
        email = user.get('email', '')
        blog = user.get('blog', '')
        twitter = user.get('twitter_username', '')
        created_at = user.get('created_at', '')
        updated_at = user.get('updated_at', '')

        # Followers -- robust to error dicts
        logging.info(f"Requesting followers: {followers_api}")
        followers_resp = requests.get(followers_api, headers=headers)
        logging.info(f"Followers response: {followers_resp.status_code}")
        followers = followers_resp.json()
        if not isinstance(followers, list):
            logging.warning(f"Followers returned non-list: {followers}")
            followers_sample = []
        else:
            followers_sample = [{"login": f.get("login", ""), "avatar_url": f.get("avatar_url", "")} for f in followers[:8]]

        # Following -- robust
        logging.info(f"Requesting following: {following_api}")
        following_resp = requests.get(following_api, headers=headers)
        logging.info(f"Following response: {following_resp.status_code}")
        following = following_resp.json()
        if not isinstance(following, list):
            logging.warning(f"Following returned non-list: {following}")
            following_sample = []
        else:
            following_sample = [{"login": f.get("login", ""), "avatar_url": f.get("avatar_url", "")} for f in following[:8]]

        # Orgs
        logging.info(f"Requesting orgs: {orgs_api}")
        orgs_resp = requests.get(orgs_api, headers=headers)
        logging.info(f"Orgs response: {orgs_resp.status_code}")
        orgs = orgs_resp.json()
        if not isinstance(orgs, list):
            logging.warning(f"Orgs returned non-list: {orgs}")
            orgs = []
        for org in orgs:
            org.setdefault("avatar_url", f"https://github.com/{org.get('login', '')}.png")

        # Pinned Repos
        logging.info(f"Requesting pinned repos: {pinned_api}")
        pinned_resp = requests.get(pinned_api)
        logging.info(f"Pinned repos response: {pinned_resp.status_code}")
        pinned = pinned_resp.json()[:5] if pinned_resp.ok else []

        # User's Repos -- robust
        logging.info(f"Requesting user repos: {repos_api}")
        repos_resp = requests.get(repos_api, headers=headers)
        logging.info(f"Repos response: {repos_resp.status_code}")
        repos = repos_resp.json() if repos_resp.ok and repos_resp.headers.get("Content-Type", "").startswith("application/json") else []
        if not isinstance(repos, list):
            logging.warning(f"Repos returned non-list: {repos}")
            repos = []
        repos = [repo for repo in repos if not repo.get("fork", False)]
        for repo in repos:
            repo['repo_url'] = repo.get('html_url', '')
            repo['last_pushed'] = repo.get('pushed_at', '')
        sorted_repos = sorted(repos, key=lambda x: (x.get('stargazers_count', 0), x.get('updated_at', "")), reverse=True)

        # Events
        logging.info(f"Requesting events: {events_api}")
        events_resp = requests.get(events_api, headers=headers)
        logging.info(f"Events response: {events_resp.status_code}")
        events = events_resp.json() if events_resp.ok else []
        if not isinstance(events, list):
            logging.warning(f"Events returned non-list: {events}")
            events = []
        top_events = events[:8]

        # Profile README
        logging.info(f"Requesting profile README: {user_readme_api}")
        ur = requests.get(user_readme_api)
        user_readme = ur.text if ur.ok and ur.text and 'DOCTYPE' not in ur.text else ""

        # Final result
        logging.info("Returning user profile data")
        return {
            "success": True,
            "data": {
                "login": login,
                "name": name,
                "avatar_url": avatar_url,
                "profile_url": profile_url,
                "public_repos": public_repos,
                "public_gists": public_gists,
                "followers": user.get('followers', 0),
                "followers_sample": followers_sample,
                "following": user.get('following', 0),
                "following_sample": following_sample,
                "bio": bio,
                "location": location,
                "email": email,
                "blog": blog,
                "twitter": twitter,
                "orgs": orgs,
                "repos": sorted_repos[:10],
                "pinned_repos": pinned,
                "events": top_events,
                "created_at": created_at,
                "updated_at": updated_at,
                "user_readme": user_readme
            }
        }
    except Exception as e:
        logging.exception("Exception in get_github_profile")
        return {"success": False, "error": str(e)}
