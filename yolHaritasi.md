İşte Fitcoach B2B / Pazaryeri Dönüşümü Ana Yol Haritası:

### Faz 1: B2B SaaS Temelleri (Öncelik: Acil)
- [ ] **Tier (Abonelik) Altyapısı:** `User` veya `CoachProfile` tablolarına `subscriptionTier` (Ücretsiz, Tier 1, vb.) ve `maxClients` alanlarının eklenmesi[cite: 1].
- [ ] **Limit Kontrol Mekanizması:** Yeni öğrenci ekleme veya istek kabul etme aşamalarında `maxClients` sınırını denetleyen middleware/logic yazılması.
- [ ] **Öğrenci Davet Linkleri:** Antrenörlerin kendi öğrencilerini platforma kolayca çekebilmesi için onlara özel kayıt URL'leri (örn: `/invite/[coachId]`) oluşturulması.
- [ ] **Ödeme Entegrasyonu:** Iyzico, Stripe gibi bir altyapı ile antrenörlerin paket yükseltme (satın alma) akışının kurulması.

### Faz 2: CRM ve Gelişmiş Etkileşim (Öncelik: Kısa Vade)
- [ ] **Toplu Duyuru (Broadcast):** Mevcut `/api/messages` yapısı üzerinden[cite: 1], antrenörlerin tüm öğrencilerine tek tıkla duyuru geçebileceği bir arayüz.
- [ ] **Proaktif Uyarı Sistemi (Churn):** Mevcut `/coach/clients/[clientId]/progress` sayfasının akıllanarak[cite: 1], antrenmanı aksatan veya motivasyonu düşen öğrenciler için antrenör dashboard'una otomatik uyarı (alert) düşmesi.
- [ ] **Dinamik Check-in Formları:** Öğrencilere haftalık olarak gönderilecek basit uyku, stres ve motivasyon anketleri.

### Faz 3: Koçluk Derinliği ve Medya (Öncelik: Orta Vade)
- [ ] **Beslenme ve Toparlanma (Recovery):** Sisteme kalori, makro hedefleri ve genel toparlanma metriklerinin dahil edilmesi.
- [ ] **Video Form Analizi:** Öğrencilerin antrenman içindeki kritik setlerini videoya çekip yükleyebildiği ve koçun bu video üzerine yorum yazabildiği medya kütüphanesi.
- [ ] **Periyotlama (Takvim Yönetimi):** Antrenörlerin sadece günlük template atamak yerine[cite: 1], 12 haftalık makro/mikro döngü programları planlayabilmesi.

### Faz 4: Kurumsal Ölçeklenme (Öncelik: Orta - Uzun Vade)
- [ ] **Organizasyon (Tenant) Modeli:** Çoklu antrenör barındıran spor salonları (Gym) veya ajanslar için ana hesap (Admin) ve alt rollerin (Asistan Koç) oluşturulması.
- [ ] **Gelişmiş Yetki Sınırları (RBAC):** Alt koçların sadece kendi ilgilendiği müşterileri görebildiği, finansal verilerin sadece salon sahibine açık olduğu rol mimarisi.
- [ ] **Güvenlik ve Loglama:** API katmanında rate limiting uygulanması ve kritik değişiklikler için audit log (işlem geçmişi) tablosu oluşturulması[cite: 1].

### Faz 5: Pazar Yeri (Marketplace) Dinamikleri (Öncelik: Uzun Vade)
- [ ] **SEO Uyumlu Vitrin:** Mevcut `/client/coaches/[coachId]` profil sayfasının[cite: 1], arama motorlarında bulunabilir, başarı hikayeleriyle dolu zengin bir portfolyoya çevrilmesi.
- [ ] **Trust Score & Doğrulanmış Yorumlar:** Sadece antrenörle gerçekten çalışmış ve programı tamamlamış öğrencilerin puan verebildiği güven sistemi.
- [ ] **Algoritmik Arama ve Filtreleme:** Hedef, sakatlık durumu veya bütçe gibi etiketlerle öğrencileri en doğru antrenörlerle anında eşleştiren arama motoru.

### Faz 6: Yapay Zeka (AI) Asistanları (Öncelik: Vizyon)
- [ ] **Coach Copilot:** Öğrencinin geçmiş set verilerine bakarak, antrenör için yeni haftanın taslak programını otomatik çıkaran yardımcı AI.
- [ ] **Dinamik Yönlendirme:** Antrenman esnasında öğrencinin zorlanma durumuna (RIR/Intensity) göre kardiyo süresini veya set sayısını esneten arka plan AI servisi.

### Faz 7: Ekosistem ve Finansal Genişleme (Öncelik: Final)
- [ ] **Tek Seferlik E-Ticaret Modülü:** Antrenörlerin uzun süreli koçluk dışında "Hazır 12 Haftalık PDF Program" veya "Tek Seferlik Video Form Analizi" satabileceği altyapı.
- [ ] **Dışa Açık API (Open API):** Profesyonel antrenörlerin platformdaki kendi verilerini kişisel web sitelerine veya başka CRM araçlarına çekebilmeleri için API anahtarları[cite: 1].   