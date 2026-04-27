// FitCoach OS — Auth Screens v2 (with logo, premium)

function LandingScreen({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.secondary, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 360, height: 360, borderRadius: '50%', background: C.primary, opacity: 0.12 }} />
        <div style={{ position: 'absolute', top: 200, left: -80, width: 240, height: 240, borderRadius: '50%', background: C.tertiary, opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: 160, right: -60, width: 220, height: 220, borderRadius: '50%', background: C.primary, opacity: 0.08 }} />
        {/* Grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }} viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
          {[0,1,2,3,4,5].map(i => <line key={i} x1={i*80} y1="0" x2={i*80} y2="900" stroke="white" strokeWidth="1"/>)}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => <line key={i} x1="0" y1={i*90} x2="400" y2={i*90} stroke="white" strokeWidth="1"/>)}
        </svg>
      </div>

      {/* Logo + Brand */}
      <div style={{ padding: '52px 28px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <img src="logo.png" alt="FitCoach" style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(249,115,22,0.5))' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>FitCoach OS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, fontWeight: 500, textTransform: 'uppercase', marginTop: 2 }}>Performance Platform</div>
          </div>
        </div>

        <div style={{ width: 40, height: 2, background: C.primary, borderRadius: 2, marginBottom: 24 }} />
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.12, margin: '0 0 14px', letterSpacing: -1.5 }}>
          Antrenmanını<br/>
          <span style={{ background: C.primaryGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Yönet.</span> Sonuçları<br/>
          Takip Et.
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.7, maxWidth: 280 }}>
          Koç ve danışanları birleştiren modern fitness ekosistemi.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1, padding: '0 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
          {[
            { emoji: '💪', label: 'Program Takibi', sub: 'Kişisel antrenman şablonları' },
            { emoji: '📊', label: 'Anlık İlerleme', sub: 'Gerçek zamanlı veriler' },
            { emoji: '💬', label: 'Koç İletişimi', sub: 'Anlık mesajlaşma' },
            { emoji: '🎯', label: 'Hedef Odaklı', sub: 'Kişisel programlar' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 28px 44px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        <Btn variant="primary" full onClick={() => onNavigate('login', { role: 'client' })}>
          Danışan Olarak Başla →
        </Btn>
        <Btn variant="secondary" full onClick={() => onNavigate('login', { role: 'coach' })}>
          Koç Olarak Giriş Yap
        </Btn>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          Hesap yok mu?{' '}
          <span style={{ color: C.primaryLight, cursor: 'pointer', fontWeight: 600 }} onClick={() => onNavigate('register')}>Üye ol</span>
        </p>
      </div>
    </div>
  );
}

function LoginScreen({ onNavigate, params }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const role = params?.role || 'client';
  const isCoach = role === 'coach';

  function handleLogin() {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNavigate(isCoach ? 'coach-dashboard' : 'client-dashboard', { role }); }, 900);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      {/* Hero header */}
      <div style={{ background: isCoach ? `linear-gradient(160deg, ${C.secondary}, ${C.secondaryLight})` : `linear-gradient(160deg, ${C.primary}, ${C.primaryDark})`, padding: '28px 24px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <button onClick={() => onNavigate('landing')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', marginBottom: 24 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="logo.png" alt="FitCoach" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>FitCoach OS</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          {isCoach ? 'Koç Girişi' : 'Danışan Girişi'}
        </div>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -0.8 }}>Tekrar Hoşgeldin 👋</h2>
      </div>

      <div style={{ padding: '0 20px', marginTop: -24, flex: 1 }}>
        <Card style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" />
            <Input label="Şifre" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <span style={{ fontSize: 12, color: C.primary, cursor: 'pointer', fontWeight: 700 }}>Şifremi unuttum?</span>
            </div>
            <Btn variant={isCoach ? 'secondary' : 'primary'} full onClick={handleLogin} disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Btn>
          </div>
        </Card>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.gray200 }} />
            <span style={{ fontSize: 11, color: C.gray400, fontWeight: 600 }}>Demo Giriş</span>
            <div style={{ flex: 1, height: 1, background: C.gray200 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" small full onClick={() => onNavigate('client-dashboard', { role: 'client' })}>
              👤 Danışan
            </Btn>
            <Btn variant="ghost" small full onClick={() => onNavigate('coach-dashboard', { role: 'coach' })}>
              🏋️ Koç
            </Btn>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: C.gray600, marginTop: 20 }}>
          Hesabın yok mu?{' '}
          <span style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('register')}>Üye Ol</span>
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({ onNavigate }) {
  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  if (step === 1) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      <div style={{ background: '#fff', padding: '28px 20px 24px', borderBottom: `1px solid ${C.gray100}` }}>
        <button onClick={() => onNavigate('landing')} style={{ background: C.gray100, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.gray800, marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <img src="logo.png" alt="FitCoach" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.gray800 }}>FitCoach OS</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.gray800, margin: '0 0 4px', letterSpacing: -0.5 }}>Hesap Oluştur</h2>
        <p style={{ fontSize: 13, color: C.gray400, margin: 0 }}>Platformda nasıl yer almak istiyorsun?</p>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {[
          { r: 'client', emoji: '🏃', title: 'Danışan', desc: 'Koç bul, antrenman yap, ilerleni takip et.', color: C.primary },
          { r: 'coach', emoji: '🏋️', title: 'Koç', desc: 'Danışan yönet, program oluştur, ilerlemeyi izle.', color: C.secondary },
        ].map(({ r, emoji, title, desc, color }) => (
          <div key={r} onClick={() => { setRole(r); setStep(2); }}
            style={{ background: '#fff', borderRadius: 18, padding: 20, border: `2px solid ${C.gray100}`, cursor: 'pointer', boxShadow: C.cardShadow, display: 'flex', gap: 16, alignItems: 'center', transition: 'border-color 0.15s' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${color}20, ${color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: `1px solid ${color}20` }}>{emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.gray800, letterSpacing: -0.3 }}>{title}</div>
              <div style={{ fontSize: 13, color: C.gray400, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{Icon.arrow}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const isCoach = role === 'coach';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      <div style={{ background: isCoach ? `linear-gradient(160deg, ${C.secondary}, ${C.secondaryLight})` : `linear-gradient(160deg, ${C.primary}, ${C.primaryDark})`, padding: '24px 20px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Bilgilerini Gir</h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '4px 0 0' }}>{isCoach ? 'Koç' : 'Danışan'} hesabı oluşturuyorsun</p>
      </div>
      <div style={{ padding: '0 20px', marginTop: -20, flex: 1 }}>
        <Card style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Ad Soyad" value={name} onChange={e => setName(e.target.value)} placeholder="Adınızı girin" />
            <Input label="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" />
            <Input label="Şifre" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter" />
            <div style={{ height: 1, background: C.gray100 }} />
            <Btn variant={isCoach ? 'secondary' : 'primary'} full onClick={() => onNavigate(isCoach ? 'coach-dashboard' : 'client-dashboard', { role })}>
              Hesabı Oluştur →
            </Btn>
          </div>
        </Card>
        <p style={{ textAlign: 'center', fontSize: 13, color: C.gray600, marginTop: 16 }}>
          Zaten hesabın var mı?{' '}
          <span style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('login')}>Giriş Yap</span>
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { LandingScreen, LoginScreen, RegisterScreen });
