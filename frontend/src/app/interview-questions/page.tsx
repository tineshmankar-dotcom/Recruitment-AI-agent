'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Briefcase,
  Sparkles,
  MessageSquare,
  Copy,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchJobs, Job } from '@/lib/api';

export default function InterviewQuestionsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const data = await fetchJobs();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0]);
        }
      } catch (err: any) {
        console.error('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const reqs = selectedJob?.parsed_data?.classified_requirements || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
            Interview Questions Generator
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate tailored technical and behavioral interview questions mapped directly to classified JD requirements.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading jobs and requirements..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Active Jobs Found"
          description="Create a job description first to generate role-specific interview questions."
          icon={<Briefcase className="h-6 w-6" />}
          actionLabel="Create Job"
          actionHref="/jobs/create"
        />
      ) : (
        <div className="space-y-6">
          {/* Job Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Job Pipeline
            </label>
            <select
              value={selectedJob?.id}
              onChange={(e) => {
                const j = jobs.find((item) => item.id === e.target.value);
                if (j) setSelectedJob(j);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.department || 'Engineering'}
                </option>
              ))}
            </select>
          </div>

          {/* Questions Mapped to Classified Requirements */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Targeted Questions based on Classified Skills
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Derived from mandatory and preferred criteria in the parsed Job Description.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {reqs.length > 0 ? (
                reqs.map((req, idx) => {
                  const sampleQuestion =
                    req.importance === 'mandatory'
                      ? `Can you describe your end-to-end experience building production systems using ${req.skill}? What trade-offs did you evaluate?`
                      : `How have you utilized ${req.skill} to optimize performance or solve domain bottlenecks in your previous projects?`;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Skill Focus: {req.skill}
                          </span>
                          <Badge variant={req.importance}>{req.importance}</Badge>
                        </div>
                        <button
                          onClick={() => handleCopyQuestion(sampleQuestion, idx)}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedIndex === idx ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        "{sampleQuestion}"
                      </p>
                      {req.minimum_experience && (
                        <p className="text-[11px] text-slate-400">
                          Target seniority expectation: {req.minimum_experience}+ years in {req.skill}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No classified requirements extracted for this job yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
