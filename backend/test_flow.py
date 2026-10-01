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
    print("==================================================")
    print("RecruitIQ Phase 3: Skill Normalization & Evidence")
    print("==================================================")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    print(" [1/8] Health check OK.")

    # 2. Test Skill Normalization endpoint (POST /skills/normalize)
    raw_skills = [
        "Python programming", "Python 3", "ML", "AWS Cloud", "Postgres",
        "ReactJS", "K8s", "Node.js", "Java", "JavaScript", "C++", "C#"
    ]
    norm_res = client.post("/skills/normalize", json=raw_skills)
    assert norm_res.status_code == 200, f"Skill normalization failed: {norm_res.text}"
    norm_data = norm_res.json()
    print(f" [2/8] Skill Normalization Tested on {len(raw_skills)} inputs:")
    for item in norm_data:
        print(f"       • '{item['original_skill']}' -> '{item['normalized_skill']}' (Conf: {item['confidence']}, Cat: {item['category']})")

    # Verify specific mappings required
    norm_map = {item["original_skill"]: item["normalized_skill"] for item in norm_data}
    assert norm_map.get("Python programming") == "Python"
    assert norm_map.get("Python 3") == "Python"
    assert norm_map.get("ML") == "Machine Learning"
    assert norm_map.get("AWS Cloud") == "AWS"
    assert norm_map.get("Postgres") == "PostgreSQL"
    # Ensure distinct technologies were not falsely merged
    assert norm_map.get("Java") == "Java"
    assert norm_map.get("JavaScript") == "JavaScript"
    assert norm_map.get("C++") == "C++"
    assert norm_map.get("C#") == "C#"

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
    print(f" [3/8] Job Created: ID={job_id}")

    # 4. Upload Resumes (Alice Johnson & Bob Smith)
    alice_path = os.path.join(os.path.dirname(__file__), "sample_data", "resume_alice.txt")
    bob_path = os.path.join(os.path.dirname(__file__), "sample_data", "resume_bob.txt")

    with open(alice_path, "rb") as fa, open(bob_path, "rb") as fb:
        files = [
            ("files", ("resume_alice.txt", fa, "text/plain")),
            ("files", ("resume_bob.txt", fb, "text/plain"))
        ]
        upload_res = client.post(f"/jobs/{job_id}/resumes", files=files)

    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    alice_id = upload_data["resumes"][0]["id"]
    bob_id = upload_data["resumes"][1]["id"]
    print(f" [4/8] Bulk Resumes Uploaded & Normalized: Alice={alice_id}, Bob={bob_id}")

    # 5. Test Evidence Extraction on Candidate (GET /resumes/{id}/evidence?job_id={job_id})
    ev_res = client.get(f"/resumes/{alice_id}/evidence?job_id={job_id}")
    assert ev_res.status_code == 200, f"Evidence extraction failed: {ev_res.text}"
    ev_data = ev_res.json()
    print(f" [5/8] Evidence Extracted for Candidate '{ev_data['candidate_name']}':")
    print(f"       Found Evidence for {ev_data['evidence_found_count']} / {ev_data['total_requirements']} requirements.")

    # 6. Verify Strong Evidence Snippets & Metadata
    python_ev = next((e for e in ev_data["evidence_items"] if e["skill"] == "Python"), None)
    assert python_ev is not None, "Python evidence not extracted"
    print(f" [6/8] Verified Strong Evidence for 'Python':")
    print(f"       • Strength: {python_ev['evidence_strength']} (Score: {python_ev['evidence_score']}/10.0)")
    print(f"       • Location: {python_ev['resume_location']}")
    print(f"       • Project/Job: {python_ev['project_or_job']}")
    print(f"       • Duration & Recency: {python_ev['duration']} | {python_ev['recency']}")
    print(f"       • Snippet: \"{python_ev['evidence_text']}\"")
    assert "payment routing" in python_ev["evidence_text"].lower() or "fastapi" in python_ev["evidence_text"].lower()

    # 7. Verify 'Evidence not found' for unmentioned skills (never invent evidence!)
    unmentioned_ev_res = client.post(f"/resumes/{bob_id}/evidence", json={
        "requirements": ["Rust", "Kubernetes", "Scala"]
    })
    assert unmentioned_ev_res.status_code == 200
    unmentioned_data = unmentioned_ev_res.json()
    rust_ev = next((e for e in unmentioned_data["evidence_items"] if e["requirement"] == "Rust"), None)
    assert rust_ev is not None
    print(f" [7/8] Tested Missing Skill Handling for 'Rust':")
    print(f"       • Snippet: \"{rust_ev['evidence_text']}\"")
    print(f"       • Strength: {rust_ev['evidence_strength']} (Score: {rust_ev['evidence_score']})")
    assert rust_ev["evidence_text"] == "Evidence not found in resume."
    assert rust_ev["evidence_strength"] == "No evidence"

    # 8. Verify normalized skills stored in candidate profile
    cand_profile_res = client.get(f"/resumes/{alice_id}")
    assert cand_profile_res.status_code == 200
    parsed_cand = cand_profile_res.json()["parsed_data"]
    assert "normalized_skills" in parsed_cand
    print(f" [8/8] Candidate Record contains {len(parsed_cand['normalized_skills'])} normalized skill items.")

    print("\n ALL PHASE 3 SKILL NORMALIZATION & EVIDENCE EXTRACTION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
