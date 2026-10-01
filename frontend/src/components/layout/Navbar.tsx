'use client';

import React from 'react';
import Link from 'next/link';
import { BriefcasePlus, UploadCloud, Search, Bell } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search jobs, candidates, skills..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <BriefcasePlus className="h-4 w-4 text-indigo-500" />
          Create Job
        </Link>
        <Link
          href="/resumes/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 active:scale-98"
        >
          <UploadCloud className="h-4 w-4" />
          Upload Resumes
        </Link>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
