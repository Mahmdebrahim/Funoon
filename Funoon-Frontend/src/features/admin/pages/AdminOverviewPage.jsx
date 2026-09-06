import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  Banknote, TrendingUp, ShoppingBag, Users, Palette, Wallet,
  AlertTriangle, Image, ArrowUpRight, ArrowDownRight, ExternalLink,
  MapPin, Target, UserPlus,
} from "lucide-react";
import { adminService } from "../services/admin.service";
import { ROUTES } from "../../../config/routes";

// ═══ Helpers ═══
const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const PERIODS = [
  { value: "7d", label: "٧ أيام" },
  { value: "30d", label: "٣٠ يوم" },
  { value: "90d", label: "٩٠ يوم" },
  { value: "365d", label: "سنة" },
];

// نص الفترة (للأزرار والعناوين)
const PERIOD_LABELS = { "7d": "٧ أيام", "30d": "٣٠ يوم", "90d": "٩٠ يوم", "365d": "سنة" };

// ✅ ذكي: يغير شكل الليبل حسب عدد الأيام
const makeTickFormatter = (days) => (key) => {
  if (!key) return "";
  const d = new Date(key);
  if (isNaN(d.getTime())) return key;
  if (days <= 7) return d.toLocaleDateString("ar-EG", { weekday: "short" });
  if (days <= 90) return `${d.getMonth() + 1}/${d.getDate()}`;
  return d.toLocaleDateString("ar-EG", { month: "short" });
};

const STATUS_META = {
  PENDING_PAYMENT: { label: "بانتظار الدفع", color: "#f59e0b" },
  PAID: { label: "مدفوع", color: "#3b82f6" },
  PROCESSING: { label: "قيد التجهيز", color: "#f97316" },
  SHIPPED: { label: "تم الشحن", color: "#8b5cf6" },
  DELIVERED: { label: "تم التوصيل", color: "#10b981" },
  COMPLETED: { label: "مكتمل", color: "#059669" },
  CANCELLED: { label: "ملغي", color: "#ef4444" },
  REFUNDED: { label: "مسترد", color: "#dc2626" },
  DISPUTED: { label: "متنازع", color: "#b91c1c" },
};

// ═══ Main Page ═══
export default function AdminOverviewPage() {
  const [period, setPeriod] = useState("30d");
  const periodLabel = PERIOD_LABELS[period];

  const { data, isLoading } = useQuery({
    queryKey: ["adminStats", period],
    queryFn: () => adminService.getStats(period),
  });

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const {
    overview, period: pd, charts, topArtists,
    recentOrders, pendingWithdrawalsList, onHoldOrdersList, growth,
  } = data;
  const maxArtistSales = topArtists?.[0]?.totalSales || 1;
  const maxCityOrders = growth?.topCities?.[0]?.orders || 1;

  return (
    <div className="space-y-6">
      {/* ═══ Header + Period Selector ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-on-surface">نظرة عامة</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            ملخص أداء المنصة {pd?.growth !== null && pd?.growth !== undefined && "(مقارنة بالفترة السابقة)"}
          </p>
        </div>
        <div className="flex gap-1 bg-surface-container-low p-1 border border-outline-variant/40">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 text-xs font-body font-semibold transition-premium ${period === p.value
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ تنبيهات سريعة ═══ */}
      {(overview.onHoldOrders.count > 0 || overview.pendingWithdrawals.count > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {overview.onHoldOrders.count > 0 && (
            <Link to={ROUTES.ADMIN_ORDERS} className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 hover:border-red-400 transition-premium">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  {overview.onHoldOrders.count} بلاغ مفتوح (أموال مجمدة)
                </p>
                <p className="text-xs text-red-600">بقيمة {fmt(overview.onHoldOrders.amount)} ر.س تحتاج مراجعة</p>
              </div>
              <ExternalLink className="w-4 h-4 text-red-500" />
            </Link>
          )}
          {overview.pendingWithdrawals.count > 0 && (
            <Link to={ROUTES.ADMIN_WITHDRAWALS} className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 hover:border-amber-400 transition-premium">
              <Wallet className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700">
                  {overview.pendingWithdrawals.count} طلب سحب معلق
                </p>
                <p className="text-xs text-amber-600">بقيمة {fmt(overview.pendingWithdrawals.amount)} ر.س بانتظار التحويل</p>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500" />
            </Link>
          )}
        </div>
      )}

      {/* ═══ KPI Cards (6 كروت) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Banknote}
          label="إجمالي المبيعات"
          value={`${fmt(overview.totalRevenue)} ر.س`}
          sub={`${fmt(pd.revenue)} ر.س في الفترة`}
          trend={pd.growth}
        />
        <StatCard
          icon={TrendingUp}
          label="عمولة المنصة"
          value={`${fmt(overview.totalCommission)} ر.س`}
          sub={`${fmt(pd.commission)} ر.س في الفترة`}
          accent="text-secondary"
        />
        <StatCard
          icon={ShoppingBag}
          label="الطلبات"
          value={fmt(overview.totalOrders)}
          sub={`${fmt(pd.orders)} طلب في الفترة`}
        />
        <StatCard
          icon={Users}
          label="المستخدمون"
          value={fmt(overview.totalUsers)}
          sub={`${overview.totalBuyers} مشترى · ${overview.totalArtists} فنان`}
          accent="text-blue-600"
        />
        {/* ✅ تم تغيير النص */}
        <StatCard
          icon={UserPlus}
          label={`مستخدمون جدد (${periodLabel})`}
          value={`+${growth?.newUsersInPeriod?.total || 0}`}
          sub={`${growth?.newUsersInPeriod?.buyers || 0} مشتري / ${growth?.newUsersInPeriod?.artists || 0} فنان`}
          accent="text-emerald-600"
        />
        <StatCard
          icon={Target}
          label="عملاء مكررون"
          value={`${growth?.repeatRate || 0}%`}
          sub="اشتروا أكثر من مرة"
          accent="text-purple-600"
        />
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4">
            المبيعات اليومية (ر.س) - آخر {periodLabel}
          </h3>
          <div dir="rtl" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueByDay}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                {/* ✅ minTickGap يمنع التزاحم تلقائياً */}
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={makeTickFormatter(pd?.days || 30)}
                  minTickGap={40}
                />
                <YAxis tick={{ fontSize: 10 }} width={45} />
                <Tooltip formatter={(v) => [`${fmt(v)} ر.س`, "مبيعات"]} labelFormatter={(d) => d} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4">الطلبات حسب الحالة</h3>
          <div dir="rtl" className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.ordersByStatus} dataKey="count" nameKey="_id" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {charts.ordersByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_META[entry._id]?.color || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, STATUS_META[n]?.label || n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {charts.ordersByStatus.map((s) => (
              <span key={s._id} className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_META[s._id]?.color }} />
                {STATUS_META[s._id]?.label} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Row 2: Top Artists + Recent Orders ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-secondary" /> أفضل الفنانين مبيعاً
          </h3>
          <div className="space-y-4">
            {topArtists?.length === 0 && (
              <p className="text-xs text-on-surface-variant">لا توجد مبيعات بعد</p>
            )}
            {topArtists?.map((a, i) => (
              <div key={a.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-body font-medium text-on-surface">{i + 1}. {a.name}</span>
                  <span className="text-on-surface-variant">{fmt(a.totalSales)} ر.س</span>
                </div>
                <div className="h-1.5 bg-surface-container-low overflow-hidden">
                  <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${(a.totalSales / maxArtistSales) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4">آخر الطلبات</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30">
                  <th className="pb-2 pr-2">الطلب</th>
                  <th className="pb-2">المشتري</th>
                  <th className="pb-2">الفنان</th>
                  <th className="pb-2">المبلغ</th>
                  <th className="pb-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((o) => (
                  <tr key={o._id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-2.5 pr-2 font-mono text-xs text-on-surface-variant">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="py-2.5 text-on-surface">{o.buyer?.name}</td>
                    <td className="py-2.5 text-on-surface-variant">{o.artist?.name}</td>
                    <td className="py-2.5 font-semibold text-on-surface">{fmt(o.financials?.totalAmount)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: STATUS_META[o.status]?.color }}>
                        {STATUS_META[o.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          {/* ✅ تم تغيير النص */}
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" /> المستخدمون الجدد (آخر {periodLabel})
          </h3>
          <div dir="rtl" className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth?.usersSeries || []}>
                <defs>
                  <linearGradient id="buyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="artists" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                {/* ✅ تم حذف interval={0} وإضافة minTickGap */}
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 9 }}
                  tickFormatter={makeTickFormatter(pd?.days || 30)}
                  minTickGap={40}
                />
                <YAxis tick={{ fontSize: 10 }} width={25} allowDecimals={false} />
                <Tooltip
                  formatter={(v, name) => [v, name === "buyers" ? "مشترين" : "فنانين"]}
                  labelFormatter={(d) => d}
                />
                <Area type="monotone" dataKey="buyers" stroke="#3b82f6" strokeWidth={2} fill="url(#buyers)" />
                <Area type="monotone" dataKey="artists" stroke="var(--color-secondary)" strokeWidth={2} fill="url(#artists)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-3">
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#3b82f6" }} /> مشترين
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded-sm" style={{ background: "var(--color-secondary)" }} /> فنانين
            </span>
          </div>
        </div>

        {/* Funnel - مررنا pd.days */}
        <OrdersHealthCard health={growth?.ordersHealth} days={pd?.days || 30} />

        {/* Top Cities */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
          <h3 className="text-sm font-body font-semibold text-on-surface mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" /> أكثر المدن شراءً
          </h3>
          <div className="space-y-4">
            {(growth?.topCities?.length || 0) === 0 && (
              <p className="text-xs text-on-surface-variant">لا توجد بيانات بعد</p>
            )}
            {growth?.topCities?.map((c, i) => (
              <div key={c._id || i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-body font-medium text-on-surface">
                    {i + 1}. {c._id || "غير محدد"}
                  </span>
                  <span className="text-on-surface-variant">
                    {c.orders} طلب · {fmt(c.revenue)} ر.س
                  </span>
                </div>
                <div className="h-1.5 bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(c.orders / maxCityOrders) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Funnel Card - أضفنا days كـ prop ═══
function OrdersHealthCard({ health, days = 30 }) {
  const series = health?.series || [];
  const cancelRate = health?.cancelRate || 0;
  const periodLabel = PERIOD_LABELS[
    days <= 7 ? "7d" : days <= 30 ? "30d" : days <= 90 ? "90d" : "365d"
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        {/* ✅ تم تغيير النص */}
        <h3 className="text-sm font-body font-semibold text-on-surface">
          صحة الطلبات (آخر {periodLabel})
        </h3>
        <span className={`text-xs font-semibold ${cancelRate > 15 ? "text-red-600" : "text-emerald-600"}`}>
          معدل الإلغاء: {cancelRate}%
        </span>
      </div>
      <div dir="rtl" className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            {/* ✅ تم حذف interval={0} وإضافة minTickGap */}
            <XAxis
              dataKey="key"
              tick={{ fontSize: 9 }}
              tickFormatter={makeTickFormatter(days)}
              minTickGap={40}
            />
            <YAxis tick={{ fontSize: 10 }} width={25} allowDecimals={false} />
            <Tooltip formatter={(v, n) => [v, n === "paid" ? "مدفوع" : "ملغي"]} labelFormatter={(d) => d} />
            <Bar dataKey="paid" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 justify-center mt-3">
        <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="w-3 h-3 rounded-sm bg-[#10b981]" /> مدفوع ({health?.totalPaid || 0})
        </span>
        <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="w-3 h-3 rounded-sm bg-[#ef4444]" /> ملغي ({health?.totalCancelled || 0})
        </span>
      </div>
    </div>
  );
}

// ═══ Stat Card ═══
function StatCard({ icon: Icon, label, value, sub, trend, accent = "text-primary" }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 flex items-center justify-center bg-surface-container-low ${accent}`}>
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
        {trend !== null && trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
      <p className="font-display text-2xl text-on-surface leading-none">{value}</p>
      {sub && <p className="text-xs text-on-surface-variant mt-2">{sub}</p>}
    </div>
  );
}

// ═══ Loading ═══
function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-surface-container animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-surface-container animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 bg-surface-container animate-pulse" />
        <div className="h-72 bg-surface-container animate-pulse" />
      </div>
    </div>
  );
}