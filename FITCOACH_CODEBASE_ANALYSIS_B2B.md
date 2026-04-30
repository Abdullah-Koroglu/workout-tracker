# 1. Proje Özeti ve Teknik Altyapı

## 1.1 Ürün Konumu (Mevcut Durum)
Fitcoach şu an **B2C-benzeri coach-client operasyonu** yapan, ancak mimari olarak **B2B Antrenör - Öğrenci Pazaryeri** modeline evrilebilecek bir Next.js PWA ürünüdür.

- Ana değer önerisi: workout template yönetimi, assignment, workout execution, progress takibi, messaging ve notification.
- Mimari yaklaşım: App Router + API routes + Prisma + PostgreSQL + ayrı WebSocket process.
- Durum: Production-ready MVP; bazı feature alanları placeholder/partial.

## 1.2 Temel Teknolojiler

### 1.2.1 Frontend / App Layer
- Framework: **Next.js 16.2.2** (App Router)
- UI: **React 19**, **Tailwind CSS**, **Radix UI**
- Form & Validation: **react-hook-form**, **zod**
- Charting: **Recharts**
- Icons / UX: **lucide-react**, **canvas-confetti**, **html-to-image**

### 1.2.2 Auth / Security
- Auth: **NextAuth v5 (beta)** + Credentials provider
- Password hash: **bcryptjs**
- Session strategy: **JWT**

### 1.2.3 Backend / Data
- ORM: **Prisma 6.6.0**
- DB: **PostgreSQL**
- Real-time: **ws** (separate `server.js`)
- Push: **web-push** (VAPID)
- Mail: **nodemailer** + React Email template rendering

### 1.2.4 Test / Tooling
- E2E: **Playwright**
- Lint: **ESLint**
- Build pipeline: `next build`
- DB scripts: `prisma db push`, seed, SQLite->PostgreSQL migration script

## 1.3 State Management ve Uygulama Durumu

- Global context katmanı:
  - `AuthContext`
  - `NotificationContext`
  - `ConfirmationContext`
- Domain hooks:
  - `useWorkoutFlow`
  - `useWorkoutActions`
  - `useExerciseManager`
  - `useWorkoutTimer`
- Local state: component-level React state + localStorage snapshot/queue (offline/senkronizasyon için).

## 1.4 PWA Konfigürasyon Detayları

### 1.4.1 Manifest
- Dosya: `public/manifest.webmanifest`
- `display: standalone`, `start_url: /`, `scope: /`, `orientation: portrait`
- `theme_color`, `background_color`, maskable icon setleri tanımlı.

### 1.4.2 Service Worker
- Dosya: `public/sw.js`
- Cache stratejileri:
  - Static assets: `cache-first`
  - Navigations/pages: `network-first` + offline fallback
  - API: `stale-while-revalidate`
  - Realtime messages API: `network-only`
- Push event handling + notification click deep-link davranışı mevcut.
- Cardio block geçişleri için SW message channel (`CARDIO_BLOCK_TRANSITION`) uygulanmış.

### 1.4.3 Registration ve Shell
- SW register: `components/shared/PwaRegister.tsx`
- Root shell: `app/layout.tsx`
  - PWA meta/manifest/icon/splash screen setleri tanımlı
  - Offline resume bileşeni ekli

### 1.4.4 Offline Davranışı
- Offline fallback: `public/offline.html`
- Workout set enqueue + online olunca sync:
  - `hooks/useWorkoutActions.ts`
- Cardio timer snapshot localStorage persist/reconcile:
  - `hooks/useWorkoutTimer.ts`

---

# 2. Sayfa ve Routing Mimarisi (App/Pages Router)

## 2.1 Route Organizasyon Modeli

Proje App Router’da route group yapısı kullanıyor:
- `(auth)`
- `(client)`
- `(coach)`
- `(shared)`

Bunlar URL’ye yansımaz, sadece layout/organizasyon sınırı sağlar.

## 2.2 Tüm UI Routes (Pages)

### 2.2.1 Global / Public
- `/`
  - Amaç: Landing + auth durumuna göre role dashboard redirect.
  - Ana etkileşim: login/register CTA.

- `/_not-found` (framework output)
  - Not-found handling.

- Global Error Boundary:
  - `app/error.tsx` (custom global error UI)
  - `app/not-found.tsx` (custom not-found UI)

### 2.2.2 Auth
- `/login`
  - Amaç: Credentials login.
  - Ana component: login content + suspense fallback.

- `/register`
  - Amaç: Yeni kullanıcı kaydı.
  - Ana component: register content + form validation.

### 2.2.3 Client Routes
- `/client/dashboard`
  - Amaç: Client ana paneli (assignment, bugün yapılacaklar, genel özet).
  - Etkileşim: assignment başlatma, coach bilgisine geçiş.

- `/client/workouts`
  - Amaç: Geçmiş workout listesi.
  - Etkileşim: workout detayına drill-down.

- `/client/workouts/[workoutId]`
  - Amaç: Workout detail/review.
  - Etkileşim: intensity score görme/güncelleme, yorumları okuma, share card.

- `/client/workout/[assignmentId]/start`
  - Amaç: Aktif workout execution flow.
  - Etkileşim: set girme/silme, cardio timer, complete/abandon.

- `/client/profile`
  - Amaç: Client profile yönetimi.
  - Etkileşim: profil alanları düzenleme.

- `/client/coaches`
  - Amaç: Coach listesi ve ilişki durumu.
  - Etkileşim: coach detail, ilişki isteği, bağlantı yönetimi.

- `/client/coaches/[coachId]`
  - Amaç: Coach profile/detail vitrini.
  - Etkileşim: istek gönderme, package görme.

- `/client/marketplace`
  - Amaç: Marketplace alias route (coaches akışına yönlenir).

- `/client/marketplace/[coachId]`
  - Amaç: Marketplace coach detail alias route.

- `/client/messages`
  - Amaç: Client rolü için messaging UI.
  - Etkileşim: thread açma, mesaj gönderme/okuma.

- `/client/calendar`
  - Amaç: Assignment takvim görünümü.
  - Etkileşim: gün bazlı assignment inceleme.

### 2.2.4 Coach Routes
- `/coach/dashboard`
  - Amaç: Coach ana paneli (client özet, recent workouts, pending relation).
  - Etkileşim: client detayına/iş akışlarına geçiş.

- `/coach/clients`
  - Amaç: Coach’un client ilişkileri (pending/accepted).
  - Etkileşim: relation aksiyonları.

- `/coach/clients/[clientId]`
  - Amaç: Belirli client detay + assignment/workout overview.
  - Etkileşim: template assign, progress/message aksiyonları.

- `/coach/clients/[clientId]/progress`
  - Amaç: Client progress analytics.
  - Etkileşim: chart üstünden trend inceleme.

- `/coach/exercises`
  - Amaç: Exercise library CRUD.
  - Etkileşim: create/edit/delete exercise.

- `/coach/templates`
  - Amaç: Template listesi.
  - Etkileşim: yeni template, edit/assign sayfalarına geçiş.

- `/coach/templates/new`
  - Amaç: Yeni template oluşturma.
  - Etkileşim: template form submit.

- `/coach/templates/[id]/edit`
  - Amaç: Template güncelleme.
  - Etkileşim: exercise düzenleme/sıralama.

- `/coach/templates/[id]/assign`
  - Amaç: Template atama board.
  - Etkileşim: client seçimi + schedule.

- `/coach/messages`
  - Amaç: Coach messaging UI.

- `/coach/profile`
  - Amaç: Coach profile + packages + avatar.
  - Etkileşim: bio/specialty/package yönetimi, avatar upload.

### 2.2.5 Shared
- `/messages`
  - Amaç: Role-aware mesaj rota yönlendirme noktası.

## 2.3 Tüm API Routes

### 2.3.1 Auth
- `/api/auth/[...nextauth]`
- `/api/auth/register`

### 2.3.2 Assignment & Summary
- `/api/assignments/[id]/summary`

### 2.3.3 Profile
- `/api/profile`
- `/api/profile/avatar`

### 2.3.4 Client APIs
- `/api/client/assignments`
- `/api/client/coaches`
- `/api/client/coaches/request`
- `/api/client/coaches/[coachId]`
- `/api/client/workouts`
- `/api/client/workouts/[workoutId]`
- `/api/client/workouts/[workoutId]/cancel`
- `/api/client/workouts/[workoutId]/complete`
- `/api/client/workouts/[workoutId]/sets`

### 2.3.5 Coach APIs
- `/api/coach/clients`
- `/api/coach/clients/[clientId]/progress`
- `/api/coach/clients/[clientId]/relation`
- `/api/coach/clients/[clientId]/workouts`
- `/api/coach/exercises`
- `/api/coach/exercises/[id]`
- `/api/coach/packages`
- `/api/coach/packages/[packageId]`
- `/api/coach/templates`
- `/api/coach/templates/[id]`
- `/api/coach/templates/[id]/assign`
- `/api/coach/test-date`
- `/api/coach/workouts/[workoutId]`
- `/api/coach/workouts/[workoutId]/comments`

### 2.3.6 Marketplace / Discovery
- `/api/marketplace/coaches`
- `/api/marketplace/coaches/[coachId]`
- `/api/coaches/[coachId]` (compat alias)

### 2.3.7 Messaging
- `/api/messages`
- `/api/messages/threads`
- `/api/messages/ws-token`

### 2.3.8 Notifications
- `/api/notifications`
- `/api/notifications/subscribe`
- `/api/notifications/test`

### 2.3.9 Cron
- `/api/cron/weekly-coach-digest`

## 2.4 Routing Security / Navigation Guard
- `proxy.ts` matcher ile auth/static dosya ayrımı yapılır.
- Unauthenticated kullanıcı `/coach|/client|/messages` girişinde `/login`’e redirect edilir.
- Role mismatch redirect kuralları:
  - COACH -> `/client/*` engellenir
  - CLIENT -> `/coach/*` engellenir

---

# 3. Mevcut Kullanıcı Tipleri ve Yetkilendirme (Varsa)

## 3.1 Auth Mekanizması

- NextAuth Credentials akışı:
  1. Login form -> credentials
  2. Zod validate (`loginSchema`)
  3. User lookup (Prisma)
  4. Password compare (bcrypt)
  5. JWT issue + session enrichment (`id`, `role`, `name`)

- Session strategy: JWT
- API seviyesinde auth helper: `requireAuth(role?)`

## 3.2 Roller ve Yetki Sınırları

- Roller: `COACH`, `CLIENT`
- Route seviyesinde guard:
  - Layout guard (`app/(client)/layout.tsx`, `app/(coach)/layout.tsx`)
  - Proxy redirect kuralı (`proxy.ts`)

### 3.2.1 Coach Yetkileri
- Exercise CRUD
- Template CRUD
- Template assign
- Client relation yönetimi
- Client workout/comments/progress görüntüleme

### 3.2.2 Client Yetkileri
- Kendine atanmış workout başlatma ve set kaydetme
- Kendi profile yönetimi
- Coach keşfi/istek süreci
- Kendi mesajlaşma ve bildirim tüketimi

## 3.3 Data Access Pattern
- API route’larında resource ownership kontrolü var (örn. workout clientId karşılaştırması).
- Role-specific endpoint erişimi var (örn. `requireAuth("COACH")`).

---

# 4. Çekirdek Uygulama Özellikleri (Core Features)

## 4.1 Workout Lifecycle

### 4.1.1 Template -> Assignment -> Workout
- Coach template üretir.
- Client’a schedule ile assignment yapılır.
- Client assignment günü workout başlatır.
- Sets/Cardio kaydı ile workout tamamlanır veya abandon edilir.

### 4.1.2 Workout Başlatma Kuralları
- Assignment date eşleşmesi kontrolü (`scheduledFor == today`).
- One-time assignment re-run engeli (409 conflict).
- Aynı assignment için stale in-progress workout cleanup.

## 4.2 Set/Metric Yakalama

### 4.2.1 Weight Set
- Ana alanlar:
  - `weightKg`
  - `reps`
  - `rir`
  - `setNumber`
- PR (personal record) tespiti:
  - Önceki completed setlerin max weight karşılaştırması.

### 4.2.2 Cardio Set
- Ana alanlar:
  - `durationMinutes`
  - `durationSeconds`
  - `completed`
- Protocol tabanlı cardio yapılandırması destekli (JSON protocol blokları).

## 4.3 Kardiyo Sayacı ve Dayanıklılık (Resilience)

- Hook: `useWorkoutTimer`
- Yetenekler:
  - start/pause/resume/reset/finish
  - localStorage snapshot persist
  - background throttling telafisi (`lastUpdatedAtMs` ile elapsed reconcile)
  - visibility/focus/pageshow eventleri ile catch-up

## 4.4 Offline ve Senkronizasyon

- Hook: `useWorkoutActions`
- Offline queue:
  - localStorage anahtarı ile pending set saklama
  - online event’inde otomatik sync
- Son kullanıcı geri bildirimi:
  - success/warning/info notification context üzerinden.

## 4.5 Messaging

- REST + WebSocket hibrit model.
- `server.js` user-socket map ile online user’a event push eder.
- `/api/messages/ws-token` ile WS auth token üretimi.
- Thread + cursor pagination destekli.

## 4.6 Notification

- In-app notification entity + read state.
- WebPush (VAPID) subscription saklama (`User.pushSubscription`).
- Trigger örnekleri:
  - yeni mesaj
  - workout completion
  - template assignment
  - coach comment

## 4.7 Profile ve Avatar

- Coach/client profile ayrımı.
- Avatar upload endpoint:
  - MIME/type/size validation
  - `public/uploads/avatars` hedef dizini
  - eski avatar cleanup

## 4.8 Spesifik User Interaction Fonksiyonları

- Start workout
- Add/update/delete set
- Save cardio completion
- Complete/abandon workout
- Template create/edit/assign
- Coach request/relation update
- Send message / read threads
- Enable/disable push notifications
- Upload avatar

---

# 5. Business Logic & Veri Akışı

## 5.1 Veritabanı Şeması (Yüksek Seviye)

## 5.1.1 Ana Varlıklar
- `User` (role, kimlik, push subscription)
- `ClientProfile`, `CoachProfile`, `CoachPackage`
- `CoachClientRelation` (PENDING/ACCEPTED/REJECTED)
- `Exercise` (WEIGHT/CARDIO)
- `WorkoutTemplate`, `WorkoutTemplateExercise`
- `TemplateAssignment`
- `Workout`, `WorkoutSet`, `Comment`
- `Message`
- `Notification`

## 5.1.2 Kritik İlişkiler
- Coach -> Template (1:N)
- Template -> Assignment (1:N)
- Assignment -> Workout (1:N pratikte çoğunlukla 1)
- Workout -> Set (1:N)
- Coach <-> Client (N:N via relation table)
- User -> Message/Notification (1:N)

## 5.2 Veri Üretim-Tüketim Akışı

## 5.2.1 Coach Tarafı
1. Exercise ve template yaratır.
2. Client relation accepted ise assignment oluşturur.
3. Assignment event’i ile notification + push + email tetiklenir.

## 5.2.2 Client Tarafı
1. Dashboard/takvimde assignment görür.
2. Workout başlatır -> workout row açılır.
3. Set/cardio girdikçe workout set kayıtları yazılır.
4. Workout complete/abandon edilince lifecycle kapanır.
5. Coach tarafına completion notification gider.

## 5.2.3 Messaging Akışı
1. REST ile mesaj create.
2. DB’ye message + notification yazılır.
3. WS ile online user’a event push.
4. Push subscription varsa browser push tetiklenir.

## 5.2.4 Analytics / Progress
- Coach progress sayfaları workout set geçmişinden derive edilir.
- Ayrı bir body metrics domain yok; mevcut metrik odaklı ilerleme mostly exercise performance tabanlıdır.

## 5.3 B2B Pazaryeri Dönüşümü Açısından Mevcut Business Fit

Mevcut yapı aşağıdaki B2B marketplace taşlarını zaten içeriyor:
- Role-based tenant-benzeri ayrım (coach/client)
- Coach discovery (`/client/coaches`, marketplace alias)
- Offer/package sunumu (`CoachPackage`)
- Relationship funnel (`CoachClientRelation`)
- Retention sinyalleri (assignment completion, messaging, notifications)

Eksik olanlar (B2B scale için):
- Organization/team/account hiyerarşisi
- Billing/subscription/contract katmanı
- Multi-coach workspace ve permission granularity
- Marketplace ranking/review/recommendation motoru

---

# 6. Eksik veya Geliştirilmeye Açık Alanlar (AI'ın Gözünden)

## 6.1 Business / Product Gaps

### 6.1.1 B2B Monetization Katmanı Eksik
- Payment/billing/subscription modeli yok.
- Coach package var ancak transaction lifecycle yok.

### 6.1.2 Marketplace Trust Katmanı Eksik
- Review/rating/reputation sistemi yok.
- Coach verification / credential workflow yok.

### 6.1.3 CRM & Lifecycle Automation Sınırlı
- Funnel stage yönetimi (lead -> active -> churn risk) ayrı model olarak yok.
- Campaign/broadcast/message automation yok.

## 6.2 Teknik Gaps

### 6.2.1 Real-time Architecture Complexity
- Ayrı WS process operasyonel komplekslik getiriyor (deploy/health/logging).
- Horizontal scale planı (sticky sessions, pub-sub) net değil.

### 6.2.2 Security Hardening Alanları
- Auth endpoint rate limiting görünmüyor.
- Audit log / anomaly detection katmanı görünmüyor.
- Permission granularity (ör. staff roles) sınırlı.

### 6.2.3 Data Model Derinliği
- Nutrition / body metrics / recovery alanları eksik.
- Appointment/session scheduling domain yok.
- Media library (exercise video/form cue) sınırlı.

## 6.3 Operasyonel ve Teknik Borç

### 6.3.1 Test Katmanı
- E2E mevcut, fakat unit/integration coverage sınırlı.
- Kritik business rule’lar için contract tests önerilir.

### 6.3.2 API Governance
- OpenAPI/SDK katmanı yok.
- Error payload standardizasyonu kısmi.

### 6.3.3 Cache ve Offline Stratejisi
- SW cache versioning manuel (`v5`); release automation ile bağlanmalı.
- Offline queue conflict resolution stratejisi genişletilebilir.

## 6.4 Hemen Etki Üretecek Öneriler (Roadmap-Ready)

1. **B2B Foundations**
   - Organization/Workspace modeli
   - Coach seat/role management
   - Tenant-aware data boundaries

2. **Revenue Layer**
   - Subscription plans + invoice + payment integration
   - Package purchase to assignment pipeline

3. **Marketplace Intelligence**
   - Review/rating + trust score
   - Search/ranking/filter semantics
   - Lead conversion analytics

4. **Ops & Reliability**
   - Rate limiting + audit logs
   - WS scaling strategy (pub-sub/backplane)
   - Observability (structured logs, tracing)

5. **Coaching Depth**
   - Nutrition + body metrics + recovery widgets
   - Session scheduling + reminders
   - Exercise media knowledge base

## 6.5 Sonuç
Mevcut codebase, **coach-client execution engine** tarafında güçlü bir çekirdeğe sahip ve B2B marketplace’e evrim için doğru temel taşları içeriyor. En yüksek kaldıraçlı sonraki adım, teknik olarak tenant-aware business katmanı ve ticari monetization kurgusunu mevcut workout/messaging altyapısının üstüne inşa etmektir.
