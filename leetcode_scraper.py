import requests

def get_leetcode_profile(username: str):
    def lc_graphql(query, variables):
        url = "https://leetcode.com/graphql"
        headers = {"Content-Type": "application/json", "Referer": "https://leetcode.com"}
        resp = requests.post(url, json={"query":query, "variables":variables}, headers=headers, timeout=12)
        resp.raise_for_status()
        return resp.json()

    try:
        queries = {}
        queries['public_profile'] = ("""
            query userPublicProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    githubUrl twitterUrl linkedinUrl
                    contestBadge { name expired hoverText icon }
                    profile {
                        realName userAvatar aboutMe school websites
                        countryName company jobTitle skillTags
                        reputation ranking
                    }
                }
            }
        """, {"username": username})

        queries['language_stats'] = ("""
            query languageStats($username: String!) {
                matchedUser(username: $username) {
                    languageProblemCount { languageName problemsSolved }
                }
            }
        """, {"username": username})

        queries['skill_stats'] = ("""
            query skillStats($username: String!) {
                matchedUser(username: $username) {
                    tagProblemCounts {
                        advanced { tagName tagSlug problemsSolved }
                        intermediate { tagName tagSlug problemsSolved }
                        fundamental { tagName tagSlug problemsSolved }
                    }
                }
            }
        """, {"username": username})

        queries['question_progress'] = ("""
            query userSessionProgress($username: String!) {
                allQuestionsCount { difficulty count }
                matchedUser(username: $username) {
                    submitStats {
                        acSubmissionNum { difficulty count submissions }
                        totalSubmissionNum { difficulty count submissions }
                    }
                }
            }
        """, {"username": username})

        queries['calendar'] = ("""
            query userProfileCalendar($username: String!, $year: Int) {
                matchedUser(username: $username) {
                    userCalendar(year: $year) {
                        activeYears streak totalActiveDays
                    }
                }
            }
        """, {"username": username})

        queries['badges'] = ("""
            query userBadges($username: String!) {
                matchedUser(username: $username) {
                    badges { name displayName icon }
                    upcomingBadges { name icon progress }
                    activeBadge { name icon }
                }
            }
        """, {"username": username})

        queries['recent'] = ("""
            query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                    id title titleSlug timestamp
                }
            }
        """, {"username": username, "limit": 20})

        data = {key: lc_graphql(q, vars) for key, (q, vars) in queries.items()}

        user = data['public_profile']['data']['matchedUser'] or {}
        profile = user.get('profile', {})
        lang_stats = data['language_stats']['data']['matchedUser']['languageProblemCount']
        skills = data['skill_stats']['data']['matchedUser']['tagProblemCounts']
        question_section = data['question_progress']['data']
        submit_stats = question_section['matchedUser']['submitStats']
        all_questions = {x['difficulty']: x['count'] for x in question_section['allQuestionsCount']}
        ac_subs = submit_stats['acSubmissionNum']
        total_subs = submit_stats['totalSubmissionNum']

        totalSolved = 0
        problemsSolvedByDifficulty = {}
        for entry in ac_subs:
            if entry['difficulty'] == "All":
                totalSolved = entry['count']
            if entry['difficulty'] in ['Easy', 'Medium', 'Hard']:
                problemsSolvedByDifficulty[entry['difficulty']] = f"{entry['count']}/{all_questions.get(entry['difficulty'], '?')}"

        total_accepted = next((x['submissions'] for x in ac_subs if x['difficulty'] == "All"), 0)
        total_submitted = next((x['submissions'] for x in total_subs if x['difficulty'] == "All"), 0)
        acceptanceRate = round((total_accepted / total_submitted * 100) if total_submitted else 0, 2)

        cal = data['calendar']['data']['matchedUser']['userCalendar'] or {}
        badges = data['badges']['data']['matchedUser']
        recentAcSubmissions = data['recent']['data']['recentAcSubmissionList']

        result = {
            'success': True,
            'data': {
                'username': user.get('username'),
                'realName': profile.get('realName'),
                'userAvatar': profile.get('userAvatar'),
                'aboutMe': profile.get('aboutMe'),
                'school': profile.get('school'),
                'company': profile.get('company'),
                'jobTitle': profile.get('jobTitle'),
                'countryName': profile.get('countryName'),
                'websites': profile.get('websites', []),
                'githubUrl': user.get('githubUrl'),
                'linkedinUrl': user.get('linkedinUrl'),
                'twitterUrl': user.get('twitterUrl'),
                'skillTags': profile.get('skillTags', []),
                'ranking': profile.get('ranking'),
                'reputation': profile.get('reputation'),
                'totalSolved': totalSolved,
                'problemsSolvedByDifficulty': problemsSolvedByDifficulty,
                'acceptanceRate': acceptanceRate,
                'languageStats': lang_stats,
                'skillsAdvanced': skills.get('advanced', []),
                'skillsIntermediate': skills.get('intermediate', []),
                'skillsFundamental': skills.get('fundamental', []),
                'currentStreak': cal.get('streak', 0),
                'totalActiveDays': cal.get('totalActiveDays', 0),
                'activeYears': cal.get('activeYears', []),
                'badges': badges.get('badges', []),
                'upcomingBadges': badges.get('upcomingBadges', []),
                'activeBadge': badges.get('activeBadge', {}),
                'contestBadge': user.get('contestBadge', {}),
                'recentAcSubmissions': recentAcSubmissions
            }
        }
        return result
    except Exception as e:
        return {'success': False, 'error': str(e)}
