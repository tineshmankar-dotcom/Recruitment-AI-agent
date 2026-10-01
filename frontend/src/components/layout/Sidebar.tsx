'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BriefcasePlus,
  UploadCloud,
  Users,
  Award,
  HelpCircle,
  Settings,
  Sparkles,
  Bot
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Create Job', href: '/jobs/create', icon: BriefcasePlus },
  { name: 'Upload Resumes', href: '/resumes/upload', icon: UploadCloud },
  { name: 'Candidate Pool', href: '/candidates', icon: Users },
  { name: 'Shortlist', href: '/shortlist', icon: Award },
  { name: 'Interview Questions', href: '/interview-questions', icon: HelpCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Recruit<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            AI Recruitment Agent
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-xs dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Phase Badge & System status */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50/50 p-3.5 dark:from-slate-900 dark:to-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold">RecruitIQ v1.2</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            JD Structuring & Bulk Resume Parsing Active
          </p>
        </div>
      </div>
    </aside>
  );
}
