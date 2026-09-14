import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { TouristHomeScreen } from './components/TouristApp/TouristHomeScreen';
import { CommandCenterDashboard } from './components/CommandCenter/CommandCenterDashboard';
import { GuardianDashboard } from './components/GuardianPortal/GuardianDashboard';
import { TourismDashboard } from './components/TourismPortal/TourismDashboard';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { DemoControlPanel } from './components/Demo/DemoControlPanel';

export const App: React.FC = () => {
  const { role } = useAuth();

  // Simulated GPS position (Ooty / Nilgiris)
  const [touristLat, setTouristLat] = useState(11.4180);
  const [touristLng, setTouristLng] = useState(76.7100);

  // Global modal triggers
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500 selection:text-white pb-24">
      {/* Top Header */}
      <Header
        onOpenDigitalId={() => setIsDigitalIdOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      {/* Main Role-Based Content View */}
      <main className="flex-1">
        {role === 'tourist' && (
          <TouristHomeScreen
            currentLat={touristLat}
            currentLng={touristLng}
            onOpenSOSModal={() => setIsSOSOpen(true)}
            isSOSOpen={isSOSOpen}
            onCloseSOSModal={() => setIsSOSOpen(false)}
            isDigitalIdOpen={isDigitalIdOpen}
            onCloseDigitalIdModal={() => setIsDigitalIdOpen(false)}
            onLocationSelect={(lat, lng) => {
              setTouristLat(lat);
              setTouristLng(lng);
            }}
          />
        )}

        {role === 'police' && (
          <CommandCenterDashboard />
        )}

        {role === 'guardian' && (
          <GuardianDashboard />
        )}

        {role === 'tourism_officer' && (
          <TourismDashboard />
        )}

        {role === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Interactive Demonstration HUD Controller */}
      <DemoControlPanel
        onLocationChange={(lat, lng) => {
          setTouristLat(lat);
          setTouristLng(lng);
        }}
        onOpenSOSModal={() => setIsSOSOpen(true)}
      />
    </div>
  );
};

export default App;
