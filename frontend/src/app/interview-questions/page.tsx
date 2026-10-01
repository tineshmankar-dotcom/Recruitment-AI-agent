'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HelpCircle,
  Briefcase,
  Sparkles,
  MessageSquare,
  Copy,
  CheckCircle2,
  ChevronDown,
  User,
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  Layers,
  ArrowRight,
  Download,
  Award,
  Clock,
  Volume2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchJobs,
  fetchJobResumes,
  fetchCandidateInterviewGuide,
  Job,
  Resume,
  CandidateInterviewGuideResponse,
  InterviewQuestion
} from '@/lib/api';

export default function InterviewQuestionsPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading Interview Agent..." />}>
      <InterviewQuestionsContent />
    </Suspense>
  );
}

function InterviewQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramJobId = searchParams.get('jobId') || '';
  const paramCandidateId = searchParams.get('candidateId') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(paramJobId);
  const [candidates, setCandidates] = useState<Resume[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(paramCandidateId);
  const [interviewGuide, setInterviewGuide] = useState<CandidateInterviewGuideResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingGuide, setLoadingGuide] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const jobsData = await fetchJobs().catch(() => []);
        setJobs(jobsData);

        const currentJobId = paramJobId || (jobsData.length > 0 ? jobsData[0].id : '');
        setSelectedJobId(currentJobId);

        if (currentJobId) {
          const cands = await fetchJobResumes(currentJobId).catch(() => []);
          setCandidates(cands);

          const targetCandId = paramCandidateId || (cands.length > 0 ? cands[0].id : '');
          setSelectedCandidateId(targetCandId);

          if (targetCandId) {
            setLoadingGuide(true);
            const guide = await fetchCandidateInterviewGuide(targetCandId, currentJobId).catch(() => null);
            setInterviewGuide(guide);
            setLoadingGuide(false);
          }
        }
      } catch (err) {
        console.error('Failed to load interview generator data', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [paramJobId, paramCandidateId]);

  const handleJobSelect = async (jobId: string) => {
    setSelectedJobId(jobId);
    try {
      setLoadingGuide(true);
      const cands = await fetchJobResumes(jobId).catch(() => []);
      setCandidates(cands);
      if (cands.length > 0) {
        setSelectedCandidateId(cands[0].id);
        const guide = await fetchCandidateInterviewGuide(cands[0].id, jobId).catch(() => null);
        setInterviewGuide(guide);
      } else {
        setSelectedCandidateId('');
        setInterviewGuide(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleCandidateSelect = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    try {
      setLoadingGuide(true);
      const guide = await fetchCandidateInterviewGuide(candidateId, selectedJobId).catch(() => null);
      setInterviewGuide(guide);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const copyQuestionText = (q: InterviewQuestion) => {
    navigator.clipboard.writeText(q.question);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyFullGuide = () => {
    if (!interviewGuide) return;
    const lines = [
      `INTERVIEW GUIDE: ${interviewGuide.candidate_name}`,
      `Target Role: ${interviewGuide.job_title}`,
      `Match Score: ${interviewGuide.match_score}% (${interviewGuide.match_grade})`,
      `\n--- BRIEFING ---\n${interviewGuide.interviewer_briefing}\n`,
      `\n--- 1. TECHNICAL QUESTIONS ---`,
      ...interviewGuide.technical_questions.map((q, i) => `${i + 1}. [${q.target_topic}] ${q.question}\n   Expected Signals: ${q.expected_signals.join('; ')}\n   Red Flags: ${q.red_flags.join('; ')}`),
      `\n--- 2. PROJECT QUESTIONS ---`,
      ...interviewGuide.project_questions.map((q, i) => `${i + 1}. [${q.target_topic}] ${q.question}\n   Expected Signals: ${q.expected_signals.join('; ')}`),
      `\n--- 3. EXPERIENCE VERIFICATION ---`,
      ...interviewGuide.experience_questions.map((q, i) => `${i + 1}. [${q.target_topic}] ${q.question}`),
      `\n--- 4. SKILL VERIFICATION (WEAK EVIDENCE) ---`,
      ...interviewGuide.skill_verification_questions.map((q, i) => `${i + 1}. [${q.target_topic}] ${q.question}`),
      `\n--- 5. CLARIFICATION & MISSING REQUIREMENTS ---`,
      ...interviewGuide.clarification_questions.map((q, i) => `${i + 1}. [${q.target_topic}] ${q.question}`)
    ];

    navigator.clipboard.writeText(lines.join('\n\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const currentQuestions: InterviewQuestion[] = interviewGuide
    ? [
        ...(activeCategory === 'ALL' || activeCategory === 'Technical' ? interviewGuide.technical_questions : []),
        ...(activeCategory === 'ALL' || activeCategory === 'Project' ? interviewGuide.project_questions : []),
        ...(activeCategory === 'ALL' || activeCategory === 'Experience Verification' ? interviewGuide.experience_questions : []),
        ...(activeCategory === 'ALL' || activeCategory === 'Skill Verification' ? interviewGuide.skill_verification_questions : []),
        ...(activeCategory === 'ALL' || activeCategory === 'Clarification' ? interviewGuide.clarification_questions : [])
      ]
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
            Personalized Interview Question Agent
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tailored questions generated dynamically from verified evidence, weak claims, missing criteria, and candidate projects.
          </p>
        </div>
        {interviewGuide && (
          <div className="flex items-center gap-3">
            <button
              onClick={copyFullGuide}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-98 transition-all"
            >
              <Copy className="h-4 w-4" />
              {copiedAll ? 'Interview Guide Copied!' : 'Copy Full Interview Guide'}
            </button>
          </div>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Select Job Pipeline
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobSelect(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department || 'Engineering'}) — {j.processed_resumes || 0} candidates
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Select Candidate Profile
          </label>
          <select
            value={selectedCandidateId}
            onChange={(e) => handleCandidateSelect(e.target.value)}
            disabled={candidates.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-50"
          >
            {candidates.length === 0 ? (
              <option value="">No candidates uploaded for this job</option>
            ) : (
              candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidate_name || 'Candidate'} ({c.parsed_data?.job_titles?.[0] || 'Software Professional'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {loading || loadingGuide ? (
        <LoadingSpinner text="Generating tailored interview guide & evaluation rubrics..." />
      ) : !interviewGuide ? (
        <EmptyState
          title="No Candidate Selected"
          description="Upload or choose a candidate resume to generate personalized, evidence-backed interview questions."
          icon={<HelpCircle className="h-6 w-6" />}
          actionLabel="Upload Resumes"
          actionHref={`/resumes/upload?jobId=${selectedJobId}`}
        />
      ) : (
        <div className="space-y-8">
          {/* Interviewer Briefing Card */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-6 shadow-xs dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20">
                  {interviewGuide.candidate_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {interviewGuide.candidate_name}
                  </h2>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Target Role: {interviewGuide.job_title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase">Match Score</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {interviewGuide.match_score}% <span className="text-xs text-indigo-600 font-bold">({interviewGuide.match_grade})</span>
                  </p>
                </div>
                <Link
                  href={`/candidates/${interviewGuide.candidate_id}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  View Profile →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {interviewGuide.interviewer_briefing}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            {[
              { id: 'ALL', label: `All Questions (${interviewGuide.total_questions})`, icon: HelpCircle },
              { id: 'Technical', label: `1. Technical (${interviewGuide.technical_questions.length})`, icon: Sparkles },
              { id: 'Project', label: `2. Projects (${interviewGuide.project_questions.length})`, icon: FileCode2 },
              { id: 'Experience Verification', label: `3. Experience (${interviewGuide.experience_questions.length})`, icon: Briefcase },
              { id: 'Skill Verification', label: `4. Skill Verification (${interviewGuide.skill_verification_questions.length})`, icon: ShieldCheck },
              { id: 'Clarification', label: `5. Clarification & Gaps (${interviewGuide.clarification_questions.length})`, icon: AlertTriangle }
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Questions Stream */}
          <div className="space-y-6">
            {currentQuestions.map((q, idx) => {
              const isTechnical = q.category === 'Technical';
              const isProject = q.category === 'Project';
              const isExperience = q.category === 'Experience Verification';
              const isVerification = q.category === 'Skill Verification';
              const isClarification = q.category === 'Clarification';

              return (
                <div
                  key={q.id || idx}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 transition-all space-y-4"
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                        isTechnical
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200'
                          : isProject
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200'
                          : isExperience
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                          : isVerification
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                      }`}>
                        {q.category}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Focus: {q.target_topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400">
                        Difficulty: {q.difficulty}
                      </span>
                      <button
                        onClick={() => copyQuestionText(q)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Copy className="h-3 w-3 text-indigo-600" />
                        {copiedId === q.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      "{q.question}"
                    </p>
                  </div>

                  {/* Context Source & Interviewer Rationale */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Source Context in Resume
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        {q.context_source}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Why We Ask This (Rationale)
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {q.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Expected Signals & Red Flags */}
                  {(q.expected_signals.length > 0 || q.red_flags.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      {q.expected_signals.length > 0 && (
                        <div className="rounded-2xl bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Expected Positive Signals
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                            {q.expected_signals.map((sig, si) => (
                              <li key={si}>{sig}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {q.red_flags.length > 0 && (
                        <div className="rounded-2xl bg-rose-50/50 p-3.5 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Red Flags / Warning Signs
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                            {q.red_flags.map((rf, ri) => (
                              <li key={ri}>{rf}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
