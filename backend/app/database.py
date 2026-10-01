import os
import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.config import settings

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "recruitiq.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT,
        location TEXT,
        experience_level TEXT,
        raw_description TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        parsed_data TEXT,
        created_at TEXT,
        updated_at TEXT
    );
    """)

    # Create resumes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT,
        file_hash TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT NOT NULL,
        raw_text TEXT,
        candidate_name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        parsed_data TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
    );
    """)

    # Create indexes for fast lookup and duplicate checks
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(job_id, file_hash);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);")

    conn.commit()
    conn.close()

# Initialize DB on load
init_db()

# Data Access Layer
class JobRepository:
    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        now = datetime.utcnow().isoformat()
        job_id = data.get("id") or str(uuid.uuid4())
        
        parsed_json = json.dumps(data.get("parsed_data", {})) if data.get("parsed_data") else None

        conn.execute("""
        INSERT INTO jobs (id, title, department, location, experience_level, raw_description, status, parsed_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id,
            data.get("title", "Untitled Position"),
            data.get("department", "Engineering"),
            data.get("location", "Remote"),
            data.get("experience_level", "Mid-Senior"),
            data.get("raw_description", ""),
            data.get("status", "active"),
            parsed_json,
            now,
            now
        ))
        conn.commit()
        conn.close()
        return JobRepository.get(job_id)

    @staticmethod
    def get(job_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            conn.close()
            return None
        
        # Count resumes
        total = conn.execute("SELECT COUNT(*) FROM resumes WHERE job_id = ?", (job_id,)).fetchone()[0]
        processed = conn.execute("SELECT COUNT(*) FROM resumes WHERE job_id = ? AND status = 'processed'", (job_id,)).fetchone()[0]
        conn.close()

        job_dict = dict(row)
        if job_dict.get("parsed_data"):
            job_dict["parsed_data"] = json.loads(job_dict["parsed_data"])
        job_dict["total_resumes"] = total
        job_dict["processed_resumes"] = processed
        return job_dict

    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        conn = get_connection()
        rows = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC").fetchall()
        result = []
        for r in rows:
            job_dict = dict(r)
            job_id = job_dict["id"]
            total = conn.execute("SELECT COUNT(*) FROM resumes WHERE job_id = ?", (job_id,)).fetchone()[0]
            processed = conn.execute("SELECT COUNT(*) FROM resumes WHERE job_id = ? AND status = 'processed'", (job_id,)).fetchone()[0]
            
            if job_dict.get("parsed_data"):
                job_dict["parsed_data"] = json.loads(job_dict["parsed_data"])
            job_dict["total_resumes"] = total
            job_dict["processed_resumes"] = processed
            result.append(job_dict)
        conn.close()
        return result

    @staticmethod
    def update(job_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        now = datetime.utcnow().isoformat()
        fields = []
        values = []

        for key in ["title", "department", "location", "experience_level", "raw_description", "status"]:
            if key in data and data[key] is not None:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if "parsed_data" in data and data["parsed_data"] is not None:
            fields.append("parsed_data = ?")
            values.append(json.dumps(data["parsed_data"]))

        if not fields:
            conn.close()
            return JobRepository.get(job_id)

        fields.append("updated_at = ?")
        values.append(now)
        values.append(job_id)

        conn.execute(f"UPDATE jobs SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
        conn.close()
        return JobRepository.get(job_id)

    @staticmethod
    def delete(job_id: str) -> bool:
        conn = get_connection()
        conn.execute("DELETE FROM resumes WHERE job_id = ?", (job_id,))
        cursor = conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted

class ResumeRepository:
    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        now = datetime.utcnow().isoformat()
        resume_id = data.get("id") or str(uuid.uuid4())
        parsed_json = json.dumps(data.get("parsed_data", {})) if data.get("parsed_data") else None

        conn.execute("""
        INSERT INTO resumes (
            id, job_id, file_name, file_path, file_hash, file_size, file_type,
            raw_text, candidate_name, email, phone, location, status,
            error_message, parsed_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            resume_id,
            data.get("job_id"),
            data.get("file_name"),
            data.get("file_path"),
            data.get("file_hash"),
            data.get("file_size"),
            data.get("file_type"),
            data.get("raw_text"),
            data.get("candidate_name"),
            data.get("email"),
            data.get("phone"),
            data.get("location"),
            data.get("status", "pending"),
            data.get("error_message"),
            parsed_json,
            now,
            now
        ))
        conn.commit()
        conn.close()
        return ResumeRepository.get(resume_id)

    @staticmethod
    def get(resume_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        row = conn.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,)).fetchone()
        conn.close()
        if not row:
            return None
        res_dict = dict(row)
        if res_dict.get("parsed_data"):
            res_dict["parsed_data"] = json.loads(res_dict["parsed_data"])
        return res_dict

    @staticmethod
    def find_by_hash(job_id: str, file_hash: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        row = conn.execute("SELECT * FROM resumes WHERE job_id = ? AND file_hash = ?", (job_id, file_hash)).fetchone()
        conn.close()
        if not row:
            return None
        res_dict = dict(row)
        if res_dict.get("parsed_data"):
            res_dict["parsed_data"] = json.loads(res_dict["parsed_data"])
        return res_dict

    @staticmethod
    def list_by_job(job_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection()
        if status:
            rows = conn.execute("SELECT * FROM resumes WHERE job_id = ? AND status = ? ORDER BY created_at DESC", (job_id, status)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM resumes WHERE job_id = ? ORDER BY created_at DESC", (job_id,)).fetchall()
        conn.close()

        result = []
        for r in rows:
            res_dict = dict(r)
            if res_dict.get("parsed_data"):
                res_dict["parsed_data"] = json.loads(res_dict["parsed_data"])
            result.append(res_dict)
        return result

    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        conn = get_connection()
        rows = conn.execute("SELECT * FROM resumes ORDER BY created_at DESC").fetchall()
        conn.close()

        result = []
        for r in rows:
            res_dict = dict(r)
            if res_dict.get("parsed_data"):
                res_dict["parsed_data"] = json.loads(res_dict["parsed_data"])
            result.append(res_dict)
        return result

    @staticmethod
    def delete(resume_id: str) -> bool:
        conn = get_connection()
        cursor = conn.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted

class StatsRepository:
    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        conn = get_connection()
        active_jobs = conn.execute("SELECT COUNT(*) FROM jobs WHERE status = 'active'").fetchone()[0]
        total_resumes = conn.execute("SELECT COUNT(*) FROM resumes").fetchone()[0]
        processed_resumes = conn.execute("SELECT COUNT(*) FROM resumes WHERE status = 'processed'").fetchone()[0]
        requiring_review = conn.execute("SELECT COUNT(*) FROM resumes WHERE status IN ('failed', 'pending')").fetchone()[0]
        duplicates_count = conn.execute("SELECT COUNT(*) FROM resumes WHERE status = 'duplicate'").fetchone()[0]

        recent_jobs = conn.execute("SELECT id, title, department, created_at, status FROM jobs ORDER BY created_at DESC LIMIT 5").fetchall()
        recent_candidates = conn.execute("SELECT id, candidate_name, file_name, job_id, status, created_at FROM resumes ORDER BY created_at DESC LIMIT 5").fetchall()
        conn.close()

        return {
            "active_jobs": active_jobs,
            "resumes_uploaded": total_resumes,
            "resumes_processed": processed_resumes,
            "candidates_shortlisted": 0,
            "candidates_requiring_review": requiring_review,
            "duplicates_detected": duplicates_count,
            "recent_jobs": [dict(j) for j in recent_jobs],
            "recent_candidates": [dict(c) for c in recent_candidates]
        }
