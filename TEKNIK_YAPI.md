# Uygulama Teknik Olarak Nasıl Bir Yapıda?

Bu proje, Next.js App Router üzerinde çalışan full-stack bir web uygulamasıdır. UI, API, kimlik doğrulama ve veritabanı erişimi aynı kod tabanında yönetilir.

## Teknoloji Yığını
- **Framework**: Next.js 16 (App Router)
- **Dil**: TypeScript
- **UI**: React 19 + Tailwind CSS + Radix UI bileşenleri
- **Kimlik Doğrulama**: NextAuth (Credentials Provider, JWT session)
- **ORM/DB**: Prisma + SQLite
- **Validasyon**: Zod
- **Grafikler**: Recharts
- **E2E Test**: Playwright

## Mimari Yaklaşım
- Monorepo değil, tek uygulama reposu.
- App Router ile route grupları:
  - `app/(auth)` -> login/register akışları
  - `app/(coach)` -> coach ekranları
  - `app/(client)` -> client ekranları
  - `app/api/**` -> server-side API route'ları
- Server Components + Client Components birlikte kullanılıyor.
- UI state için React context ve custom hook'lar kullanılıyor.

## Kimlik Doğrulama ve Yetkilendirme
- Credentials tabanlı giriş (email + password).
- Şifreler `bcryptjs` ile hashleniyor.
- Session stratejisi JWT.
- `proxy.ts` ile rol bazlı route koruması:
  - `COACH` kullanıcılar client alanına yönlendirilmiyor.
  - `CLIENT` kullanıcılar coach alanına yönlendirilmiyor.
- API seviyesinde `requireAuth` yardımcı fonksiyonu ile role check yapılıyor.

## Veri Modeli (Prisma)
Temel tablolar:
- `User` (role: COACH | CLIENT)
- `CoachClientRelation` (PENDING/ACCEPTED/REJECTED)
- `Exercise` (WEIGHT | CARDIO)
- `WorkoutTemplate`
- `WorkoutTemplateExercise` (set/rep/RIR veya cardio duration/protocol)
- `TemplateAssignment`
- `Workout` (IN_PROGRESS/COMPLETED/ABANDONED)
- `WorkoutSet`
- `Comment`

Bu model, coach-client ilişkisini, template atamasını, workout icrasını ve yorum/analiz akışını uçtan uca taşıyor.

## API Katmanı
- Next.js Route Handlers (`app/api/**/route.ts`) kullanılıyor.
- İş kuralları API tarafında doğrulanıyor:
  - Session ve rol kontrolü
  - Coach-client ilişki kontrolü
  - Template sahipliği kontrolü
  - Idempotent/korumalı workout akışları

## Frontend Katmanı
- Tailwind + Radix ile bileşen tabanlı arayüz.
- Ortak durum yönetimi için context'ler:
  - `AuthContext`
  - `WorkoutContext`
  - `NotificationContext`
  - `ConfirmationContext`
- Özel iş akışları için custom hook'lar:
  - `useWorkoutFlow`, `useWorkoutTimer`, `useWorkoutActions`, `useExerciseManager` vb.

## Test ve Çalıştırma
- Geliştirme: `npm run dev` (port 3009)
- Build: `npm run build`
- E2E: `npm run test:e2e`
- Prisma:
  - `npm run db:push`
  - `npm run db:seed`

## Teknik Profilin Kısa Değerlendirmesi
Bu uygulama, modern TypeScript + Next.js full-stack yaklaşımıyla geliştirilmiş; rol bazlı erişim, güçlü domain modeli ve e2e test altyapısı olan, üretime yakın bir fitness takip sistemidir.
