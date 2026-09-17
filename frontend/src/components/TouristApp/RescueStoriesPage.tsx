import React, { useState } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Star, 
  Sparkles, 
  Mountain, 
  Compass, 
  CheckCircle2, 
  Quote, 
  BookOpen, 
  Navigation,
  Camera,
  Award
} from 'lucide-react';

interface Story {
  id: string;
  category: 'rescue' | 'heritage' | 'community';
  title: string;
  subtitle: string;
  location: string;
  date: string;
  heroImage: string;
  summary: string;
  testimonial?: {
    quote: string;
    author: string;
    origin: string;
  };
  impactStats?: { label: string; value: string }[];
  tags: string[];
}

const STORIES: Story[] = [
  {
    id: 'kalhatty-rescue',
    category: 'rescue',
    title: 'Monsoon Ghat Rescue: French Trekkers Safely Located in 14 Minutes',
    subtitle: 'Offline Drishti ID telemetry and Community Guardian response on Hairpin 22',
    location: 'Kalhatty Ghat (Hairpin 22), Nilgiris',
    date: 'Monsoon Season • Verified Case #NIL-4821',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    summary: 'When an unexpected flash rockfall cut off visibility near Kalhatty curve 22, Sophie Martin and her companion lost cellular connectivity. Using RUDRA’s offline-first beacon mode, their encrypted coordinates were broadcast over low-power Bluetooth mesh. Local Community Guardian Muthu Kumar arrived on a modified 4x4 within 14 minutes, providing thermal blankets, drinking water, and safe escort to Ooty.',
    testimonial: {
      quote: 'We were completely lost in thick mountain fog with zero mobile network. The app triggered without internet and local guardian Muthu arrived like family. We experienced true Indian warmth and hospitality — Atithi Devo Bhava is real.',
      author: 'Sophie Martin',
      origin: 'Lyon, France'
    },
    impactStats: [
      { label: 'Response Time', value: '14 Mins' },
      { label: 'Cellular Signal', value: '0 Bars (Mesh)' },
      { label: 'Outcome', value: 'Safe Shelter' }
    ],
    tags: ['Offline SOS', 'Community Guardian', 'Zero Signal Rescue']
  },
  {
    id: 'unesco-railway',
    category: 'heritage',
    title: 'Nilgiri Mountain Railway: The Century-Old UNESCO Engineering Marvel',
    subtitle: 'Exploring the blue toy train corridor with automated safe-speed and weather geofencing',
    location: 'Mettupalayam to Udhagamandalam Route',
    date: 'Cultural Heritage Guide',
    heroImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
    summary: 'Built in 1908, the Nilgiri Mountain Railway is India’s steepest rack-and-pinion railway. RUDRA monitors 208 curves and 250 bridges along this UNESCO World Heritage corridor, broadcasting automated speed cautions and scenic heritage audio guides to travelers at key viaduct vantage points.',
    impactStats: [
      { label: 'Corridor Age', value: '116 Years' },
      { label: 'UNESCO Bridges', value: '250+' },
      { label: 'Safety Index', value: '98/100' }
    ],
    tags: ['UNESCO Heritage', 'Scenic Rail', 'Safe Tourism Corridor']
  },
  {
    id: 'doddabetta-medic',
    category: 'rescue',
    title: 'High-Altitude Medical Evacuation on Doddabetta Peak',
    subtitle: 'Rapid oxygen and emergency medical dispatch coordinated via Police Command HQ',
    location: 'Doddabetta Peak (2,637m)',
    date: 'Winter Trek • Verified Case #NIL-3912',
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    summary: 'An elderly domestic tourist from Gujarat experienced acute altitude sickness and sudden chest tightness at 2,600 meters. The instant tap SOS sent their pre-registered medical profile (Blood Group O+, hypertensive history) directly to the Nilgiris Police Command Desk. A mountain ambulance stationed at Fingerpost was dispatched with supplemental oxygen within 9 minutes.',
    testimonial: {
      quote: 'The doctors already had my father’s medical history and blood group before the ambulance even reached. The government and police response was impeccable.',
      author: 'Rajesh Patel',
      origin: 'Ahmedabad, Gujarat'
    },
    impactStats: [
      { label: 'Dispatch Delay', value: '< 2 Mins' },
      { label: 'Elevation', value: '2,637 m' },
      { label: 'Patient Status', value: 'Fully Recovered' }
    ],
    tags: ['Medical Evacuation', 'Police HQ Dispatch', 'Medical Profile']
  },
  {
    id: 'atithi-care',
    category: 'community',
    title: 'The Guardian Network: How Nilgiris Tea Growers Became First Responders',
    subtitle: 'Over 140 certified homestay owners, tea estate guides, and taxi operators on 24/7 duty',
    location: 'Kotagiri, Coonoor & Ooty Highlands',
    date: 'Community Initiative',
    heroImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    summary: 'In accordance with the timeless Indian tenet of Atithi Devo Bhava, the Nilgiris district administration certified over 140 local citizens as accredited Guardians. Trained in basic wilderness first aid, mountain driving safety, and multi-lingual translation, guardians receive real-time proximity alerts whenever a traveler in their sector requires assistance.',
    impactStats: [
      { label: 'Active Guardians', value: '140+ Volunteers' },
      { label: 'Average Arrival', value: '11.8 Mins' },
      { label: 'Languages', value: 'EN, HI, TA, ML' }
    ],
    tags: ['Atithi Devo Bhava', 'Community Trust', 'Certified Volunteers']
  }
];

export const RescueStoriesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'rescue' | 'heritage' | 'community'>('all');

  const filteredStories = filter === 'all' 
    ? STORIES 
    : STORIES.filter(s => s.category === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#121B2F] via-[#0D1525] to-[#080D18] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>अतिथि देवो भव • ATITHI DEVO BHAVA</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
            Chronicles of Care & Indian Heritage
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real stories of how RUDRA, the Nilgiris Police Command, and certified local Guardians protect travelers from across India and the world — celebrating responsible, fearless tourism.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 relative z-10">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            All Chronicles ({STORIES.length})
          </button>
          <button
            onClick={() => setFilter('rescue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'rescue'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Rescue Missions
          </button>
          <button
            onClick={() => setFilter('heritage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'heritage'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Heritage Corridors
          </button>
          <button
            onClick={() => setFilter('community')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'community'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Guardian Community
          </button>
        </div>
      </div>

      {/* Story Cards List */}
      <div className="space-y-6">
        {filteredStories.map((story) => (
          <article 
            key={story.id} 
            className="rounded-3xl overflow-hidden border border-slate-800 bg-[#0B1220] hover:border-amber-500/40 transition-all duration-200 shadow-xl group"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Story Visual Thumbnail */}
              <div className="md:col-span-5 relative h-56 md:h-auto overflow-hidden">
                <img 
                  src={story.heroImage} 
                  alt={story.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                
                {/* Location Badge */}
                <div className="absolute top-3.5 left-3.5 bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{story.location}</span>
                </div>
              </div>

              {/* Story Details */}
              <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                      {story.date}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {story.category.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-lg sm:text-xl text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {story.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {story.summary}
                  </p>

                  {/* Traveler Testimonial Quote if present */}
                  {story.testimonial && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#070B14] border border-amber-500/20 relative">
                      <Quote className="w-4 h-4 text-amber-400/60 mb-1" />
                      <p className="text-xs italic text-amber-100/90 leading-relaxed">
                        &ldquo;{story.testimonial.quote}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="text-white font-bold">— {story.testimonial.author}</span>
                        <span className="text-amber-400/90">{story.testimonial.origin}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Impact Stat Capsules & Tags */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  {story.impactStats && (
                    <div className="flex items-center gap-3 text-xs">
                      {story.impactStats.map((stat, i) => (
                        <div key={i} className="bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px]">
                          <span className="text-slate-400 text-[10px] block font-medium">{stat.label}</span>
                          <span className="font-bold text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {story.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
