import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { ConnectivityStatus } from '../../types';
import { Shield, Wifi, WifiOff, RefreshCw, UserCheck, AlertTriangle, Radio, LogOut, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenDigitalId?: () => void;
  onOpenSOS?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDigitalId, onOpenSOS }) => {
  const { user, role, connectivity, toggleOfflineMode, triggerSync, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await triggerSync();
    setTimeout(() => setSyncing(false), 600);
  };

  const getConnectivityBadge = (status: ConnectivityStatus) => {
    switch (status) {
      case 'ONLINE':
        return (
          <button
            onClick={toggleOfflineMode}
            title="Click to simulate going offline"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span>{t('online')}</span>
          </button>
        );
      case 'LIMITED':
        return (
          <button
            onClick={toggleOfflineMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <Radio className="w-3.5 h-3.5" />
            <span>{t('limited')}</span>
          </button>
        );
      case 'OFFLINE':
        return (
          <button
            onClick={toggleOfflineMode}
            title="Click to simulate network restore"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all animate-pulse cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t('offline')}</span>
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Platform Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg text-white tracking-wide">{t('brand_name')}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                {t('digital_id')}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">{t('brand_subtitle')}</p>
          </div>
        </div>

        {/* Connectivity, Language, & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Multilingual Selector */}
          <div className="flex items-center bg-[#070B14] border border-slate-700/80 rounded-xl p-0.5 h-8">
            <button
              onClick={() => setLanguage('en')}
              className={`h-7 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`h-7 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                language === 'hi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`h-7 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                language === 'ta' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {getConnectivityBadge(connectivity)}

          <button
            onClick={handleSync}
            disabled={syncing || connectivity === 'OFFLINE'}
            title={t('sync_queue')}
            className="h-8 w-8 text-slate-400 hover:text-white rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/70 flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Digital ID trigger if tourist */}
          {role === 'tourist' && user?.drishti_id && onOpenDigitalId && (
            <button
              onClick={onOpenDigitalId}
              className="h-8 flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-850 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-300 font-bold text-[11px]">{user.drishti_id}</span>
            </button>
          )}

          {/* Quick SOS Trigger Button if tourist */}
          {role === 'tourist' && onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="h-8 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow-sm border border-red-500/30 flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="tracking-wide">{t('sos')}</span>
            </button>
          )}

          {/* User Account & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-700/70 h-8 px-2.5 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-slate-950 uppercase shadow-sm">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-[11px] font-bold text-white truncate max-w-[100px] leading-none">{user.full_name}</div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out and return to Login screen"
                className="h-8 px-2.5 rounded-lg bg-slate-850 border border-slate-700/70 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-medium">{t('logout')}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
