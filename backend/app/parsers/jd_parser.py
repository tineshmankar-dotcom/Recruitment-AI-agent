import re
from typing import Dict, List, Any, Optional

COMMON_TECH_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Golang", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", ".NET",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "SQLite", "SQL Server", "Oracle",
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "Git", "GitHub Actions", "Linux",
    "GraphQL", "REST API", "gRPC", "Microservices", "Kafka", "RabbitMQ", "Celery",
    "Machine Learning", "Deep Learning", "NLP", "LLMs", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy",
    "Tailwind CSS", "HTML5", "CSS3", "Redux", "Zustand", "Webpack", "Vite"
]

COMMON_SOFT_SKILLS = [
    "Communication", "Leadership", "Problem Solving", "Collaboration", "Teamwork", "Agility", "Critical Thinking",
    "Mentorship", "Time Management", "Adaptability", "Conflict Resolution", "Ownership", "Analytical Skills",
    "Cross-functional Collaboration", "Stakeholder Management", "Self-starter"
]

COMMON_DOMAINS = [
    "Fintech", "Healthtech", "Healthcare", "E-commerce", "SaaS", "Enterprise Software", "Cloud Infrastructure",
    "AI/ML", "Cybersecurity", "EdTech", "DevOps", "AdTech", "Payments", "Data Analytics", "Distributed Systems"
]

COMMON_DEGREES = [
    "Bachelor's", "Master's", "PhD", "B.S.", "M.S.", "B.Tech", "M.Tech", "B.E.", "M.E.", "BCA", "MCA",
    "Computer Science", "Information Technology", "Software Engineering", "Electrical Engineering", "Data Science", "Mathematics"
]

COMMON_CERTS = [
    "AWS Certified Solutions Architect", "AWS Certified Developer", "AWS Certified", "CKA", "CKAD",
    "Google Cloud Certified", "Azure Certified", "PMP", "CISSP", "CompTIA Security+", "CFA", "Scrum Master", "CSM"
]

class JobDescriptionParser:
    @staticmethod
    def parse(text: str, default_title: Optional[str] = None) -> Dict[str, Any]:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # 1. Job Title Extraction
        job_title = default_title or JobDescriptionParser._extract_job_title(lines, text)
        
        # 2. Section Partitioning
        sections = JobDescriptionParser._partition_sections(text)
        
        # 3. Required vs Preferred Skills extraction
        req_skills, pref_skills, all_tech_skills = JobDescriptionParser._extract_skills(text, sections)
        
        # 4. Required Experience
        req_exp_str, min_years = JobDescriptionParser._extract_experience(text)
        
        # 5. Education
        education = JobDescriptionParser._extract_education(text, sections)
        
        # 6. Certifications
        certifications = JobDescriptionParser._extract_certifications(text)
        
        # 7. Responsibilities
        responsibilities = JobDescriptionParser._extract_responsibilities(sections, text)
        
        # 8. Technical requirements
        tech_requirements = JobDescriptionParser._extract_tech_requirements(sections, all_tech_skills)
        
        # 9. Domain requirements
        domain_requirements = JobDescriptionParser._extract_domain_requirements(text)
        
        # 10. Soft skills
        soft_skills = JobDescriptionParser._extract_soft_skills(text)
        
        # 11. Classify requirements as MANDATORY, PREFERRED, OPTIONAL
        classified_requirements = JobDescriptionParser._build_classified_requirements(
            req_skills=req_skills,
            pref_skills=pref_skills,
            all_tech=all_tech_skills,
            min_years=min_years,
            soft_skills=soft_skills,
            domains=domain_requirements,
            education=education
        )

        return {
            "job_title": job_title,
            "required_skills": list(set(req_skills)),
            "preferred_skills": list(set(pref_skills)),
            "required_experience": req_exp_str,
            "min_years_experience": min_years,
            "education": education,
            "certifications": certifications,
            "responsibilities": responsibilities,
            "technical_requirements": tech_requirements,
            "domain_requirements": domain_requirements,
            "soft_skills": soft_skills,
            "classified_requirements": classified_requirements
        }

    @staticmethod
    def _extract_job_title(lines: List[str], text: str) -> str:
        # Check for explicit title labels
        for line in lines[:8]:
            m = re.match(r"^(?:Job\s*Title|Position|Role|Title)\s*[:\-]\s*(.+)$", line, re.IGNORECASE)
            if m:
                return m.group(1).strip()
                
        # Common title keywords
        title_keywords = ["Engineer", "Developer", "Architect", "Manager", "Scientist", "Analyst", "Designer", "Lead", "Consultant", "Director"]
        for line in lines[:5]:
            if any(kw.lower() in line.lower() for kw in title_keywords) and len(line.split()) < 8:
                return line.strip("# *:")
                
        return lines[0] if lines else "Software Professional"

    @staticmethod
    def _partition_sections(text: str) -> Dict[str, str]:
        sections: Dict[str, List[str]] = {
            "responsibilities": [],
            "requirements": [],
            "preferred": [],
            "education": [],
            "about": []
        }
        
        current_sec = "about"
        lines = text.split("\n")
        
        for line in lines:
            trimmed = line.strip()
            lower = trimmed.lower()
            
            if re.search(r"(responsibilit|what you('ll| will) do|duties|the role|key tasks)", lower):
                current_sec = "responsibilities"
                continue
            elif re.search(r"(must have|required|requirements|qualifications|what you bring|skills required|what we are looking for)", lower):
                current_sec = "requirements"
                continue
            elif re.search(r"(nice to have|preferred|bonus|plus|desired|optional)", lower):
                current_sec = "preferred"
                continue
            elif re.search(r"(education|degree|academic)", lower):
                current_sec = "education"
                continue
                
            sections[current_sec].append(line)
            
        return {k: "\n".join(v) for k, v in sections.items()}

    @staticmethod
    def _extract_skills(text: str, sections: Dict[str, str]):
        req_text = sections.get("requirements", "")
        pref_text = sections.get("preferred", "")
        
        req_skills = []
        pref_skills = []
        all_found = []
        
        for skill in COMMON_TECH_SKILLS:
            pattern = r"(?:\b|_)" + re.escape(skill) + r"(?:\b|_)"
            if re.search(pattern, text, re.IGNORECASE):
                all_found.append(skill)
                if re.search(pattern, req_text, re.IGNORECASE):
                    req_skills.append(skill)
                elif re.search(pattern, pref_text, re.IGNORECASE):
                    pref_skills.append(skill)
                else:
                    req_skills.append(skill)
                    
        # If no split occurred, populate required
        if not req_skills and all_found:
            req_skills = all_found[:max(1, int(len(all_found) * 0.7))]
            pref_skills = all_found[len(req_skills):]
            
        return req_skills, pref_skills, all_found

    @staticmethod
    def _extract_experience(text: str):
        patterns = [
            r"(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:-\s*(\d+))?\s*years?(?:\s+of)?(?:\s+relevant|\s+practical|\s+professional|\s+work)?\s+experience",
            r"at least\s+(\d+)\s+years?",
            r"minimum\s+(?:of\s+)?(\d+)\s+years?"
        ]
        
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                years = int(m.group(1))
                return f"{years}+ years of relevant experience", years
                
        return "Not explicitly specified", 0

    @staticmethod
    def _extract_education(text: str, sections: Dict[str, str]) -> List[str]:
        found = []
        for deg in COMMON_DEGREES:
            if re.search(r"\b" + re.escape(deg) + r"\b", text, re.IGNORECASE):
                found.append(deg)
        if not found:
            return ["Bachelor's degree in Computer Science or equivalent practical experience"]
        return list(set(found))

    @staticmethod
    def _extract_certifications(text: str) -> List[str]:
        found = []
        for cert in COMMON_CERTS:
            if re.search(r"\b" + re.escape(cert) + r"\b", text, re.IGNORECASE):
                found.append(cert)
        return found

    @staticmethod
    def _extract_responsibilities(sections: Dict[str, str], text: str) -> List[str]:
        resp_text = sections.get("responsibilities", "")
        if not resp_text:
            resp_text = text
            
        bullets = []
        for line in resp_text.split("\n"):
            line = line.strip()
            if re.match(r"^[\*\-\•\d+\.]\s+(.+)$", line):
                content = re.sub(r"^[\*\-\•\d+\.]\s+", "", line).strip()
                if len(content) > 15:
                    bullets.append(content)
                    
        return bullets[:8] if bullets else [
            "Architect and develop scalable features and robust backend/frontend architectures",
            "Collaborate with cross-functional product and engineering teams",
            "Maintain high standards of code quality, unit testing, and system reliability"
        ]

    @staticmethod
    def _extract_tech_requirements(sections: Dict[str, str], all_tech: List[str]) -> List[str]:
        req_lines = []
        req_text = sections.get("requirements", "")
        for line in req_text.split("\n"):
            line = line.strip()
            if re.match(r"^[\*\-\•]\s+(.+)$", line) and len(line) > 15:
                req_lines.append(re.sub(r"^[\*\-\•]\s+", "", line).strip())
                
        if req_lines:
            return req_lines[:8]
        return [f"Strong proficiency in {t}" for t in all_tech[:5]]

    @staticmethod
    def _extract_domain_requirements(text: str) -> List[str]:
        found = []
        for dom in COMMON_DOMAINS:
            if re.search(r"\b" + re.escape(dom) + r"\b", text, re.IGNORECASE):
                found.append(dom)
        return list(set(found))

    @staticmethod
    def _extract_soft_skills(text: str) -> List[str]:
        found = []
        for soft in COMMON_SOFT_SKILLS:
            if re.search(r"\b" + re.escape(soft) + r"\b", text, re.IGNORECASE):
                found.append(soft)
        if not found:
            return ["Problem Solving", "Communication", "Collaboration"]
        return list(set(found))

    @staticmethod
    def _build_classified_requirements(
        req_skills: List[str],
        pref_skills: List[str],
        all_tech: List[str],
        min_years: int,
        soft_skills: List[str],
        domains: List[str],
        education: List[str]
    ) -> List[Dict[str, Any]]:
        classified = []
        
        # Mandatory tech skills
        for s in req_skills:
            classified.append({
                "skill": s,
                "importance": "mandatory",
                "minimum_experience": min_years if min_years > 0 else 2,
                "category": "Technical Skill"
            })
            
        # Preferred tech skills
        for s in pref_skills:
            if s not in req_skills:
                classified.append({
                    "skill": s,
                    "importance": "preferred",
                    "minimum_experience": max(1, min_years - 1) if min_years > 0 else 1,
                    "category": "Technical Skill"
                })
                
        # Mandatory / Preferred Domain skills
        for d in domains:
            classified.append({
                "skill": d,
                "importance": "preferred" if len(classified) > 4 else "mandatory",
                "minimum_experience": min_years if min_years > 0 else None,
                "category": "Domain Knowledge"
            })
            
        # Soft skills
        for sf in soft_skills:
            classified.append({
                "skill": sf,
                "importance": "preferred",
                "minimum_experience": None,
                "category": "Soft Skill"
            })
            
        # Optional requirements fallback
        if len(classified) < 4:
            classified.append({
                "skill": "Cloud Infrastructure (AWS/GCP)",
                "importance": "optional",
                "minimum_experience": 1,
                "category": "Technical Skill"
            })
            
        return classified
