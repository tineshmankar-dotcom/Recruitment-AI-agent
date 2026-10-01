import re
from typing import Dict, List, Any, Optional, Set
from app.parsers.skill_normalizer import SkillNormalizer

class NoiseDetector:
    """
    Detects keyword stuffing, repeated skills, unsupported claims,
    and copy-pasted JD language in resumes.
    """
    @staticmethod
    def analyze_candidate_noise(
        resume_record: Dict[str, Any],
        jd_record: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        raw_text = resume_record.get("raw_text") or ""
        parsed_data = resume_record.get("parsed_data") or {}
        work_exp = parsed_data.get("work_experience") or []
        projects = parsed_data.get("projects") or []
        skills_list = parsed_data.get("skills") or []
        
        # 1. Total tokens and skill occurrences
        skill_noise_map: Dict[str, Dict[str, Any]] = {}
        all_detected_skills = set(skills_list)
        if jd_record:
            jd_parsed = jd_record.get("parsed_data") or {}
            for req in jd_parsed.get("classified_requirements") or []:
                all_detected_skills.add(req.get("skill"))
            for req in (jd_parsed.get("required_skills") or []) + (jd_parsed.get("preferred_skills") or []):
                all_detected_skills.add(req)

        total_keywords = 0
        total_evidence_backed = 0
        total_strong_evidence = 0
        total_weak_evidence = 0
        stuffed_skills_detected = []

        for skill in all_detected_skills:
            if not skill or not skill.strip():
                continue
                
            norm_info = SkillNormalizer.normalize_skill(skill)
            canonical = norm_info["normalized_skill"]
            
            # Count raw occurrences in full text
            occurrences = NoiseDetector._count_occurrences(raw_text, canonical, skill)
            if occurrences == 0:
                continue

            # Count occurrences in real experience / projects (evidence-backed)
            backed_count, strong_count, weak_count = NoiseDetector._evaluate_contextual_occurrences(
                work_exp, projects, canonical, skill
            )

            # Detect stuffing for this skill
            is_stuffed = False
            noise_ratio = 0.0
            if occurrences >= 5 and backed_count <= 1:
                is_stuffed = True
                stuffed_skills_detected.append(canonical)
            elif occurrences > 0:
                noise_ratio = max(0.0, float(occurrences - backed_count) / float(occurrences))

            skill_noise_map[canonical] = {
                "keyword": canonical,
                "keyword_occurrences": occurrences,
                "evidence_backed_occurrences": backed_count,
                "strong_evidence": strong_count,
                "weak_evidence": weak_count,
                "is_stuffed": is_stuffed,
                "unsupported": (backed_count == 0 and occurrences > 0)
            }

            total_keywords += occurrences
            total_evidence_backed += backed_count
            total_strong_evidence += strong_count
            total_weak_evidence += weak_count

        # 2. Check for JD copy-pasting
        jd_copy_paste_phrases = []
        if jd_record:
            jd_copy_paste_phrases = NoiseDetector._detect_jd_copy_paste(
                raw_text, jd_record.get("raw_description", "")
            )

        # 3. Overall Noise Score (0.0 to 1.0) & Level
        # High ratio of (keywords without evidence) increases noise score
        noise_score = 0.0
        reasons = []

        if total_keywords > 0:
            unbacked_ratio = (total_keywords - total_evidence_backed) / total_keywords
            noise_score += unbacked_ratio * 0.6

        if len(stuffed_skills_detected) > 0:
            noise_score += 0.25
            reasons.append(f"Keyword stuffing detected in: {', '.join(stuffed_skills_detected[:4])}")

        if len(jd_copy_paste_phrases) > 0:
            noise_score += 0.20
            reasons.append(f"Detected {len(jd_copy_paste_phrases)} verbatim phrases matching Job Description phrasing")

        # Check for skills listed ONLY in generic skill section
        skills_only_in_list = [
            k for k, v in skill_noise_map.items() if v["unsupported"]
        ]
        if len(skills_only_in_list) >= 4:
            noise_score += 0.15
            reasons.append(f"{len(skills_only_in_list)} skills listed only in generic list without supporting project/work evidence")

        noise_score = min(1.0, max(0.0, noise_score))

        if noise_score < 0.25:
            noise_level = "Low"
        elif noise_score < 0.55:
            noise_level = "Moderate"
        elif noise_score < 0.75:
            noise_level = "High"
        else:
            noise_level = "Critical"

        if not reasons:
            reasons.append("Clean resume structure with evidence backing listed technical competencies")

        return {
            "noise_level": noise_level,
            "noise_score": round(noise_score, 2),
            "total_keyword_occurrences": total_keywords,
            "total_evidence_backed_occurrences": total_evidence_backed,
            "total_strong_evidence": total_strong_evidence,
            "total_weak_evidence": total_weak_evidence,
            "stuffed_skills": stuffed_skills_detected,
            "skills_only_in_list": skills_only_in_list,
            "jd_copy_paste_detected": len(jd_copy_paste_phrases) > 0,
            "jd_copy_paste_phrases": jd_copy_paste_phrases,
            "noise_reasons": reasons,
            "skill_breakdown": skill_noise_map
        }

    @staticmethod
    def _count_occurrences(text: str, canonical: str, raw_term: str) -> int:
        terms = {canonical.lower(), raw_term.lower()}
        if canonical == "PostgreSQL":
            terms.update(["postgres", "postgresql"])
        elif canonical == "Kubernetes":
            terms.update(["k8s", "kubernetes"])
        elif canonical == "Machine Learning":
            terms.update(["machine learning", "ml"])
        elif canonical == "AWS":
            terms.update(["aws", "amazon web services"])

        count = 0
        for term in terms:
            matches = re.findall(r"(?:\b|_)" + re.escape(term) + r"(?:\b|_)", text, re.IGNORECASE)
            count += len(matches)
        return count

    @staticmethod
    def _evaluate_contextual_occurrences(
        work_exp: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
        canonical: str,
        raw_term: str
    ) -> tuple[int, int, int]:
        backed_count = 0
        strong_count = 0
        weak_count = 0

        terms = {canonical.lower(), raw_term.lower()}
        if canonical == "PostgreSQL":
            terms.update(["postgres", "postgresql"])
        elif canonical == "Kubernetes":
            terms.update(["k8s", "kubernetes"])
        elif canonical == "Machine Learning":
            terms.update(["machine learning", "ml"])

        for exp in work_exp:
            bullets = (exp.get("responsibilities") or []) + (exp.get("achievements") or [])
            title = (exp.get("job_title") or "").lower()
            is_intern = "intern" in title or "internship" in title

            for b in bullets:
                b_lower = b.lower()
                for term in terms:
                    if re.search(r"(?:\b|_)" + re.escape(term) + r"(?:\b|_)", b_lower):
                        backed_count += 1
                        if is_intern:
                            weak_count += 1
                        elif any(w in b_lower for w in ["production", "architected", "deployed", "scaled", "led", "50m", "100k", "microservices"]):
                            strong_count += 1
                        else:
                            strong_count += 1
                        break

        for proj in projects:
            desc = (proj.get("description") or "").lower()
            ptech = [t.lower() for t in (proj.get("technologies") or [])]
            for term in terms:
                if term in ptech or re.search(r"(?:\b|_)" + re.escape(term) + r"(?:\b|_)", desc):
                    backed_count += 1
                    if any(w in desc for w in ["production", "deployed", "ml api", "fastapi", "docker", "aws"]):
                        strong_count += 1
                    else:
                        weak_count += 1
                    break

        return backed_count, strong_count, weak_count

    @staticmethod
    def _detect_jd_copy_paste(resume_text: str, jd_text: str) -> List[str]:
        if not jd_text or len(jd_text) < 50:
            return []
        
        matches = []
        jd_lines = [l.strip() for l in jd_text.split("\n") if len(l.strip()) > 35]
        for line in jd_lines:
            # Clean bullet markers
            cleaned = re.sub(r"^[\*\-\•\d+\.]\s*", "", line).strip().lower()
            if len(cleaned) > 30 and cleaned in resume_text.lower():
                matches.append(line.strip())
        return matches[:4]
