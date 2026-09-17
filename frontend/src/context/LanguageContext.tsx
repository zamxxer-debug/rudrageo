import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'brand_name': 'RUDRA',
    'brand_subtitle': 'Smart Tourist Safety & Emergency Response Platform',
    'online': 'ONLINE',
    'offline': 'OFFLINE',
    'limited': 'LIMITED',
    'digital_id': 'DRISHTI ID',
    'sos': 'SOS',
    'logout': 'Log Out',
    'sync_queue': 'Sync Offline Queue',
    'safety_index': 'Safety Index',
    'safe_corridor': 'Safe Travel Corridor',
    'high_risk_zone': 'High Risk Terrain Zone',
    'critical_hazard': 'Critical Hazard Alert',
    'tourist_name': 'Welcome',
    'quick_sos': 'Emergency SOS',
    'report_hazard': 'Report Hazard',
    'ai_assistant': 'Drishti AI Assistant',
    'pay_in_india': 'UPI Pay in India',
    'safety_map': 'Safety Map & Facilities',
    'quick_camera': 'Quick Safety Snapshot',
    'quick_camera_sub': 'Capture & Geotag Photo',
    'safe_route_advice': 'You are inside a verified safe tourism corridor. Safe travels!',
    'approaching_hazard_advice': 'Caution: Approaching steep hairpin zone. Stay on paved trail.',
    'elevation': 'Elevation',
    'battery': 'Battery',
    'gps_accuracy': 'GPS Accuracy',
    'emergency_sos_title': 'EMERGENCY SOS ASSISTANCE',
    'sos_active_title': 'SOS ACTIVE — DISPATCHED',
    'hold_sos_prompt': 'Press and hold button for 3 seconds to trigger emergency rescue.',
    'tap_instant_sos': 'Tap to Trigger Immediately Without Delay',
    'attach_photo_optional': 'Attach Scene Photo (Optional):',
    'photo_captured': 'Photo Attached',
    'cancel_sos': 'Cancel SOS Alert',
    'call_emergency': 'Call Emergency (112)',
    'guardian_title': 'VERIFIED COMMUNITY GUARDIAN NETWORK',
    'guardian_welcome': 'Welcome, Responders',
    'on_duty': 'Available on Duty',
    'rescue_badges': 'Rescue Badges',
    'nearby_alerts': 'Nearby Emergency Distress Signals',
    'no_active_alerts': 'No active distress signals in your immediate radius. Stay alert.',
    'accept_mission': 'Accept & Navigate to Tourist',
    'report_on_scene': 'Report On Scene',
    'verify_safe_arrival': 'Verify Safe Arrival & Upload Photo',
    'safe_arrival_recorded': 'Safe arrival verified and logged with Police HQ.',
    'police_title': 'POLICE & DISASTER COMMAND HQ',
    'active_emergencies': 'Active Emergencies',
    'no_emergencies': 'No active SOS signals. All sectors safe.',
    'acknowledge': 'Acknowledge',
    'assign_rescue': 'Assign Rescue Unit Alpha',
    'mark_rescued': 'Mark Rescued',
    'close_incident': 'Close & Anchor Blockchain',
    'live_radar': 'Live Operations Radar',
    'incident_timeline': 'Incident Timeline',
    'blockchain_ledger': 'Blockchain Audit Ledger',
    'tourism_title': 'DESTINATION & TOURISM SAFETY PORTAL',
    'admin_title': 'SYSTEM ADMINISTRATION & RISK CONFIG',
    'add_zone_btn': 'Add New Geofence Risk Zone',
    'total_zones': 'Active Risk Zones',
    'capacity_meters': 'Tourist Carrying Capacity',
    'supabase_status': 'Supabase PostgreSQL Cloud',
    'demo_hud': 'Demo Controls',
    'demo_hud_full': 'Interactive Demonstration HUD',
    'atithi_devo_bhava': 'Atithi Devo Bhava (The Guest is Truly Divine)',
    'rescue_chronicles': 'Care & Heritage Chronicles',
    'close': 'Close'
  },
  hi: {
    'brand_name': 'रुद्र (RUDRA)',
    'brand_subtitle': 'पर्यटक सुरक्षा एवं आपातकालीन त्वरित प्रतिक्रिया मंच',
    'online': 'ऑनलाइन (Online)',
    'offline': 'ऑफलाइन (Offline)',
    'limited': 'सीमित नेटवर्क',
    'digital_id': 'दृष्टि आईडी (Drishti ID)',
    'sos': 'आपातकालीन मदद (SOS)',
    'logout': 'लॉग आउट',
    'sync_queue': 'ऑफ़लाइन डेटा सिंक करें',
    'safety_index': 'सुरक्षा सूचकांक',
    'safe_corridor': 'सुरक्षित पर्यटन क्षेत्र (Safe Zone)',
    'high_risk_zone': 'उच्च जोखिम वाला क्षेत्र (High Risk)',
    'critical_hazard': 'अत्यधिक खतरे की चेतावनी (Critical Alert)',
    'tourist_name': 'नमस्ते',
    'quick_sos': 'आपातकालीन सहायता (SOS)',
    'report_hazard': 'खतरे की सूचना दें',
    'ai_assistant': 'दृष्टि एआई सहायक (AI Guide)',
    'pay_in_india': 'यूपीआई भुगतान (Pay in India)',
    'safety_map': 'सुरक्षा मानचित्र एवं सहायता केंद्र',
    'quick_camera': 'त्वरित फोटो / कैमरा लें',
    'quick_camera_sub': 'घटना स्थल की फोटो जोड़ें',
    'safe_route_advice': 'आप सुरक्षित पर्यटन क्षेत्र में हैं। आपकी यात्रा सुखद हो!',
    'approaching_hazard_advice': 'सावधान: आगे भूस्खलन/तीखे मोड़ का क्षेत्र है। मुख्य मार्ग पर रहें।',
    'elevation': 'ऊंचाई (Elevation)',
    'battery': 'बैटरी (Battery)',
    'gps_accuracy': 'जीपीएस सटीकता (GPS Accuracy)',
    'emergency_sos_title': 'आपातकालीन सुरक्षा सहायता (SOS)',
    'sos_active_title': 'मदद भेजी गई — पुलिस एवं रेस्क्यू अलर्ट',
    'hold_sos_prompt': 'आपातकालीन बचाव के लिए बटन को 3 सेकंड दबाकर रखें।',
    'tap_instant_sos': 'तुरंत आपातकालीन मदद भेजने के लिए टैप करें',
    'attach_photo_optional': 'घटना स्थल की फोटो जोड़ें (वैकल्पिक):',
    'photo_captured': 'फोटो संलग्न की गई',
    'cancel_sos': 'एसओएस रद्द करें (Cancel)',
    'call_emergency': 'आपातकालीन कॉल करें (112)',
    'guardian_title': 'सत्यापित स्थानीय रक्षक एवं बचाव दल',
    'guardian_welcome': 'नमस्ते, रक्षक / बचाव दल',
    'on_duty': 'ड्यूटी पर उपलब्ध',
    'rescue_badges': 'बचाव पदक',
    'nearby_alerts': 'आसपास के आपातकालीन संदेश (Distress Alerts)',
    'no_active_alerts': 'वर्तमान में आपके क्षेत्र में कोई आपातकालीन सूचना नहीं है। सतर्क रहें।',
    'accept_mission': 'स्वीकार करें और पर्यटक के पास जाएं',
    'report_on_scene': 'घटनास्थल पर पहुंचे',
    'verify_safe_arrival': 'सुरक्षित पहुंचने की पुष्टि करें और फोटो अपलोड करें',
    'safe_arrival_recorded': 'सुरक्षित पहुंच सत्यापित की गई और पुलिस मुख्यालय को भेजी गई।',
    'police_title': 'पुलिस एवं आपदा नियंत्रण मुख्यालय',
    'active_emergencies': 'सक्रिय आपातकालीन स्थितियां',
    'no_emergencies': 'कोई सक्रिय आपातकालीन संकेत नहीं। सभी क्षेत्र सुरक्षित हैं।',
    'acknowledge': 'स्वीकार करें (Acknowledge)',
    'assign_rescue': 'बचाव दल अल्फा को भेजें',
    'mark_rescued': 'सुरक्षित घोषित करें (Mark Rescued)',
    'close_incident': 'समाप्त करें और ब्लॉकचेन में दर्ज करें',
    'live_radar': 'लाइव आपातकालीन रडार',
    'incident_timeline': 'घटनाक्रम टाइमलाइन',
    'blockchain_ledger': 'ब्लॉकचेन ऑडिट लेजर',
    'tourism_title': 'पर्यटन एवं सुरक्षा प्रबंधन पोर्टल',
    'admin_title': 'सिस्टम प्रशासन एवं भू-घेरा (Geofence) प्रबंधन',
    'add_zone_btn': 'नया भू-घेरा (Geofence Zone) जोड़ें',
    'total_zones': 'सक्रिय जोखिम क्षेत्र',
    'capacity_meters': 'पर्यटक क्षमता मीटर',
    'supabase_status': 'सुपाबेस पोस्टग्रेस क्लाउड',
    'demo_hud': 'डेमो कंट्रोल्स',
    'demo_hud_full': 'इंटरैक्टिव डेमो सिम्युलेटर',
    'atithi_devo_bhava': 'अतिथि देवो भव (अतिथि भगवान स्वरूप हैं)',
    'rescue_chronicles': 'सुरक्षा एवं धरोहर गाथा',
    'close': 'बंद करें'
  },
  ta: {
    'brand_name': 'ருத்ரா (RUDRA)',
    'brand_subtitle': 'சுற்றுலா பாதுகாப்பு மற்றும் அவசர உதவி தளம்',
    'online': 'ஆன்லைன் (Online)',
    'offline': 'ஆஃப்லைன் (Offline)',
    'limited': 'வரையறுக்கப்பட்ட நெட்வொர்க்',
    'digital_id': 'திருஷ்டி ஐடி (Drishti ID)',
    'sos': 'அவசர உதவி (SOS)',
    'logout': 'வெளியேறு',
    'sync_queue': 'ஆஃப்லைன் தரவு ஒத்திசைவு',
    'safety_index': 'பாதுகாப்பு குறியீடு',
    'safe_corridor': 'பாதுகாப்பான சுற்றுலா பகுதி',
    'high_risk_zone': 'அதிக ஆபத்தான பகுதி',
    'critical_hazard': 'அவசர எச்சரிக்கை',
    'tourist_name': 'வணக்கம்',
    'quick_sos': 'அவசர உதவி (SOS)',
    'report_hazard': 'ஆபத்தை புகாரளிக்கவும்',
    'ai_assistant': 'AI பாதுகாப்பு வழிகாட்டி',
    'pay_in_india': 'UPI பணம் செலுத்துதல்',
    'safety_map': 'பாதுகாப்பு வரைபடம் & மையங்கள்',
    'quick_camera': 'விரைவு புகைப்படம்',
    'quick_camera_sub': 'புகைப்படத்தை இணைக்கவும்',
    'safe_route_advice': 'நீங்கள் பாதுகாப்பான பாதையில் உள்ளீர்கள். இனிய பயணம்!',
    'approaching_hazard_advice': 'எச்சரிக்கை: அபாயகரமான வளைவு பகுதி நெருங்குகிறது.',
    'elevation': 'உயரம்',
    'battery': 'பேட்டரி',
    'gps_accuracy': 'GPS துல்லியம்',
    'emergency_sos_title': 'அவசர உதவி மையம் (SOS)',
    'sos_active_title': 'உதவி அனுப்பப்பட்டது — காவல்துறை எச்சரிக்கை',
    'hold_sos_prompt': 'அவசர உதவிக்கு 3 வினாடிகள் அழுத்திப் பிடிக்கவும்.',
    'tap_instant_sos': 'உடனடியாக அவசர உதவி அனுப்ப தட்டவும்',
    'attach_photo_optional': 'புகைப்படத்தை இணைக்கவும் (விருப்பமானது):',
    'photo_captured': 'புகைப்படம் இணைக்கப்பட்டது',
    'cancel_sos': 'SOS ரத்து செய்',
    'call_emergency': 'அவசர அழைப்பு (112)',
    'guardian_title': 'உள்ளூர் காவலர் & மீட்புக்குழு நெட்வொர்க்',
    'guardian_welcome': 'வணக்கம், மீட்புக் குழுவினர்',
    'on_duty': 'பணியில் உள்ளார்',
    'rescue_badges': 'மீட்பு பதக்கங்கள்',
    'nearby_alerts': 'அருகிலுள்ள அவசர எச்சரிக்கைகள்',
    'no_active_alerts': 'அருகில் எந்த அவசர எச்சரிக்கைகளும் இல்லை.',
    'accept_mission': 'ஏற்றுக்கொண்டு சுற்றுலாப் பயணியிடம் செல்லவும்',
    'report_on_scene': 'இடத்திற்கு வந்து சேர்ந்தார்',
    'verify_safe_arrival': 'பாதுகாப்பான வருகையை உறுதிப்படுத்தி புகைப்படத்தை பதிவேற்றவும்',
    'safe_arrival_recorded': 'பாதுகாப்பான வருகை பதிவு செய்யப்பட்டு தலைமையகத்திற்கு அனுப்பப்பட்டது.',
    'police_title': 'காவல்துறை & பேரிடர் கட்டுப்பாட்டு தலைமையகம்',
    'active_emergencies': 'செயலில் உள்ள அவசரநிலைகள்',
    'no_emergencies': 'அவசர சிக்னல்கள் எதுவும் இல்லை. அனைத்து பகுதிகளும் பாதுகாப்பானவை.',
    'acknowledge': 'ஏற்றுக்கொள்',
    'assign_rescue': 'மீட்புக் குழுவை அனுப்பு',
    'mark_rescued': 'மீட்கப்பட்டதாகக் குறிக்கவும்',
    'close_incident': 'முடிவு செய்து பிளாக்செயினில் சேமிக்கவும்',
    'live_radar': 'நேரடி அவசர ரேடார்',
    'incident_timeline': 'காலவரிசை',
    'blockchain_ledger': 'பிளாக்செயின் பதிவு',
    'tourism_title': 'சுற்றுலா & பாதுகாப்பு தளம்',
    'admin_title': 'கணினி நிர்வாகம் & ஜியோஃபென்ஸ் மேலாண்மை',
    'add_zone_btn': 'புதிய ஜியோஃபென்ஸ் மண்டலத்தை சேர்க்கவும்',
    'total_zones': 'செயலில் உள்ள மண்டலங்கள்',
    'capacity_meters': 'சுற்றுலா கொள்ளளவு',
    'supabase_status': 'சுபாபேஸ் போஸ்ட்கிரெஸ் கிளவுட்',
    'demo_hud': 'டெமோ கட்டுப்பாடுகள்',
    'demo_hud_full': 'டெமோ சிமுலேட்டர்',
    'atithi_devo_bhava': 'விருந்தோம்பல் (அதிதி தேவோ பவ)',
    'rescue_chronicles': 'பாதுகாப்பு & பாரம்பரிய வரலாறு',
    'close': 'மூடு'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('rudra_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rudra_lang', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
