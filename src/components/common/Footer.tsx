import React from 'react';
import type { ActiveView } from './Header.tsx';
import { Terminal, Shield, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-600 text-sm">
            <Terminal className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span className="font-medium text-slate-800">GitHub Profile Auditor</span>
            <span className="text-slate-400">·</span>
            <span>Deterministic Scoring & AI Interpretation</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="hover:text-slate-900 transition-colors focus:outline-none focus-visible:underline"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="hover:text-slate-900 transition-colors focus:outline-none focus-visible:underline"
            >
              Terms & Conditions
            </button>
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 hover:text-slate-900 transition-colors focus:outline-none focus-visible:underline"
            >
              <span>API Health</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GitHub Profile Auditor. Built for student & early-career developers.</p>
          <p>Analyzes public GitHub data only. No affiliation with GitHub, Inc.</p>
        </div>
      </div>
    </footer>
  );
};
