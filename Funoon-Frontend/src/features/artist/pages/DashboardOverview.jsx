export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-amber-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-600/10">
        <h2 className="text-2xl font-bold">أهلاً بك في لوحة تحكم الفنان! 🎨</h2>
        <p className="text-amber-100 text-sm mt-1 max-w-xl">
          هنا يمكنك إدارة لوحاتك الفنية، متابعة المبيعات، ومراقبة رصيد محفظتك، بالإضافة لتحديث باقة اشتراكك.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">اللوحات النشطة</span>
          <p className="text-3xl font-bold mt-1 text-stone-900">0 / 5</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">المبيعات الإجمالية</span>
          <p className="text-3xl font-bold mt-1 text-stone-900">٠.٠٠ ر.س</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">الرصيد المتاح للسحب</span>
          <p className="text-3xl font-bold mt-1 text-stone-950">٠.٠٠ ر.س</p>
        </div>
      </div>
    </div>
  )
}
