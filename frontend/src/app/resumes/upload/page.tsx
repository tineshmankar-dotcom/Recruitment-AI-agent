'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  X,
  ArrowRight,
  Briefcase,
  Users,
  Eye,
  FileCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { fetchJobs, uploadResumes, Job, Resume } from '@/lib/api';

export default function UploadResumesPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading upload workspace..." />}>
      <UploadResumesContent />
    </Suspense>
  );
}

function UploadResumesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<{
    total_uploaded: number;
    processed: number;
    duplicates: number;
    failed: number;
    resumes: Resume[];
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadJobsList() {
      try {
        const data = await fetchJobs();
        setJobs(data);
        if (!selectedJobId && data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load jobs', err);
      }
    }
    loadJobsList();
  }, [selectedJobId]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const newFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext && validExtensions.includes(ext)) {
        newFiles.push(f);
      }
    }

    if (newFiles.length === 0 && files.length > 0) {
      setError('Please select valid PDF, DOCX, or TXT resume files.');
      return;
    }

    setError(null);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (!selectedJobId) {
      setError('Please select a target Job Posting for these resumes.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please add at least one resume file to upload.');
      return;
    }

    try {
      setError(null);
      setUploading(true);
      setUploadProgress(25);

      // Simulated upload progress interval
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 300);

      const res = await uploadResumes(selectedJobId, selectedFiles);
      
      clearInterval(timer);
      setUploadProgress(100);
      setUploadResult(res);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-indigo-600" />
            Bulk Resume Ingestion & Parsing
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload single or hundreds of resumes (PDF, DOCX, TXT). RecruitIQ extracts candidates, experience, skills, and flags duplicates.
          </p>
        </div>
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-colors"
        >
          <Users className="h-4 w-4 text-indigo-500" />
          View Candidate Pool
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Target Job Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Target Job Pipeline
        </label>
        {jobs.length === 0 ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500">No active jobs found. Create one first to associate resumes.</span>
            <Link href="/jobs/create" className="text-xs font-bold text-indigo-600 hover:underline">
              + Create Job
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.department || 'Engineering'}) — {job.total_resumes || 0} candidates
                </option>
              ))}
            </select>

            {currentJob && (
              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                <Badge variant="processed">{currentJob.status}</Badge>
                <span>Exp: {currentJob.experience_level || 'Mid-Senior'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 shadow-xs">
            <UploadCloud className="h-7 w-7 animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Drag and drop resume files here, or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Supports PDF, DOCX, and TXT files up to 15MB each. Bulk uploads supported.
          </p>
        </div>

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Files Queue ({selectedFiles.length} files selected)
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    Ingesting & Parsing Resumes...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={uploading || !selectedJobId}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 disabled:opacity-50 transition-all"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? 'Processing Documents...' : `Upload & Process ${selectedFiles.length} Resumes`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Results & Extraction Summary */}
      {uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Batch Processing Complete
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Summary of document parsing, duplicate identification, and structured candidate profiles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {uploadResult.processed} Processed
              </span>
              {uploadResult.duplicates > 0 && (
                <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  {uploadResult.duplicates} Duplicate
                </span>
              )}
              {uploadResult.failed > 0 && (
                <span className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {uploadResult.failed} Failed
                </span>
              )}
            </div>
          </div>

          {/* Parsed Resumes Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {uploadResult.resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {resume.candidate_name || 'Candidate'}
                    </span>
                    <Badge variant={resume.status}>{resume.status}</Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      (ID: {resume.id.slice(0, 8)}...)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>File: {resume.file_name}</span>
                    {resume.email && <span>• {resume.email}</span>}
                    {resume.phone && <span>• {resume.phone}</span>}
                    {resume.parsed_data?.skills && resume.parsed_data.skills.length > 0 && (
                      <span>• {resume.parsed_data.skills.length} skills extracted</span>
                    )}
                  </div>
                  {resume.error_message && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {resume.error_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/candidates/${resume.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Link
              href="/candidates"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Go to Candidate Pool
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
