import re
from typing import Dict, List, Any, Optional
from app.parsers.skill_normalizer import SkillNormalizer

# Configurable evidence strength scoring weights (1.0 to 10.0)
DEFAULT_STRENGTH_WEIGHTS = {
    "Leadership/ownership": 10.0,
    "Production/deployed experience": 9.0,
    "Professional experience": 8.0,
    "Internship": 7.0,
    "Personal project": 6.0,
    "Academic project": 5.0,
    "Course/training": 3.5,
    "Skill-list mention": 2.0,
    "Mere mention": 1.0,
    "No evidence": 0.0,
}

LEADERSHIP_VERBS = [
    "architected", "led", "spearheaded", "mentored", "championed", "directed", "managed",
    "founded", "head of", "principal", "lead", "orchestrated", "owned", "scaled"
]

PRODUCTION_INDICATORS = [
    "production", "deployed", "high scale", "high throughput", "million", "billion", "latency",
    "p99", "traffic", "enterprise", "99.9", "availability", "distributed", "cluster", "microservices"
]

class EvidenceExtractor:
    @staticmethod
    def extract_evidence(
        requirement_or_skill: str,
        resume_record: Dict[str, Any],
        scoring_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Scans a candidate resume record and extracts verifiable evidence
        for a specific requirement or skill.
        Never invents evidence. If not present, returns 'Evidence not found in resume.'
        """
        weights = scoring_weights or DEFAULT_STRENGTH_WEIGHTS
        norm_info = SkillNormalizer.normalize_skill(requirement_or_skill)
        canonical_skill = norm_info["normalized_skill"]
        raw_target = norm_info["original_skill"]

        # Search tokens
        search_terms = {canonical_skill.lower(), raw_target.lower()}
        if canonical_skill == "PostgreSQL":
            search_terms.update(["postgres", "postgresql"])
        elif canonical_skill == "Kubernetes":
            search_terms.update(["k8s", "kubernetes"])
        elif canonical_skill == "Machine Learning":
            search_terms.update(["machine learning", "ml"])
        elif canonical_skill == "AWS":
            search_terms.update(["aws", "amazon web services"])
        elif canonical_skill == "GCP":
            search_terms.update(["gcp", "google cloud"])
        elif canonical_skill == "React":
            search_terms.update(["react", "reactjs", "react.js"])
        elif canonical_skill == "Node.js":
            search_terms.update(["node.js", "nodejs", "node"])

        parsed_data = resume_record.get("parsed_data") or {}
        raw_text = resume_record.get("raw_text") or ""
        experiences = parsed_data.get("work_experience") or []
        projects = parsed_data.get("projects") or []
        education = parsed_data.get("education") or []
        certifications = parsed_data.get("certifications") or []
        skills_list = parsed_data.get("skills") or []

        candidate_name = resume_record.get("candidate_name") or "Candidate"

        candidates_evidence: List[Dict[str, Any]] = []

        # 1. Search Work Experience (highest evidence value)
        for exp in experiences:
            job_title = exp.get("job_title", "Software Engineer")
            company = exp.get("company", "Company")
            dates = exp.get("employment_dates", "Recent")
            is_current = bool(re.search(r"(present|current|now)", dates, re.IGNORECASE))
            recency = f"Current ({dates})" if is_current else f"Past ({dates})"

            all_bullets = (exp.get("responsibilities") or []) + (exp.get("achievements") or [])
            for bullet in all_bullets:
                if EvidenceExtractor._contains_term(bullet, search_terms):
                    strength, conf = EvidenceExtractor._evaluate_bullet_strength(bullet, job_title)
                    candidates_evidence.append({
                        "requirement": requirement_or_skill,
                        "skill": canonical_skill,
                        "evidence_text": bullet.strip(),
                        "resume_location": f"Work Experience - {company} ({job_title})",
                        "project_or_job": f"{company} ({job_title})",
                        "duration": dates,
                        "recency": recency,
                        "context": f"{job_title} at {company}",
                        "evidence_strength": strength,
                        "evidence_score": weights.get(strength, 8.0),
                        "confidence": conf
                    })

        # 2. Search Projects
        for proj in projects:
            pname = proj.get("name", "Project")
            pdesc = proj.get("description", "")
            ptech = proj.get("technologies") or []

            term_in_tech = any(EvidenceExtractor._contains_term(t, search_terms) for t in ptech)
            term_in_desc = EvidenceExtractor._contains_term(pdesc, search_terms)

            if term_in_tech or term_in_desc:
                is_prod = any(w in pdesc.lower() for w in PRODUCTION_INDICATORS)
                strength = "Production/deployed experience" if is_prod else "Personal project"
                evidence_snippet = pdesc.strip() if pdesc.strip() else f"Applied {canonical_skill} in {pname}."

                candidates_evidence.append({
                    "requirement": requirement_or_skill,
                    "skill": canonical_skill,
                    "evidence_text": evidence_snippet,
                    "resume_location": f"Projects - {pname}",
                    "project_or_job": pname,
                    "duration": "N/A",
                    "recency": "Project Milestone",
                    "context": f"Technical project: {pname}",
                    "evidence_strength": strength,
                    "evidence_score": weights.get(strength, 6.0),
                    "confidence": 0.88
                })

        # 3. Search Certifications & Courses
        for cert in certifications:
            if EvidenceExtractor._contains_term(cert, search_terms):
                candidates_evidence.append({
                    "requirement": requirement_or_skill,
                    "skill": canonical_skill,
                    "evidence_text": f"Certified: {cert}",
                    "resume_location": "Certifications Section",
                    "project_or_job": cert,
                    "duration": "N/A",
                    "recency": "Certified",
                    "context": "Professional industry certification",
                    "evidence_strength": "Course/training",
                    "evidence_score": weights.get("Course/training", 3.5),
                    "confidence": 0.90
                })

        # 4. Search Education
        for edu in education:
            details = f"{edu.get('degree', '')} {edu.get('details', '')}"
            if EvidenceExtractor._contains_term(details, search_terms):
                candidates_evidence.append({
                    "requirement": requirement_or_skill,
                    "skill": canonical_skill,
                    "evidence_text": details.strip(),
                    "resume_location": f"Education - {edu.get('institution', 'University')}",
                    "project_or_job": edu.get("institution", "University"),
                    "duration": edu.get("year", "N/A"),
                    "recency": edu.get("year", "N/A"),
                    "context": "Academic degree and curriculum",
                    "evidence_strength": "Academic project",
                    "evidence_score": weights.get("Academic project", 5.0),
                    "confidence": 0.85
                })

        # 5. Search Skills List
        for s in skills_list:
            if EvidenceExtractor._contains_term(s, search_terms):
                candidates_evidence.append({
                    "requirement": requirement_or_skill,
                    "skill": canonical_skill,
                    "evidence_text": f"Listed skill: '{s}'",
                    "resume_location": "Skills & Core Competencies Section",
                    "project_or_job": "Self-Reported Skill",
                    "duration": "N/A",
                    "recency": "N/A",
                    "context": "Skill list keyword mention",
                    "evidence_strength": "Skill-list mention",
                    "evidence_score": weights.get("Skill-list mention", 2.0),
                    "confidence": 0.70
                })

        # 6. Fallback Search in Raw Text Lines if no structured match found
        if not candidates_evidence and raw_text:
            for line in raw_text.split("\n"):
                line_str = line.strip()
                if len(line_str) > 10 and EvidenceExtractor._contains_term(line_str, search_terms):
                    candidates_evidence.append({
                        "requirement": requirement_or_skill,
                        "skill": canonical_skill,
                        "evidence_text": line_str,
                        "resume_location": "Resume Text Body",
                        "project_or_job": "Resume Context",
                        "duration": "N/A",
                        "recency": "N/A",
                        "context": "Verbatim text snippet",
                        "evidence_strength": "Mere mention",
                        "evidence_score": weights.get("Mere mention", 1.0),
                        "confidence": 0.60
                    })
                    break

        # Pick best evidence item if multiple exist (highest evidence score)
        if candidates_evidence:
            candidates_evidence.sort(key=lambda x: x["evidence_score"], reverse=True)
            return candidates_evidence[0]

        # Explicit 'Evidence not found' (never invent evidence!)
        return {
            "requirement": requirement_or_skill,
            "skill": canonical_skill,
            "evidence_text": "Evidence not found in resume.",
            "resume_location": "N/A",
            "project_or_job": "N/A",
            "duration": None,
            "recency": "N/A",
            "context": "No direct mention or verifiable evidence found in parsed document.",
            "evidence_strength": "No evidence",
            "evidence_score": weights.get("No evidence", 0.0),
            "confidence": 0.0
        }

    @staticmethod
    def extract_all_evidence(
        requirements_or_skills: List[str],
        resume_record: Dict[str, Any],
        scoring_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract evidence for a list of requirements or skills against a candidate resume.
        """
        results = []
        for req in requirements_or_skills:
            if req and req.strip():
                ev = EvidenceExtractor.extract_evidence(req, resume_record, scoring_weights)
                results.append(ev)
        return results

    @staticmethod
    def _contains_term(text: str, search_terms: set[str]) -> bool:
        lower = text.lower()
        for term in search_terms:
            pattern = r"(?:\b|_)" + re.escape(term) + r"(?:\b|_)"
            if re.search(pattern, lower):
                return True
        return False

    @staticmethod
    def _evaluate_bullet_strength(bullet: str, job_title: str) -> Tuple[str, float]:
        lower_bullet = bullet.lower()
        lower_title = job_title.lower()

        # Check for Leadership / Ownership
        if any(v in lower_bullet or v in lower_title for v in LEADERSHIP_VERBS):
            return "Leadership/ownership", 0.95

        # Check for Production / Deployed Experience
        if any(w in lower_bullet for w in PRODUCTION_INDICATORS):
            return "Production/deployed experience", 0.92

        # Check for Internship
        if "intern" in lower_title or "internship" in lower_bullet:
            return "Internship", 0.85

        # Standard Professional Experience
        return "Professional experience", 0.88
