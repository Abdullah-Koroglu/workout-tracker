Aşağıdaki özellikleri sırayla geliştir. Her adımı tamamlamadan geçme.

---

## ADIM 1 — Auth (Kayıt & Giriş)

- /register sayfası: ad, email, şifre, rol seçimi (COACH / CLIENT)
- /login sayfası: email + şifre
- NextAuth credentials provider ile JWT session
- Şifre bcryptjs ile hash'lenir
- Giriş sonrası rol'e göre yönlendir: COACH → /coach/dashboard, CLIENT → /client/dashboard
- Middleware: /coach/** sadece COACH, /client/** sadece CLIENT erişebilir

---

## ADIM 2 — Egzersiz Kütüphanesi (Coach)

- /coach/exercises sayfası
- Egzersiz listesi: ad ve tür (WEIGHT / CARDIO) gösterilir
- Yeni egzersiz ekleme formu: ad + tür seçimi
- Egzersiz silme
- API: GET /api/coach/exercises, POST /api/coach/exercises, DELETE /api/coach/exercises/[id]

---

## ADIM 3 — Workout Template Oluşturma (Coach)

- /coach/templates → template listesi, yeni template butonu
- /coach/templates/new ve /coach/templates/[id]/edit sayfaları
- Template formu:
  - Ad ve açıklama girişi
  - Egzersiz kütüphanesinden egzersiz seç ve ekle
  - WEIGHT egzersizi için: hedef set, tekrar, RIR girişi
  - CARDIO egzersizi için: toplam dakika + dakika bazlı hız & eğim tablosu (satır ekle/sil)
  - Egzersiz sırası @hello-pangea/dnd ile sürükle-bırak
- API: GET/POST /api/coach/templates, PUT/DELETE /api/coach/templates/[id]

---

## ADIM 4 — Client-Coach Bağlantısı

Coach tarafı:
- /coach/clients sayfası: kabul edilmiş client listesi + bekleyen istekler
- Bekleyen isteği kabul et / reddet butonu
- API: GET /api/coach/clients, PATCH /api/coach/clients/[clientId]/relation

Client tarafı:
- /client/coaches sayfası: isme göre coach arama
- Coach kartında "İstek Gönder" butonu
- Gönderilen isteğin durumu gösterilir (Bekliyor / Kabul / Red)
- API: GET /api/client/coaches, POST /api/client/coaches/request

---

## ADIM 5 — Template Atama (Coach)

- /coach/clients/[clientId] sayfasında "Template Ata" butonu
- Modal açılır: coach'un template listesi listelenir, seç ve ata
- Atanan template'ler client profilinde listelenir
- API: POST /api/coach/templates/[id]/assign

---

## ADIM 6 — Antrenman Yapma (Client)

- /client/dashboard: atanmış template'ler listelenir, "Başla" butonu
- /client/workout/[assignmentId]/start sayfası:

  WEIGHT hareketi:
  - Hedef set/tekrar/RIR gösterilir
  - Her set için: ağırlık (kg) + tekrar + RIR girişi
  - "Seti Tamamla" → sonraki set

  CARDIO hareketi:
  - Zamanlayıcı başlar
  - O dakikaya ait hız ve eğim büyük puntolarla gösterilir
  - Dakika geçince otomatik güncellenir
  - Progress bar ile kalan süre
  - Sayfa yenilenirse localStorage'dan kaldığı dakikadan devam eder

  Tümü bitince "Antrenmanı Tamamla" → workout kaydedilir

- API: POST /api/client/workouts, POST /api/client/workouts/[id]/sets, PATCH /api/client/workouts/[id]/complete

---

## ADIM 7 — Antrenman Görüntüleme & Yorum (Coach)

- /coach/clients/[clientId] sayfasında geçmiş antrenman listesi
- Antrenmana tıklayınca: her setin detayı (ağırlık, tekrar, RIR)
- Altta yorum yazma alanı + gönder butonu
- Yorumlar tarih sırasıyla listelenir
- API: GET /api/coach/clients/[clientId]/workouts, POST /api/coach/workouts/[workoutId]/comments

---

## ADIM 8 — İlerleme Grafikleri (Coach)

- /coach/clients/[clientId]/progress sayfası
- Egzersiz seçimi (dropdown)
- Seçili egzersiz için Recharts ile:
  - Ağırlık grafiği (tarih vs kg)
  - Hacim grafiği (tarih vs toplam kg×tekrar)
- Filtre: son 4 hafta / 3 ay / tümü
- API: GET /api/coach/clients/[clientId]/progress?exerciseId=&range=

---

## ADIM 9 — Client Antrenman Geçmişi

- /client/dashboard: geçmiş antrenmanlar listelenir
- /client/workouts/[workoutId]: antrenman özeti, set detayları, coach yorumları
- API: GET /api/client/workouts, GET /api/client/workouts/[workoutId]

---

## ADIM 10 — UI Polish & Genel İyileştirmeler

- Tüm sayfalara loading skeleton ekle
- Boş state mesajları ekle (client yok, template yok vb.)
- Toast bildirimleri: başarı ve hata durumları
- Antrenman sırasında WakeLock API ile ekran kapanmasını engelle
- Coach arayüzü mavi tonları, Client arayüzü yeşil tonları
- Tüm sayfalar mobil uyumlu kontrol edilir ve düzenlenir
- prisma/seed.ts: 2 coach, 4 client, 10 egzersiz, 3 template örnek verisi

---

## GENEL KURALLAR

- Her API route session kontrolü yapar, yetkisiz erişimde 401 döner
- Tüm formlar Zod şemasıyla validate edilir
- Sayfa geçişlerinde Next.js loading.tsx kullanılır
- Server component / client component ayrımına dikkat edilir
- Prisma sorguları lib/prisma.ts üzerinden yapılır