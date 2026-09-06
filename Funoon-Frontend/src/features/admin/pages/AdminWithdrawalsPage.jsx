import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet, Clock, CheckCircle2, Banknote, XCircle, X,
    Landmark, Loader2, ArrowLeftRight,
} from "lucide-react";
import { adminService } from "../services/admin.service";

const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const STATUS_META = {
    PENDING: { label: "معلق", color: "#f59e0b", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    APPROVED: { label: "معتمد — بانتظار التحويل", color: "#3b82f6", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    PAID: { label: "تم التحويل", color: "#10b981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "مرفوض", color: "#ef4444", bg: "bg-red-50 text-red-700 border-red-200" },
};

const TABS = [
    { value: "all", label: "الكل" },
    { value: "PENDING", label: "معلق" },
    { value: "APPROVED", label: "معتمد" },
    { value: "PAID", label: "تم التحويل" },
    { value: "REJECTED", label: "مرفوض" },
];

// ═══ عرض الحساب البنكي ═══
function BankInfo({ bank }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (text, label = "IBAN") => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(`تم نسخ ${label} ✅`);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("فشل النسخ");
        }
    };

    if (!bank) return <span className="text-on-surface-variant/50 text-xs">لا يوجد حساب مسجل</span>;

    const name = bank.bankName || bank.bank || "";
    const iban = bank.iban || bank.accountNumber || "";
    const holder = bank.holderName || bank.accountHolderName || "";

    return (
        <div className="text-xs space-y-1">
            <p className="text-on-surface font-medium">
                {name || "بنك"} {holder && `· ${holder}`}
            </p>

            {/* IBAN + Copy Button */}
            {iban && (
                <div className="flex items-center gap-1.5 group">
                    <span className="font-mono text-on-surface-variant" dir="ltr">
                        {iban}
                    </span>
                    <button
                        onClick={() => handleCopy(iban, "IBAN")}
                        title={copied ? "تم النسخ" : "نسخ IBAN"}
                        className={`p-1 rounded transition-all shrink-0 ${copied
                                ? "text-emerald-600"
                                : "text-on-surface-variant/50 hover:text-primary hover:bg-primary/5"
                            }`}
                    >
                        {copied ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {bank.isVerified === false && (
                <span className="text-[10px] text-amber-600 font-semibold">⚠️ غير موثق</span>
            )}
        </div>
    );
}

// ═══ Main Page ═══
export default function AdminWithdrawalsPage() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [paidTarget, setPaidTarget] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);

    const { data } = useQuery({
        queryKey: ["adminWithdrawalsSummary"],
        queryFn: () => adminService.getWithdrawalsSummary(),
    });

    const { data: listData, isLoading } = useQuery({
        queryKey: ["adminWithdrawals", status, page],
        queryFn: () => adminService.getWithdrawals({ status, page, limit: 15 }),
    });

    // ✅ Approve Mutation — بعد الموافقة من الـ modal
    const approveMutation = useMutation({
        mutationFn: (id) => adminService.approveWithdrawal(id),
        onSuccess: () => {
            toast.success("✅ تمت الموافقة — حوّل من البنك ثم سجّل رقم العملية");
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawalsSummary"] });
            setApproveTarget(null);
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    const s = data || {};
    const withdrawals = listData?.withdrawals || [];
    const pagination = listData?.pagination || { total: 0, pages: 0 };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h2 className="font-display text-2xl text-on-surface">طلبات السحب</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                    سير العمل: الفنان يطلب → توافق → تحوّل من البنك → تسجّل رقم العملية
                </p>
            </div>

            {/* ═══ Summary Cards ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Clock} label="بانتظار الموافقة" count={s.pending?.count} amount={s.pending?.amount} accent="text-amber-600 bg-amber-50" />
                <SummaryCard icon={ArrowLeftRight} label="موافق عليه — حوّله من البنك" count={s.approved?.count} amount={s.approved?.amount} accent="text-blue-600 bg-blue-50" />
                <SummaryCard icon={CheckCircle2} label="تم تحويله (الشهر)" count={s.paidThisMonth?.count} amount={s.paidThisMonth?.amount} accent="text-emerald-600 bg-emerald-50" />
                <SummaryCard icon={XCircle} label="مرفوض (إجمالي)" count={s.rejected?.count} amount={s.rejected?.amount} accent="text-red-600 bg-red-50" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
                {TABS.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => { setStatus(t.value); setPage(1); }}
                        className={`px-4 py-1.5 text-xs font-body font-semibold border transition-premium ${status === t.value
                                ? "bg-primary text-white border-primary"
                                : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:border-primary"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ Table ═══ */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-low/50">
                            <th className="p-3">الفنان</th>
                            <th className="p-3">المبلغ</th>
                            <th className="p-3">الحساب البنكي</th>
                            <th className="p-3">تاريخ الطلب</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">جاري التحميل...</td></tr>
                        )}
                        {!isLoading && withdrawals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <Wallet className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                                    <p className="text-sm text-on-surface-variant">لا توجد طلبات سحب في هذه الحالة</p>
                                </td>
                            </tr>
                        )}
                        {withdrawals.map((w) => (
                            <tr key={w._id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/30">
                                <td className="p-3">
                                    <p className="text-on-surface font-medium">{w.user?.name}</p>
                                    <p className="text-xs text-on-surface-variant">{w.user?.email}</p>
                                </td>
                                <td className="p-3 font-display text-base font-semibold text-on-surface">
                                    {fmt(w.amount)} <span className="text-xs font-body text-on-surface-variant">ر.س</span>
                                </td>
                                <td className="p-3"><BankInfo bank={w.bankAccount} /></td>
                                <td className="p-3 text-xs text-on-surface-variant">
                                    {new Date(w.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="p-3">
                                    <span className={`inline-block px-2 py-1 text-[10px] font-semibold border ${STATUS_META[w.status]?.bg}`}>
                                        {STATUS_META[w.status]?.label}
                                    </span>
                                    {w.status === "PAID" && (
                                        <>
                                            {w.transferReference && (
                                                <p className="text-[10px] text-on-surface-variant mt-1 font-mono" dir="ltr">
                                                    REF: {w.transferReference}
                                                </p>
                                            )}
                                            {w.paidAt && (
                                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                                    اتحوّل: {new Date(w.paidAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {w.status === "APPROVED" && w.approvedAt && (
                                        <p className="text-[10px] text-blue-600 mt-1">
                                            ووفق عليه: {new Date(w.approvedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                                        </p>
                                    )}
                                    {w.status === "REJECTED" && w.rejectionReason && (
                                        <p className="text-[10px] text-red-600 mt-1 max-w-[160px] truncate" title={w.rejectionReason}>
                                            {w.rejectionReason}
                                        </p>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {w.status === "PENDING" && (
                                            <>
                                                <ApproveButton withdrawal={w} onConfirm={setApproveTarget} />
                                                <button
                                                    onClick={() => setRejectTarget(w)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-premium"
                                                >
                                                    رفض
                                                </button>
                                            </>
                                        )}
                                        {w.status === "APPROVED" && (
                                            <button
                                                onClick={() => setPaidTarget(w)}
                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-premium"
                                            >
                                                تسجيل التحويل
                                            </button>
                                        )}
                                        {(w.status === "PAID" || w.status === "REJECTED") && (
                                            <span className="text-on-surface-variant/40 text-xs">—</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-3">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">السابق</button>
                    <span className="text-sm self-center text-on-surface-variant">{page} / {pagination.pages}</span>
                    <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">التالي</button>
                </div>
            )}

            <ApproveConfirmModal
                open={!!approveTarget}
                withdrawal={approveTarget}
                isLoading={approveMutation.isPending}
                onConfirm={() => approveMutation.mutate(approveTarget._id)}
                onClose={() => setApproveTarget(null)}
            />
            <RejectModal withdrawal={rejectTarget} onClose={() => setRejectTarget(null)} />
            <MarkPaidModal withdrawal={paidTarget} onClose={() => setPaidTarget(null)} />
        </div>
    );
}

// ═══ Summary Card ═══
function SummaryCard({ icon: Icon, label, count, amount, accent }) {
    return (
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
                    <p className="font-display text-xl text-on-surface leading-tight">
                        {count ?? 0} <span className="text-xs font-body text-on-surface-variant">طلب</span>
                    </p>
                    <p className="text-xs font-semibold text-on-surface">{fmt(amount ?? 0)} ر.س</p>
                </div>
            </div>
        </div>
    );
}

// ═══ Approve Button (يبسّط modal بس) ═══
function ApproveButton({ withdrawal, onConfirm }) {
    return (
        <button
            onClick={() => onConfirm(withdrawal)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:opacity-90 transition-premium"
        >
            موافقة
        </button>
    );
}

// ═══ Confirm Modal (عام — نستخدمه في أي مكان) ═══
function ConfirmModal({ open, title, icon: Icon, iconColor, description, children, confirmLabel, confirmVariant = "primary", isLoading, onConfirm, onClose }) {
    const variants = {
        primary: "bg-primary hover:opacity-90",
        danger: "bg-red-600 hover:bg-red-700",
        success: "bg-emerald-600 hover:bg-emerald-700",
    };
    return (
        <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button className="text-on-surface-variant hover:text-primary">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                    {description && <p className="text-sm text-on-surface-variant mb-4">{description}</p>}
                                    {children}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={onClose}
                                            disabled={isLoading}
                                            className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-low transition-premium disabled:opacity-40"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={onConfirm}
                                            disabled={isLoading}
                                            className={`flex-1 py-2.5 text-sm font-semibold text-white transition-premium disabled:opacity-50 ${variants[confirmVariant]}`}
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}

// ═══ Approve Confirm Modal (يستخدم ConfirmModal) ═══
function ApproveConfirmModal({ open, withdrawal, isLoading, onConfirm, onClose }) {
    return (
        <ConfirmModal
            open={open}
            onClose={onClose}
            title="موافقة على طلب السحب"
            icon={CheckCircle2}
            iconColor="text-primary"
            confirmLabel="تأكيد الموافقة"
            confirmVariant="primary"
            isLoading={isLoading}
            onConfirm={onConfirm}
        >
            {withdrawal && (
                <>
                    <div className="bg-surface-container-low p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">الفنان</span>
                            <span className="font-semibold text-on-surface">{withdrawal.user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">المبلغ</span>
                            <span className="font-display font-semibold text-primary">{fmt(withdrawal.amount)} ر.س</span>
                        </div>
                        <div className="border-t border-outline-variant/20 pt-2">
                            <p className="text-xs text-on-surface-variant mb-1">حوّل على:</p>
                            <BankInfo bank={withdrawal.bankAccount} />
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-2.5 mt-3 text-xs text-blue-800">
                        📋 بعد الموافقة، حوّل المبلغ من بنك المنصة لحساب الفنان، ثم اضغط "تسجيل التحويل" لإدخال رقم العملية.
                    </div>
                </>
            )}
        </ConfirmModal>
    );
}

// ═══ Reject Modal ═══
function RejectModal({ withdrawal, onClose }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");

    const reject = useMutation({
        mutationFn: () => adminService.rejectWithdrawal(withdrawal._id, reason),
        onSuccess: () => {
            toast.success("تم الرفض وإرجاع المبلغ لمحفظة الفنان");
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawalsSummary"] });
            setReason("");
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!withdrawal} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {withdrawal && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" /> رفض طلب السحب
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button className="text-on-surface-variant hover:text-primary">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    <p className="text-sm text-on-surface-variant mb-3">
                                        {withdrawal.user?.name} · <strong className="text-on-surface">{fmt(withdrawal.amount)} ر.س</strong>
                                    </p>

                                    <label className="text-xs font-semibold text-on-surface-variant block mb-1">سبب الرفض * (هيظهر للفنان)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثال: بيانات الحساب البنكي غير مطابقة لاسم الفنان..."
                                        rows={3}
                                        className="w-full p-3 text-sm bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none resize-none"
                                    />

                                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 mt-3 text-xs text-emerald-800">
                                        💡 المبلغ هيرجع تلقائياً لرصيد الفنان المتاح في نفس اللحظة.
                                    </div>

                                    <button
                                        onClick={() => reject.mutate()}
                                        disabled={!reason.trim() || reject.isPending}
                                        className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold"
                                    >
                                        {reject.isPending ? "جاري الرفض..." : "رفض وإرجاع المبلغ"}
                                    </button>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}

// ═══ Mark Paid Modal ═══
function MarkPaidModal({ withdrawal, onClose }) {
    const queryClient = useQueryClient();
    const [ref, setRef] = useState("");

    const markPaid = useMutation({
        mutationFn: () => adminService.markWithdrawalPaid(withdrawal._id, ref),
        onSuccess: () => {
            toast.success("تم تسجيل التحويل بنجاح ✅");
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
            queryClient.invalidateQueries({ queryKey: ["adminWithdrawalsSummary"] });
            setRef("");
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!withdrawal} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {withdrawal && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-emerald-600" /> تسجيل التحويل البنكي
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button className="text-on-surface-variant hover:text-primary">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    {/* ملخص العملية */}
                                    <div className="bg-surface-container-low p-4 mb-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-on-surface-variant">الفنان</span>
                                            <span className="font-semibold text-on-surface">{withdrawal.user?.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-on-surface-variant">المبلغ المحوّل</span>
                                            <span className="font-display font-semibold text-emerald-600">{fmt(withdrawal.amount)} ر.س</span>
                                        </div>
                                        <div className="border-t border-outline-variant/20 pt-2">
                                            <p className="text-xs text-on-surface-variant mb-1">حوّل على:</p>
                                            <BankInfo bank={withdrawal.bankAccount} />
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 p-2.5 mb-3 text-xs text-amber-800">
                                        ⚠️ سجّل رقم العملية <strong>بعد</strong> ما تحوّل فعلاً من البنك — ده إثباتك للمراجعة.
                                    </div>

                                    <label className="text-xs font-semibold text-on-surface-variant block mb-1">رقم العملية البنكية *</label>
                                    <input
                                        value={ref}
                                        onChange={(e) => setRef(e.target.value)}
                                        placeholder="مثال: TRX-2026-00123"
                                        className="w-full p-3 text-sm font-mono bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none"
                                    />

                                    <button
                                        onClick={() => markPaid.mutate()}
                                        disabled={!ref.trim() || markPaid.isPending}
                                        className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold"
                                    >
                                        {markPaid.isPending ? "جاري التسجيل..." : "تأكيد التحويل"}
                                    </button>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}