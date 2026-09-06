import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ChevronLeft,
    Star,
    ArrowRight,
    User,
    ShieldAlert,
    X,
    MessageSquare,
    AlertCircle,
    RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'

import { reviewService } from '../services/review.service'
import { artistService } from '../../artist/services/artist.service'
import { useAuthStore } from '../../auth/stores/authStore'
import { ROUTES } from '../../../config/routes'
import StarRating from '../../../components/Ui/StarRating'
import ReviewCard from '../../../components/Ui/ReviewCard'
import { getMediaUrl } from '../../../utils/media'
import Button from '../../../components/Ui/Button'


// ═══════════════════════════════════════════════════
// Skeleton Loader — شكل الصفحة وهي بتحمّل
// ═══════════════════════════════════════════════════
function PageSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--color-surface)] pb-16 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8 lg:py-10">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-3 w-12 bg-[var(--color-surface-container-low)] rounded" />
                        <div className="h-3 w-3 bg-[var(--color-surface-container-low)] rounded" />
                        <div className="h-3 w-16 bg-[var(--color-surface-container-low)] rounded" />
                        <div className="h-3 w-3 bg-[var(--color-surface-container-low)] rounded" />
                        <div className="h-3 w-24 bg-[var(--color-surface-container-low)] rounded" />
                    </div>

                    {/* Artist Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container-low)]" />
                            <div>
                                <div className="h-7 w-48 bg-[var(--color-surface-container-low)] rounded mb-2" />
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="h-4 w-24 bg-[var(--color-surface-container-low)] rounded" />
                                    <div className="h-4 w-20 bg-[var(--color-surface-container-low)] rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="h-9 w-36 bg-[var(--color-surface-container-low)] rounded" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-[var(--color-surface-container-lowest)] p-6 border border-[var(--color-outline-variant)]/40">
                            <div className="h-5 w-32 bg-[var(--color-surface-container-low)] rounded mb-4" />
                            <div className="h-12 w-24 bg-[var(--color-surface-container-low)] rounded mb-6" />
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-4 w-14 bg-[var(--color-surface-container-low)] rounded" />
                                        <div className="flex-1 h-2.5 bg-[var(--color-surface-container-low)] rounded-full" />
                                        <div className="h-4 w-16 bg-[var(--color-surface-container-low)] rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="lg:col-span-8 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-[var(--color-surface-container-lowest)] p-5 border border-[var(--color-outline-variant)]/40"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-low)]" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="h-4 w-32 bg-[var(--color-surface-container-low)] rounded" />
                                            <div className="h-3 w-16 bg-[var(--color-surface-container-low)] rounded" />
                                        </div>
                                        <div className="h-4 w-24 bg-[var(--color-surface-container-low)] rounded mb-2" />
                                        <div className="h-3 w-full bg-[var(--color-surface-container-low)] rounded mb-1" />
                                        <div className="h-3 w-3/4 bg-[var(--color-surface-container-low)] rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════
export default function ArtistReviewsPage() {
    const { id } = useParams()
    const [page, setPage] = useState(1)
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const isAdmin = user?.role === 'admin'

    // ─── Modal State (Admin Hide) ───
    const [hideModal, setHideModal] = useState({ isOpen: false, reviewId: null })
    const [hideReason, setHideReason] = useState('')
    const [hideReasonError, setHideReasonError] = useState('')

    // ─── Fetch Artist ───
    const { data: artistData, isLoading: isArtistLoading } = useQuery({
        queryKey: ['artist', id],
        queryFn: () => artistService.getArtistProfile(id),
        enabled: !!id,
    })
    console.log(artistData);
    const artist = artistData || {}
    const avatarUrl = artist?.avatar ? getMediaUrl(artist.avatar) : null

    // ─── Fetch Reviews ───
    const {
        data: reviewsData,
        isLoading: isReviewsLoading,
        isError,
        refetch: refetchReviews,
    } = useQuery({
        queryKey: ['artist-reviews', id, page],
        queryFn: () => reviewService.getArtistReviews(id, { page, limit: 15 }),
        enabled: !!id,
    })

    const reviews = reviewsData?.reviews || []
    const summary = reviewsData?.summary || {
        avgRating: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
    const pagination = reviewsData?.pagination || {
        total: 0,
        page: 1,
        limit: 15,
        pages: 1,
    }

    const isLoading = isArtistLoading || isReviewsLoading

    // ─── Hide Review (Admin) ───
    const hideMutation = useMutation({
        mutationFn: ({ reviewId, reason }) =>
            reviewService.hideReview(reviewId, { reason }),
        onSuccess: () => {
            toast.success('تم إخفاء التقييم بنجاح')
            // ✅ تحديث شامل لكل الأماكن اللي ممكن تعرض فيها التقييمات
            queryClient.invalidateQueries({ queryKey: ['artist-reviews'] })
            queryClient.invalidateQueries({ queryKey: ['artist', id] })
            queryClient.invalidateQueries({ queryKey: ['artists'] })
            closeHideModal()
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err.message || 'فشل إخفاء التقييم')
        },
    })

    // ─── Unhide Review (Admin) ───
    const unhideMutation = useMutation({
        mutationFn: (reviewId) => reviewService.unhideReview(reviewId),
        onSuccess: () => {
            toast.success('تم إظهار التقييم بنجاح')
            queryClient.invalidateQueries({ queryKey: ['artist-reviews'] })
            queryClient.invalidateQueries({ queryKey: ['artist', id] })
            queryClient.invalidateQueries({ queryKey: ['artists'] })
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err.message || 'فشل إظهار التقييم')
        },
    })

    const openHideModal = (reviewId) => {
        setHideModal({ isOpen: true, reviewId })
        setHideReason('')
        setHideReasonError('')
    }

    const closeHideModal = () => {
        setHideModal({ isOpen: false, reviewId: null })
        setHideReason('')
        setHideReasonError('')
    }

    const handleConfirmHide = (e) => {
        e.preventDefault()
        const trimmed = hideReason.trim()
        if (!trimmed) {
            setHideReasonError('سبب الإخفاء إجباري')
            return
        }
        if (trimmed.length < 10) {
            setHideReasonError('سبب الإخفاء يجب أن يكون 10 حروف على الأقل')
            return
        }
        hideMutation.mutate({ reviewId: hideModal.reviewId, reason: trimmed })
    }

    // ═══════════════════════════════════════════════════
    // Loading State — Skeleton احترافي
    // ═══════════════════════════════════════════════════
    if (isLoading) {
        return <PageSkeleton />
    }

    // ═══════════════════════════════════════════════════
    // Error State
    // ═══════════════════════════════════════════════════
    if (isError) {
        return (
            <div className="min-h-screen bg-[var(--color-surface)] pb-16 flex items-center justify-center px-4">
                <div className="max-w-md text-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-error)]/30 p-8">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-600" strokeWidth={1.5} />
                    </div>
                    <h2 className="font-display text-lg font-bold text-[var(--color-on-surface)] mb-2">
                        تعذّر تحميل التقييمات
                    </h2>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">
                        حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => refetchReviews()}
                    >
                        إعادة المحاولة
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)] pb-16">
            {/* ═══ Page Header ═══ */}
            <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8 lg:py-10">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs font-body text-[var(--color-on-surface-variant)] mb-6">
                        <Link
                            to={ROUTES.HOME}
                            className="hover:text-[var(--color-primary)] transition-colors"
                        >
                            الرئيسية
                        </Link>
                        <ChevronLeft className="w-3 h-3" />
                        <Link
                            to={ROUTES.ARTISTS}
                            className="hover:text-[var(--color-primary)] transition-colors"
                        >
                            الفنانون
                        </Link>
                        <ChevronLeft className="w-3 h-3" />
                        <Link
                            to={`/artists/${id}`}
                            className="hover:text-[var(--color-primary)] transition-colors"
                        >
                            {artist.name || 'الفنان'}
                        </Link>
                        <ChevronLeft className="w-3 h-3" />
                        <span className="text-[var(--color-on-surface)] font-medium">
                            كل التقييمات
                        </span>
                    </nav>

                    {/* Artist Banner Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {/* ─── Avatar ─── */}
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-surface-container)] shrink-0 border border-[var(--color-outline-variant)]/40">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={artist.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--color-on-surface-variant)]">
                                        <User className="w-8 h-8" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>

                            {/* ─── Name + Stats ─── */}
                            <div>
                                <h1 className="font-display text-2xl lg:text-3xl font-bold text-[var(--color-on-surface)]">
                                    تقييمات {artist.name || 'الفنان'}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <StarRating
                                        value={summary.avgRating || 0}
                                        showNumber
                                        size="sm"
                                    />
                                    <span className="text-xs font-body text-[var(--color-on-surface-variant)]">
                                        ({summary.total || 0} تقييم)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to={`/artists/${id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-body font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>العودة لصفحة الفنان</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ═══ Content Container ═══ */}
            <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ─── Distribution Sidebar ─── */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[var(--color-surface-container-lowest)] p-6 border border-[var(--color-outline-variant)]/40 shadow-sm">
                            <h3 className="font-display text-base font-bold text-[var(--color-on-surface)] mb-4">
                                ملخص التقييمات
                            </h3>

                            <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-[var(--color-outline-variant)]/30">
                                <span className="font-display text-4xl font-extrabold text-[var(--color-primary)]">
                                    {Number(summary.avgRating || 0).toFixed(1)}
                                </span>
                                <span className="text-xs font-body text-[var(--color-on-surface-variant)]">
                                    من 5 نجوم (إجمالي {summary.total || 0} تقييم)
                                </span>
                            </div>

                            {/* Star Distribution Bars */}
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = summary.distribution?.[star] || 0
                                    const percent =
                                        summary.total > 0
                                            ? Math.round((count / summary.total) * 100)
                                            : 0

                                    return (
                                        <div
                                            key={star}
                                            className="flex items-center gap-3 text-xs font-body"
                                        >
                                            <div className="flex items-center gap-1 w-14 shrink-0 font-medium text-[var(--color-on-surface)]">
                                                <span>{star}</span>
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            </div>
                                            <div className="flex-1 h-2.5 bg-[var(--color-surface-container-high)] overflow-hidden rounded-full">
                                                <div
                                                    className="h-full bg-amber-400 transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <span className="w-16 text-left shrink-0 font-mono text-[var(--color-on-surface-variant)]">
                                                {count} ({percent}%)
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ─── Reviews List ─── */}
                    <div className="lg:col-span-8 space-y-6">
                        {reviews.length === 0 ? (
                            <div className="p-12 text-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40">
                                <MessageSquare
                                    className="w-12 h-12 text-[var(--color-on-surface-variant)]/50 mx-auto mb-3"
                                    strokeWidth={1}
                                />
                                <h3 className="font-display text-lg font-bold text-[var(--color-on-surface)] mb-1">
                                    لا توجد تقييمات حتى الآن
                                </h3>
                                <p className="text-xs font-body text-[var(--color-on-surface-variant)]">
                                    لم يقم أحد بتقييم هذا الفنان بعد.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <ReviewCard
                                            key={review._id}
                                            review={review}
                                            isAdmin={isAdmin}
                                            onHide={openHideModal}
                                            onUnhide={(rid) => unhideMutation.mutate(rid)}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-6">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="px-4 py-2 text-xs font-body font-semibold text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/40 hover:bg-[var(--color-surface-container)] disabled:opacity-40 transition-colors"
                                        >
                                            السابق
                                        </button>
                                        <span className="px-4 text-xs font-body text-[var(--color-on-surface-variant)]">
                                            صفحة {pagination.page} من {pagination.pages}
                                        </span>
                                        <button
                                            disabled={page === pagination.pages}
                                            onClick={() =>
                                                setPage((p) => Math.min(pagination.pages, p + 1))
                                            }
                                            className="px-4 py-2 text-xs font-body font-semibold text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/40 hover:bg-[var(--color-surface-container)] disabled:opacity-40 transition-colors"
                                        >
                                            التالي
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Admin Hide Modal ═══ */}
            <Dialog.Root
                open={hideModal.isOpen}
                onOpenChange={(open) => !open && closeHideModal()}
            >
                <AnimatePresence>
                    {hideModal.isOpen && (
                        <Dialog.Portal forceMount>
                            <Dialog.Overlay asChild forceMount>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                                />
                            </Dialog.Overlay>
                            <Dialog.Content asChild forceMount>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                                >
                                    <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-md border border-[var(--color-outline-variant)]/40 shadow-2xl p-6 pointer-events-auto">
                                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-outline-variant)]/30">
                                            <Dialog.Title className="font-display text-lg font-bold text-red-600 flex items-center gap-2">
                                                <ShieldAlert className="w-5 h-5" />
                                                <span>إخفاء التقييم (أدمن)</span>
                                            </Dialog.Title>
                                            <button
                                                onClick={closeHideModal}
                                                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <form onSubmit={handleConfirmHide} className="space-y-4">
                                            {hideReasonError && (
                                                <div className="p-3 text-xs font-body text-red-600 bg-red-50 border border-red-200 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    <span>{hideReasonError}</span>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-body font-semibold text-[var(--color-on-surface-variant)] mb-2">
                                                    سبب الإخفاء 
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={hideReason}
                                                    onChange={(e) => setHideReason(e.target.value)}
                                                    placeholder="مثال: يحتوي التقييم على عبارات غير لائقة..."
                                                    className="w-full p-3 text-xs font-body bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 focus:border-red-500 focus:outline-none text-[var(--color-on-surface)] resize-none"
                                                />
                                            </div>

                                            <div className="flex items-center justify-end gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={closeHideModal}
                                                    className="px-4 py-2 text-xs font-body font-semibold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]/60 hover:bg-[var(--color-surface-container)]"
                                                >
                                                    إلغاء
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={hideMutation.isPending}
                                                    className="px-5 py-2 text-xs font-body font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {hideMutation.isPending && (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    )}
                                                    <span>تأكيد الإخفاء</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    )}
                </AnimatePresence>
            </Dialog.Root>
        </div>
    )
}