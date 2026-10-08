
import type { AuditResponse } from "../../services/auditApi";

interface AuditResultsViewProps {
  data: AuditResponse;
  onAnalyzeAnother: () => void;
}

export function AuditResultsView({
  data,
  onAnalyzeAnother,
}: AuditResultsViewProps): React.ReactElement {
  const { profile, audit, summaryStats, ai } = data;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            GitHub Profile Audit
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {profile.name || profile.username}
          </h1>

          <p className="mt-1 text-slate-600">@{profile.username}</p>
        </div>

        <button
          type="button"
          onClick={onAnalyzeAnother}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Analyze another profile
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarUrl}
              alt={`${profile.username} GitHub avatar`}
              className="h-16 w-16 rounded-full"
            />

            <div>
              <h2 className="font-semibold text-slate-950">
                {profile.name || profile.username}
              </h2>

              <p className="text-sm text-slate-500">
                @{profile.username}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {profile.bio}
            </p>
          )}

          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block text-sm font-medium text-slate-900 underline underline-offset-4"
          >
            View GitHub profile
          </a>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-slate-500">
            Overall assessment
          </p>

          <div className="mt-2 flex items-end gap-2">
            <span className="text-6xl font-bold tracking-tight text-slate-950">
              {audit.overallScore}
            </span>

            <span className="mb-2 text-slate-500">/ 100</span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            This score is calculated by the deterministic analysis engine
            using evidence from the public GitHub profile and repositories.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Category scores
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Object.values(audit.categories).map((category) => (
            <div key={category.label}>
              <p className="text-sm font-medium text-slate-700">
                {category.label}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-950">
                {category.score}
              </p>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-slate-900"
                  style={{ width: `${category.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {summaryStats && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Repository snapshot
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Public repositories" value={summaryStats.totalRepos} />
            <Stat label="Original repositories" value={summaryStats.originalRepos} />
            <Stat label="Forked repositories" value={summaryStats.forkedRepos} />
            <Stat label="Repositories with README" value={summaryStats.reposWithReadme} />
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          AI interpretation
        </h2>

        {ai.available ? (
          <p className="mt-3 text-sm text-slate-600">
            AI interpretation is available.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            AI interpretation is currently unavailable. The deterministic
            audit is still complete and can be used independently.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
