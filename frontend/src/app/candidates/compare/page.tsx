'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Layers,
  Filter,
  BarChart3,
  Award,
  Clock,
  Briefcase,
  SlidersHorizontal,
  Search,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchJobs,
  fetchAllResumes,
  compareMultipleCandidates,
  Job,
  Resume,
  MultiCandidateCompareResponse
} from '@/lib/api';

export default function CandidateComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading comparison matrix..." />}>
      <CandidateCompareContent />
    </Suspense>
  );
}

function CandidateCompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [allCandidates, setAllCandidates] = useState<Resume[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(initialIds);
  
  const [compareData, setCompareData] = useState<MultiCandidateCompareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterMinExperience, setFilterMinExperience] = useState<number>(0);
  const [filterSkillSearch, setFilterSkillSearch] = useState<string>('');
  const [filterEvidenceStrength, setFilterEvidenceStrength] = useState<string>('ALL');
  const [filterMissingReqs, setFilterMissingReqs] = useState<string>('ALL');
  const [filterNoise, setFilterNoise] = useState<string>('ALL');
  const [filterReviewStatus, setFilterReviewStatus] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [jobsData, candidatesData] = await Promise.all([
          fetchJobs().catch(() => []),
          fetchAllResumes().catch(() => [])
        ]);
        setJobs(jobsData);
        setAllCandidates(candidatesData);

        const targetJobId = initialJobId || (jobsData.length > 0 ? jobsData[0].id : undefined);
        if (targetJobId) setSelectedJobId(targetJobId);

        let cids = selectedCandidateIds;
        if (cids.length === 0 && candidatesData.length >= 2) {
          cids = candidatesData.slice(0, 3).map((c) => c.id);
          setSelectedCandidateIds(cids);
        }

        if (cids.length >= 1) {
          const matrix = await compareMultipleCandidates(cids, targetJobId);
          setCompareData(matrix);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load comparison');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRunComparison = async (cids: string[], jid?: string) => {
    if (cids.length < 2) {
      setError('Please select at least 2 candidates to compare side-by-side.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const matrix = await compareMultipleCandidates(cids, jid || selectedJobId);
      setCompareData(matrix);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidateSelection = (id: string) => {
    let updated = [];
    if (selectedCandidateIds.includes(id)) {
      updated = selectedCandidateIds.filter((cid) => cid !== id);
    } else {
      if (selectedCandidateIds.length >= 4) {
        setError('Maximum 4 candidates can be compared side-by-side.');
        return;
      }
      updated = [...selectedCandidateIds, id];
    }
    setSelectedCandidateIds(updated);
    if (updated.length >= 2) {
      handleRunComparison(updated);
    }
  };

  const resetFilters = () => {
    setFilterMinScore(0);
    setFilterMinExperience(0);
    setFilterSkillSearch('');
    setFilterEvidenceStrength('ALL');
    setFilterMissingReqs('ALL');
    setFilterNoise('ALL');
    setFilterReviewStatus('ALL');
  };

  // Filter candidates visible in comparison
  const filteredCandidates = compareData?.candidates.filter((c) => {
    if (c.final_match_score < filterMinScore) return false;

    const expMonths = c.experience_details?.verified_experience_months || 0;
    if (expMonths < filterMinExperience) return false;

    if (filterSkillSearch.trim()) {
      const term = filterSkillSearch.toLowerCase();
      const hasSkill = c.strong_matches.some(s => s.toLowerCase().includes(term)) ||
        c.partial_matches.some(s => s.toLowerCase().includes(term)) ||
        c.candidate_name.toLowerCase().includes(term);
      if (!hasSkill) return false;
    }

    if (filterEvidenceStrength !== 'ALL') {
      if (filterEvidenceStrength === 'Strong' && !c.evidence_strength_summary.includes('Strong')) return false;
      if (filterEvidenceStrength === 'Moderate' && !c.evidence_strength_summary.includes('Moderate')) return false;
      if (filterEvidenceStrength === 'Weak' && !c.evidence_strength_summary.includes('Weak')) return false;
    }

    if (filterMissingReqs !== 'ALL') {
      if (filterMissingReqs === 'NONE' && c.missing_requirements.length > 0) return false;
      if (filterMissingReqs === 'HAS_MISSING' && c.missing_requirements.length === 0) return false;
    }

    if (filterNoise !== 'ALL' && c.noise_analysis.noise_level !== filterNoise) {
      return false;
    }

    if (filterReviewStatus !== 'ALL') {
      if (filterReviewStatus === 'STRONG_FIT' && c.match_grade !== 'STRONG FIT') return false;
      if (filterReviewStatus === 'GOOD_FIT' && c.match_grade !== 'GOOD FIT') return false;
      if (filterReviewStatus === 'REVIEW_NEEDED' && c.match_grade !== 'MODERATE FIT' && c.match_grade !== 'WEAK FIT') return false;
    }

    return true;
  }) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Shortlist
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Candidate Comparison Matrix
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Side-by-side evidence evaluation: Python, AWS, Docker, ML, Relevant Experience, Evidence Strength, Missing Skills, Uncertainty, and Noise.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
              showFilters
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? 'Hide Filters' : 'Filter Candidates'}
          </button>

          <Link
            href="/benchmark"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Candidate A vs B Benchmark
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-600" />
              Comparison Filters
            </span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Match Score */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Min Match Score</span>
                <span className="text-indigo-600 font-bold">{filterMinScore}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* 2. Experience */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Min Experience (Months)</span>
                <span className="text-indigo-600 font-bold">{filterMinExperience} mos</span>
              </label>
              <input
                type="range"
                min={0}
                max={60}
                step={6}
                value={filterMinExperience}
                onChange={(e) => setFilterMinExperience(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* 3. Skills */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Skills / Candidate</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Python, Docker, AWS"
                  value={filterSkillSearch}
                  onChange={(e) => setFilterSkillSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* 4. Evidence Strength */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Evidence Strength</label>
              <select
                value={filterEvidenceStrength}
                onChange={(e) => setFilterEvidenceStrength(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Evidence Qualities</option>
                <option value="Strong">Strong Evidence Only</option>
                <option value="Moderate">Moderate & Strong</option>
                <option value="Weak">Weak Evidence</option>
              </select>
            </div>

            {/* 5. Missing Requirements */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Missing Requirements</label>
              <select
                value={filterMissingReqs}
                onChange={(e) => setFilterMissingReqs(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Candidates</option>
                <option value="NONE">0 Missing Requirements</option>
                <option value="HAS_MISSING">Has Missing Requirements</option>
              </select>
            </div>

            {/* 6. Noise */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Noise Level</label>
              <select
                value={filterNoise}
                onChange={(e) => setFilterNoise(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Noise Levels</option>
                <option value="Low">Low Noise Only (Clean)</option>
                <option value="Moderate">Moderate Noise</option>
                <option value="High">High Noise (Stuffed)</option>
              </select>
            </div>

            {/* 7. Review Status */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Review Status</label>
              <select
                value={filterReviewStatus}
                onChange={(e) => setFilterReviewStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="STRONG_FIT">Strong Fit</option>
                <option value="GOOD_FIT">Good Fit</option>
                <option value="REVIEW_NEEDED">Review Needed / Moderate</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Selection Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Candidates to Compare (2 to 4 candidates):
          </span>
          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Against Job:</span>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  handleRunComparison(selectedCandidateIds, e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department || 'Engineering'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {allCandidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            return (
              <button
                key={cand.id}
                onClick={() => toggleCandidateSelection(cand.id)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span>{cand.candidate_name || 'Candidate'}</span>
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating multi-candidate requirement matrix & evidence alignment..." />
      ) : !compareData || filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates match comparison filters"
          description="Select candidate profiles or adjust your filters to view side-by-side evaluation matrix."
          icon={<Users className="h-6 w-6" />}
          actionLabel="Reset Filters"
          onActionClick={resetFilters}
        />
      ) : (
        <div className="space-y-8">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCandidates.map((c, idx) => {
              const isWinner = c.candidate_name === compareData.summary_comparison.top_candidate;
              const isNoiseHigh = c.noise_analysis.noise_level === 'High' || c.noise_analysis.noise_level === 'Critical';

              return (
                <div
                  key={c.candidate_id}
                  className={`rounded-3xl border p-5 shadow-xs bg-white dark:bg-slate-900 relative overflow-hidden flex flex-col justify-between ${
                    isWinner
                      ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isWinner && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
                      ★ Top Match
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.candidate_name}
                        </h3>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {c.match_grade}
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {c.final_match_score}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mandatory Coverage:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{c.mandatory_coverage}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Verified Exp:</span>
                        <strong>{c.experience_details?.verified_experience_months || 0} mos</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Evidence Quality:</span>
                        <strong>{c.evidence_strength_summary}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Noise Level:</span>
                        <span className={`font-bold ${isNoiseHigh ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {c.noise_analysis.noise_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-right">
                    <Link
                      href={`/candidates/${c.candidate_id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      View 10-Section Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Side-by-Side Requirement Matrix */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  Side-by-Side Requirement Comparison Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target job: <strong>{compareData.job_title}</strong>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 pl-6 pr-3 w-48">Requirement</th>
                    <th className="px-3 py-4 w-28">Importance</th>
                    {filteredCandidates.map((c) => (
                      <th key={c.candidate_id} className="px-4 py-4 min-w-[200px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {c.candidate_name}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                            Score: {c.final_match_score}%
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Summary Metric Rows */}
                  <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 font-semibold">
                    <td className="py-3 pl-6 pr-3 text-slate-800 dark:text-slate-200">
                      Overall Match Score
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Total</span>
                    </td>
                    {filteredCandidates.map((c) => (
                      <td key={c.candidate_id} className="px-4 py-3">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {c.final_match_score}% ({c.match_grade})
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-3 pl-6 pr-3 text-slate-700 dark:text-slate-300 font-semibold">
                      Verified Relevant Experience
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Duration</span>
                    </td>
                    {filteredCandidates.map((c) => (
                      <td key={c.candidate_id} className="px-4 py-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.experience_details?.verified_experience_months || 0} months
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">
                          {c.experience_details?.verified_experience_summary}
                        </p>
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-3 pl-6 pr-3 text-slate-700 dark:text-slate-300 font-semibold">
                      Evidence Quality Summary
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Evidence</span>
                    </td>
                    {filteredCandidates.map((c) => (
                      <td key={c.candidate_id} className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.evidence_strength_summary}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-3 pl-6 pr-3 text-slate-700 dark:text-slate-300 font-semibold">
                      Missing Requirements
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Gaps</span>
                    </td>
                    {filteredCandidates.map((c) => (
                      <td key={c.candidate_id} className="px-4 py-3">
                        {c.missing_requirements.length > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {c.missing_requirements.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0 Missing</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-3 pl-6 pr-3 text-slate-700 dark:text-slate-300 font-semibold">
                      Uncertain Claims
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Uncertainty</span>
                    </td>
                    {filteredCandidates.map((c) => (
                      <td key={c.candidate_id} className="px-4 py-3">
                        {c.uncertain_requirements.length > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {c.uncertain_requirements.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">0 Uncertain</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-3 pl-6 pr-3 text-slate-700 dark:text-slate-300 font-semibold">
                      Noise & Stuffing Level
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-400">Noise</span>
                    </td>
                    {filteredCandidates.map((c) => {
                      const isHigh = c.noise_analysis.noise_level === 'High' || c.noise_analysis.noise_level === 'Critical';
                      return (
                        <td key={c.candidate_id} className="px-4 py-3">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isHigh ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                          }`}>
                            {c.noise_analysis.noise_level} ({c.noise_analysis.total_keyword_occurrences} keys, -{c.score_breakdown.noise_penalty} pts)
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Individual Requirements Rows (Python, AWS, Docker, ML, etc.) */}
                  {compareData.requirement_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 pl-6 pr-3 font-bold text-slate-900 dark:text-white">
                        {row.requirement}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={row.importance === 'MANDATORY' ? 'mandatory' : 'preferred'}>
                          {row.importance}
                        </Badge>
                      </td>
                      {filteredCandidates.map((c) => {
                        const evalItem = row.candidate_evaluations[c.candidate_id];
                        const status = evalItem?.status || 'MISSING';
                        const isMatched = status === 'MATCHED';
                        const isPartial = status === 'PARTIALLY MATCHED';
                        const isMissing = status === 'MISSING';

                        return (
                          <td key={c.candidate_id} className="px-4 py-3.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isMatched
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                                    : isPartial
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                }`}
                              >
                                {status}
                              </span>
                              {evalItem?.evidence_strength && evalItem.evidence_strength !== 'No evidence' && (
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  ({evalItem.evidence_strength})
                                </span>
                              )}
                            </div>

                            {evalItem?.evidence_text && evalItem.evidence_text !== 'Evidence not found in resume.' ? (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 max-w-xs">
                                "{evalItem.evidence_text}"
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">
                                Evidence not found in resume.
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
