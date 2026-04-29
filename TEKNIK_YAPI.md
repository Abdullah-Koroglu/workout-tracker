# Teknik Yapı — FitCoach

## Genel Mimari

Uygulama iki bağımsız Node.js sürecinden oluşur:

| Süreç | Port | Açıklama |
|---|---|---|
| Next.js App | 3000 | Tüm sayfalar, REST API route'ları, auth |
| WebSocket Server | 3001 | Gerçek zamanlı mesajlaşma (server.js) |

Hem Next.js hem de WS sunucusu aynı Dockerfile üzerinden derlenir; production ortamında üç container olarak koşar (nextjs_app, ws_server, postgres). Next.js ve WS sunucusu aynı PostgreSQL veritabanına bağlanır ve aynı AUTH_SECRET'ı paylaşır.

---

## Tech Stack

| Katman | Teknoloji | Versiyon |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.0.0 |
| Dil | TypeScript | ^5 |
| ORM | Prisma | 6.6.0 |
| Veritabanı | PostgreSQL | 16 |
| Auth | NextAuth v5 beta | 5.0.0-beta.25 |
| Şifreleme | bcryptjs | 2.4.3 |
| Stil | Tailwind CSS | 3.4.17 |
| UI Bileşenleri | Radix UI | çeşitli |
| Form | react-hook-form + Zod | 7.54 / 3.24 |
| WebSocket | ws (node) | 8.20.0 |
| Push Bildirim | web-push (VAPID) | 3.6.7 |
| E-posta | Nodemailer + @react-email | 6.9 / 2.0.7 |
| Grafik | Recharts | 2.15.2 |
| PWA | Özel Service Worker | — |
| Test | Playwright (E2E) | 1.59.1 |

---

## Klasör Yapısı

```
app/
	(auth)/           → /login, /register (herkese açık)
	(client)/         → CLIENT rolüne ait sayfalar
	(coach)/          → COACH rolüne ait sayfalar
	(shared)/         → /messages (her iki rol)
	api/              → REST API route'ları
components/
	client/           → Client'a özgü React bileşenleri
	coach/            → Coach'a özgü React bileşenleri
	shared/           → Ortak bileşenler (Navbar, MessagesClient, vb.)
	ui/               → Temel UI bileşenleri (Button, Input, vb.)
contexts/           → React context'leri (Auth, Workout, Notification, Confirmation)
hooks/              → Özel hook'lar
lib/                → Yardımcı modüller (prisma, auth, api-auth, push, email, vb.)
prisma/
	schema.prisma     → Veritabanı şeması
	seed.ts           → Geliştirme verisi
public/
	sw.js             → Service Worker
	manifest.webmanifest
validations/        → Zod şemaları
e2e/                → Playwright E2E testleri
server.js           → Bağımsız WebSocket sunucusu
```

---

## Veritabanı Şeması (Prisma / PostgreSQL)

### Modeller ve İlişkiler

```
User
 ├─ CoachClientRelation (coach veya client olarak)
 ├─ WorkoutTemplate      (coach'un oluşturduğu)
 ├─ TemplateAssignment   (coach'un atadığı)
 ├─ Workout              (client'ın yaptığı)
 ├─ Comment              (workout'a bırakılan)
 ├─ Message              (gönderen / alan)
 └─ Notification

CoachClientRelation
 └─ status: PENDING | ACCEPTED | REJECTED
 └─ benzersiz kısıt: [coachId, clientId]

WorkoutTemplate
 └─ WorkoutTemplateExercise[]  (sıralı egzersiz listesi)
		└─ Exercise (WEIGHT | CARDIO)
		└─ targetSets, targetReps, targetRir, durationMinutes, protocol (JSON?)

TemplateAssignment
 └─ Workout[]  (her çalışma seansı)

Workout
 └─ status: IN_PROGRESS | COMPLETED | ABANDONED
 └─ WorkoutSet[]  (her set için weightKg, reps, rir, durationMinutes, durationSeconds)
 └─ Comment[]

Message
 └─ indeksler: [senderId, receiverId, createdAt], [receiverId, isRead]

Notification
 └─ indeksler: [userId, isRead, createdAt]
```

---

## Kimlik Doğrulama

- **Strateji:** JWT (veritabanı session'ı yok).
- **Provider:** Credentials (email + bcrypt şifre karşılaştırma).
- **Roller:** `COACH` | `CLIENT` — JWT token'a ve session'a eklenir.
- **API güvenliği:** `lib/api-auth.ts` → `requireAuth(role?)` helper'ı. Kimliği doğrulanmamış istek → 401, yanlış rol → 403.
- **WS token:** `/api/messages/ws-token` → HMAC-SHA256 imzalı, 10 dakika geçerli kısa ömürlü token. WS sunucusu bu token'ı `timingSafeEqual` ile doğrular.

---

## API Route'ları

### Auth
| Method | Path | Açıklama |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |

### Coach — Egzersizler
| Method | Path | Açıklama |
|---|---|---|
| GET/POST | `/api/coach/exercises` | Liste / oluştur |
| PATCH/DELETE | `/api/coach/exercises/[id]` | Güncelle / sil |

### Coach — Şablonlar
| Method | Path | Açıklama |
|---|---|---|
| GET/POST | `/api/coach/templates` | Liste / oluştur |
| GET/PATCH/DELETE | `/api/coach/templates/[id]` | Detay / güncelle / sil |
| POST | `/api/coach/templates/[id]/assign` | Client'a ata |

### Coach — Client'lar
| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/coach/clients` | Kabul edilmiş client listesi |
| GET | `/api/coach/clients/[clientId]` | Client detayı |
| PATCH | `/api/coach/clients/[clientId]/relation` | Kabul / red |
| DELETE | `/api/coach/clients/[clientId]/relation` | İlişkiyi kaldır |
| GET | `/api/coach/clients/[clientId]/workouts` | Client antrenman geçmişi |
| GET | `/api/coach/clients/[clientId]/progress` | İlerleme verileri (grafikler) |

### Client — Koçlar
| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/client/coaches` | Koç arama (max 50 sonuç) |
| POST | `/api/client/coaches/[coachId]/request` | Bağlantı isteği gönder |
| DELETE | `/api/client/coaches/[coachId]` | İsteği iptal et / ilişkiyi kaldır |

### Client — Antrenmanlar
| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/client/assignments` | Görev listesi |
| GET/POST | `/api/client/workouts` | Antrenman listesi / başlat |
| GET/PATCH | `/api/client/workouts/[id]` | Detay / güncelle (tamamla/terk et) |
| POST | `/api/client/workouts/[id]/sets` | Set verisi kaydet |

### Mesajlaşma
| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/messages?withUserId=&cursor=&limit=` | Cursor-based sayfalandırılmış geçmiş |
| POST | `/api/messages` | HTTP yedek gönderim |
| GET | `/api/messages/ws-token` | WS auth token üret |
| GET | `/api/messages/threads` | Konuşma iş parçacığı listesi |

### Bildirimler & Cron
| Method | Path | Açıklama |
|---|---|---|
| POST/DELETE | `/api/notifications/subscribe` | Push aboneliği kaydet / sil |
| POST | `/api/cron/weekly-coach-digest` | Haftalık e-posta özeti (cron secret korumalı) |

---

## WebSocket Sunucusu (`server.js`)

### Bağlantı Yönetimi
- `Map<userId, Set<WebSocket>>` → Aynı kullanıcının birden fazla sekme/cihazı desteklenir.
- WS upgrade anında HMAC token doğrulanır; geçersiz token bağlantıyı keser.

### Mesaj Akışı (`send_message`)
1. İçerik doğrulama (max 2000 karakter).
2. Coach-Client ilişkisi `ACCEPTED` kontrol edilir.
3. `Message` kaydı DB'ye yazılır, `Notification` oluşturulur.
4. Gönderenin diğer sekmelerine ve alıcının tüm soketlerine anlık iletilir.
5. Alıcı çevrimdışıysa VAPID push bildirimi gönderilir; eski (410) abonelikler otomatik silinir.

### HTTP Endpoint
- `GET /health` → `{ ok: true }` (liveness probe için)

---

## Mesajlaşma Sayfalandırması

Cursor-based pagination:
- İlk yükleme: en son 20 mesaj.
- "Önceki mesajları yükle": `cursor` (ISO tarih) ile geriye doğru 20'li bloklar.
- `nextCursor` ve `hasMore` API response'ında döner.
- Scroll pozisyonu korunur (eski mesajlar yüklendiğinde aşağı zıplamaz).

---

## PWA / Service Worker

- **Özel SW** (`public/sw.js`) — Workbox kullanılmaz.
- Cache versiyonu: `fitcoach-static-v5`, `fitcoach-pages-v5`, `fitcoach-api-v5`.
- **Strateji:**
	- Statik dosyalar: Cache First
	- Sayfalar: Network First (offline → cache → `/offline.html`)
	- `/api/messages/*`: Network Only (canlı veri, önbelleğe alınmaz)
	- Diğer API: Stale-While-Revalidate
- **Push:** `push` event'i yakalanır, VAPID bildirimi gösterilir. `notificationclick` ilgili sayfaya yönlendirir.
- **Manifest:** `display: standalone`, dil `tr`, tema rengi `#22C55E`.
- `PwaRegister` bileşeni root layout'ta SW'yi kayıt eder.

---

## Docker Yapılandırması

```yaml
services:
	nextjs_app:    # Port 3000 + 5555 (Prisma Studio)
	ws_server:     # Port 3001
```

- Her iki servis de tek `Dockerfile`'dan derlenir.
- `ws_server` komutu: `prisma generate && npm run start:ws`
- `nextjs_app` komutu: `prisma generate && prisma db push && next start`
- PostgreSQL verisi Docker volume'da kalıcı: `postgres_data:/var/lib/postgresql/data`
- `.dockerignore`: `node_modules`, `.next`, `test-results`, `e2e` dahil edilmez.
- Her iki servis `restart: always`.

---

## Önemli Hook'lar

| Hook | Görev |
|---|---|
| `useWorkoutFlow` | Antrenman adım yönetimi (egzersiz → set → tamamla) |
| `useWorkoutTimer` | Anlık süre sayacı |
| `useExerciseManager` | Set ekleme/silme, veri güncelleme |
| `useWorkoutActions` | Antrenmanı tamamla/terk et API çağrıları |
| `useWakeLock` | Ekranın kapanmasını engeller (Screen Wake Lock API) |
| `useProgress` | İlerleme verisi fetch ve hesaplama |
| `useStartConfirmation` | Antrenman başlatma onay diyaloğu |

---

## E2E Testler

Playwright ile 6 test dosyası:
- `auth.spec.ts` — giriş, kayıt, yönlendirme
- `coach-client-relations.spec.ts` — bağlantı istekleri ve kabul akışı
- `exercise-template.spec.ts` — egzersiz ve şablon yönetimi
- `workout-execution.spec.ts` — antrenman yürütme akışı
- `workout-review.spec.ts` — tamamlanan antrenman incelemesi
- `complete-workflow.spec.ts` — uçtan uca tam kullanım senaryosu

Test ortamı: Chromium, Mobile Chrome, Mobile Safari, WebKit.
