import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    MoreVertical, Edit3, Power, Trash2, CheckCircle2, PauseCircle,
    Clock, XCircle, ShieldAlert, Star, Lock,
} from "lucide-react";
import { getMediaUrl } from "../../../utils/media";
import { ROUTES } from "../../../config/routes";
import { useAuthStore } from "../../auth/stores/authStore";
import { useFeatureArtwork, useUnfeatureArtwork } from "../hooks/useDashboard";

export default function ArtworkCard({ artwork, onToggle, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const user = useAuthStore((s) => s.user);
    const isPrestige = user?.subscription?.plan === "opal_prestige" && user?.subscription?.isActive;

    const featureMutation = useFeatureArtwork();
    const unfeatureMutation = useUnfeatureArtwork();

    // click outside → close
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    const s = artwork.approvalStatus;
    const isSold = artwork.isSold;
    const isActive = artwork.isActive;

    // ═══ Badge حسب الحالة الحقيقية ═══
    const statusBadge = (() => {
        if (s === "PENDING_APPROVAL")
            return { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700", icon: Clock };
        if (s === "REJECTED")
            return { label: "مرفوضة", cls: "bg-red-100 text-red-700", icon: XCircle };
        if (s === "SUSPENDED")
            return { label: "موقوفة من المنصة", cls: "bg-rose-100 text-rose-700", icon: ShieldAlert };
        if (isSold)
            return { label: "مباعة", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
        if (!isActive)
            return { label: "موقوفة", cls: "bg-stone-200 text-stone-600", icon: PauseCircle };
        return { label: "نشطة", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 };
    })();
    const StatusIcon = statusBadge.icon;

    // ═══ Rules ═══
    const canToggle = s === "APPROVED";

    const toggleLabel = isSold
        ? isActive ? "إخفاء من البروفايل" : "إظهار في البروفايل"
        : isActive ? "إيقاف العرض" : "تفعيل العرض";

    const toggleTooltip = !canToggle
        ? s === "PENDING_APPROVAL"
            ? "لا يمكن تغيير حالة لوحة قيد المراجعة"
            : s === "REJECTED"
                ? "لا يمكن تفعيل لوحة مرفوضة — عدّلها وسيتم إعادة مراجعتها"
                : "لا يمكن تغيير حالة لوحة موقوفة من المنصة"
        : undefined;

    const canDelete = !isSold && s !== "SUSPENDED";
    const deleteTooltip = isSold
        ? "لا يمكن حذف لوحة مباعة — إخفاؤها من البروفايل متاح"
        : s === "SUSPENDED"
            ? "لا يمكن حذف لوحة موقوفة من المنصة"
            : "حذف اللوحة نهائياً";

    return (
        <div className="group relative bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all duration-200">
            {/* ─── Image ── */}
            <div className="relative aspect-[4/5] bg-[var(--color-surface-container-low)] overflow-hidden">
                <img
                    src={getMediaUrl(artwork.coverImage)}
                    alt={artwork.title}
                    crossOrigin="anonymous"
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isActive || s === "PENDING_APPROVAL" || s === "REJECTED" || s === "SUSPENDED"
                            ? "opacity-60"
                            : ""
                        }`}
                />

                {/* sold overlay */}
                {isSold && <div className="absolute inset-0 bg-black/30" />}

                {/* status badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${statusBadge.cls}`}>
                    <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                    {statusBadge.label}
                </span>

                {/* Featured Badge */}
                {artwork.isFeatured && (
                    <span className="absolute top-3 left-12 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#C5A880] text-white backdrop-blur-sm flex items-center gap-1 shadow-xs z-10">
                        <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                        مميزة
                    </span>
                )}

                {/* ⋮ menu */}
                <div ref={menuRef} className="absolute top-3 left-3 z-20">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center cursor-pointer justify-center text-stone-700 hover:bg-white transition-all ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-stone-200 rounded-lg shadow-xl py-1 z-30 text-right">
                            <Link
                                to={ROUTES.EDIT_ARTWORK.replace(":id", artwork._id)}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>تعديل</span>
                            </Link>

                            {/* Feature / Unfeature */}
                            {isPrestige ? (
                                <button
                                    onClick={() => {
                                        if (isSold || s !== "APPROVED" || featureMutation.isPending || unfeatureMutation.isPending) return;
                                        setMenuOpen(false);
                                        if (artwork.isFeatured) {
                                            unfeatureMutation.mutate(artwork._id);
                                        } else {
                                            featureMutation.mutate(artwork._id);
                                        }
                                    }}
                                    disabled={isSold || s !== "APPROVED" || featureMutation.isPending || unfeatureMutation.isPending}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-right ${
                                        isSold || s !== "APPROVED"
                                            ? "text-stone-300 cursor-not-allowed"
                                            : "text-amber-700 hover:bg-amber-50 cursor-pointer font-medium"
                                    }`}
                                >
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>{artwork.isFeatured ? "إلغاء التمييز" : "تمييز اللوحة"}</span>
                                </button>
                            ) : (
                                <Link
                                    to={ROUTES.SUBSCRIPTION}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm w-full text-right text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                                    title="ميزة التمييز مخصصة لمشتركي باقة Opal Prestige"
                                >
                                    <Lock className="w-4 h-4 text-stone-400" />
                                    <span>التمييز لباقة Prestige</span>
                                </Link>
                            )}

                            {/* Toggle */}
                            <button
                                onClick={() => {
                                    if (!canToggle) return;
                                    setMenuOpen(false);
                                    onToggle(artwork._id);
                                }}
                                title={toggleTooltip}
                                className={`flex items-center gap-2 px-3 py-2 text-sm w-full ${canToggle
                                        ? "text-stone-700 hover:bg-stone-50 cursor-pointer"
                                        : "text-stone-400 cursor-not-allowed"
                                    }`}
                            >
                                {isActive ? (
                                    <PauseCircle className="w-4 h-4" />
                                ) : (
                                    <Power className="w-4 h-4" />
                                )}
                                <span>{toggleLabel}</span>
                            </button>

                            <div className="my-1 border-t border-stone-100" />

                            {/* حذف */}
                            <button
                                onClick={() => {
                                    if (!canDelete) return;
                                    setMenuOpen(false);
                                    onDelete(artwork);
                                }}
                                title={deleteTooltip}
                                className={`flex items-center gap-2 px-3 py-2 text-sm w-full ${canDelete
                                        ? "text-red-600 hover:bg-red-50 cursor-pointer"
                                        : "text-red-300 cursor-not-allowed"
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>حذف</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Info ─── */}
            <div className="p-4">
                <h3 className="font-display text-base font-semibold text-[var(--color-on-surface)] line-clamp-1 mb-1">
                    {artwork.title}
                </h3>
                {(artwork.medium || artwork.category) && (
                    <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-1 mb-3">
                        {[artwork.medium, artwork.category].filter(Boolean).join(" • ")}
                    </p>
                )}
                <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-[var(--color-primary)]">
                        {(artwork.price || 0).toLocaleString()}{" "}
                        <span className="text-xs font-body font-normal text-[var(--color-on-surface-variant)]">
                            ر.س
                        </span>
                    </span>
                    {isSold && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
            </div>
        </div>
    );
}