'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Eye,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  UploadCloud
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchAllResumes, Resume } from '@/lib/api';

export default function CandidatePoolPage() {
  const [candidates, setCandidates] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        const data = await fetchAllResumes();
        setCandidates(data);
      } catch (err: any) {
        console.error('Failed to load candidate pool', err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const filteredCandidates = candidates.filter((cand) => {
    const matchesStatus = statusFilter === 'all' || cand.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (cand.candidate_name && cand.candidate_name.toLowerCase().includes(q)) ||
      (cand.email && cand.email.toLowerCase().includes(q)) ||
      (cand.file_name && cand.file_name.toLowerCase().includes(q)) ||
      (cand.parsed_data?.skills && cand.parsed_data.skills.some((s) => s.toLowerCase().includes(q))) ||
      (cand.parsed_data?.job_titles && cand.parsed_data.job_titles.some((t) => t.toLowerCase().includes(q)));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Candidate Intelligence Pool
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search, filter, and inspect structured candidate records extracted from ingested resumes.
          </p>
        </div>
        <Link
          href="/resumes/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all"
        >
          <UploadCloud className="h-4 w-4" />
          Ingest New Resumes
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, skill, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'processed', 'pending', 'duplicate', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <LoadingSpinner text="Loading candidate database..." />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No Candidates Found"
          description={
            candidates.length === 0
              ? 'No resumes have been uploaded yet. Ingest candidate resumes to build the pool.'
              : 'No candidate matched your search or status filter criteria.'
          }
          icon={<Users className="h-6 w-6" />}
          actionLabel="Upload Resumes"
          actionHref="/resumes/upload"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Candidate</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Key Skills Extracted</th>
                  <th className="px-3 py-3.5">Experience & Role</th>
                  <th className="px-3 py-3.5">Document</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 pl-6 pr-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {cand.candidate_name || 'Candidate'}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                          <span>{cand.email || 'Email not listed'}</span>
                          {cand.phone && <span>• {cand.phone}</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {cand.id}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <Badge variant={cand.status}>{cand.status}</Badge>
                    </td>

                    <td className="px-3 py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cand.parsed_data?.skills && cand.parsed_data.skills.length > 0 ? (
                          cand.parsed_data.skills.slice(0, 4).map((s, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No skills tagged</span>
                        )}
                        {cand.parsed_data?.skills && cand.parsed_data.skills.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{cand.parsed_data.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {cand.parsed_data?.job_titles?.[0] || 'Software Professional'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {cand.parsed_data?.companies?.[0] || 'Tech Enterprise'}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <FileText className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="truncate max-w-[120px]">{cand.file_name}</span>
                      </div>
                    </td>

                    <td className="py-4 pl-3 pr-6 text-right">
                      <Link
                        href={`/candidates/${cand.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
