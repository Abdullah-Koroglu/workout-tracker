// FitCoach OS — Client Screens

function ClientDashboard({ onNavigate }) {
  const todayAssignment = mockData.assignments[0];
  const todayTemplate = mockData.templates.find(t => t.id === todayAssignment.templateId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: C.neutral }}>
      {/* Hero */}
      <div style={{ background: C.secondary, padding: '16px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Merhaba,</p>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>Selin 👋</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>{Icon.bell}</div>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: C.primary, borderRadius: '50%', border: '2px solid ' + C.secondary }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Aktif Koç', val: '1' },
            { label: 'Program', val: '3' },
            { label: 'Tamamlanan', val: '24' },
            { label: 'Yorum', val: '2' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{m.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 1.2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Today's Workout */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Bugün</span>
            <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('client-calendar')}>Takvimi Gör →</span>
          </div>
          <Card onClick={() => onNavigate('client-workout-start', { assignmentId: todayAssignment.id })} style={{ borderLeft: `4px solid ${C.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <Badge small color={C.primary}>Bugün</Badge>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.gray800, margin: '6px 0 0' }}>{todayTemplate.name}</h3>
              </div>
              <div style={{ background: C.primary, borderRadius: 12, padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Başla →</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {todayTemplate.exercises.map((ex, i) => (
                <span key={i} style={{ background: C.gray100, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: C.gray600, fontWeight: 500 }}>
                  {ex.type === 'WEIGHT' ? `${ex.name} ${ex.sets}×${ex.reps}` : `${ex.name} ${ex.duration}dk`}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Yaklaşan</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockData.assignments.slice(1, 3).map(a => {
              const tmpl = mockData.templates.find(t => t.id === a.templateId);
              return (
                <Card key={a.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: C.gray100, borderRadius: 10, padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: C.gray400, fontWeight: 500 }}>{a.scheduledFor.slice(5).replace('-', ' ').replace('04', 'Nis').replace('05', 'May')}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{tmpl.name}</div>
                    <div style={{ fontSize: 12, color: C.gray400 }}>{tmpl.exercises.length} egzersiz</div>
                  </div>
                  <Badge small color={C.gray400} bg={C.gray100}>Yaklaşıyor</Badge>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Workouts */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Son Antrenmanlar</span>
            <span style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('client-workouts')}>Tümü →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockData.workouts.slice(0, 3).map(w => (
              <Card key={w.id} padding={14} onClick={() => onNavigate('client-workout-detail', { workoutId: w.id })} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: w.status === 'COMPLETED' ? C.success + '20' : C.warning + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {w.status === 'COMPLETED' ? <span style={{ color: C.success, display: 'flex' }}>{Icon.check}</span> : <span style={{ fontSize: 16 }}>⚠️</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: C.gray400 }}>{w.date} · {w.duration} dk</div>
                </div>
                <div style={{ color: C.gray300 }}>{Icon.arrow}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Coach Feedback */}
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800, display: 'block', marginBottom: 10 }}>Koç Yorumları</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockData.feedback.map(f => (
              <Card key={f.id} padding={14} style={{ borderLeft: `3px solid ${C.tertiary}` }}>
                <p style={{ fontSize: 13, color: C.gray600, margin: '0 0 8px', lineHeight: 1.5 }}>{f.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={f.author} size={20} color={C.secondary} />
                  <span style={{ fontSize: 12, color: C.gray400, fontWeight: 600 }}>{f.author}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientWorkoutsScreen({ onNavigate }) {
  const completed = mockData.workouts.filter(w => w.status === 'COMPLETED').length;
  const abandoned = mockData.workouts.filter(w => w.status === 'ABANDONED').length;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Antrenman Geçmişi" />
      <div style={{ padding: 16, display: 'flex', gap: 10, marginBottom: 4 }}>
        <MetricCard label="Toplam" value={mockData.workouts.length} />
        <MetricCard label="Tamamlanan" value={completed} color={C.success} />
        <MetricCard label="Yarıda" value={abandoned} color={C.warning} />
      </div>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mockData.workouts.map(w => (
          <Card key={w.id} onClick={() => onNavigate('client-workout-detail', { workoutId: w.id })} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: w.status === 'COMPLETED' ? C.success + '18' : C.warning + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>{w.status === 'COMPLETED' ? '✅' : '⚠️'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{w.date} · {w.sets} set · {w.duration} dk</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Badge small color={w.status === 'COMPLETED' ? C.success : C.warning}>{w.status === 'COMPLETED' ? 'Tamamlandı' : 'Yarıda'}</Badge>
              {w.comments > 0 && <span style={{ fontSize: 11, color: C.tertiary }}>💬 {w.comments}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorkoutDetailScreen({ onNavigate, params }) {
  const workout = mockData.workouts.find(w => w.id === params?.workoutId) || mockData.workouts[0];
  const template = mockData.templates[0];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title={workout.name} onBack={() => onNavigate('client-workouts')} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around' }}>
            {[{ label: 'Tarih', val: workout.date }, { label: 'Süre', val: workout.duration + ' dk' }, { label: 'Set', val: workout.sets }].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.secondary }}>{m.val}</div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.gray800, display: 'block', marginBottom: 8 }}>Egzersizler</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {template.exercises.map((ex, i) => (
              <Card key={i} padding={14}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{ex.name}</div>
                    <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>
                      {ex.type === 'WEIGHT' ? `${ex.sets} set × ${ex.reps} rep · RIR ${ex.rir}` : `${ex.duration} dakika`}
                    </div>
                  </div>
                  <Badge small color={ex.type === 'WEIGHT' ? C.secondary : C.tertiary}>{ex.type === 'WEIGHT' ? 'Ağırlık' : 'Kardiyo'}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {workout.comments > 0 && (
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.gray800, display: 'block', marginBottom: 8 }}>Koç Yorumu</span>
            {mockData.feedback.slice(0, workout.comments).map(f => (
              <Card key={f.id} padding={14} style={{ borderLeft: `3px solid ${C.tertiary}` }}>
                <p style={{ fontSize: 13, color: C.gray600, margin: '0 0 8px', lineHeight: 1.5 }}>{f.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={f.author} size={20} color={C.secondary} />
                  <span style={{ fontSize: 12, color: C.gray400, fontWeight: 600 }}>{f.author}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutExecutionScreen({ onNavigate, params }) {
  const template = mockData.templates[0];
  const exercises = template.exercises.filter(e => e.type === 'WEIGHT');
  const [exIdx, setExIdx] = React.useState(0);
  const [setIdx, setSetIdx] = React.useState(0);
  const [weight, setWeight] = React.useState('80');
  const [reps, setReps] = React.useState('8');
  const [done, setDone] = React.useState([]);
  const [resting, setResting] = React.useState(false);
  const [restTime, setRestTime] = React.useState(90);
  const [timer, setTimer] = React.useState(90);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    if (!resting) return;
    if (timer <= 0) { setResting(false); setTimer(90); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resting, timer]);

  const ex = exercises[exIdx];
  const progress = (exIdx / exercises.length) * 100 + (setIdx / (ex?.sets || 1)) * (100 / exercises.length);

  function logSet() {
    setDone([...done, { ex: ex.name, set: setIdx + 1, weight, reps }]);
    if (setIdx + 1 >= ex.sets) {
      if (exIdx + 1 >= exercises.length) { setCompleted(true); return; }
      setExIdx(exIdx + 1); setSetIdx(0);
    } else {
      setSetIdx(setIdx + 1);
    }
    setResting(true); setTimer(90);
  }

  if (completed) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.secondary, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Antrenman Tamamlandı!</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 32 }}>{done.length} set kayıt edildi</p>
      <Btn variant="primary" full onClick={() => onNavigate('client-dashboard')}>Ana Sayfaya Dön</Btn>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      <div style={{ background: C.secondary, padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => onNavigate('client-dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Çıkış</button>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{exIdx + 1}/{exercises.length} egzersiz</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, height: 6, marginBottom: 14 }}>
          <div style={{ background: C.primary, height: 6, borderRadius: 8, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{ex.name}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Set {setIdx + 1}/{ex.sets} · Hedef: {ex.reps} rep · RIR {ex.rir}</p>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {resting ? (
          <Card style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: C.primary, lineHeight: 1 }}>{timer}</div>
            <div style={{ fontSize: 14, color: C.gray400, marginTop: 8 }}>saniye dinlenme</div>
            <div style={{ marginTop: 20 }}>
              <Btn variant="outlined" small onClick={() => { setResting(false); setTimer(90); }}>Atla</Btn>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.gray400 }}>Ağırlık (kg)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setWeight(w => Math.max(0, parseFloat(w) - 2.5).toString())} style={{ width: 32, height: 32, borderRadius: 8, background: C.gray100, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.gray800 }}>{weight}</span>
                  <button onClick={() => setWeight(w => (parseFloat(w) + 2.5).toString())} style={{ width: 32, height: 32, borderRadius: 8, background: C.gray100, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.gray400 }}>Tekrar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setReps(r => Math.max(1, parseInt(r) - 1).toString())} style={{ width: 32, height: 32, borderRadius: 8, background: C.gray100, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 800, color: C.gray800 }}>{reps}</span>
                  <button onClick={() => setReps(r => (parseInt(r) + 1).toString())} style={{ width: 32, height: 32, borderRadius: 8, background: C.gray100, border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {done.length > 0 && (
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.gray400, display: 'block', marginBottom: 8 }}>Kaydedilen Setler</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {done.slice(-3).map((d, i) => (
                <Card key={i} padding={12} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: C.gray600 }}>{d.ex} · Set {d.set}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.gray800 }}>{d.weight}kg × {d.reps}</span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 20px', flexShrink: 0 }}>
        {!resting && <Btn variant="primary" full onClick={logSet}>Set Kaydet ✓</Btn>}
      </div>
    </div>
  );
}

function CalendarScreen({ onNavigate }) {
  const [selectedDay, setSelectedDay] = React.useState(27);
  const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const firstDay = 2; // April 1 = Wednesday index 2
  const assignedDays = [27, 29];

  function getDayAssignments(day) {
    return mockData.assignments.filter(a => {
      const d = parseInt(a.scheduledFor.slice(-2));
      const m = parseInt(a.scheduledFor.slice(5, 7));
      return d === day && m === 4;
    });
  }

  const selAssignments = getDayAssignments(selectedDay);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Takvim" />
      <Card style={{ margin: '12px 16px', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray400, fontSize: 20 }}>‹</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.gray800 }}>Nisan 2026</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray400, fontSize: 20 }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {days.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.gray400, padding: '4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
          {daysInMonth.map(day => {
            const isSelected = day === selectedDay;
            const isToday = day === 27;
            const hasWorkout = assignedDays.includes(day);
            return (
              <div key={day} onClick={() => setSelectedDay(day)} style={{ textAlign: 'center', padding: '7px 0', borderRadius: 10, cursor: 'pointer', background: isSelected ? C.primary : isToday ? C.primary + '15' : 'transparent', position: 'relative' }}>
                <span style={{ fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400, color: isSelected ? '#fff' : isToday ? C.primary : C.gray800 }}>{day}</span>
                {hasWorkout && !isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.primary, margin: '2px auto 0' }} />}
                {hasWorkout && isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', margin: '2px auto 0' }} />}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ padding: '0 16px 24px' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.gray800, display: 'block', marginBottom: 10 }}>
          {selectedDay} Nisan{selAssignments.length > 0 ? ` — ${selAssignments.length} antrenman` : ' — Antrenman yok'}
        </span>
        {selAssignments.length === 0 ? (
          <Card padding={20} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😴</div>
            <p style={{ color: C.gray400, fontSize: 13, margin: 0 }}>Bu gün için antrenman atanmamış.</p>
          </Card>
        ) : (
          selAssignments.map(a => {
            const tmpl = mockData.templates.find(t => t.id === a.templateId);
            return (
              <Card key={a.id} style={{ borderLeft: `4px solid ${C.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: C.gray800, margin: 0 }}>{tmpl.name}</h3>
                  <Btn small variant="primary" onClick={() => onNavigate('client-workout-start')}>Başla</Btn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tmpl.exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.gray600 }}>
                      <span>{ex.name}</span>
                      <span style={{ fontWeight: 600 }}>{ex.type === 'WEIGHT' ? `${ex.sets}×${ex.reps} RIR${ex.rir}` : `${ex.duration} dk`}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function MarketplaceScreen({ onNavigate }) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState(null);
  const specialties = ['Kilo Verme', 'Güç Antrenmanı', 'Hacim Kazanma', 'Kardiyovasküler', 'Sporcu Performansı'];
  const filtered = mockData.coaches.filter(c =>
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase())) &&
    (filter === null || c.specialties.includes(filter))
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Koç Bul" />
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: '10px 14px', border: `1.5px solid ${C.gray200}` }}>
          <span style={{ color: C.gray400 }}>{Icon.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Koç adı ile ara..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontFamily: 'Lexend, sans-serif', background: 'transparent', color: C.gray800 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFilter(null)} style={{ background: filter === null ? C.primary : '#fff', color: filter === null ? '#fff' : C.gray600, border: `1.5px solid ${filter === null ? C.primary : C.gray200}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>Tümü</button>
          {specialties.map(s => (
            <button key={s} onClick={() => setFilter(s === filter ? null : s)} style={{ background: filter === s ? C.primary : '#fff', color: filter === s ? '#fff' : C.gray600, border: `1.5px solid ${filter === s ? C.primary : C.gray200}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>{s}</button>
          ))}
        </div>
        {filtered.map(coach => (
          <Card key={coach.id} onClick={() => onNavigate('client-coach-profile', { coachId: coach.id })}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <Avatar name={coach.name} size={48} color={C.secondary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gray800 }}>{coach.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ color: C.warning }}>{Icon.star}</span>
                  <span style={{ fontSize: 12, color: C.gray400 }}>{coach.exp} yıl deneyim · {coach.clients} danışan</span>
                </div>
              </div>
              <div style={{ color: C.gray300 }}>{Icon.arrow}</div>
            </div>
            <p style={{ fontSize: 12, color: C.gray600, margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{coach.bio}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {coach.specialties.slice(0, 3).map(s => (
                <Badge key={s} small color={C.secondary}>{s}</Badge>
              ))}
              {coach.specialties.length > 3 && <Badge small color={C.gray400}>+{coach.specialties.length - 3}</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CoachProfileDetailScreen({ onNavigate, params }) {
  const coach = mockData.coaches.find(c => c.id === params?.coachId) || mockData.coaches[0];
  const [sent, setSent] = React.useState(false);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <Header title="Koç Profili" onBack={() => onNavigate('client-marketplace')} />
      <div style={{ background: C.secondary, padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
        <Avatar name={coach.name} size={72} color={C.primary} />
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{coach.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
            <span style={{ color: C.warning }}>{Icon.star}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{coach.exp} yıl deneyim · {coach.clients} danışan</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hakkında</div>
          <p style={{ fontSize: 14, color: C.gray600, margin: 0, lineHeight: 1.6 }}>{coach.bio}</p>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Uzmanlıklar</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {coach.specialties.map(s => <Badge key={s} color={C.secondary}>{s}</Badge>)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Paketler</div>
          {Array.from({ length: coach.packages }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < coach.packages - 1 ? `1px solid ${C.gray100}` : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{['Başlangıç', 'Standart', 'Premium', 'Elite'][i]} Paket</div>
                <div style={{ fontSize: 12, color: C.gray400 }}>{['Aylık 4 seans', 'Aylık 8 seans', 'Aylık 12 seans', 'Sınırsız'][i]}</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.primary }}>{[299, 549, 799, 1299][i]}₺</span>
            </div>
          ))}
        </Card>
        <Btn variant={sent ? 'ghost' : 'primary'} full onClick={() => setSent(true)} disabled={sent}>
          {sent ? '✓ İstek Gönderildi' : 'Bağlantı İsteği Gönder'}
        </Btn>
      </div>
    </div>
  );
}

function ClientMessagesScreen({ onNavigate }) {
  const [msg, setMsg] = React.useState('');
  const [msgs, setMsgs] = React.useState(mockData.messages);
  const endRef = React.useRef(null);
  React.useEffect(() => { endRef.current?.scrollIntoView(); }, [msgs]);

  function send() {
    if (!msg.trim()) return;
    setMsgs([...msgs, { id: msgs.length + 1, sender: 'client', text: msg, time: '11:10' }]);
    setMsg('');
    setTimeout(() => {
      setMsgs(m => [...m, { id: m.length + 1, sender: 'coach', text: 'Harika, devam et! 💪', time: '11:11' }]);
    }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.gray100}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name="Berk Öztürk" size={38} color={C.secondary} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>Berk Öztürk</div>
          <div style={{ fontSize: 11, color: C.success }}>● Çevrimiçi</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'client' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '78%', background: m.sender === 'client' ? C.primary : '#fff', borderRadius: m.sender === 'client' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 14, color: m.sender === 'client' ? '#fff' : C.gray800, margin: 0, lineHeight: 1.4 }}>{m.text}</p>
              <span style={{ fontSize: 10, color: m.sender === 'client' ? 'rgba(255,255,255,0.7)' : C.gray400, display: 'block', textAlign: 'right', marginTop: 4 }}>{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ background: '#fff', borderTop: `1px solid ${C.gray100}`, padding: '10px 16px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Mesaj yaz..." style={{ flex: 1, border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'Lexend, sans-serif', color: C.gray800, background: C.neutral }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: 12, background: C.primary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>{Icon.send}</button>
      </div>
    </div>
  );
}

function ClientProfileScreen({ onNavigate }) {
  const [name, setName] = React.useState('Selin Arslan');
  const [weight, setWeight] = React.useState('62');
  const [height, setHeight] = React.useState('165');
  const [saved, setSaved] = React.useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflowY: 'auto' }}>
      <div style={{ background: C.secondary, padding: '20px 20px 32px', textAlign: 'center' }}>
        <Avatar name="Selin Arslan" size={72} color={C.primary} />
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '12px 0 2px' }}>Selin Arslan</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>selin@example.com</p>
      </div>
      <div style={{ padding: '0 16px', marginTop: -14 }}>
        <Card style={{ marginBottom: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'space-around' }}>
            {[{ label: 'Antrenman', val: 24 }, { label: 'Bu Ay', val: 8 }, { label: 'Gün Serisi', val: 5 }].map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRight: i < 2 ? `1px solid ${C.gray100}` : 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{m.val}</div>
                <div style={{ fontSize: 11, color: C.gray400 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gray400, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kişisel Bilgiler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Ad Soyad" value={name} onChange={e => setName(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Kilo (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
                <Input label="Boy (cm)" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.gray600, display: 'block', marginBottom: 6 }}>Hedef</label>
                <select style={{ width: '100%', border: `1.5px solid ${C.gray200}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, fontFamily: 'Lexend, sans-serif', outline: 'none', background: C.neutral, color: C.gray800 }}>
                  <option>Hacim Kazanma</option>
                  <option>Kilo Verme</option>
                  <option>Güç Artırma</option>
                  <option>Genel Sağlık</option>
                </select>
              </div>
            </div>
          </Card>
          <Btn variant="primary" full onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            {saved ? '✓ Kaydedildi!' : 'Değişiklikleri Kaydet'}
          </Btn>
          <Card padding={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: '🔔 Bildirimler', sub: 'Antrenman hatırlatıcıları' },
                { label: '🔒 Şifre Değiştir', sub: 'Güvenlik ayarları' },
                { label: '🚪 Çıkış Yap', sub: 'Hesaptan çıkış', danger: true },
              ].map((item, i) => (
                <div key={i} onClick={item.danger ? () => onNavigate('landing') : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${C.gray100}` : 'none', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.danger ? C.danger : C.gray800 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.gray400 }}>{item.sub}</div>
                  </div>
                  <span style={{ color: C.gray300 }}>{Icon.arrow}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ── Combined Coaches Screen (Marketplace + My Coaches) ──
function ClientCoachesScreen({ onNavigate }) {
  const [tab, setTab] = React.useState('my');
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState(null);
  const [coachList, setCoachList] = React.useState(mockData.coaches);
  const specialties = ['Kilo Verme', 'Güç Antrenmanı', 'Hacim Kazanma', 'Kardiyovasküler', 'Sporcu Performansı'];

  const myCoaches = coachList.filter(c => c.connected === 'ACCEPTED');
  const pendingCoaches = coachList.filter(c => c.connected === 'PENDING');

  const marketplaceCoaches = coachList.filter(c =>
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase())) &&
    (filter === null || c.specialties.includes(filter))
  );

  function sendRequest(id) {
    setCoachList(list => list.map(c => c.id === id ? { ...c, connected: 'PENDING' } : c));
  }
  function removeCoach(id) {
    setCoachList(list => list.map(c => c.id === id ? { ...c, connected: null } : c));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.neutral, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${C.secondary}, ${C.secondaryLight})`, padding: '16px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <img src="logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Koçlarım</h2>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{myCoaches.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Aktif Koç</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{pendingCoaches.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Bekleyen</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{coachList.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Koç Havuzu</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', padding: '0 16px', borderBottom: `1px solid ${C.gray100}`, flexShrink: 0 }}>
        <div style={{ display: 'flex' }}>
          {[{ key: 'my', label: `Koçlarım (${myCoaches.length + pendingCoaches.length})` }, { key: 'find', label: 'Koç Bul' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: 'none', border: 'none', padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: tab === t.key ? C.primary : C.gray400, borderBottom: `2px solid ${tab === t.key ? C.primary : 'transparent'}`, transition: 'all 0.15s', fontFamily: 'Lexend, sans-serif' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'my' ? (
          <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myCoaches.length === 0 && pendingCoaches.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ color: C.gray400, fontSize: 14, margin: 0 }}>Henüz bağlı koçun yok.<br/>
                  <span style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('find')}>Koç bulmak için tıkla →</span>
                </p>
              </div>
            )}
            {pendingCoaches.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Bekleyen İstekler</div>
                {pendingCoaches.map(c => (
                  <Card key={c.id} padding={14} style={{ marginBottom: 8, borderLeft: `3px solid ${C.warning}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={c.name} size={44} color={C.secondary} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.gray800 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{c.specialties.slice(0,2).join(' · ')}</div>
                      </div>
                      <Badge color={C.warning}>Bekliyor</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {myCoaches.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Aktif Koçlar</div>
                {myCoaches.map(c => (
                  <Card key={c.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <Avatar name={c.name} size={48} color={C.secondary} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.gray800 }}>{c.name}</div>
                          <Badge small color={C.success}>Aktif</Badge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <span style={{ color: C.warning }}>{Icon.star}</span>
                          <span style={{ fontSize: 12, color: C.gray400 }}>{c.exp} yıl · {c.clients} danışan</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {c.specialties.map(s => <Badge key={s} small color={C.secondary}>{s}</Badge>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn small variant="secondary" full onClick={() => onNavigate('client-messages')}>💬 Mesaj</Btn>
                      <Btn small variant="ghost" full onClick={() => removeCoach(c.id)}>Bağlantıyı Kes</Btn>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '11px 14px', border: `1.5px solid ${C.gray200}`, boxShadow: C.cardShadow }}>
              <span style={{ color: C.gray400, display: 'flex' }}>{Icon.search}</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Koç adı ile ara..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontFamily: 'Lexend, sans-serif', background: 'transparent', color: C.gray800 }} />
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              <button onClick={() => setFilter(null)} style={{ background: filter === null ? C.primary : '#fff', color: filter === null ? '#fff' : C.gray600, border: `1.5px solid ${filter === null ? C.primary : C.gray200}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>Tümü</button>
              {specialties.map(s => (
                <button key={s} onClick={() => setFilter(s === filter ? null : s)} style={{ background: filter === s ? C.primary : '#fff', color: filter === s ? '#fff' : C.gray600, border: `1.5px solid ${filter === s ? C.primary : C.gray200}`, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>{s}</button>
              ))}
            </div>
            {/* Coach cards */}
            {marketplaceCoaches.map(coach => (
              <Card key={coach.id} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <Avatar name={coach.name} size={50} color={C.secondary} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.gray800 }}>{coach.name}</div>
                      {coach.connected && <Badge small color={coach.connected === 'ACCEPTED' ? C.success : C.warning}>{coach.connected === 'ACCEPTED' ? 'Bağlı' : 'Bekliyor'}</Badge>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ color: C.warning, display: 'flex' }}>{Icon.star}</span>
                      <span style={{ fontSize: 12, color: C.gray400 }}>{coach.exp} yıl deneyim · {coach.clients} danışan</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: C.gray600, margin: '0 0 10px', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{coach.bio}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {coach.specialties.slice(0, 3).map(s => <Badge key={s} small color={C.secondary}>{s}</Badge>)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn small variant="ghost" full onClick={() => onNavigate('client-coach-profile', { coachId: coach.id })}>Profili Gör</Btn>
                  {!coach.connected && <Btn small variant="primary" full onClick={() => sendRequest(coach.id)}>İstek Gönder</Btn>}
                  {coach.connected === 'PENDING' && <Btn small variant="ghost" full disabled>Bekliyor...</Btn>}
                  {coach.connected === 'ACCEPTED' && <Btn small variant="success" full onClick={() => onNavigate('client-messages')}>Mesaj Yaz</Btn>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  ClientDashboard, ClientWorkoutsScreen, WorkoutDetailScreen, WorkoutExecutionScreen,
  CalendarScreen, MarketplaceScreen, CoachProfileDetailScreen, ClientMessagesScreen,
  ClientProfileScreen, ClientCoachesScreen
});
