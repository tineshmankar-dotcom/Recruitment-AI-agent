# RecruitIQ - AI Recruitment Intelligence Platform

**RecruitIQ** is an evidence-backed recruitment intelligence platform that analyzes Job Descriptions, normalizes skill taxonomies, bulk parses resumes, and extracts verifiable resume evidence with explainable proof.

---

## 🏛️ Architecture & Tech Stack

### **Frontend**
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS (Clean recruiter UI with dark/light mode accents)
- **Icons**: Lucide React
- **Pages**:
  1. **Dashboard** (`/`) — Real-time telemetry: Active Jobs, Ingested Resumes, Processed Profiles, Candidates Shortlisted, Requiring Review.
  2. **Create Job** (`/jobs/create`) — Enter or paste Job Descriptions with live interactive analysis and 3-tier classification preview.
  3. **Upload Resumes** (`/resumes/upload`) — Bulk ingestion for PDF, DOCX, and TXT files with live progress, duplicate detection badges, and error handling.
  4. **Candidate Pool** (`/candidates`) — Searchable candidate database with skill tags, company experience, and status badges.
  5. **Candidate Details** (`/candidates/[id]`) — **Evidence Extraction & Verification view**, skill normalization taxonomy, structured profile timeline, and preserved verbatim original resume text view.
  6. **Shortlist** (`/shortlist`) — Pipeline review board grouped by Job.
  7. **Interview Questions** (`/interview-questions`) — Role-tailored questions generated directly from classified JD requirements.
  8. **Settings** (`/settings`) — Engine parameters, database provider, and duplicate detection thresholds.

### **Backend**
- **Framework**: Python 3.14 + FastAPI
- **Database**: PostgreSQL / SQLite abstraction layer
- **Parsers & Engines**:
  - `DocumentParser`: PDF (`pypdf`), DOCX (`python-docx`), and TXT extraction
  - `JobDescriptionParser`: 10-field extraction + 3-tier classification (MANDATORY, PREFERRED, OPTIONAL)
  - `SkillNormalizer`: Canonical alias mapping, confidence scoring, avoiding false merges (Java != JavaScript, C++ != C#)
  - `EvidenceExtractor`: 9-tier configurable evidence scoring engine retrieving exact verbatim resume quotes
- **Security & Integrity**: SHA-256 duplicate fingerprinting, candidate UUIDs, zero-hallucination evidence extraction.

---

## 🔍 Phase 3 Features: Skill Normalization & Evidence Extraction

### 1. Skill Normalization Engine
- Normalizes equivalent skills to canonical entities:
  - `Python programming` / `Python 3` → `Python`
  - `ML` / `deep learning` → `Machine Learning` / `Deep Learning`
  - `AWS Cloud` / `Amazon Web Services` → `AWS`
  - `Postgres` / `postgre` → `PostgreSQL`
  - `ReactJS` / `react.js` → `React`
  - `K8s` → `Kubernetes`
- **Guarded Distinction**: Strictly prevents false merges between unrelated technologies (`Java` vs `JavaScript`, `C++` vs `C#`, `TypeScript` vs `JavaScript`).
- Stores `original_skill`, `normalized_skill`, `confidence`, and `category`.

### 2. Verifiable Evidence Extraction
- Scans candidate work history, projects, certifications, education, and text for every JD requirement.
- Stores:
  - `requirement`: Target skill / qualification
  - `skill`: Normalized canonical skill
  - `evidence_text`: Verbatim quote from resume
  - `resume_location`: Location (e.g., *Work Experience - Stripe (Lead Developer)*)
  - `project_or_job`: Entity where applied
  - `duration` & `recency`: e.g. *May 2021 - Present (Current)*
  - `context`: Role & scope
  - `evidence_strength` (9 tiers):
    1. *Mere mention* (1.0)
    2. *Skill-list mention* (2.0)
    3. *Course/training* (3.5)
    4. *Academic project* (5.0)
    5. *Personal project* (6.0)
    6. *Internship* (7.0)
    7. *Professional experience* (8.0)
    8. *Production/deployed experience* (9.0)
    9. *Leadership/ownership* (10.0)
- **Zero-Hallucination Guarantee**: Never invents evidence. When not found, returns `"Evidence not found in resume."` without assuming the candidate lacks the skill.

### 3. Evidence View on Candidate Details
- Dedicated **"Evidence Extraction & Verification"** tab on candidate profiles.
- Shows evidence badges, evidence scores (e.g. `9.5/10.0`), confidence percentages, and verbatim quotes.
- **"View Resume Evidence"** action modal for deep inspection.
- Filter toggle: All Requirements, Evidence Found, Evidence Not Found.

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/jobs` | Create a job posting and analyze/structure JD |
| `GET` | `/jobs` | List all active job postings with resume counts |
| `GET` | `/jobs/{job_id}` | Retrieve single job with structured parsed requirements |
| `POST` | `/jobs/{job_id}/resumes` | Bulk upload resumes (PDF, DOCX, TXT) with duplicate detection |
| `GET` | `/jobs/{job_id}/resumes` | List all resumes associated with a job |
| `GET` | `/resumes/{resume_id}` | Get candidate details with parsed entities and original text |
| `GET` | `/resumes/{resume_id}/evidence` | Extract verifiable evidence against job requirements |
| `POST` | `/resumes/{resume_id}/evidence` | Extract evidence for custom list of requirements |
| `POST` | `/skills/normalize` | Normalize raw skill strings to canonical representations |
| `POST` | `/analyze-jd` | Analyze raw JD text and return structured JSON |
| `GET` | `/stats/dashboard` | Dashboard metrics and telemetry |

---

## 🛠️ Quickstart & Local Execution

### 1. Run Backend (FastAPI)
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Swagger API Docs: `http://localhost:8000/docs`

### 2. Run Frontend (Next.js)
```bash
cd frontend
npm run dev
```

Frontend UI: `http://localhost:3000`

### 3. Run Automated Tests
```bash
python backend/test_flow.py
```
