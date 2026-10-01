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
  Download,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchJobs, fetchJobCandidateMatches, Job, CandidateMatchResponse } from '@/lib/api';

export default function ShortlistPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [rankedMatches, setRankedMatches] = useState<CandidateMatchResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExplainMatch, setSelectedExplainMatch] = useState<CandidateMatchResponse | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const jobsData = await fetchJobs();
        setJobs(jobsData);
        if (jobsData.length > 0) {
          setSelectedJobId(jobsData[0].id);
          const matches = await fetchJobCandidateMatches(jobsData[0].id).catch(() => []);
          setRankedMatches(matches);
        }
      } catch (err: any) {
        console.error('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleJobChange = async (jobId: string) => {
    setSelectedJobId(jobId);
    try {
      setLoading(true);
      const matches = await fetchJobCandidateMatches(jobId).catch(() => []);
      setRankedMatches(matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Evidence-Ranked Candidate Shortlist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Candidates ordered strictly by verified production evidence and role depth, not keyword volume.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/benchmark"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            View Keyword vs Evidence Demo
          </Link>
        </div>
      </div>

      {/* Filter by Job Pipeline */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Target Job Pipeline:
          </span>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department || 'Engineering'}) — {j.processed_resumes || 0} candidates
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Computing evidence scores & ranking candidate pipeline..." />
      ) : rankedMatches.length === 0 ? (
        <EmptyState
          title="No Candidates Ranked for this Job"
          description="Upload resumes to this job pipeline to generate automated evidence rankings and noise evaluations."
          icon={<Award className="h-6 w-6" />}
          actionLabel="Upload Resumes"
          actionHref={`/resumes/upload?jobId=${selectedJobId}`}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedMatches.map((cand, idx) => {
              const isTop = idx === 0;
              const isNoiseHigh = cand.noise_analysis.noise_level === 'High' || cand.noise_analysis.noise_level === 'Critical';

              return (
                <div
                  key={cand.candidate_id}
                  className={`rounded-3xl border bg-white p-6 shadow-xs hover:shadow-md transition-all dark:bg-slate-900 flex flex-col justify-between relative overflow-hidden ${
                    isTop
                      ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isTop && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-bl-xl tracking-wider">
                      #1 Top Evidence Match
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black text-sm shadow-xs ${
                            isTop
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {cand.candidate_name}
                          </h3>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {cand.match_grade}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {cand.final_match_score}%
                        </span>
                      </div>
                    </div>

                    {/* Noise & Evidence Signals */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Experience</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cand.experience_details?.verified_experience_months || 0} mos verified
                        </span>
                      </div>

                      <div
                        className={`rounded-xl p-2.5 border ${
                          isNoiseHigh
                            ? 'bg-rose-50/70 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300'
                            : 'bg-emerald-50/70 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Noise Level</span>
                        <span className="font-bold">{cand.noise_analysis.noise_level}</span>
                      </div>
                    </div>

                    {/* Matched Requirements Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Mandatory Criteria</span>
                        <span>{cand.score_breakdown.mandatory_requirements.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${cand.score_breakdown.mandatory_requirements}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedExplainMatch(cand)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Why this score?
                    </button>
                    <Link
                      href={`/candidates/${cand.candidate_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* "Why this score?" Explainability Modal */}
      {selectedExplainMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Why this score? — {selectedExplainMatch.candidate_name}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Match Score: {selectedExplainMatch.final_match_score}% ({selectedExplainMatch.match_grade})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedExplainMatch(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Markdown explanation */}
            <div className="rounded-2xl bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto">
              {selectedExplainMatch.why_this_score}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExplainMatch(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
