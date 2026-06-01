# 🚀 Hızlı Başlangıç - FitCoach Çoklu Ortam

## ⚡ 30 Saniyede Başla

### Windows (PowerShell)
```powershell
# 1. Setup scriptini çalıştır
.\setup-staging.ps1

# 2. Staging'i başlat
npm run dev:staging

# 3. Açılacak: http://localhost:3002
```

### macOS/Linux (Bash)
```bash
# 1. Setup scriptini çalıştır
chmod +x setup-staging.sh
./setup-staging.sh

# 2. Staging'i başlat
npm run dev:staging

# 3. Açılacak: http://localhost:3002
```

---

## 📍 Portlar

| Ortam | Port | WebSocket |
|------|------|-----------|
| **Production** | 3000 | ws://localhost:3001/ws |
| **Staging** | 3002 | ws://localhost:3002/ws |

---

## 🔑 Giriş Bilgileri (Staging)

**Şifre**: `123456`

### Koç Örneği
- **Email**: `mehmet@fitcoach.dev`
- **Şifre**: `123456`

### Müşteri Örneği
- **Email**: `can@fitcoach.dev`
- **Şifre**: `123456`

---

## 📋 Temel Komutlar

```bash
# 👨‍💻 GELIŞTIRME
npm run dev              # Production (port 3000)
npm run dev:staging      # Staging (port 3002)

# 🏗️ BUILD
npm run build            # Production build

# 🚀 ÜRETIM
npm start                # Production start
npm run start:staging    # Staging start

# 🗄️ VERİTABANI
npm run db:push          # Production schema
npm run db:push:staging  # Staging schema
npm run db:seed:staging  # Demo veriyi yükle
npm run db:studio        # Production DB Studio
npm run db:studio:staging # Staging DB Studio

# 🧪 TEST
npm run test:e2e         # E2E testleri çalıştır
npm run lint             # Lint kontrol
```

---

## 🎬 Ortak Senaryolar

### Senaryc 1: Production ve Staging'i Aynı Anda Çalıştır

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run dev:staging
```

**Terminal 3 (İsteğe bağlı - Database Tools):**
```bash
npm run db:studio        # Production DB
npm run db:studio:staging # Staging DB
```

---

### Senaryo 2: Staging'i Sıfırla ve Yeniden Yükle

```bash
# Staging veritabanını sıfırla
npm run db:push:staging

# Demo veriyi yeniden yükle
npm run db:seed:staging
```

---

### Senaryo 3: Production Build Yap ve Çalıştır

```bash
# Build
npm run build

# Production çalıştır (port 3000)
npm start
```

---

## 📖 Daha Fazla Bilgi

- **Detaylı Dokümantasyon**: [ENVIRONMENTS.md](./ENVIRONMENTS.md)
- **Kurulum Özeti**: [MULTI_ENVIRONMENT_SETUP.md](./MULTI_ENVIRONMENT_SETUP.md)
- **Sorun Giderme**: [ENVIRONMENTS.md#Sorun-Giderme](./ENVIRONMENTS.md#sorun-giderme)

---

## 🔍 Staging Ortamında Ne Var?

✅ **4 Koç** - Türkçe adlarla  
✅ **8 Müşteri** - Koçlarla ilişkili  
✅ **23 Egzersiz** - Ağırlık ve kardiyö  
✅ **6 Antrenman Şablonu**  
✅ **5+ Tamamlanmış Antrenman** - Detaylı kayıtlar  
✅ **Koç Yorumları** - Egzersiz geri bildirimleri  

**Tüm veri Türkçe ve gerçekçi senaryolara dayanmaktadır.**

---

## ⚠️ Önemli Notlar

🚨 **Seed scriptleri tüm verileri siler!**
- `npm run db:seed:staging` production'ı etkilemez
- Staging'i rahatça reset edebilirsiniz

🔐 **Production veritabanını koruyun**
- `.env` dosyası production konfigürasyonunu içerir
- `.env.staging` ayrı bir veritabanıdır

---

## 🆘 Hızlı Sorun Çözümü

| Sorun | Çözüm |
|-------|-------|
| **Port kullanımda** | Farklı port kullan: `npm run dev:staging:next -- -p 3003` |
| **DB bağlantı hatası** | PostgreSQL çalışıyor mu kontrol et |
| **Seed hatası** | Önce `npm run db:push:staging` çalıştır |
| **WebSocket hatası** | `.env.staging` dosyasını kontrol et |

---

## 📞 Yardım

Herhangi bir sorunla karşılaşırsanız:

1. [ENVIRONMENTS.md](./ENVIRONMENTS.md) dosyasını okuyun
2. [MULTI_ENVIRONMENT_SETUP.md](./MULTI_ENVIRONMENT_SETUP.md) kontrol edin
3. Setup scriptini yeniden çalıştırın: `./setup-staging.ps1` veya `./setup-staging.sh`

---

**Hızlı Referans Kartı** | *Son Güncelleme: Haziran 2026*
