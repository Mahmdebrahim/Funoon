export default function Home() {
  return (
    <div className="relative py-24 sm:py-32 overflow-hidden bg-stone-50">
      {/* Background accents */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          ✨ قريباً: معرض النخبة للفنون السعودية الأصيلة
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-tight">
          سوق الفن السعودي <br />
          <span className="bg-linear-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">منصة فنون</span>
        </h1>
        <p className="max-w-2xl mx-auto text-stone-600 text-lg sm:text-xl leading-relaxed">
          الوجهة الأولى لاقتناء اللوحات الفنية الأصلية المبدعة بأيدي فنانين وفنانات سعوديات. استكشف المعروضات الفنية الفريدة وابدأ مجموعتك الخاصة اليوم.
        </p>
      </div>
    </div>
  )
}
