import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FolderGit2,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Server,
  Loader2,
  ExternalLink,
  GitFork,
  Star,
  Clock,
  Sparkles,
  FileText,
  RotateCcw,
  Check,
  X,
  Info,
} from "lucide-react";
import {
  auditGitHubProfile,
  type AuditResponse,
} from "../../services/auditApi.ts";

import type { NormalizedAuditResponse } from "../../../server/types/normalized.ts";

interface LandingViewProps {
  apiHealthData: {
    status: string;
    version: string;
    phase: string;
    uptime?: number;
  } | null;
}

const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const LandingView: React.FC<LandingViewProps> = ({ apiHealthData }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [auditData, setAuditData] = useState<NormalizedAuditResponse | null>(
    null,
  );
  const [error, setError] = useState<{
    message: string;
    code?: string;
    statusCode?: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();

    setError(null);
    setAuditData(null);

    if (!trimmed) {
      setError({
        message: "Please enter a GitHub username.",
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (!GITHUB_USERNAME_REGEX.test(trimmed)) {
      setError({
        message:
          "Invalid GitHub username format. Usernames must be 1-39 characters and contain only alphanumeric characters or single hyphens.",
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
      return;
    }

    setLoading(true);
    setLoadingStatus("Connecting to GitHub REST API...");

    try {
      setLoadingStatus("Retrieving public profile and repositories...");

      const payload = await auditGitHubProfile(trimmed);

      setAuditData(payload as unknown as NormalizedAuditResponse);
    } catch (err: unknown) {
      const apiError = err as {
        message?: string;
        code?: string;
        status?: number;
      };

      setError({
        message:
          apiError.message ||
          "Network connection failed while reaching server.",
        code: apiError.code || "EXTERNAL_SERVICE_ERROR",
        statusCode: apiError.status || 502,
      });
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleReset = () => {
    setAuditData(null);
    setError(null);
    setUsername("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero / Purpose Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold tracking-wide uppercase px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md mb-6">
          <span>Recruiter-Readiness Auditor</span>
          <span className="text-slate-400">·</span>
          <span>Phase 2: Data Ingestion & Normalization</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
          What would a recruiter notice about your GitHub in the first 30
          seconds?
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Built for students, CS/MCA graduates, and early-career developers.
          Stop guessing what engineering hiring managers see. Get deterministic
          evidence and actionable, prioritized improvements.
        </p>
      </div>

      {/* Input Section */}
      {!auditData && (
        <div className="max-w-2xl mx-auto mb-16">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs"
            noValidate
          >
            <label
              htmlFor="github-username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
            >
              GitHub Public Username
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="github-username"
                  type="text"
                  value={username}
                  disabled={loading}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. torvalds or your-handle"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-colors disabled:opacity-50"
                  autoComplete="off"
                  spellCheck="false"
                  aria-describedby="input-hint"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 mr-2 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Ingesting Data...</span>
                  </>
                ) : (
                  <>
                    <span>Ingest & Normalize</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            <p id="input-hint" className="mt-2 text-xs text-slate-500">
              Live GitHub REST API queries. No OAuth or login required.
            </p>

            {/* Loading Indicator */}
            {loading && (
              <div
                className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-700 flex items-center space-x-2.5"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="w-4 h-4 text-slate-600 animate-spin shrink-0"
                  aria-hidden="true"
                />
                <span>{loadingStatus}</span>
              </div>
            )}

            {/* Error Feedback */}
            {error && (
              <div
                className="mt-4 p-3.5 rounded-md border text-xs sm:text-sm flex items-start space-x-2.5 bg-red-50 border-red-200 text-red-900"
                role="alert"
              >
                <AlertCircle
                  className="w-4 h-4 text-red-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {error.code === "USER_NOT_FOUND"
                        ? "Profile Not Found"
                        : error.code === "GITHUB_RATE_LIMITED"
                          ? "GitHub Rate Limit Reached"
                          : error.code === "VALIDATION_ERROR"
                            ? "Validation Error"
                            : "Ingestion Error"}
                    </span>
                    {error.statusCode && (
                      <span className="font-mono text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                        HTTP {error.statusCode}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-red-800">{error.message}</p>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* PHASE 2: Normalized Data Inspection View */}
      {auditData && (
        <div className="space-y-6 mb-16">
          {/* Phase Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                <Check className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-emerald-950">
                  Phase 4 Active: Deterministic Scoring + Gemini Recruiter
                  Interpretation
                </h2>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Factual scores are mathematically calculated; Gemini
                  interprets evidence into qualitative recruiter advice and
                  prioritized fixes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Test Another User</span>
            </button>
          </div>

          {/* OVERALL DETERMINISTIC AUDIT SCORE CARD */}
          {auditData.audit && (
            <div className="bg-white border-2 border-slate-900 rounded-lg p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded mb-2">
                    <span>Deterministic Mathematical Score</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Recruiter-Readiness Profile Score
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
                    Calculated from 5 frozen weighted categories: Profile (20%)
                    + Projects (30%) + Documentation (20%) + Activity (15%) +
                    Technical Signals (15%).
                  </p>
                </div>
                <div className="flex items-center space-x-4 shrink-0 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-center">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900">
                      {auditData.audit.overallScore}
                    </span>
                    <span className="text-slate-400 text-lg font-bold">
                      /100
                    </span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-1">
                      Overall Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Five Category Scores Grid */}
              <div className="mt-6 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Category Score Breakdown & Itemized Evidence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(auditData.audit.categories).map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Weight: {Math.round(cat.weight * 100)}%
                          </span>
                          <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                            +{cat.weightedScore.toFixed(1)} pts
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-2">
                          <h5 className="text-base font-bold text-slate-900">
                            {cat.label}
                          </h5>
                          <span className="text-lg font-extrabold text-slate-900">
                            {cat.score}
                            <span className="text-xs text-slate-500 font-normal">
                              /100
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                          <div
                            className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>

                        {/* Sub-component Breakdown */}
                        <div className="space-y-1.5 mb-4 border-t border-slate-200 pt-3">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Component Points
                          </span>
                          {cat.breakdown.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-600">
                                {item.component}
                              </span>
                              <span className="font-mono font-medium text-slate-800">
                                {item.earned}/{item.max}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Itemized Evidence */}
                        <div className="border-t border-slate-200 pt-3">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                            Observed Evidence
                          </span>
                          <ul className="space-y-1.5">
                            {cat.evidence.map((ev) => (
                              <li
                                key={ev.id}
                                className="text-xs flex items-start space-x-2 text-slate-700"
                              >
                                {ev.type === "positive" ? (
                                  <Check
                                    className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : ev.type === "warning" ? (
                                  <AlertCircle
                                    className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Info
                                    className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{ev.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: GEMINI RECRUITER INTERPRETATION SECTION */}
          {auditData.ai && (
            <div className="space-y-6">
              {auditData.ai.available ? (
                <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Sparkles
                        className="w-5 h-5 text-indigo-600"
                        aria-hidden="true"
                      />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        Recruiter Interpretation & Action Plan
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Interpreted by {auditData.ai.modelUsed}
                    </span>
                  </div>

                  {/* Recruiter First Impression (30 Seconds) */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                      Recruiter First Impression (First 30 Seconds)
                    </span>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {auditData.ai.recruiterView}
                    </p>
                  </div>

                  {/* Balanced Executive Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Executive Profile Summary
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {auditData.ai.summary}
                    </p>
                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-2">
                        Observed Strengths
                      </span>
                      <ul className="space-y-2">
                        {auditData.ai.strengths.map((str, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-800 flex items-start space-x-2"
                          >
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-2">
                        Key Improvement Areas
                      </span>
                      <ul className="space-y-2">
                        {auditData.ai.weaknesses.map((weak, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-800 flex items-start space-x-2"
                          >
                            <AlertCircle
                              className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Prioritized Action Plan ("Fix These First") */}
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
                      Fix These First — Prioritized Improvement Plan
                    </h4>
                    <div className="space-y-3">
                      {auditData.ai.priorities.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900">
                                {item.title}
                              </h5>
                            </div>
                            <span className="text-[11px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                              Impact: {item.impact}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-2">
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="font-semibold text-slate-700 block mb-0.5">
                                Why it matters:
                              </span>
                              <span className="text-slate-600">{item.why}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                              <span className="font-semibold text-slate-700 block mb-0.5">
                                Action to take:
                              </span>
                              <span className="text-slate-600">
                                {item.action}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg flex items-start space-x-3 text-slate-700 text-xs">
                  <Info
                    className="w-4 h-4 text-slate-500 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      Recruiter Interpretation Temporarily Unavailable
                    </span>
                    <p className="text-slate-600">{auditData.ai.message}</p>
                    <p className="text-slate-500 mt-1">
                      Your complete deterministic GitHub audit and itemized
                      evidence are fully available above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              {auditData.profile.avatarUrl ? (
                <img
                  src={auditData.profile.avatarUrl}
                  alt={`${auditData.profile.username}'s GitHub avatar`}
                  className="w-16 h-16 rounded-full border border-slate-200 shrink-0 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {auditData.profile.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">
                    {auditData.profile.name}
                  </h3>
                  <a
                    href={auditData.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-mono text-slate-500 hover:text-slate-900"
                  >
                    <span>@{auditData.profile.username}</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
                {auditData.profile.bio ? (
                  <p className="mt-1 text-sm text-slate-700">
                    {auditData.profile.bio}
                  </p>
                ) : (
                  <p className="mt-1 text-xs italic text-slate-400">
                    No public bio specified.
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {auditData.profile.company && (
                    <span>🏢 {auditData.profile.company}</span>
                  )}
                  {auditData.profile.location && (
                    <span>📍 {auditData.profile.location}</span>
                  )}
                  {auditData.profile.blogUrl && (
                    <a
                      href={auditData.profile.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600"
                    >
                      🔗 {auditData.profile.blogUrl}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-500 block">
                  Public Repos
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {auditData.profile.publicRepoCount}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-500 block">Followers</span>
                <span className="text-lg font-bold text-slate-900">
                  {auditData.profile.followersCount.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-500 block">
                  Account Age
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {Math.floor(auditData.profile.accountAgeDays / 365)} yrs (
                  {auditData.profile.accountAgeDays}d)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-xs text-slate-500 block">
                  Cache Status
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-1">
                  {auditData.metadata.cached
                    ? "⚡ In-Memory Hit"
                    : "Fresh GitHub API"}
                </span>
              </div>
            </div>
          </div>

          {/* Ingestion & Capping Metadata Card */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 text-xs text-slate-700">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>Bounded API Ingestion Telemetry</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">
                  Repositories Fetched:
                </span>
                <span className="font-semibold text-slate-900">
                  {auditData.metadata.repositoriesFetched} (max 30 per page)
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Original Projects:</span>
                <span className="font-semibold text-slate-900">
                  {auditData.metadata.originalRepositoriesCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Forks Detected:</span>
                <span className="font-semibold text-slate-900">
                  {auditData.metadata.forkedRepositoriesCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">
                  Deep README Inspected:
                </span>
                <span className="font-semibold text-emerald-800">
                  {auditData.metadata.repositoriesInspected} (strictly capped at
                  4)
                </span>
              </div>
            </div>
          </div>

          {/* Normalized Repositories List */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Normalized Repositories ({auditData.repositories.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Candidate ranking deterministically selected top{" "}
                  {auditData.metadata.repositoriesInspected} repositories for
                  deep documentation inspection.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {auditData.repositories.map((repo) => (
                <div
                  key={repo.name}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center space-x-1"
                        >
                          <span>{repo.name}</span>
                          <ExternalLink
                            className="w-3 h-3 text-slate-400"
                            aria-hidden="true"
                          />
                        </a>
                        {repo.isFork && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Fork
                          </span>
                        )}
                        {repo.isArchived && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Archived
                          </span>
                        )}
                        {repo.inspectedForReadme && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ★ README Inspected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {repo.description || (
                          <span className="italic text-slate-400">
                            No repository description provided
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 shrink-0">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {repo.language}
                      </span>
                      <span className="inline-flex items-center space-x-1">
                        <Star
                          className="w-3.5 h-3.5 text-amber-500"
                          aria-hidden="true"
                        />
                        <span>{repo.stars}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1">
                        <GitFork
                          className="w-3.5 h-3.5 text-slate-400"
                          aria-hidden="true"
                        />
                        <span>{repo.forks}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{repo.daysSinceLastPush}d ago</span>
                      </span>
                    </div>
                  </div>

                  {/* README Signals if inspected */}
                  {repo.readme && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800 flex items-center space-x-1">
                          <FileText
                            className="w-3.5 h-3.5 text-slate-600"
                            aria-hidden="true"
                          />
                          <span>
                            README Structural Signals (
                            {repo.readme.rawLength.toLocaleString()} bytes)
                          </span>
                        </span>
                        <span
                          className={`font-medium px-2 py-0.5 rounded text-[10px] ${
                            repo.readme.hasReadme
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {repo.readme.hasReadme
                            ? "README Found"
                            : "README Missing"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          {repo.readme.hasSetupInstructions ? (
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="w-3.5 h-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={
                              repo.readme.hasSetupInstructions
                                ? "text-slate-800 font-medium"
                                : "text-slate-500"
                            }
                          >
                            Setup{" "}
                            {repo.readme.hasSetupInstructions
                              ? "Present"
                              : "Missing"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {repo.readme.hasUsageExamples ? (
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="w-3.5 h-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={
                              repo.readme.hasUsageExamples
                                ? "text-slate-800 font-medium"
                                : "text-slate-500"
                            }
                          >
                            Usage{" "}
                            {repo.readme.hasUsageExamples
                              ? "Present"
                              : "Missing"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {repo.readme.hasScreenshotsOrDemo ? (
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="w-3.5 h-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={
                              repo.readme.hasScreenshotsOrDemo
                                ? "text-slate-800 font-medium"
                                : "text-slate-500"
                            }
                          >
                            Demo / Screenshots{" "}
                            {repo.readme.hasScreenshotsOrDemo
                              ? "Present"
                              : "Missing"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {repo.readme.hasLicenseSection ? (
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="w-3.5 h-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={
                              repo.readme.hasLicenseSection
                                ? "text-slate-800 font-medium"
                                : "text-slate-500"
                            }
                          >
                            License{" "}
                            {repo.readme.hasLicenseSection
                              ? "Present"
                              : "Missing"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Core Architectural Pillars */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            How Deterministic Auditing Works
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Factual scores are mathematically calculated from real observable
            signals, not arbitrary AI guesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-3 font-semibold text-xs">
              01
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Real GitHub Data Only
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We query the public GitHub REST API for profile data, repository
              metadata, topics, commit frequency, and documentation files.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-3 font-semibold text-xs">
              02
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Deterministic Scoring Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              5 transparent sub-scores (0–100) are computed mathematically in
              Phase 3. Every single score point is supported by concrete,
              itemized evidence.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-3 font-semibold text-xs">
              03
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Recruiter-Perspective AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In Phase 4, Gemini analyzes the verified evidence to generate
              &quot;Fix These First&quot; action items and summarize the
              immediate 30-second recruiter impression.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Breakdown & Weighting */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 mb-16">
        <div className="max-w-2xl mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Frozen Scoring Categories (100% Total)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Formulas are standardized to prevent vanity metrics (e.g. followers
            or commit streaks) from distorting engineering ability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weight: 20%
              </span>
              <FileCode className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Profile Presentation
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Bio clarity, custom name, portfolio/contact links, and
              professional avatar presence.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weight: 30%
              </span>
              <FolderGit2
                className="w-4 h-4 text-slate-500"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project Quality & Presentation
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Original vs forked ratio, repository descriptions, live demo
              links, and topic categorization.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weight: 20%
              </span>
              <BookOpen className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Documentation Signals
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              README availability across top original repos, setup instructions,
              usage examples, and licenses.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weight: 15%
              </span>
              <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Activity & Consistency
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Recency of pushes, active development signals, and sustained
              project maintenance.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weight: 15%
              </span>
              <Layers className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Technical Signals & Stack Focus
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Primary language cohesion, project specialization versus scattered
              toy repos, and technological clarity.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Health Diagnostics Card */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">
              System Foundation Diagnostics
            </h2>
          </div>
          <span className="text-xs font-mono bg-white px-2 py-0.5 rounded-sm border border-slate-200 text-slate-600">
            GET /api/health
          </span>
        </div>

        {apiHealthData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-md border border-slate-200">
              <span className="text-slate-500 block">Status:</span>
              <span className="font-semibold text-emerald-700 uppercase">
                {apiHealthData.status}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-slate-200">
              <span className="text-slate-500 block">Service:</span>
              <span className="font-mono text-slate-800">auditor-api</span>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-slate-200">
              <span className="text-slate-500 block">Version:</span>
              <span className="font-mono text-slate-800">
                {apiHealthData.version}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-md border border-slate-200">
              <span className="text-slate-500 block">Active Phase:</span>
              <span className="font-medium text-slate-800">
                Phase 2: Ingestion & Normalization
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Checking backend status...</p>
        )}
      </div>
    </div>
  );
};
