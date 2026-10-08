import React from 'react';
import { Scale, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-sm mb-3">
          <Scale className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Last updated: October 2026. Please read these terms carefully before using GitHub Profile Auditor.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <span>1. Description of Service</span>
          </h2>
          <p className="text-sm sm:text-base">
            GitHub Profile Auditor is an educational developer career tool designed to help early-career engineers,
            students, and job seekers evaluate how their public GitHub presence presents to technical recruiters.
            The service computes factual scores using open deterministic formulas and provides AI-assisted commentary
            grounded on observable evidence.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <span>2. No Employment or Hiring Guarantee</span>
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-900 text-sm">
            <p className="font-semibold mb-1">Important Employment Disclaimer:</p>
            <p>
              GitHub Profile Auditor provides heuristic analysis and educational guidance only. A high audit score
              does not guarantee job offers, interview invitations, or employment. Conversely, lower scores do not
              mean a developer lacks technical competence. Different companies, hiring managers, and recruiters evaluate
              candidates according to proprietary, varying criteria.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Acceptable Use</h2>
          <p className="text-sm sm:text-base mb-2">
            By accessing this service, you agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
            <li>Abuse, overwhelm, or attempt to bypass GitHub or Gemini rate-limiting mechanisms.</li>
            <li>Use the service to harass, scrape, dox, or mass-profile developers without legitimate reason.</li>
            <li>Misrepresent the generated output as formal endorsements from GitHub, Inc. or specific corporate recruiters.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Reliance on Third-Party APIs</h2>
          <p className="text-sm sm:text-base">
            The service depends upon the availability, rate limits, and accuracy of external third-party services,
            specifically GitHub's REST API and Google Gemini API. We are not liable for transient downtime, rate-limiting,
            or service disruptions originating from these upstream providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Disclaimer of Warranties</h2>
          <p className="text-sm sm:text-base">
            The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind,
            express or implied. We do not warrant that the analysis will be uninterrupted, error-free, or meet every
            individual career expectation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Modifications to Service & Terms</h2>
          <p className="text-sm sm:text-base">
            We reserve the right to modify or discontinue features, formulas, or these Terms at any time. Continued use of the service constitutes acceptance of the current terms.
          </p>
        </section>
      </div>
    </article>
  );
};
