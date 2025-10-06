import requests

def get_codeforces_profile(username: str):
    api_base = "https://codeforces.com/api/"
    info_url = f"{api_base}user.info?handles={username}"
    rating_url = f"{api_base}user.rating?handle={username}"
    status_url = f"{api_base}user.status?handle={username}"
    friends_url = f"{api_base}user.friends?handle={username}"
    blogs_url = f"{api_base}user.blogEntries?handle={username}"

    try:
        # 1. User info
        info_resp = requests.get(info_url)
        info_resp.raise_for_status()
        info_data = info_resp.json()
        if info_data.get("status") != "OK":
            return {"success": False, "error": info_data.get("comment")}
        user_info = info_data["result"][0]

        # 2. Contest rating history
        rating_data = requests.get(rating_url).json()
        contests = rating_data.get("result", []) if rating_data.get("status") == "OK" else []
        
        # 3. Recent submissions
        status_data = requests.get(status_url).json()
        submissions = status_data.get("result", []) if status_data.get("status") == "OK" else []

        # 4. Friends
        friends_data = requests.get(friends_url).json()
        friends = friends_data.get("result", []) if friends_data.get("status") == "OK" else []

        # 5. Blogs by user
        blogs_data = requests.get(blogs_url).json()
        blogs = blogs_data.get("result", []) if blogs_data.get("status") == "OK" else []

        # 6. Blog comments (first 5)
        blog_comments = []
        for entry in blogs[:5]:
            blog_id = entry['id']
            blog_url = f"{api_base}blogEntry.comments?blogEntryId={blog_id}"
            comments_data = requests.get(blog_url).json()
            if comments_data.get("status") == "OK":
                blog_comments.append({
                    "blog_id": blog_id,
                    "comments": comments_data.get("result", [])
                })

        # 7. Compute top tags + solved stats from submissions
        from collections import Counter, defaultdict
        tag_counter = Counter()
        verdict_counter = Counter()
        problem_counter = defaultdict(set)
        successful_submissions = [s for s in submissions if s.get('verdict') == 'OK']
        for s in successful_submissions:
            tags = s['problem'].get('tags', [])
            for tag in tags:
                tag_counter[tag] += 1
            pkey = f"{s['problem']['contestId']}-{s['problem']['index']}"
            problem_counter[s['problem']['type']].add(pkey)
            verdict_counter[s['verdict']] += 1

        # Solve/attempt summary
        solved = len(problem_counter['PROGRAMMING'])
        attempts = len(submissions)
        top_tags = tag_counter.most_common(10)
        
        # 8. Markdown Profile Summary
        md = []
        md.append(f"# Codeforces Profile: {user_info.get('handle')}")
        md.append(f"**Name**: {user_info.get('firstName', '')} {user_info.get('lastName', '')}")
        md.append(f"**Country**: {user_info.get('country', 'N/A')}")
        md.append(f"**Rank**: {user_info.get('rank', 'N/A')}  |  **Rating**: {user_info.get('rating', 'N/A')}")
        md.append(f"**Max Rank**: {user_info.get('maxRank', 'N/A')} (Max Rating: {user_info.get('maxRating', 'N/A')})")
        md.append(f"**Solved Problems**: {solved}")
        md.append(f"**Total Attempts**: {attempts}")
        md.append("## Top Tags")
        for tag, count in top_tags:
            md.append(f"- {tag}: {count} problems")
        md.append("\n## Recent Contest Performance")
        for contest in contests[-5:]:
            md.append(f"- {contest['contestName']}: {contest['rank']}th, ΔRating: {contest['newRating'] - contest['oldRating']} ({contest['newRating']})")
        md.append("\n## Recent Submissions (last 5 OK)")
        for sub in successful_submissions[:5]:
            problem_url = f"https://codeforces.com/problemset/problem/{sub['problem']['contestId']}/{sub['problem']['index']}"
            md.append(f"- [{sub['problem']['name']}]({problem_url}), {sub['programmingLanguage']}, {sub['creationTimeSeconds']}")
        md.append("\n## Blog Entries")
        for entry in blogs[:3]:
            blog_entry_url = f"https://codeforces.com/blog/entry/{entry['id']}"
            md.append(f"- [{entry['title']}]({blog_entry_url}), Comments: {entry.get('commentsCount', 0)}")
        
        result = {
            "success": True,
            "data": {
                "profile": user_info,
                "contests": contests,
                "submissions": submissions,
                "friends": friends,
                "blogs": blogs,
                "blog_comments": blog_comments,
                "solved_stats": {
                    "solved_problems": solved,
                    "total_attempts": attempts,
                    "top_tags": dict(top_tags),
                    "verdicts": dict(verdict_counter)
                },
                "markdown_summary": "\n".join(md)
            }
        }
        return result
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e)}
