import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Package,
    Printer,
    Truck,
    Wallet,
    RefreshCw,
    ExternalLink,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { dashboardService } from "../services/dashboard.service";
import Button from "../../../components/Ui/Button";
import { getMediaUrl } from "../../../utils/media";

// ═══════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════
const STATUS_TABS = [
    { value: "all", label: "الكل" },
    { value: "PAID", label: "بانتظار الشحن" },
    { value: "PROCESSING", label: "جاري التجهيز" },
    { value: "SHIPPED", label: "تم الشحن" },
    { value: "DELIVERED", label: "تم التوصيل" },
    { value: "COMPLETED", label: "مكتمل" },
];

const STATUS_META = {
    PENDING_PAYMENT: { label: "بانتظار الدفع", cls: "bg-amber-500/10 text-amber-600" },
    PAID: { label: "بانتظار الشحن", cls: "bg-secondary/10 text-secondary" },
    PROCESSING: { label: "جاري التجهيز", cls: "bg-blue-500/10 text-blue-600" },
    SHIPPED: { label: "تم الشحن", cls: "bg-purple-500/10 text-purple-600" },
    DELIVERED: { label: "تم التوصيل", cls: "bg-teal-500/10 text-teal-600" },
    COMPLETED: { label: "مكتمل", cls: "bg-green-500/10 text-green-600" },
    CANCELLED: { label: "ملغي", cls: "bg-red-500/10 text-red-600" },
    REFUNDED: { label: "مسترد", cls: "bg-red-500/10 text-red-600" },
};

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function ArtistOrdersPage() {
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["artistSales", status, page],
        queryFn: () => dashboardService.getMySales({ status, page, limit: 10 }),
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination || { total: 0, pages: 0 };

    return (
        <div className="min-h-screen bg-surface py-8">
            <div className="max-w-[1100px] mx-auto px-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="font-display text-2xl text-on-surface">مبيعاتي</h1>
                    <span className="text-sm text-on-surface-variant">
                        {pagination.total} طلب
                    </span>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setStatus(tab.value);
                                setPage(1);
                            }}
                            className={`px-4 py-2 text-sm font-body border transition-premium ${status === tab.value
                                    ? "bg-primary text-white border-primary"
                                    : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-secondary"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <LoadingList />
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center">
                        <Package className="w-10 h-10 mx-auto mb-3 text-on-surface-variant" strokeWidth={1.5} />
                        <p className="text-sm text-on-surface-variant">لا توجد طلبات في هذه الحالة</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <OrderCard key={order._id} order={order} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-3 pt-8">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            السابق
                        </Button>
                        <span className="text-sm self-center text-on-surface-variant">
                            {page} / {pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pagination.pages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            التالي
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Order Card
// ═══════════════════════════════════════════════════
function OrderCard({ order }) {
    const meta = STATUS_META[order.status] || {
        label: order.status,
        cls: "bg-surface-container text-on-surface-variant",
    };
    console.log("order", order);

    return (
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5">
            {order.status === "CANCELLED" && order.cancellationReason && (
                <div className="mb-2 flex items-start text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                    <AlertCircle className="w-3.5 h-3.5 ml-1 mt-0.5 shrink-0 flex" />
                    <div>
                        <p className="text-on-surface-variant">
                            <span className="font-semibold text-red-600">سبب الإلغاء: </span>
                            {order.cancellationReason}
                        </p>
                    </div>
                </div>
            )}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Items */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex -space-x-2">
                        {order.items?.slice(0, 3).map((item, i) => (
                            <img
                                key={i}
                                src={getMediaUrl(item.coverImage)}
                                alt={item.title}
                                className="w-12 h-12 object-cover border-2 border-surface-container-lowest"
                            />
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-on-surface">
                            {order.items?.[0]?.title}
                            {order.items?.length > 1 && ` +${order.items.length - 1} أخرى`}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            المشتري: {order.buyer?.name} • {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                    </div>
                </div>

                {/* Amounts */}
                <div className="text-sm">
                    <p className="text-on-surface font-semibold">
                        {order.totalAmount?.toLocaleString()} ر.س
                    </p>
                    <p className="text-xs text-on-surface-variant">
                        ربحك: {order.artistEarning?.toLocaleString()} ر.س
                    </p>
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 text-xs font-semibold ${meta.cls}`}>
                    {meta.label}
                </span>

                {/* Actions */}
                <OrderActions order={order} />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Actions per status
// ═══════════════════════════════════════════════════
function OrderActions({ order }) {
    const queryClient = useQueryClient();
    const [error, setError] = useState("");
    const [isShipping, setIsShipping] = useState(false);

    const createShipment = useMutation({
        mutationFn: () => dashboardService.createShipment({ orderId: order._id }),
        onMutate: () => {
            setError("");
            setIsShipping(true);
        },
        onSuccess: () => {
            // حدّث القائمة فوراً (عشان الحالة تتحول PROCESSING)
            queryClient.invalidateQueries({ queryKey: ["artistSales"] });
            // وحدّثها تاني بعد 8 ثواني (عشان الـ webhook يكون جاب التتبع والبوليصة)
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["artistSales"] });
                setIsShipping(false);
            }, 8000);
        },
        onError: (err) => {
            const isTimeout =
                err.code === "ECONNABORTED" || err.message?.includes("timeout");
            const msg = isTimeout
                ? "العملية بتاخد وقت أطول من المعتاد. حدّث الصفحة بعد شوية — الشحنة غالباً اتعملت."
                : err.response?.data?.message || err.message || "تعذر إنشاء الشحنة";
            setError(msg);
            setIsShipping(false);
        },
    });

    const refetch = () => queryClient.invalidateQueries({ queryKey: ["artistSales"] });

    return (
        <>
            {/* ═══ Full-page Overlay ═══ */}
            {isShipping && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-8 max-w-sm w-[90%] text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <Truck className="w-7 h-7 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <h3 className="font-display text-lg text-on-surface mb-2">
                            جاري إنشاء الشحنة
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            العملية بتاخد ثواني قليلة...<br />
                            <span className="text-xs">لا تغلق الصفحة من فضلك</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-end gap-1 min-w-[180px]">
                <div className="flex gap-2 flex-wrap justify-end">
                    {/* ✅ PAID → إنشاء شحنة */}
                    {order.status === "PAID" && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => createShipment.mutate()}
                            disabled={createShipment.isPending || isShipping}
                            icon={Truck}
                        >
                            {createShipment.isPending ? "جاري الإنشاء..." : "إنشاء شحنة"}
                        </Button>
                    )}

                    {/* ✅ PROCESSING → بوليصة + تتبع */}
                    {order.status === "PROCESSING" && (
                        <>
                            {order.shipping?.awbUrl ? (
                                <Button
                                    className="flex "
                                    variant="primary"
                                    size="sm"
                                    onClick={() => window.open(order.shipping.awbUrl, "_blank")}
                                    icon={Printer}
                                >
                                    طباعة البوليصة
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={refetch} icon={RefreshCw}>
                                    تحديث
                                </Button>
                            )}
                            {order.shipping?.trackingUrl && (
                                <a
                                    href={order.shipping.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-secondary flex items-center gap-1 hover:underline"
                                >
                                    <ExternalLink className="w-3 h-3" /> تتبع
                                </a>
                            )}
                        </>
                    )}

                    {/* ✅ SHIPPED → تتبع */}
                    {order.status === "SHIPPED" && order.shipping?.trackingUrl && (
                        <a
                            href={order.shipping.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-secondary flex items-center gap-1 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" /> تتبع الشحنة
                        </a>
                    )}

                    {/* ✅ DELIVERED → انتظار الأموال */}
                    {order.status === "DELIVERED" && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" /> الأموال تتاح بعد مهلة الاستلام
                        </span>
                    )}

                    {/* ✅ COMPLETED */}
                    {order.status === "COMPLETED" && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" /> تمت إضافة الربح لمحفظتك
                        </span>
                    )}
                </div>

                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

                {/* {order.shipping?.trackingNumber && (
                    <p className="text-[10px] text-on-surface-variant">
                        رقم التتبع: {order.shipping.trackingNumber}
                    </p>
                )} */}
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════
function LoadingList() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-surface-container animate-pulse" />
            ))}
        </div>
    );
}