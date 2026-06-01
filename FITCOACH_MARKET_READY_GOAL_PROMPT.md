# FitCoach Market-Ready Goal Prompt

Bu repo üzerinde çalış: `C:\Users\abdullahkoroglu\Documents\sources\DIS\workout-tracker`

Ana hedef: FitCoach'u Türkiye pazarı için pazarlamaya ve ilk bağımsız koç satışlarına hazır hale getir. Ürün, önce bağımsız online fitness koçlarına SaaS olarak satılacak; daha sonra ajanslar ve koçluk hizmeti veren gym sahipleri için genişleyecek.

Ürün yönü:

- Birincil müşteri bağımsız online koçtur.
- Gelir modeli koçtan alınan SaaS aboneliğidir.
- Koç ödeme yapmak ister çünkü danışanlarını yönetir, profesyonel vitrin oluşturur ve açık marketplace üzerinden yeni müşteri bulabilir.
- Marketplace herkese açık olmalıdır.
- Marka hem uygun fiyatlı iyi koç bulmayı hem de premium performans koçluğu güvenini hissettirmelidir.
- AI, ana satış vaadi gibi değil; koça rapor, risk sinyali ve aksiyon önerisi üreten sessiz yardımcı gibi konumlanmalıdır.
- Video call ürün içine ileride ayrı geliştirilen RTC katmanıyla entegre edilecektir; şimdilik mimari ve UI buna hazırlıklı olsun.
- Öncelik Türkiye pazarıdır. Dil/locale altyapısı hazırlanabilir, ama ödeme ve operasyon Türkiye odaklı kalmalıdır.

Çalışma şekli:

- Önce mevcut uygulamayı incele, sonra küçük ama tamamlanmış iterasyonlarla uygula.
- Kullanıcının mevcut değişikliklerini geri alma.
- Her iterasyonda ürünü pazarlamaya yaklaştıran somut bir eksik kapat.
- Değişikliklerden sonra TypeScript ve hedefli lint doğrulaması çalıştır.
- `FITCOACH_IMPLEMENTATION_TODOS.md` dosyasını gerçek durumla güncel tut.

P0 bitene kadar odak:

- Koç onboarding akışını tamamla ve eksik adımları görünür yap.
- Dashboard, şablonlar, danışanlar ve profil için güçlü empty-state aksiyonları ekle.
- SaaS planlarını Free, Pro, Elite, Agency olarak netleştir; plan limitleri ve upgrade yönlendirmeleri tutarlı olsun.
- Koçların marketplace vitrini için profil kalite skoru, eksik alanlar ve görünürlük önerilerini güçlendir.
- Bağımsız koç satış demosu için temiz seed senaryosu hazırla.
- Auth, koç onboarding, danışan daveti, şablon oluşturma, workout atama ve marketplace akışını smoke-test edilebilir hale getir.
- Avatar, dönüşüm fotoğrafı, yemek fotoğrafı ve hareket videosu için production media storage kararını ver ve uygula.

P1 odak:

- Public coach profile sayfasını SEO, şehir, uzmanlık, paketler, yorumlar ve başarı hikayeleriyle satışa uygun hale getir.
- Verified review kurallarını gerçek koç-danışan ilişkisine veya aktif abonelik geçmişine bağla.
- Marketplace filtrelerini ekle: uygun fiyatlı, performans, dönüşüm, şehir, online, yüksek puanlı.
- Danışan için koç eşleştirme sihirbazı oluştur: hedef, bütçe, seviye, lokasyon/online tercihi.
- Koç action center ekle: bekleyen istekler, riskli danışanlar, cevapsız check-in'ler, okunmamış mesajlar, yaklaşan seanslar.
- Haftalık koç digest'i tasarla: adherence, PR, body log, nutrition, risk sinyali ve önerilen aksiyonlar.

P2 odak:

- RTC entegrasyonu için provider, roomId, callStatus, recordingUrl alanlarını ve UI hazırlığını ekle.
- Locale/i18n yapısını Türkçe varsayılan kalacak şekilde başlat.
- Agency/Gym modeli için owner, coach rolleri, ortak danışanlar, izinler ve raporlama modelini tasarla.
- Bağımsız koçlar için referral büyüme döngüsü ekle.

Başarı kriteri:

Ürün, bir bağımsız koça demo yapılabilecek, koçun kendi profilini/paketini/şablonunu/danışan yönetimini anlayabileceği, marketplace vitrininin değerini görebileceği, plan yükseltme nedenini hissedebileceği ve ilk satış/marketing sayfası için net konumlandırmaya sahip olacak hale gelmelidir.
