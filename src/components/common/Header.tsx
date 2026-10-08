import React from 'react';
import { ShieldCheck, Activity, FileText } from 'lucide-react';

export type ActiveView = 'home' | 'privacy' | 'terms';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  apiHealthy: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate, apiHealthy }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 rounded-sm"
          aria-label="GitHub Profile Auditor - Return to homepage"
        >
          <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-slate-100" aria-hidden="true" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-base tracking-tight block">
              GitHub Profile Auditor
            </span>
            <span className="text-xs text-slate-500 font-medium block">
              Recruiter-Readiness Engine
            </span>
          </div>
        </button>

        {/* Navigation & System Status */}
        <nav aria-label="Main Navigation" className="flex items-center space-x-1 sm:space-x-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === 'home'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Auditor
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === 'privacy'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === 'terms'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Terms
          </button>

          {/* Backend Status indicator */}
          <div className="hidden sm:flex items-center pl-3 border-l border-slate-200">
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${
                apiHealthy === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : apiHealthy === false
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Backend Express API status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiHealthy === true ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>{apiHealthy === true ? 'API Connected' : 'Checking API...'}</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
