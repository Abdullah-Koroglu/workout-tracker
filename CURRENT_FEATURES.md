# FitCoach Mevcut Özellikler

Bu doküman, uygulamanın şu anda sahip olduğu tüm ana özellikleri ürün bakışıyla özetler.

## 1. Kimlik Doğrulama ve Rol Yapısı

- Kayıt olma: ad, e-posta, şifre ve rol seçimi ile kullanıcı oluşturma
- Giriş yapma: e-posta ve şifre ile credentials tabanlı oturum açma
- Rol ayrımı: `COACH` ve `CLIENT`
- Güvenli şifre saklama: `bcryptjs` ile hash
- Rol bazlı yönlendirme:
  - Coach -> `/coach/dashboard`
  - Client -> `/client/dashboard`
- Rol bazlı erişim koruması:
  - `/coach/**` sadece coach kullanıcılar
  - `/client/**` sadece client kullanıcılar

## 2. Coach Özellikleri

### 2.1 Egzersiz Kütüphanesi

- Egzersiz listeleme
- Yeni egzersiz ekleme
- Egzersiz tipi seçimi:
  - `WEIGHT`
  - `CARDIO`
- Template içinde kullanılan egzersizleri koruyan güvenli silme akışı

### 2.2 Workout Template Yönetimi

- Template listeleme
- Yeni template oluşturma
- Mevcut template düzenleme
- Template açıklaması ekleme
- Egzersiz kütüphanesinden egzersiz seçerek template oluşturma
- Sürükle bırak ile egzersiz sıralama
- Weight egzersizleri için:
  - hedef set
  - hedef tekrar
  - hedef RIR
- Cardio egzersizleri için:
  - toplam süre
  - dakika bazlı hız/eğim protokolü

### 2.3 Client İlişki Yönetimi

- Bekleyen client isteklerini görme
- Client isteğini kabul etme
- Client isteğini reddetme
- Kabul edilmiş client listesini görme
- Client detay sayfasına gitme

### 2.4 Template Atama

- Client detay sayfasından template atama
- Modal üzerinden coach'a ait template'leri seçme
- Aynı template'in tekrar atanmasını engelleyen koruma
- Atanan template geçmişini client profilinde görme

### 2.5 Workout Takibi ve İnceleme

- Client geçmiş workout listesini görme
- Workout detaylarını açma
- Her egzersizin set detaylarını görme
  - kilo
  - tekrar
  - RIR
  - cardio süresi
- Workout altına yorum bırakma
- Yorumları tarih sırasıyla görme

### 2.6 İlerleme Analizi

- Client bazlı ilerleme sayfası
- Egzersiz seçme dropdown'u
- Filtre seçenekleri:
  - son 4 hafta
  - son 3 ay
  - tüm zamanlar
- Recharts ile grafikler:
  - maksimum ağırlık grafiği
  - toplam hacim grafiği

### 2.7 Coach Dashboard

- Toplam client sayısı
- Bu hafta aktif workout sayısı
- Template sayısı
- Bekleyen istek sayısı
- Son aktiviteler listesi
- Hızlı client yönetim geçişleri
- İlerleme ekranına hızlı geçiş
- Template ve egzersiz kütüphanesine kısayollar

## 3. Client Özellikleri

### 3.1 Coach Bulma ve İlişki Yönetimi

- İsme göre coach arama
- Coach'a bağlantı isteği gönderme
- İstek durumu görme:
  - bekliyor
  - kabul edildi
  - reddedildi

### 3.2 Dashboard ve Günlük Akış

- Aktif antrenmana tek tıkla dönme
- Atanmış template'leri görme
- Geçmiş workout listesine geçme
- Coach yorumlarını ana ekranda görme
- Bağlı coach sayısını görme
- Hızlı yönlendirme kartları

### 3.3 Workout Yapma Deneyimi

- Atanmış template üzerinden workout başlatma
- Yarım kalan workout'u aynı assignment üzerinden devam ettirme
- Weight egzersiz akışı:
  - otomatik dolu önerilen kilo, tekrar ve RIR değerleri
  - geçmiş performansa göre önerilen kilo
  - set bazlı kayıt
  - tamamlanan set geçmişini anlık görme
  - ekstra set ekleyebilme
  - hareketi hedef set bitmeden manuel kapatabilme
- Cardio egzersiz akışı:
  - başlat
  - duraklat
  - devam et
  - durdur
  - sıfırla
  - yarıda bırak
  - canlı sayaç
  - büyük tempo kartı
  - canlı hız/eğim protokol gösterimi
  - ilerleme barı
  - kalan süre gösterimi
  - WakeLock ile ekranı açık tutma
  - localStorage ile sayaç durumunu koruma
- Workout ilerleme yüzdesi
- Egzersizler arasında hızlı geçiş
- Workout sonunda tamamlama akışı

### 3.4 Workout Geçmişi

- Tamamlanan workout listesini görme
- Workout detay sayfasını açma
- Egzersize göre gruplanmış set detayları
- Coach yorumlarını tarih ve yazar bilgisiyle görme

## 4. Global Uygulama Akışı ve Navigasyon

- Rol bazlı üst navbar
- Coach için üst menü:
  - dashboard
  - clientler
  - template'ler
  - egzersizler
- Client için üst menü:
  - dashboard
  - coach bul
  - geçmiş
- Client için aktif workout varsa navbar üzerinden direkt dönüş
- Dashboard'lardan ana ekranlara hızlı yönlendirme
- Client detay ekranından ilerleme grafiğine doğrudan geçiş

## 5. Bildirim ve UX Katmanı

- Toast bildirim sistemi
- Bildirim türleri:
  - success
  - error
  - warning
  - info
- Loading skeleton ekranları
- Boş state ekranları
- Coach arayüzünde mavi tonlu yön hissi
- Client arayüzünde yeşil tonlu yön hissi
- Mobil uyumlu düzenler

## 6. API ve Veri Güvenliği

- Tüm kritik API route'larında session kontrolü
- Yetkisiz erişimde 401 yanıtları
- Coach-client ilişki doğrulaması
- Sadece kabul edilmiş ilişkiler için veri görünürlüğü
- Template sahipliği doğrulaması
- İdempotent workout başlatma
- İdempotent set kaydetme
- Tamamlanmış workout'a yeni set yazmayı engelleme

## 7. Validasyon ve Mimari

- Zod tabanlı form doğrulama
- Server component ve client component ayrımı
- Prisma ile veri erişimi
- Next.js App Router yapısı

## 8. Seed ve Demo Veri

- 2 coach örnek kullanıcı
- 4 client örnek kullanıcı
- 10 egzersiz örnek verisi
- 3 template örnek verisi
- Demo giriş akışları için hazır hesaplar

## 9. Mevcut Ürün Güçlü Yanları

- Coach ve client arasında gerçek bir uçtan uca workout yönetim akışı var
- Hem weight hem cardio senaryoları destekleniyor
- İlerleme grafikleri ve yorum sistemi çalışıyor
- Workout deneyimi yarım kalma ve geri dönme senaryolarını destekliyor
- Uygulama akışı artık dashboard ve navbar üzerinden daha temiz yönetiliyor
