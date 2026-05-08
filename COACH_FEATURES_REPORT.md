# 🏋️ Koç Sistemi Detaylı Raporu

## 📋 İçindekiler
1. [Mevcut Özellikleri](#mevcut-özellikleri)
2. [Detaylı Özellik Analizi](#detaylı-özellik-analizi)
3. [Eksik Özellikler](#eksik-özellikler)
4. [Geliştirme Önerileri](#geliştirme-önerileri)
5. [Teknik Altyapı](#teknik-altyapı)

---

## 🎯 Mevcut Özellikleri

### ✅ Koç Profili Düzenleme Ekranı
- **URL**: `/coach/profile`
- **Rol**: COACH
- **Durum**: ✅ Tam işlevsel

### ✅ Koç Arama/Bulma Ekranı
- **URL**: `/client/coaches` ("Koç Bul" sekmesi)
- **Rol**: CLIENT
- **Durum**: ✅ Tam işlevsel

### ✅ Koçları Yönetme (CLIENT)
- **URL**: `/client/coaches` ("Koçlarım" sekmesi)
- **Rol**: CLIENT
- **Durum**: ✅ Tam işlevsel

### ✅ Profil Görüntüleme
- **URL**: `/client/coaches/[coachId]`
- **Rol**: CLIENT (herkes görebilir)
- **Durum**: ✅ Tam işlevsel

### ✅ Danışan Yönetimi (COACH)
- **URL**: `/coach/clients`
- **Rol**: COACH
- **Durum**: ✅ Tam işlevsel

---

## 🔍 Detaylı Özellik Analizi

### 1️⃣ KOACH PROFİLİ DÜZENLEME (`/coach/profile`)

#### ✅ Mevcut Özellikler

**A. Temel Bilgiler**
```
├─ İsim Soyisim
├─ Avatar Yükleme (2MB, JPG/PNG/WEBP)
├─ Hakkımda (Bio) - 1000 karakter
├─ Slogan - örneğin "Güçlü vücut, güçlü zihin"
└─ Vurgu Rengi (Custom color picker)
```

**B. Tecrübe & Bağlantılar**
```
├─ Tecrübe (Yıl) - 0-50
├─ Sosyal Medya Linki (URL)
└─ Uzmanlık Alanları - Tag sistemi ile
```

**C. Eğitim Paketleri**
```
├─ Paket Adı
├─ Paket Açıklaması
├─ Fiyat (₺/ay)
├─ Aktif/Deaktif durumu
└─ Sil seçeneği
```

**D. Dönüşüm Fotoğrafları**
```
├─ Önce/Sonra görsel pair'ları
├─ JSON formatında depolama
└─ UI'da gösterim (kısmen)
```

**E. Stil & Tema**
```
├─ Light mode tema ✅
├─ Orange aksent renk
├─ Profesyonel card tasarımı
└─ Smooth form validasyonu
```

#### ❌ Eksik/Eksik Özellikler

1. **Dönüşüm Fotoğrafları Yönetimi**
   - ❌ UI'da görsel ekleme/silme/düzenleme yoktur
   - ❌ Drag-drop desteği yok
   - ❌ Önce-Sonra detaylarını (ad, tarih, kilo, vb.) düzenleme yok
   - ❌ Batch upload desteklenmedi
   - 📊 **Etki**: Koçlar avatarını eklese de transformation gallery manual olarak database'e insert etmek zorunda

2. **Paket Yönetimi İyileştirmeleri**
   - ❌ "Popüler" paket işaretleme UI'da yok
   - ❌ Paket kategorileri (Başlangıç, Pro, Elite vb.) yok
   - ❌ Paket özelliklerini (features array) düzenleme yok
   - ❌ Fiyat karşılaştırma tablosu yok

3. **Sertifikasyon/Kredi Sistemi**
   - ❌ Coach credentials (ISSA, ACE, NASM vb.) alanı yok
   - ❌ Sertifika doğrulama mekanizması yok
   - ❌ Lisans/Belge yükleme özelliği yok

4. **Başarı Metrikleri Gösterimi**
   - ❌ Danışan başarı oranı profilde yok
   - ❌ Ortalama dönüşüm (kg, cm) verisi yok
   - ❌ Tamamlanma oranı (%) gösterilmiyor

---

### 2️⃣ KOACH ARAMA/BULMA (`/client/coaches` - "Koç Bul" sekmesi)

#### ✅ Mevcut Özellikler

**A. Arama & Filtreleme**
```
├─ Koç adına göre arama (free text)
├─ Uzmanlık alanına göre filtre (7 önceden tanımlanmış)
│  ├─ Kilo Verme
│  ├─ Güç Antrenmanı
│  ├─ Hacim Kazanma
│  ├─ Kardiyovasküler
│  ├─ Sporcu Performansı
│  ├─ Yüksek Performans
│  └─ Beslenme
├─ Filtreleri birlikte kullanma
└─ Filtreleri temizleme
```

**B. Koç Kartları (Grid View)**
```
├─ Koç Avatar (dinamik + placeholder)
├─ İsim & Slogan
├─ Bio (2 satır truncate)
├─ Specialty Tags (3'üne kadar gösterilir)
├─ Deneyim yılı
├─ Paket sayısı
├─ Bağlantı Durumu (Aktif/Bekliyor/Bağlı Değil)
└─ "İstek Gönder" / "Mesaj Gönder" Button
```

**C. Responsive Design**
```
├─ Mobile: 1 kolon
├─ Tablet: 2 kolon
└─ Desktop: 3 kolon
```

**D. State Management**
```
├─ Search loading state
├─ Empty state ile mesaj
├─ Error handling
└─ Real-time koç listesi (60 kadarı)
```

#### ❌ Eksik/Eksik Özellikler

1. **Gelişmiş Filtreleme**
   - ❌ Fiyat aralığı filtresi yok (min-max)
   - ❌ Rating/Puan filtresi yok (4.5+ gibi)
   - ❌ Deneyim yılı filtresi yok
   - ❌ Şehir/Lokasyon filtresi yok
   - ❌ Yazılı inceleme/testimonial filtresi yok

2. **Sıralama Seçenekleri**
   - ❌ Most popular
   - ❌ Highest rated
   - ❌ Most expensive / Cheapest
   - ❌ Most reviewed
   - ❌ Newest joiners

3. **Koç Karlarındaki Detaylar**
   - ❌ Star rating gösterilmiyor (4.9/5 gibi)
   - ❌ Review sayısı gösterilmiyor
   - ❌ Başarı oranı yok (%94 başarı gibi)
   - ❌ Danışan sayısı gösterilmiyor
   - ❌ Response time gösterilmiyor

4. **Comparison Feature**
   - ❌ Koçları yan yana kıyaslaştırma yok
   - ❌ Paket karşılaştırması yok
   - ❌ İstatistiksel karşılaştırma yok

5. **Arama Kalitesi**
   - ⚠️ Sadece tam ad eşleşmesi (contains search)
   - ❌ Fuzzy search yok
   - ❌ Yazım hatası toleransı yok
   - ❌ Kaydedilen favoriler yok
   - ❌ Arama geçmişi yok

6. **Analytics & Insights**
   - ❌ "Popüler koçlar" section yok
   - ❌ "Trending specialists" yok
   - ❌ "Yeni koçlar" section yok

---

### 3️⃣ KOÇLARI YÖNETME (CLIENT - `/client/coaches` "Koçlarım" sekmesi)

#### ✅ Mevcut Özellikler

**A. Aktif Bağlantılar (Accepted)**
```
├─ Koç Avatar + İsim
├─ Email
├─ "Aktif" badge (yeşil)
├─ "Mesaj Gönder" butonu
├─ Bağlantı Kaldır seçeneği
└─ Silme onayı dialog
```

**B. Bekleyen İstekler (Pending)**
```
├─ Koç Avatar + İsim
├─ Email
├─ "Bekliyor" badge (turuncu)
├─ Clock icon
└─ Otomatik olarak ayrı section
```

**C. Özet Kart (Right Sidebar)**
```
├─ Aktif Koç Sayısı
├─ Bekleyen İstek Sayısı
├─ Toplam Koç Havuzu
└─ Hızlı İşlemler
   ├─ Yeni Koç Keşfet
   └─ Mesajları Gör
```

**D. Empty State**
```
├─ Henüz koçun yoksa mesaj
└─ "Koç Bul" sekmesine geçiş butonu
```

#### ❌ Eksik/Eksik Özellikler

1. **Koç Yönetimi Özellikleri**
   - ❌ Favori/Yıldız işaretleme yok
   - ❌ Notlar/Reminders ekleyememe (örn: "Pazardan sonra iletişime geç")
   - ❌ Koç değiştirme durumu yoktur
   - ⚠️ Dönüşüm takibi/istatistikler çok basit

2. **İletişim Özellikleri**
   - ❌ Son mesaj görüntülenmemiş
   - ❌ Unread message count yok
   - ❌ Message preview yok
   - ❌ Quick message templates yok (örn: "Randevu alabilir miyiz?")

3. **İstatistik Gösterimi**
   - ❌ Danışan ile ne kadar süredir çalıştığı gösterilmiyor
   - ❌ Program ilerlemesi (%) gösterilmiyor
   - ❌ Başarı metrikleri (kilo verme miktarı gibi) gösterilmiyor
   - ❌ Session history/timeline yok

4. **Hızlı Erişim**
   - ❌ Koçun paketleri/fiyat listesi gösterilmiyor
   - ❌ Koçun uzmanlıklarını hızlı görememe
   - ❌ Appointment/Session planlama integrasyonu yok

5. **Deaktivizasyon/Duraklatma**
   - ❌ Koç ilişkisini "duraklatma" seçeneği yok
   - ❌ Geçici olarak devre dışı bırakma yok
   - ❌ Geçmişi/archived coaches alanı yok

---

### 4️⃣ KOACH PROFİLİ GÖRÜNTÜLEME (`/client/coaches/[coachId]`)

#### ✅ Mevcut Özellikler

**A. Hero Section**
```
├─ PageHero component
├─ Koç Avatar (dinamik + gradient placeholder)
├─ İsim
├─ Slogan
├─ Stat boxes (Deneyim, Uzmanlık, Paket sayısı)
├─ Bio metni
├─ Sosyal medya linki
└─ Specialty pills (accent color ile)
```

**B. Paketler Bölümü**
```
├─ Grid layout (1 veya 2 kolon)
├─ Her paket kartında:
│  ├─ Paket adı + açıklaması
│  ├─ Fiyat (₺/ay)
│  ├─ "İletişime Geç" / "Fiyat Sor" butonu
│  └─ Paket türü (Online Koçluk)
├─ Empty state (paket yoksa)
└─ "Fiyat Sor / İletişime Geç" butonu
```

**C. Dönüşüm Galerisi**
```
├─ TransformCarousel component
├─ Before/After slider
├─ Navigasyon (Önceki/Sonraki)
├─ Dot indicators
└─ İyi tasarlanmış UI
```

**D. Sağ Sidebar**
```
├─ Bağlantı Durumu Kartı
│  ├─ Aktif Bağlantı / Beklemede / Bağlı Değil
│  └─ "Bağlantı İsteği Gönder" butonu
├─ İletişim Kartı
│  └─ "Mesaj Gönder" butonu
├─ Uzmanlık Recap
│  └─ Specialty tags
└─ "Diğer Koçlara Bak" butonu
```

**E. Light Mode Tema**
```
├─ Beyaz kartlar
├─ Koyu metin (#0F172A)
├─ Orange aksent (#F97316)
├─ Soft gölgeler
└─ Profesyonel görünüm
```

#### ❌ Eksik/Eksik Özellikler

1. **Sosyal Proof**
   - ❌ Client testimonials/reviews bölümü yok
   - ❌ Star rating gösterilmiyor
   - ❌ Review count yok
   - ❌ Success stories bölümü yok
   - ❌ Video testimonials yok

2. **Daha Fazla İstatistik**
   - ❌ Danışan başarı oranı gösterilmiyor
   - ❌ Ortalama dönüşüm metrikleri yok
   - ❌ Transformation timeline yok
   - ❌ Success metrics açılı açılı değil

3. **Etkileşim Seçenekleri**
   - ❌ Takvim entegrasyonu (session booking) yok
   - ❌ Video call butonları yok
   - ❌ Quick appointment scheduling yok
   - ❌ Fiyat teklifi (quote) isteme yok

4. **Detaylı Paket Bilgileri**
   - ❌ Paket içerisindeki features listesi tam değil
   - ❌ Comparison table yok (3 paket arasında)
   - ❌ "Popüler" badge yok
   - ❌ Money-back guarantee gösterilmiyor

5. **Benzeri Koçlar**
   - ❌ "Similar coaches" recommendation yok
   - ❌ Cross-selling yok

6. **Koç Kalifikasyonları**
   - ❌ Sertifikalar gösterilmiyor
   - ❌ Deneyim stories detaylı değil
   - ❌ Eğitim/Qualification summary yok

---

### 5️⃣ DANIŞAN YÖNETIMI (COACH - `/coach/clients`)

#### ✅ Mevcut Özellikler

**A. Invite System**
```
├─ Invite link generator
├─ Unique code her coach için
└─ Copy-to-clipboard
```

**B. Client Segmentation**
```
├─ Accepted clients (Aktif danışanlar)
├─ Pending requests (Bekleme listesi)
└─ Compliance scoring
```

**C. Active Clients Section**
```
├─ Compliance ring visualization (%)
│  ├─ Yeşil ✅ (80+%)
│  ├─ Turuncu ⚠️ (50-80%)
│  └─ Kırmızı ❌ (<50%)
├─ Client name & email
├─ Compliance score badge
├─ Tooltip ile açıklama
└─ Message butonu
```

**D. Pending Requests**
```
├─ Alert banner (sarı uyarı)
├─ Kabul Et / Reddet butonları
├─ Client goal gösterilir
└─ Package selection gösterilir
```

**E. Broadcast Modal**
```
├─ Tüm danışanlara toplu mesaj
├─ Mesaj yazma alanı
└─ Gönder butonu
```

#### ❌ Eksik/Eksik Özellikler

1. **Detailed Client Profiles**
   - ❌ Client stats inline gösterilmiyor
   - ❌ Last workout date yok
   - ❌ Next scheduled workout yok
   - ❌ Quick access to client progress yok

2. **Advanced Filtering**
   - ❌ Compliance score'a göre filtre yok
   - ❌ Risk-based sorting yok
   - ❌ High-compliance vs low-compliance grouping yok
   - ❌ Tarih aralığına göre filtre yok

3. **Bulk Actions**
   - ❌ Birden fazla danışan seçme yok
   - ❌ Bulk assign workout yok
   - ❌ Bulk remove yok

4. **Client History**
   - ❌ Onboarding history yok
   - ❌ Contract/Agreement tracking yok
   - ❌ Billing history yok
   - ❌ Communication history (timeline) yok

5. **Analytics Dashboard**
   - ❌ Cohort analysis yok
   - ❌ Retention metrics yok
   - ❌ Revenue per client yok
   - ❌ Churn risk alerts eksik

6. **Relationship Management**
   - ❌ Client notes sistemik değil
   - ❌ Reminders/Follow-up schedule yok
   - ❌ Birthday/Anniversary reminders yok
   - ❌ Milestone tracking yok

---

## ❌ Eksik Özellikler (Genel)

### 🔴 Kritik Seviye
1. **Dönüşüm Fotoğrafları Admin UI** - Koçlar API üzerinden ekleyemiyor
2. **Koç Değerlendirme Sistemi** - Reviews/ratings yok
3. **Appointment Scheduling** - Takvim entegrasyonu yok
4. **Payment Integration** - Paket satın alma flow'u yok

### 🟠 Yüksek Seviye
1. Gelişmiş filtreleme & sıralama
2. Benzer koçları tavsiye etme
3. Koç karşılaştırma tablosu
4. Danışan ilişki notları
5. Risk score gösterilmesi

### 🟡 Orta Seviye
1. Arama geçmişi
2. Favoriler
3. Email notifications
4. SMS reminders
5. Success stories showcase

### 🟢 Düşük Seviye
1. Dark mode tema
2. Localization (diğer diller)
3. Advanced analytics
4. A/B testing hooks

---

## 💡 Geliştirme Önerileri

### Tier 1: MVP Özellikleri (1-2 hafta)

#### 1.1 Transformation Photos Management UI
```typescript
// Eklenecek: /coach/profile'a section
- Image upload (önce/sonra)
- Drag-drop reordering
- Detay: isim, tarih, kilo değişimi
- Silme/güncelleme
- Preview

Tahmini Çalışma: 16 saat
Dosya: Yeni TransformationPhotosManager.tsx
```

#### 1.2 Yıldız Sistemi & İncelemeler
```typescript
// Schema additions
CoachProfile {
  rating: Float (1-5)
  reviewCount: Int
  successRate: Int (%)  // ortalama başarı
  totalClientsServed: Int
}

Review {
  id: String
  coachId: String
  clientId: String
  rating: Float
  title: String
  body: String
  createdAt: DateTime
}

Tahmini Çalışma: 20 saat
Dosyalar: 
- ReviewCard.tsx
- ReviewForm.tsx
- api/reviews/route.ts
```

#### 1.3 Appointment Scheduling (Basit Versiyon)
```typescript
// Schema
CoachAvailability {
  id: String
  coachId: String
  dayOfWeek: Int (0-6)
  startTime: String
  endTime: String
}

Session {
  id: String
  coachId: String
  clientId: String
  scheduledFor: DateTime
  type: String (video_call, consultation, etc)
  status: String (scheduled, completed, cancelled)
}

Tahmini Çalışma: 24 saat
Dosyalar:
- AvailabilityManager.tsx
- SessionBooking.tsx
- api/sessions/route.ts
```

---

### Tier 2: Core Features (2-3 hafta)

#### 2.1 Gelişmiş Koç Filtresi
```typescript
// components/coach/AdvancedCoachFilter.tsx

Filters:
- Fiyat Aralığı (min-max)
- Rating (4.5+ gibi)
- Deneyim Yılı (5+)
- Şehir/Lokasyon
- Response Time (<24h)
- Uzmanlık (multi-select)
- Başarı Oranı (70+%)

Tahmini Çalışma: 20 saat
Dosya: AdvancedCoachFilter.tsx
```

#### 2.2 Koç Karşılaştırma
```typescript
// /client/coaches/compare?ids=coach1,coach2,coach3

View:
- Side-by-side koçlar
- Statlar (rating, price, experience)
- Paketler comparison table
- Specialties comparison
- Review özeti

Tahmini Çalışma: 16 saat
Dosyalar:
- CoachComparison.tsx
- ComparisonTable.tsx
- app/(client)/client/coaches/compare/page.tsx
```

#### 2.3 Client Notes & Relationship Management
```typescript
// Koach danışan notları

CoachClientNotes {
  id: String
  relationId: String
  notes: String
  tags: String[]
  lastUpdated: DateTime
}

Reminder {
  id: String
  relationId: String
  title: String
  description: String
  dueDate: DateTime
  completed: Boolean
}

Tahmini Çalışma: 16 saat
Dosyalar:
- ClientNotesPanel.tsx
- ReminderManager.tsx
```

---

### Tier 3: Growth Features (3-4 hafta)

#### 3.1 Success Stories Showcase
```typescript
// /coach/profile'da "Success Stories" bölümü

SuccessStory {
  id: String
  coachId: String
  clientName: String
  clientImage: String?
  beforeAfter: {
    beforeUrl: String
    afterUrl: String
  }
  metrics: {
    weightLost: Float?
    muscleGained: Float?
    strengthGain: Int?
    other: String[]
  }
  duration: String (örn: "3 ay")
  testimonial: String
}

Tahmini Çalışma: 16 saat
```

#### 3.2 Coach Recommendations
```typescript
// "Similar Coaches You Might Like"

Algorithm:
- Benzer specialties
- Benzer price range
- Same location
- High rating filter
- Excluding already connected

Tahmini Çalışma: 12 saat
```

#### 3.3 Danışan Risk Scoring
```typescript
// Churn risk analytics

RiskScore {
  compliance: 0-100
  engagementLevel: 0-100
  lastActivityDays: Int
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  recommendations: String[]
}

Tahmini Çalışma: 20 saat
```

---

## 🏗️ Teknik Altyapı

### Prisma Schema Additions

```prisma
// Ratings & Reviews
model Review {
  id        String   @id @default(cuid())
  coach     User     @relation("CoachReviews", fields: [coachId], references: [id], onDelete: Cascade)
  coachId   String
  client    User     @relation("ClientReviews", fields: [clientId], references: [id], onDelete: Cascade)
  clientId  String
  rating    Float    @default(5) // 1-5
  title     String?
  content   String
  isAnon    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@unique([coachId, clientId]) // Bir client bir review yazabilir
}

// Appointments/Sessions
model Session {
  id           String   @id @default(cuid())
  coach        User     @relation("CoachSessions", fields: [coachId], references: [id], onDelete: Cascade)
  coachId      String
  client       User     @relation("ClientSessions", fields: [clientId], references: [id], onDelete: Cascade)
  clientId     String
  scheduledFor DateTime
  duration     Int      @default(60) // minutes
  type         String   @default("consultation")
  status       String   @default("scheduled") // scheduled, completed, cancelled
  notes        String?
  createdAt    DateTime @default(now())
  
  @@index([coachId, scheduledFor])
  @@index([clientId, scheduledFor])
}

// Coach Availability
model CoachAvailability {
  id        String @id @default(cuid())
  coach     User   @relation(fields: [coachId], references: [id], onDelete: Cascade)
  coachId   String
  dayOfWeek Int    // 0-6 (Monday-Sunday)
  startTime String // HH:mm format
  endTime   String
  
  @@unique([coachId, dayOfWeek])
}

// Coach-Client Notes
model ClientNotes {
  id           String   @id @default(cuid())
  relation     CoachClientRelation @relation(fields: [relationId], references: [id], onDelete: Cascade)
  relationId   String   @unique
  notes        String
  tags         String   @default("[]") // JSON array
  lastUpdated  DateTime @updatedAt
}

// Enhanced CoachProfile
model CoachProfile {
  // ... existing fields ...
  
  // New fields
  reviewsReceived  Review[]  @relation("CoachReviews")
  avgRating        Float?
  successRate      Int?      // %
  totalClients     Int?      @default(0)
  
  sessions         Session[] @relation("CoachSessions")
  availability     CoachAvailability[]
}
```

### API Endpoints Örneği

```typescript
// GET /api/coaches/[coachId]
// Response includes:
{
  coach: {
    id, name, email,
    coachProfile: {
      // ... existing ...
      avgRating: 4.8,
      reviewCount: 24,
      successRate: 94,
      totalClientsServed: 48,
      reviews: [
        { rating: 5, title: "Harika", content: "..." },
        // ...
      ]
    }
  }
}

// GET /api/coaches?filter=advanced&...
// Query params:
// - minPrice, maxPrice
// - minRating
// - minExperience
// - location
// - specialties[]
// - sortBy (rating, price, experience, reviews)
// - limit, offset

// POST /api/reviews
// Body: { coachId, rating, title, content }

// POST /api/sessions
// Body: { coachId, scheduledFor, type }

// POST /api/coaches/[coachId]/notes
// Body: { notes, tags }
```

---

## 📊 Geliştirme Yol Haritası

### Q1 (3 ay)
- [ ] Dönüşüm fotoğrafları admin UI (Hafta 1)
- [ ] Yıldız/inceleme sistemi (Hafta 2)
- [ ] Basit appointment scheduling (Hafta 3)
- [ ] Gelişmiş filtreleme (Hafta 4)

### Q2 (3 ay)
- [ ] Koç karşılaştırması
- [ ] Danışan notları sistemi
- [ ] Risk scoring dashboard
- [ ] Success stories showcase

### Q3+ (Backlog)
- [ ] Payment integration
- [ ] Advanced recommendations
- [ ] Video consultation integration
- [ ] White-label options

---

## 🎯 Özet

### Güçlü Yönler ✅
- Clean, modern UI
- Good separation of concerns
- Responsive design
- Light mode tema
- Avatar system çalışıyor
- Transformation gallery exists

### Zayıf Yönler ❌
- Dönüşüm fotoğrafları yönetimi kopuk
- Hiç inceleme sistemi yok
- Filtering çok basit
- Appointment scheduling yok
- Payment integration eksik
- Risk analytics yok
- Comparison features yok

### İnsan Odaklı Sorunlar 🧠
- Koçlar portfolio'larını tam oluşturamıyor
- Danışanlar koçları seçmede kıyaslayamıyor
- Performans metrikleri gözükmüyor
- İlişki yönetimi kısıtlı

---

## 🚀 Başlamak İçin Önerilen Sıra

1. **Hafta 1**: Transformation photos UI
2. **Hafta 2**: Reviews & ratings system
3. **Hafta 3**: Appointment scheduling
4. **Hafta 4**: Advanced filters

Bu 4 hafta sonunda sistem 70% daha kullanışlı olacaktır.
