import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Compass,
  Radio,
  Users,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Database,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

interface PersonaInfo {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  demoEmail: string;
  demoPass: string;
  demoName: string;
  features: string[];
}

const PERSONAS: PersonaInfo[] = [
  {
    role: 'tourist',
    title: 'Tourist & Explorer',
    badge: 'Visitor',
    badgeColor: 'from-amber-500 to-emerald-500',
    icon: Compass,
    description: 'Travel safely with digital Drishti ID, real-time geofence alerts & 1-tap SOS.',
    demoEmail: 'tourist@rudra.gov.in',
    demoPass: 'Tourist@123',
    demoName: 'Sophie Martin',
    features: ['Offline QR Identity', 'AI Safety Advisory', 'Hazard Geo-Reporting', 'Emergency SOS']
  },
  {
    role: 'police',
    title: 'Police HQ / Command Center',
    badge: 'Law Enforcement',
    badgeColor: 'from-blue-600 to-cyan-500',
    icon: ShieldAlert,
    description: 'Real-time telemetry, tactical situational map, live incident triage & dispatch.',
    demoEmail: 'police@rudra.gov.in',
    demoPass: 'Police@123',
    demoName: 'Inspector R. Sundaram',
    features: ['Tactical Ops Map', 'Instant Unit Dispatch', 'Hazard Verification', 'Incident Timeline']
  },
  {
    role: 'guardian',
    title: 'Community Guardian',
    badge: 'First Responder',
    badgeColor: 'from-emerald-500 to-teal-400',
    icon: Users,
    description: 'Local verified volunteer network responding to proximity distress calls.',
    demoEmail: 'guardian@rudra.gov.in',
    demoPass: 'Guardian@123',
    demoName: 'Muthu Kumar',
    features: ['Proximity Distress Radar', 'Sector Rapid Response', 'Direct Navigation', 'Rescue Badges']
  },
  {
    role: 'tourism_officer',
    title: 'Tourism Officer',
    badge: 'Administration',
    badgeColor: 'from-purple-500 to-indigo-500',
    icon: Building2,
    description: 'Destination carrying capacity, e-pass verification & zone footfall analytics.',
    demoEmail: 'tourism@rudra.gov.in',
    demoPass: 'Tourism@123',
    demoName: 'Priya Sharma',
    features: ['Visitor Footfall Heatmap', 'Digital ID QR Scanner', 'Zone Carrying Limits', 'Safe Corridors']
  },
  {
    role: 'admin',
    title: 'System Administrator',
    badge: 'Governance',
    badgeColor: 'from-red-500 to-orange-500',
    icon: Lock,
    description: 'Governance, cryptographic Merkle audit logs & platform infrastructure.',
    demoEmail: 'admin@rudra.gov.in',
    demoPass: 'Admin@123',
    demoName: 'Super Admin',
    features: ['Blockchain Audit Ledger', 'User Access Governance', 'Risk Zone Config', 'Supabase Sync']
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, switchRoleDemo } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('tourist');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('tourist@rudra.gov.in');
  const [password, setPassword] = useState('Tourist@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNationality, setRegNationality] = useState('Indian');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regDestination, setRegDestination] = useState('Nilgiris - Ooty');

  const currentPersona = PERSONAS.find(p => p.role === selectedRole) || PERSONAS[0];

  const handleSelectRole = (p: PersonaInfo) => {
    setSelectedRole(p.role);
    setEmail(p.demoEmail);
    setPassword(p.demoPass);
    setError(null);
  };

  const handleQuickDemoLogin = async (roleToLogin: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await switchRoleDemo(roleToLogin);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (rememberSession) {
        sessionStorage.removeItem('rudra_session_only');
      } else {
        sessionStorage.setItem('rudra_session_only', 'true');
      }
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Verify credentials or use 1-Click Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { api, setAuthToken } = await import('../../services/api');
      const payload: any = {
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        phone: regPhone || undefined,
        role: selectedRole
      };

      if (selectedRole === 'tourist') {
        payload.nationality = regNationality;
        payload.blood_group = regBloodGroup;
        payload.destination_name = regDestination;
        payload.emergency_contact_name = regEmergencyName;
        payload.emergency_contact_phone = regEmergencyPhone;
        payload.passport_number = regPassport || undefined;
        payload.location_sharing_consent = true;
      }

      const res = await api.register(payload);
      setAuthToken(res.access_token);
      setSuccessMessage('Account created successfully! Logging you into the platform...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Try demo login or check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-white tracking-wider">RUDRA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  DRISHTI PLATFORM
                </span>
              </div>
              <p className="text-xs text-slate-400">Nilgiris District Tourism & Safety Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 hidden sm:flex">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Ready</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Merkle Blockchain Ledger</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center z-10 my-4">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Multi-Persona Safety Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
            Integrated Emergency Response & Identity Portal
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Select your functional role or use 1-Click Instant Demo Access to experience the platform.
          </p>
        </div>

        {/* Persona Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = selectedRole === persona.role;
            return (
              <button
                key={persona.role}
                onClick={() => handleSelectRole(persona)}
                className={`p-4 rounded-2xl text-left border transition-all relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-red-500/80 shadow-xl shadow-red-950/40 ring-1 ring-red-500/50 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {persona.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-white mb-1">{persona.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{persona.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 text-[10px] truncate">{persona.demoName}</span>
                  <span className={`font-bold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                    {isSelected ? 'Active' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Split Auth Section: Active Persona Details & Login Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Left Column: Selected Persona Capability Card */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-8 pb-6 lg:pb-0">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg">
                  {React.createElement(currentPersona.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                    Active Persona
                  </span>
                  <h2 className="font-heading font-black text-xl text-white">{currentPersona.title}</h2>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-5">
                {currentPersona.description}
              </p>

              <div className="space-y-2 mb-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dedicated Capabilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPersona.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant 1-Click Access Pill */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900 to-amber-950/20 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Instant Evaluator Mode
                </span>
                <span className="text-[10px] font-mono text-slate-400">{currentPersona.demoEmail}</span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3">
                Bypass password typing and enter the {currentPersona.title} dashboard immediately with pre-configured seed data.
              </p>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(currentPersona.role)}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Launch as {currentPersona.demoName} (1-Click)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Standard Form (Sign In / Register) */}
          <div className="lg:col-span-7 lg:pl-4">
            {/* Tabs: Login vs Register */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(null); }}
                  className={`text-sm font-heading font-bold pb-2 transition-all relative ${
                    activeTab === 'login'
                      ? 'text-white border-b-2 border-red-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In with Credentials
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(null); }}
                  className={`text-sm font-heading font-bold pb-2 transition-all relative ${
                    activeTab === 'register'
                      ? 'text-white border-b-2 border-red-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create New Account
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
                Target Role: <strong className="text-amber-400 uppercase">{selectedRole}</strong>
              </span>
            </div>

            {/* Error or Success Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Official / Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. officer@rudra.gov.in"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(currentPersona.demoEmail);
                        setPassword(currentPersona.demoPass);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Prefill Demo Credentials
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter security password"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-0"
                    />
                    <span>Remember authenticated session</span>
                  </label>
                  <span className="text-slate-500">JWT 24h expiration</span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <span>Sign In to {currentPersona.title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="e.g. john@domain.com"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Contact Phone</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Create Password *</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Role-Specific Tourist Fields */}
                {selectedRole === 'tourist' && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Drishti Digital Identity & Safety Information</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nationality</label>
                        <select
                          value={regNationality}
                          onChange={(e) => setRegNationality(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Indian">Indian</option>
                          <option value="French">French</option>
                          <option value="British">British</option>
                          <option value="American">American</option>
                          <option value="German">German</option>
                          <option value="Australian">Australian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Blood Group</label>
                        <select
                          value={regBloodGroup}
                          onChange={(e) => setRegBloodGroup(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Destination</label>
                        <input
                          type="text"
                          value={regDestination}
                          onChange={(e) => setRegDestination(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={regEmergencyName}
                          onChange={(e) => setRegEmergencyName(e.target.value)}
                          placeholder="e.g. Next of Kin"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder="+91 9988776655"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating Identity...' : `Register & Issue Digital ID as ${currentPersona.title}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Rudra National Safety Network • State Operations Hub (Nilgiris)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>Leaflet Tactical Geo-Engine</span>
            <span>•</span>
            <span>Supabase Cloud Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
