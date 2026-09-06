import { Link } from "react-router-dom";
import {
    Loader2, Sparkles, Calendar, CheckCircle2, XCircle,
    Crown, RefreshCw, CreditCard,
} from "lucide-react";
import { useDashboardStats, useSubscriptionPayments } from "../hooks/useDashboard";
import { ROUTES } from "../../../config/routes";
import Button from "../../../components/Ui/Button";

export default function ArtistSubscriptionPage() {
    const { data: stats, isLoading } = useDashboardStats();
    const { data: paymentsData, isLoading: isPaymentsLoading } = useSubscriptionPayments();

    const subscription = stats?.subscription;
    const payments = paymentsData?.payments || paymentsData || [];

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header */}
                <div>
                    <div className="h-8 w-40 bg-[var(--color-surface-container-low)] rounded" />
                    <div className="h-4 w-64 bg-[var(--color-surface-container-low)] rounded mt-2" />
                </div>

                {/* Current Plan Card */}
                <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl overflow-hidden">
                    {/* Header gradient skeleton */}
                    <div className="h-28 bg-gradient-to-l from-[var(--color-surface-container-low)] to-[var(--color-surface-container-high)] p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl" />
                            <div>
                                <div className="h-6 w-32 bg-white/30 rounded mb-1" />
                                <div className="h-4 w-24 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-[var(--color-surface-container-low)] rounded-full" />
                                <div>
                                    <div className="h-3 w-20 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                    <div className="h-4 w-28 bg-[var(--color-surface-container-low)] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6">
                        <div className="h-10 w-44 bg-[var(--color-surface-container-low)] rounded-lg" />
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl">
                    <div className="px-5 py-4 border-b border-[var(--color-outline-variant)]/30">
                        <div className="h-5 w-32 bg-[var(--color-surface-container-low)] rounded" />
                    </div>
                    <div className="divide-y divide-[var(--color-outline-variant)]/20">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-[var(--color-surface-container-low)] rounded-lg" />
                                    <div>
                                        <div className="h-4 w-32 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                        <div className="h-3 w-24 bg-[var(--color-surface-container-low)] rounded" />
                                    </div>
                                </div>
                                <div>
                                    <div className="h-4 w-20 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                    <div className="h-5 w-16 bg-[var(--color-surface-container-low)] rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const isActive = subscription?.isActive;
    const daysLeft = subscription?.endDate
        ? Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div>
                <h1 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">اشتراكي</h1>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                    إدارة باقة اشتراكك ومدفوعاتك
                </p>
            </div>

            {/* ═══ Current Plan Card ═══ */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl overflow-hidden">
                {isActive ? (
                    <>
                        {/* Header gradient */}
                        <div className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-secondary)] p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Crown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-display font-bold">{subscription?.label}</h2>
                                        <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>اشتراك نشط</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-xs text-[var(--color-on-surface-variant)]">تاريخ الانتهاء</p>
                                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                                        {new Date(subscription.endDate).toLocaleDateString("ar-SA", {
                                            year: "numeric", month: "long", day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-xs text-[var(--color-on-surface-variant)]">الأيام المتبقية</p>
                                    <p className={`text-sm font-semibold ${daysLeft <= 30 ? "text-amber-600" : "text-[var(--color-on-surface)]"}`}>
                                        {daysLeft} يوم
                                        {daysLeft <= 30 && " ⚠️"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-xs text-[var(--color-on-surface-variant)]">الحالة</p>
                                    <p className="text-sm font-semibold text-emerald-600">مفعّل</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <Link to={ROUTES.SUBSCRIPTIONS}>
                                <Button variant="primary" size="md" icon={RefreshCw}>
                                    تجديد / ترقية الباقة
                                </Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    /* ─── No active subscription ─── */
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto bg-[var(--color-surface-container-low)] rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-[var(--color-on-surface-variant)]/40" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg font-display font-bold text-[var(--color-on-surface)] mb-2">
                            لا يوجد اشتراك نشط
                        </h2>
                        <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 max-w-md mx-auto">
                            اشترك في إحدى الباقات لتتمكن من عرض لوحاتك الفنية وبيعها على المنصة.
                        </p>
                        <Link to={ROUTES.SUBSCRIPTIONS}>
                            <Button variant="primary" size="md" icon={Sparkles}>
                                تصفح الباقات واشترك
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* ═══ Payment History ═══ */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl">
                <div className="px-5 py-4 border-b border-[var(--color-outline-variant)]/30">
                    <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
                        سجل المدفوعات
                    </h2>
                </div>

                {isPaymentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                    </div>
                ) : !payments || payments.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="w-10 h-10 text-[var(--color-on-surface-variant)]/30 mx-auto mb-3" strokeWidth={1} />
                        <p className="text-sm text-[var(--color-on-surface-variant)]">لا توجد مدفوعات بعد</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-outline-variant)]/20">
                        {payments.map((payment) => (
                            <div key={payment._id || payment.id} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-on-surface)]">
                                            {payment.planLabel || payment.description || "اشتراك"}
                                        </p>
                                        <p className="text-xs text-[var(--color-on-surface-variant)]">
                                            {new Date(payment.createdAt || payment.paidAt).toLocaleDateString("ar-SA", {
                                                year: "numeric", month: "long", day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                                        {(payment.amount || 0).toLocaleString()} ر.س
                                    </p>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${payment.status === "paid"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-stone-100 text-stone-600"
                                        }`}>
                                        {payment.status === "paid" ? "مدفوع" : payment.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}