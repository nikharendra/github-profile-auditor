
import React, { useState, useEffect } from 'react';
import { Header, type ActiveView } from './components/common/Header.tsx';
import { Footer } from './components/common/Footer.tsx';
import { LandingView } from './components/landing/LandingView.tsx';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy.tsx';
import { TermsOfService } from './components/legal/TermsOfService.tsx';

interface HealthData {
  status: string;
  service: string;
  version: string;
  phase: string;
  uptime?: number;
}

export default function App(): React.ReactElement {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await fetch('/api/health');

        if (res.ok) {
          const data = (await res.json()) as HealthData;

          if (isMounted) {
            setHealthData(data);
            setApiHealthy(true);
          }
        } else {
          if (isMounted) {
            setApiHealthy(false);
          }
        }
      } catch {
        if (isMounted) {
          setApiHealthy(false);
        }
      }
    }

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-slate-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:shadow-md text-sm font-medium"
      >
        Skip to main content
      </a>

      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        apiHealthy={apiHealthy}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        {activeView === 'home' && (
          <LandingView apiHealthData={healthData} />
        )}

        {activeView === 'privacy' && <PrivacyPolicy />}

        {activeView === 'terms' && <TermsOfService />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
