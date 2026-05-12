# 📊 Workout Tracker — Detaylı Uygulama Analizi

## 1. Genel Mimari Durum

**Stack**: Next.js 14 (App Router) + PostgreSQL + Prisma ORM + NextAuth + TypeScript + Tailwind CSS
**Auth**: Rol bazlı (`COACH` / `CLIENT`) — session middleware `requireAuth()` ile
**Ödeme**: Stripe + iyzico (Türk pazarı için), SubscriptionTier (FREE / TIER_1 / TIER_2 / AGENCY)
**Bildirim**: Web Push (`pushSubscription` JSON), in-app `Notification` modeli
**Medya**: Yerel upload (`/uploads/movement-videos/...`), avatar dosyaları
**Dil/UI**: Türkçe arayüz, Light mode, modern (rounded-2xl, soft shadow, accent renkler)

---

## 2. Coach Tarafı — Mevcut Modüller

### ✅ Bitmiş / Aktif
| Modül | Sayfa | Açıklama |
|---|---|---|
| **Dashboard** | `/coach/dashboard` | Genel özet |
| **Müşteri Yönetimi** | `/coach/clients` | Liste, churn risk, compliance |
| **Müşteri Detay** | `/coach/clients/[clientId]` | Profil, ilerleme, notlar |
| **Müşteri İlerleme** | `/coach/clients/[clientId]/progress` | Vücut metrikleri grafikleri |
| **Antrenman Şablonları** | `/coach/templates` | CRUD + kategoriler |
| **Egzersizler** | `/coach/exercises` | Egzersiz kütüphanesi |
| **Mobilite** | `/coach/mobility` | Hareket + rutin |
| **Mesajlar** | `/coach/messages` | Real-time DM |
| **Profil** | `/coach/profile` | Bio, paketler, availability, dönüşüm fotoğrafları |
| **Abonelik** | `/coach/subscription` | Tier yönetimi |
| **Fatura** | `/coach/billing` | Stripe/iyzico |
| **Admin** | `/coach/admin` | Ajans yönetimi |

### Coach Analitik / Müşteri İçgörü Özellikleri
- **Churn Risk** (`/api/coach/clients/churn-risks`) — risk skoru
- **Volume Analytics** (`/api/coach/clients/[clientId]/analytics/volume`) — set/rep/tonaj
- **Progress** (`/api/coach/clients/[clientId]/progress`) — ilerleme grafikleri
- **Timeline** (`/api/coach/clients/[clientId]/timeline`) — aktivite akışı
- **Nudges** (`/api/coach/nudges`) — pasif müşteriye hatırlatma
- **Broadcast** (`/api/coach/broadcast`) — toplu mesaj
- **Weekly Digest Cron** (`/api/cron/weekly-coach-digest`) — haftalık özet
- **CheckIn** sistemi — uyku/stres/motivasyon skorları
- **Client Notes** (yeni) — etiketli özel notlar
- **Movement Videos** — form kontrolü için video + yorum
- **Availability** (yeni) — haftalık takvim
- **Sessions** (yeni) — konsültasyon/check-in rezervasyonu

### ❌ Coach Tarafında Eksik / Zayıf
1. **Coach Dashboard yetersiz** — KPI kartları yok (aktif müşteri, MRR, churn oranı, oturum sayısı)
2. **Gelir / Kazanç paneli yok** — paketlerin gerçek satış istatistikleri yok
3. **Müşteri segmentasyonu yok** — sadece churn var; "yeni gelen", "platinum", "yenilenmeyen" gibi etiketler yok
4. **Coach kendi çıktısını exportlayamıyor** (CSV/PDF rapor)
5. **AI öneriler yok** — egzersiz programı için copilot
6. **Otomatik takip programı (drip / sequence)** yok — onboarding sırasında 3. günde mesaj atılsın gibi
7. **Group / Class koçluk** yok (1-N)
8. **Müşteri başarı hikayesi (case study) oluşturma** yok — transformationPhotos'tan otomatik vitrin

---

## 3. Client Tarafı — Mevcut Modüller

| Modül | Sayfa | Durum |
|---|---|---|
| **Dashboard** | `/client/dashboard` | ✅ |
| **Koç Bulma** | `/client/coaches` | ✅ filtreleme + karşılaştırma |
| **Koç Detay** | `/client/coaches/[coachId]` | ✅ review, similar, booking |
| **Koç Karşılaştırma** | `/client/coaches/compare` | ✅ yeni |
| **Marketplace (legacy)** | `/client/marketplace` | ⚠️ coaches ile dublike olabilir |
| **Antrenmanlar** | `/client/workouts` | ✅ |
| **Antrenman başlat** | `/client/workout/[id]/start` | ✅ |
| **Takvim** | `/client/calendar` | ✅ |
| **Vücut İlerlemesi** | `/client/body-progress` | ✅ |
| **Beslenme Logu** | `/client/nutrition/log` | ✅ adherence (yeşil/sarı/kırmızı) |
| **Mesajlar** | `/client/messages` | ✅ |
| **Profil** | `/client/profile` | ✅ |

### ❌ Client Tarafında Eksik
1. **Achievements / Streaks** yok — gamification sıfır
2. **Public profil / Sosyal** yok — başarılarını paylaşamıyor
3. **Self-coaching** (koçsuz mod) yok — template kütüphanesinden ücretsiz program seçimi
4. **Wearable entegrasyon** yok (Apple Health, Garmin, Whoop)
5. **PR (Personal Record) takibi** yok — en ağır squat, en fazla reps
6. **Su tüketimi / Adım sayısı** yok
7. **Ruh hali / Wellness günlüğü** yok (CheckIn'den ayrı)

---

## 4. Data Modeli — Genişletme Önerileri

### 4.1. `User` — Eksik Alanlar
```prisma
phone           String?       // SMS notifications + iyzico verification
timezone        String?       // session scheduling için kritik
lastActiveAt    DateTime?     // churn detection
locale          String?       // i18n hazırlığı
referredById    String?       // referral program
emailVerified   DateTime?     // güvenlik
twoFactorEnabled Boolean?     // güvenlik
```

### 4.2. `CoachProfile` — Çok Eksik
```prisma
videoIntroUrl       String?   // tanıtım videosu (marketplace dönüşümü artırır)
languages           Json?     // ["TR", "EN"]
certifications      Json?     // [{name, issuer, year, url}]
education           Json?
hourlyRate          Float?    // 1-1 session için
responseTimeHours   Int?      // ortalama yanıt süresi
totalClientsHelped  Int?      // sosyal kanıt
beforeAfterStories  Json?     // case study array
faqs                Json?     // [{q, a}]
isVerified          Boolean?  // platform doğrulaması
isAcceptingClients  Boolean   @default(true)
```

### 4.3. `CoachPackage` — Genişletme
```prisma
durationWeeks       Int?      // 4, 8, 12 hafta gibi
sessionsIncluded    Int?      // paket içinde kaç oturum
maxClients          Int?      // limited spots
sortOrder           Int?      // coach kendi sıralasın
discount            Float?    // % indirim
originalPrice       Float?    // strikethrough için
recurringInterval   String?   // "monthly" | "one_time"
```

### 4.4. `Workout` — Eksik
```prisma
notes               String?   // client end-of-workout notu
energyLevel         Int?      // 1-5
moodBefore          Int?
moodAfter           Int?
location            String?   // "Home", "Gym A", vs.
durationSeconds     Int?      // toplam süre (finishedAt - startedAt'tan ayrı)
totalVolumeKg       Float?    // cached aggregation (rapor için)
```

### 4.5. `BodyMetricLog` — Eksik
```prisma
bodyFatPercent      Float?
muscleMassKg        Float?
bmiCached           Float?    // cached
sleepHours          Float?    // o günkü uyku
restingHR           Int?      // recovery proxy
hrv                 Int?      // wearable
visceralFat         Int?
boneMassKg          Float?
waterPercent        Float?
neckMeasurement     Float?    // Navy method için
forearm             Float?
calf                Float?
```

### 4.6. `Review` — Eksik
```prisma
helpfulCount        Int       @default(0)
coachReply          String?   // koç yorumu cevaplayabilsin
coachReplyAt        DateTime?
verifiedPurchase    Boolean   // sadece paket alanlar
photos              Json?     // before/after eklenebilsin
durationWithCoach   Int?      // "8 hafta koçluk aldı"
```

### 4.7. `Session` — Eksik (sadece konsültasyon değil)
```prisma
meetingUrl          String?   // Zoom / Google Meet
recordingUrl        String?
agenda              String?
summary             String?   // post-session not (koçtan)
clientFeedback      String?
rating              Int?      // session sonrası mini değerlendirme
reminderSentAt      DateTime?
isPaid              Boolean?
```

### 4.8. `Notification` — Eksik
```prisma
actionUrl           String?   // tıklayınca nereye gitsin
metadata            Json?     // payload
priority            String?   // "low" | "normal" | "high"
expiresAt           DateTime?
channel             String?   // "push" | "email" | "sms" | "inapp"
```

---

## 5. Yeni Model Önerileri (Eksik Tablolar)

### 🏆 `Achievement` + `UserAchievement`
```prisma
model Achievement {
  id          String @id
  code        String @unique        // "FIRST_WORKOUT", "10_WORKOUTS"
  title       String
  description String
  iconUrl     String?
  category    String                // "consistency", "strength", "social"
  points      Int    @default(0)
}
model UserAchievement {
  id            String
  userId        String
  achievementId String
  unlockedAt    DateTime
  @@unique([userId, achievementId])
}
```
→ Streaks, milestones, gamification için. Client engagement %30+ artırır.

### 💪 `PersonalRecord`
```prisma
model PersonalRecord {
  id          String
  clientId    String
  exerciseId  String
  weightKg    Float
  reps        Int
  estimatedOneRM Float?
  workoutId   String?
  achievedAt  DateTime
  @@index([clientId, exerciseId])
}
```
→ "En ağır squatın: 140kg" gibi; otomatik WorkoutSet trigger ile güncellenir.

### 💳 `Subscription` + `Payment`
```prisma
model Subscription {
  id            String
  clientId      String
  coachId       String
  packageId     String
  status        String   // "active", "paused", "expired"
  startedAt     DateTime
  expiresAt     DateTime?
  cancelAtPeriodEnd Boolean
  stripeSubscriptionId String?
}
model Payment {
  id            String
  subscriptionId String?
  amount        Float
  currency      String
  status        String
  provider      String   // "stripe" | "iyzico"
  providerRef   String?
  invoiceUrl    String?
  createdAt     DateTime
}
```
→ Coach gelir paneli, abonelik takibi, fatura geçmişi için kritik.

### 📈 `Goal` + `Milestone`
```prisma
model Goal {
  id            String
  clientId      String
  coachId       String?
  title         String
  type          String   // "weight_loss", "strength", "habit"
  targetValue   Float?
  currentValue  Float?
  unit          String?  // "kg", "reps", "days"
  targetDate    DateTime?
  status        String   // "active", "achieved", "abandoned"
}
model Milestone {
  id          String
  goalId      String
  title       String
  achievedAt  DateTime?
  order       Int
}
```
→ "Hedefe %60 ulaştın" türü görseller; coach-client hizalanması.

### 🔗 `Referral`
```prisma
model Referral {
  id          String
  referrerId  String   // davet eden
  refereeId   String?  // davet edilen
  code        String   @unique
  bonusType   String?  // "discount", "free_month"
  status      String   // "pending", "converted"
  createdAt   DateTime
}
```
→ Coach acquisition için viral kanal.

### 📅 `AvailabilityException`
```prisma
model AvailabilityException {
  id        String
  coachId   String
  date      DateTime
  isClosed  Boolean   // tatil / izin
  startTime String?
  endTime   String?
}
```
→ Mevcut `CoachAvailability` sadece haftalık tekrar; tatil veya özel günler için override gerekli.

### 📂 `MediaAsset` (Birleşik Medya Tablosu)
```prisma
model MediaAsset {
  id            String
  ownerId       String
  type          String   // "avatar", "transformation", "video", "diet_doc"
  url           String
  mimeType      String
  sizeBytes     Int
  thumbnailUrl  String?
  metadata      Json?
  createdAt     DateTime
}
```
→ Şu an her özellik için ayrı yerel path; merkezi medya yönetimi + S3 geçişi kolaylaşır.

### 🏅 `CoachBadge`
```prisma
model CoachBadge {
  id          String
  coachId     String
  code        String   // "TOP_RATED", "100_CLIENTS", "VERIFIED"
  awardedAt   DateTime
}
```
→ Marketplace'te sosyal kanıt.

### 📊 `AnalyticsSnapshot` (Pre-computed)
```prisma
model AnalyticsSnapshot {
  id          String
  scope       String   // "coach", "client"
  scopeId     String
  date        DateTime @db.Date
  metrics     Json     // {workouts: 5, volume: 12000, adherence: 0.85}
  @@unique([scope, scopeId, date])
}
```
→ Dashboard sorguları artık ağır JOIN değil tek SELECT olur.

### 💬 `MessageReaction` + `MessageAttachment`
```prisma
model MessageReaction {
  id        String
  messageId String
  userId    String
  emoji     String
  @@unique([messageId, userId, emoji])
}
model MessageAttachment {
  id        String
  messageId String
  url       String
  type      String   // "image", "video", "doc"
  sizeBytes Int
}
```
→ Mesaj UX'i şu an çok yalın.

---

## 6. Önceliklendirilmiş Yol Haritası

### 🥇 Tier 1 — Hızlı Kazanç (1-2 hafta)
1. **Achievement + Streak sistemi** — engagement %30+, basit model
2. **Personal Records otomasyonu** — `WorkoutSet` trigger
3. **Coach Dashboard KPI kartları** — aktif müşteri, MRR, churn
4. **`CoachProfile` zenginleştirme** — video intro, sertifika, dil, yanıt süresi
5. **Notification.actionUrl** — tıklanabilir bildirimler

### 🥈 Tier 2 — Orta Vadeli (1 ay)
1. **Subscription + Payment modelleri** — Stripe/iyzico merge
2. **Goal + Milestone sistemi** — coach-client hizalanması
3. **Session: meetingUrl, recording, post-session note**
4. **AvailabilityException** — tatil/izin yönetimi
5. **AnalyticsSnapshot** — hız optimizasyonu
6. **MessageAttachment** — fotoğraf gönderimi

### 🥉 Tier 3 — Stratejik (2-3 ay)
1. **AI Copilot** — program önerisi, müşteri risk skoru
2. **Wearable entegrasyon** — Apple Health / Garmin
3. **Group coaching** — 1-N
4. **Referral program**
5. **White-label / Agency** modu (zaten `AGENCY` tier var, içerik yok)
6. **Public coach API** — third-party entegrasyon

---

## 7. Tespit Edilen Teknik Borçlar

| Sorun | Konum | Çözüm |
|---|---|---|
| `JSON` field'lar tipsiz (`specialties`, `features`, `tags`) | Schema | Zod parse'larını merkezi util'e topla |
| `marketplace` ve `coaches` sayfaları dublike | `/client/marketplace` ve `/client/coaches` | Birini deprecate et |
| Yerel `/uploads` — Vercel'de production'da çalışmaz | `lib/coach-avatar.ts`, movement-videos | S3 / Cloudflare R2'ye geç |
| `rating Decimal` ile float karışımı | Schema | Tek tipe normalize et |
| `pushSubscription` User'da inline JSON | `User.pushSubscription` | Ayrı `PushSubscription` tablosu (multi-device) |
| Session conflict detection yok | `/api/sessions` | Booking sırasında overlap check |
| Review sadece relation'ı olmayan da bırakabilir | `/api/reviews` | `verifiedPurchase` guard |

---

## 8. Özet

**Şu an**: Solid MVP — antrenman, beslenme, vücut takibi, mesajlaşma, basic marketplace, abonelik, video form-check, yorumlar, churn analizi var. Son sprintte review + session + availability + comparison + similar coaches eklendi.

**En kritik 3 eksik**:
1. **Gelir / Subscription panel** — coach kazancını göremiyor
2. **Gamification (achievement, streak, PR)** — client retention için tek aksiyon
3. **Coach profile zenginliği** — video intro + sertifika + yanıt süresi marketplace dönüşümünü 2x'ler

**Mimari prioritesi**: Önce `Subscription/Payment` + `Achievement` + `Goal` modelleri. Sonra `AnalyticsSnapshot` ile dashboard hızlandırma. Sonra S3 medya migrasyonu.
