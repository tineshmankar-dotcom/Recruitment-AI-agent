import os
import sys
import json

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("================================================================")
    print("RecruitIQ Phase 4: Evidence-Based Matching & Noise Detection")
    print("================================================================")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    print(" [1/9] Health check OK.")

    # 2. Test Skill Normalization
    raw_skills = ["Python programming", "Python 3", "ML", "AWS Cloud", "Postgres"]
    norm_res = client.post("/skills/normalize", json=raw_skills)
    assert norm_res.status_code == 200
    print(" [2/9] Skill Normalization OK.")

    # 3. Create Job
    sample_jd_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_jd.txt")
    with open(sample_jd_path, "r", encoding="utf-8") as f:
        jd_text = f.read()

    create_job_res = client.post("/jobs", json={
        "title": "Lead Python Backend Architect",
        "department": "Platform & Core Infrastructure",
        "location": "Remote",
        "raw_description": jd_text
    })
    assert create_job_res.status_code == 201
    job_id = create_job_res.json()["id"]
    print(f" [3/9] Job Created: ID={job_id}")

    # 4. Mandatory Benchmark Demo: Candidate A vs Candidate B (GET /demo/comparison)
    demo_res = client.get("/demo/comparison")
    assert demo_res.status_code == 200, f"Demo comparison failed: {demo_res.text}"
    demo_data = demo_res.json()
    
    cand_a = demo_data["candidate_a"]
    cand_b = demo_data["candidate_b"]

    print("\n----------------------------------------------------------------")
    print(" [4/9] MANDATORY DEMO: CANDIDATE A vs CANDIDATE B BENCHMARK")
    print("----------------------------------------------------------------")
    print(f" Candidate A: {cand_a['candidate_name']}")
    print(f"   • Python Keyword Mentions: {cand_a['noise_analysis']['total_keyword_occurrences']}")
    print(f"   • Verified Experience: {cand_a['experience_details']['verified_experience_summary']}")
    print(f"   • Noise Level: {cand_a['noise_analysis']['noise_level']} ({cand_a['noise_analysis']['noise_score']*100:.0f}%)")
    print(f"   • Noise Penalty: -{cand_a['score_breakdown']['noise_penalty']} pts")
    print(f"   • Final Match Score: {cand_a['final_match_score']}% ({cand_a['match_grade']})")

    print(f"\n Candidate B: {cand_b['candidate_name']}")
    print(f"   • Python Keyword Mentions: {cand_b['noise_analysis']['total_keyword_occurrences']}")
    print(f"   • Verified Experience: {cand_b['experience_details']['verified_experience_summary']}")
    print(f"   • Noise Level: {cand_b['noise_analysis']['noise_level']} ({cand_b['noise_analysis']['noise_score']*100:.0f}%)")
    print(f"   • Noise Penalty: -{cand_b['score_breakdown']['noise_penalty']} pts")
    print(f"   • Final Match Score: {cand_b['final_match_score']}% ({cand_b['match_grade']})")

    # CRITICAL VALIDATION: Candidate B must outrank Candidate A despite having fewer keywords
    assert cand_b["final_match_score"] > cand_a["final_match_score"], (
        f"Ranking Failure: Candidate B ({cand_b['final_match_score']}%) should outrank Candidate A ({cand_a['final_match_score']}%)"
    )
    print(f"\n >>> VERIFIED: Candidate B ({cand_b['final_match_score']}%) OUTRANKS Candidate A ({cand_a['final_match_score']}%)!")
    print(f" >>> Winner: {demo_data['winner']}")

    # 5. Verify Python Evidence Strength in Candidate B vs Candidate A
    cand_a_py_ev = next(e for e in cand_a["requirement_evaluations"] if e["requirement"] == "Python")
    cand_b_py_ev = next(e for e in cand_b["requirement_evaluations"] if e["requirement"] == "Python")

    print(f"\n [5/9] Evidence Strength Comparison for 'Python':")
    print(f"   • Candidate A: {cand_a_py_ev['evidence_strength']} (Score: {cand_a_py_ev['evidence_score']}/10.0)")
    print(f"     Snippet: \"{cand_a_py_ev['evidence_text']}\"")
    print(f"   • Candidate B: {cand_b_py_ev['evidence_strength']} (Score: {cand_b_py_ev['evidence_score']}/10.0)")
    print(f"     Snippet: \"{cand_b_py_ev['evidence_text']}\"")

    assert cand_b_py_ev["evidence_score"] > cand_a_py_ev["evidence_score"], "Candidate B should have higher evidence score"

    # 6. Verify Requirement Status Classifications (MATCHED, PARTIALLY MATCHED, MISSING, UNCERTAIN)
    print(f"\n [6/9] Requirement Classification Verification:")
    statuses_seen = set()
    for ev in cand_b["requirement_evaluations"]:
        statuses_seen.add(ev["status"])
        if ev["status"] == "MATCHED":
            print(f"   • MATCHED: {ev['requirement']} ({ev['evidence_strength']})")
        elif ev["status"] == "MISSING":
            print(f"   • MISSING: {ev['requirement']} -> '{ev['status_explanation']}'")

    assert "MATCHED" in statuses_seen
    assert "MISSING" in statuses_seen

    # 7. Upload candidates to DB and test live ranking endpoint
    cand_a_path = os.path.join(os.path.dirname(__file__), "sample_data", "candidate_a_stuffed.txt")
    cand_b_path = os.path.join(os.path.dirname(__file__), "sample_data", "candidate_b_evidence.txt")

    with open(cand_a_path, "rb") as fa, open(cand_b_path, "rb") as fb:
        files = [
            ("files", ("candidate_a_stuffed.txt", fa, "text/plain")),
            ("files", ("candidate_b_evidence.txt", fb, "text/plain"))
        ]
        upload_res = client.post(f"/jobs/{job_id}/resumes", files=files)

    assert upload_res.status_code == 200
    print(f"\n [7/9] Seeded Candidates to Job ID {job_id}.")

    # 8. Test Ranked Candidates (GET /jobs/{job_id}/matches)
    rankings_res = client.get(f"/jobs/{job_id}/matches")
    assert rankings_res.status_code == 200
    rankings = rankings_res.json()
    print(f" [8/9] Job Candidate Rankings (Ordered by Evidence Score):")
    for i, r in enumerate(rankings, 1):
        print(f"   {i}. {r['candidate_name']} - Score: {r['final_match_score']}% ({r['match_grade']}) - Noise: {r['noise_analysis']['noise_level']}")

    assert rankings[0]["final_match_score"] >= rankings[1]["final_match_score"]
    assert "Brenda" in rankings[0]["candidate_name"]

    # 9. Verify 'Why this score?' text explainability
    print(f"\n [9/9] Verified 'Why this score?' rationale generation for top candidate:")
    print("----------------------------------------------------------------")
    print(rankings[0]["why_this_score"])
    print("----------------------------------------------------------------")

    print("\n ALL PHASE 4 MATCHING & NOISE DETECTION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
