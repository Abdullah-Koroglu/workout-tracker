// FitCoach OS — Shared components v2 (Premium)
const C = {
  primary: '#F97316', primaryLight: '#FED7AA', primaryDark: '#C2410C',
  primaryGrad: 'linear-gradient(135deg, #FB923C, #EA580C)',
  secondary: '#1A365D', secondaryLight: '#2D4A7A',
  tertiary: '#2563EB', tertiaryLight: '#DBEAFE',
  neutral: '#F8FAFC', white: '#FFFFFF',
  gray100: '#F1F5F9', gray200: '#E2E8F0', gray300: '#CBD5E1',
  gray400: '#94A3B8', gray600: '#475569', gray800: '#1E293B',
  success: '#22C55E', danger: '#EF4444', warning: '#F59E0B',
  cardShadow: '0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
  cardBorder: '1px solid rgba(0,0,0,0.06)',
};

const mockData = {
  coaches: [
    { id: 1, name: 'Berk Öztürk', specialties: ['Güç Antrenmanı','Hacim Kazanma'], exp: 7, bio: 'ISSA sertifikalı kişisel antrenör. Sporcuların maksimum güç ve hacim hedeflerine ulaşmalarına yardımcı oluyorum.', packages: 3, clients: 12, connected: 'ACCEPTED' },
    { id: 2, name: 'Ayşe Kılıç', specialties: ['Kilo Verme','Kardiyovasküler'], exp: 4, bio: 'Beslenme danışmanı ve personal trainer. Sağlıklı yaşam için holistik yaklaşım benimsiyorum.', packages: 2, clients: 8, connected: null },
    { id: 3, name: 'Murat Can', specialties: ['Sporcu Performansı','Güç Antrenmanı','Hacim Kazanma'], exp: 10, bio: 'Olimpik kaldırma ve atletizm uzmanı. Elit sporcularla 10 yıllık deneyim.', packages: 4, clients: 20, connected: 'PENDING' },
    { id: 4, name: 'Elif Doğan', specialties: ['Kilo Verme','Kardiyovasküler'], exp: 3, bio: 'Pilates ve fonksiyonel antrenman uzmanı. Kadınlara özel programlar geliştiriyorum.', packages: 2, clients: 6, connected: null },
  ],
  templates: [
    { id: 1, name: 'Full Body A', exercises: [
      { name: 'Squat', type: 'WEIGHT', sets: 4, reps: 8, rir: 2 },
      { name: 'Bench Press', type: 'WEIGHT', sets: 4, reps: 8, rir: 2 },
      { name: 'Deadlift', type: 'WEIGHT', sets: 3, reps: 6, rir: 3 },
      { name: 'Pull-up', type: 'WEIGHT', sets: 3, reps: 10, rir: 1 },
    ]},
    { id: 2, name: 'Upper Body Push', exercises: [
      { name: 'Overhead Press', type: 'WEIGHT', sets: 4, reps: 8, rir: 2 },
      { name: 'Dumbbell Bench', type: 'WEIGHT', sets: 3, reps: 12, rir: 1 },
      { name: 'Tricep Pushdown', type: 'WEIGHT', sets: 3, reps: 15, rir: 1 },
      { name: 'Koşu Bandı', type: 'CARDIO', duration: 20 },
    ]},
    { id: 3, name: 'Lower Body Hypertrophy', exercises: [
      { name: 'Leg Press', type: 'WEIGHT', sets: 4, reps: 12, rir: 1 },
      { name: 'Romanian Deadlift', type: 'WEIGHT', sets: 3, reps: 10, rir: 2 },
      { name: 'Leg Extension', type: 'WEIGHT', sets: 3, reps: 15, rir: 0 },
    ]},
  ],
  assignments: [
    { id: 1, templateId: 1, scheduledFor: '2026-04-27' },
    { id: 2, templateId: 2, scheduledFor: '2026-04-29' },
    { id: 3, templateId: 3, scheduledFor: '2026-05-01' },
    { id: 4, templateId: 1, scheduledFor: '2026-05-04' },
  ],
  workouts: [
    { id: 1, name: 'Full Body A', date: '25 Nis 2026', status: 'COMPLETED', sets: 18, comments: 2, duration: 62 },
    { id: 2, name: 'Upper Body Push', date: '23 Nis 2026', status: 'COMPLETED', sets: 15, comments: 1, duration: 48 },
    { id: 3, name: 'Lower Body', date: '21 Nis 2026', status: 'ABANDONED', sets: 8, comments: 0, duration: 25 },
    { id: 4, name: 'Full Body B', date: '18 Nis 2026', status: 'COMPLETED', sets: 20, comments: 3, duration: 70 },
    { id: 5, name: 'Upper Body Pull', date: '16 Nis 2026', status: 'COMPLETED', sets: 14, comments: 1, duration: 45 },
    { id: 6, name: 'Cardio & Core', date: '14 Nis 2026', status: 'COMPLETED', sets: 12, comments: 0, duration: 40 },
  ],
  clients: [
    { id: 1, name: 'Selin Arslan', email: 'selin@example.com', status: 'ACCEPTED', compliance: 85, lastWorkout: '25 Nis' },
    { id: 2, name: 'Ahmet Yılmaz', email: 'ahmet@example.com', status: 'ACCEPTED', compliance: 72, lastWorkout: '24 Nis' },
    { id: 3, name: 'Fatma Demir', email: 'fatma@example.com', status: 'ACCEPTED', compliance: 91, lastWorkout: '26 Nis' },
    { id: 4, name: 'Mehmet Kaya', email: 'mehmet@example.com', status: 'PENDING', compliance: 0, lastWorkout: null },
    { id: 5, name: 'Zeynep Şahin', email: 'zeynep@example.com', status: 'PENDING', compliance: 0, lastWorkout: null },
  ],
  messages: [
    { id: 1, sender: 'coach', text: 'Merhaba Selin! Bugünkü antrenmanını tamamladın mı?', time: '10:30' },
    { id: 2, sender: 'client', text: 'Evet hocam! Full Body A\'yı bitirdim. Harika hissettim 💪', time: '10:45' },
    { id: 3, sender: 'coach', text: 'Süper! Deadlift\'te ne kadar kaldırdın?', time: '10:47' },
    { id: 4, sender: 'client', text: '100kg 3x6 yaptım, son sette biraz zorlandım.', time: '11:02' },
    { id: 5, sender: 'coach', text: 'Mükemmel ilerleme! Gelecek hafta 102.5kg deneyelim.', time: '11:05' },
  ],
  feedback: [
    { id: 1, text: 'Deadlift formunu izledim, çok iyi ilerliyorsun! Bel duruşuna dikkat etmeye devam et.', author: 'Berk Öztürk' },
    { id: 2, text: 'Pull-up sayını 10\'a çıkarman harika. Sıradaki hedef ağırlıklı pull-up olsun.', author: 'Berk Öztürk' },
  ],
  activities: [
    { id: 1, client: 'Selin Arslan', action: 'tamamladı', template: 'Full Body A', time: '2 sa önce' },
    { id: 2, client: 'Fatma Demir', action: 'tamamladı', template: 'Upper Body Push', time: '4 sa önce' },
    { id: 3, client: 'Ahmet Yılmaz', action: 'yarıda bıraktı', template: 'Lower Body', time: '1 gün önce' },
    { id: 4, client: 'Selin Arslan', action: 'tamamladı', template: 'Cardio & Core', time: '2 gün önce' },
  ],
};

// ─── Premium UI Components ─────────────────────────────
function Logo({ size = 28 }) {
  return <img src="logo.png" alt="FitCoach" style={{ width: size, height: size, objectFit: 'contain' }} />;
}

function Avatar({ name, size = 40, color = C.primary }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, boxShadow: `0 2px 8px ${color}44` }}>
      {initials}
    </div>
  );
}

function Badge({ children, color = C.primary, bg, small }) {
  return (
    <span style={{ background: bg || color + '18', color, borderRadius: 20, padding: small ? '2px 8px' : '4px 12px', fontSize: small ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block', letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

function Btn({ children, variant = 'primary', onClick, full, small, icon, disabled }) {
  const s = {
    primary: { background: C.primaryGrad, color: '#fff', border: 'none', boxShadow: `0 4px 14px ${C.primary}44` },
    secondary: { background: `linear-gradient(135deg, ${C.secondary}, ${C.secondaryLight})`, color: '#fff', border: 'none', boxShadow: `0 4px 14px ${C.secondary}44` },
    outlined: { background: 'transparent', color: C.primary, border: `1.5px solid ${C.primary}` },
    ghost: { background: C.gray100, color: C.gray600, border: 'none' },
    danger: { background: `linear-gradient(135deg, ${C.danger}, #dc2626)`, color: '#fff', border: 'none' },
    tertiary: { background: `linear-gradient(135deg, ${C.tertiary}, #1d4ed8)`, color: '#fff', border: 'none', boxShadow: `0 4px 14px ${C.tertiary}44` },
    success: { background: `linear-gradient(135deg, ${C.success}, #16a34a)`, color: '#fff', border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...s[variant], borderRadius: 12, padding: small ? '8px 14px' : '13px 20px', fontSize: small ? 13 : 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', transition: 'opacity 0.15s, transform 0.1s', fontFamily: 'Lexend, sans-serif', letterSpacing: -0.2 }}>
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

function Card({ children, style, onClick, padding = 16 }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 18, padding, boxShadow: C.cardShadow, border: C.cardBorder, cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 'none', color: C.gray800, background: C.neutral, fontFamily: 'Lexend, sans-serif', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }} />
    </div>
  );
}

function MetricCard({ label, value, sub, color = C.secondary, accent }) {
  return (
    <Card style={{ flex: 1, minWidth: 0, background: accent ? `linear-gradient(135deg, ${accent}18, ${accent}08)` : '#fff', borderLeft: accent ? `3px solid ${accent}` : C.cardBorder }} padding={14}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: C.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: accent || color, lineHeight: 1.1, letterSpacing: -1 }}>{value}</span>
        {sub && <span style={{ fontSize: 10, color: C.gray400 }}>{sub}</span>}
      </div>
    </Card>
  );
}

function Header({ title, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10, background: '#fff', borderBottom: `1px solid ${C.gray100}`, flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: C.gray100, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.gray800 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
      )}
      <span style={{ flex: 1, fontSize: 18, fontWeight: 800, color: C.gray800, letterSpacing: -0.5 }}>{title}</span>
      {right}
    </div>
  );
}

const Icon = {
  home: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>),
  calendar: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  dumbbell: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18"/></svg>),
  messages: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>),
  profile: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  templates: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  clients: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  plus: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>),
  x: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  star: (<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>),
  send: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>),
  search: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  bell: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>),
  arrow: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>),
  edit: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  copy: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>),
  trash: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>),
  assign: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>),
  coaches: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
};

function BottomNav({ active, onNavigate, role }) {
  const clientTabs = [
    { key: 'client-dashboard', label: 'Ana Sayfa', icon: Icon.home },
    { key: 'client-calendar', label: 'Takvim', icon: Icon.calendar },
    { key: 'client-coaches', label: 'Koçlar', icon: Icon.coaches },
    { key: 'client-messages', label: 'Mesajlar', icon: Icon.messages },
    { key: 'client-profile', label: 'Profil', icon: Icon.profile },
  ];
  const coachTabs = [
    { key: 'coach-dashboard', label: 'Ana Sayfa', icon: Icon.home },
    { key: 'coach-templates', label: 'Template', icon: Icon.templates },
    { key: 'coach-clients', label: 'Danışanlar', icon: Icon.clients },
    { key: 'coach-messages', label: 'Mesajlar', icon: Icon.messages },
    { key: 'coach-profile', label: 'Profil', icon: Icon.profile },
  ];
  const tabs = role === 'coach' ? coachTabs : clientTabs;
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${C.gray100}`, padding: '8px 4px 22px', flexShrink: 0 }}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <button key={tab.key} onClick={() => onNavigate(tab.key)} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: isActive ? C.primary : C.gray400, transition: 'color 0.15s', padding: '4px 0' }}>
            <div style={{ position: 'relative', padding: isActive ? '6px 14px' : '6px 10px', background: isActive ? C.primary + '15' : 'transparent', borderRadius: 12, transition: 'all 0.2s' }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: isActive ? 0 : 0 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 4px', flexShrink: 0, background: '#fff' }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill={C.gray800}><rect x="0" y="4" width="3" height="8" rx="0.5"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5"/><rect x="9" y="0.5" width="3" height="11.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/></svg>
        <svg width="16" height="12" viewBox="0 0 50 40" fill={C.gray800}><path d="M25 8C15 8 7 14 4 22c4-5 10-8 21-8s17 3 21 8c-3-8-11-14-21-14z" opacity="0.3"/><path d="M25 18c-6 0-11 3-14 7 3-3 8-5 14-5s11 2 14 5c-3-4-8-7-14-7z" opacity="0.6"/><circle cx="25" cy="32" r="5"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke={C.gray400}/><rect x="2" y="2" width="16" height="8" rx="2" fill={C.gray800}/><path d="M23.5 4.5v3a1.5 1.5 0 000-3z" fill={C.gray400}/></svg>
      </div>
    </div>
  );
}

Object.assign(window, { C, mockData, Logo, Avatar, Badge, Btn, Card, Input, MetricCard, Header, Icon, BottomNav, StatusBar });
