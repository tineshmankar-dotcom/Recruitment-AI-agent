'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  SlidersHorizontal,
  Search,
  AlertTriangle,
  XCircle,
  Clock,
  GitPullRequest
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchJobs, fetchJobCandidateMatches, Job, CandidateMatchResponse } from '@/lib/api';

export default function ShortlistPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [rankedMatches, setRankedMatches] = useState<CandidateMatchResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExplainMatch, setSelectedExplainMatch] = useState<CandidateMatchResponse | null>(null);

  // Multi-candidate comparison selection state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Filter States
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [minExperienceMonths, setMinExperienceMonths] = useState<number>(0);
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [evidenceStrengthFilter, setEvidenceStrengthFilter] = useState<string>('ALL');
  const [missingReqsFilter, setMissingReqsFilter] = useState<string>('ALL');
  const [noiseLevelFilter, setNoiseLevelFilter] = useState<string>('ALL');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

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
    setSelectedCandidateIds([]);
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

  const toggleSelectCandidate = (candidateId: string) => {
    if (selectedCandidateIds.includes(candidateId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== candidateId));
    } else {
      if (selectedCandidateIds.length >= 4) {
        alert('You can select up to 4 candidates for side-by-side comparison.');
        return;
      }
      setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
    }
  };

  const handleCompareSelected = () => {
    if (selectedCandidateIds.length < 2) {
      alert('Please select at least 2 candidates to compare.');
      return;
    }
    router.push(`/candidates/compare?ids=${selectedCandidateIds.join(',')}&jobId=${selectedJobId}`);
  };

  const resetFilters = () => {
    setMinMatchScore(0);
    setMinExperienceMonths(0);
    setSkillSearch('');
    setEvidenceStrengthFilter('ALL');
    setMissingReqsFilter('ALL');
    setNoiseLevelFilter('ALL');
    setReviewStatusFilter('ALL');
  };

  // Filter candidates
  const filteredMatches = rankedMatches.filter((cand) => {
    if (cand.final_match_score < minMatchScore) return false;
    
    const expMonths = cand.experience_details?.verified_experience_months || 0;
    if (expMonths < minExperienceMonths) return false;

    if (skillSearch.trim()) {
      const term = skillSearch.toLowerCase();
      const hasSkill = cand.strong_matches.some(s => s.toLowerCase().includes(term)) ||
        cand.partial_matches.some(s => s.toLowerCase().includes(term)) ||
        cand.candidate_name.toLowerCase().includes(term);
      if (!hasSkill) return false;
    }

    if (evidenceStrengthFilter !== 'ALL') {
      if (evidenceStrengthFilter === 'Strong' && !cand.evidence_strength_summary.includes('Strong')) return false;
      if (evidenceStrengthFilter === 'Moderate' && !cand.evidence_strength_summary.includes('Moderate')) return false;
      if (evidenceStrengthFilter === 'Weak' && !cand.evidence_strength_summary.includes('Weak')) return false;
    }

    if (missingReqsFilter !== 'ALL') {
      if (missingReqsFilter === 'NONE' && cand.missing_requirements.length > 0) return false;
      if (missingReqsFilter === 'HAS_MISSING' && cand.missing_requirements.length === 0) return false;
    }

    if (noiseLevelFilter !== 'ALL' && cand.noise_analysis.noise_level !== noiseLevelFilter) {
      return false;
    }

    if (reviewStatusFilter !== 'ALL') {
      if (reviewStatusFilter === 'STRONG_FIT' && cand.match_grade !== 'STRONG FIT') return false;
      if (reviewStatusFilter === 'GOOD_FIT' && cand.match_grade !== 'GOOD FIT') return false;
      if (reviewStatusFilter === 'REVIEW_NEEDED' && cand.match_grade !== 'MODERATE FIT' && cand.match_grade !== 'WEAK FIT') return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Explainable Candidate Shortlist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Candidates evaluated on verified evidence, mandatory criteria coverage, depth, and noise detection — never raw keyword volume.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCandidateIds.length >= 2 && (
            <button
              onClick={handleCompareSelected}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all animate-pulse"
            >
              <GitPullRequest className="h-4 w-4" />
              Compare Selected ({selectedCandidateIds.length})
            </button>
          )}
          <Link
            href="/benchmark"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            Candidate A vs B Benchmark
          </Link>
        </div>
      </div>

      {/* Control Bar: Pipeline Select + Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Target Job:
          </span>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department || 'Engineering'}) — {j.processed_resumes || 0} candidates
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              showFilters
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? 'Hide Filters' : 'Filter Candidates'}
          </button>

          {selectedCandidateIds.length > 0 && (
            <button
              onClick={() => setSelectedCandidateIds([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
            >
              Clear selection ({selectedCandidateIds.length})
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-600" />
              Multi-Criteria Shortlist Filters
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
                <span className="text-indigo-600 font-bold">{minMatchScore}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* 2. Experience */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Min Experience (Months)</span>
                <span className="text-indigo-600 font-bold">{minExperienceMonths} mos</span>
              </label>
              <input
                type="range"
                min={0}
                max={60}
                step={6}
                value={minExperienceMonths}
                onChange={(e) => setMinExperienceMonths(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* 3. Skill Search */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Skill or Candidate Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Python, Docker, Alex"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* 4. Evidence Strength */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Evidence Strength</label>
              <select
                value={evidenceStrengthFilter}
                onChange={(e) => setEvidenceStrengthFilter(e.target.value)}
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
                value={missingReqsFilter}
                onChange={(e) => setMissingReqsFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Candidates</option>
                <option value="NONE">0 Missing Requirements</option>
                <option value="HAS_MISSING">Has Missing Requirements</option>
              </select>
            </div>

            {/* 6. Noise Level */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Noise Level</label>
              <select
                value={noiseLevelFilter}
                onChange={(e) => setNoiseLevelFilter(e.target.value)}
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
              <label className="font-bold text-slate-700 dark:text-slate-300">Review Status / Fit</label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
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

      {/* Main Candidate Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Evaluating evidence matrices & ranking candidates..." />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title="No Candidates Match Filters"
          description="Try adjusting your filter criteria or switch to a different job pipeline."
          icon={<Award className="h-6 w-6" />}
          actionLabel="Reset Filters"
          onActionClick={resetFilters}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>{filteredMatches.length}</strong> explainable candidate evaluations</span>
            <span>Select candidates to compare side-by-side</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((cand, idx) => {
              const isSelected = selectedCandidateIds.includes(cand.candidate_id);
              const isTop = idx === 0 && minMatchScore === 0;
              const isNoiseHigh = cand.noise_analysis.noise_level === 'High' || cand.noise_analysis.noise_level === 'Critical';

              return (
                <div
                  key={cand.candidate_id}
                  className={`rounded-3xl border bg-white p-6 shadow-xs hover:shadow-md transition-all dark:bg-slate-900 flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : isTop
                      ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isTop && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                      #1 Top Evidence Match
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header Row: Rank + Name + Checkbox + Score */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(cand.candidate_id)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black text-xs shadow-xs ${
                            isTop
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {cand.candidate_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${
                              cand.match_grade === 'STRONG FIT'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : cand.match_grade === 'GOOD FIT'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {cand.match_grade}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              • {cand.experience_details?.verified_experience_months || 0} mos verified exp
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-3xl font-black text-slate-900 dark:text-white block">
                          {cand.final_match_score}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Match Score</span>
                      </div>
                    </div>

                    {/* Metric 1 & 2: Mandatory vs Preferred Coverage */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>Mandatory Coverage</span>
                          <span className="text-indigo-600">{cand.mandatory_coverage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${cand.mandatory_coverage}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 block">{cand.mandatory_met_count}/{cand.mandatory_total_count} criteria met</span>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                          <span>Preferred Coverage</span>
                          <span className="text-violet-600">{cand.preferred_coverage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 rounded-full" style={{ width: `${cand.preferred_coverage}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 block">{cand.preferred_met_count}/{cand.preferred_total_count} criteria met</span>
                      </div>
                    </div>

                    {/* Metric 3: Strong Matches & Partial Matches */}
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Strong:</span>
                        {cand.strong_matches && cand.strong_matches.length > 0 ? (
                          cand.strong_matches.map((sm, i) => (
                            <span key={i} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                              ✓ {sm}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </div>

                      {cand.partial_matches && cand.partial_matches.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Partial:</span>
                          {cand.partial_matches.map((pm, i) => (
                            <span key={i} className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                              ≈ {pm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metric 4 & 5: Missing Requirements & Uncertainties */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Missing Skills</span>
                        {cand.missing_requirements && cand.missing_requirements.length > 0 ? (
                          <span className="font-semibold text-rose-600 block truncate">
                            {cand.missing_requirements.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">None (0 Missing)</span>
                        )}
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Uncertain Claims</span>
                        {cand.uncertain_requirements && cand.uncertain_requirements.length > 0 ? (
                          <span className="font-semibold text-amber-600 block truncate">
                            {cand.uncertain_requirements.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">0 Uncertain</span>
                        )}
                      </div>
                    </div>

                    {/* Metric 6: Evidence Strength & Noise Level */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        Evidence: <strong>{cand.evidence_strength_summary}</strong>
                      </span>
                      <span className={`font-bold ${isNoiseHigh ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Noise Level: {cand.noise_analysis.noise_level} ({cand.noise_analysis.total_keyword_occurrences} keys)
                      </span>
                    </div>
                  </div>

                  {/* Actions: Why this score modal, Interview Questions & Full Profile */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedExplainMatch(cand)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Why this score?
                    </button>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/interview-questions?candidateId=${cand.candidate_id}&jobId=${selectedJobId}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                      >
                        <HelpCircle className="h-3 w-3" /> Interview Guide
                      </Link>
                      <Link
                        href={`/candidates/${cand.candidate_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      >
                        Profile →
                      </Link>
                    </div>
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
                    Final Evidence Score: {selectedExplainMatch.final_match_score}% ({selectedExplainMatch.match_grade})
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

            <div className="rounded-2xl bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto">
              {selectedExplainMatch.why_this_score}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href={`/candidates/${selectedExplainMatch.candidate_id}`}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Open 10-Section Candidate Profile →
              </Link>
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
