'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  HelpCircle,
  Layers,
  FileText,
  Briefcase,
  Flame,
  Award,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { fetchBenchmarkComparison, CandidateComparisonResponse, CandidateMatchResponse } from '@/lib/api';

export default function BenchmarkDemoPage() {
  const [comparison, setComparison] = useState<CandidateComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWhyCandidate, setActiveWhyCandidate] = useState<'a' | 'b'>('b');

  useEffect(() => {
    async function loadBenchmark() {
      try {
        setLoading(true);
        const data = await fetchBenchmarkComparison();
        setComparison(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load benchmark comparison');
      } finally {
        setLoading(false);
      }
    }
    loadBenchmark();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Executing Evidence-Based Matching & Noise Detection Benchmark..." />;
  }

  if (error || !comparison) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Benchmark Failed</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to load synthetic benchmark.'}</p>
      </div>
    );
  }

  const a = comparison.candidate_a;
  const b = comparison.candidate_b;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Goal Header */}
      <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" /> Mandatory Phase 4 Benchmark Demo
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Evidence-Based Matching vs Keyword Stuffing
            </h1>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              <strong>Core Rule:</strong> More keywords must never automatically mean a better candidate. 
              RecruitIQ rewards verified production depth, duration, and context while penalizing keyword stuffing and unsupported claims.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/10 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block">
              Benchmark Winner
            </span>
            <span className="text-lg font-extrabold text-emerald-400 block mt-1">
              {comparison.winner}
            </span>
            <span className="text-xs text-white/80 font-semibold block mt-0.5">
              Score: {b.final_match_score}% vs {a.final_match_score}%
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CANDIDATE A (15 Keywords / 2 Month Internship / High Noise) */}
        <div className="rounded-3xl border-2 border-rose-200 bg-white p-7 shadow-sm dark:border-rose-900/50 dark:bg-slate-900 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-extrabold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  CANDIDATE A
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Alex Rivera
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                "Keyword Stuffer" • 15 Python keyword mentions
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {a.final_match_score}%
              </span>
              <span className="block text-xs font-semibold text-rose-600 dark:text-rose-400">
                {a.match_grade}
              </span>
            </div>
          </div>

          {/* Key Metric Comparison Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Keywords</span>
              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">
                {a.noise_analysis.total_keyword_occurrences}
              </span>
              <span className="text-[10px] text-slate-500">Stuffed 15x</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Experience</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
                2 mos
              </span>
              <span className="text-[10px] text-slate-500">Internship only</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Evidence</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block mt-1">
                Weak
              </span>
              <span className="text-[10px] text-slate-500">No Production API</span>
            </div>

            <div className="rounded-2xl bg-rose-50/70 p-3 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Noise Level</span>
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300 block mt-1">
                {a.noise_analysis.noise_level}
              </span>
              <span className="text-[10px] text-rose-600">-{a.score_breakdown.noise_penalty} pts penalty</span>
            </div>
          </div>

          {/* Noise Alerts */}
          <div className="rounded-2xl bg-rose-50/50 p-4 border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/30 space-y-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Detected Noise Patterns:
            </span>
            <ul className="text-xs text-rose-700 dark:text-rose-400 space-y-1 pl-5 list-disc">
              {a.noise_analysis.noise_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Python Evidence Quote */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Python Evidence Extracted
            </span>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 italic">
              "{a.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_text}"
            </p>
            <span className="text-[10px] font-semibold text-amber-600 block">
              Strength: {a.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_strength} (Score: {a.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_score}/10)
            </span>
          </div>
        </div>

        {/* CANDIDATE B (4 Keywords / 18 Month Professional / Production ML API) */}
        <div className="rounded-3xl border-2 border-emerald-400 bg-white p-7 shadow-md dark:border-emerald-600 dark:bg-slate-900 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
            Top Ranked Candidate
          </div>

          <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  CANDIDATE B
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Brenda Vance
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                "Evidence-Backed Pro" • 4 Python keyword mentions
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {b.final_match_score}%
              </span>
              <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {b.match_grade}
              </span>
            </div>
          </div>

          {/* Key Metric Comparison Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Keywords</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {b.noise_analysis.total_keyword_occurrences}
              </span>
              <span className="text-[10px] text-slate-500">Clean 4 mentions</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Experience</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
                18 mos
              </span>
              <span className="text-[10px] text-slate-500">Professional Eng</span>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Evidence</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 block mt-1">
                Strong
              </span>
              <span className="text-[10px] text-emerald-600">Production ML API</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Noise Level</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
                {b.noise_analysis.noise_level}
              </span>
              <span className="text-[10px] text-slate-500">No penalty</span>
            </div>
          </div>

          {/* Clean Signal Badges */}
          <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/30 space-y-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Evidence Signal Highlights:
            </span>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1 pl-5 list-disc">
              <li>Built and deployed production ML API handling 12M inference requests/month</li>
              <li>Deep integration of FastAPI, PostgreSQL, Docker, AWS, and Redis</li>
              <li>Zero keyword stuffing detected (100% of keywords contextualized in work history)</li>
            </ul>
          </div>

          {/* Python Evidence Quote */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Python Evidence Extracted
            </span>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 italic">
              "{b.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_text}"
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 block">
              Strength: {b.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_strength} (Score: {b.requirement_evaluations.find(e => e.requirement === 'Python')?.evidence_score}/10)
            </span>
          </div>
        </div>
      </div>

      {/* "Why this score?" Explainability Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Why this score? Explainable Rationale
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWhyCandidate('b')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeWhyCandidate === 'b'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Candidate B (Winner: {b.final_match_score}%)
            </button>
            <button
              onClick={() => setActiveWhyCandidate('a')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeWhyCandidate === 'a'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Candidate A ({a.final_match_score}%)
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50/80 p-5 dark:bg-slate-950 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
          {activeWhyCandidate === 'b' ? b.why_this_score : a.why_this_score}
        </div>
      </div>

      {/* Requirement Classification Comparison Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Direct Requirement Classification Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Classified into MATCHED, PARTIALLY MATCHED, MISSING, and UNCERTAIN
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 pl-4 pr-2">JD Requirement</th>
                <th className="px-2 py-3">Importance</th>
                <th className="px-3 py-3">Candidate A (15 Keywords)</th>
                <th className="px-3 py-3">Candidate B (4 Keywords)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {b.requirement_evaluations.slice(0, 7).map((req, idx) => {
                const reqA = a.requirement_evaluations.find(e => e.requirement === req.requirement) || req;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 pl-4 pr-2 font-bold text-slate-900 dark:text-white">
                      {req.requirement}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={req.importance === 'MANDATORY' ? 'mandatory' : 'preferred'}>
                        {req.importance}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 space-y-0.5">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        reqA.status === 'MATCHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                          : reqA.status === 'PARTIALLY MATCHED'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {reqA.status}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{reqA.status_explanation}</p>
                    </td>
                    <td className="px-3 py-3 space-y-0.5">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        req.status === 'MATCHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                          : req.status === 'PARTIALLY MATCHED'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {req.status}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{req.status_explanation}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
