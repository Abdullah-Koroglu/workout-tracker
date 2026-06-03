#!/bin/bash

# FitCoach Multi-Environment Setup Script
# Bu script staging ortamını ve veritabanını kurar

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  FitCoach - Çoklu Ortam Kurulum Scripti"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PostgreSQL bağlantı bilgileri
DB_HOST="${1:-localhost}"
DB_PORT="${2:-5432}"
DB_USER="fitcoach"
DB_PASSWORD="fitcoach"
STAGING_DB="fitcoach_staging"

echo -e "${BLUE}PostgreSQL Bağlantı Bilgileri:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo ""

# Adım 1: Staging veritabanını kontrol et ve oluştur
echo -e "${YELLOW}[1/5]${NC} Staging veritabanı kontrol ediliyor..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} PostgreSQL bağlantısı başarılı"
    
    # Veritabanı var mı kontrol et
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$STAGING_DB'" | grep -q 1
    
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}!${NC} Staging veritabanı zaten var, yeniden oluşturulsun mu? (y/n)"
        read -r response
        if [ "$response" = "y" ]; then
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE $STAGING_DB;"
            echo -e "${GREEN}✓${NC} Eski staging veritabanı silindi"
        else
            echo -e "${GREEN}✓${NC} Mevcut staging veritabanı kullanılacak"
        fi
    fi
    
    # Veritabanı oluştur
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $STAGING_DB OWNER $DB_USER;"
    echo -e "${GREEN}✓${NC} Staging veritabanı oluşturuldu: $STAGING_DB"
else
    echo -e "${RED}✗${NC} PostgreSQL bağlantısı başarısız!"
    echo "   Lütfen PostgreSQL'in çalıştığından emin olun."
    exit 1
fi

echo ""

# Adım 2: Node bağımlılıklarını kontrol et
echo -e "${YELLOW}[2/5]${NC} Node bağımlılıkları kontrol ediliyor..."

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Node bağımlılıkları yüklü"
else
    echo -e "${YELLOW}!${NC} Node bağımlılıkları yükleniyor..."
    npm install
    echo -e "${GREEN}✓${NC} Node bağımlılıkları yüklendi"
fi

echo ""

# Adım 3: Prisma migration'larını uygula
echo -e "${YELLOW}[3/5]${NC} Staging veritabanı migration'ları uygulanıyor..."
npm run db:migrate:deploy:staging
echo -e "${GREEN}✓${NC} Migration'lar başarıyla uygulandı"

echo ""

# Adım 4: Seed'i çalıştır
echo -e "${YELLOW}[4/5]${NC} Zengin demo verisi yükleniyor (Türkçe)..."
npm run db:seed:staging
echo -e "${GREEN}✓${NC} Demo verisi başarıyla yüklendi"

echo ""

# Adım 5: Özet göster
echo -e "${YELLOW}[5/5]${NC} Kurulum tamamlandı!"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Staging Ortamı Kurulumu Başarılı!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "📋 Staging Ortamını Başlatmak İçin:"
echo ""
echo -e "${BLUE}npm run dev:staging${NC}"
echo ""
echo "🌐 URL: http://localhost:3002"
echo ""
echo "📚 Kullanılabilecek Hesaplar:"
echo "  Koç: mehmet@fitcoach.dev / 123456"
echo "  Müşteri: can@fitcoach.dev / 123456"
echo ""
echo "📖 Daha fazla bilgi için ENVIRONMENTS.md dosyasını okuyun"
echo ""
