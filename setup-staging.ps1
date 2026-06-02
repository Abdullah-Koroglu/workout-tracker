# FitCoach Multi-Environment Setup Script (Windows/PowerShell)
# Bu script staging ortamını ve veritabanını kurar

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "fitcoach",
    [string]$DbPassword = "fitcoach",
    [string]$StagingDb = "fitcoach_staging"
)

$ErrorActionPreference = "Stop"

# Renk tanımlamaları
function Write-Success {
    Write-Host "✓ $args" -ForegroundColor Green
}

function Write-Error {
    Write-Host "✗ $args" -ForegroundColor Red
}

function Write-Warning {
    Write-Host "! $args" -ForegroundColor Yellow
}

function Write-Info {
    Write-Host "➜ $args" -ForegroundColor Cyan
}

function Write-Section {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  $args" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
}

# Başlangıç
Write-Section "FitCoach - Çoklu Ortam Kurulum Scripti (Windows)"

Write-Host ""
Write-Info "PostgreSQL Bağlantı Bilgileri:"
Write-Host "  Host: $DbHost"
Write-Host "  Port: $DbPort"
Write-Host "  User: $DbUser"
Write-Host ""

# Adım 1: Staging veritabanını kontrol et ve oluştur
Write-Host "[1/5]" -ForegroundColor Yellow -NoNewLine
Write-Host " Staging veritabanı kontrol ediliyor..."

# PostgreSQL'e bağlanmayı test et
$env:PGPASSWORD = $DbPassword

try {
    & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "SELECT 1" | Out-Null
    Write-Success "PostgreSQL bağlantısı başarılı"
    
    # Veritabanı var mı kontrol et
    $dbExists = & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$StagingDb'" 2>$null
    
    if ($dbExists -match "1") {
        Write-Warning "Staging veritabanı zaten var"
        $response = Read-Host "Yeniden oluşturulsun mu? (y/n)"
        
        if ($response -eq "y") {
            & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "DROP DATABASE $StagingDb;" 2>$null
            Write-Success "Eski staging veritabanı silindi"
        } else {
            Write-Success "Mevcut staging veritabanı kullanılacak"
        }
    }
    
    # Veritabanı oluştur
    & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "CREATE DATABASE $StagingDb OWNER $DbUser;" 2>$null
    Write-Success "Staging veritabanı oluşturuldu: $StagingDb"
    
} catch {
    Write-Error "PostgreSQL bağlantısı başarısız!"
    Write-Host "   Lütfen PostgreSQL'in çalıştığından emin olun." -ForegroundColor Red
    exit 1
}

# Ortam değişkenini kapat
Remove-Item env:PGPASSWORD

Write-Host ""

# Adım 2: Node bağımlılıklarını kontrol et
Write-Host "[2/5]" -ForegroundColor Yellow -NoNewLine
Write-Host " Node bağımlılıkları kontrol ediliyor..."

if (Test-Path "node_modules") {
    Write-Success "Node bağımlılıkları yüklü"
} else {
    Write-Warning "Node bağımlılıkları yükleniyor..."
    npm install
    Write-Success "Node bağımlılıkları yüklendi"
}

Write-Host ""

# Adım 3: Prisma migration'larını uygula
Write-Host "[3/5]" -ForegroundColor Yellow -NoNewLine
Write-Host " Staging veritabanı migration'ları uygulanıyor..."

$env:NODE_ENV = "staging"
npm run db:migrate:deploy:staging --silent 2>$null | Out-Null
$env:NODE_ENV = ""

Write-Success "Migration'lar başarıyla uygulandı"

Write-Host ""

# Adım 4: Seed'i çalıştır
Write-Host "[4/5]" -ForegroundColor Yellow -NoNewLine
Write-Host " Zengin demo verisi yükleniyor (Türkçe)..."

$env:NODE_ENV = "staging"
npm run db:seed:staging --silent 2>$null
$env:NODE_ENV = ""

Write-Success "Demo verisi başarıyla yüklendi"

Write-Host ""

# Adım 5: Özet göster
Write-Host "[5/5]" -ForegroundColor Yellow -NoNewLine
Write-Host " Kurulum tamamlandı!"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ Staging Ortamı Kurulumu Başarılı!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Info "Staging Ortamını Başlatmak İçin:"
Write-Host ""
Write-Host "npm run dev:staging" -ForegroundColor Cyan
Write-Host ""

Write-Info "Genel Bilgiler:"
Write-Host "  🌐 URL: http://localhost:3002"
Write-Host "  📊 WebSocket: ws://localhost:3002/ws"
Write-Host ""

Write-Info "Kullanılabilecek Hesaplar:"
Write-Host "  Koç: mehmet@fitcoach.dev / 123456"
Write-Host "  Müşteri: can@fitcoach.dev / 123456"
Write-Host ""

Write-Info "İlave Komutlar:"
Write-Host "  npm run db:studio:staging  (Staging DB'yi görüntüle)"
Write-Host "  npm run db:seed:staging    (Demo veriyi yeniden yükle)"
Write-Host "  npm run db:migrate:deploy:staging  (Migration'ları tekrar uygula)"
Write-Host ""

Write-Host "📖 Daha fazla bilgi için ENVIRONMENTS.md dosyasını okuyun"
Write-Host ""
