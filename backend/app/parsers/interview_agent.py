import uuid
from typing import Dict, Any, List
from app.parsers.matching_engine import MatchingEngine
from app.parsers.evidence_extractor import EvidenceExtractor

class InterviewAgent:
    """
    Personalized Candidate Interview Agent.
    Synthesizes candidate evidence, claimed skills, weak evidence, missing requirements,
    uncertain claims, projects, and work experience to generate role-specific interview guides.
    """

    @classmethod
    def generate_interview_guide(cls, resume: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        parsed_resume = resume.get("parsed_data", {})
        candidate_name = resume.get("candidate_name") or parsed_resume.get("candidate_name", "Candidate")
        job_title = job.get("title", "Position")
        job_id = job.get("id", "job-id")

        # Evaluate match and noise telemetry
        eval_result = MatchingEngine.evaluate_match(resume, job)
        match_score = eval_result["final_match_score"]
        match_grade = eval_result["match_grade"]
        evals = eval_result["requirement_evaluations"]
        noise = eval_result["noise_analysis"]

        projects = parsed_resume.get("projects", [])
        work_exp = parsed_resume.get("work_experience", [])
        skills = parsed_resume.get("skills", [])
        stuffed_skills = noise.get("stuffed_skills", [])
        skills_in_list_only = noise.get("skills_only_in_list", [])

        technical_questions = cls._generate_technical_questions(evals, parsed_resume)
        project_questions = cls._generate_project_questions(projects, parsed_resume)
        experience_questions = cls._generate_experience_questions(work_exp, parsed_resume)
        skill_verification_questions = cls._generate_skill_verification_questions(evals, skills_in_list_only, stuffed_skills)
        clarification_questions = cls._generate_clarification_questions(evals, noise, resume)

        all_q_count = (
            len(technical_questions) +
            len(project_questions) +
            len(experience_questions) +
            len(skill_verification_questions) +
            len(clarification_questions)
        )

        briefing = cls._build_interviewer_briefing(candidate_name, job_title, match_score, match_grade, eval_result, noise)

        return {
            "candidate_id": resume.get("id", "cand-id"),
            "candidate_name": candidate_name,
            "job_id": job_id,
            "job_title": job_title,
            "match_score": match_score,
            "match_grade": match_grade,
            "total_questions": all_q_count,
            "interviewer_briefing": briefing,
            "technical_questions": technical_questions,
            "project_questions": project_questions,
            "experience_questions": experience_questions,
            "skill_verification_questions": skill_verification_questions,
            "clarification_questions": clarification_questions
        }

    @classmethod
    def _generate_technical_questions(cls, evals: List[Dict[str, Any]], parsed_resume: Dict[str, Any]) -> List[Dict[str, Any]]:
        questions = []
        matched_items = [e for e in evals if e["status"] in ["MATCHED", "PARTIALLY MATCHED"] and e["evidence_score"] >= 6.0]

        tech_templates = {
            "Python": (
                "You have strong verified experience in Python. How do you handle concurrency, asynchronous execution (asyncio/GIL considerations), and memory profiling when processing high-throughput workloads?",
                ["Understands GIL, asyncio event loop, thread vs process pools, and memory leaks / cProfile."]
            ),
            "FastAPI": (
                "You indicated building services with FastAPI. How did you architect dependency injection, Pydantic data serialization overhead, and background tasks in production?",
                ["Discusses dependency injection scopes, validation performance, async route handlers, and OpenAPI custom middlewares."]
            ),
            "Docker": (
                "Your resume highlights containerization with Docker. Describe how you optimize multi-stage builds for container security, image caching, and minimal footprint.",
                ["Mentions distroless/alpine base images, layer caching strategies, non-root user execution, and secret management."]
            ),
            "AWS": (
                "You have demonstrated cloud infrastructure experience with AWS. How did you design for high availability, fault tolerance, and cost governance across availability zones?",
                ["Clear explanation of VPC design, IAM least privilege, auto-scaling groups, and S3/RDS lifecycle/caching policies."]
            ),
            "PostgreSQL": (
                "You verified production database work with PostgreSQL. How do you analyze slow queries, optimize composite indexes, and configure connection pooling (e.g. PgBouncer)?",
                ["Mentions EXPLAIN ANALYZE, vacuuming, indexing tradeoffs (B-Tree, GIN), connection starvation prevention, and transaction isolation levels."]
            ),
            "Machine Learning": (
                "Your resume mentions ML modeling. Can you explain your end-to-end ML pipeline lifecycle — specifically how you managed feature drift, model evaluation metrics, and inference latency constraints?",
                ["Distinguishes offline training vs online inference, mentions metrics (Precision, Recall, ROC-AUC), drift monitoring, and ONNX/TensorRT optimization."]
            ),
            "Microservices": (
                "In your microservices architecture, how do you manage distributed tracing, idempotency across asynchronous events, and failure domain isolation (circuit breakers)?",
                ["Cites correlation IDs, OpenTelemetry, Saga patterns / outbox patterns, and resilient timeout/retry backoff policies."]
            )
        }

        for item in matched_items[:4]:
            req = item["requirement"]
            evidence = item["evidence_text"]
            
            if req in tech_templates:
                q_text, signals = tech_templates[req]
            else:
                q_text = (
                    f"Your resume demonstrates verified experience in {req} ('{evidence[:90]}...'). "
                    f"Can you explain the internal mechanics of how you implemented {req}, including the key architectural trade-offs you made?"
                )
                signals = [f"Articulates deep hands-on expertise in {req} and discusses practical production edge cases."]

            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Technical",
                "target_topic": req,
                "question": q_text,
                "context_source": f"Resume Evidence: \"{evidence}\"",
                "rationale": f"Candidate demonstrated strong evidence for mandatory requirement '{req}'. Verify deep technical proficiency.",
                "expected_signals": signals,
                "red_flags": ["Gives generic theoretical answers without discussing real trade-offs or production incidents."],
                "difficulty": "In-Depth"
            })

        return questions

    @classmethod
    def _generate_project_questions(cls, projects: List[Dict[str, Any]], parsed_resume: Dict[str, Any]) -> List[Dict[str, Any]]:
        questions = []
        for p in projects[:3]:
            name = p.get("name") or "Technical Project"
            desc = p.get("description") or "Implemented software system"
            techs = p.get("technologies", [])
            tech_str = ", ".join(techs) if techs else "the underlying tech stack"

            q_text = (
                f"In your project '{name}', you described: '{desc}'. "
                f"Can you walk through the system architecture you designed using {tech_str}? "
                f"What was the biggest technical challenge or bottleneck you encountered during implementation?"
            )

            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Project",
                "target_topic": name,
                "question": q_text,
                "context_source": f"Parsed Project: {name} ({tech_str})",
                "rationale": "Verify hands-on architectural ownership and problem-solving ability in candidate's highlighted project.",
                "expected_signals": [
                    "Clearly explains data flow, API contracts, and storage choices.",
                    "Articulates a specific technical bottleneck and the quantifiable fix."
                ],
                "red_flags": ["Cannot explain core architecture or admits project was only a tutorial / boilerplate clone."],
                "difficulty": "In-Depth"
            })

        # Fallback if no projects parsed
        if not questions and parsed_resume.get("work_experience"):
            latest_exp = parsed_resume["work_experience"][0]
            comp = latest_exp.get("company", "Recent Employer")
            title = latest_exp.get("job_title", "Software Engineer")
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Project",
                "target_topic": f"Key Technical Initiative at {comp}",
                "question": f"While working as {title} at {comp}, what was the single most impactful technical initiative you delivered, and how did you measure its success?",
                "context_source": f"Work Experience: {title} at {comp}",
                "rationale": "Probe candidate's highest impact engineering initiative.",
                "expected_signals": ["Details specific architectural choices, metrics, and business/system impact."],
                "red_flags": ["Vague summary of day-to-day tickets without ownership of larger initiatives."],
                "difficulty": "In-Depth"
            })

        return questions

    @classmethod
    def _generate_experience_questions(cls, work_exp: List[Dict[str, Any]], parsed_resume: Dict[str, Any]) -> List[Dict[str, Any]]:
        questions = []
        for exp in work_exp[:2]:
            company = exp.get("company", "Company")
            title = exp.get("job_title", "Software Professional")
            dates = exp.get("employment_dates", "Recent")
            resps = exp.get("responsibilities", [])
            achievements = exp.get("achievements", [])
            
            detail_quote = achievements[0] if achievements else (resps[0] if resps else "Delivered enterprise features")

            q_text = (
                f"During your tenure as {title} at {company} ({dates}), your resume mentions '{detail_quote}'. "
                f"Can you explain your exact individual contribution vs the team's role, and describe the deployment, monitoring, and scaling lifecycle?"
            )

            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Experience Verification",
                "target_topic": f"{title} at {company}",
                "question": q_text,
                "context_source": f"Work History: {title} at {company} ({dates})",
                "rationale": "Verify actual duration, role seniority, team context, and operational scale.",
                "expected_signals": [
                    "Distinguishes individual coding/architecture vs team collaboration.",
                    "Speaks accurately about release cadence, CI/CD pipelines, and observability."
                ],
                "red_flags": ["Claims total ownership of team projects without understanding deployment/monitoring."],
                "difficulty": "Standard"
            })

        return questions

    @classmethod
    def _generate_skill_verification_questions(
        cls, evals: List[Dict[str, Any]], skills_in_list_only: List[str], stuffed_skills: List[str]
    ) -> List[Dict[str, Any]]:
        questions = []
        
        # 1. Weak evidence evaluations
        weak_evals = [e for e in evals if e["evidence_strength"] in ["Weak evidence", "Basic mention / list only"]]
        for we in weak_evals[:3]:
            skill = we["requirement"]
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Skill Verification",
                "target_topic": skill,
                "question": f"Your resume mentions {skill}. Can you describe where, when, and in which specific project or enterprise role you applied {skill} in practice?",
                "context_source": f"Weak Evidence: {we['evidence_text']}",
                "rationale": f"Candidate listed {skill} superficially without substantive project evidence. Verify practical application.",
                "expected_signals": [
                    f"Provides concrete examples of building or debugging with {skill}.",
                    "Demonstrates practical working familiarity rather than buzzword recitation."
                ],
                "red_flags": ["Admits to only reading documentation or having zero practical project experience."],
                "difficulty": "Probing"
            })

        # 2. Skills listed only in generic skills section
        for s in skills_in_list_only[:2]:
            if not any(q["target_topic"] == s for q in questions):
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Skill Verification",
                    "target_topic": s,
                    "question": f"You included '{s}' in your skills section. Could you walk through a real-world scenario where you used {s} to solve a production problem?",
                    "context_source": f"Generic Skill List mention: '{s}'",
                    "rationale": f"Verify whether '{s}' is an active capability or a resume filler.",
                    "expected_signals": ["Gives clear technical breakdown of real problem and solution."],
                    "red_flags": ["Cannot recall specific projects or libraries used."],
                    "difficulty": "Probing"
                })

        return questions

    @classmethod
    def _generate_clarification_questions(
        cls, evals: List[Dict[str, Any]], noise: Dict[str, Any], resume: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        questions = []

        # 1. Missing mandatory requirements
        missing_mandatory = [e for e in evals if e["status"] == "MISSING" and e["importance"] == "MANDATORY"]
        for mm in missing_mandatory[:2]:
            req = mm["requirement"]
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Clarification",
                "target_topic": f"Missing Skill: {req}",
                "question": f"This position requires hands-on experience with {req}, which was not explicitly referenced in your resume. Have you worked with {req} or equivalent tools in unlisted projects, open-source work, or prior roles?",
                "context_source": "Zero-Hallucination Gap Detection (Missing from Resume Text)",
                "rationale": "Clarify candidate capability on mandatory criteria not detected in resume text.",
                "expected_signals": [
                    f"Candidate explains hands-on experience in {req} or strong transferable concepts.",
                    "Provides honest assessment of current ramp-up time needed."
                ],
                "red_flags": ["Misleads or becomes evasive regarding core requirements."],
                "difficulty": "Probing"
            })

        # 2. Uncertain claims
        uncertain_evals = [e for e in evals if e["status"] == "UNCERTAIN"]
        for ue in uncertain_evals[:2]:
            req = ue["requirement"]
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Clarification",
                "target_topic": f"Uncertain Claim: {req}",
                "question": f"Your resume includes a mention of {req} ({ue['evidence_text']}). Can you clarify the exact scope of your responsibility and the scale of the system you supported?",
                "context_source": f"Ambiguous evidence snippet: \"{ue['evidence_text']}\"",
                "rationale": "Resolve ambiguity in candidate's claimed experience.",
                "expected_signals": ["Provides precise metrics, configurations, and architecture."],
                "red_flags": ["Repeats vague bullet point without technical substance."],
                "difficulty": "Probing"
            })

        # 3. JD Copy-Paste detection
        if noise.get("jd_copy_paste_detected"):
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Clarification",
                "target_topic": "JD Alignment & Technical Authenticity",
                "question": "Several bullet points in your resume closely match standard job description phrasing. Can you step away from the resume wording and describe in your own words the most technically demanding service you built?",
                "context_source": "Noise Telemetry: Verbatim JD Language Match Flagged",
                "rationale": "Ensure candidate actually performed the work rather than copy-pasting requirements.",
                "expected_signals": ["Speaks with natural authenticity and deep technical nuance."],
                "red_flags": ["Struggles to describe basic technical details outside of scripted bullet points."],
                "difficulty": "Probing"
            })

        return questions

    @classmethod
    def _build_interviewer_briefing(
        cls, candidate_name: str, job_title: str, match_score: float, match_grade: str, eval_result: Dict[str, Any], noise: Dict[str, Any]
    ) -> str:
        exp_summary = eval_result.get("experience_details", {}).get("verified_experience_summary", "Professional Experience")
        strong_matches = eval_result.get("strong_matches", [])
        missing = eval_result.get("missing_requirements", [])
        noise_level = noise.get("noise_level", "Low")

        briefing = (
            f"**Interviewer Briefing for {candidate_name} ({job_title})**\n\n"
            f"- **Match Assessment**: Overall Match Score is **{match_score}% ({match_grade})**.\n"
            f"- **Verified Experience**: ~{eval_result.get('experience_details', {}).get('verified_experience_months', 0)} months verified ({exp_summary}).\n"
            f"- **Validated Strengths**: Deep verified evidence for `{', '.join(strong_matches[:5]) if strong_matches else 'General Software Engineering'}`.\n"
            f"- **Identified Gaps**: Missing explicit resume evidence for `{', '.join(missing[:4]) if missing else 'None'}`.\n"
            f"- **Integrity & Noise**: **{noise_level} Noise Level** ({noise.get('total_keyword_occurrences', 0)} keyword mentions vs {noise.get('total_evidence_backed_occurrences', 0)} verified citations).\n\n"
            f"**Recommended Focus**: "
            f"Focus interview questions on validating technical depth in strong areas ({', '.join(strong_matches[:3]) if strong_matches else 'Core Tech'}) "
            f"and probing unlisted mandatory skills ({', '.join(missing[:2]) if missing else 'General fit'})."
        )
        return briefing
