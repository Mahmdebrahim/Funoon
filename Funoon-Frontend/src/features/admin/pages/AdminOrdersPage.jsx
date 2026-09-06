import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Snowflake, Unlock, Eye, X, MapPin, Banknote, Loader2, Zap,
} from "lucide-react";
import { adminService } from "../services/admin.service";

const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const STATUS_META = {
    PENDING_PAYMENT: { label: "بانتظار الدفع", color: "#f59e0b" },
    PAID: { label: "مدفوع", color: "#3b82f6" },
    PROCESSING: { label: "قيد التجهيز", color: "#f97316" },
    SHIPPED: { label: "تم الشحن", color: "#8b5cf6" },
    DELIVERED: { label: "تم التوصيل", color: "#10b981" },
    COMPLETED: { label: "مكتمل", color: "#059669" },
    CANCELLED: { label: "ملغي", color: "#ef4444" },
    REFUNDED: { label: "مسترد", color: "#dc2626" },
};

const STATUS_TABS = [
    { value: "all", label: "الكل" },
    { value: "PAID", label: "مدفوع" },
    { value: "PROCESSING", label: "تجهيز" },
    { value: "SHIPPED", label: "مشحون" },
    { value: "DELIVERED", label: "مُوصّل" },
    { value: "COMPLETED", label: "مكتمل" },
    { value: "CANCELLED", label: "ملغي" },
];

// ✅ منطق "حالة الأموال" الصحيح
function getFundsStatus(o) {
    if (o.fundsReleased)
        return { label: "أُطلقت للفنان ✅", cls: "text-emerald-600" };
    if (o.status === "CANCELLED" || o.status === "REFUNDED")
        return { label: "لا توجد — ملغي/مسترد", cls: "text-on-surface-variant" };
    if (o.status === "PENDING_PAYMENT")
        return { label: "لم يُدفع بعد", cls: "text-amber-600" };
    if (o.onHold)
        return { label: "مجمّدة — مراجعة دعم", cls: "text-red-600" };
    return { label: "معلقة — ضمان 72ساعة", cls: "text-amber-600" };
}

export default function AdminOrdersPage() {
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [holdOnly, setHoldOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [holdTarget, setHoldTarget] = useState(null);

    // ✅ Debounce: البحث بعد 450ms من آخر حرف
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 450);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ["adminOrders", status, debouncedSearch, holdOnly, page],
        queryFn: () =>
            adminService.getOrders({
                status,
                search: debouncedSearch,
                hold: holdOnly,
                page,
                limit: 15,
            }),
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { total: 0, pages: 0 };

    return (
        <div className="space-y-5">
            {/* Header + Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-2xl text-on-surface">إدارة الطلبات</h2>
                    <p className="text-sm text-on-surface-variant mt-1">{pagination.total} طلب</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-on-surface-variant" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث بالـ ID أو الاسم..."
                            className="pr-9 pl-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:outline-none w-56"
                        />
                        {search && search !== debouncedSearch && (
                            <Loader2 className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 left-3 text-on-surface-variant animate-spin" />
                        )}
                    </div>
                    <button
                        onClick={() => { setHoldOnly((v) => !v); setPage(1); }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border transition-premium ${holdOnly
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:border-red-400"
                            }`}
                    >
                        <Snowflake className="w-3.5 h-3.5" />
                        المجمّدة
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 flex-wrap">
                {STATUS_TABS.map((t) => (
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

            {/* Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-low/50">
                            <th className="p-3">الطلب</th>
                            <th className="p-3">المشتري</th>
                            <th className="p-3">الفنان</th>
                            <th className="p-3">المبلغ</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">الأموال</th>
                            <th className="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">جاري التحميل...</td></tr>
                        )}
                        {!isLoading && orders.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">لا توجد طلبات مطابقة</td></tr>
                        )}
                        {orders.map((o) => {
                            const fs = getFundsStatus(o);
                            const canHold = o.status === "DELIVERED" && !o.fundsReleased && !o.onHold;
                            const canRelease = o.onHold && !o.fundsReleased;
                            return (
                                <tr key={o._id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/30">
                                    <td className="p-3 font-mono text-xs text-on-surface-variant">#{o._id.slice(-6).toUpperCase()}</td>
                                    <td className="p-3 text-on-surface">{o.buyer?.name}</td>
                                    <td className="p-3 text-on-surface-variant">{o.artist?.name}</td>
                                    <td className="p-3 font-semibold text-on-surface">{fmt(o.financials?.totalAmount)}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: STATUS_META[o.status]?.color }}>
                                            {STATUS_META[o.status]?.label}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-semibold ${fs.cls}`}>{fs.label}</span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setSelected(o)} title="التفاصيل" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5">
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {canRelease ? (
                                                <>
                                                    <UnholdButton order={o} />
                                                    <ReleaseButton order={o} />
                                                </>
                                            ) : (
                                                canHold && (
                                                    <button
                                                        onClick={() => setHoldTarget(o)}
                                                        title="تجميد (بلاغ/مشكلة)"
                                                        className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Snowflake className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
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

            <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />
            <HoldModal order={holdTarget} onClose={() => setHoldTarget(null)} />
        </div>
    );
}

// ═══ Unhold Button — يستأنف المسار الطبيعي ═══
function UnholdButton({ order }) {
    const queryClient = useQueryClient();
    const unhold = useMutation({
        mutationFn: () => adminService.unholdOrder(order._id),
        onSuccess: () => {
            toast.success("تم فك التجميد — رجع للمسار الطبيعي (72ساعة)");
            queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });
    return (
        <button
            onClick={() => {
                if (window.confirm("فك التجميد؟ الطلب سيرجع لمسار الإطلاق الطبيعي (خلال 72 ساعة من التوصيل).")) {
                    unhold.mutate();
                }
            }}
            title="فك التجميد (استئناف المسار الطبيعي)"
            className="p-1.5 text-on-surface-variant hover:text-blue-600 hover:bg-blue-50"
        >
            <Unlock className="w-4 h-4" />
        </button>
    );
}

// ═══ Release Button — إطلاق فوري ═══
function ReleaseButton({ order }) {
    const queryClient = useQueryClient();
    const release = useMutation({
        mutationFn: () => adminService.releaseOrder(order._id),
        onSuccess: () => {
            toast.success("تم إطلاق الأموال فوراً للفنان ✅");
            queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });
    return (
        <button
            onClick={() => {
                if (window.confirm("إطلاق الأموال فوراً للفنان؟ (سيتخطى فترة الـ 72 ساعة)")) {
                    release.mutate();
                }
            }}
            title="إطلاق فوري للأموال"
            className="p-1.5 text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50"
        >
            <Zap className="w-4 h-4" />
        </button>
    );
}

// ═══ Hold Modal ═══
function HoldModal({ order, onClose }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");

    const hold = useMutation({
        mutationFn: () => adminService.holdOrder(order._id, reason),
        onSuccess: () => {
            toast.success("تم تجميد الطلب ❄️ — لن يُطلق تلقائياً");
            queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
            setReason("");
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!order} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {order && (
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
                                            <Snowflake className="w-4 h-4 text-red-600" /> تجميد أموال الطلب
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mb-3">
                                        طلب #{order._id.slice(-6).toUpperCase()} — {order.buyer?.name} · {fmt(order.financials?.totalAmount)} ر.س
                                    </p>
                                    <label className="text-xs font-semibold text-on-surface-variant block mb-1">سبب التجميد *</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثال: بلاغ من العميل عن تلف المنتج، طلب استرداد، نزاع على الجودة..."
                                        rows={3}
                                        className="w-full p-3 text-sm bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none resize-none"
                                    />
                                    <div className="bg-amber-50 border border-amber-200 p-2.5 mt-3 text-xs text-amber-800">
                                        ⚠️ الطلب لن يُطلق تلقائياً بعد التجميد — لازم تفك التجميد أو تطلق الفلوس يدوياً.
                                    </div>
                                    <button
                                        onClick={() => hold.mutate()}
                                        disabled={!reason.trim() || hold.isPending}
                                        className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold"
                                    >
                                        {hold.isPending ? "جاري التجميد..." : "تجميد الأموال"}
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

// ═══ Details Modal ═══
function OrderDetailsModal({ order, onClose }) {
    if (!order) return null;
    const fs = getFundsStatus(order);
    return (
        <Dialog.Root open={!!order} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {order && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-outline-variant/40 shadow-2xl pointer-events-auto p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="font-display text-xl text-on-surface">
                                            طلب #{order._id.slice(-6).toUpperCase()}
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>

                                    {/* Status badges */}
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-2 py-1 text-xs font-semibold text-white" style={{ background: STATUS_META[order.status]?.color }}>
                                            {STATUS_META[order.status]?.label}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-semibold border ${fs.cls.includes("emerald") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            fs.cls.includes("red") ? "bg-red-50 text-red-700 border-red-200" :
                                                fs.cls.includes("amber") ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    "bg-surface-container-low text-on-surface-variant border-outline-variant/40"
                                            }`}>
                                            💰 {fs.label}
                                        </span>
                                    </div>

                                    {order.status === "CANCELLED" && order.cancellationReason && (
                                        <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                            <strong>سبب الإلغاء:</strong> {order.cancellationReason}
                                        </div>
                                    )}

                                    {order.onHold && order.holdReason && (
                                        <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                                            <strong>سبب التجميد:</strong> {order.holdReason}
                                        </div>
                                    )}

                                    {/* Parties */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-surface-container-low p-4">
                                            <p className="text-xs text-on-surface-variant mb-1">المشتري</p>
                                            <p className="font-semibold text-on-surface">{order.buyer?.name}</p>
                                            <p className="text-xs text-on-surface-variant">{order.buyer?.email}</p>
                                            <p className="text-xs text-on-surface-variant" dir="ltr">{order.buyer?.phone}</p>
                                        </div>
                                        <div className="bg-surface-container-low p-4">
                                            <p className="text-xs text-on-surface-variant mb-1">الفنان</p>
                                            <p className="font-semibold text-on-surface">{order.artist?.name}</p>
                                            <p className="text-xs text-on-surface-variant">{order.artist?.email}</p>
                                        </div>
                                    </div>

                                    {/* Financial breakdown */}
                                    <div className="bg-surface-container-low p-4 text-sm space-y-1.5">
                                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Banknote className="w-3.5 h-3.5" /> التوزيع المالي
                                        </p>
                                        <Row l="المجموع الفرعي" v={`${fmt(order.financials?.subtotal)} ر.س`} />
                                        <Row l="الشحن" v={`${fmt(order.financials?.shippingCost)} ر.س`} />
                                        <div className="border-t border-outline-variant/20 pt-1.5 mt-1.5">
                                            <Row l="الإجمالي" v={`${fmt(order.financials?.totalAmount)} ر.س`} bold />
                                        </div>
                                        <div className="border-t border-outline-variant/20 pt-1.5 mt-1.5 grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] text-on-surface-variant">عمولة المنصة</p>
                                                <p className="text-sm font-semibold text-secondary">{fmt(order.financials?.totalCommission)} ر.س</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-on-surface-variant">ربح الفنان</p>
                                                <p className="text-sm font-semibold text-emerald-600">{fmt(order.financials?.totalArtistEarning)} ر.س</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping */}
                                    {order.shipping?.buyerAddress && (
                                        <div className="bg-surface-container-low p-4 text-sm">
                                            <p className="text-xs text-on-surface-variant mb-2 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> عنوان التوصيل
                                            </p>
                                            <p className="text-on-surface font-semibold">{order.shipping.buyerAddress.name}</p>
                                            <p className="text-xs text-on-surface-variant">
                                                {order.shipping.buyerAddress.street}، {order.shipping.buyerAddress.district}، {order.shipping.buyerAddress.city}
                                                {order.shipping.buyerAddress.zipCode && ` ${order.shipping.buyerAddress.zipCode}`}
                                            </p>
                                            {order.shipping.trackingNumber && (
                                                <p className="text-xs text-on-surface-variant mt-2">
                                                    تتبع: <span className="font-mono">{order.shipping.trackingNumber}</span> · {order.shipping.deliveryCompanyName}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div className="bg-surface-container-low p-4 text-xs space-y-1 text-on-surface-variant">
                                        <p>تاريخ الطلب: {new Date(order.createdAt).toLocaleString("ar-SA")}</p>
                                        {order.completedAt && <p>اكتمل: {new Date(order.completedAt).toLocaleString("ar-SA")}</p>}
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

function Row({ l, v, bold }) {
    return (
        <div className="flex justify-between">
            <span className={bold ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{l}</span>
            <span className={bold ? "font-semibold text-primary" : "text-on-surface"}>{v}</span>
        </div>
    );
}