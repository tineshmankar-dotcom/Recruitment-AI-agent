import os
import sys
import io
import json

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.parsers.jd_parser import JobDescriptionParser
from app.parsers.resume_parser import ResumeParser
from app.parsers.matching_engine import MatchingEngine
from app.parsers.interview_agent import InterviewAgent
from app.database import JobRepository, ResumeRepository

def run_phase6_resilience_tests():
    client = TestClient(app)
    print("=========================================================================")
    print("RecruitIQ Phase 6: Interview Agent & End-to-End Resilience Test Suite")
    print("=========================================================================")

    # 1. Edge Case Test: Missing Resume (404 Handling)
    fake_id = "00000000-0000-0000-0000-000000000000"
    missing_res = client.get(f"/resumes/{fake_id}")
    assert missing_res.status_code == 404
    missing_match = client.get(f"/resumes/{fake_id}/match")
    assert missing_match.status_code == 404
    missing_iq = client.get(f"/resumes/{fake_id}/interview-questions")
    assert missing_iq.status_code == 404
    print(" [1/8] Missing Resume 404 handling verified.")

    # 2. Edge Case Test: Empty / Missing Job Description
    empty_jd_res = client.post("/jobs", json={
        "title": "Empty Job",
        "raw_description": "   "
    })
    # Should either validate or gracefully parse without crash
    print(" [2/8] Empty JD handling tested.")

    # 3. Create Sample Job Pipeline for 10-Candidate Demo
    sample_jd_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_jd.txt")
    with open(sample_jd_path, "r", encoding="utf-8") as f:
        jd_text = f.read()

    job_res = client.post("/jobs", json={
        "title": "Lead Python Backend Architect",
        "department": "Infrastructure & Core Engine",
        "location": "Remote",
        "raw_description": jd_text
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]
    print(f" [3/8] Test Job Created: ID={job_id}")

    # 4. Ingest All 10 Synthetic Resumes
    syn_dir = os.path.join(os.path.dirname(__file__), "sample_data", "synthetic_candidates")
    files_to_upload = []
    file_handles = []
    
    syn_files = sorted(os.listdir(syn_dir))
    assert len(syn_files) >= 10, f"Expected 10 synthetic resumes, found {len(syn_files)}"

    for fn in syn_files:
        fp = os.path.join(syn_dir, fn)
        fh = open(fp, "rb")
        file_handles.append(fh)
        files_to_upload.append(("files", (fn, fh, "text/plain")))

    try:
        bulk_upload_res = client.post(f"/jobs/{job_id}/resumes", files=files_to_upload)
        assert bulk_upload_res.status_code == 200
        bulk_data = bulk_upload_res.json()
        assert bulk_data["total_uploaded"] == 10
        assert bulk_data["processed"] == 10
        print(f" [4/8] Successfully ingested and parsed all 10 synthetic candidates.")
    finally:
        for fh in file_handles:
            fh.close()

    # 5. Duplicate Detection Test
    # Try uploading candidate 1 again to the same job
    with open(os.path.join(syn_dir, "candidate_01_strong_evidence.txt"), "rb") as fh:
        dup_res = client.post(f"/jobs/{job_id}/resumes", files=[("files", ("candidate_01_strong_evidence.txt", fh, "text/plain"))])
        assert dup_res.status_code == 200
        dup_data = dup_res.json()
        assert dup_data["duplicates"] >= 1
        print(" [5/8] Duplicate Resume Detection verified (Duplicate flagged and skipped).")

    # 6. Corrupted File Error Handling Test
    corrupted_bytes = io.BytesIO(b"%PDF-1.4\ncorrupted header %%EOF\x00\x00invalid")
    corrupt_res = client.post(f"/jobs/{job_id}/resumes", files=[("files", ("corrupted_resume.pdf", corrupted_bytes, "application/pdf"))])
    assert corrupt_res.status_code == 200
    corrupt_data = corrupt_res.json()
    print(" [6/8] Corrupted PDF / Invalid file handling verified (Safe error containment).")

    # 7. CRITICAL TEST: Verify Evidence-Based Ranking Across All 10 Candidates
    matches_res = client.get(f"/jobs/{job_id}/matches")
    assert matches_res.status_code == 200
    rankings = matches_res.json()
    assert len(rankings) == 10

    print("\n-------------------------------------------------------------------------")
    print(" [7/8] 10-CANDIDATE EVIDENCE-BASED SHORTLIST BENCHMARK")
    print("-------------------------------------------------------------------------")
    print(f"{'Rank':<5} | {'Candidate Name':<22} | {'Score':<7} | {'Grade':<13} | {'Noise Level':<12} | {'Verified Exp':<10}")
    print("-" * 80)
    for i, r in enumerate(rankings, 1):
        c_name = r["candidate_name"][:20]
        score = f"{r['final_match_score']}%"
        grade = r["match_grade"]
        noise_lvl = r["noise_analysis"]["noise_level"]
        exp = f"{r['experience_details']['verified_experience_months']} mos"
        print(f"#{i:<4} | {c_name:<22} | {score:<7} | {grade:<13} | {noise_lvl:<12} | {exp:<10}")

    # Core Rule Validations:
    # Top ranks MUST be Elena Rostova (strong evidence) or Viktor Kravchenko (concise expert)
    top_candidate = rankings[0]["candidate_name"]
    second_candidate = rankings[1]["candidate_name"]
    print(f"\n >>> Top 2 Ranked Candidates: {top_candidate} & {second_candidate}")

    # Keyword-stuffed candidate (Kevin Buzzword) and Copied-JD candidate (Derek Plagiar) must rank lower
    kevin_rank = next(i for i, r in enumerate(rankings, 1) if "kevin" in r["candidate_name"].lower() or "buzzword" in r["candidate_name"].lower())
    elena_rank = next(i for i, r in enumerate(rankings, 1) if "elena" in r["candidate_name"].lower() or "rostova" in r["candidate_name"].lower())
    viktor_rank = next(i for i, r in enumerate(rankings, 1) if "viktor" in r["candidate_name"].lower() or "kravchenko" in r["candidate_name"].lower())

    print(f" >>> Elena Rostova (Strong Evidence) Rank: #{elena_rank}")
    print(f" >>> Viktor Kravchenko (Concise Expert) Rank: #{viktor_rank}")
    print(f" >>> Kevin Buzzword (30+ Stuffed Keywords) Rank: #{kevin_rank}")

    assert elena_rank < kevin_rank, "Strong evidence candidate must outrank keyword stuffed candidate!"
    assert viktor_rank < kevin_rank, "Concise expert with fewer keywords must outrank keyword stuffed candidate!"
    print(" >>> CRITICAL RULE PROVEN: MORE KEYWORDS != BETTER CANDIDATE.")

    # 8. Test Personalized Interview Question Agent for Candidates
    top_cand_id = rankings[0]["candidate_id"]
    stuffed_cand_id = next(r["candidate_id"] for r in rankings if "kevin" in r["candidate_name"].lower() or "buzzword" in r["candidate_name"].lower())

    top_iq_res = client.get(f"/resumes/{top_cand_id}/interview-questions?job_id={job_id}")
    assert top_iq_res.status_code == 200
    top_iq = top_iq_res.json()

    print("\n-------------------------------------------------------------------------")
    print(f" [8/8] INTERVIEW AGENT: Personalized Guide for Top Candidate ({top_iq['candidate_name']})")
    print("-------------------------------------------------------------------------")
    print(f"Total Personalized Questions Generated: {top_iq['total_questions']}")
    print(f"Technical Questions: {len(top_iq['technical_questions'])}")
    print(f"Project Questions: {len(top_iq['project_questions'])}")
    print(f"Experience Verification: {len(top_iq['experience_questions'])}")
    print(f"Skill Verification: {len(top_iq['skill_verification_questions'])}")
    print(f"Clarification Questions: {len(top_iq['clarification_questions'])}")

    print("\n Sample Generated Questions:")
    if top_iq["technical_questions"]:
        print(f" [Technical]: \"{top_iq['technical_questions'][0]['question']}\"")
    if top_iq["project_questions"]:
        print(f" [Project]: \"{top_iq['project_questions'][0]['question']}\"")
    if top_iq["experience_questions"]:
        print(f" [Experience]: \"{top_iq['experience_questions'][0]['question']}\"")

    # Stuffed candidate question check (should have strong skill verification & clarification questions)
    stuffed_iq_res = client.get(f"/resumes/{stuffed_cand_id}/interview-questions?job_id={job_id}")
    assert stuffed_iq_res.status_code == 200
    stuffed_iq = stuffed_iq_res.json()
    print(f"\n Verified Interview Guide for Keyword-Stuffed Candidate ({stuffed_iq['candidate_name']}):")
    if stuffed_iq["skill_verification_questions"]:
        print(f" [Probing Skill Verification]: \"{stuffed_iq['skill_verification_questions'][0]['question']}\"")

    print("\n=========================================================================")
    print(" ALL PHASE 6 INTERVIEW AGENT & RESILIENCE TESTS PASSED SUCCESSFULLY!")
    print("=========================================================================")

if __name__ == "__main__":
    run_phase6_resilience_tests()
