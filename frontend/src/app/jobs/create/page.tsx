'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  FileText,
  UploadCloud,
  Layers,
  ArrowRight,
  Code2,
  BookOpen,
  GraduationCap,
  Award,
  ListOrdered,
  Cpu,
  Globe,
  HeartHandshake
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { analyzeJobDescription, createJob, ParsedJDData } from '@/lib/api';

const SAMPLE_JD = `Senior Full Stack Engineer (Python & React)

Department: Engineering / Platform Team
Location: Remote (US / EMEA / APAC)
Experience: 4+ years of professional software engineering experience

About the Role:
We are seeking a talented Senior Full Stack Engineer to lead the development of our high-scale intelligence platform. You will design, build, and deploy resilient backend microservices in Python and interactive frontend experiences in React / Next.js.

Responsibilities:
- Architect and develop high-throughput REST APIs and asynchronous microservices using Python and FastAPI.
- Build sleek, responsive, and accessible user interfaces using Next.js, React, and TypeScript.
- Design optimized relational schemas in PostgreSQL and configure caching layers with Redis.
- Collaborate with product designers and engineering leads to scope product roadmaps.
- Maintain rigorous CI/CD workflows, automated testing, and Docker container deployments.

Requirements (Must-Have):
- 4+ years of hands-on software development experience.
- Strong proficiency in Python, FastAPI, and asynchronous backend architectures.
- Solid experience with modern React, TypeScript, and modern CSS (Tailwind CSS).
- Strong database design skills with PostgreSQL and SQL query optimization.
- Proven track record with Docker, Git, and automated CI/CD pipelines.

Nice-to-Have / Preferred:
- Experience with Cloud Infrastructure (AWS or Google Cloud Platform).
- Knowledge of Vector Databases (pgvector, FAISS) or LLM orchestration frameworks.
- Familiarity with Kafka or RabbitMQ event streaming.
- Contributions to open-source software.

Education & Certifications:
- Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
- AWS Certified Developer or Solutions Architect is a plus.

Soft Skills:
- Outstanding verbal and written communication skills.
- Self-motivated problem solver who thrives in fast-paced environments.
- Passion for mentoring junior engineers and conducting insightful code reviews.`;

export default function CreateJobPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [rawDescription, setRawDescription] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedJDData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Load sample template
  const handleLoadSample = () => {
    setRawDescription(SAMPLE_JD);
    setJobTitle('Senior Full Stack Engineer (Python & React)');
    setDepartment('Engineering');
    setLocation('Remote');
  };

  // Analyze JD
  const handleAnalyze = async () => {
    if (!rawDescription.trim()) {
      setError('Please provide a job description to analyze.');
      return;
    }
    try {
      setError(null);
      setAnalyzing(true);
      const res = await analyzeJobDescription(rawDescription, jobTitle || undefined);
      setParsedData(res.parsed_data);
      if (!jobTitle && res.parsed_data.job_title) {
        setJobTitle(res.parsed_data.job_title);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze job description');
    } finally {
      setAnalyzing(false);
    }
  };

  // Save Job to backend
  const handleSaveJob = async () => {
    if (!rawDescription.trim()) {
      setError('Job description is required');
      return;
    }
    try {
      setError(null);
      setSaving(true);
      const created = await createJob({
        title: jobTitle || parsedData?.job_title || 'Software Professional',
        department,
        location,
        experience_level: parsedData?.required_experience || 'Mid-Senior',
        raw_description: rawDescription,
      });
      router.push(`/resumes/upload?jobId=${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            Create & Structure Job Description
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Paste or enter your JD. RecruitIQ automatically classifies mandatory/preferred skills, education, and domain requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadSample}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-colors"
          >
            Load Sample Template
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 2-Column Grid: Form & Real-time Structured Extraction Preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Col: Job Input Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Job Information & Description
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Remote / Hybrid"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Raw Job Description Text
                </label>
                <span className="text-[11px] text-slate-400">
                  {rawDescription.length} characters
                </span>
              </div>
              <textarea
                rows={16}
                placeholder="Paste complete Job Description here including Responsibilities, Required Skills, Education, Experience..."
                value={rawDescription}
                onChange={(e) => setRawDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !rawDescription.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                {analyzing ? 'Analyzing Structure...' : 'Analyze JD Structure'}
              </button>

              <button
                type="button"
                onClick={handleSaveJob}
                disabled={saving || !rawDescription.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? 'Creating Job...' : 'Save Job & Proceed to Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Structured Entity Preview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  Structured Extraction Preview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classified entities & requirement taxonomy
                </p>
              </div>
              {parsedData && (
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showRawJson ? 'Hide JSON' : 'View JSON'}
                </button>
              )}
            </div>

            {analyzing ? (
              <LoadingSpinner text="Extracting requirements, skills & classifications..." />
            ) : showRawJson && parsedData ? (
              <pre className="max-h-[500px] overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-emerald-400">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            ) : parsedData ? (
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
                {/* 3-Tier Classified Requirements */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Classified Requirements (Mandatory / Preferred / Optional)
                  </h3>
                  <div className="space-y-2">
                    {parsedData.classified_requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {req.skill}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Category: {req.category || 'Technical'} {req.minimum_experience ? `• Min ${req.minimum_experience} yrs` : ''}
                          </span>
                        </div>
                        <Badge variant={req.importance}>{req.importance}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience & Education */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Education
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {parsedData.education.join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                      <Award className="h-3.5 w-3.5 text-amber-500" /> Experience
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {parsedData.required_experience || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Responsibilities */}
                {parsedData.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <ListOrdered className="h-3.5 w-3.5 text-indigo-500" /> Key Responsibilities
                    </h3>
                    <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-700 dark:text-slate-300">
                      {parsedData.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Domain & Soft Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <HeartHandshake className="h-3.5 w-3.5 text-rose-500" /> Soft Skills & Domain Knowledge
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.soft_skills.concat(parsedData.domain_requirements).map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-medium">
                  Enter your JD and click "Analyze JD Structure" to view the live classified schema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
