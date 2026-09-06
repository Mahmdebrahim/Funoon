// مصدر واحد لبيانات الباقات — بيستخدم في الـ pricing + checkout + success
export const PLANS = [
  {
    id: "opal_classic",
    name: "Opal Classic",
    nameAr: "أوبال كلاسيك",
    price: 299,
    tagline: "ابدأ رحلتك الفنية",
    popular: false,
    highlights: ["5 لوحات", "عمولة 15%", "حتى 120 سم"],
    features: [
      { text: "عرض حتى 5 لوحات للبيع", included: true },
      { text: "عمولة المنصة 15% على كل عملية بيع", included: true },
      { text: "لوحات حتى مقاس 120 سم", included: true },
      { text: "ملف فنان أساسي (نبذة + صورة شخصية)", included: true },
      { text: "ظهور في المعرض العام للمنصة", included: true },
      { text: "دعم فني أساسي عبر التذاكر", included: true },
    ],
  },
  {
    id: "opal_plus",
    name: "Opal Plus",
    nameAr: "أوبال بلس",
    price: 399,
    tagline: "الخيار الأمثل للفنانين النشطين",
    popular: true,
    highlights: ["15 لوحة", "عمولة 15%", "إحصائيات + بروفايل مخصص"],
    features: [
      { text: "عرض حتى 15 لوحة للبيع", included: true },
      { text: "عمولة المنصة 15% على كل عملية بيع", included: true },
      { text: "لوحات حتى مقاس 120 سم", included: true },
      {
        text: "إحصائيات تفصيلية",
        included: true,
      },
      { text: "بروفايل مخصص: صورة غلاف + روابط تواصل اجتماعي", included: true },
      { text: "أولوية ظهور في نتائج البحث قبل باقة كلاسيك", included: true },
      { text: "دعم أولوية بزمن استجابة أسرع", included: true },
    ],
  },
  {
    id: "opal_prestige",
    name: "Opal Prestige",
    nameAr: "أوبال برستيج",
    price: 599,
    tagline: "للفنانين المحترفين",
    popular: false,
    highlights: ["لوحات ∞", "عمولة 10%", "شحن مجاني + badge موثق"],
    features: [
      { text: "عرض لوحات بدون حد أقصى", included: true },
      { text: "عمولة 10% فقط — الأقل على المنصة", included: true },
      { text: "لوحات كبيرة حتى مقاس 200 سم", included: true },
      { text: "شحن مجاني لمشتريك  في أول 10 طلبات لك سنوياً", included: true },
      { text: "شارة فنان Vip موثق الحصرية", included: true },
      { text: "جعل لوحه من لوحاتك مميزة ويتم  عرضها فى الصفحه الرئيسية", included: true },
      { text: "أولوية قصوى في نتائج البحث", included: true },
      { text: "كل مميزات بلس (بروفايل مخصص + إحصائيات)", included: true },
      { text: "دعم أولوية على مدار الساعة", included: true },
    ],
  },
];

export const getPlanById = (id) => PLANS.find((p) => p.id === id);

// جدول مقارنة تفصيلية بين الباقات
export const COMPARISON_TABLE = [
  {
    category: "الحدود الأساسية",
    rows: [
      {
        feature: "عدد اللوحات المعروضة",
        classic: "5",
        plus: "15",
        prestige: "غير محدود",
      },
      {
        feature: "الحد الأقصى لأبعاد اللوحة",
        classic: "120 سم",
        plus: "120 سم",
        prestige: "200 سم",
      },
      {
        feature: "نسبة العمولة على المبيعات",
        classic: "15%",
        plus: "15%",
        prestige: "10%",
      },
    ],
  },
  {
    category: "الظهور والتمييز",
    rows: [
      {
        feature: "أولوية في نتائج البحث",
        classic: false,
        plus: true,
        prestige: "قصوى",
      },
      {
        feature: "شارة فنان موثق Vip",
        classic: false,
        plus: false,
        prestige: true,
      },
      {
        feature: "عرض اللوحات المميزة في الصفحة الرئيسية",
        classic: false,
        plus: false,
        prestige: true,
      },
    ],
  },
  {
    category: "البروفايل والإحصائيات",
    rows: [
      { feature: "ملف شخصي أساسي", classic: true, plus: true, prestige: true },
      {
        feature: "صورة غلاف + روابط اجتماعية",
        classic: false,
        plus: true,
        prestige: true,
      },
      {
        feature: "إحصائيات تفصيلية",
        classic: false,
        plus: true,
        prestige: true,
      },
    ],
  },
  {
    category: "الشحن والدعم",
    rows: [
      {
        feature: "شحن اللوحات القياسية",
        classic: "يدفعه المشتري",
        plus: "يدفعه المشتري",
        prestige: "مجاني لمشتريك (أول 10 طلبات/سنة)",
      },
      {
        feature: "دعم العملاء",
        classic: "أساسي",
        plus: "أولوية",
        prestige: "24/7",
      },
    ],
  },
];
