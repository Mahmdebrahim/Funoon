import { Link } from "react-router-dom";
import {
  Loader2, TrendingUp, ShoppingBag, Wallet, Sparkles,
  ChevronLeft, Package, Clock, CheckCircle2, Truck, Image
} from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboard";
import { ROUTES } from "../../../config/routes";
import { getMediaUrl } from "../../../utils/media";
import { useAuthStore } from "../../auth/stores/authStore";
import Button from "../../../components/Ui/Button";
// import { Image, ShoppingBag } from "lucide-react";
const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: "قيد الانتظار", color: "text-yellow-700", bg: "bg-yellow-50", icon: Clock },
  PAID: { label: "تم الدفع", color: "text-blue-700", bg: "bg-blue-50", icon: CheckCircle2 },
  PROCESSING: { label: "قيد التجهيز", color: "text-orange-700", bg: "bg-orange-50", icon: Package },
  SHIPPED: { label: "تم الشحن", color: "text-purple-700", bg: "bg-purple-50", icon: Truck },
  DELIVERED: { label: "تم التوصيل", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  COMPLETED: { label: "مكتمل", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  CANCELLED: { label: "ملغي", color: "text-red-700", bg: "bg-red-50", icon: Clock },
};

export default function ArtistDashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  console.log(stats);
  
  const user = useAuthStore((s) => s.user);
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-[var(--color-surface-container-low)] rounded" />
            <div className="h-4 w-64 bg-[var(--color-surface-container-low)] rounded mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-[var(--color-surface-container-low)] rounded-lg" />
            <div className="h-9 w-24 bg-[var(--color-surface-container-low)] rounded-lg" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 bg-[var(--color-surface-container-low)] rounded" />
                <div className="w-9 h-9 bg-[var(--color-surface-container-low)] rounded-lg" />
              </div>
              <div className="h-8 w-24 bg-[var(--color-surface-container-low)] rounded mb-1" />
              <div className="h-3 w-32 bg-[var(--color-surface-container-low)] rounded" />
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-[var(--color-surface-container-low)] rounded" />
            <div className="h-4 w-20 bg-[var(--color-surface-container-low)] rounded" />
          </div>
          <div className="divide-y divide-[var(--color-outline-variant)]/20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-[var(--color-surface-container-low)] rounded-lg" />
                  <div>
                    <div className="h-4 w-32 bg-[var(--color-surface-container-low)] rounded mb-1" />
                    <div className="h-3 w-24 bg-[var(--color-surface-container-low)] rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-16 bg-[var(--color-surface-container-low)] rounded" />
                  <div className="h-6 w-20 bg-[var(--color-surface-container-low)] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Artworks Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-4 text-center">
              <div className="h-8 w-12 bg-[var(--color-surface-container-low)] rounded mx-auto mb-2" />
              <div className="h-3 w-24 bg-[var(--color-surface-container-low)] rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-32">
        <p className="text-[var(--color-on-surface-variant)]">تعذّر تحميل البيانات. حاول مرة أخرى.</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "إجمالي المبيعات",
      value: `${(stats?.sales?.totalEarnings || 0).toLocaleString()} ر.س`,
      sub: `${stats?.sales?.totalOrders || 0} طلب`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "الطلبات النشطة",
      value: stats?.sales?.activeOrders || 0,
      sub: "بانتظار التجهيز أو الشحن",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "رصيد المحفظة",
      value: `${(stats?.wallet?.available || 0).toLocaleString()} ر.س`,
      sub: `معلّق: ${(stats?.wallet?.pending || 0).toLocaleString()} ر.س`,
      icon: Wallet,
      color: "text-[var(--color-primary)]",
      bg: "bg-[var(--color-primary)]/10",
    },
    {
      label: "الاشتراك",
      value: stats?.subscription?.label || "لا يوجد",
      sub: stats?.subscription?.isActive
        ? `ينتهي: ${new Date(stats.subscription.endDate).toLocaleDateString("ar-SA", { month: "short", year: "numeric" })}`
        : "غير نشط",
      icon: Sparkles,
      color: "text-[var(--color-secondary)]",
      bg: "bg-[var(--color-secondary)]/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ═══ Welcome + Quick Actions ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">
            أهلاً، {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.ADD_ARTWORK}>
            <Button variant="primary" size="sm" icon={Image}>رفع لوحة</Button>
          </Link>
          <Link to={ROUTES.ARTIST_ORDERS}>
            <Button variant="outline" size="sm" icon={ShoppingBag}>الطلبات</Button>
          </Link>
        </div>
      </div>
      {/* ═══ Stat Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-[var(--color-on-surface)] mb-1">
                {card.value}
              </p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ═══ Recent Orders ═══ */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-variant)]/30">
          <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
            آخر الطلبات
          </h2>
          <Link
            to={ROUTES.ARTIST_ORDERS}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentOrders?.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-10 h-10 text-[var(--color-on-surface-variant)]/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-[var(--color-on-surface-variant)]">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-outline-variant)]/20">
            {stats?.recentOrders?.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID;
              const StatusIcon = statusConfig.icon;
              const artwork = order.items?.[0]?.artwork;
              return (
                <div key={order._id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    {artwork?.coverImage && (
                      <img
                        src={getMediaUrl(artwork.coverImage)}
                        alt={artwork.title}
                        crossOrigin="anonymous"
                        className="w-10 h-12 object-cover rounded-lg border border-[var(--color-outline-variant)]/30"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        {artwork?.title || "لوحة فنية"}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        {order.buyer?.name} • {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {(order.financials?.totalArtistEarning || 0).toLocaleString()} ر.س
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Artworks Quick Stats ═══ */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي اللوحات", value: stats?.artworks?.total || 0 },
          { label: "لوحات نشطة", value: stats?.artworks?.active || 0 },
          { label: "لوحات مباعة", value: stats?.artworks?.sold || 0 },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-display font-bold text-[var(--color-primary)] mb-1">
              {item.value}
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{item.label}</p>
          </div>
        ))}
      </div>

    </div>
  );
}