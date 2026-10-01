'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Filter,
  Eye,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
  ArrowRight,
  Download
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchJobs, fetchAllResumes, Job, Resume } from '@/lib/api';

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [candidates, setCandidates] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [jobsData, candidatesData] = await Promise.all([
          fetchJobs().catch(() => []),
          fetchAllResumes().catch(() => [])
        ]);
        setJobs(jobsData);
        setCandidates(candidatesData);
      } catch (err: any) {
        console.error('Failed to load shortlist data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const processedCandidates = candidates.filter((c) => c.status === 'processed');
  const filtered = selectedJobId === 'all'
    ? processedCandidates
    : processedCandidates.filter((c) => c.job_id === selectedJobId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Candidate Shortlist & Ranking Board
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Phase 2 parsed candidate pool grouped by Job pipeline. Ready for AI scoring and ranking in Phase 3.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter by Job */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter Job:</span>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          <option value="all">All Jobs ({processedCandidates.length} processed candidates)</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.department || 'Engineering'})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading candidates..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Processed Candidates Available"
          description="Upload and ingest resumes under an active job to populate the shortlist."
          icon={<Award className="h-6 w-6" />}
          actionLabel="Upload Resumes"
          actionHref="/resumes/upload"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cand, idx) => (
            <div
              key={cand.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm dark:bg-indigo-950/50 dark:text-indigo-400">
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cand.candidate_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cand.parsed_data?.job_titles?.[0] || 'Software Engineer'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="processed">Ready</Badge>
                </div>

                {cand.parsed_data?.skills && cand.parsed_data.skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Core Skills Extracted
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cand.parsed_data.skills.slice(0, 5).map((s, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 pt-1">
                  <p>Company: {cand.parsed_data?.companies?.[0] || 'Enterprise'}</p>
                  <p>Education: {cand.parsed_data?.education?.[0]?.degree || 'University Graduate'}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {cand.id.slice(0, 8)}...
                </span>
                <Link
                  href={`/candidates/${cand.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
