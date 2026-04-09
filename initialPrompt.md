Sen deneyimli bir full-stack Next.js geliştiricisisin.
Aşağıdaki tarife göre "FitCoach" adlı bir web uygulaması geliştir.

---

## TECH STACK

- **Framework:** Next.js 16
- **Dil:** TypeScript
- **Veritabanı:** SQLite
- **ORM:** Prisma (SQLite provider)
- **UI:** Tailwind CSS + shadcn/ui
- **State Management:** React Context + useState / useReducer
- **Form:** React Hook Form + Zod
- **Grafikler:** Recharts
- **Auth:** NextAuth.js v5 (credentials provider, JWT session)

---

## VERİTABANI ŞEMASI (Prisma — SQLite)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role
  createdAt DateTime @default(now())

  coachRelations  CoachClientRelation[] @relation("Coach")
  clientRelations CoachClientRelation[] @relation("Client")
  templates       WorkoutTemplate[]
  assignments     TemplateAssignment[]  @relation("AssignedTo")
  workouts        Workout[]
  comments        Comment[]
}

enum Role {
  COACH
  CLIENT
}

model CoachClientRelation {
  id        String           @id @default(cuid())
  coach     User             @relation("Coach", fields: [coachId], references: [id])
  coachId   String
  client    User             @relation("Client", fields: [clientId], references: [id])
  clientId  String
  status    RelationStatus   @default(PENDING)
  createdAt DateTime         @default(now())
}

enum RelationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model Exercise {
  id        String       @id @default(cuid())
  name      String
  type      ExerciseType
  createdAt DateTime     @default(now())

  templateExercises WorkoutTemplateExercise[]
  workoutSets       WorkoutSet[]
}

enum ExerciseType {
  WEIGHT
  CARDIO
}

model WorkoutTemplate {
  id          String   @id @default(cuid())
  coach       User     @relation(fields: [coachId], references: [id])
  coachId     String
  name        String
  description String?
  createdAt   DateTime @default(now())

  exercises   WorkoutTemplateExercise[]
  assignments TemplateAssignment[]
  workouts    Workout[]
}

model WorkoutTemplateExercise {
  id         String          @id @default(cuid())
  template   WorkoutTemplate @relation(fields: [templateId], references: [id])
  templateId String
  exercise   Exercise        @relation(fields: [exerciseId], references: [id])
  exerciseId String
  order      Int

  // Weight fields
  targetSets  Int?
  targetReps  Int?
  targetRir   Int?

  // Cardio fields
  durationMinutes Int?
  protocol        Json? // [{ minute: 1, speed: 6.5, incline: 2 }, ...]
}

model TemplateAssignment {
  id         String          @id @default(cuid())
  template   WorkoutTemplate @relation(fields: [templateId], references: [id])
  templateId String
  client     User            @relation("AssignedTo", fields: [clientId], references: [id])
  clientId   String
  assignedBy String
  createdAt  DateTime        @default(now())

  workouts Workout[]
}

model Workout {
  id           String           @id @default(cuid())
  client       User             @relation(fields: [clientId], references: [id])
  clientId     String
  template     WorkoutTemplate  @relation(fields: [templateId], references: [id])
  templateId   String
  assignment   TemplateAssignment @relation(fields: [assignmentId], references: [id])
  assignmentId String
  startedAt    DateTime         @default(now())
  finishedAt   DateTime?
  status       WorkoutStatus    @default(IN_PROGRESS)

  sets     WorkoutSet[]
  comments Comment[]
}

enum WorkoutStatus {
  IN_PROGRESS
  COMPLETED
}

model WorkoutSet {
  id         String   @id @default(cuid())
  workout    Workout  @relation(fields: [workoutId], references: [id])
  workoutId  String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])
  exerciseId String
  setNumber  Int

  // Weight
  weightKg Float?
  reps     Int?
  rir      Int?

  // Cardio
  durationMinutes Int?
  completed       Boolean @default(false)
}

model Comment {
  id        String   @id @default(cuid())
  workout   Workout  @relation(fields: [workoutId], references: [id])
  workoutId String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  content   String
  createdAt DateTime @default(now())
}
```

---

## AUTH

- NextAuth.js v5, credentials provider
- Şifre hash: bcryptjs
- Session: JWT
- Middleware ile rol bazlı yönlendirme:
  - /coach/** → sadece COACH rolü
  - /client/** → sadece CLIENT rolü
  - Giriş yoksa /login'e yönlendir

---

## CONTEXT YAPISI
contexts/
AuthContext.tsx       → session ve kullanıcı bilgisi
WorkoutContext.tsx    → aktif antrenman state'i (setler, zamanlayıcı)
NotificationContext.tsx → toast bildirimleri

---

## SAYFALAR & ÖZELLİKLER

### Auth
- /login
- /register → ad, email, şifre, rol seçimi (COACH / CLIENT)

---

### COACH TARAFI (/coach/...)

**/coach/dashboard**
- Toplam client sayısı
- Bu hafta antrenman yapan client sayısı
- Son antrenman aktiviteleri

**/coach/clients**
- Kabul edilmiş client listesi
- Bekleyen istekler → kabul / red butonu

**/coach/clients/[clientId]**
- Client profili
- Atanmış template'ler
- Geçmiş antrenmanlar → tıklayınca detay + yorum yazma

**/coach/clients/[clientId]/progress**
- Egzersiz seçimi
- Seçili egzersiz için ağırlık ve hacim grafiği (Recharts)
- Filtre: son 4 hafta / 3 ay / tümü

**/coach/templates**
- Template listesi

**/coach/templates/new**
**/coach/templates/[id]/edit**
- Template adı ve açıklaması
- Egzersiz ekleme (kütüphaneden seç)
- Ağırlık egzersizi: hedef set, tekrar, RIR
- Kardiyo egzersizi: toplam süre + dakika bazlı hız & eğim tablosu
- Egzersiz sırası sürükle-bırak (dnd-kit)

**/coach/templates/[id]/assign**
- Client seçme + ata

**/coach/exercises**
- Egzersiz listesi
- Yeni egzersiz ekle (ad + tür)

---

### CLIENT TARAFI (/client/...)

**/client/dashboard**
- Atanmış template'ler
- Geçmiş antrenmanlar
- Coach yorumları

**/client/coaches**
- Coach arama (isme göre)
- İstek gönder
- İstek durumu

**/client/workout/[assignmentId]/start**

Ağırlık hareketi:
- Hedef set/tekrar/RIR gösterilir
- Her set: ağırlık + tekrar + RIR girişi → "Seti Tamamla"

Kardiyo hareketi:
- Zamanlayıcı başlar
- O dakikaya ait hız ve eğim büyük puntolarla gösterilir
- Dakika geçince otomatik güncellenir
- Progress bar (kalan süre)
- Sayfa yenilenirse localStorage'dan kaldığı yerden devam eder

Tümü bitince → "Antrenmanı Tamamla" → kaydedilir

**/client/workouts/[workoutId]**
- Antrenman özeti
- Set detayları
- Coach yorumları

---

## API ROUTE YAPISI (/app/api/)
/api/auth/[...nextauth]
/api/auth/register
/api/coach/clients                        GET, POST
/api/coach/clients/[clientId]/relation   PATCH
/api/coach/clients/[clientId]/workouts   GET
/api/coach/clients/[clientId]/progress   GET
/api/coach/templates                     GET, POST
/api/coach/templates/[id]                PUT, DELETE
/api/coach/templates/[id]/assign         POST
/api/coach/workouts/[workoutId]/comments POST
/api/coach/exercises                     GET, POST
/api/client/assignments                  GET
/api/client/coaches                      GET
/api/client/coaches/request              POST
/api/client/workouts                     POST (start)
/api/client/workouts/[workoutId]/sets    POST
/api/client/workouts/[workoutId]/complete PATCH
/api/client/workouts/[workoutId]         GET

---

## KLASÖR YAPISI
app/
(auth)/
login/page.tsx
register/page.tsx
(coach)/
layout.tsx
dashboard/page.tsx
clients/
page.tsx
[clientId]/page.tsx
[clientId]/progress/page.tsx
templates/
page.tsx
new/page.tsx
[id]/edit/page.tsx
[id]/assign/page.tsx
exercises/page.tsx
(client)/
layout.tsx
dashboard/page.tsx
coaches/page.tsx
workout/
[assignmentId]/start/page.tsx
workouts/
[workoutId]/page.tsx
api/
...
components/
ui/               → shadcn bileşenleri
coach/
ClientCard.tsx
TemplateForm.tsx
ExerciseRow.tsx
CommentBox.tsx
ProgressChart.tsx
client/
AssignmentCard.tsx
WorkoutSetForm.tsx
CardioTimer.tsx
shared/
Navbar.tsx
RoleBadge.tsx
LoadingSkeleton.tsx
contexts/
AuthContext.tsx
WorkoutContext.tsx
NotificationContext.tsx
hooks/
useWorkoutTimer.ts
useWakeLock.ts
useProgress.ts
lib/
prisma.ts
auth.ts
validations/
user.ts
template.ts
workout.ts
prisma/
schema.prisma
seed.ts

---

## UI / UX KURALLARI

- Mobil öncelikli (mobile-first) tasarım
- Dark mode (next-themes)
- Coach arayüzü → mavi tonları
- Client arayüzü → yeşil tonları
- Antrenman sırasında ekran kapanmaz (WakeLock API)
- Kardiyo zamanlayıcısı sayfa yenilenirse localStorage'dan devam eder
- Skeleton bileşenler yüklenme durumları için
- Tüm formlar Zod ile validate edilir

---

## GELİŞTİRME SIRASI

1. Prisma şeması oluştur ve SQLite migration çalıştır
2. NextAuth credentials provider + register API
3. Middleware ile rol bazlı yönlendirme
4. Context'leri oluştur (Auth, Workout, Notification)
5. Coach: egzersiz kütüphanesi CRUD
6. Coach: template oluşturma / düzenleme (dnd-kit dahil)
7. Coach: client ilişki yönetimi + template atama
8. Client: coach arama ve istek sistemi
9. Client: antrenman başlatma + set kaydetme
10. Client: kardiyo zamanlayıcı (localStorage ile kalıcılık)
11. Coach: antrenman görüntüleme + yorum yazma
12. Coach: ilerleme grafikleri (Recharts)
13. Genel UI polish + mobil optimizasyon
14. seed.ts ile örnek veri