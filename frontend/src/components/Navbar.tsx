import React from 'react';
import {
  Activity,
  Radio,
  Cpu,
  History,
  GitCompare,
  BookOpen,
  Settings,
  Layers,
  Database,
  Cloud,
} from 'lucide-react';
import { SystemStatus } from '../types';

export type TabId =
  | 'overview'
  | 'simulator'
  | 'channel-analysis'
  | 'ml-analysis'
  | 'history'
  | 'compare'
  | 'methodology'
  | 'settings';

interface Props {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  systemStatus: SystemStatus | null;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  systemStatus,
}) => {
  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: Activity },
    { id: 'simulator' as TabId, label: 'Wireless Simulator', icon: Radio },
    { id: 'channel-analysis' as TabId, label: 'Channel Analysis', icon: Layers },
    { id: 'ml-analysis' as TabId, label: 'ML Analysis', icon: Cpu },
    { id: 'history' as TabId, label: 'Experiment History', icon: History },
    { id: 'compare' as TabId, label: 'Compare', icon: GitCompare },
    { id: 'methodology' as TabId, label: 'Methodology', icon: BookOpen },
    { id: 'settings' as TabId, label: 'Settings', icon: Settings },
  ];

  const isCloud = systemStatus?.storage?.is_cloud || false;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
              WirelessSim <span className="font-mono text-xs font-normal text-blue-400">v1.0</span>
            </h1>
            <p className="hidden text-[11px] text-slate-400 md:block">
              Fading, Mobility & ML Performance Analysis
            </p>
          </div>
        </div>

        {/* System Health / Cloud Mode Pill */}
        <div className="flex items-center gap-2">
          {systemStatus ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Backend:</span> Online
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-rose-900/60 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Connecting...
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono ${
              isCloud
                ? 'border-indigo-800 bg-indigo-950/40 text-indigo-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
          >
            {isCloud ? <Cloud className="h-3.5 w-3.5 text-indigo-400" /> : <Database className="h-3.5 w-3.5 text-slate-400" />}
            <span>{isCloud ? 'Cloud: Firestore' : 'Storage: Local'}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6">
        <div className="flex space-x-1 border-t border-slate-900/60 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
