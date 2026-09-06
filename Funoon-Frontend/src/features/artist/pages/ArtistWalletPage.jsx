import { useState } from "react";
import {
    Loader2, Wallet, Clock, TrendingUp, ArrowDownCircle,
    Banknote, X, AlertCircle, RefreshCw, CheckCircle2, XCircle,
    Receipt,
} from "lucide-react";
import {
    useWallet,
    useWalletTransactions,
    useMyWithdrawals,
    useRequestWithdrawal,
} from "../hooks/useDashboard";
import Button from "../../../components/Ui/Button";

// ═══════════════════════════════════════════════════
// Configs
// ═══════════════════════════════════════════════════
const TRANSACTION_TYPES = {
    CREDIT_SALE: { label: "أرباح بيع", color: "text-emerald-700", bg: "bg-emerald-50", icon: TrendingUp, inflow: true },
    ADJUSTMENT: { label: "تسوية / استرداد", color: "text-amber-700", bg: "bg-amber-50", icon: RefreshCw, inflow: true }, // ✅ جديد
    DEBIT_REFUND: { label: "استرداد طلب", color: "text-red-700", bg: "bg-red-50", icon: ArrowDownCircle, inflow: false },
    WITHDRAWAL: { label: "سحب", color: "text-blue-700", bg: "bg-blue-50", icon: Banknote, inflow: false },
    DEBIT_WITHDRAWAL: { label: "سحب", color: "text-blue-700", bg: "bg-blue-50", icon: Banknote, inflow: false },
    CREDIT_RELEASE: { label: "إطلاق الأموال", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2, inflow: true },
};

const WITHDRAWAL_STATUS = {
    PENDING: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
    APPROVED: { label: "تمت الموافقة", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
    PAID: { label: "تم الدفع", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
    REJECTED: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50", icon: XCircle },
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
export default function ArtistWalletPage() {
    const [activeTab, setActiveTab] = useState("transactions");
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const { data: wallet, isLoading: isWalletLoading } = useWallet();
    const { data: txData, isLoading: isTxLoading } = useWalletTransactions({ limit: 20 });
    const { data: wdData, isLoading: isWdLoading } = useMyWithdrawals();

    const transactions = txData?.transactions || [];
    const withdrawals = wdData?.withdrawals || wdData || [];

    const balanceCards = [
        {
            label: "متاح للسحب",
            value: wallet?.balance?.available || 0,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "معلّق",
            value: wallet?.balance?.pending || 0,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "إجمالي الأرباح",
            value: wallet?.totalEarned || 0,
            icon: TrendingUp,
            color: "text-[var(--color-primary)]",
            bg: "bg-[var(--color-primary)]/10",
        },
        {
            label: "إجمالي المسحوب",
            value: wallet?.totalWithdrawn || 0,
            icon: Banknote,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
    ];

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">المحفظة</h1>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                        إدارة أرباحك وسحب رصيدك المتاح
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    icon={Banknote}
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={(wallet?.balance?.available || 0) <= 0}
                >
                    سحب أرباح
                </Button>
            </div>

            {/* ═══ Balance Cards ═══ */}
            {isWalletLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-3 w-20 bg-[var(--color-surface-container-low)] rounded" />
                                <div className="w-9 h-9 bg-[var(--color-surface-container-low)] rounded-lg" />
                            </div>
                            <div className="h-8 w-24 bg-[var(--color-surface-container-low)] rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {balanceCards.map((card, i) => {
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
                                <p className="text-2xl font-display font-bold text-[var(--color-on-surface)]">
                                    {(card.value || 0).toLocaleString()}{" "}
                                    <span className="text-sm font-body font-normal text-[var(--color-on-surface-variant)]">ر.س</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ Tabs ═══ */}
            <div className="flex gap-1 border-b border-[var(--color-outline-variant)]/40">
                {[
                    { value: "transactions", label: "المعاملات" },
                    { value: "withdrawals", label: "السحوبات" },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`relative px-4 py-3 text-sm font-body font-medium transition-colors ${activeTab === tab.value
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.value && (
                            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[var(--color-primary)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ Transactions Tab ═══ */}
            {activeTab === "transactions" && (
                <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl">
                    {isTxLoading ? (
                        <div className="divide-y divide-[var(--color-outline-variant)]/20 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-[var(--color-surface-container-low)] rounded-lg" />
                                        <div>
                                            <div className="h-4 w-24 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                            <div className="h-3 w-40 bg-[var(--color-surface-container-low)] rounded" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="h-4 w-20 bg-[var(--color-surface-container-low)] rounded mb-1 ml-auto" />
                                        <div className="h-3 w-16 bg-[var(--color-surface-container-low)] rounded ml-auto" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16">
                            <Wallet className="w-10 h-10 text-[var(--color-on-surface-variant)]/30 mx-auto mb-3" strokeWidth={1} />
                            <p className="text-sm text-[var(--color-on-surface-variant)]">لا توجد معاملات بعد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-outline-variant)]/20">
                            {transactions.map((tx) => {
                                const config = TRANSACTION_TYPES[tx.type] || {
                                    label: tx.type,
                                    color: "text-stone-700",
                                    bg: "bg-stone-100",
                                    icon: Wallet,
                                };
                                const Icon = config.icon;
                                const isInflow = config.inflow !== undefined ? config.inflow : tx.amount > 0;
                                const displayAmount = Math.abs(tx.amount || 0);
                                return (
                                    <div key={tx._id} className="flex items-center justify-between px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                                                <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                                                    {config.label}
                                                </p>
                                                <p className="text-xs text-[var(--color-on-surface-variant)] max-w-xs">
                                                    {tx.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-semibold ${isInflow ? "text-emerald-600" : "text-red-600"}`}>
                                                {isInflow ? "+" : "−"}{displayAmount.toLocaleString()} ر.س
                                            </p>
                                            <p className="text-xs text-[var(--color-on-surface-variant)]">
                                                {new Date(tx.createdAt).toLocaleDateString("ar-SA")}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Withdrawals Tab ═══ */}
            {activeTab === "withdrawals" && (
                <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl">
                    {isWdLoading ? (
                        <div className="divide-y divide-[var(--color-outline-variant)]/20 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="px-5 py-4">
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 bg-[var(--color-surface-container-low)] rounded-lg shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="h-4 w-24 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                                    <div className="h-3 w-32 bg-[var(--color-surface-container-low)] rounded" />
                                                </div>
                                                <div>
                                                    <div className="h-4 w-20 bg-[var(--color-surface-container-low)] rounded mb-1" />
                                                    <div className="h-5 w-24 bg-[var(--color-surface-container-low)] rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className="text-center py-16">
                            <Banknote className="w-10 h-10 text-[var(--color-on-surface-variant)]/30 mx-auto mb-3" strokeWidth={1} />
                            <p className="text-sm text-[var(--color-on-surface-variant)]">لا توجد طلبات سحب بعد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-outline-variant)]/20">
                            {withdrawals.map((wd) => {
                                const config = WITHDRAWAL_STATUS[wd.status] || WITHDRAWAL_STATUS.PENDING;
                                const StatusIcon = config.icon;
                                const detail = getWithdrawalDetail(wd);

                                return (
                                    <div key={wd._id} className="px-5 py-4">
                                        <div className="flex gap-3">
                                            {/* ─── أيقونة الحالة ─── */}
                                            <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                                <StatusIcon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
                                            </div>

                                            {/* ─── المحتوى (نص + تفاصيل) ─── */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-[var(--color-on-surface)]">طلب سحب</p>
                                                        <p className="text-xs text-[var(--color-on-surface-variant)]">
                                                            {new Date(wd.createdAt).toLocaleDateString("ar-SA", {
                                                                year: "numeric", month: "long", day: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-left shrink-0">
                                                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                                                            {(wd.amount || 0).toLocaleString()} ر.س
                                                        </p>
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ─── تفاصيل حسب الحالة ─── */}
                                                {detail && (
                                                    <div className={`mt-2.5 flex items-start gap-2 rounded-lg border px-3 py-2 ${detail.cls}`}>
                                                        <detail.icon className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] uppercase tracking-wide opacity-70">{detail.label}</p>
                                                            <p className="text-xs font-semibold break-all">{detail.value}</p>
                                                            {detail.extra && (
                                                                <p className="text-[11px] opacity-80 mt-0.5">{detail.extra}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Withdraw Modal ═══ */}
            {showWithdrawModal && (
                <WithdrawModal
                    available={wallet?.balance?.available || 0}
                    onClose={() => setShowWithdrawModal(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 
// ═══════════════════════════════════════════════════
function getWithdrawalDetail(wd) {
    const fmt = (d) =>
        new Date(d).toLocaleDateString("ar-SA", {
            year: "numeric", month: "long", day: "numeric",
        });

    switch (wd.status) {
        case "PAID":
            return {
                icon: Receipt,
                label: "رقم العملية البنكية",
                value: wd.transferReference || "—",
                extra: wd.paidAt ? `تم التحويل في ${fmt(wd.paidAt)}` : null,
                cls: "text-emerald-700 bg-emerald-50/70 border-emerald-100",
            };
        case "APPROVED":
            return {
                icon: Clock,
                label: "الحالة",
                value: "تمت الموافقة — في انتظار التحويل البنكي",
                cls: "text-blue-700 bg-blue-50/70 border-blue-100",
            };
        case "REJECTED":
            return {
                icon: AlertCircle,
                label: "سبب الرفض",
                value: wd.rejectionReason || "—",
                cls: "text-red-700 bg-red-50/70 border-red-100",
            };
        default:
            return null; // PENDING — الـ badge كافي
    }
}

// ═══════════════════════════════════════════════════
// Withdraw Modal
// ═══════════════════════════════════════════════════
function WithdrawModal({ available, onClose }) {
    const [amount, setAmount] = useState("");
    const requestWithdrawal = useRequestWithdrawal();

    const handleSubmit = (e) => {
        e.preventDefault();
        const value = Number(amount);

        if (!value || value <= 0) {
            return;
        }
        if (value > available) {
            return;
        }

        requestWithdrawal.mutate(
            { amount: value },
            {
                onSuccess: () => {
                    onClose();
                },
            },
        );
    };

    const value = Number(amount) || 0;
    const isInvalid = value <= 0 || value > available;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display text-lg font-bold text-[var(--color-on-surface)]">سحب الأرباح</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Available balance */}
                    <div className="bg-[var(--color-surface-container-low)] rounded-lg p-4 flex items-center justify-between">
                        <span className="text-sm text-[var(--color-on-surface-variant)]">الرصيد المتاح</span>
                        <span className="font-display font-bold text-[var(--color-primary)]">
                            {available.toLocaleString()} ر.س
                        </span>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                            المبلغ المراد سحبه <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="1"
                            min="1"
                            max={available}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-3 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors text-sm rounded-lg"
                        />
                        {value > available && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                المبلغ أكبر من الرصيد المتاح
                            </p>
                        )}
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-2">
                        {[25, 50, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => setAmount(((available * pct) / 100).toFixed(2))}
                                className="flex-1 py-2 rounded-lg border border-[var(--color-outline-variant)]/50 text-xs font-medium text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                {pct === 100 ? "الكل" : `${pct}%`}
                            </button>
                        ))}
                    </div>

                    {/* Note */}
                    <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-3">
                        💡 سيتم تحويل المبلغ إلى حسابك البنكي المسجل خلال 3-5 أيام عمل بعد مراجعة الطلب.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={requestWithdrawal.isPending}>
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={requestWithdrawal.isPending}
                            disabled={isInvalid || requestWithdrawal.isPending}
                        >
                            تأكيد السحب
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}