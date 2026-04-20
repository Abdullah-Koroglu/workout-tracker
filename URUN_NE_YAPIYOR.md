# Ürün Nedir? — FitCoach

## Kısaca

**FitCoach**, kişisel antrenörlerin (coach) ve danışanlarının (client) dijital ortamda bir araya geldiği bir fitness yönetim platformudur. Koçlar antrenman programları oluşturup danışanlarına atar; danışanlar bu programları mobil cihazlarından canlı olarak yürütür. İki taraf da uygulama içinden birbirleriyle mesajlaşabilir.

---

## Kimler Kullanıyor?

| Rol | Kim? | Temel İhtiyacı |
|---|---|---|
| **Coach** | Kişisel antrenör, fitness danışmanı | Danışanlarını programlamak, ilerlemelerini takip etmek, geri bildirim vermek |
| **Client** | Sporcu, gym üyesi | Antrenman programına erişmek, seanslara katılmak, koçuyla iletişim kurmak |

---

## Ne İşe Yarıyor?

### 1. Antrenman Programı Oluşturma (Coach)

Coach, uygulama üzerinden egzersiz kütüphanesi oluşturur. Her egzersiz ağırlık antrenmanı (ağırlık / set / tekrar / RIR) veya kardiyo (süre / protokol) olarak tanımlanır.

Bu egzersizlerden **antrenman şablonları** hazırlar: egzersizlerin sırası, hedef set sayısı, tekrar sayısı, dinlenme süresi ve yorgunluk toleransı (RIR) şablona işlenir.

### 2. Program Atama

Coach, hazırladığı şablonu bir veya birden fazla danışanına atar. Atama tek seferlik veya takvime bağlı tekrarlı olabilir.

### 3. Antrenman Yürütme (Client)

Client, dashboard'unda kendisine atanmış antrenmanları görür. "Başlat" butonuna bastığı anda bir antrenman seansı açılır:

- Ekran kapanmaz (Wake Lock).
- Her egzersiz için set set ilerler; ağırlık, tekrar, RIR değerlerini girer.
- Süre sayacı çalışır.
- Antrenmanı tamamladığında konfeti animasyonu gösterilir.

Tüm veriler gerçek zamanlı kaydedilir; seans yarıda kalırsa kaldığı yerden devam edilebilir.

### 4. İlerleme Takibi

Coach, her danışanının antrenman geçmişini ve ilerleme grafiklerini görebilir. Tamamlanan antrenmanlar üzerine yorum bırakabilir.

Client da kendi antrenman geçmişini ve performans trendini görebilir.

### 5. Gerçek Zamanlı Mesajlaşma

Coach ve danışan, kabul edilmiş bir bağlantıdan sonra uygulama içinde anlık mesajlaşabilir:

- Mesajlar WebSocket üzerinden anlık iletilir.
- Uygulama kapalıysa push bildirimi gelir.
- Sohbet geçmişi 20'li paketler halinde yüklenir; "Önceki mesajları yükle" butonu ile daha eskisine erişilir.
- PWA olarak telefona yüklendiğinde native uygulama hissi verir.

### 6. Koç Bulma (Client)

Client, uygulamada koç arayabilir ve bağlantı isteği gönderebilir. Koç isteği kabul ederse bağlantı kurulur; şablon ataması ve mesajlaşma aktif hale gelir.

### 7. Haftalık Özet E-postası (Coach)

Her hafta otomatik olarak çalışan bir cron job, koçlara danışanlarının o haftaki antrenman özetini e-posta ile gönderir.

---

## Temel Kullanım Akışları

### Coach → Yeni Program Atama
```
Egzersiz Ekle → Şablon Oluştur → Danışana Ata
```

### Client → Antrenman Yapma
```
Dashboard → Atanmış Antrenmanı Gör → Başlat → Set Set İlerle → Tamamla
```

### Client → Koç Bulma
```
Koçlar Sayfası → Arama → İstek Gönder → Koç Kabul Eder → Bağlantı Kurulur
```

### İki Taraf → Mesajlaşma
```
Mesajlar → Konuşma Seç → Anlık Mesaj Gönder / Al
```

---

## Platform Özellikleri

### PWA (Progressive Web App)
Uygulama bir tarayıcı üzerinden açılır ama "Ana Ekrana Ekle" ile telefona kurulabilir. Kurulduktan sonra native uygulama gibi çalışır (tam ekran, splash screen, bildirimler).

### Çevrimdışı Deneyim
İnternet bağlantısı kesildiğinde sayfa beyaz ekrana dönmez; önceden görüntülenmiş sayfalar ve statik içerik önbellekten sunulur.

### Push Bildirimleri
Yeni mesaj geldiğinde veya antrenman programı atandığında, kullanıcı uygulamaya bakmıyor olsa bile cihazına bildirim gönderilir.

### Mobil Öncelikli Tasarım
Tüm ekranlar önce mobil için tasarlanmıştır. Mesaj ekranı gerçek bir mobil chat uygulaması deneyimi sunar: konuşma listesi + chat thread görünümü, gelen/giden mesaj balonları, okundu tiki, tarih ayırıcılar.

---

## Neler Henüz Yok / Kısıtlamalar

- **Ödeme sistemi yok.** Coach-client ilişkisi ücretsiz kurulur.
- **Veritabanı SQLite.** Geliştirme ve küçük ölçekli production için uygundur; büyük ölçekte PostgreSQL'e geçiş gerekir.
- **Sadece iki kullanıcı rolü var.** Gym yönetimi, grup antrenmanları gibi gelişmiş yapılar henüz desteklenmiyor.
- **Medya paylaşımı yok.** Mesajlarda resim/video gönderilemez (UI hazır, backend yok).
- **Koç analitikleri sınırlı.** Detaylı istatistik paneli henüz yok.
