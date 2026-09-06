import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Eye,
    Heart,
    ShoppingBag,
    TrendingUp,
    Loader2,
    BarChart3,
    Lock,
    Sparkles,
    ArrowLeft,
    Crown,
    Crown as Award,
} from "lucide-react";
import { useArtistAnalytics } from "../hooks/useDashboard";
import { getMediaUrl } from "../../../utils/media";

const CARD_STYLES = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    pink: { bg: "bg-pink-50", text: "text-pink-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
};

// ═══════════════════════════════════════════════════
// Skeleton Loading (أحلى من الـ spinner)
// ═══════════════════════════════════════════════════
function AnalyticsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-[var(--color-surface-container-low)] rounded" />
                    <div className="h-4 w-64 bg-[var(--color-surface-container-low)] rounded mt-2" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 w-20 bg-[var(--color-surface-container-low)] rounded-full" />
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 p-5 rounded-xl">
                        <div className="w-10 h-10 bg-[var(--color-surface-container-low)] rounded-lg mb-3" />
                        <div className="h-3 w-24 bg-[var(--color-surface-container-low)] rounded mb-2" />
                        <div className="h-6 w-20 bg-[var(--color-surface-container-low)] rounded" />
                    </div>
                ))}
            </div>

            {/* Graph */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl p-5">
                <div className="h-6 w-48 bg-[var(--color-surface-container-low)] rounded mb-4" />
                <div className="h-40 bg-[var(--color-surface-container-low)] rounded" />
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl p-4">
                        <div className="h-5 w-32 bg-[var(--color-surface-container-low)] rounded mb-4" />
                        {[...Array(5)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3 py-3 border-t border-[var(--color-outline-variant)]/20">
                                <div className="w-6 h-6 bg-[var(--color-surface-container-low)] rounded-full" />
                                <div className="w-10 h-10 bg-[var(--color-surface-container-low)] rounded" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                    <div className="h-3 w-16 bg-[var(--color-surface-container-low)] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Upgrade Required (صفحة ترقية)
// ═══════════════════════════════════════════════════
function UpgradeRequiredPage() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4" dir="rtl">
            <div className="max-w-lg w-full  p-8 text-center">
                {/* Lock Icon with Gradient */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl flex items-center justify-center">
                            <Lock className="w-10 h-10 text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                <h2 className="font-display text-2xl text-[var(--color-on-surface)] mb-2">
                    ميزة حصرية للباقات المتقدمة
                </h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 leading-relaxed">
                    الإحصائيات التفصيلية (مشاهدات يومية، معدل التحويل، تحليل أداء كل لوحة)
                    متاحة فقط للفنانين المشتركين في باقة
                    <strong className="text-[var(--color-primary)] mx-1">أوبال بلس</strong>
                    أو
                    <strong className="text-[var(--color-secondary)] mx-1">أوبال برستيج</strong>.
                </p>

                {/* Features Preview */}
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-5 mb-6 text-right space-y-3">
                    {/* <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-3">
                        اللي هتشوفه:
                    </p> */}
                    {[
                        { icon: Eye, text: "مشاهدات يومية مع رسم بياني" },
                        { icon: TrendingUp, text: "معدل التحويل من مشاهدة لطلب" },
                        { icon: Award, text: "الأكثر أداءً حسب الفترة" },
                        { icon: BarChart3, text: "تحليل أداء كل لوحة" },
                    ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.5} />
                            </div>
                            <span className="text-sm text-[var(--color-on-surface)]">{text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Link to="/subscription">
                    <button className="w-full py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold rounded-full hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer">
                        <Crown className="w-5 h-5" />
                        اختر باقتك الآن
                    </button>
                </Link>

                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors mt-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    الرجوع للوحة التحكم
                </Link>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Generic Error
// ═══════════════════════════════════════════════════
function GenericErrorPage({ onRetry }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
            <div className="max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h2 className="font-display text-xl text-[var(--color-on-surface)] mb-2">
                    تعذّر تحميل الإحصائيات
                </h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
                    حصل خطأ غير متوقع. تحقق من اتصالك وحاول مرة أخرى.
                </p>
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-full hover:bg-[var(--color-primary)]/90 transition-colors cursor-pointer"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    إعادة المحاولة
                </button>
            </div>
        </div>
    );
}

const getErrorInfo = (error) => {
    if (!error) return { status: null, message: "" };

    // axios interceptor ممكن يغير الشكل، فنشيك على كل الاحتمالات
    const status =
        error?.response?.status ||
        error?.statusCode ||
        error?.status ||
        null;

    const message =
        error?.response?.data?.message ||
        error?.message ||
        error?.data?.message ||
        "";

    return { status, message };
};
// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function ArtistAnalyticsPage() {
    const [days, setDays] = useState(30);
    const { data, isLoading, isError, error, refetch } = useArtistAnalytics(days);

    if (isLoading) return <AnalyticsSkeleton />;

    const errorInfo = getErrorInfo(error);

    const isForbidden =
        errorInfo.status === 403 ||
        errorInfo.message.includes("أوبال بلس") ||
        errorInfo.message.includes("أوبال برستيج");

    if (isError && isForbidden) return <UpgradeRequiredPage />;

    if (isError) return <GenericErrorPage onRetry={refetch} />;

    if (!data) return <GenericErrorPage onRetry={refetch} />;

    const { summary, dailyViews, artworks, topByViews, topByFavorites, topByOrders } = data;

    const summaryCards = [
        { label: "مشاهدات (الإجمالي)", value: summary.totalViews, icon: Eye, color: "blue" },
        { label: `مشاهدات (آخر ${days} يوم)`, value: summary.periodViews, icon: Eye, color: "indigo" },
        { label: "المفضلات", value: summary.totalFavorites, icon: Heart, color: "pink" },
        { label: "الطلبات", value: summary.totalOrders, icon: ShoppingBag, color: "emerald" },
        { label: "أرباحك الصافية", value: `${summary.totalEarnings.toLocaleString()} ر.س`, icon: TrendingUp, color: "amber" },
    ];

    return (
        <div className="space-y-8" dir="rtl">
            {/* ═══ Header + Period Selector ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl text-[var(--color-on-surface)] flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-[var(--color-secondary)]" />
                        إحصائيات لوحاتي
                    </h1>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                        تحليل تفصيلي لأداء لوحاتك
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors cursor-pointer ${days === d
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                                }`}
                        >
                            {d === 7 ? "أسبوع" : d === 30 ? "شهر" : "3 شهور"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ Summary Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {summaryCards.map(({ label, value, icon: Icon, color }) => {
                    const style = CARD_STYLES[color];
                    return (
                        <div
                            key={label}
                            className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 p-5 rounded-xl"
                        >
                            <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${style.text}`} strokeWidth={1.5} />
                            </div>
                            <p className="text-xs text-[var(--color-on-surface-variant)] mb-1">{label}</p>
                            <p className="font-display text-xl text-[var(--color-on-surface)]">
                                {typeof value === "number" ? value.toLocaleString() : value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ═══ Views Graph ═══ */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg text-[var(--color-on-surface)]">
                        مشاهدات اللوحات يومياً
                    </h2>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">
                        آخر {days} يوم — {summary.periodViews || 0} مشاهدة
                    </span>
                </div>
                {dailyViews?.some((d) => d.count > 0) ? (
                    <ViewsBarChart dailyViews={dailyViews} />
                ) : (
                    <p className="text-sm text-[var(--color-on-surface-variant)] py-8 text-center">
                        لسه مفيش مشاهدات مسجلة في الفترة دي — العداد بيشتغل من لحظة فتح اللوحة.
                    </p>
                )}
            </div>

            {/* ═══ Top Performers ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TopList title="الأكثر مشاهدة (الفترة)" items={topByViews} valueKey="periodViews" icon={Eye} />
                <TopList title="الأكثر تفضيلاً" items={topByFavorites} valueKey="favorites" icon={Heart} />
                <TopList title="الأكثر مبيعاً" items={topByOrders} valueKey="orders" icon={ShoppingBag} />
            </div>

            {/* ═══ All Artworks Table ═══ */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[var(--color-outline-variant)]/40">
                    <h2 className="font-display text-lg text-[var(--color-on-surface)]">
                        تفاصيل كل اللوحات
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-container-low)]/50">
                            <tr>
                                <th className="p-3 text-right text-xs font-semibold text-[var(--color-on-surface-variant)]">اللوحة</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">مشاهدات (الكل)</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">مشاهدات ({days} يوم)</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">مفضلات</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">طلبات</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">إيرادات</th>
                                <th className="p-3 text-center text-xs font-semibold text-[var(--color-on-surface-variant)]">تحويل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {artworks.map((artwork) => (
                                <tr key={artwork._id} className="border-t border-[var(--color-outline-variant)]/20">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getMediaUrl(artwork.coverImage)}
                                                alt={artwork.title}
                                                className="w-10 h-10 object-cover rounded"
                                            />
                                            <span className="font-medium text-[var(--color-on-surface)] truncate max-w-[180px]">
                                                {artwork.title}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-[var(--color-on-surface-variant)]">
                                        {artwork.allTimeViews.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center font-semibold text-[var(--color-primary)]">
                                        {artwork.periodViews.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">{artwork.favorites.toLocaleString()}</td>
                                    <td className="p-3 text-center">{artwork.orders}</td>
                                    <td className="p-3 text-center font-semibold text-emerald-600">
                                        {artwork.revenue.toLocaleString()} ر.س
                                    </td>
                                    <td className="p-3 text-center">
                                        <span
                                            className={`text-xs font-semibold ${artwork.conversionRate > 5
                                                    ? "text-emerald-600"
                                                    : artwork.conversionRate > 1
                                                        ? "text-amber-600"
                                                        : "text-[var(--color-on-surface-variant)]"
                                                }`}
                                        >
                                            {artwork.conversionRate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Bar Chart
// ═══════════════════════════════════════════════════
function ViewsBarChart({ dailyViews }) {
    const max = Math.max(...dailyViews.map((d) => d.count), 1);

    return (
        <div className="flex items-end gap-1 h-40" dir="ltr">
            {dailyViews.map((d) => (
                <div
                    key={d.date}
                    className="flex-1 h-full flex flex-col items-center justify-end gap-1 group relative"
                >
                    <div
                        className="w-full bg-[var(--color-primary)]/70 rounded-t hover:bg-[var(--color-primary)] transition-colors"
                        style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 1)}%` }}
                    />
                    <span className="text-[8px] text-[var(--color-on-surface-variant)]">
                        {d.date.slice(8)}
                    </span>
                    <div className="absolute -top-8 hidden group-hover:block bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.count} مشاهدة
                    </div>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Top List
// ═══════════════════════════════════════════════════
function TopList({ title, items, valueKey, icon: Icon }) {
    return (
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-outline-variant)]/40 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[var(--color-secondary)]" strokeWidth={1.5} />
                <h3 className="font-display text-sm text-[var(--color-on-surface)]">{title}</h3>
            </div>
            <div className="divide-y divide-[var(--color-outline-variant)]/20">
                {!items || items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--color-on-surface-variant)]">
                        لا توجد بيانات
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div key={item._id} className="p-3 flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-surface-container-low)] flex items-center justify-center text-xs font-bold text-[var(--color-on-surface-variant)] shrink-0">
                                {idx + 1}
                            </span>
                            <img
                                src={getMediaUrl(item.coverImage)}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                                    {item.title}
                                </p>
                                <p className="text-xs text-[var(--color-on-surface-variant)]">
                                    {(item[valueKey] || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}