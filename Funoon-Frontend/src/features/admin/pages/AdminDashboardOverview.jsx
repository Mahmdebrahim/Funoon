export default function AdminDashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold">لوحة تحكم مدير منصة فنون 🛡️</h2>
        <p className="text-stone-400 text-sm mt-1 max-w-xl">
          أهلاً بك يا مدير النظام. يمكنك من هنا مراجعة طلبات سحب الأرباح المقدمة من الفنانين، متابعة مبيعات المنصة، وإدارة قائمة المشتركين.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">طلبات السحب المعلقة</span>
          <p className="text-3xl font-bold mt-1 text-red-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">عمولات المنصة الكلية</span>
          <p className="text-3xl font-bold mt-1 text-stone-900">٠.٠٠ ر.س</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-150">
          <span className="text-xs text-stone-500">إجمالي الفنانين</span>
          <p className="text-3xl font-bold mt-1 text-amber-600">0</p>
        </div>
      </div>
    </div>
  )
}
