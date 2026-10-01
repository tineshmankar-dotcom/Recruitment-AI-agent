'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileCode2,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  Copy,
  Terminal,
  Layers,
  Sparkles,
  Search,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  HelpCircle,
  Clock,
  Compass,
  X,
  Volume2,
  Percent,
  CheckCircle,
  XCircle,
  GitPullRequest
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  fetchResume,
  fetchResumeEvidence,
  fetchResumeMatch,
  Resume,
  EvidenceResponse,
  EvidenceItem,
  CandidateMatchResponse,
  RequirementMatchItem
} from '@/lib/api';

export default function CandidateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Resume | null>(null);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [matchData, setMatchData] = useState<CandidateMatchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'original' | 'json'>('all');
  const [copiedId, setCopiedId] = useState(false);

  // Evidence modal state
  const [inspectEvidence, setInspectEvidence] = useState<EvidenceItem | RequirementMatchItem | null>(null);
  const [requirementFilter, setRequirementFilter] = useState<'ALL' | 'MATCHED' | 'PARTIALLY MATCHED' | 'MISSING' | 'UNCERTAIN'>('ALL');

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const resumeData = await fetchResume(candidateId);
        setCandidate(resumeData);

        // Fetch evidence & match analysis concurrently
        try {
          const [ev, match] = await Promise.all([
            fetchResumeEvidence(candidateId, resumeData.job_id).catch(() => null),
            fetchResumeMatch(candidateId, resumeData.job_id).catch(() => null)
          ]);
          setEvidenceData(ev);
          setMatchData(match);
        } catch (subErr) {
          console.error('Failed to load sub intelligence', subErr);
        }
      } catch (err: any) {
        setError(err.message || 'Candidate not found');
      } finally {
        setLoading(false);
      }
    }
    if (candidateId) {
      loadDetails();
    }
  }, [candidateId]);

  const copyCandidateId = () => {
    if (candidate) {
      navigator.clipboard.writeText(candidate.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Analyzing candidate profile, evidence chains & noise telemetry..." />;
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Candidate Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Unable to locate this candidate.'}</p>
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Candidate Pool
        </Link>
      </div>
    );
  }

  const p = candidate.parsed_data;
  const reqEvals = matchData?.requirement_evaluations || [];
  const filteredReqs = reqEvals.filter((r) => {
    if (requirementFilter === 'ALL') return true;
    return r.status === requirementFilter;
  });

  const missingReqs = matchData?.missing_requirements || reqEvals.filter(r => r.status === 'MISSING').map(r => r.requirement);
  const uncertainReqs = matchData?.uncertain_requirements || reqEvals.filter(r => r.status === 'UNCERTAIN').map(r => r.requirement);
  const noise = matchData?.noise_analysis;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <Link
            href={`/interview-questions?candidateId=${candidate.id}&jobId=${candidate.job_id || ''}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" /> Interview Guide
          </Link>
          <Link
            href={`/candidates/compare?ids=${candidate.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <GitPullRequest className="h-3.5 w-3.5 text-indigo-600" /> Compare
          </Link>
          <Badge variant={candidate.status}>{candidate.status}</Badge>
          <button
            onClick={copyCandidateId}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            {copiedId ? 'Copied ID!' : 'Copy ID'}
          </button>
        </div>
      </div>

      {/* SECTION 1: CANDIDATE OVERVIEW */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-2xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
              {candidate.candidate_name ? candidate.candidate_name.charAt(0) : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {candidate.candidate_name || 'Candidate'}
                </h1>
                <span className="font-mono text-xs text-slate-400">
                  #{candidate.id.slice(0, 8)}
                </span>
                {matchData?.match_grade && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                    matchData.match_grade === 'STRONG FIT'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : matchData.match_grade === 'GOOD FIT'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : matchData.match_grade === 'MODERATE FIT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {matchData.match_grade}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {p?.job_titles?.[0] || 'Software Professional'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
            {matchData && (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-center min-w-[130px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Match Score
                </span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {matchData.final_match_score}%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Evidence Backed</span>
              </div>
            )}

            <div className="flex flex-col justify-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Document</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                {candidate.file_name}
              </span>
              <span className="text-slate-400 text-[11px]">
                {candidate.file_type.toUpperCase()} • {candidate.file_size ? `${(candidate.file_size / 1024).toFixed(1)} KB` : 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Nav Anchors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <span className="text-slate-400 uppercase text-[10px] tracking-wider shrink-0">Jump To:</span>
        <a href="#match-summary" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Match Summary</a>
        <a href="#requirement-analysis" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Requirement Analysis</a>
        <a href="#evidence" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Evidence</a>
        <a href="#experience" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Experience</a>
        <a href="#projects" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Projects</a>
        <a href="#skills" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Skills</a>
        <a href="#missing-requirements" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Missing Requirements</a>
        <a href="#uncertain-claims" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Uncertain Claims</a>
        <a href="#noise-detection" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 shrink-0">Noise Detection</a>
      </div>

      {/* SECTION 2: MATCH SUMMARY (Explainable Breakdown) */}
      <section id="match-summary" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Match Summary & Explainable Score Breakdown
          </h2>
          <span className="text-xs text-slate-400">Target Role: {matchData?.job_title || 'Software Position'}</span>
        </div>

        {matchData ? (
          <div className="space-y-4">
            {/* Why This Score Banner */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 p-5 dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/30">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-slate-900 dark:text-white">Why This Candidate Received This Result</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {matchData.why_this_score}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Weights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mandatory Coverage</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {matchData.mandatory_coverage}%
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {matchData.mandatory_met_count}/{matchData.mandatory_total_count} Met
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${matchData.mandatory_coverage}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferred Coverage</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {matchData.preferred_coverage}%
                  </span>
                  <span className="text-xs font-semibold text-violet-600">
                    {matchData.preferred_met_count}/{matchData.preferred_total_count} Met
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: `${matchData.preferred_coverage}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Experience</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {matchData.experience_details ? `${(matchData.experience_details.verified_experience_months / 12).toFixed(1)} yrs` : 'Verified'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    Req: {matchData.experience_details?.required_experience_years || 2} yrs
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {matchData.experience_details?.verified_experience_summary || 'Professional Experience'}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Noise Telemetry</span>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${
                    matchData.noise_analysis.noise_level === 'Low'
                      ? 'text-emerald-600'
                      : matchData.noise_analysis.noise_level === 'Moderate'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {matchData.noise_analysis.noise_level}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    -{matchData.score_breakdown.noise_penalty}% Penalty
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {matchData.noise_analysis.total_keyword_occurrences} keys / {matchData.noise_analysis.total_evidence_backed_occurrences} evidence
                </span>
              </div>
            </div>

            {/* Sub-Dimension Scores */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Multi-Dimensional Scoring Factors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Mandatory</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.mandatory_requirements}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Experience</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.relevant_experience}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Evidence</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.evidence_strength}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Skill Depth</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.skill_depth}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Recency</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.recency}%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 block">Preferred</span>
                  <span className="font-bold text-slate-900 dark:text-white">{matchData.score_breakdown.preferred_requirements}%</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                  <span className="text-[10px] block opacity-80">Noise Penalty</span>
                  <span className="font-bold">-{matchData.score_breakdown.noise_penalty}%</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                  <span className="text-[10px] block opacity-80">Uncertainty</span>
                  <span className="font-bold">-{matchData.score_breakdown.uncertainty}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Match intelligence calculating...</p>
        )}
      </section>

      {/* SECTION 3: REQUIREMENT ANALYSIS */}
      <section id="requirement-analysis" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Requirement Analysis
          </h2>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'MATCHED', 'PARTIALLY MATCHED', 'MISSING', 'UNCERTAIN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setRequirementFilter(st)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  requirementFilter === st
                    ? 'bg-slate-900 text-white dark:bg-indigo-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence Strength</th>
                  <th className="py-3 px-4">Evidence Summary</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No requirements match the '{requirementFilter}' filter.
                    </td>
                  </tr>
                ) : (
                  filteredReqs.map((req, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {req.requirement}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          req.importance === 'mandatory'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60'
                            : 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60'
                        }`}>
                          {req.importance}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          req.status === 'MATCHED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                            : req.status === 'PARTIALLY MATCHED'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                            : req.status === 'UNCERTAIN'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                        }`}>
                          {req.status === 'MATCHED' && '✓'}
                          {req.status === 'PARTIALLY MATCHED' && '≈'}
                          {req.status === 'MISSING' && '✗'}
                          {req.status === 'UNCERTAIN' && '?'}
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {req.evidence_strength}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {req.evidence_text}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectEvidence(req)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                        >
                          <Eye className="h-3 w-3 text-indigo-500" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4: EVIDENCE */}
      <section id="evidence" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Verified Evidence Extraction & Telemetry
          </h2>
          <span className="text-xs text-slate-400">
            {evidenceData?.evidence_found_count || 0} Supported Claims Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(evidenceData?.evidence_items || []).filter(e => e.evidence_strength !== 'No evidence').map((ev, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{ev.skill}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({ev.requirement})</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                  {ev.evidence_strength}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{ev.evidence_text}"
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Location: <strong>{ev.resume_location}</strong></span>
                {ev.duration && <span>Duration: <strong>{ev.duration}</strong></span>}
                <span>Recency: <strong>{ev.recency}</strong></span>
                <span>Score: <strong className="text-indigo-600">{ev.evidence_score.toFixed(1)}/10</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: EXPERIENCE */}
      <section id="experience" className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-600" />
          Experience Timeline & Verified Roles
        </h2>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {p?.work_experience && p.work_experience.length > 0 ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6 pl-6">
              {p.work_experience.map((exp, idx) => (
                <div key={idx} className="relative space-y-1.5">
                  <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {exp.job_title || 'Software Engineer'}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {exp.employment_dates || 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> {exp.company || 'Enterprise Firm'}
                  </p>

                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      {exp.responsibilities.map((resp, ri) => (
                        <li key={ri}>{resp}</li>
                      ))}
                    </ul>
                  )}

                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="rounded-xl bg-emerald-50/50 p-2.5 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Key Achievements
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700 dark:text-slate-300 mt-1">
                        {exp.achievements.map((ach, ai) => (
                          <li key={ai}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No explicit work experience blocks detected.</p>
          )}
        </div>
      </section>

      {/* SECTION 6: PROJECTS */}
      <section id="projects" className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCode2 className="h-5 w-5 text-indigo-600" />
          Projects & Technical Implementations
        </h2>

        {p?.projects && p.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.projects.map((proj, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{proj.name || 'Technical Project'}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{proj.description}</p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.map((t, ti) => (
                      <span
                        key={ti}
                        className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No distinct project entries parsed in resume.
          </div>
        )}
      </section>

      {/* SECTION 7: SKILLS (Normalized vs Raw) */}
      <section id="skills" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Skills & Canonical Taxonomy Normalization
          </h2>
          <span className="text-xs text-slate-400">{p?.normalized_skills?.length || 0} Normalized Skills</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {p?.normalized_skills && p.normalized_skills.length > 0 ? (
              p.normalized_skills.map((ns, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {ns.normalized_skill}
                    </span>
                    {ns.original_skill !== ns.normalized_skill && (
                      <span className="text-[10px] text-slate-400">
                        Raw: '{ns.original_skill}'
                      </span>
                    )}
                  </div>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {Math.round(ns.confidence * 100)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 col-span-3">No normalized skills available</p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 8: MISSING REQUIREMENTS */}
      <section id="missing-requirements" className="space-y-4">
        <h2 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-rose-600" />
          Missing Requirements
        </h2>

        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/30 p-6 dark:border-rose-950 dark:bg-rose-950/10 space-y-4">
          <div className="rounded-xl bg-white p-4 dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300">
            <strong>Zero-Hallucination Policy Disclaimer:</strong> RecruitIQ explicitly indicates when evidence is absent in the submitted resume. Missing status means <em>"Requirement was not found in the resume"</em> (does not assume lack of skill).
          </div>

          {missingReqs && missingReqs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingReqs.map((m, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 shadow-2xs"
                >
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{m}</span>
                  <span className="text-[10px] text-slate-400">Not detected in text</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ All required skills and qualifications have supporting evidence in the candidate's resume.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 9: UNCERTAIN CLAIMS */}
      <section id="uncertain-claims" className="space-y-4">
        <h2 className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Uncertain Claims & Ambiguous Evidence
        </h2>

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/30 p-6 dark:border-amber-950 dark:bg-amber-950/10 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Claims detected in generic lists or without sufficient project/role context. Recruiters should verify these claims during technical screening.
          </p>

          {uncertainReqs && uncertainReqs.length > 0 ? (
            <div className="space-y-2">
              {uncertainReqs.map((u, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-slate-900 dark:text-amber-300 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-bold">{u}</span>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Needs Interview Verification
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 text-xs text-slate-500">
              No highly ambiguous claims detected.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 10: NOISE DETECTION */}
      <section id="noise-detection" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-600" />
            Noise Detection & Keyword Stuffing Telemetry
          </h2>
          {noise && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              noise.noise_level === 'Low'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : noise.noise_level === 'Moderate'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              Noise Level: {noise.noise_level}
            </span>
          )}
        </div>

        {noise ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Keyword Mentions</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{noise.total_keyword_occurrences}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Evidence Backed</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{noise.total_evidence_backed_occurrences}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Strong Evidence</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{noise.total_strong_evidence}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">JD Copy-Paste</span>
                <span className={`text-xl font-bold ${noise.jd_copy_paste_detected ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {noise.jd_copy_paste_detected ? 'Detected' : 'None'}
                </span>
              </div>
            </div>

            {noise.noise_reasons && noise.noise_reasons.length > 0 && (
              <div className="rounded-xl bg-amber-50/60 p-4 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Noise Analysis Observations
                </span>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {noise.noise_reasons.map((r, ri) => (
                    <li key={ri}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Noise telemetry not available.</p>
        )}
      </section>

      {/* INSPECT EVIDENCE MODAL */}
      {inspectEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Evidence Inspector
                </h3>
              </div>
              <button
                onClick={() => setInspectEvidence(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Requirement / Skill</span>
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {'skill' in inspectEvidence ? inspectEvidence.skill : inspectEvidence.requirement}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence Strength</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {inspectEvidence.evidence_strength}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Verifiable Resume Quote
                </span>
                <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-200 border border-slate-200 dark:border-slate-800 leading-relaxed">
                  "{inspectEvidence.evidence_text}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resume Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectEvidence.resume_location}</span>
                </div>
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recency & Duration</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectEvidence.duration || 'N/A'} • {inspectEvidence.recency}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectEvidence(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
