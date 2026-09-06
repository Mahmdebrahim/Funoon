import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Plus, Image as ImageIcon, Loader2, RefreshCw,
    Clock, XCircle, ShieldAlert, EyeOff, CheckCircle2
} from "lucide-react";
import { useMyArtworks, useDeleteArtwork, useToggleArtworkActive } from "../hooks/useDashboard";
import { ROUTES } from "../../../config/routes";
import Button from "../../../components/Ui/Button";
import ArtworkCard from "../components/ArtworkCard";
import DeleteArtworkModal from "../components/DeleteArtworkModal";

const TABS = [
    { value: "all", label: "الكل" },
    { value: "pending", label: "قيد المراجعة" },
    { value: "active", label: "منشورة" },
    { value: "inactive", label: "موقوفة بواسطتك" },
    { value: "rejected", label: "مرفوضة" },
    { value: "suspended", label: "موقوفة من المنصة" },
    { value: "sold", label: "مباعة" },
];

export default function ArtistArtworksPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [page, setPage] = useState(1);
    const [artworkToDelete, setArtworkToDelete] = useState(null);

    const deleteMutation = useDeleteArtwork();
    const toggleMutation = useToggleArtworkActive();

    const params = useMemo(() => {
        const p = { page, limit: 12 };
        if (activeTab === "active") p.status = "active";
        else if (activeTab === "inactive") p.status = "inactive";
        else if (activeTab === "pending") p.status = "pending";
        else if (activeTab === "rejected") p.status = "rejected";
        else if (activeTab === "suspended") p.status = "suspended";
        else if (activeTab === "sold") p.isSold = "true";
        return p;
    }, [activeTab, page]);

    const { data, isLoading, isError, refetch } = useMyArtworks(params);
    const artworks = data?.artworks || [];
    const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
    };

    // ✅ لو اللوحة مش APPROVED، الباك هيرجع رسالة واضحة تظهر كـ toast
    const handleToggle = (id) => {
        toggleMutation.mutate(id);
    };

    const handleDeleteConfirm = () => {
        if (!artworkToDelete) return;
        deleteMutation.mutate(artworkToDelete._id, {
            onSuccess: () => setArtworkToDelete(null),
        });
    };

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">لوحاتي</h1>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                        {pagination.total > 0
                            ? `إجمالي ${pagination.total} لوحة في هذا التصنيف`
                            : "أضف لوحاتك الفنية لتظهر في المعرض"}
                    </p>
                </div>
                <Link to={ROUTES.ADD_ARTWORK}>
                    <Button variant="primary" size="md" icon={Plus}>رفع لوحة جديدة</Button>
                </Link>
            </div>

            {/* ═══ Tabs ══ */}
            <div className="flex gap-1 border-b border-[var(--color-outline-variant)]/40 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`relative px-4 py-3 text-sm font-body font-medium whitespace-nowrap transition-colors ${activeTab === tab.value
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

            {/* ═══ Content ═══ */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl overflow-hidden animate-pulse">
                            <div className="aspect-[4/5] bg-[var(--color-surface-container-low)]" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 w-2/3 bg-[var(--color-surface-container-low)] rounded" />
                                <div className="h-3 w-1/2 bg-[var(--color-surface-container-low)] rounded" />
                                <div className="h-5 w-1/3 bg-[var(--color-surface-container-low)] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="text-center py-20">
                    <p className="text-[var(--color-on-surface-variant)] mb-4">تعذّر تحميل اللوحات</p>
                    <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>إعادة المحاولة</Button>
                </div>
            ) : artworks.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto bg-[var(--color-surface-container-low)] rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-[var(--color-on-surface-variant)]/40" strokeWidth={1} />
                    </div>
                    {activeTab === "all" ? (
                        <>
                            <h3 className="font-display text-lg text-[var(--color-on-surface)] mb-2">لا توجد لوحات بعد</h3>
                            <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">ابدأ برفع أول لوحة فنية لك لتظهر في المعرض</p>
                            <Link to={ROUTES.ADD_ARTWORK}>
                                <Button variant="primary" size="md" icon={Plus}>رفع لوحة جديدة</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3 className="font-display text-lg text-[var(--color-on-surface)] mb-2">لا توجد لوحات في هذا التصنيف</h3>
                            <button
                                onClick={() => handleTabChange("all")}
                                className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                            >
                                عرض كل اللوحات
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {artworks.map((artwork) => (
                            <div key={artwork._id} className="flex flex-col gap-2">
                                {/* ✅ حالة اللوحة + سبب الأدمن */}
                                <StatusNotice artwork={artwork} />
                                <ArtworkCard
                                    artwork={artwork}
                                    onToggle={handleToggle}
                                    onDelete={setArtworkToDelete}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ─── Pagination ── */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg border border-[var(--color-outline-variant)]/40 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                السابق
                            </button>
                            <span className="text-sm text-[var(--color-on-surface-variant)]">
                                صفحة {pagination.page} من {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                                className="px-4 py-2 rounded-lg border border-[var(--color-outline-variant)]/40 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ═══ Delete Modal ═══ */}
            <DeleteArtworkModal
                artwork={artworkToDelete}
                isPending={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setArtworkToDelete(null)}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════
// ✅ بانر حالة اللوحة (بيظهر فوق الكارت حسب الحالة)
// ═══════════════════════════════════════════════════
function StatusNotice({ artwork }) {
    // if (artwork.isSold) return null;

    const s = artwork.approvalStatus;

    if (s === "PENDING_APPROVAL") {
        return (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                    <strong>قيد المراجعة</strong> — ستظهر في المعرض بعد موافقة فريق المنصة.
                </span>
            </div>
        );
    }

    if (s === "REJECTED") {
        return (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                    <strong>مرفوضة.</strong>{" "}
                    {artwork.adminNote ? `السبب: ${artwork.adminNote}. ` : ""}
                    عدّل اللوحة وسيتم إرسالها للمراجعة تلقائياً.
                </span>
            </div>
        );
    }

    if (s === "SUSPENDED") {
        return (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                    <strong>أوقفتها المنصة.</strong>{" "}
                    {artwork.adminNote ? `السبب: ${artwork.adminNote}. ` : ""}
                    لا يمكنك تفعيلها — تواصل مع الدعم للاستفسار.
                </span>
            </div>
        );
    }
    
    if (artwork.isSold) {
        if (!artwork.isActive) {
            return (
                <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-600">
                    <EyeOff className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                    <span><strong>مباعة ومخفية</strong> من بروفايلك بواسطتك — يمكنك إظهارها في أي وقت.</span>
                </div>
            );
        }
        return (
            <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-xs text-purple-800">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span><strong>مباعة</strong> — تظهر في بروفايلك فقط وليست معروضة للبيع.</span>
            </div>
        );
    }

    if (s === "APPROVED" && !artwork.isActive) {
        return (
            <div className="flex items-start gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-600">
                <EyeOff className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span>موقوفة بواسطتك — غير ظاهرة في المعرض. يمكنك تفعيلها في أي وقت.</span>
            </div>
        );
    }

    return null;
}