Aşağıdaki analiz repo kodu, route’lar, ana component’ler, Prisma şeması ve `prisma/seed-staging.ts` üstünden çıkarıldı. Kısa versiyon: FitCoach, koç ve danışanı tek platformda birleştiren bir “coach operating system” gibi kurgulanmış; güçlü tarafı koç paneli + danışan takip + marketplace benzeri eşleşme + egzersiz/veri takibi. Zayıf tarafı ise public pazaryeri ve koçtan danışana ödeme akışının tam ürünleşmemiş olması.

## Ürün Özeti

FitCoach iki ana persona için çalışıyor:

- `Coach`: danışan yönetimi, program oluşturma/atama, check-in, mesajlaşma, gelir/abonelik ve profil vitrini.
- `Client`: günlük dashboard, workout execution, body progress, nutrition log, goals/PR/achievement, koç bulma ve koçla çalışma.

Önemli çerçeve:
- Çok güçlü: koç CRM + workout sistemi + danışan günlük deneyimi + mesajlaşma + progress tracking.
- İyi seviyede: reviews, session booking, coach comparison, mobility, churn/risk sinyalleri.
- Dikkat: public marketplace yok; marketplace deneyimi giriş yapmış danışan içinde.
- Dikkat: Stripe/Iyzico entegrasyonu ağırlıkla **koçun SaaS planı** için güçlü. Danışanın koç paketini platform içinden satın alma akışı tam değil; çoğu yerde CTA mesajlaşmaya düşüyor.

## Sayfa Haritası

| Path | Rol | Kategori | Ne işe yarar? |
|---|---|---|---|
| `/` | public | public | Landing page, ürünün genel vaadini anlatıyor. |
| `/login` | auth | auth | Giriş ekranı; koç/danışan varyasyonu var. |
| `/register` | auth | auth | Rol seçmeli kayıt akışı. |
| `/invite/[coachId]` | auth | auth | Koç davetiyle danışan onboarding’i. |
| `/messages` | auth | shared | Rol bazlı mesaj ekranına redirect. |
| `/chat/[coachId]` | auth | shared | Belirli kişiyle mesaj thread’ine redirect. |
| `/coach/dashboard` | coach | core | Koç ana paneli; KPI, canlı workout, risk, check-in, gelir, seans. |
| `/coach/clients` | coach | CRM | Danışan listesi, bekleyen talepler, invite link, broadcast. |
| `/coach/clients/[clientId]` | coach | CRM | Danışanın 360 görünümü: timeline, compliance, performans, body, feedback. |
| `/coach/clients/[clientId]/progress` | coach | analytics | Danışanın ilerleme grafikleri ve volume analizi. |
| `/coach/templates` | coach | workout | Program/şablon listesi, kategori ve limit yönetimi. |
| `/coach/templates/new` | coach | workout | Yeni antrenman/program oluşturma. |
| `/coach/templates/[id]/edit` | coach | workout | Program düzenleme. |
| `/coach/templates/[id]/assign` | coach | workout | Programı danışanlara tarih bazlı atama. |
| `/coach/exercises` | coach | workout | Egzersiz kütüphanesi yönetimi. |
| `/coach/mobility` | coach | workout | Mobilite hareketleri ve rutinleri. |
| `/coach/messages` | coach | messaging | Koç mesajlaşma ekranı. |
| `/coach/profile` | coach | marketplace | Koç vitrin profili, paketler, dönüşüm fotoğrafları, availability. |
| `/coach/subscription` | coach | billing | Koç SaaS planı ve abonelik yönetimi. |
| `/coach/billing` | coach | billing | `/coach/subscription` ile aynı ekran. |
| `/coach/admin` | coach | admin | Gerçek admin panel değil, dashboard’a redirect. |
| `/client/dashboard` | client | core | Danışan ana paneli; bugünün antrenmanı, streak, check-in, goals, PR, achievements. |
| `/client/profile` | client | profile | Danışan fiziksel bilgiler, hedef ve seviye profili. |
| `/client/coaches` | marketplace | marketplace | Koçlarım + Koç Bul sekmeli marketplace yüzeyi. |
| `/client/coaches/[coachId]` | marketplace | marketplace | Koç detay vitrini, paketler, dönüşümler, yorumlar, seans planlama. |
| `/client/coaches/compare` | marketplace | marketplace | 2-3 koçu yan yana karşılaştırma. |
| `/client/workouts` | client | workout | Geçmiş workout listesi. |
| `/client/workouts/[workoutId]` | client | workout | Tamamlanan/yarım antrenman detayları, yorumlar, PR, video feedback. |
| `/client/workout/[assignmentId]/start` | client | workout execution | Workout başlatma ve akışa girme. |
| `/client/calendar` | client | planning | Atanmış programları takvimde görme. |
| `/client/body-progress` | client | progress | Kilo, ölçümler, foto bazlı fiziksel ilerleme. |
| `/client/nutrition/log` | client | nutrition | Foto ile öğün/log gönderme, plana uyum etiketi. |
| `/client/messages` | client | messaging | Danışan mesajlaşma ekranı. |
| `/client/form-analysis` | client | coaching | Serbest video yükleyip form analizi isteme. |
| `/client/marketplace` | marketplace | marketplace | `/client/coaches`’a redirect. |
| `/client/marketplace/[coachId]` | marketplace | marketplace | `/client/coaches/[coachId]`’a redirect. |

## Kullanıcı Rolleri

**Koç neler yapabiliyor?**
- Danışan kabul/red, ilişki yönetimi, toplu mesaj.
- Program şablonu oluşturma, düzenleme, atama.
- Egzersiz ve mobilite kütüphanesi yönetimi.
- Danışan uyumluluk, churn riski, timeline ve performans izleme.
- Check-in gönderme ve cevapları okuma.
- Kendi marketplace profilini, paketlerini, dönüşüm görsellerini ve uygunluk saatlerini düzenleme.
- Kendi SaaS aboneliğini ve fatura geçmişini yönetme.

**Danışan neler yapabiliyor?**
- Günlük workout’u başlatma ve tamamlama.
- Geçmiş workout, PR, achievement ve streak takibi.
- Body metrics ve progress photo takibi.
- Beslenme log’u ve check-in gönderme.
- Koç bulma, karşılaştırma, koç isteği gönderme.
- Koçla mesajlaşma, yorum yazma, seans planlama.
- Serbest form analizi videosu gönderme.

**Public ziyaretçi ne görebiliyor?**
- Landing, login, register.
- Davet linkiyle invite onboarding.
- Ama açık/public koç dizini yok.

**Admin / sistem tarafı var mı?**
- Ayrı bir `ADMIN` rolü yok.
- `/coach/admin` gerçek admin panel değil.
- `AGENCY` bir rol değil, abonelik tier’ı.
- Operasyonel capability’lerin bir kısmı API/model seviyesinde var, ama ayrı admin UI yok.

## Özellik Haritası

| Özellik | Sayfalar | Kullanıcı | Kullanıcı faydası | Pazarlama değeri | Demo? | Screenshot? | Öncelik |
|---|---|---|---|---|---|---|---|
| Coach dashboard | `/coach/dashboard` | Coach | Tek ekranda operasyon yönetimi | “Koç işini tek panelden yönetir” | Evet | Evet | P0 |
| Danışan CRM | `/coach/clients`, `/coach/clients/[id]` | Coach | Danışanları takip, kabul, aksiyon alma | B2B satın alma sebebi çok güçlü | Evet | Evet | P0 |
| Client dashboard | `/client/dashboard` | Client | Günlük yapılacakları net gösterir | Ürün engagement hikayesi güçlü | Evet | Evet | P0 |
| Workout template sistemi | `/coach/templates*` | Coach | Ölçeklenebilir program üretimi | “1’e 1 koçluğu ürünleştirir” | Evet | Evet | P0 |
| Workout execution | `/client/workout/[assignmentId]/start` | Client | Programı adım adım uygular | Son kullanıcı deneyimini somutlaştırır | Evet | Evet | P0 |
| Workout history + detail | `/client/workouts*` | Client | Gelişimi ve koç yorumlarını görür | Sonuç/kanıt hissi verir | Evet | Evet | P1 |
| Check-in sistemi | dashboard bileşenleri | Coach, Client | Haftalık durum takibi | “Koç sadece program değil, takip de yapıyor” | Evet | Evet | P0 |
| Body progress tracking | `/client/body-progress`, coach client hub | Coach, Client | Ölçüm + foto ile dönüşüm takibi | Önce/sonra hikayesi için çok değerli | Evet | Evet | P0 |
| Nutrition log | `/client/nutrition/log` | Client | Kolay beslenme uyum takibi | Uygulamayı sadece workout app olmaktan çıkarır | Evet | Evet | P1 |
| Messaging | `/coach/messages`, `/client/messages` | Coach, Client | Sürekli iletişim | “WhatsApp dağınıklığını toplar” | Evet | Evet | P0 |
| Marketplace / koç bulma | `/client/coaches*` | Client | Koç keşfi ve karşılaştırma | Acquisition tarafında güçlü anlatı | Evet | Evet | P0 |
| Coach profile vitrini | `/coach/profile`, `/client/coaches/[id]` | Coach, Client | Koçun satış vitrini oluşur | Marketplace dönüşümünü anlatır | Evet | Evet | P0 |
| Reviews | coach detail | Client | Güven ve sosyal kanıt | Satışta anlatması kolay | Evet | Evet | P1 |
| Packages/pricing | coach profile + coach detail | Coach, Client | Teklifleri netleştirir | “Koç teklifini ürünleştirir” | Evet | Evet | P0 |
| Session booking | coach detail + sessions panel | Client, Coach | Görüşme planlama | Premium coaching hissi verir | Evet | Evet | P1 |
| Coach SaaS billing | `/coach/subscription` | Coach | Kendi planını yönetir | SaaS monetization için kritik | Evet | Evet | P1 |
| Achievements + streak + PR | client dashboard | Client | Motivasyon ve devamlılık | Retention anlatısında güçlü | Evet | Evet | P1 |
| Form analysis video | `/client/form-analysis`, workout detail feedback | Client, Coach | Uzaktan teknik geri bildirim | Rakip ayrıştırıcı | Evet | Evet | P0 |
| Analytics / churn alerts | coach dashboard, client hub | Coach | Riskli danışanı erken fark eder | “Akıllı koç operasyonu” anlatısı | Evet | Evet | P0 |
| Mobility routines | `/coach/mobility`, client dashboard | Coach, Client | Günlük mobilite planı | Güzel destek özellik | Hayır | Hayır | P2 |

## Demo İçin Gösterilecek Ekranlar

**Koç için 5 dakikalık demo akışı**
1. `/coach/dashboard`: KPI, riskli danışanlar, aktif workout, gelir paneli.
2. `/coach/clients`: invite link, pending request, broadcast.
3. `/coach/clients/[clientId]`: danışan 360 görünümü.
4. `/coach/templates` ve `/coach/templates/[id]/assign`: şablon oluşturma/atama mantığı.
5. `/coach/profile`: paketler, dönüşüm fotoğrafları, availability.
6. Kapanış: `/coach/subscription` ile “bu bir koç SaaS’ı” mesajı.

**Danışan için 3 dakikalık demo akışı**
1. `/client/dashboard`: bugünün antrenmanı, streak, koç yorumları.
2. `/client/workout/[assignmentId]/start`: workout akışına giriş.
3. `/client/body-progress`: fiziksel ilerleme.
4. `/client/nutrition/log`: hızlı öğün kaydı.
5. `/client/messages`: koç iletişimi.

**Marketplace ziyaretçisi için 2 dakikalık demo akışı**
Burada dürüst olmak lazım: gerçek public ziyaretçi yerine “giriş yapmış danışan” akışı gösterilmeli.
1. `/client/coaches`: filtreleme + vitrin kalitesi + compare.
2. `/client/coaches/compare`: 2-3 koç kıyası.
3. `/client/coaches/[coachId]`: paketler, yorumlar, seans planlama, dönüşüm galerisi.

## Pazarlamada Öne Çıkarılacak Özellikler

**En güçlü 10 özellik**
1. Koç dashboard
2. Danışan CRM / Client Hub 360
3. Workout template + assignment sistemi
4. Danışan günlük dashboard
5. Messaging
6. Body progress + photo tracking
7. Check-in yönetimi
8. Marketplace/coach compare
9. Form analysis video feedback
10. Churn / risk sinyalleri

**Satışta en kolay anlatılacak 5 özellik**
1. “Koç ve danışan tek uygulamada”
2. “Program yaz, tek tıkla danışana ata”
3. “İlerleme ve dönüşüm tek yerde”
4. “Mesajlaşma + check-in ile takip kopmuyor”
5. “Koç profilin satış vitrini oluyor”

**Koçların para ödeme sebebi olabilecek 5 özellik**
1. Danışan CRM ve operasyon merkezi
2. Program şablonlarıyla ölçeklenme
3. Churn/risk ve compliance görünürlüğü
4. Marketplace vitrini ve paket yönetimi
5. Gelir/abonelik paneli

**Rakiplerden ayrıştırabilecek 5 özellik**
1. Client Hub 360 koç görünümü
2. Serbest form analizi video akışı
3. PR + achievement + streak’in aynı deneyimde olması
4. Koç compare + marketplace kalite skoru
5. Check-in + nutrition + workout + messaging’in tek ürün içinde birleşmesi

## Eksik / Zayıf Alanlar

**Demo sırasında gösterilmemesi gerekenler**
- `/coach/admin`: gerçek admin ekranı değil.
- `/client/marketplace*`: sadece redirect.
- Çok boş veri varsa `/coach/mobility`.
- Public kullanıcıya marketplace varmış gibi konuşmak.

**Boş / kırık / yarım duran akışlar**
- Public açık koç dizini yok.
- Koç paketlerinden doğrudan platform içi satın alma net değil; çoğu CTA mesajlaşmaya yönlendiriyor.
- Ayrı admin/operations UI yok.
- AGENCY tier var ama gerçek ajans yönetim yüzeyi görünmüyor.
- Mobility ve bazı gelişmiş alanlar core demo kadar olgun hissettirmeyebilir.

**Pazarlamada fazla iddialı anlatılmaması gerekenler**
- “Tam ölçekli public marketplace”
- “Platform içi full client payment commerce”
- “Gerçek admin/çok koçlu agency ops”
- “AI copilot” tarafı; bazı metinlerde ima var ama ürünün ana yüzünde güçlü AI akışı yok.
- “Video call / telehealth benzeri canlı oturum” yerine “session scheduling + meeting link yönetimi” denmeli.

## Sunumda Kullanılacak Ana Hikaye

FitCoach’u şöyle konumlandırmak en temiz hikaye olur:

“FitCoach, online fitness koçlarının işini büyütmesi için tasarlanmış bir işletim sistemi. Koç; danışanlarını, programlarını, check-in’lerini, mesajlarını ve gelirini tek panelden yönetiyor. Danışan ise günlük antrenmanını, ilerlemesini, beslenmesini ve koç iletişimini tek uygulamada sürdürüyor. Böylece koçluk, dağınık araçlardan çıkıp ölçülebilir ve ölçeklenebilir bir ürüne dönüşüyor.”

Kısa dürüst sonuç: ürün pazarlama sunumuna gayet uygun; özellikle koç SaaS’ı ve “operasyon + takip + satış vitrini” hikayesi çok güçlü. En doğru sunum, bunu “public marketplace startup” gibi değil, “coach enablement platform” gibi anlatmak olur. İstersen bir sonraki adımda bunu 10 slaytlık satış sunumu iskeletine çevireyim.