'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Award,
  AlertTriangle,
  Plus,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchDashboardStats, fetchJobs, DashboardMetrics, Job } from '@/lib/api';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, jobsData] = await Promise.all([
          fetchDashboardStats().catch(() => ({
            active_jobs: 0,
            resumes_uploaded: 0,
            resumes_processed: 0,
            candidates_shortlisted: 0,
            candidates_requiring_review: 0,
            duplicates_detected: 0,
            recent_jobs: [],
            recent_candidates: []
          })),
          fetchJobs().catch(() => [])
        ]);
        setMetrics(statsData);
        setJobs(jobsData);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to backend server');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recruitment Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry for Job Description parsing, candidate ingestion, and resume processing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/jobs/create"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-98"
          >
            <Plus className="h-4 w-4" />
            New Job
          </Link>
          <Link
            href="/resumes/upload"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <UploadCloud className="h-4 w-4 text-indigo-500" />
            Bulk Upload
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Connecting to RecruitIQ backend & loading metrics..." />
      ) : (
        <>
          {/* Dashboard Metrics Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Active Jobs"
              value={metrics?.active_jobs ?? jobs.length}
              subtitle="Open recruitment pipelines"
              icon={<Briefcase className="h-5 w-5" />}
              colorScheme="indigo"
            />
            <MetricCard
              title="Resumes Uploaded"
              value={metrics?.resumes_uploaded ?? 0}
              subtitle="PDF, DOCX & TXT ingested"
              icon={<FileText className="h-5 w-5" />}
              colorScheme="slate"
            />
            <MetricCard
              title="Resumes Processed"
              value={metrics?.resumes_processed ?? 0}
              subtitle="Structured entity extracted"
              icon={<CheckCircle2 className="h-5 w-5" />}
              colorScheme="emerald"
            />
            <MetricCard
              title="Candidates Shortlisted"
              value={metrics?.candidates_shortlisted ?? 0}
              subtitle="Phase 3 ranking pool"
              icon={<Award className="h-5 w-5" />}
              colorScheme="amber"
            />
            <MetricCard
              title="Requiring Review"
              value={metrics?.candidates_requiring_review ?? 0}
              subtitle="Duplicates or parsing alerts"
              icon={<AlertTriangle className="h-5 w-5" />}
              colorScheme="rose"
            />
          </div>

          {/* Main Grid: Active Jobs & Recent Processing Activity */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Active Jobs Section (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Job Pipelines</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {jobs.length}
                  </span>
                </div>
                <Link
                  href="/jobs/create"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                >
                  Create new <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {jobs.length === 0 ? (
                <EmptyState
                  title="No Jobs Created Yet"
                  description="Start by creating a job description. RecruitIQ will analyze requirements, skills, and classifications."
                  icon={<Briefcase className="h-6 w-6" />}
                  actionLabel="Create First Job"
                  actionHref="/jobs/create"
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {job.title}
                            </h3>
                            <Badge variant="processed">{job.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{job.department || 'Engineering'}</span>
                            <span>•</span>
                            <span>{job.location || 'Remote'}</span>
                            <span>•</span>
                            <span>Exp: {job.experience_level || 'Mid-Senior'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Resumes</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {job.processed_resumes || 0} / {job.total_resumes || 0}
                            </div>
                          </div>
                          <Link
                            href={`/resumes/upload?jobId=${job.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Upload
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions & Recent Candidates (1 col) */}
            <div className="space-y-6">
              {/* Quick Start Card */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 p-5 dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Phase 2 Ingestion Engine</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  RecruitIQ processes job requirements with 3-tier classification (Mandatory, Preferred, Optional) and extracts structured candidate data from PDF, DOCX, and TXT resumes.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/jobs/create"
                    className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-indigo-50/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      Analyze & Create Job
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                  <Link
                    href="/resumes/upload"
                    className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-indigo-50/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <UploadCloud className="h-4 w-4 text-emerald-600" />
                      Bulk Upload Resumes
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                  <Link
                    href="/candidates"
                    className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 shadow-xs hover:bg-indigo-50/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Candidate Pool
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">
                  Recent Ingested Resumes
                </h3>
                {metrics?.recent_candidates && metrics.recent_candidates.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recent_candidates.map((cand) => (
                      <Link
                        key={cand.id}
                        href={`/candidates/${cand.id}`}
                        className="flex items-center justify-between rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {cand.candidate_name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {cand.file_name}
                          </p>
                        </div>
                        <Badge variant={cand.status === 'processed' ? 'processed' : 'pending'}>
                          {cand.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                    No recent candidates uploaded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
