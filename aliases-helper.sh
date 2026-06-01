#!/usr/bin/env bash
# Alias helper script - Quick commands for multi-environment
# Bunu ~/.bashrc veya ~/.zshrc dosyanıza ekleyin

# FitCoach Multi-Environment Commands

# Production Commands
alias fitcoach:prod="npm run dev"
alias fitcoach:prod:build="npm run build"
alias fitcoach:prod:start="npm start"
alias fitcoach:prod:db="npm run db:studio"
alias fitcoach:prod:seed="npm run db:seed:production"

# Staging Commands
alias fitcoach:staging="npm run dev:staging"
alias fitcoach:staging:build="npm run build"
alias fitcoach:staging:start="npm run start:staging"
alias fitcoach:staging:db="npm run db:studio:staging"
alias fitcoach:staging:seed="npm run db:seed:staging"
alias fitcoach:staging:setup="./setup-staging.sh"

# Database Commands
alias fitcoach:db:prod="npm run db:push"
alias fitcoach:db:staging="npm run db:push:staging"

# Info
fitcoach:help() {
    echo "FitCoach Ortam Komutları"
    echo "========================"
    echo ""
    echo "Production:"
    echo "  fitcoach:prod          - Production geliştirme (3000)"
    echo "  fitcoach:prod:build    - Production build"
    echo "  fitcoach:prod:start    - Production production sunucusu"
    echo "  fitcoach:prod:db       - Production DB Studio"
    echo "  fitcoach:prod:seed     - Production seed"
    echo "  fitcoach:db:prod       - DB şemasını güncelle"
    echo ""
    echo "Staging:"
    echo "  fitcoach:staging       - Staging geliştirme (3002)"
    echo "  fitcoach:staging:build - Staging build"
    echo "  fitcoach:staging:start - Staging production sunucusu"
    echo "  fitcoach:staging:db    - Staging DB Studio"
    echo "  fitcoach:staging:seed  - Staging seed (Türkçe demo veri)"
    echo "  fitcoach:db:staging    - Staging DB şemasını güncelle"
    echo "  fitcoach:staging:setup - Otomatik Staging kurulumu"
}

# Quick URLs
fitcoach:urls() {
    echo "FitCoach URL'leri"
    echo "=================="
    echo ""
    echo "Production:"
    echo "  http://localhost:3000"
    echo "  ws://localhost:3001/ws"
    echo ""
    echo "Staging:"
    echo "  http://localhost:3002"
    echo "  ws://localhost:3002/ws"
}
