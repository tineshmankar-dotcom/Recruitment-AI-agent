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
  Eye,
  ExternalLink,
  HelpCircle,
  Clock,
  Compass,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { fetchResume, fetchResumeEvidence, Resume, EvidenceResponse, EvidenceItem } from '@/lib/api';

export default function CandidateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Resume | null>(null);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'structured' | 'original' | 'json'>('evidence');
  const [copiedId, setCopiedId] = useState(false);

  // Evidence modal state
  const [inspectEvidence, setInspectEvidence] = useState<EvidenceItem | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'found' | 'missing'>('all');

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const data = await fetchResume(candidateId);
        setCandidate(data);

        // Fetch evidence extraction
        setLoadingEvidence(true);
        try {
          const ev = await fetchResumeEvidence(candidateId, data.job_id);
          setEvidenceData(ev);
        } catch (evErr) {
          console.error('Evidence extraction fetch failed', evErr);
        } finally {
          setLoadingEvidence(false);
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
    return <LoadingSpinner text="Retrieving parsed candidate intelligence & evidence..." />;
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
  const evidenceList = evidenceData?.evidence_items || [];

  const filteredEvidence = evidenceList.filter((item) => {
    const isFound = item.evidence_strength !== 'No evidence';
    if (evidenceFilter === 'found') return isFound;
    if (evidenceFilter === 'missing') return !isFound;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Badge variant={candidate.status}>{candidate.status}</Badge>
          <button
            onClick={copyCandidateId}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            {copiedId ? 'Copied ID!' : 'Copy Unique ID'}
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-2xl font-bold shadow-md shadow-indigo-500/20">
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

          <div className="flex flex-col items-end justify-center rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ingested File</span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.file_name}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Format: {candidate.file_type.toUpperCase()} • {candidate.file_size ? `${(candidate.file_size / 1024).toFixed(1)} KB` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'evidence'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Evidence Extraction & Verification
          {evidenceData && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              {evidenceData.evidence_found_count}/{evidenceData.total_requirements}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('structured')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'structured'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" /> Structured Profile
        </button>
        <button
          onClick={() => setActiveTab('original')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'original'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4 w-4" /> Preserved Original Resume
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'json'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Terminal className="h-4 w-4" /> Parsed JSON Schema
        </button>
      </div>

      {/* Tab 1: EVIDENCE EXTRACTION VIEW (Phase 3 Core Deliverable) */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {/* Integrity Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/50 p-5 dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Explainable Evidence Engine & Zero-Hallucination Policy
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  RecruitIQ strictly extracts verifiable sentences from the candidate's actual resume.
                  When evidence is absent, it explicitly outputs <strong>"Evidence not found in resume."</strong> without prematurely assuming the candidate lacks the skill.
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Filter & Metrics Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Evidence Summary:
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {evidenceData?.evidence_found_count || 0} Supported
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {(evidenceData?.total_requirements || 0) - (evidenceData?.evidence_found_count || 0)} Not in Resume
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEvidenceFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  evidenceFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All Requirements ({evidenceList.length})
              </button>
              <button
                onClick={() => setEvidenceFilter('found')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  evidenceFilter === 'found'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Evidence Found ({evidenceData?.evidence_found_count || 0})
              </button>
              <button
                onClick={() => setEvidenceFilter('missing')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  evidenceFilter === 'missing'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Not Found
              </button>
            </div>
          </div>

          {/* Evidence Items Grid */}
          {loadingEvidence ? (
            <LoadingSpinner text="Scanning resume text and evaluating evidence strength..." />
          ) : filteredEvidence.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">No items match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvidence.map((ev, idx) => {
                const isFound = ev.evidence_strength !== 'No evidence';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-5 transition-all ${
                      isFound
                        ? 'border-slate-200 bg-white shadow-xs hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800'
                        : 'border-slate-200/60 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-950/40 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {ev.skill}
                          </span>
                          {ev.requirement !== ev.skill && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              (Target: {ev.requirement})
                            </span>
                          )}
                        </div>

                        {isFound ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                            ✓ {ev.evidence_strength}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Evidence not found in resume
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isFound && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Score: <strong className="text-indigo-600 dark:text-indigo-400">{ev.evidence_score.toFixed(1)}/10</strong>
                          </span>
                        )}
                        <button
                          onClick={() => setInspectEvidence(ev)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-500" />
                          View Resume Evidence
                        </button>
                      </div>
                    </div>

                    {/* Verbatim Quote Box */}
                    <div className="mt-3">
                      <p
                        className={`text-xs leading-relaxed ${
                          isFound
                            ? 'font-medium text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic'
                            : 'text-slate-400 italic'
                        }`}
                      >
                        "{ev.evidence_text}"
                      </p>
                    </div>

                    {/* Evidence Metadata Breadcrumb */}
                    {isFound && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Compass className="h-3.5 w-3.5 text-indigo-500" />
                          Location: <strong>{ev.resume_location}</strong>
                        </span>
                        {ev.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Duration: {ev.duration}
                          </span>
                        )}
                        <span>Recency: {ev.recency}</span>
                        <span>Confidence: {Math.round(ev.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: STRUCTURED PROFILE VIEW */}
      {activeTab === 'structured' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Work Experience */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                Work Experience Timeline
              </h2>

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

            {/* Projects */}
            {p?.projects && p.projects.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-indigo-600" />
                  Key Projects & Technical Initiatives
                </h2>
                <div className="space-y-4">
                  {p.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                    >
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">{proj.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{proj.description}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.technologies.map((t, ti) => (
                            <span
                              key={ti}
                              className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Normalized Skills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Normalized Skills (Phase 3)</span>
                <span className="text-[10px] text-indigo-600">Canonical Taxonomy</span>
              </h3>
              <div className="space-y-2">
                {p?.normalized_skills && p.normalized_skills.length > 0 ? (
                  p.normalized_skills.map((ns, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ns.normalized_skill}
                        </span>
                        {ns.original_skill !== ns.normalized_skill && (
                          <span className="block text-[10px] text-slate-400">
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
                  <p className="text-xs text-slate-400">No normalized skills available</p>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-500" /> Education
              </h3>
              {p?.education && p.education.length > 0 ? (
                <div className="space-y-3">
                  {p.education.map((edu, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{edu.degree}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{edu.institution} ({edu.year})</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Not specified</p>
              )}
            </div>

            {/* Certifications & Achievements */}
            {((p?.certifications && p.certifications.length > 0) || (p?.achievements && p.achievements.length > 0)) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" /> Certifications & Achievements
                </h3>
                {p?.certifications?.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
                {p?.achievements?.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: VERBATIM ORIGINAL RESUME */}
      {activeTab === 'original' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Verbatim Original Resume Text
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preserved exact text extracted directly from {candidate.file_name}
              </p>
            </div>
          </div>
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-6 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {candidate.raw_text || 'No raw text content available.'}
          </pre>
        </div>
      )}

      {/* Tab 4: JSON SCHEMA */}
      {activeTab === 'json' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Parsed Candidate Record (JSON)
            </h2>
          </div>
          <pre className="max-h-[600px] overflow-auto rounded-xl bg-slate-950 p-6 font-mono text-xs text-emerald-400">
            {JSON.stringify(candidate, null, 2)}
          </pre>
        </div>
      )}

      {/* VIEW RESUME EVIDENCE INSPECTOR MODAL */}
      {inspectEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Resume Evidence Inspector
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
                    {inspectEvidence.skill}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence Strength</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {inspectEvidence.evidence_strength} ({inspectEvidence.evidence_score.toFixed(1)}/10)
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Project / Job</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectEvidence.project_or_job}</span>
                </div>
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duration & Recency</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectEvidence.duration || 'N/A'} • {inspectEvidence.recency}</span>
                </div>
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Confidence</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(inspectEvidence.confidence * 100)}%</span>
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
