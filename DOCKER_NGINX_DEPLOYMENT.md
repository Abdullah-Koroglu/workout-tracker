# 🐳 FitCoach - Docker & Nginx Deployment Guide

## 📋 Özet

- **Production**: Port 3000 (fitcoach.akoroglu.com.tr)
- **Staging**: Port 3002 (staging.fitcoach.akoroglu.com.tr)
- **Prisma Studio**: Port 5555 (studio.fitcoach.akoroglu.com.tr)
- **WebSocket Production**: Port 3001
- **WebSocket Staging**: Port 3002 (hem Next.js hem WebSocket aynı port)

---

## 🚀 Docker Kurulumu

### 1. Environment Dosyasını Hazırla

```bash
# Docker için env dosyası oluştur
cp .env.docker .env.docker.prod

# Gerekli değerleri düzenle
nano .env.docker.prod

# Production ve Staging secrets'ları güncelle
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_SECRET_STAGING="your-staging-secret"
```

### 2. Docker Compose ile Başlat

```bash
# Production + Staging ortamlarını başlat
docker-compose --env-file .env.docker.prod up -d

# Logs'u kontrol et
docker-compose logs -f

# Servis durumunu kontrol et
docker-compose ps
```

### 3. Veritabanlarını Hazırla

```bash
# Production DB'yi iniyalze et
docker-compose exec nextjs_app npm run db:seed:production

# Staging DB'yi iniyalize et (Zengin Türkçe veri)
docker-compose exec staging_nextjs_app npm run db:seed:staging
```

---

## 🔧 Nginx Yapılandırması

### Kurulu Dosya Yeri

```
/etc/nginx/sites-available/fitcoach
/etc/nginx/sites-enabled/fitcoach  (symbolic link)
```

### Yapılandırma Öğeleri

#### Production (fitcoach.akoroglu.com.tr)
```nginx
- Next.js App: 127.0.0.1:3000
- WebSocket: 127.0.0.1:3001
- Path: /ws
```

#### Staging (staging.fitcoach.akoroglu.com.tr)
```nginx
- Next.js App: 127.0.0.1:3002
- WebSocket: 127.0.0.1:3002
- Path: /ws
```

#### Prisma Studio (studio.fitcoach.akoroglu.com.tr)
```nginx
- Proxy: 127.0.0.1:5555
```

### Nginx'i Yeniden Başlat

```bash
# Konfigürasyonu kontrol et
sudo nginx -t

# Reload et (temiz restart, production'u kesintisiz)
sudo systemctl reload nginx

# Veya tam restart (kısa kesinti)
sudo systemctl restart nginx

# Status kontrol et
sudo systemctl status nginx
```

---

## 🔗 SSL Sertifikaları (Let's Encrypt)

### İlk Kez Staging SSL Sertifikası Oluştur

```bash
# Staging domain için sertifika
sudo certbot certonly --nginx -d staging.fitcoach.akoroglu.com.tr

# Studio domain'i güncelle (varsa)
sudo certbot certonly --nginx -d studio.fitcoach.akoroglu.com.tr
```

### Sertifikaları Yenile

```bash
# Tüm sertifikaları otomatik yenile
sudo certbot renew

# Veya manuel yenile
sudo certbot renew --manual
```

### Certbot Otomatik Renewal Kontrolü

```bash
# Status
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 📊 Docker Containerları

### Başlat/Durdur/Yeniden Başlat

```bash
# Başlat
docker-compose up -d

# Durdur
docker-compose down

# Yeniden başlat
docker-compose restart

# Belirli servisi yeniden başlat
docker-compose restart staging_nextjs_app
```

### Logs Görüntüle

```bash
# Tüm logs
docker-compose logs

# Production Next.js
docker-compose logs -f nextjs_app

# Staging Next.js
docker-compose logs -f staging_nextjs_app

# WebSocket
docker-compose logs -f ws_server

# Staging WebSocket
docker-compose logs -f staging_ws_server
```

### Container İçinde Komut Çalıştır

```bash
# Production
docker-compose exec nextjs_app bash
docker-compose exec nextjs_app npm run db:seed:production

# Staging
docker-compose exec staging_nextjs_app bash
docker-compose exec staging_nextjs_app npm run db:seed:staging

# Prisma Studio (Production)
docker-compose exec nextjs_app npm run db:studio

# Prisma Studio (Staging)
docker-compose exec staging_nextjs_app npm run db:studio:staging
```

---

## 🔍 Monitoring & Troubleshooting

### Port Kullanımını Kontrol Et

```bash
# Linux/macOS
lsof -i :3000  # Production Next.js
lsof -i :3002  # Staging Next.js
lsof -i :3001  # Production WebSocket
lsof -i :5432  # Production DB
lsof -i :5433  # Staging DB

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3002
```

### Nginx Status

```bash
# Açık bağlantıları kontrol et
sudo systemctl status nginx
ps aux | grep nginx

# Nginx processlerini kontrol et
sudo nginx -s signal  # graceful stop/reload
```

### Database Bağlantı Kontrolü

```bash
# Production
docker-compose exec postgres psql -U fitcoach -d fitcoach

# Staging
docker-compose exec staging_postgres psql -U fitcoach -d fitcoach_staging

# SQL Commands
\dt              # Tables listele
\du              # Users listele
SELECT version(); # Version kontrol et
```

---

## 🌐 Erişim Adresleri

| Servis | URL | Port |
|--------|-----|------|
| **Production** | https://fitcoach.akoroglu.com.tr | 443 (80→443) |
| **Staging** | https://staging.fitcoach.akoroglu.com.tr | 443 (80→443) |
| **Studio** | https://studio.fitcoach.akoroglu.com.tr | 443 (80→443) |
| **Production WS** | wss://fitcoach.akoroglu.com.tr/ws | 443 |
| **Staging WS** | wss://staging.fitcoach.akoroglu.com.tr/ws | 443 |

---

## 📝 Komut Hızlı Referansı

### Docker

```bash
# Başlat/Durdur
docker-compose up -d           # Başlat
docker-compose down            # Durdur
docker-compose restart         # Yeniden başlat
docker-compose logs -f         # Logs (live)

# Seed
docker-compose exec nextjs_app npm run db:seed:production
docker-compose exec staging_nextjs_app npm run db:seed:staging

# Database CLI
docker-compose exec postgres psql -U fitcoach -d fitcoach
docker-compose exec staging_postgres psql -U fitcoach -d fitcoach_staging
```

### Nginx

```bash
# Test/Yeniden Başlat
sudo nginx -t                  # Syntax kontrol
sudo systemctl reload nginx    # Reload (Graceful)
sudo systemctl restart nginx   # Restart (Full)

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL Sertifikaları
sudo certbot certonly --nginx -d staging.fitcoach.akoroglu.com.tr
sudo certbot renew
```

---

## 🆘 Yaygın Sorunlar

### Sorun: WebSocket Bağlantı Başarısız

**Çözüm**: Nginx configuration'da WebSocket headers'ı kontrol et
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Sorun: SSL Sertifikası Bulunamadı

**Çözüm**: Certbot ile sertifika oluştur
```bash
sudo certbot certonly --nginx -d staging.fitcoach.akoroglu.com.tr
```

### Sorun: Container Başlamıyor

**Çözüm**: Logs kontrol et
```bash
docker-compose logs staging_nextjs_app
# Veya container'a gir
docker-compose exec staging_nextjs_app bash
```

### Sorun: Database Bağlantı Hatası

**Çözüm**: Database sağlık kontrolü
```bash
docker-compose exec staging_postgres pg_isready -U fitcoach
```

### Sorun: Port Zaten Kullanımda

**Çözüm**: Port'u kullanan process'i bul
```bash
# Linux/macOS
lsof -i :3002

# Windows
netstat -ano | findstr :3002
```

---

## 📖 İlgili Dosyalar

- [ENVIRONMENTS.md](./ENVIRONMENTS.md) - Multi-environment setup
- [MULTI_ENVIRONMENT_SETUP.md](./MULTI_ENVIRONMENT_SETUP.md) - Setup özeti
- [QUICK_START.md](./QUICK_START.md) - Hızlı başlangıç
- [docker-compose.yml](./docker-compose.yml) - Docker Compose konfigürasyonu
- [.env.docker](./.env.docker) - Docker environment template

---

## ✅ Production Deployment Checklist

- [ ] .env.docker.prod dosyası yapılandırıldı
- [ ] Production secrets güncellendi
- [ ] Staging secrets güncellendi
- [ ] PostgreSQL veritabanları oluşturuldu
- [ ] Production seed çalıştırıldı
- [ ] Staging seed çalıştırıldı
- [ ] Nginx yapılandırması kontrol edildi
- [ ] SSL sertifikaları oluşturuldu
- [ ] All containers healthy
- [ ] WebSocket bağlantıları çalışıyor
- [ ] Logs monitörleniyor
- [ ] Backup sistemi aktif

---

**Son Güncelleme**: Haziran 2026  
**Status**: ✅ Production Ready
