export const supportedLocales = ["tr", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "tr";

export type AppDictionary = {
  common: {
    productName: string;
    localeLabel: string;
    signIn: string;
    startAsCoach: string;
    exploreMarketplace: string;
  };
  landing: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    body: string;
    coachValue: string[];
    coachPanelLabel: string;
    coachPanelTitle: string;
    idealForPro: string;
    coachPanelStats: { label: string; value: string; tone: string }[];
    aiDigestLabel: string;
    aiDigestBody: string;
    marketplaceProof: { label: string; value: string }[];
    positioningEyebrow: string;
    positioningTitle: string;
    positioningBadge: string;
    operatingSystemBlocks: { title: string; body: string }[];
    whyPayEyebrow: string;
    whyPayTitle: string;
    whyPayItems: { title: string; body: string }[];
    ctaEyebrow: string;
    ctaTitle: string;
    ctaBody: string;
    openCoachAccount: string;
  };
  publicMarketplace: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    searchPlaceholder: string;
    cityPlaceholder: string;
    specialtyPlaceholder: string;
    filterButton: string;
    listedCount: string;
    trustHint: string;
    listAsCoach: string;
    cityCoverage: string;
    reviews: string;
    trustScore: string;
    startingPackage: string;
    inspectProfile: string;
    onlineFallback: string;
    askPrice: string;
    emptyState: string;
    profileFallback: string;
  };
  publicCoachProfile: {
    notFoundTitle: string;
    onlineCoachFallback: string;
    specialtiesLabel: string;
    reviewsLabel: string;
    packagesStartingAt: string;
    cityStat: string;
    packageStat: string;
    reviewStat: string;
    connectAsClient: string;
    socialMedia: string;
    successStoriesEyebrow: string;
    successStoriesTitle: string;
    successStoryFallback: string;
    reviewsEyebrow: string;
    reviewsTitle: string;
    noReviews: string;
    marketplaceTrustEyebrow: string;
    verifiedReviews: string;
    cityCoverage: string;
    successRate: string;
    responseTime: string;
    profileQualityEyebrow: string;
    ready: string;
    missing: string;
    packagesEyebrow: string;
    packagesTitle: string;
    askPrice: string;
    weeks: string;
    sessions: string;
    monthly: string;
    oneTime: string;
    noPublicPackages: string;
    clientCtaEyebrow: string;
    clientCtaTitle: string;
    clientCtaBody: string;
    signInAndConnect: string;
  };
  register: {
    createAccount: string;
    howToJoin: string;
    coachRegistration: string;
    clientRegistration: string;
    enterYourDetails: string;
    roleSelectStep: string;
    detailsStep: string;
    chooseAccountType: string;
    howToJoinTitle: string;
    continue: string;
    alreadyHaveAccount: string;
    roleCoach: string;
    roleClient: string;
    roleCoachBody: string;
    roleClientBody: string;
    coachDescription: string;
    clientDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    createAccountButton: string;
    creatingAccountButton: string;
    accountCreateError: string;
    coachFeatures: string[];
    clientFeatures: string[];
    creatingSuffix: string;
  };
  coachCompare: {
    empty: string;
    backToDiscovery: string;
    title: string;
    comparingCount: string;
    profile: string;
    basicInfo: string;
    trust: string;
    rating: string;
    experience: string;
    city: string;
    success: string;
    specialties: string;
    noReviewsYet: string;
    unspecified: string;
    packages: string;
    noPackages: string;
    popular: string;
    askPrice: string;
    about: string;
    noInfo: string;
  };
  clientCoachDiscovery: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    activeCoach: string;
    pendingRequest: string;
    coachPool: string;
    myCoachesTab: string;
    findCoachTab: string;
    marketplaceHeadline: string;
    coachListLoadError: string;
    requestSendError: string;
    requestSent: string;
    disconnectTitle: string;
    disconnectDescription: string;
    disconnectConfirm: string;
    disconnectCancel: string;
    disconnectError: string;
    disconnected: string;
    activeConnections: string;
    pendingRequests: string;
    noConnectedCoach: string;
    noConnectedCoachBody: string;
    connectionSummary: string;
    quickActions: string;
    activeStatus: string;
    waitingStatus: string;
    profileLabel: string;
    trustLabel: string;
    successLabel: string;
    reviewsLabel: string;
    monthlyFrom: string;
    message: string;
    request: string;
    requestPending: string;
    requestSending: string;
    sendRequest: string;
    compareSelected: string;
    compare: string;
    compareBarSelected: string;
    compareAction: string;
    packagesCount: string;
  };
};

const tr: AppDictionary = {
  common: {
    productName: "FitCoach",
    localeLabel: "Dil",
    signIn: "Giris yap",
    startAsCoach: "Koc olarak basla",
    exploreMarketplace: "Marketplace'i kesfet",
  },
  landing: {
    metadataTitle: "FitCoach | Online Koclugun Isletim Sistemi ve Acik Koc Marketplace'i",
    metadataDescription:
      "FitCoach, bagimsiz online koclar icin danisan yonetimi, acik marketplace ve sessiz AI raporlarini tek urunde birlestiren kocluk isletim sistemidir.",
    eyebrow: "Turkiye oncelikli SaaS + acik marketplace",
    headline: "Online koclugunu",
    headlineAccent: "isletmeye cevir.",
    body:
      "FitCoach, bagimsiz online koclar icin danisan yonetimi, acik marketplace ve sessiz AI raporlarini tek urunde birlestirir. Danisan tarafinda ise uygun fiyatli iyi koc kesfi ile premium performans koclugu ayni yerde bulusur.",
    coachValue: [
      "Danisan yonetimi, check-in, seans ve mesajlasma tek panelde",
      "Acik marketplace'te yeni musteri bulma ve guven sinyalleri",
      "Sessiz AI raporlariyla riskli danisanlari erken yakalama",
    ],
    coachPanelLabel: "Koc paneli",
    coachPanelTitle: "Bugun ne yapmaliyim?",
    idealForPro: "Pro icin ideal",
    coachPanelStats: [
      { label: "Bekleyen istek", value: "4", tone: "text-orange-300" },
      { label: "Riskli danisan", value: "2", tone: "text-rose-300" },
      { label: "Okunmamis mesaj", value: "7", tone: "text-sky-300" },
      { label: "Yaklasan seans", value: "3", tone: "text-emerald-300" },
    ],
    aiDigestLabel: "Sessiz AI raporu",
    aiDigestBody:
      "Son 7 gunde uyum yuzde 78. Iki danisan yeniden aktivasyon istiyor. Bu hafta once check-in cevabi gelmeyenleri toparla, sonra marketplace vitrinindeki donusum hikayesini guncelle.",
    marketplaceProof: [
      { label: "Acik Marketplace", value: "Sehir, uzmanlik, paket ve yorumla kesif" },
      { label: "Koc SaaS", value: "Free, Pro, Elite ve Agency katmanlari" },
      { label: "Sessiz AI", value: "Koca ozel haftalik ozet ve aksiyon onerileri" },
    ],
    positioningEyebrow: "Konumlandirma",
    positioningTitle: "Tracker degil, kocluk isletim sistemi",
    positioningBadge: "Koc icin SaaS, danisan icin kesif deneyimi",
    operatingSystemBlocks: [
      {
        title: "Koc isletim sistemi",
        body: "Ilk danisandan 50+ aktif danisana kadar profil, paket, uygunluk, mesajlasma ve operasyon akisini tek yerde yonet.",
      },
      {
        title: "Acik koc marketplace'i",
        body: "Danisanlar hedef, butce ve tercihlerine gore koc kesfetsin; guven sinyalleri guclu profiller daha hizli karar verdirsin.",
      },
      {
        title: "Sessiz AI yardimcisi",
        body: "AI on planda konusmaz; ama koca risk sinyali, adherence ozeti ve haftalik aksiyon listesi uretir.",
      },
    ],
    whyPayEyebrow: "Neden odenir?",
    whyPayTitle: "Koc, yeni musteri buldugu ve daha profesyonel yonettigi icin odeme yapar",
    whyPayItems: [
      {
        title: "Daha profesyonel gorunum",
        body: "Paketler, guven sinyalleri, verified yorumlar ve donusum vitrini kocun satis anlatisini guclendirir.",
      },
      {
        title: "Operasyon yukunu dusurur",
        body: "Mesaj, check-in, seans, program, risk sinyali ve davet akislari tek panelde toplandigi icin takip dagilmaz.",
      },
      {
        title: "Acik marketplace avantaji",
        body: "Koc sadece mevcut danisanini yonetmez; yeni danisan kesfi icin de gorunur bir vitrini olur.",
      },
      {
        title: "Sessiz AI ile daha net aksiyon",
        body: "AI pazarlama slogani olmaz; koca haftalik olarak neyi onceliklendirmesi gerektigini soyler.",
      },
    ],
    ctaEyebrow: "Ilk adim",
    ctaTitle: "Bagimsiz koc olarak basla, sonra vitrini buyut",
    ctaBody:
      "Ilk kurulumda profilini tamamla, paketini ekle, uygunluk saatlerini ayarla, ilk sablonunu hazirla ve danisanlarini davet et. Sonraki katman marketplace ve AI ozetleriyle gelir.",
    openCoachAccount: "Koc hesabi ac",
  },
  publicMarketplace: {
    metadataTitle: "Online Koc Marketplace | FitCoach",
    metadataDescription:
      "Sehir, uzmanlik, paket ve guven sinyallerine gore online koc kesfet. FitCoach acik marketplace'i ile uygun fiyatli veya premium performans koclarini karsilastir.",
    eyebrow: "Acik koc marketplace'i",
    title: "Hedefine uygun online kocu bul",
    body:
      "FitCoach marketplace'i; sehir, uzmanlik, paket, yorum ve guven sinyallerine gore koc kesfetmek icin acik bir vitrin sunar. Danisan girisi yaptiginda istek gonderip seans planlayabilirsin.",
    searchPlaceholder: "Koc adi, slogan veya uzmanlik ara",
    cityPlaceholder: "Sehir",
    specialtyPlaceholder: "Uzmanlik",
    filterButton: "Filtrele",
    listedCount: "koc listeleniyor",
    trustHint: "Guven skoru ve vitrini guclu profiller ustte gorunur.",
    listAsCoach: "Koc olarak listelen",
    cityCoverage: "Sehir / kapsama",
    reviews: "yorum",
    trustScore: "Trust score",
    startingPackage: "Baslangic paketi",
    inspectProfile: "Profili incele",
    onlineFallback: "Online",
    askPrice: "Sor",
    emptyState: "Filtrelerine uygun koc bulunamadi.",
    profileFallback: "Online kocluk profili",
  },
  publicCoachProfile: {
    notFoundTitle: "Koc bulunamadi | FitCoach",
    onlineCoachFallback: "Turkiye online koc",
    specialtiesLabel: "Uzmanliklar",
    reviewsLabel: "yorum",
    packagesStartingAt: "Paketler {price} seviyesinden basliyor",
    cityStat: "Sehir",
    packageStat: "Paket",
    reviewStat: "Yorum",
    connectAsClient: "Danisan olarak baglan",
    socialMedia: "Sosyal medya",
    successStoriesEyebrow: "Basari Hikayeleri",
    successStoriesTitle: "Donusum vitrini",
    successStoryFallback: "Basari hikayesi {index}",
    reviewsEyebrow: "Yorumlar",
    reviewsTitle: "Gercek danisan geri bildirimleri",
    noReviews: "Henuz yorum eklenmemis.",
    marketplaceTrustEyebrow: "Marketplace Guveni",
    verifiedReviews: "Dogrulanmis yorum",
    cityCoverage: "Sehir / kapsama",
    successRate: "Basari orani",
    responseTime: "Donus suresi",
    profileQualityEyebrow: "Profil kalitesi",
    ready: "Hazir",
    missing: "Eksik",
    packagesEyebrow: "Paketler",
    packagesTitle: "Calisma teklifleri",
    askPrice: "Sor",
    weeks: "hafta",
    sessions: "seans",
    monthly: "Aylik",
    oneTime: "Tek seferlik",
    noPublicPackages: "Acik paket bilgisi henuz eklenmemis.",
    clientCtaEyebrow: "Danisan CTA",
    clientCtaTitle: "Kocla calismaya basla",
    clientCtaBody: "Baglanti istegi gondermek, mesaj atmak ve seans planlamak icin danisan girisi yap.",
    signInAndConnect: "Giris yap ve baglan",
  },
  register: {
    createAccount: "Hesap Olustur",
    howToJoin: "Platformda nasil yer almak istiyorsun?",
    coachRegistration: "Koc kaydi",
    clientRegistration: "Danisan kaydi",
    enterYourDetails: "Bilgilerini gir",
    roleSelectStep: "Adim 1: Rol sec",
    detailsStep: "Adim 2: Bilgilerini gir",
    chooseAccountType: "Hesap turunu sec",
    howToJoinTitle: "Platforma nasil katilmak istiyorsun?",
    continue: "Devam et",
    alreadyHaveAccount: "Zaten hesabin var mi?",
    roleCoach: "Koc",
    roleClient: "Danisan",
    roleCoachBody: "Danisan yonet, program olustur, ilerlemeyi izle.",
    roleClientBody: "Koc bul, antrenman yap, ilerlemeni takip et.",
    coachDescription: "Koc hesabi olusturmak uzeresin",
    clientDescription: "Danisan hesabi olusturmak uzeresin",
    nameLabel: "Ad soyad",
    namePlaceholder: "Adinizi girin",
    emailLabel: "E-posta",
    emailPlaceholder: "ornek@email.com",
    passwordLabel: "Sifre",
    passwordPlaceholder: "En az 8 karakter",
    createAccountButton: "Hesabi olustur",
    creatingAccountButton: "Olusturuluyor...",
    accountCreateError: "Kayit olusturulamadi.",
    coachFeatures: [
      "Danisan yonetimi ve takibi",
      "Antrenman sablonu olusturma",
      "Uyumluluk ve ilerleme analizi",
      "Danisanlarla anlik iletisim",
    ],
    clientFeatures: [
      "Profesyonel koc bulma ve baglanma",
      "Kisisellestirilmis antrenman takvimi",
      "Ilerleme takibi ve istatistikler",
      "Kocunla anlik mesajlasma",
    ],
    creatingSuffix: "->",
  },
  coachCompare: {
    empty: "Karsilastirilacak koc bulunamadi",
    backToDiscovery: "Koc Bul",
    title: "Koc Karsilastirma",
    comparingCount: "koc karsilastiriliyor",
    profile: "Profil",
    basicInfo: "Temel Bilgiler",
    trust: "Guven",
    rating: "Puan",
    experience: "Deneyim",
    city: "Sehir",
    success: "Basari",
    specialties: "Uzmanlik",
    noReviewsYet: "Henuz yorum yok",
    unspecified: "Belirtilmemis",
    packages: "Paketler",
    noPackages: "Paket yok",
    popular: "Populer",
    askPrice: "Fiyat sor",
    about: "Hakkinda",
    noInfo: "Bilgi yok",
  },
  clientCoachDiscovery: {
    heroEyebrow: "Koc Agi",
    heroTitle: "Koclarim",
    heroSubtitle: "Koc bul, baglanti yonet ve iletisim kur.",
    activeCoach: "Aktif Koc",
    pendingRequest: "Bekleyen Istek",
    coachPool: "Koc Havuzu",
    myCoachesTab: "Koclarim",
    findCoachTab: "Koc Bul",
    marketplaceHeadline: "Acik marketplace'te senin icin uygun kocu kesfet.",
    coachListLoadError: "Koc listesi yuklenemedi.",
    requestSendError: "Koc istegi gonderilemedi.",
    requestSent: "Koc istegi gonderildi.",
    disconnectTitle: "Koc baglantisini kaldir",
    disconnectDescription: "Bu koc ile baglantiyi kaldirmak istediginize emin misiniz?",
    disconnectConfirm: "Kaldir",
    disconnectCancel: "Vazgec",
    disconnectError: "Koc baglantisi kaldirilamadi.",
    disconnected: "Koc baglantisi kaldirildi.",
    activeConnections: "Aktif Baglantilar",
    pendingRequests: "Bekleyen Istekler",
    noConnectedCoach: "Henuz bagli kocun yok",
    noConnectedCoachBody: "Sana uygun bir koc bulmak icin \"Koc Bul\" sekmesine gec.",
    connectionSummary: "Baglanti Ozeti",
    quickActions: "Hizli Islemler",
    activeStatus: "Aktif",
    waitingStatus: "Bekliyor",
    profileLabel: "Vitrin",
    trustLabel: "Guven",
    successLabel: "Basari",
    reviewsLabel: "Yorum",
    monthlyFrom: "/ay'dan",
    message: "Mesaj",
    request: "Istek",
    requestPending: "Istek Beklemede",
    requestSending: "Gonderiliyor...",
    sendRequest: "Istek Gonder",
    compareSelected: "Karsilastirmada",
    compare: "Karsilastir",
    compareBarSelected: "koc secildi",
    compareAction: "Karsilastir",
    packagesCount: "paket",
  },
};

const en: AppDictionary = {
  common: {
    productName: "FitCoach",
    localeLabel: "Language",
    signIn: "Sign in",
    startAsCoach: "Start as coach",
    exploreMarketplace: "Explore marketplace",
  },
  landing: {
    metadataTitle: "FitCoach | Coaching Operating System and Open Coach Marketplace",
    metadataDescription:
      "FitCoach combines client management, an open marketplace, and quiet AI reports in one coaching operating system for independent online coaches.",
    eyebrow: "Turkey-first SaaS + open marketplace",
    headline: "Turn your online coaching",
    headlineAccent: "into an operating business.",
    body:
      "FitCoach combines client management, an open marketplace, and quiet AI reports in one product for independent online coaches. On the client side, affordable coach discovery and premium performance coaching live in the same place.",
    coachValue: [
      "Client management, check-ins, sessions, and messaging in one panel",
      "Open marketplace distribution with visible trust signals",
      "Quiet AI reports that surface at-risk clients early",
    ],
    coachPanelLabel: "Coach panel",
    coachPanelTitle: "What should I handle today?",
    idealForPro: "Ideal for Pro",
    coachPanelStats: [
      { label: "Pending requests", value: "4", tone: "text-orange-300" },
      { label: "At-risk clients", value: "2", tone: "text-rose-300" },
      { label: "Unread messages", value: "7", tone: "text-sky-300" },
      { label: "Upcoming sessions", value: "3", tone: "text-emerald-300" },
    ],
    aiDigestLabel: "Quiet AI digest",
    aiDigestBody:
      "Adherence was 78% in the last 7 days. Two clients need reactivation. Start with unanswered check-ins, then refresh the transformation story on your marketplace profile.",
    marketplaceProof: [
      { label: "Open Marketplace", value: "Discover by city, specialty, package, and reviews" },
      { label: "Coach SaaS", value: "Free, Pro, Elite, and Agency plans" },
      { label: "Quiet AI", value: "Weekly coach digest with suggested actions" },
    ],
    positioningEyebrow: "Positioning",
    positioningTitle: "Not a tracker, a coaching operating system",
    positioningBadge: "SaaS for coaches, discovery experience for clients",
    operatingSystemBlocks: [
      {
        title: "Coach operating system",
        body: "Manage profile, packages, availability, messaging, and day-to-day operations from your first client to 50+ active clients.",
      },
      {
        title: "Open coach marketplace",
        body: "Clients discover coaches by goals, budget, and preferences while stronger trust signals help profiles convert faster.",
      },
      {
        title: "Quiet AI assistant",
        body: "AI stays in the background and gives coaches risk signals, adherence summaries, and weekly action lists.",
      },
    ],
    whyPayEyebrow: "Why coaches pay",
    whyPayTitle: "Coaches pay because they win new clients and run a more professional service",
    whyPayItems: [
      {
        title: "More professional presence",
        body: "Packages, trust signals, verified reviews, and transformation proof strengthen the coach's sales story.",
      },
      {
        title: "Lower operational overhead",
        body: "Messages, check-ins, sessions, programs, risk alerts, and invite flows stay in one panel.",
      },
      {
        title: "Open marketplace leverage",
        body: "A coach does not only manage current clients; they also get a public storefront for new client discovery.",
      },
      {
        title: "Clearer action with quiet AI",
        body: "AI is not the slogan. It tells the coach what to prioritize each week.",
      },
    ],
    ctaEyebrow: "First step",
    ctaTitle: "Start as an independent coach, then grow the storefront",
    ctaBody:
      "Complete your profile, add packages, set availability, build your first template, and invite clients. Marketplace reach and AI summaries layer on top.",
    openCoachAccount: "Open coach account",
  },
  publicMarketplace: {
    metadataTitle: "Online Coach Marketplace | FitCoach",
    metadataDescription:
      "Discover online coaches by city, specialty, package, and trust signals. Compare affordable and premium performance coaches in the open FitCoach marketplace.",
    eyebrow: "Open coach marketplace",
    title: "Find the right online coach for your goal",
    body:
      "The FitCoach marketplace is a public storefront for discovering coaches by city, specialty, package, reviews, and trust signals. Once signed in as a client, you can send a request and plan sessions.",
    searchPlaceholder: "Search coach name, tagline, or specialty",
    cityPlaceholder: "City",
    specialtyPlaceholder: "Specialty",
    filterButton: "Filter",
    listedCount: "coaches listed",
    trustHint: "Profiles with stronger trust signals and storefront quality appear first.",
    listAsCoach: "List as coach",
    cityCoverage: "City / coverage",
    reviews: "reviews",
    trustScore: "Trust score",
    startingPackage: "Starting package",
    inspectProfile: "View profile",
    onlineFallback: "Online",
    askPrice: "Ask",
    emptyState: "No coaches match your current filters.",
    profileFallback: "Online coaching profile",
  },
  publicCoachProfile: {
    notFoundTitle: "Coach not found | FitCoach",
    onlineCoachFallback: "Turkey-based online coach",
    specialtiesLabel: "Specialties",
    reviewsLabel: "reviews",
    packagesStartingAt: "Packages start from {price}",
    cityStat: "City",
    packageStat: "Packages",
    reviewStat: "Reviews",
    connectAsClient: "Connect as client",
    socialMedia: "Social media",
    successStoriesEyebrow: "Success Stories",
    successStoriesTitle: "Transformation proof",
    successStoryFallback: "Success story {index}",
    reviewsEyebrow: "Reviews",
    reviewsTitle: "Real client feedback",
    noReviews: "No reviews yet.",
    marketplaceTrustEyebrow: "Marketplace Trust",
    verifiedReviews: "Verified reviews",
    cityCoverage: "City / coverage",
    successRate: "Success rate",
    responseTime: "Response time",
    profileQualityEyebrow: "Profile quality",
    ready: "Ready",
    missing: "Missing",
    packagesEyebrow: "Packages",
    packagesTitle: "Ways to work together",
    askPrice: "Ask",
    weeks: "weeks",
    sessions: "sessions",
    monthly: "Monthly",
    oneTime: "One-time",
    noPublicPackages: "No public package information yet.",
    clientCtaEyebrow: "Client CTA",
    clientCtaTitle: "Start working with this coach",
    clientCtaBody: "Sign in as a client to send a request, message the coach, and book sessions.",
    signInAndConnect: "Sign in and connect",
  },
  register: {
    createAccount: "Create account",
    howToJoin: "How do you want to join the platform?",
    coachRegistration: "Coach signup",
    clientRegistration: "Client signup",
    enterYourDetails: "Enter your details",
    roleSelectStep: "Step 1: Choose role",
    detailsStep: "Step 2: Enter details",
    chooseAccountType: "Choose account type",
    howToJoinTitle: "How do you want to join?",
    continue: "Continue",
    alreadyHaveAccount: "Already have an account?",
    roleCoach: "Coach",
    roleClient: "Client",
    roleCoachBody: "Manage clients, build programs, and track progress.",
    roleClientBody: "Find a coach, train, and follow your progress.",
    coachDescription: "You are about to create a coach account",
    clientDescription: "You are about to create a client account",
    nameLabel: "Full name",
    namePlaceholder: "Enter your name",
    emailLabel: "Email",
    emailPlaceholder: "name@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    createAccountButton: "Create account",
    creatingAccountButton: "Creating account...",
    accountCreateError: "Could not create account.",
    coachFeatures: [
      "Client management and follow-up",
      "Workout template creation",
      "Adherence and progress analysis",
      "Real-time client messaging",
    ],
    clientFeatures: [
      "Find and connect with professional coaches",
      "Personalized workout calendar",
      "Progress tracking and stats",
      "Real-time messaging with your coach",
    ],
    creatingSuffix: "->",
  },
  coachCompare: {
    empty: "No coaches found to compare",
    backToDiscovery: "Find Coach",
    title: "Coach Comparison",
    comparingCount: "coaches being compared",
    profile: "Profile",
    basicInfo: "Basic Info",
    trust: "Trust",
    rating: "Rating",
    experience: "Experience",
    city: "City",
    success: "Success",
    specialties: "Specialties",
    noReviewsYet: "No reviews yet",
    unspecified: "Not specified",
    packages: "Packages",
    noPackages: "No packages",
    popular: "Popular",
    askPrice: "Ask price",
    about: "About",
    noInfo: "No information",
  },
  clientCoachDiscovery: {
    heroEyebrow: "Coach Network",
    heroTitle: "My Coaches",
    heroSubtitle: "Find coaches, manage connections, and stay in touch.",
    activeCoach: "Active Coach",
    pendingRequest: "Pending Request",
    coachPool: "Coach Pool",
    myCoachesTab: "My Coaches",
    findCoachTab: "Find Coach",
    marketplaceHeadline: "Discover the right coach for you in the open marketplace.",
    coachListLoadError: "Could not load coach list.",
    requestSendError: "Could not send coach request.",
    requestSent: "Coach request sent.",
    disconnectTitle: "Remove coach connection",
    disconnectDescription: "Are you sure you want to remove this coach connection?",
    disconnectConfirm: "Remove",
    disconnectCancel: "Cancel",
    disconnectError: "Could not remove coach connection.",
    disconnected: "Coach connection removed.",
    activeConnections: "Active Connections",
    pendingRequests: "Pending Requests",
    noConnectedCoach: "You do not have a connected coach yet",
    noConnectedCoachBody: "Switch to the \"Find Coach\" tab to discover a coach that fits you.",
    connectionSummary: "Connection Summary",
    quickActions: "Quick Actions",
    activeStatus: "Active",
    waitingStatus: "Waiting",
    profileLabel: "Profile",
    trustLabel: "Trust",
    successLabel: "Success",
    reviewsLabel: "Reviews",
    monthlyFrom: "from /month",
    message: "Message",
    request: "Request",
    requestPending: "Request Pending",
    requestSending: "Sending...",
    sendRequest: "Send Request",
    compareSelected: "In comparison",
    compare: "Compare",
    compareBarSelected: "coaches selected",
    compareAction: "Compare",
    packagesCount: "packages",
  },
};

const dictionaries: Record<AppLocale, AppDictionary> = { tr, en };

export function resolveLocale(input?: string | null): AppLocale {
  if (!input) return defaultLocale;
  const normalized = input.toLowerCase();
  return supportedLocales.includes(normalized as AppLocale) ? (normalized as AppLocale) : defaultLocale;
}

export function getDictionary(locale: AppLocale): AppDictionary {
  return dictionaries[locale];
}

export function formatCurrency(value: number, locale: AppLocale): string {
  const localeTag = locale === "tr" ? "tr-TR" : "en-US";
  return `${value.toLocaleString(localeTag)} ${locale === "tr" ? "TL" : "TRY"}`;
}

export function buildLocalizedPath(
  pathname: string,
  locale: AppLocale,
  params?: Record<string, string | undefined | null>
): string {
  const searchParams = new URLSearchParams();

  if (locale !== defaultLocale) {
    searchParams.set("lang", locale);
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
