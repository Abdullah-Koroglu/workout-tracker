<!-- 
### 1. PWA Push Notifications & Offline Kullanım
**Copilot İçin Context:** "Uygulama bir Next.js PWA'dır. `next-pwa` veya `serwist` kullanarak Service Worker yönetimini yapıyoruz. Push API ve Notification API entegrasyonu gerekiyor."

* **Detaylandırma:**
    * **VAPID Setup:** "Backend tarafında `web-push` kütüphanesini kullanarak VAPID anahtarlarını oluştur ve `/api/notifications/subscribe` endpoint'i üzerinden kullanıcı `subscription` objesini `User` modelinde yeni bir sahada sakla."
    * **Service Worker:** `sw.js` dosyasına `push` event listener ekle. Arka planda gelen veriyi `self.registration.showNotification` ile göster.
    * **Offline Support:** "Antrenman ekranında (`/workout/[id]`) girilen set verilerini, internet yoksa `IndexedDB` (veya localStorage) üzerinde tut. Bağlantı geldiğinde `sync` event'i ile veya manuel bir 'Sync' butonuyla veritabanına (Prisma) gönder."

### 2. In-App Mesajlaşma & Bildirimler
**Copilot İçin Context:** "Coach ve Client arasında asenkron mesajlaşma sistemi kurulacak. WebSocket (Pusher/Ably) veya basit bir 'polling' mekanizması kullanılabilir."

* **Detaylandırma:**
    * **Veri Modeli:** `Message` tablosu oluştur (`id, senderId, receiverId, content, createdAt, isRead`).
    * **UI:** `app/(shared)/messages` altında bir chat arayüzü oluştur. `useOptimistic` hook'u ile mesaj gönderildiğinde anında ekranda göster.
    * **Trigger:** "Bir Coach bir antrenmanı yorumladığında (`Comment` tablosu), sistem otomatik olarak bir `Notification` objesi oluştursun ve Push API üzerinden Client'a 'Coach yeni bir yorum bıraktı' bildirimi gitsin." -->

### 3. PR Kutlama ve Antrenman Bitim Paylaşım Kartı
**Copilot İçin Context:** "Kullanıcı antrenmanı bitirdiğinde veya bir egzersizde Personal Record (PR) kırdığında görsel bir özet üretilecek."

* **Detaylandırma:**
    * **PR Logiği:** "Egzersiz girilirken, kullanıcının o egzersizdeki geçmiş `maxWeight` verisini kontrol et. Eğer yeni giriş eskisinden büyükse `isPR: true` flag'i dön ve ekranda konfeti efekti (canvas-confetti) patlat."
    * **Share Card:** "Antrenman özeti ekranında (`WorkoutSummary`), `html-to-image` veya `satori` kullanarak; antrenman süresi, toplam hacim (volume) ve kırılan PR'ları içeren estetik bir 'Instagram Story' boyutunda kart üret. Kullanıcının bu kartı indirmesini sağla."

### 4. Mail Bildirimleri
**Copilot İçin Context:** "Kritik olaylarda (yeni ilişki isteği, haftalık özet) kullanıcıya e-posta gönderilecek."

* **Detaylandırma:**
    * **Nodemailer/Resend:** "Resend veya Amazon SES kullanarak bir mail servisi kur. `react-email` ile şık template'ler hazırla."
    * **Senaryolar:**
        * "Coach'a yeni bir client isteği geldiğinde."
        * "Client'a yeni bir antrenman atandığında."
        * "Pazartesi sabahları, Coach'a geçen haftanın 'tamamlanma oranlarını' içeren bir digest maili."

### 5. Beslenme, Vücut ve Performans Takibi
**Copilot İçin Context:** "Mevcut workout takibine paralel olarak metrik tabanlı yeni takip modülleri eklenecek."

* **Detaylandırma:**
    * **Beslenme:** `NutritionLog` tablosu (`calories, protein, carbs, fat, waterIntake`). Günlük hedefleri `User` profilinde sakla.
    * **Vücut Takibi:** `BodyMetric` tablosu (`weight, bodyFat, waist, chest, photoUrl`).
    * **Performans Grafikleri:** "Recharts kullanarak, `Exercise` bazlı 1RM (One Rep Max) tahmin grafiği ve vücut ağırlığı vs. antrenman hacmi korelasyon grafiği oluştur."

---

### Copilot'a Verilecek Örnek "Komut" (Prompt) Taslağı:

> "Mevcut Next.js 16 App Router ve Prisma yapımızda; `Workout` tablosu `COMPLETED` statüsüne geçtiğinde tetiklenecek bir yapı kur. Eğer bu workout içinde herhangi bir set, kullanıcının o egzersizdeki geçmiş rekorunu (maxWeight) geçiyorsa, kullanıcıya bir 'PR Başarısı' modalı göster ve bu görseli Instagram Story formatında (html-to-image kullanarak) indirilebilir bir kart olarak hazırla. Antrenman özetindeki verileri (süre, toplam kg) bu karta yansıt."