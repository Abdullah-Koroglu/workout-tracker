# 🚀 Çoklu Ortam Kurulumu - Kurulum Özeti

## ✅ Tamamlanan İşlemler

FitCoach uygulaması başarıyla **çoklu ortam (multi-environment)** yapısına geçirilmiştir.

---

## 📁 Oluşturulan/Güncellenmiş Dosyalar

### 1. Ortam Dosyaları (Environment Files)
- ✅ **`.env.production`** - Production ortamı konfigürasyonu (Port 3000, fitcoach DB)
- ✅ **`.env.staging`** - Staging ortamı konfigürasyonu (Port 3002, fitcoach_staging DB)
- ✅ **`.env`** - Güncellenmiş (production tarafından kullanılır)

### 2. Seed Dosyaları (Database Seeders)
- ✅ **`prisma/seed.ts`** - Production seed (mevcut, az veri)
- ✅ **`prisma/seed-staging.ts`** - **YENİ** Staging seed (zengin Türkçe demo veri)

### 3. Yapılandırma Dosyaları (Configuration)
- ✅ **`package.json`** - 10 yeni npm script eklendi:
  - `dev:staging` - Staging geliştirme ortamı
  - `dev:staging:next` - Staging Next.js sunucusu
  - `dev:staging:ws` - Staging WebSocket sunucusu
  - `db:migrate:deploy:staging` - Staging migration'larını uygula
  - `db:seed:production` - Production seed'ini çalıştır
  - `db:seed:staging` - Staging seed'ini çalıştır
  - `db:studio:staging` - Staging DB'yi Prisma Studio'da aç
  - `start:staging` - Staging production build'i başlat

### 4. Dokümantasyon
- ✅ **`ENVIRONMENTS.md`** - Detaylı ortam konfigürasyon rehberi
- ✅ **`setup-staging.sh`** - Linux/macOS için otomatik setup scripti
- ✅ **`setup-staging.ps1`** - Windows PowerShell için otomatik setup scripti

---

## 🎯 Staging Seed'inin İçeriği

### Türkçe Veriler
```
✅ 4 Koç (Trainer)
   - Mehmet Yılmaz
   - Ayşe Kaya
   - Emre Demir
   - Zeynep Şimşek

✅ 8 Müşteri (Client)
   - Can Öz
   - Selin Aydın
   - Burak Arslan
   - Didem Yıldız
   - Kerem Çelik
   - Hülya Kara
   - Deniz Şahin
   - Fatih Esen

✅ 23 Egzersiz (Exercise)
   - Ağırlık antrenmanları: 16
   - Kardiyö antrenmanları: 7

✅ 6 Antrenman Şablonu (Workout Templates)
   - Güç A - Üst Vücut Bas + Kardiyö
   - Güç B - Alt Vücut + Sıra
   - Kondisyon Günü
   - Hipertrofi Tam Vücut
   - Dayanıklılık Mix
   - Push Day - Bas Odaklı
   - Pull & Legs - Çekme Günü

✅ 7+ Antrenman Ataması (Template Assignments)

✅ 5+ Tamamlanmış Antrenman (Completed Workouts)
   - Detaylı set kayıtları
   - Koç yorumları ve geri bildirimleri
   - Devam eden ve terk edilen antrenmanlar
```

---

## 🔧 Hızlı Kurulum Adımları

### Windows (PowerShell)
```powershell
# 1. Setup scriptini çalıştır (PostgreSQL gerekli)
.\setup-staging.ps1

# VEYA manuel kurulum:
# 2. PostgreSQL'de veritabanı oluştur
npm run db:migrate:deploy:staging

# 3. Demo veriyi yükle
npm run db:seed:staging
```

### Linux/macOS
```bash
# Setup scriptini çalıştır
chmod +x setup-staging.sh
./setup-staging.sh

# VEYA manuel kurulum:
npm run db:migrate:deploy:staging
npm run db:seed:staging
```

### Manuel (Tüm Platformlar)
```bash
# 1. PostgreSQL'de veritabanı oluştur (pgAdmin veya psql)
CREATE DATABASE fitcoach_staging;

# 2. Prisma migration'larını uygula
npm run db:migrate:deploy:staging

# 3. Staging seed'ini çalıştır
npm run db:seed:staging

# 4. Staging ortamını başlat
npm run dev:staging
```

---

## 🚀 Ortamları Çalıştırma

### Production (Port 3000)
```bash
npm run dev
# veya
npm start
```

### Staging (Port 3002)
```bash
npm run dev:staging
# veya
npm run start:staging
```

### Her İkisi Aynı Anda
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:staging

# Terminal 3 (İsteğe bağlı)
npm run db:studio          # Production DB
# veya
npm run db:studio:staging  # Staging DB
```

---

## 📊 Ortam Karşılaştırması

| Özellik | Production | Staging |
|---------|-----------|---------|
| **Port** | 3000 | 3002 |
| **Veritabanı** | fitcoach | fitcoach_staging |
| **DB Port** | 5432 | 5432 |
| **WebSocket Port** | 3001 | 3002 |
| **NextAuth URL** | localhost:3000 | localhost:3002 |
| **Veri** | Az (test) | Zengin (demo) |
| **Dil** | İngilizce | Türkçe |
| **Amaç** | Geliştirme | Demo/Sunum |

---

## 🔑 Test Hesapları (Staging)

Tüm hesaplar için şifre: **123456**

### Koç Hesapları
```
mehmet@fitcoach.dev
ayse@fitcoach.dev
emre@fitcoach.dev
zeynep@fitcoach.dev
```

### Müşteri Hesapları
```
can@fitcoach.dev
selin@fitcoach.dev
burak@fitcoach.dev
didem@fitcoach.dev
kerem@fitcoach.dev
hulya@fitcoach.dev
deniz@fitcoach.dev
fatih@fitcoach.dev
```

---

## 💡 İpuçları ve En İyi Uygulamalar

### ✅ Yapılması Gerekenler
- Staging'de serbest bir şekilde test etmeyi deneyin
- Yeni özellikleri önce staging'de test edin
- Production verisini düzenli olarak yedekleyin
- Her ortamın `.env` dosyasını ayrı tutun

### ❌ Yapılmaması Gerekenler
- Seed scriptini production'da çalıştırmayın (veri siler!)
- `.env` dosyalarını Git'e commit etmeyin
- Production veritabanını staging'de test etmeyin
- Aynı port üzerinde iki ortamı çalıştırmayın

---

## 🐛 Sorun Giderme

### "fitcoach_staging veritabanı yok" hatası
```sql
-- PostgreSQL'e bağlan ve çalıştır:
CREATE DATABASE fitcoach_staging;
```

### "Port 3002 zaten kullanımda"
```bash
# Farklı port kullan
npm run dev:staging:next -- -p 3003
```

### Seed çalıştırılırken hata
```bash
# Önce migration'ları uygula
npm run db:migrate:deploy:staging

# Sonra seed'i çalıştır
npm run db:seed:staging
```

### WebSocket bağlantı problemi
Staging ortamında `.env.staging` dosyasındaki bu satırı kontrol edin:
```env
NEXT_PUBLIC_WS_URL="ws://localhost:3002/ws"
```

---

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için `ENVIRONMENTS.md` dosyasını okuyun:
- Tüm npm scriptlerinin açıklaması
- Docker desteği
- Deployment rehberi
- İleri ayarlar

---

## 🎓 Sonraki Adımlar

1. ✅ `setup-staging.ps1` veya `setup-staging.sh` ile kurulumu tamamlayın
2. ✅ `npm run dev:staging` ile staging ortamını başlatın
3. ✅ http://localhost:3002 'ye gidin
4. ✅ Demo hesaplarıyla giriş yapın
5. ✅ Türkçe demo verisiyle özellikleri keşfedin

---

## 📝 Notlar

- **Seed Güvenliği**: Seed scriptleri tüm verileri siler, çok dikkatli kullanın
- **Port Çakışması**: Aynı anda iki ortamı çalıştırıyorsanız farklı portlar kullanın
- **Veritabanı**: PostgreSQL 12+ gerekli
- **Node.js**: 16+ gerekli
- **npm**: 8+ gerekli

---

**Son Güncelleme**: Haziran 2026  
**Durum**: ✅ Kurulum Tamamlandı
