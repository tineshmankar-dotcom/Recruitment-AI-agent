'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  FileCheck,
  Server,
  ShieldCheck,
  CheckCircle2,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [dbType, setDbType] = useState('postgresql');
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [maxUploadMb, setMaxUploadMb] = useState(15);
  const [vectorDb, setVectorDb] = useState('pgvector');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-indigo-600" />
            Platform & Engine Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure backend connections, document parsing limits, database endpoints, and vector search settings.
          </p>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Configuration settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* API & Backend Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600" />
            FastAPI Backend Engine
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Backend API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default local address is http://localhost:8000
            </span>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            Database & Vector Engine
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Relational Database
              </label>
              <select
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="postgresql">PostgreSQL (Production / Staging)</option>
                <option value="sqlite">SQLite (Local dev default)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vector Database Provider
              </label>
              <select
                value={vectorDb}
                onChange={(e) => setVectorDb(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="pgvector">pgvector (PostgreSQL extension)</option>
                <option value="faiss">FAISS (Facebook AI Similarity Search)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Ingestion & Resume Parsing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-indigo-600" />
            Resume Processing & Duplicate Guard
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  SHA-256 Duplicate Document Detection
                </span>
                <span className="text-[11px] text-slate-400">
                  Automatically flags identical resume uploads within the same job pipeline.
                </span>
              </div>
              <input
                type="checkbox"
                checked={duplicateDetection}
                onChange={(e) => setDuplicateDetection(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max File Size (MB)
              </label>
              <input
                type="number"
                value={maxUploadMb}
                onChange={(e) => setMaxUploadMb(Number(e.target.value))}
                className="w-48 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all"
          >
            <Save className="h-4 w-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
