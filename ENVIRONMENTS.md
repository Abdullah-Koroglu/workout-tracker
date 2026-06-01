# Çoklu Ortam Konfigürasyonu (Multi-Environment Setup)

FitCoach uygulaması şu anda **iki ortamı** desteklemektedir:

## 🏢 Ortamlar

### 1. Production (Üretim) - Port 3000
- **Veritabanı**: `fitcoach` (localhost:5432)
- **Ortam Dosyası**: `.env.production`
- **WebSocket Port**: 3001
- **Konfigürasyon**: Stabil, az veri ile test
- **Seed Dosyası**: `prisma/seed.ts`

### 2. Staging (Hazırlık) - Port 3002
- **Veritabanı**: `fitcoach_staging` (localhost:5432)
- **Ortam Dosyası**: `.env.staging`
- **WebSocket Port**: 3002 (WS://localhost:3002/ws)
- **Konfigürasyon**: Demo amaçlı, zengin Türkçe veri
- **Seed Dosyası**: `prisma/seed-staging.ts`

---

## 🚀 Komutlar

### Production Ortamı

```bash
# Geliştirme sunucusu başlat (port 3000)
npm run dev

# Production build yap
npm run build

# Production sunucusu başlat
npm start

# Veritabanını güncelle
npm run db:push

# Production seed'i çalıştır (İLK KURULUMDA)
npm run db:seed:production

# Prisma Studio aç
npm run db:studio
```

### Staging Ortamı

```bash
# Geliştirme sunucusu başlat (port 3002)
npm run dev:staging

# Staging WebSocket sunucusu başlat
npm run dev:staging:ws

# Production build yap (Staging için)
npm run build

# Staging sunucusu başlat (port 3002)
npm run start:staging

# WebSocket sunucusu başlat (Staging)
npm run start:staging:ws:local

# Veritabanını güncelle (Staging)
npm run db:push:staging

# Staging seed'i çalıştır (ZENGİN TÜRKÇE VERİ) - İLK KURULUMDA
npm run db:seed:staging

# Prisma Studio aç (Staging DB'ye bağlı)
npm run db:studio:staging
```

---

## 🗄️ Veritabanı Kurulumu

### PostgreSQL'de Staging Veritabanını Oluştur

```sql
-- psql'e bağlan veya pgAdmin kullan

-- Yeni veritabanı oluştur
CREATE DATABASE fitcoach_staging;

-- Aynı kullanıcıyı ver
-- (Eğer fitcoach kullanıcısı yoksa önce oluştur)
CREATE USER fitcoach WITH PASSWORD 'fitcoach';
ALTER DATABASE fitcoach_staging OWNER TO fitcoach;
```

Veya PowerShell/Terminal'de:

```bash
# PostgreSQL'e docker container üzerinden
docker exec postgres_container psql -U fitcoach -d postgres -c "CREATE DATABASE fitcoach_staging;"
```

---

## 📋 İlk Kurulum Adımları

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Production DB şemasını oluştur
npm run db:push

# 3. Production seed'i çalıştır
npm run db:seed:production

# 4. Staging DB şemasını oluştur
npm run db:push:staging

# 5. Staging seed'i çalıştır (Zengin demo veri)
npm run db:seed:staging

# 6. Production ortamını başlat
npm run dev

# 7. Ayrı bir terminal penceresinde Staging ortamını başlat
npm run dev:staging
```

---

## 🔑 Staging Ortamında Kullanılabilecek Hesaplar

### Koçlar
- **Mehmet Yılmaz**: mehmet@fitcoach.dev / 123456
- **Ayşe Kaya**: ayse@fitcoach.dev / 123456
- **Emre Demir**: emre@fitcoach.dev / 123456
- **Zeynep Şimşek**: zeynep@fitcoach.dev / 123456

### Müşteriler
- **Can Öz**: can@fitcoach.dev / 123456
- **Selin Aydın**: selin@fitcoach.dev / 123456
- **Burak Arslan**: burak@fitcoach.dev / 123456
- **Didem Yıldız**: didem@fitcoach.dev / 123456
- **Kerem Çelik**: kerem@fitcoach.dev / 123456
- **Hülya Kara**: hulya@fitcoach.dev / 123456
- **Deniz Şahin**: deniz@fitcoach.dev / 123456
- **Fatih Esen**: fatih@fitcoach.dev / 123456

---

## 📊 Staging Seed'in İçeriği

Staging ortamı şu zengin veri seti ile doldurulur:

- ✅ **4 Koç** - Türkçe adlarla
- ✅ **8 Müşteri** - Koçlarla ilişkili
- ✅ **23 Egzersiz** - Ağırlık ve kardiyö karışımı
- ✅ **6 Antrenman Şablonu** - Koçlar tarafından oluşturulmuş
- ✅ **5+ Tamamlanmış Antrenman** - Detaylı set kayıtları ile
- ✅ **Koç Yorumları** - Egzersiz geri bildirimleri
- ✅ **Devam Eden & Terk Edilen Antrenmanlar**

Tüm içerik **Türkçe** olup, gerçekçi antrenman senaryolarını simüle etmektedir.

---

## 🔄 Ortamlar Arası Geçiş

### Terminal 1 - Production (Port 3000)
```bash
npm run dev
```

### Terminal 2 - Staging (Port 3002)
```bash
npm run dev:staging
```

### Terminal 3 - Database Management
```bash
# Production DB Studio
npm run db:studio

# VEYA Staging DB Studio
npm run db:studio:staging
```

---

## ⚙️ Çevre Değişkenleri

### .env.production
```env
DATABASE_URL="postgresql://fitcoach:fitcoach@localhost:5432/fitcoach?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"
NODE_ENV=production
```

### .env.staging
```env
DATABASE_URL="postgresql://fitcoach:fitcoach@localhost:5432/fitcoach_staging?schema=public"
NEXTAUTH_URL="http://localhost:3002"
NEXT_PUBLIC_WS_URL="ws://localhost:3002/ws"
NODE_ENV=staging
```

---

## 🐳 Docker ile Çalıştırma (İsteğe Bağlı)

Eğer docker-compose.yml kullanılıyorsa, staging ortamı için de bir servisi tanımlanabilir:

```yaml
# docker-compose.yml ek yapısı
services:
  postgres:
    # ... mevcut config
    
  fitcoach-production:
    # ... mevcut config
    
  fitcoach-staging:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://fitcoach:fitcoach@postgres:5432/fitcoach_staging
    depends_on:
      - postgres
```

---

## 🚨 Sorun Giderme

### "fitcoach_staging veritabanı yok" hatası
```sql
-- PostgreSQL'e bağlan ve çalıştır
CREATE DATABASE fitcoach_staging;
CREATE USER fitcoach WITH PASSWORD 'fitcoach';
ALTER DATABASE fitcoach_staging OWNER TO fitcoach;
```

### Porta zaten bir servis bağlı
```bash
# Port 3002'yi kullanmayan bir port seç
npm run dev:staging:next -- -p 3003
```

### Seed çalıştırılırken hata
```bash
# Önce şema oluştur
npm run db:push:staging

# Sonra seed çalıştır
npm run db:seed:staging
```

---

## 📝 Not

- Production ortamı (`fitcoach`) stabil tutulmalıdır
- Staging ortamı (`fitcoach_staging`) demo ve test amaçlı
- Her ortamın kendi `.env` dosyası var
- Aynı anda her iki ortam da çalışabilir (farklı portlarda)
- Seed dosyaları data sıfırladığı için önemli veriyi koruyun

---

**Son Güncelleme**: Haziran 2026
