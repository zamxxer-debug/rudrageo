import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ConnectivityStatus, SOSIncident } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  connectivity: ConnectivityStatus;
  setConnectivity: (status: ConnectivityStatus) => void;
  toggleOfflineMode: () => void;
  login: (email: string, pass: string) => Promise<void>;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
  recentAlerts: any[];
  clearAlerts: () => void;
  triggerSync: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [role, setRole] = useState<UserRole>('tourist');
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('ONLINE');
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  // Load user profile on mount if token exists
  useEffect(() => {
    if (token) {
      api.getMe()
        .then((userData: User) => {
          setUser(userData);
          setRole(userData.role);
        })
        .catch(() => {
          // Token expired or invalid, clear token
          clearAuthToken();
          setToken(null);
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setConnectivity('ONLINE');
      // Auto flush offline queue
      triggerSync();
    };
    const handleOffline = () => {
      setConnectivity('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // WebSocket for Realtime Emergency Alerts
  useEffect(() => {
    if (connectivity === 'OFFLINE') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/alerts`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('[Rudra WebSocket Alert]', msg);
          setRecentAlerts(prev => [msg, ...prev.slice(0, 9)]);

          // Sound alert for high-priority SOS
          if (msg.type === 'NEW_SOS_INCIDENT') {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch (e) {
              // Web Audio blocked or unsupported
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection not available in current environment:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [connectivity]);

  const triggerSync = async (): Promise<number> => {
    try {
      const res = await api.flushOfflineQueue();
      return res.synced_count || 0;
    } catch (err) {
      console.error('Offline sync failed:', err);
      return 0;
    }
  };

  const login = async (email: string, pass: string) => {
    const data = await api.login(email, pass);
    setAuthToken(data.access_token);
    setToken(data.access_token);
    setRole(data.role);
    const me = await api.getMe();
    setUser(me);
  };

  const switchRoleDemo = async (targetRole: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string; name: string }> = {
      tourist: { email: 'tourist@rudra.gov.in', pass: 'Tourist@123', name: 'Sophie Martin' },
      police: { email: 'police@rudra.gov.in', pass: 'Police@123', name: 'Inspector R. Sundaram' },
      tourism_officer: { email: 'tourism@rudra.gov.in', pass: 'Tourism@123', name: 'Priya Sharma' },
      guardian: { email: 'guardian@rudra.gov.in', pass: 'Guardian@123', name: 'Muthu Kumar' },
      admin: { email: 'admin@rudra.gov.in', pass: 'Admin@123', name: 'Super Admin' }
    };

    try {
      const cred = creds[targetRole];
      const data = await api.login(cred.email, cred.pass);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setRole(targetRole);
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      // Offline / immediate mock fallback
      setRole(targetRole);
      const cred = creds[targetRole];
      setUser({
        id: `mock-${targetRole}`,
        email: cred.email,
        full_name: cred.name,
        role: targetRole,
        is_active: true,
        drishti_id: targetRole === 'tourist' ? 'DRS-IN-7F92A1C4' : undefined,
        nationality: targetRole === 'tourist' ? 'French' : 'Indian',
        is_foreign_tourist: targetRole === 'tourist'
      });
    }
  };

  const toggleOfflineMode = () => {
    setConnectivity(prev => {
      const next = prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      if (next === 'ONLINE') {
        triggerSync();
      }
      return next;
    });
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const clearAlerts = () => setRecentAlerts([]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      isAuthenticated: !!user,
      connectivity,
      setConnectivity,
      toggleOfflineMode,
      login,
      switchRoleDemo,
      logout,
      recentAlerts,
      clearAlerts,
      triggerSync
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
