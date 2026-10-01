const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RequirementItem {
  skill: string;
  importance: 'mandatory' | 'preferred' | 'optional';
  minimum_experience?: number | null;
  category?: string;
}

export interface ParsedJDData {
  job_title: string;
  required_skills: string[];
  preferred_skills: string[];
  required_experience?: string;
  min_years_experience?: number;
  education: string[];
  certifications: string[];
  responsibilities: string[];
  technical_requirements: string[];
  domain_requirements: string[];
  soft_skills: string[];
  classified_requirements: RequirementItem[];
}

export interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  experience_level?: string;
  raw_description: string;
  status: string;
  parsed_data?: ParsedJDData;
  created_at: string;
  updated_at: string;
  total_resumes?: number;
  processed_resumes?: number;
}

export interface NormalizedSkillItem {
  original_skill: string;
  normalized_skill: string;
  confidence: number;
  category?: string;
}

export interface EvidenceItem {
  requirement: string;
  skill: string;
  evidence_text: string;
  resume_location: string;
  project_or_job: string;
  duration?: string | null;
  recency: string;
  context: string;
  evidence_strength: string;
  evidence_score: number;
  confidence: number;
}

export interface EvidenceResponse {
  candidate_id: string;
  candidate_name: string;
  job_id?: string;
  job_title?: string;
  total_requirements: number;
  evidence_found_count: number;
  evidence_items: EvidenceItem[];
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  year?: string;
  details?: string;
}

export interface WorkExperienceItem {
  job_title?: string;
  company?: string;
  employment_dates?: string;
  duration_years?: number;
  responsibilities: string[];
  achievements: string[];
}

export interface ProjectItem {
  name?: string;
  description?: string;
  technologies: string[];
}

export interface ParsedResumeData {
  candidate_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  education: EducationItem[];
  work_experience: WorkExperienceItem[];
  job_titles: string[];
  companies: string[];
  employment_dates: string[];
  projects: ProjectItem[];
  skills: string[];
  normalized_skills?: NormalizedSkillItem[];
  certifications: string[];
  achievements: string[];
  technologies: string[];
}

export interface Resume {
  id: string;
  job_id?: string;
  file_name: string;
  file_size?: number;
  file_type: string;
  raw_text?: string;
  candidate_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'duplicate';
  error_message?: string;
  parsed_data?: ParsedResumeData;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  active_jobs: number;
  resumes_uploaded: number;
  resumes_processed: number;
  candidates_shortlisted: number;
  candidates_requiring_review: number;
  duplicates_detected: number;
  recent_jobs: {
    id: string;
    title: string;
    department?: string;
    created_at?: string;
    status: string;
  }[];
  recent_candidates: {
    id: string;
    candidate_name: string;
    file_name: string;
    job_id?: string;
    status: string;
    created_at?: string;
  }[];
}

export interface BulkUploadResponse {
  total_uploaded: number;
  processed: number;
  duplicates: number;
  failed: number;
  resumes: Resume[];
}

// API Helper functions
export async function fetchDashboardStats(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE_URL}/stats/dashboard`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${API_BASE_URL}/jobs`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch job with ID ${jobId}`);
  return res.json();
}

export async function createJob(data: {
  title?: string;
  department?: string;
  location?: string;
  experience_level?: string;
  raw_description: string;
}): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create job' }));
    throw new Error(err.detail || 'Failed to create job');
  }
  return res.json();
}

export async function analyzeJobDescription(rawDescription: string, title?: string): Promise<{ parsed_data: ParsedJDData }> {
  const res = await fetch(`${API_BASE_URL}/analyze-jd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_description: rawDescription, title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to analyze JD' }));
    throw new Error(err.detail || 'Failed to analyze job description');
  }
  return res.json();
}

export async function uploadResumes(jobId: string, files: File[]): Promise<BulkUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/resumes`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload resumes' }));
    throw new Error(err.detail || 'Failed to upload resumes');
  }
  return res.json();
}

export async function fetchJobResumes(jobId: string, statusFilter?: string): Promise<Resume[]> {
  const url = statusFilter
    ? `${API_BASE_URL}/jobs/${jobId}/resumes?status_filter=${statusFilter}`
    : `${API_BASE_URL}/jobs/${jobId}/resumes`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch resumes for job ${jobId}`);
  return res.json();
}

export async function fetchResume(resumeId: string): Promise<Resume> {
  const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch resume with ID ${resumeId}`);
  return res.json();
}

export async function fetchResumeEvidence(resumeId: string, jobId?: string): Promise<EvidenceResponse> {
  const url = jobId
    ? `${API_BASE_URL}/resumes/${resumeId}/evidence?job_id=${jobId}`
    : `${API_BASE_URL}/resumes/${resumeId}/evidence`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch evidence for resume ${resumeId}`);
  return res.json();
}

export async function normalizeSkills(skills: string[]): Promise<NormalizedSkillItem[]> {
  const res = await fetch(`${API_BASE_URL}/skills/normalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skills),
  });
  if (!res.ok) throw new Error('Failed to normalize skills');
  return res.json();
}

export async function fetchAllResumes(): Promise<Resume[]> {
  const res = await fetch(`${API_BASE_URL}/resumes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch candidate pool');
  return res.json();
}
