# prompts.py - Enhanced for deeper, more detailed analysis

from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

# --- Pydantic Models for Structured Report Output ---

class ScoreMetric(BaseModel):
    parameter: str = Field(description="The name of the parameter being scored")
    score: int = Field(description="Score on a scale of 1-10")
    justification: str = Field(description="Detailed, data-driven justification (100+ words)")
    improvement_potential: str = Field(description="Specific improvement potential and growth trajectory")

class StrengthWeakness(BaseModel):
    strengths: List[str] = Field(description="5-7 detailed strengths with specific metrics and examples")
    weaknesses: List[str] = Field(description="5-7 detailed weaknesses with specific data points")
    hidden_talents: List[str] = Field(description="3-5 underutilized skills or potential areas")

class ActionItem(BaseModel):
    title: str = Field(description="Compelling, action-oriented title")
    description: str = Field(description="Comprehensive description (150+ words) with specific steps, resources, and timelines")
    priority: str = Field(description="HIGH, MEDIUM, or LOW priority")
    estimated_time: str = Field(description="Realistic time estimate (e.g., '2-3 months', '4-6 weeks')")
    expected_impact: str = Field(description="Detailed expected outcomes and measurable impacts")
    mermaid_flowchart: Optional[str] = Field(default="", description="Detailed Mermaid diagram with milestones")

class Recommendation(BaseModel):
    recommendations: List[ActionItem] = Field(description="5-7 comprehensive, prioritized recommendations")

class ResumeAnalysis(BaseModel):
    summary: str = Field(description="In-depth resume analysis (200+ words)")
    key_skills: List[str] = Field(description="10-15 technical and soft skills with proficiency context")
    professional_links: List[str] = Field(description="All professional links found")
    missing_elements: List[str] = Field(description="5-8 critical missing elements with explanations")
    ats_score: int = Field(description="ATS compatibility score (0-100)")
    improvement_suggestions: List[str] = Field(description="Specific resume improvement suggestions")

class Skill(BaseModel):
    name: str = Field(description="Skill name")
    category: str = Field(description="Skill category")
    performance: int = Field(description="Proficiency level 0-100")
    evidence: str = Field(description="Evidence from profile supporting this skill level")
    market_demand: str = Field(description="Current market demand: HIGH, MEDIUM, LOW")

class LearningResource(BaseModel):
    title: str = Field(description="Resource title")
    description: str = Field(description="Detailed resource description")
    url: str = Field(description="Resource URL")
    difficulty: str = Field(description="BEGINNER, INTERMEDIATE, ADVANCED")
    estimated_time: str = Field(description="Time to complete")

class LearningPathItem(BaseModel):
    title: str = Field(description="Learning module title")
    description: str = Field(description="Comprehensive description with learning objectives")
    duration: str = Field(description="Expected duration")
    prerequisites: List[str] = Field(description="Required prerequisites")
    resources: List[LearningResource] = Field(description="Curated learning resources")
    milestones: List[str] = Field(description="Key milestones to track progress")

class CareerInsight(BaseModel):
    current_trajectory: str = Field(description="Analysis of current career path")
    potential_roles: List[str] = Field(description="5-7 suitable job roles based on profile")
    salary_range: str = Field(description="Expected salary range for current skill level")
    competitive_advantage: str = Field(description="What makes this student stand out")
    market_positioning: str = Field(description="How student compares to peers")

class StudentReport(BaseModel):
    enrollment_no: str = Field(description="Student's enrollment number")
    name: str = Field(description="Student's full name")
    overall_summary: str = Field(description="Comprehensive 300+ word HR-style summary")
    executive_summary: str = Field(description="Brief 2-3 sentence elevator pitch")
    analysis: StrengthWeakness = Field(description="Deep analysis of strengths, weaknesses, and hidden talents")
    detailed_scores: List[ScoreMetric] = Field(description="8-10 parameters with detailed justifications")
    actionable_advice: Recommendation = Field(description="5-7 comprehensive, prioritized recommendations")
    resume_analysis: ResumeAnalysis = Field(description="In-depth resume analysis")
    skills: List[Skill] = Field(description="15-20 skills with evidence and market context")
    learning_path: List[LearningPathItem] = Field(description="4-6 detailed learning modules")
    career_insights: CareerInsight = Field(description="Career trajectory and market positioning")

# --- Enhanced Prompt Template ---

REPORT_PROMPT_TEMPLATE = """
You are an expert HR professional, technical interviewer, and career counselor with 15+ years of experience. 
Analyze the provided student data with exceptional depth and provide a comprehensive, actionable performance report.

**IMPORTANT**: Provide detailed, specific, and data-driven analysis. Each section should be thorough and insightful.

Student Data:
{context}

**CRITICAL INSTRUCTIONS**:
1. Be specific - cite exact numbers, projects, and achievements
2. Be thorough - each field should be detailed and comprehensive
3. Be actionable - provide specific steps, not generic advice
4. Be honest - identify both strengths and areas for significant improvement
5. Be forward-looking - consider career trajectory and market trends

**Required JSON Structure with Enhanced Detail**:

{{
  "enrollment_no": "<student_enrollment_number>",
  "name": "<student_name>",
  
  "executive_summary": "A compelling 2-3 sentence elevator pitch highlighting the student's unique value proposition and market positioning.",
  
  "overall_summary": "A comprehensive 300+ word professional summary that covers:
  - Academic journey and performance trajectory
  - Technical capabilities and project experience
  - Problem-solving skills and coding proficiency
  - Professional development and soft skills
  - Market readiness and hiring potential
  - Unique strengths and differentiators
  This should read like a professional reference letter.",
  
  "analysis": {{
    "strengths": [
      "DETAILED strength 1: [Specific achievement] - The student demonstrates [specific skill] evidenced by [concrete data points like CGPA 8.5, 200+ LeetCode problems, etc.]. This positions them well for [specific opportunities].",
      "DETAILED strength 2: [Another specific capability with metrics and context]",
      "DETAILED strength 3: [Include project examples, technologies mastered]",
      "DETAILED strength 4: [Problem-solving abilities with evidence]",
      "DETAILED strength 5: [Academic excellence or certifications]",
      "DETAILED strength 6: [Communication or collaboration skills]",
      "DETAILED strength 7: [Any unique achievements or awards]"
    ],
    "weaknesses": [
      "SPECIFIC weakness 1: [Exact area] - Currently at [current level] with [specific gap]. For example, only [X problems solved] in [specific topic], below the industry expectation of [Y].",
      "SPECIFIC weakness 2: [Another gap with context and comparison]",
      "SPECIFIC weakness 3: [Missing skill or experience]",
      "SPECIFIC weakness 4: [Area needing improvement with metrics]",
      "SPECIFIC weakness 5: [Technical debt or knowledge gap]"
    ],
    "hidden_talents": [
      "Underutilized potential in [specific area] - Has foundation in [X] but not leveraging it for [opportunity]",
      "Natural aptitude for [skill] shown by [evidence] but needs development",
      "Emerging strength in [area] that could become competitive advantage"
    ]
  }},
  
  "detailed_scores": [
    {{
      "parameter": "Academic Excellence & Consistency",
      "score": 8,
      "justification": "DETAILED: Current CGPA of [X] shows [trend]. Semester-wise analysis reveals [pattern]. Strongest in [subjects] with [specific grades]. Compared to peer average of [Y], this indicates [positioning]. Areas like [specific subjects] show room for improvement.",
      "improvement_potential": "With focused effort on [specific subjects/areas], could reach [target CGPA]. This would position student in top [X]% of cohort and significantly improve placement prospects."
    }},
    {{
      "parameter": "Data Structures & Algorithms Mastery",
      "score": 7,
      "justification": "COMPREHENSIVE: LeetCode profile shows [X problems solved] with [Y% acceptance rate]. Strong in [specific topics like arrays, strings] with [data]. Weak areas include [advanced topics like dynamic programming] with only [Z problems]. Codeforces rating of [R] indicates [level]. Industry expectation for top companies is [benchmark].",
      "improvement_potential": "Solving [X] more problems in weak areas over [timeframe] could improve rating to [target], qualifying for [company tier] interviews."
    }},
    {{
      "parameter": "Full-Stack Development Capabilities",
      "score": 6,
      "justification": "Portfolio includes [X projects] using [technologies]. GitHub shows [Y commits] with [activity level]. Projects demonstrate [capabilities] but lack [missing elements like testing, deployment, scalability]. Technology stack is [current vs. market demand].",
      "improvement_potential": "Adding [specific features/technologies] to projects and deploying on [platforms] would demonstrate production-ready skills valued at [salary increase]."
    }},
    {{
      "parameter": "Problem-Solving & Analytical Thinking",
      "score": 7,
      "justification": "Evidence from [coding competitions, hackathons, projects]. Demonstrates [specific problem-solving approach]. Contest rankings of [X] show [capability]. Approach to [example problem] indicates [thinking style]. Compared to industry standards, this level suggests [assessment].",
      "improvement_potential": "Participating in [specific competitions] and practicing [specific problem types] could elevate to [higher tier]."
    }},
    {{
      "parameter": "Software Engineering Best Practices",
      "score": 5,
      "justification": "Code quality analysis shows [observations]. GitHub commits reveal [coding style, documentation, testing practices]. Uses [tools/frameworks] but missing [industry standards like CI/CD, code reviews]. Project structure indicates [level of architecture understanding].",
      "improvement_potential": "Learning [specific practices] and contributing to [open source projects] would build production-level expertise."
    }},
    {{
      "parameter": "Communication & Professional Skills",
      "score": 6,
      "justification": "Resume presentation is [assessment]. LinkedIn/GitHub profiles show [level of professional branding]. Writing quality in projects suggests [capability]. Compared to hiring expectations, [positioning].",
      "improvement_potential": "Enhancing [specific areas] would improve interview success rate by [estimated percentage]."
    }},
    {{
      "parameter": "Market Readiness & Hiring Potential",
      "score": 7,
      "justification": "Overall profile suggests readiness for [company tiers]. Strong candidates for [specific roles]. Salary expectation of [X] aligns with [market rate]. Gap analysis shows [missing pieces] for [target companies].",
      "improvement_potential": "Focused preparation in [areas] over [timeline] could qualify for [higher tier companies] with [salary range]."
    }},
    {{
      "parameter": "Learning Agility & Growth Mindset",
      "score": 8,
      "justification": "Progress trajectory from [starting point] to [current state] shows [growth rate]. Adopted [X new technologies] in [timeframe]. Activity patterns suggest [learning style]. This indicates [future potential].",
      "improvement_potential": "Maintaining this growth rate could achieve [milestone] in [timeframe]."
    }}
  ],
  
  "actionable_advice": {{
    "recommendations": [
      {{
        "title": "Master Advanced DSA Patterns - Priority Path",
        "description": "COMPREHENSIVE PLAN: You need to solve 150+ medium-hard problems focusing on: Dynamic Programming (40 problems), Graph Algorithms (30 problems), Trees (25 problems), Backtracking (20 problems), and Advanced Data Structures (35 problems). Start with NeetCode's roadmap, progressing from easy to hard. Dedicate 2-3 hours daily for 3 months. Week 1-4: DP fundamentals and patterns. Week 5-8: Graph algorithms (DFS, BFS, Dijkstra, etc.). Week 9-12: Advanced topics and mock interviews. Track progress in a spreadsheet, aiming for 70%+ solve rate. This will prepare you for top-tier company interviews where DSA rounds are critical. Expected outcome: Increase LeetCode rating by 400+ points, qualify for Google/Meta/Amazon interviews.",
        "priority": "HIGH",
        "estimated_time": "3-4 months of consistent practice (2-3 hours daily)",
        "expected_impact": "Dramatically improve interview performance for product-based companies. Expected to increase placement probability by 60% and potential salary offers by 40%. Will build problem-solving confidence and speed necessary for competitive technical rounds.",
        "mermaid_flowchart": "graph TD\\n    A[Week 1-2: DP Basics] --> B[Week 3-4: DP Patterns]\\n    B --> C[Week 5-6: Graph Fundamentals]\\n    C --> D[Week 7-8: Advanced Graphs]\\n    D --> E[Week 9-10: Trees & Backtracking]\\n    E --> F[Week 11-12: Mock Interviews]\\n    F --> G[Interview Ready]"
      }},
      {{
        "title": "Build Production-Grade Full-Stack Portfolio",
        "description": "DETAILED PROJECT ROADMAP: Create 3 production-quality full-stack applications: 1) E-commerce platform with payment integration (MERN stack, Stripe, AWS deployment), 2) Real-time collaboration tool (WebSockets, Redis, microservices), 3) AI-powered application (integrate OpenAI API, Python backend, React frontend). Each project must include: Clean code architecture, comprehensive testing (Jest, Pytest), CI/CD pipeline (GitHub Actions), Docker containerization, cloud deployment (AWS/GCP/Azure), detailed documentation, and live demo. Focus on: Code quality (ESLint, Prettier), scalable architecture, security best practices (JWT, OAuth), performance optimization, and SEO. Document your development process in blog posts. This demonstrates real-world engineering skills that textbook projects don't show.",
        "priority": "HIGH",
        "estimated_time": "4-5 months (1 project per 6-8 weeks)",
        "expected_impact": "Differentiate yourself from 90% of candidates who only have basic projects. Demonstrate production engineering skills valued by startups and established companies. Portfolio projects often become talking points in interviews and can lead to job offers without traditional interview rounds. Expected salary premium: 30-50% higher than candidates with basic projects.",
        "mermaid_flowchart": "graph LR\\n    A[Project 1: E-commerce] --> B[Project 2: Collaboration Tool]\\n    B --> C[Project 3: AI Application]\\n    A --> A1[Planning]\\n    A1 --> A2[Development]\\n    A2 --> A3[Deployment]"
      }},
      {{
        "title": "Systematic System Design Preparation",
        "description": "COMPREHENSIVE STUDY PLAN: Master system design through structured learning: Phase 1 (Weeks 1-3): Fundamentals - Study scalability, load balancing, caching, databases (SQL vs NoSQL), CAP theorem, consistent hashing. Phase 2 (Weeks 4-6): Components - Deep dive into message queues (Kafka, RabbitMQ), microservices architecture, API design, authentication systems. Phase 3 (Weeks 7-9): Practice - Design 20+ systems including: URL shortener, Instagram, YouTube, Uber, Netflix, Twitter, WhatsApp. Use Grokking System Design, System Design Primer (GitHub). Phase 4 (Weeks 10-12): Mock interviews with peers, record yourself explaining designs. Focus on: Requirements gathering, capacity estimation, API design, database schema, component architecture, scalability considerations, trade-off analysis. This is crucial for senior roles and companies like Google, Amazon, Microsoft.",
        "priority": "MEDIUM",
        "estimated_time": "3 months of structured study",
        "expected_impact": "Qualify for mid-level to senior positions (3-5 years experience equivalent). System design proficiency can increase offer amounts by $20-30K annually. Essential for clearing technical rounds at FAANG and top-tier companies. Demonstrates architectural thinking valued in technical leadership roles.",
        "mermaid_flowchart": "graph TD\\n    A[Month 1: Fundamentals] --> B[Month 2: Components]\\n    B --> C[Month 3: Practice]\\n    A --> A1[Scalability]\\n    A --> A2[Databases]\\n    B --> B1[Microservices]\\n    C --> C1[Mock Interviews]"
      }},
      {{
        "title": "Open Source Contributions for Credibility",
        "description": "STRATEGIC CONTRIBUTION PLAN: Build credibility through meaningful open source work. Start with 'good first issue' tags on popular projects in your tech stack (React, Node.js, Python frameworks). Contribute to 5-10 projects over 6 months: Month 1-2: Documentation improvements, bug fixes (10-15 PRs). Month 3-4: Feature implementations, code refactoring (5-7 substantial PRs). Month 5-6: Become regular contributor to 2-3 projects, help review others' PRs. Focus on projects with: Active maintainers, clear contribution guidelines, alignment with career goals. Benefits: Network with experienced developers, learn professional code review process, demonstrate collaboration skills, build public track record. Many companies specifically look for open source contributions as it shows initiative and ability to work in team environments.",
        "priority": "MEDIUM",
        "estimated_time": "6 months (5-10 hours weekly)",
        "expected_impact": "Strong differentiator in interviews. Open source experience addresses the 'do you work well in teams?' question with proof. Can lead to job referrals from project maintainers. Demonstrates continuous learning and community involvement. GitHub profile with meaningful contributions can bypass traditional screening processes at tech-forward companies.",
        "mermaid_flowchart": "graph LR\\n    A[Find Projects] --> B[Docs & Bugs]\\n    B --> C[Features]\\n    C --> D[Core Contributor]"
      }},
      {{
        "title": "Professional Branding & Interview Preparation",
        "description": "COMPLETE PROFILE OPTIMIZATION: Transform your professional presence: Resume: Rewrite using STAR format, quantify achievements (Improved X by Y%, Built Z that handles N users), highlight impact. Target ATS score 85+. Create 3 versions for different roles. LinkedIn: Professional photo, compelling headline ('Full-Stack Developer | MERN Stack | Open Source Contributor'), detailed experience section with project links, 500+ word About section telling your story, get 10+ recommendations, post weekly about learnings. GitHub: Pin best projects, comprehensive READMEs with architecture diagrams and live demos, consistent contribution graph. Interview Prep: Practice 50+ behavioral questions using STAR, record yourself for body language, prepare questions for interviewers, research companies thoroughly, practice salary negotiations. Mock interviews: Schedule 10-15 mock interviews, get feedback, iterate. This preparation separates good candidates from great ones.",
        "priority": "HIGH",
        "estimated_time": "1 month intensive preparation",
        "expected_impact": "Professional branding can increase interview call-back rates by 300%. Strong LinkedIn presence leads to recruiter outreach (15-20 messages monthly for well-optimized profiles). Behavioral interview preparation reduces nervousness and improves offer conversion by 40%. Salary negotiation skills can result in $10-20K higher offers. Combined effect: 3-5x more interview opportunities and 2x higher offer success rate.",
        "mermaid_flowchart": "graph TB\\n    A[Resume & LinkedIn] --> B[GitHub Optimization]\\n    B --> C[Behavioral Prep]\\n    C --> D[Mock Interviews]"
      }}
    ]
  }},
  
  "resume_analysis": {{
    "summary": "COMPREHENSIVE ANALYSIS (200+ words): [Analyze resume structure, content quality, keyword optimization, ATS compatibility, visual presentation, professional tone, achievement quantification, technical depth, project descriptions, missing elements, comparison to industry standards, specific improvement areas]",
    "key_skills": [
      "Python (Proficient - 3+ years, used in X projects)",
      "JavaScript/React (Advanced - built Y applications)",
      "Data Structures & Algorithms (Intermediate - Z problems solved)",
      "... 10-15 total skills with context"
    ],
    "professional_links": ["github.com/username", "linkedin.com/in/username", "portfolio.dev"],
    "missing_elements": [
      "Certifications - Adding AWS/Azure certifications would validate cloud skills",
      "Quantified achievements - Replace 'worked on' with 'improved X by Y%'",
      "Technical blog/writing samples - Demonstrates communication skills",
      "... 5-8 total missing elements with explanations"
    ],
    "ats_score": 72,
    "improvement_suggestions": [
      "Add keywords: [specific technical terms for target roles]",
      "Restructure experience section using STAR format",
      "Include metrics and impact numbers in every bullet point",
      "Add technical skills section with proficiency levels",
      "... 5-7 specific, actionable improvements"
    ]
  }},
    "job_analysis": {{
        "match_score": 85,
        "key_alignment": ["Skill A", "Skill B"],
        "missing_critical_skills": ["Skill C"],
        "cultural_fit": "High",
        "recommendation": "Apply"
    }},
  
  "skills": [
    {{
      "name": "Python",
      "category": "Programming Language",
      "performance": 85,
      "evidence": "Used in 5 projects, LeetCode submissions show strong understanding, academic coursework in data science",
      "market_demand": "HIGH"
    }},
    // ... 15-20 total skills with full context
  ],
  
  "learning_path": [
    {{
      "title": "Phase 1: Advanced DSA Mastery (Months 1-3)",
      "description": "Deep dive into competitive programming and advanced problem-solving patterns. Focus on building speed and accuracy in coding challenges. Target: Solve 150+ medium-hard problems, increase LeetCode rating to 1800+, master dynamic programming, graph algorithms, and advanced data structures. This phase prepares you for technical interviews at top-tier companies.",
      "duration": "3 months",
      "prerequisites": ["Basic DSA knowledge", "Comfortable with at least one programming language", "Understanding of time/space complexity"],
      "resources": [
        {{
          "title": "NeetCode - Complete DSA Roadmap",
          "description": "Comprehensive video series covering all DSA patterns with detailed explanations and coding examples",
          "url": "https://neetcode.io/roadmap",
          "difficulty": "INTERMEDIATE",
          "estimated_time": "150 hours"
        }},
        // ... more resources
      ],
      "milestones": [
        "Week 4: Master DP fundamentals (30 problems)",
        "Week 8: Complete graph algorithms section (50 problems total)",
        "Week 12: Achieve 70%+ acceptance rate on medium problems"
      ]
    }},
    // ... 4-6 total detailed learning phases
  ],
  
  "career_insights": {{
    "current_trajectory": "Based on profile analysis, you're positioned for entry-level to mid-level software engineering roles at product and service-based companies. Your [strengths] align well with [specific companies/roles]. Current skill set suggests [salary range] in [locations]. With focused improvement in [areas], you could target [higher tier].",
    "potential_roles": [
      "Full-Stack Developer (React/Node.js) - Best fit given project experience",
      "Backend Engineer (Python/Java) - Strong algorithmic foundation",
      "Frontend Engineer - React proficiency and UI/UX sensitivity",
      "SDE-1 at product companies - Overall technical competency",
      "Software Engineer at startups - Versatile skill set",
      "... 5-7 specific roles with reasoning"
    ],
    "salary_range": "₹6-12 LPA for entry-level, ₹12-20 LPA after addressing key gaps. Potential to reach ₹20-35 LPA at FAANG/unicorns with 1-2 years focused growth.",
    "competitive_advantage": "Your unique combination of [specific strengths] sets you apart. Unlike peers who [common pattern], you demonstrate [differentiator]. This is particularly valuable for [types of companies/roles]. Leverage this in interviews by highlighting [specific examples].",
    "market_positioning": "Currently in top [X]% of graduating students based on [metrics]. Compared to target company expectations: Strong in [areas], need improvement in [areas]. Gap analysis suggests [months] of focused preparation to reach [target tier] company standards. Your profile is particularly attractive to [company profiles] looking for [specific attributes]."
  }}
}}

**REMEMBER**: 
- Every field should be detailed and comprehensive
- Cite specific numbers, metrics, and data points
- Provide actionable insights, not generic advice
- Be honest about gaps while staying constructive
- Consider market trends and hiring expectations
- Think like you're writing a professional assessment report

{format_instructions}
"""

QA_PROMPT_TEMPLATE = """
You are an expert AI assistant specializing in student profile analysis. Answer the following question with exceptional detail and specificity.

**Instructions**:
- Base your answer ONLY on the provided context
- Be comprehensive - provide detailed explanations with data points
- Cite specific numbers, projects, achievements from the profile
- If information is unavailable, clearly state that
- Provide actionable insights where relevant
- Use professional yet conversational tone

**Context:**
{context}

**Question:**
{question}

**Detailed Answer:**
"""

REPORT_PROMPT = PromptTemplate(
    template=REPORT_PROMPT_TEMPLATE,
    input_variables=["context", "format_instructions"],
)

QA_PROMPT = PromptTemplate(
    template=QA_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

RESUME_TAILORING_PROMPT = """
You are an expert Resume Writer and Career Coach. Your task is to rewrite a student's resume to perfectly target a specific job description.

**Student Profile:**
{student_profile}

**Target Job Description:**
{job_description}

**Instructions:**
1.  **Analyze the Match:** Identify the key skills and experiences in the student's profile that align with the job requirements.
2.  **Restructure & Rewrite:** Create a new resume in Markdown format.
    *   **Professional Summary:** Write a compelling summary that highlights the most relevant qualifications for *this specific role*.
    *   **Skills:** Reorder and emphasize skills that match the job description.
    *   **Experience/Projects:** Rewrite bullet points to use keywords from the job description. Quantify achievements where possible. Focus on aspects relevant to the target role.
    *   **Education:** List standard education details.
3.  **Format:** Use clean, professional Markdown. Use H1 for Name, H2 for Sections.
4.  **Tone:** Professional, action-oriented, and confident.

**Output:**
Return ONLY the Markdown content of the tailored resume. Do not include any introductory or concluding text.
"""