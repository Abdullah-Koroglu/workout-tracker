# 1. Tamamlanmış (End-to-End) Özellikler

- B2B Tier limiti ile danışan kabul kontrolü (hem client isteği gönderirken hem coach kabul ederken aktif):
Dosyalar: route.ts, [app/api/coach/clients/[clientId]/relation/route.ts](app/api/coach/clients/[clientId]/relation/route.ts), pricing.ts, schema.prisma
Endpointler: POST /api/client/coaches/request, PATCH /api/coach/clients/[clientId]/relation
Durum: UI + API + Prisma relation ve tier kontrolü birlikte çalışıyor.

- Coach billing/subscription sayfası Stripe + Prisma ile bağlı:
Dosyalar: BillingSubscriptionPage.tsx, route.ts, route.ts, route.ts, route.ts
Endpointler: GET /api/coach/subscription, POST /api/coach/subscription/checkout, POST /api/coach/subscription/portal, POST /api/webhooks/stripe
Durum: UI gerçek API çağırıyor, Stripe checkout/portal akışı var, webhook ile subscriptionTier DB güncelleniyor.

- Coach package yönetimi (oluşturma ve silme) gerçek DB bağlantılı:
Dosyalar: app/(coach)/coach/profile/page.tsx/coach/profile/page.tsx), route.ts, [app/api/coach/packages/[packageId]/route.ts](app/api/coach/packages/[packageId]/route.ts), schema.prisma
Endpointler: POST /api/coach/packages, DELETE /api/coach/packages/[packageId], GET /api/coach/packages
Durum: UI tarafında ekleme/silme çalışıyor, Prisma CoachPackage tablosuna yazıp okuyor.

- Coach-client bağlantı yönetimi (kabul/red/kaldır) ve bildirim zinciri:
Dosyalar: CoachClientsManager.tsx, [app/api/coach/clients/[clientId]/relation/route.ts](app/api/coach/clients/[clientId]/relation/route.ts), route.ts
Endpointler: PATCH/POST/DELETE /api/coach/clients/[clientId]/relation, POST /api/client/coaches/request
Durum: UI aksiyonları API’ye bağlı, DB relation güncelleniyor, notification da yazılıyor.

- Check-in sistemi (coach gönderir, client cevaplar) uçtan uca çalışıyor:
Dosyalar: CheckInManager.tsx, CheckInWidget.tsx, route.ts, route.ts, [app/api/client/checkins/[id]/route.ts](app/api/client/checkins/[id]/route.ts), schema.prisma
Endpointler: GET/POST /api/coach/checkins, GET /api/client/checkins, POST /api/client/checkins/[id]
Durum: UI ve API gerçek CheckIn/CheckInResponse tablolarına bağlı.

- 360° Client Hub ana sayfası server-side gerçek veri ile besleniyor:
Dosyalar: [app/(coach)/coach/clients/[clientId]/page.tsx](app/(coach)/coach/clients/[clientId]/page.tsx), ClientHub360.tsx, coach-timeline.ts, compliance.ts
Endpoint: Bu sayfa endpoint yerine server component içinde doğrudan Prisma sorguları kullanıyor.
Durum: Client relation kontrolü, compliance, assignments, workout sayıları, strength trend, weekly tonnage, heatmap, timeline gerçek DB’den hesaplanıyor.

- Progress sayfası (eski/ayrı akış) gerçek API + DB ile çalışıyor:
Dosyalar: [app/(coach)/coach/clients/[clientId]/progress/page.tsx](app/(coach)/coach/clients/[clientId]/progress/page.tsx), ProgressCharts.tsx, VolumeHeatmap.tsx, [app/api/coach/clients/[clientId]/progress/route.ts](app/api/coach/clients/[clientId]/progress/route.ts), [app/api/coach/clients/[clientId]/analytics/volume/route.ts](app/api/coach/clients/[clientId]/analytics/volume/route.ts)
Endpointler: GET /api/coach/clients/[clientId]/progress, GET /api/coach/clients/[clientId]/analytics/volume
Durum: UI grafikler gerçek endpointten geliyor.

# 2. Yarı Tamamlanmış (Sadece UI / Mock Data) Özellikler

- 360 Hub, Body sekmesi büyük ölçüde mock:
Dosya: ClientHub360.tsx
Detay: Günlük makrolar, body measurements history, aylık özet, nutrition notes sabit dizilerle render ediliyor; API çağrısı yok.

- 360 Hub, History sekmesindeki Form Kontrol Gelen Kutusu mock:
Dosya: ClientHub360.tsx
Detay: FORM_CHECKS sabit array. İncele butonu gerçek aksiyon yapmıyor (endpoint çağrısı yok).

- 360 Hub, Performance sekmesindeki Haftalık Tonaj Karşılaştırması kısmi mock:
Dosya: ClientHub360.tsx
Detay: Bar chart datasında H8-H11 statik; sadece H12’de current/prev değerleri dinamik weeklyTonnage’dan geliyor.

- 360 Hub header içindeki Uyar butonu işlevsiz:
Dosya: ClientHub360.tsx
Detay: Buton UI var, onClick yok, API entegrasyonu yok.

# 3. Yarı Tamamlanmış (Sadece Backend / DB) Özellikler

- Timeline API yazılmış ama aktif UI tüketimi görünmüyor:
Dosya: [app/api/coach/clients/[clientId]/timeline/route.ts](app/api/coach/clients/[clientId]/timeline/route.ts)
Durum: Aynı data coach-timeline.ts üzerinden 360 sayfasında server-side direkt kullanılıyor; route pratikte atıl kalmış.

- Coach package PATCH endpoint’i var ama profile UI’da kullanılmıyor:
Dosya: [app/api/coach/packages/[packageId]/route.ts](app/api/coach/packages/[packageId]/route.ts)
Durum: UI tarafı delete yapıyor, edit/update akışı bağlı değil.

- subscriptionStatus alanı schema ve read path’te var, write path eksik:
Dosyalar: schema.prisma, route.ts, route.ts
Durum: GET ile okunuyor, UI’da gösteriliyor; fakat webhook/checkout tarafında bu alanı güncelleyen akış yok.

- FormCheckRequest ve DailyLog:
Durum: Mevcut codebase ve schema içinde bu model adları bulunmuyor (tanım veya kullanım yok).

# 4. Eksik ve Kritik Bağlantılar (Action Plan)

- To-Do 1: 360 Body sekmesini gerçek veriye bağla.
Gerekenler: Client body metrics, nutrition logs, macro hedef-gerçekleşen değerleri için model + query + API/server query.
Hedef dosya: ClientHub360.tsx, veri katmanı [app/(coach)/coach/clients/[clientId]/page.tsx](app/(coach)/coach/clients/[clientId]/page.tsx)

- To-Do 2: 360 Form Kontrol inbox için gerçek backend akışı ekle.
Gerekenler: Form check request/review modeli, listeleme endpointi, inceleme aksiyonu endpointi, UI buton bağlama.
Hedef dosya: ClientHub360.tsx

- To-Do 3: 360 weekly tonnage comparison chart’ın tamamını dinamik yap.
Gerekenler: Son N haftayı DB’den çekip gerçek seri üretmek.
Hedef dosya: [app/(coach)/coach/clients/[clientId]/page.tsx](app/(coach)/coach/clients/[clientId]/page.tsx), ClientHub360.tsx

- To-Do 4: subscriptionStatus write-back ekle.
Gerekenler: Stripe webhook eventlerinde status mapping ve CoachProfile.subscriptionStatus güncellemesi.
Risk: UI’daki plan durum etiketi yanıltıcı kalıyor.
Hedef dosya: route.ts

- To-Do 5: Atıl endpointleri temizle veya UI’ya bağla.
Adaylar: /api/coach/clients/[clientId]/timeline, PATCH /api/coach/packages/[packageId]
Hedef: Ya route’ları kaldır ya da aktif ekranlardan tüket.

- To-Do 6: 360 sayfasında auth guard sertleştir.
Risk: [app/(coach)/coach/clients/[clientId]/page.tsx](app/(coach)/coach/clients/[clientId]/page.tsx) içinde auth sonucu null senaryo explicit yönetilmiyor; middleware’e güveniliyor.
Aksiyon: Role/session yoksa redirect veya notFound yerine controlled response.

- To-Do 7: Yeni model beklentisini netleştir.
Eğer roadmap’te FormCheckRequest ve DailyLog zorunluysa schema’ya eklenmeli; şu an yok.
Hedef dosya: schema.prisma

- To-Do 8: 360 Uyar butonuna gerçek aksiyon bağla veya kaldır.
Hedef dosya: ClientHub360.tsx