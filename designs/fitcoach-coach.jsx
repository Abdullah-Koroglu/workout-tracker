// FitCoach OS — Coach Screens

function CoachDashboard({ onNavigate }) {
  const accepted = mockData.clients.filter(c => c.status === 'ACCEPTED');
  const pending = mockData.clients.filter(c => c.status === 'PENDING');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: C.neutral }}>
      {/* Hero */}
      <div style={{ background: C.secondary, padding: '16px 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Koç Paneli</p>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Berk Öztürk</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>{Icon.bell}</div>
              {pending.length > 0 && <div style={{ position: 'absolute', top: -2, right: -2, background: C.primary, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{pending.length}</div>}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Aktif Danışan', val: accepted.length, sub: '+1 bu ay', color: '#fff' },
            { label: 'Uyumluluk', val: '82%', sub: 'Optimum aralık', color: C.primaryLight },
            { label: 'Bugün', val: '3', sub: '1 bekliyor', color: '#fff' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Pending Requests */}
        {pending.length > 0 && (
          <Card style={{ borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Yeni Talepler</span>
              <Badge color={C.primary}>{pending.length}</Badge>
            </div>
            {pending.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar name={c.name} size={40} color={C.secondary} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.gray400 }}>{c.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ width: 32, height: 32, borderRadius: 8, background: C.success + '20', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.success }}>{Icon.check}</button>
                  <button style={{ width: 32, height: 32, borderRadius: 8, background: C.danger + '20', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.danger }}>{Icon.x}</button>
                </div>
              </div>
            ))}
            <Btn variant="outlined" small full onClick={() => onNavigate('coach-clients')}>Tümünü Gör</Btn>
          </Card>
        )}

        {/* Recent Activity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Son Aktiviteler</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockData.activities.map(a => (
              <Card key={a.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={a.client} size={36} color={a.action === 'tamamladı' ? C.success : C.warning} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.gray800 }}>
                    <strong>{a.client}</strong> <span style={{ color: a.action === 'tamamladı' ? C.success : C.warning }}>{a.action}</span> — {a.template}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{a.time}</div>
                </div>
                <div style={{ color: C.gray300 }}>{Icon.arrow}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Clients Quick Access */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Danışanlar</span>
            <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('coach-clients')}>Tümü →</span>
          </div>
          {accepted.slice(0, 3).map(c => (
            <Card key={c.id} padding={14} onClick={() => onNavigate('coach-client-progress', { clientId: c.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Avatar name={c.name} size={40} color={C.secondary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.gray400 }}>Son: {c.lastWorkout}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: c.compliance >= 80 ? C.success : C.warning }}>%{c.compliance}</div>
                <div style={{ fontSize: 10, color: C.gray400 }}>uyumluluk</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatesScreen({ onNavigate }) {
  const [showActions, setShowActions] = React.useState(null);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Template'ler" right={
        <Btn small variant="primary" icon={Icon.plus} onClick={() => onNavigate('coach-template-new')}>Yeni</Btn>
      } />
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 13, color: C.gray400, margin: '8px 0' }}>Antrenman şablonlarını düzenle, kopyala ve danışanlara ata.</p>
        {mockData.templates.map(t => (
          <Card key={t.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.gray800, margin: 0 }}>{t.name}</h3>
                <span style={{ fontSize: 12, color: C.gray400 }}>{t.exercises.length} egzersiz</span>
              </div>
              <button onClick={() => setShowActions(showActions === t.id ? null : t.id)} style={{ background: C.gray100, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray600 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {t.exercises.map((ex, i) => (
                <span key={i} style={{ background: ex.type === 'WEIGHT' ? C.secondary + '12' : C.tertiary + '15', color: ex.type === 'WEIGHT' ? C.secondary : C.tertiary, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {ex.name}
                </span>
              ))}
            </div>
            {showActions === t.id && (
              <div style={{ background: C.gray100, borderRadius: 12, padding: 6, display: 'flex', gap: 6 }}>
                {[
                  { icon: Icon.edit, label: 'Düzenle', color: C.tertiary, action: () => onNavigate('coach-template-edit', { templateId: t.id }) },
                  { icon: Icon.assign, label: 'Ata', color: C.primary, action: () => onNavigate('coach-template-assign', { templateId: t.id }) },
                  { icon: Icon.copy, label: 'Kopyala', color: C.secondary, action: () => {} },
                  { icon: Icon.trash, label: 'Sil', color: C.danger, action: () => {} },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} style={{ flex: 1, background: '#fff', border: 'none', borderRadius: 10, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: a.color }}>
                    {a.icon}
                    <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Lexend, sans-serif', color: a.color }}>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewTemplateScreen({ onNavigate }) {
  const [name, setName] = React.useState('');
  const [exercises, setExercises] = React.useState([
    { name: '', type: 'WEIGHT', sets: '4', reps: '8', rir: '2', duration: '20' }
  ]);

  function addExercise() {
    setExercises([...exercises, { name: '', type: 'WEIGHT', sets: '4', reps: '8', rir: '2', duration: '20' }]);
  }
  function removeExercise(i) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }
  function updateEx(i, key, val) {
    setExercises(exercises.map((ex, idx) => idx === i ? { ...ex, [key]: val } : ex));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Yeni Template" onBack={() => onNavigate('coach-templates')} right={
        <Btn small variant="primary" onClick={() => onNavigate('coach-templates')}>Kaydet</Btn>
      } />
      <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <Input label="Template Adı" value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Full Body A" />
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Egzersizler</span>
          <Btn small variant="outlined" icon={Icon.plus} onClick={addExercise}>Ekle</Btn>
        </div>

        {exercises.map((ex, i) => (
          <Card key={i} style={{ borderTop: `3px solid ${ex.type === 'WEIGHT' ? C.secondary : C.tertiary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.gray400 }}>Egzersiz {i + 1}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={ex.type} onChange={e => updateEx(i, 'type', e.target.value)} style={{ border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: '4px 8px', fontSize: 12, fontFamily: 'Lexend, sans-serif', outline: 'none', background: C.neutral, color: C.gray600 }}>
                  <option value="WEIGHT">Ağırlık</option>
                  <option value="CARDIO">Kardiyo</option>
                </select>
                {exercises.length > 1 && (
                  <button onClick={() => removeExercise(i)} style={{ background: C.danger + '15', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.danger }}>{Icon.x}</button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="Egzersiz Adı" value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} placeholder="Örn: Squat" />
              {ex.type === 'WEIGHT' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <Input label="Set" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} />
                  <Input label="Tekrar" value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} />
                  <Input label="RIR" value={ex.rir} onChange={e => updateEx(i, 'rir', e.target.value)} />
                </div>
              ) : (
                <Input label="Süre (dk)" value={ex.duration} onChange={e => updateEx(i, 'duration', e.target.value)} />
              )}
            </div>
          </Card>
        ))}
        <Btn variant="primary" full onClick={() => onNavigate('coach-templates')}>Template Oluştur</Btn>
      </div>
    </div>
  );
}

function TemplateAssignScreen({ onNavigate, params }) {
  const template = mockData.templates.find(t => t.id === params?.templateId) || mockData.templates[0];
  const [selectedClients, setSelectedClients] = React.useState([]);
  const [date, setDate] = React.useState('2026-04-30');
  const [recurring, setRecurring] = React.useState(false);
  const accepted = mockData.clients.filter(c => c.status === 'ACCEPTED');

  function toggle(id) {
    setSelectedClients(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Template Ata" onBack={() => onNavigate('coach-templates')} />
      <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ borderLeft: `4px solid ${C.primary}` }}>
          <div style={{ fontSize: 13, color: C.gray400, marginBottom: 4 }}>Seçilen Template</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gray800 }}>{template.name}</div>
          <div style={{ fontSize: 12, color: C.gray400 }}>{template.exercises.length} egzersiz</div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Danışan Seç</div>
          {accepted.map(c => (
            <div key={c.id} onClick={() => toggle(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.gray100}`, cursor: 'pointer' }}>
              <Avatar name={c.name} size={36} color={C.secondary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.gray400 }}>{c.email}</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${selectedClients.includes(c.id) ? C.primary : C.gray300}`, background: selectedClients.includes(c.id) ? C.primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.15s' }}>
                {selectedClients.includes(c.id) && Icon.check}
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zamanlama</div>
          <Input label="Tarih" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.gray800 }}>Tekrarlayan Antrenman</div>
              <div style={{ fontSize: 12, color: C.gray400 }}>Her hafta aynı günde tekrarla</div>
            </div>
            <div onClick={() => setRecurring(!recurring)} style={{ width: 44, height: 24, borderRadius: 12, background: recurring ? C.primary : C.gray300, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: recurring ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </Card>
        <Btn variant="primary" full disabled={selectedClients.length === 0} onClick={() => onNavigate('coach-templates')}>
          {selectedClients.length === 0 ? 'Danışan Seç' : `${selectedClients.length} Danışana Ata`}
        </Btn>
      </div>
    </div>
  );
}

function CoachClientsScreen({ onNavigate }) {
  const [tab, setTab] = React.useState('accepted');
  const accepted = mockData.clients.filter(c => c.status === 'ACCEPTED');
  const pending = mockData.clients.filter(c => c.status === 'PENDING');
  const list = tab === 'accepted' ? accepted : pending;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Danışanlar" />
      <div style={{ padding: '0 16px', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, marginTop: 12 }}>
          <MetricCard label="Toplam" value={mockData.clients.length} />
          <MetricCard label="Aktif" value={accepted.length} color={C.success} />
          <MetricCard label="Bekleyen" value={pending.length} color={C.warning} />
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', background: C.gray100, borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {[{ key: 'accepted', label: `Aktif (${accepted.length})` }, { key: 'pending', label: `Bekleyen (${pending.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontFamily: 'Lexend, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? C.gray800 : C.gray400, boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(c => (
            <Card key={c.id} onClick={tab === 'accepted' ? () => onNavigate('coach-client-progress', { clientId: c.id }) : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={c.name} size={44} color={C.secondary} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.gray400 }}>{c.email}</div>
                  {tab === 'accepted' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 4, background: C.gray100, borderRadius: 2, maxWidth: 80 }}>
                        <div style={{ width: `${c.compliance}%`, height: 4, background: c.compliance >= 80 ? C.success : C.warning, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: c.compliance >= 80 ? C.success : C.warning, fontWeight: 700 }}>%{c.compliance}</span>
                    </div>
                  )}
                </div>
                {tab === 'accepted' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); onNavigate('coach-messages'); }} style={{ width: 32, height: 32, background: C.tertiary + '15', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.tertiary }}>{Icon.messages}</button>
                    <div style={{ color: C.gray300 }}>{Icon.arrow}</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ width: 32, height: 32, background: C.success + '15', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.success }}>{Icon.check}</button>
                    <button style={{ width: 32, height: 32, background: C.danger + '15', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.danger }}>{Icon.x}</button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function ClientProgressScreen({ onNavigate, params }) {
  const client = mockData.clients.find(c => c.id === params?.clientId) || mockData.clients[0];
  const [comment, setComment] = React.useState('');
  const weeks = [82, 65, 75, 88, 91, 85, 82];
  const maxVal = Math.max(...weeks);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Danışan İlerlemesi" onBack={() => onNavigate('coach-clients')} />
      <div style={{ background: C.secondary, padding: '16px 20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <Avatar name={client.name} size={56} color={C.primary} />
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>{client.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '4px 0 0' }}>{client.email}</p>
          <Badge color={C.primaryLight} bg={C.primary + '30'}>{client.compliance}% Uyumluluk</Badge>
        </div>
      </div>
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Compliance Chart */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800, marginBottom: 14 }}>7 Haftalık Uyumluluk</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: i === weeks.length - 1 ? C.primary : C.primary + '40', borderRadius: '4px 4px 0 0', height: `${(w / maxVal) * 70}px`, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 9, color: C.gray400 }}>H{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Workout History */}
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800, display: 'block', marginBottom: 10 }}>Son Antrenmanlar</span>
          {mockData.workouts.slice(0, 4).map(w => (
            <Card key={w.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: w.status === 'COMPLETED' ? C.success + '18' : C.warning + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {w.status === 'COMPLETED' ? '✅' : '⚠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: C.gray400 }}>{w.date} · {w.sets} set · {w.duration} dk</div>
              </div>
              <Badge small color={w.status === 'COMPLETED' ? C.success : C.warning}>{w.status === 'COMPLETED' ? 'Tamam' : 'Yarıda'}</Badge>
            </Card>
          ))}
        </div>

        {/* Add Feedback */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800, marginBottom: 12 }}>Yorum Ekle</div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Antrenman hakkında yorumun..." style={{ width: '100%', border: `1.5px solid ${C.gray200}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontFamily: 'Lexend, sans-serif', outline: 'none', color: C.gray800, background: C.neutral, resize: 'none', height: 80, boxSizing: 'border-box' }} />
          <div style={{ marginTop: 10 }}>
            <Btn variant="primary" full small onClick={() => setComment('')} disabled={!comment.trim()}>Yorumu Gönder</Btn>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="outlined" full small onClick={() => onNavigate('coach-template-assign', { clientId: client.id })}>Program Ata</Btn>
          <Btn variant="secondary" full small onClick={() => onNavigate('coach-messages')}>Mesaj Gönder</Btn>
        </div>
      </div>
    </div>
  );
}

function CoachMessagesScreen({ onNavigate }) {
  const [activeClient, setActiveClient] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const [msgs, setMsgs] = React.useState(mockData.messages);
  const endRef = React.useRef(null);
  React.useEffect(() => { endRef.current?.scrollIntoView(); }, [msgs]);

  const accepted = mockData.clients.filter(c => c.status === 'ACCEPTED');

  function send() {
    if (!msg.trim()) return;
    setMsgs([...msgs, { id: msgs.length + 1, sender: 'coach', text: msg, time: '11:10' }]);
    setMsg('');
  }

  if (activeClient) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.gray100}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setActiveClient(null)} style={{ background: C.gray100, border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.gray800 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <Avatar name={activeClient.name} size={36} color={C.secondary} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>{activeClient.name}</div>
          <div style={{ fontSize: 11, color: C.success }}>● Çevrimiçi</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'coach' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '78%', background: m.sender === 'coach' ? C.secondary : '#fff', borderRadius: m.sender === 'coach' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 14, color: m.sender === 'coach' ? '#fff' : C.gray800, margin: 0, lineHeight: 1.4 }}>{m.text}</p>
              <span style={{ fontSize: 10, color: m.sender === 'coach' ? 'rgba(255,255,255,0.6)' : C.gray400, display: 'block', textAlign: 'right', marginTop: 4 }}>{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ background: '#fff', borderTop: `1px solid ${C.gray100}`, padding: '10px 16px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Mesaj yaz..." style={{ flex: 1, border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'Lexend, sans-serif', color: C.gray800, background: C.neutral }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: 12, background: C.secondary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>{Icon.send}</button>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Mesajlar" />
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accepted.map(c => (
          <Card key={c.id} onClick={() => setActiveClient(c)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={c.name} size={46} color={C.secondary} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: C.success, borderRadius: '50%', border: '2px solid #fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>Bugünkü antrenmanını tamamladın mı?</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, color: C.gray400 }}>10:30</span>
              <div style={{ width: 18, height: 18, background: C.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>2</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CoachProfileScreen({ onNavigate }) {
  const [bio, setBio] = React.useState('ISSA sertifikalı kişisel antrenör. Sporcuların maksimum güç ve hacim hedeflerine ulaşmalarına yardımcı oluyorum.');
  const [saved, setSaved] = React.useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <div style={{ background: C.secondary, padding: '20px 20px 32px', textAlign: 'center' }}>
        <Avatar name="Berk Öztürk" size={72} color={C.primary} />
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '12px 0 2px' }}>Berk Öztürk</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>berk@fitcoach.app</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14 }}>
          {[{ label: 'Danışan', val: 12 }, { label: 'Yıl', val: 7 }, { label: 'Template', val: 3 }].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{m.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px', marginTop: -14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Profil Bilgileri</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Ad Soyad" value="Berk Öztürk" onChange={() => {}} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 6 }}>Hakkımda</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} style={{ width: '100%', border: `1.5px solid ${C.gray200}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontFamily: 'Lexend, sans-serif', outline: 'none', color: C.gray800, background: C.neutral, resize: 'none', height: 90, boxSizing: 'border-box' }} />
            </div>
            <Input label="Deneyim (Yıl)" value="7" onChange={() => {}} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 8 }}>Uzmanlıklar</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Güç Antrenmanı', 'Hacim Kazanma', 'Sporcu Performansı'].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.secondary + '12', borderRadius: 20, padding: '5px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.secondary }}>{s}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                  </div>
                ))}
                <button style={{ background: C.gray100, border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: C.gray400, cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>+ Ekle</button>
              </div>
            </div>
          </div>
        </Card>
        <Btn variant="secondary" full onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✓ Kaydedildi!' : 'Profili Güncelle'}
        </Btn>
        <Card padding={14}>
          {[
            { label: '📦 Paketlerim', sub: '3 aktif paket' },
            { label: '🔔 Bildirimler', sub: 'Danışan aktiviteleri' },
            { label: '🔒 Şifre Değiştir', sub: 'Güvenlik ayarları' },
            { label: '🚪 Çıkış Yap', sub: 'Hesaptan çıkış', danger: true },
          ].map((item, i, arr) => (
            <div key={i} onClick={item.danger ? () => onNavigate('landing') : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.gray100}` : 'none', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: item.danger ? C.danger : C.gray800 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: C.gray400 }}>{item.sub}</div>
              </div>
              <span style={{ color: C.gray300 }}>{Icon.arrow}</span>
            </div>
          ))}
        </Card>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

Object.assign(window, {
  CoachDashboard, TemplatesScreen, NewTemplateScreen, TemplateAssignScreen,
  CoachClientsScreen, ClientProgressScreen, CoachMessagesScreen, CoachProfileScreen
});
