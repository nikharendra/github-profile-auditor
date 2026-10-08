import React from 'react';
import { ShieldCheck, Database, Cpu, Eye, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-sm mb-3">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Legal & Transparency</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">
          Last updated: October 2026. This policy describes how GitHub Profile Auditor handles data.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <Eye className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span>1. Public GitHub Data Only</span>
          </h2>
          <p className="text-sm sm:text-base">
            GitHub Profile Auditor accesses only publicly accessible data exposed by GitHub's official REST API.
            We do not request GitHub OAuth authorization, personal access tokens, private repository access,
            email credentials, or private commit logs. If a repository or profile field is private on GitHub,
            our application cannot and will not access it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <Database className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span>2. Information Retrieved & Processed</span>
          </h2>
          <p className="text-sm sm:text-base mb-2">
            When you enter a public GitHub username for auditing, our backend fetches:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
            <li>Public profile information: Username, display name, bio, public avatar URL, public repo count, follower/following counts, account creation date.</li>
            <li>Public repository metadata: Name, description, primary language, stars, fork status, last pushed date, topics.</li>
            <li>README text of top original repositories: To evaluate project documentation, setup guides, and architectural clarity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span>3. How Analysis & AI Processing Works</span>
          </h2>
          <p className="text-sm sm:text-base mb-3">
            Our system operates with strict separation of responsibilities:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
            <li>
              <strong>Deterministic Analysis:</strong> Factual scores (0–100 across 5 categories) are calculated purely by mathematical formulas running on observable data. AI is never used to fabricate scores.
            </li>
            <li>
              <strong>Gemini AI Interpretation:</strong> Google Gemini receives only a compact, anonymized summary of the deterministic findings and evidence logs. Raw private tokens, secret credentials, and full raw GitHub payloads are never transmitted.
            </li>
            <li>
              <strong>Model Training:</strong> Your public profile data is not used to train generative AI models.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span>4. Data Storage & Statelessness</span>
          </h2>
          <p className="text-sm sm:text-base">
            GitHub Profile Auditor operates statelessly in the standard MVP architecture. We do not maintain a permanent user database, user accounts, tracking cookies, or advertising trackers. Audit calculations are processed in memory and returned directly to the requester.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Third-Party Services</h2>
          <p className="text-sm sm:text-base">
            To provide this service, the application connects to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
            <li><strong>GitHub REST API:</strong> To retrieve public profile and repository data subject to GitHub's Terms of Service.</li>
            <li><strong>Google Gemini API:</strong> To generate recruiter interpretation and prioritized action summaries.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. User Rights & Inquiries</h2>
          <p className="text-sm sm:text-base">
            Because all analyzed data originates from GitHub's public API and is not stored in an internal persistent database, modifying or deleting your public data on GitHub immediately updates what any future audit can observe.
          </p>
        </section>
      </div>
    </article>
  );
};
