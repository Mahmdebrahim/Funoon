import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, X, Eye, Calendar, ArrowLeft } from "lucide-react";
import { adminService } from "../services/admin.service";

const ACTION_META = {
    BAN_USER: { label: "حظر مستخدم", cls: "bg-red-50 text-red-700 border-red-200", icon: "🔒" },
    UNBAN_USER: { label: "فك حظر", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🔓" },
    APPROVE_WITHDRAWAL: { label: "موافقة سحب", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: "✅" },
    REJECT_WITHDRAWAL: { label: "رفض سحب", cls: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
    MARK_WITHDRAWAL_PAID: { label: "تسجيل تحويل", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "💰" },
    VERIFY_BANK: { label: "توثيق بنك", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🏦" },
    REJECT_BANK: { label: "رفض بنك", cls: "bg-red-50 text-red-700 border-red-200", icon: "🏦" },
    HOLD_ORDER: { label: "تجميد طلب", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "❄️" },
    UNHOLD_ORDER: { label: "فك تجميد", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔓" },
    RELEASE_FUNDS: { label: "إطلاق فلوس", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "💸" },
};

const CATEGORY_TABS = [
    { value: "all", label: "الكل" },
    { value: "ban", label: "🔒 الحظر" },
    { value: "withdrawals", label: "💰 السحوبات" },
    { value: "banks", label: "🏦 البنوك" },
    { value: "orders", label: "📦 الطلبات" },
];

export default function AdminAuditLogsPage() {
    const [category, setCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ["auditLogs", category, debouncedSearch, from, to, page],
        queryFn: () => adminService.getAuditLogs({ category, search: debouncedSearch, from, to, page, limit: 20 }),
    });

    const logs = data?.logs || [];
    console.log(logs)
    const pagination = data?.pagination || { total: 0, pages: 0 };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-display text-2xl text-on-surface flex items-center gap-2">
                    <ScrollText className="w-6 h-6 text-secondary" /> سجل العمليات
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                    توثيق كامل لكل عملية حساسة: مين عملها، إمتى، على مين، وليه
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 flex-wrap">
                    {CATEGORY_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => { setCategory(t.value); setPage(1); }}
                            className={`px-4 py-2.5 text-center text-xs font-body font-semibold border transition-premium ${category === t.value
                                    ? "bg-primary text-white border-primary"
                                    : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:border-primary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-on-surface-variant" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث باسم الأدمن..."
                        className="pr-9 pl-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:outline-none w-44"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar className="w-4 h-4" />
                    <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                        className="px-2 py-2 text-xs bg-surface-container-lowest border border-outline-variant/40 focus:outline-none" />
                    <span><ArrowLeft/></span>
                    <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
                        className="px-2 py-2 text-xs bg-surface-container-lowest border border-outline-variant/40 focus:outline-none" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-low/50">
                            <th className="p-3">الوقت</th>
                            <th className="p-3">الأدمن</th>
                            <th className="p-3">العملية</th>
                            <th className="p-3">الهدف</th>
                            <th className="p-3">عرض</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">جاري التحميل...</td></tr>
                        )}
                        {!isLoading && logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <ScrollText className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                                    <p className="text-sm text-on-surface-variant">لا توجد عمليات مسجلة</p>
                                </td>
                            </tr>
                        )}
                        {logs.map((log) => {
                            const meta = ACTION_META[log.action] || { label: log.action, cls: "bg-stone-100 text-stone-700 border-stone-300", icon: "📝" };
                            return (
                                <tr key={log._id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/30">
                                    <td className="p-3 text-xs text-on-surface-variant whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString("ar-EG", {
                                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="p-3">
                                        <p className="text-on-surface font-medium text-xs">{log.admin?.name || "—"}</p>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border ${meta.cls}`}>
                                            {meta.icon} {meta.label}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-on-surface-variant">{log.targetLabel}</td>
                                    <td className="p-3">
                                        <button onClick={() => setSelected(log)} title="التفاصيل"
                                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div className="flex justify-center gap-3">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">السابق</button>
                    <span className="text-sm self-center text-on-surface-variant">{page} / {pagination.pages}</span>
                    <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">التالي</button>
                </div>
            )}

            <DetailsModal log={selected} onClose={() => setSelected(null)} />
        </div>
    );
}

// ═══ Details Modal ═══
function DetailsModal({ log, onClose }) {
    const meta = log ? (ACTION_META[log.action] || { label: log.action, cls: "bg-stone-100 text-stone-700 border-stone-300", icon: "📝" }) : null;

    return (
        <Dialog.Root open={!!log} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {log && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            {meta.icon} تفاصيل العملية
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-on-surface-variant">العملية</span>
                                            <span className={`px-2 py-0.5 text-[10px] font-semibold border ${meta.cls}`}>{meta.label}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-on-surface-variant">الأدمن</span>
                                            <span className="font-semibold text-on-surface">{log.admin?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-on-surface-variant">الهدف</span>
                                            <span className="text-on-surface">{log.targetLabel}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-on-surface-variant">الوقت</span>
                                            <span className="text-on-surface">{new Date(log.createdAt).toLocaleString("ar-EG")}</span>
                                        </div>
                                        {log.ip && (
                                            <div className="flex justify-between">
                                                <span className="text-on-surface-variant">IP</span>
                                                <span className="font-mono text-xs text-on-surface-variant" dir="ltr">{log.ip}</span>
                                            </div>
                                        )}

                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="bg-surface-container-low p-3 mt-2">
                                                <p className="text-xs font-semibold text-on-surface-variant mb-2">التفاصيل:</p>
                                                <div className="space-y-1.5">
                                                    {Object.entries(log.details).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between text-xs">
                                                            <span className="text-on-surface-variant">{key}</span>
                                                            <span className="text-on-surface font-medium text-left" dir="auto">
                                                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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