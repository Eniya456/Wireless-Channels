import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ChannelAnalysisPage } from './pages/ChannelAnalysisPage';
import { MLAnalysisPage } from './pages/MLAnalysisPage';
import { HistoryPage } from './pages/HistoryPage';
import { ComparePage } from './pages/ComparePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { SystemStatus, Experiment, SingleSimulationResult } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentExperiments, setRecentExperiments] = useState<Experiment[]>([]);
  const [latestSimulation, setLatestSimulation] = useState<SingleSimulationResult | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [status, exps] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.listExperiments({ limit: 10 }).catch(() => []),
      ]);
      if (status) setSystemStatus(status);
      setRecentExperiments(exps);
      return status;
    } catch (err) {
      console.warn('Initialization error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const check = async () => {
      const status = await loadInitialData();
      if (!ignore && status) {
        setSystemStatus(status);
      }
    };

    check();

    // Auto-retry polling every 3 seconds if backend is still spinning up
    const interval = setInterval(async () => {
      if (!systemStatus) {
        await check();
      }
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [loadInitialData, systemStatus]);

  const handleSimulationComplete = (result: SingleSimulationResult) => {
    setLatestSimulation(result);
  };

  const handleSaveExperiment = async () => {
    const exps = await api.listExperiments({ limit: 10 }).catch(() => []);
    setRecentExperiments(exps);
    const status = await api.getSystemStatus().catch(() => null);
    if (status) setSystemStatus(status);
  };

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        systemStatus={systemStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6">
        {activeTab === 'overview' && (
          <OverviewPage
            systemStatus={systemStatus}
            recentExperiments={recentExperiments}
            latestSimulation={latestSimulation}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorPage
            onSimulationComplete={handleSimulationComplete}
            onSaveExperiment={handleSaveExperiment}
          />
        )}

        {activeTab === 'channel-analysis' && <ChannelAnalysisPage />}

        {activeTab === 'ml-analysis' && <MLAnalysisPage />}

        {activeTab === 'history' && <HistoryPage />}

        {activeTab === 'compare' && <ComparePage />}

        {activeTab === 'methodology' && <MethodologyPage />}

        {activeTab === 'settings' && (
          <SettingsPage
            systemStatus={systemStatus}
            onRefreshStatus={loadInitialData}
          />
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            B.Tech Computer Science & Engineering Project &bull;{' '}
            <span className="text-slate-400">
              Wireless Channels Under Fading and Mobility Using ML and Cloud
            </span>
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>FastAPI Backend</span>
            <span>&bull;</span>
            <span>React Vite TypeScript</span>
            <span>&bull;</span>
            <span>Scikit-Learn ML</span>
            <span>&bull;</span>
            <span>Google Cloud Firestore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
