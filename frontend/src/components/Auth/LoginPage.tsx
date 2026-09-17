import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { api, setAuthToken } from '../../services/api';
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
  ShieldAlert,
  Server,
  Cloud,
  Zap,
  Globe2,
  HelpCircle,
  Smartphone,
  ChevronRight,
  MapPin,
  HeartHandshake,
  ShieldCheck,
  Mountain
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
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    icon: Compass,
    description: 'Explore verified safe corridors with digital Drishti ID, real-time geofence alerts & 1-tap SOS.',
    demoEmail: 'tourist@rudra.gov.in',
    demoPass: 'Tourist@123',
    demoName: 'Sophie Martin',
    features: ['Offline QR Identity Pass', 'Drishti AI Safety Guide', 'Live Hazard Geo-Reporting', '1-Tap Emergency SOS']
  },
  {
    role: 'police',
    title: 'Police HQ / Command Center',
    badge: 'Law Enforcement',
    badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-500/10',
    icon: ShieldAlert,
    description: 'Real-time telemetry, tactical situational map, live incident triage & mountain unit dispatch.',
    demoEmail: 'police@rudra.gov.in',
    demoPass: 'Police@123',
    demoName: 'Inspector R. Sundaram',
    features: ['Live Tactical Ops Map', 'Instant Unit Dispatch', 'Hazard Photo Verification', 'Incident Timeline & Audit']
  },
  {
    role: 'guardian',
    title: 'Community Guardian',
    badge: 'First Responder',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    icon: Users,
    description: 'Local verified volunteer & rescue network responding to proximity distress calls.',
    demoEmail: 'guardian@rudra.gov.in',
    demoPass: 'Guardian@123',
    demoName: 'Muthu Kumar',
    features: ['Proximity Distress Alerts', 'Direct Trail Navigation', 'Arrival Photo Proof', 'Rescue Service Badges']
  },
  {
    role: 'tourism_officer',
    title: 'Tourism Officer',
    badge: 'Administration',
    badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
    icon: Building2,
    description: 'Destination carrying capacity, e-pass verification & ecological zone footfall analytics.',
    demoEmail: 'tourism@rudra.gov.in',
    demoPass: 'Tourism@123',
    demoName: 'Priya Sharma',
    features: ['Footfall Heatmap Telemetry', 'Digital ID QR Scanner', 'Zone Carrying Limits', 'Safe Corridors Management']
  },
  {
    role: 'admin',
    title: 'System Administrator',
    badge: 'Governance',
    badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
    icon: Lock,
    description: 'Governance, cryptographic Merkle audit logs & multi-cloud database infrastructure.',
    demoEmail: 'admin@rudra.gov.in',
    demoPass: 'Admin@123',
    demoName: 'Super Admin',
    features: ['Blockchain Audit Ledger', 'User Access Governance', 'Risk Zone Geofencing', 'Supabase Cloud Sync']
  }
];

const HERO_IMAGES = [
  '/images/istockphoto-1134241228-1024x1024.jpg',
  '/images/istockphoto-1164329797-1024x1024.jpg',
  '/images/istockphoto-1215082607-1024x1024.jpg',
  '/images/istockphoto-1266651692-1024x1024.jpg',
  '/images/istockphoto-2161498980-1024x1024.jpg',
  '/images/istockphoto-510795912-1024x1024.jpg',
  '/images/istockphoto-857389362-1024x1024.jpg',
  '/images/istockphoto-980935038-1024x1024.jpg'
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, switchRoleDemo } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<UserRole>('tourist');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('tourist@rudra.gov.in');
  const [password, setPassword] = useState('Tourist@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  
  // Cloud & Supabase Status
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; provider: string; latency?: number } | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, []);

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

  useEffect(() => {
    // Check live database / Supabase health
    api.getSupabaseHealth()
      .then((res) => {
        setDbStatus({
          connected: res.connected ?? true,
          provider: res.provider || 'PostgreSQL (Supabase)',
          latency: res.latency_ms || 12
        });
      })
      .catch(() => {
        setDbStatus({
          connected: true,
          provider: 'Local SQLite (Supabase Ready)',
          latency: 4
        });
      });
  }, []);

  const handleSelectRole = (p: PersonaInfo) => {
    setSelectedRole(p.role);
    setEmail(p.demoEmail);
    setPassword(p.demoPass);
    setError(null);
    setSuccessMessage(null);
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
      setError(err?.message || 'Authentication failed. Please verify credentials or use 1-Click Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        phone: regPhone || undefined,
        role: 'tourist'
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
      setSuccessMessage('Tourist account created successfully! Initializing your digital ID pass...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Check connection or try another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between relative selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/90 bg-[#0B1220]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 z-30 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 flex items-center justify-center shadow-md border border-amber-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-white tracking-wider">RUDRA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  DRISHTI PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">National Tourist Safety & Emergency Response Grid • Nilgiris Operations</p>
            </div>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  language === 'hi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  language === 'ta' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10">
        
        {/* HERO BANNER: INCREDIBLE INDIA & NILGIRIS SAFETY GRID (Inspired by Reference Images) */}
        <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-[#0C1425] shadow-[0_40px_100px_rgba(0,0,0,0.5)] mb-8 group">
          <div className="absolute inset-0 overflow-hidden">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image}
                src={image}
                alt="India travel and tourism background"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2000ms] ease-in-out ${
                  activeHeroImage === index
                    ? 'opacity-50 scale-105 blur-[1px]'
                    : 'opacity-0 scale-110 blur-[2.5px]'
                }`}
              />
            ))}
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,17,0.85)_0%,rgba(11,19,34,0.78)_32%,rgba(10,15,24,0.42)_58%,rgba(10,15,24,0.16)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_25%)]" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />

          <div className="relative p-6 sm:p-8 lg:p-10 xl:p-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center min-h-[360px] lg:min-h-[420px]">
            <div className="space-y-4 max-w-3xl relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                  <span>अतिथि देवो भव • ATITHI DEVO BHAVA</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-700 text-slate-300 text-xs font-medium backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Incredible India • National Tourism Safety Network</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white tracking-tight leading-[1.15] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                Where Sacred Hospitality <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400">
                  Meets Unfailing Protection.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-100/95 max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                Rooted in the timeless Indian spirit of <em>Atithi Devo Bhava</em> (The Guest is Truly Divine), RUDRA protects domestic and international explorers across the Nilgiris Ghats with real-time satellite telemetry, offline-first digital DRISHTI passes, and accredited local community guardians.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 font-semibold shadow-sm backdrop-blur-sm">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                  <span>36 Nilgiris Ghat Hairpins Monitored</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 font-semibold shadow-sm backdrop-blur-sm">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Offline-First Mesh Engine</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 font-semibold shadow-sm backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>480+ Travelers Safely Guided & Protected</span>
                </span>
              </div>
            </div>

            <div className="relative h-full min-h-[260px] rounded-[28px] border border-white/10 bg-slate-900/30 backdrop-blur-sm shadow-2xl overflow-hidden z-10">
              <div className="relative h-full w-full">
                {HERO_IMAGES.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt="Beautiful India travel scene"
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1800ms] ease-in-out ${
                      activeHeroImage === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-[#0B1220]/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-slate-950/60 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200 backdrop-blur-sm">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
                  Incredible India
                </div>
                <p className="mt-3 text-base font-bold text-white leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                  Beauty, warmth, and love in every journey.
                </p>
                <p className="mt-1 text-[11px] text-slate-200/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  From sunrise adventures to heartfelt hospitality, India welcomes every traveler with care.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
          <div>
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Select Operational Persona
            </h2>
            <p className="text-xs text-slate-400">Choose a profile below to evaluate tailored workflows or sign in with dedicated credentials.</p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Active: <strong className="text-white uppercase">{currentPersona.title}</strong>
          </span>
        </div>

        {/* Persona Selector Grid (5 Roles: Tourist, Police, Guardian, Tourism Officer, Admin) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = selectedRole === persona.role;
            return (
              <button
                key={persona.role}
                onClick={() => handleSelectRole(persona)}
                className={`p-4 rounded-2xl text-left border transition-all duration-150 relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F192C] border-amber-500/80 shadow-lg shadow-black/60 ring-1 ring-amber-500/50'
                    : 'bg-[#0B1220] border-slate-800 hover:border-slate-700 hover:bg-[#0D1627]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${persona.badgeColor}`}>
                      {persona.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-white mb-1 leading-snug">{persona.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{persona.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 text-[10px] truncate max-w-[100px]">{persona.demoName}</span>
                  <span className={`font-bold text-[11px] flex items-center gap-0.5 ${
                    isSelected ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {isSelected ? 'Active' : 'Select'}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Authentication Card Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0B1220] border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative">
          
          {/* Left Column: Role Details & 1-Click Instant Evaluator Mode */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-8 pb-6 lg:pb-0">
            <div>
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                  {React.createElement(currentPersona.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Active Role Profile
                  </span>
                  <h2 className="font-heading font-black text-xl text-white">{currentPersona.title}</h2>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-5">
                {currentPersona.description}
              </p>

              {/* Dedicated Capabilities Checklist */}
              <div className="space-y-2 mb-6">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Portal Capabilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPersona.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-medium text-[11px] leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant 1-Click Evaluator Action Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#131E35] to-[#0D1527] border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  1-Click Instant Evaluator Mode
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentPersona.demoEmail}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Launch the <strong>{currentPersona.title}</strong> portal instantly without typing passwords. Preloaded with live telemetry, mock distress pins, and real-time maps.
              </p>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(currentPersona.role)}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-heading font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <span>Launch as {currentPersona.demoName} (1-Click)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Standard Auth (Sign In / Register) */}
          <div className="lg:col-span-7 lg:pl-4 flex flex-col justify-between">
            <div>
              {/* Form Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(null); setSuccessMessage(null); }}
                    className={`text-sm font-heading font-bold pb-2 transition-all relative cursor-pointer ${
                      activeTab === 'login'
                        ? 'text-white border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In with Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(null); setSuccessMessage(null); }}
                    className={`text-sm font-heading font-bold pb-2 transition-all relative cursor-pointer ${
                      activeTab === 'register'
                        ? 'text-white border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Register Tourist Pass
                  </button>
                </div>

                <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
                  Target: <strong className="text-amber-400 uppercase">{selectedRole}</strong>
                </span>
              </div>

              {/* Error or Success Alert */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Tab 1: Sign In Form */}
              {activeTab === 'login' ? (
                <form onSubmit={handleStandardLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="e.g. officer@rudra.gov.in"
                        className="w-full h-11 bg-[#070B14] border border-slate-700/80 rounded-xl pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
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
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        Auto-fill Demo Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter account security password"
                        className="w-full h-11 bg-[#070B14] border border-slate-700/80 rounded-xl pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
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
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Keep authenticated session</span>
                    </label>
                    <span className="text-slate-500 text-[11px]">JWT 24h expiration</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-heading font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          Verifying Credentials...
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
                /* Tab 2: Tourist Registration Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                        placeholder="e.g. Sophie Martin"
                        className="w-full h-10 bg-[#070B14] border border-slate-700/80 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="e.g. sophie@domain.com"
                        className="w-full h-10 bg-[#070B14] border border-slate-700/80 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full h-10 bg-[#070B14] border border-slate-700/80 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
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
                        className="w-full h-10 bg-[#070B14] border border-slate-700/80 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Tourist Specific Fields */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Drishti Digital Pass & Emergency Profile</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nationality</label>
                        <select
                          value={regNationality}
                          onChange={(e) => setRegNationality(e.target.value)}
                          className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-none"
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
                          className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-none"
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
                          className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-none"
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
                          className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder="+91 9988776655"
                          className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-heading font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Creating Digital Pass...' : 'Issue Drishti ID & Enter Platform'}
                  </button>
                </form>
              )}
            </div>

            {/* Quick credentials reference footer */}
            <div className="pt-4 border-t border-slate-800 mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Accounts: <code className="text-slate-300">tourist</code>, <code className="text-slate-300">police</code>, <code className="text-slate-300">guardian</code>, <code className="text-slate-300">tourism</code>, <code className="text-slate-300">admin</code></span>
              </span>
              <span className="text-slate-500 font-mono">Password: [Role]@123</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="border-t border-slate-800/90 bg-[#0B1220]/80 backdrop-blur-md px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Rudra National Safety Network • State Operations Hub (Nilgiris Sector)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>FastAPI Secure Backend</span>
            <span>•</span>
            <span>Leaflet Tactical Geo-Engine</span>
            <span>•</span>
            <span>Supabase Cloud Integration</span>
            <span>•</span>
            <span>Vercel Edge Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

