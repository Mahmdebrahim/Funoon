import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    ChevronLeft,
    ShoppingBag,
    Calendar,
    Eye,
    X,
    Ban,
    MessageSquare,
    ArrowLeft,
    Sparkles,
    AlertCircle,
    Star
} from 'lucide-react'
import { useMyOrders } from '../hooks/useOrders'
import { getMediaUrl } from '../../../utils/media'
import { ROUTES } from '../../../config/routes'
import OrderDetailsModal from '../components/OrderDetailsModal'
import CancelOrderModal from '../components/CancelOrderModal'
import ConfirmDeliveryModal from '../components/ConfirmDeliveryModal'
import ReviewModal from '../../reviews/components/ReviewModal'
import StarRating from '../../../components/Ui/StarRating'
import { reviewService } from '../../reviews/services/review.service'

// ═══════════════════════════════════════════════════
// Status Configuration
// ═══════════════════════════════════════════════════
const STATUS_CONFIG = {
    PENDING_PAYMENT: {
        label: 'بانتظار الدفع',
        icon: Clock,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
    },
    PAID: {
        label: 'تم الدفع',
        icon: CheckCircle,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
    },
    PROCESSING: {
        label: 'قيد التجهيز',
        icon: Package,
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
    },
    SHIPPED: {
        label: 'تم الشحن',
        icon: Truck,
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
    },
    DELIVERED: {
        label: 'تم التوصيل',
        icon: CheckCircle,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
    },
    COMPLETED: {
        label: 'مكتمل',
        icon: Sparkles,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
    },
    CANCELLED: {
        label: 'ملغي',
        icon: X,
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
    },
}

const TABS = [
    { value: 'all', label: 'الكل' },
    { value: 'PAID', label: 'مدفوعة' },
    { value: 'PROCESSING', label: 'قيد التجهيز' },
    { value: 'SHIPPED', label: 'تم الشحن' },
    { value: 'DELIVERED', label: 'تم التوصيل' },
    { value: 'COMPLETED', label: 'مكتملة' },
]

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
export default function MyOrdersPage() {
    const [activeTab, setActiveTab] = useState('all')
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // ✅ state للـ cancel modal
    const [cancelOrderId, setCancelOrderId] = useState(null)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

    // ✅ state للـ confirm delivery modal
    const [confirmOrderId, setConfirmOrderId] = useState(null)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

    // ✅ state للـ review modal
    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        orderId: null,
        existingReview: null,
    })

    const { data: myReviewsData } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: () => reviewService.getMyReviews(),
    })

    const reviewMap = useMemo(() => {
        const map = new Map()
        if (myReviewsData?.reviews) {
            myReviewsData.reviews.forEach((r) => {
                const oid = r.order?._id || r.order
                if (oid) map.set(oid.toString(), r)
            })
        }
        return map
    }, [myReviewsData])

    const openReviewModal = (orderId, existingReview = null) => {
        setReviewModal({
            isOpen: true,
            orderId,
            existingReview,
        })
    }

    const filters = activeTab === 'all' ? {} : { status: activeTab }
    const { data, isLoading, isError } = useMyOrders(filters)
    const orders = data?.orders || []

    const openModal = (orderId) => {
        setSelectedOrderId(orderId)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedOrderId(null)
    }

    // ✅ handlers للـ cancel modal
    const openCancelModal = (orderId) => {
        setCancelOrderId(orderId)
        setIsCancelModalOpen(true)
    }

    const closeCancelModal = () => {
        setIsCancelModalOpen(false)
        setCancelOrderId(null)
    }

    // ✅ handlers للـ confirm delivery modal
    const openConfirmModal = (orderId) => {
        setConfirmOrderId(orderId)
        setIsConfirmModalOpen(true)
    }

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false)
        setConfirmOrderId(null)
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* ═══ Page Header ═══ */}
            <div className="bg-surface-container-lowest border-b border-outline-variant/30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8 lg:py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs font-body text-on-surface-variant mb-6">
                        <Link to={ROUTES.HOME} className="hover:text-primary transition-premium">
                            الرئيسية
                        </Link>
                        <ChevronLeft className="w-3 h-3" />
                        <span className="text-on-surface font-medium">طلباتي</span>
                    </nav>

                    {/* Title */}
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="font-display text-4xl lg:text-5xl text-on-surface tracking-tight">
                                طلباتي
                            </h1>
                            <p className="text-sm font-body text-on-surface-variant mt-2">
                                تابع جميع طلباتك الفنية وحالة الشحن والتوصيل
                            </p>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 text-sm font-body text-on-surface-variant">
                            <Package className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                            <span>{orders.length} طلب</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Tabs ═══ */}
            <div className="bg-surface-container-lowest border-b border-outline-variant/30 sticky top-20 z-30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`relative px-5 py-4 text-sm font-body font-medium whitespace-nowrap transition-premium ${activeTab === tab.value
                                    ? 'text-primary'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                            >
                                {tab.label}
                                {/* Active indicator */}
                                {activeTab === tab.value && (
                                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Content ═══ */}
            <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8 lg:py-12">
                {isLoading ? (
                    <LoadingState />
                ) : isError ? (
                    <ErrorState />
                ) : orders.length === 0 ? (
                    <EmptyState activeTab={activeTab} />
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                index={index}
                                review={reviewMap.get(order._id.toString())}
                                onViewDetails={() => openModal(order._id)}
                                onRequestCancel={() => openCancelModal(order._id)}
                                onRequestConfirm={() => openConfirmModal(order._id)}
                                onOpenReview={() => openReviewModal(order._id, reviewMap.get(order._id.toString()))}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <OrderDetailsModal
                orderId={selectedOrderId}
                isOpen={isModalOpen}
                onClose={closeModal}
            />

            {/* ✅ Cancel Modal */}
            <CancelOrderModal
                orderId={cancelOrderId}
                isOpen={isCancelModalOpen}
                onClose={closeCancelModal}
            />

            {/* ✅ Confirm Delivery Modal */}
            <ConfirmDeliveryModal
                orderId={confirmOrderId}
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmModal}
            />

            {/* ✅ Review Modal */}
            <ReviewModal
                orderId={reviewModal.orderId}
                existingReview={reviewModal.existingReview}
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ isOpen: false, orderId: null, existingReview: null })}
            />
        </div>
    )
}

// ═══════════════════════════════════════════════════
// Order Card - Redesigned
// ═══════════════════════════════════════════════════
function OrderCard({ order, index, review, onViewDetails, onRequestCancel, onRequestConfirm, onOpenReview }) {
    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID
    const StatusIcon = statusConfig.icon
    const totalItems = order.items?.length || 0

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

    const formatPrice = (v) =>
        new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v || 0)

    // Get artwork images
    const allImages = order.items
        ?.map((item) => getMediaUrl(item.artwork?.coverImage || item.artwork?.images?.[0]?.url))
        .filter(Boolean) || []

    // ✅ الإلغاء مسموح قبل الشحن (PENDING + PAID + PROCESSING)
    const canCancel = ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status)
    // طلب الاسترداد بعد الاستلام (Return flow — مرحلة لاحقة)
    const canRequestRefund = order.status === 'DELIVERED' && !order.refundStatus
    const canConfirmDelivery = order.status === 'DELIVERED' && !order.fundsReleased

    // ✅ قواعد التقييم
    const completedDate = order.completedAt || (order.status === 'COMPLETED' ? order.updatedAt : null)
    const daysSinceCompleted = completedDate ? (Date.now() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24) : 999
    const canCreateReview = order.status === 'COMPLETED' && !review && daysSinceCompleted <= 30

    const daysSinceReview = review ? (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999
    const canEditReview = order.status === 'COMPLETED' && review && daysSinceReview <= 7

    return (
        <div
            className="group bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* ─── Top Bar: Order Info ─── */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low/50">
                <div className="flex items-center gap-6">
                    {/* Order ID */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-on-surface-variant">
                            طلب
                        </span>
                        <span className="font-mono text-sm text-on-surface font-medium">
                            #{order._id.slice(-8).toUpperCase()}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-2 text-sm font-body text-on-surface-variant">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{formatDate(order.createdAt)}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-body font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    <StatusIcon className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>{statusConfig.label}</span>
                </div>
            </div>

            {order.status === "CANCELLED" && order.cancellationReason && (
                <div className="mx-6 mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-on-surface-variant">
                            <span className="font-semibold text-red-600">سبب الإلغاء: </span>
                            {order.cancellationReason}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Main Content ─── */}
            <div className="p-6">
                <div className="flex gap-6">
                    {/* Images Stack */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-32 bg-surface-container overflow-hidden">
                            {allImages[0] && (
                                <img
                                    src={allImages[0]}
                                    alt=""
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                        </div>

                        {/* Stack indicator */}
                        {allImages.length > 1 && (
                            <div className="absolute -bottom-2 -left-2 w-28 h-32 bg-surface-container-high -z-10" />
                        )}
                        {allImages.length > 1 && (
                            <div className="absolute -bottom-1 -left-1 w-28 h-32 bg-surface-container -z-10" />
                        )}

                        {/* Count badge */}
                        {totalItems > 1 && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white text-xs font-body font-bold flex items-center justify-center shadow-lg">
                                +{totalItems - 1}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                            {/* Title */}
                            <h3 className="font-display text-xl text-on-surface leading-tight mb-2 line-clamp-1">
                                {order.items?.[0]?.artwork?.title || 'عمل فني'}
                            </h3>

                            {/* Artist */}
                            {order.artist && (
                                <p className="text-sm font-body text-on-surface-variant mb-3">
                                    من أعمال <span className="text-on-surface font-medium">{order.artist.name}</span>
                                </p>
                            )}

                            {/* Shipping Company */}
                            {order.shipping?.deliveryCompanyName && (
                                <div className="flex items-center gap-2 text-xs font-body text-on-surface-variant">
                                    <Truck className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
                                    <span>{order.shipping.deliveryCompanyName}</span>
                                    {order.shipping.estimatedDeliveryDate && (
                                        <span className="text-on-surface-variant/60">
                                            • التوصيل المتوقع: {formatDate(order.shipping.estimatedDeliveryDate)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items count (mobile) */}
                        {totalItems > 1 && (
                            <p className="text-xs font-body text-on-surface-variant mt-2 sm:hidden">
                                + {totalItems - 1} قطع أخرى
                            </p>
                        )}
                    </div>

                    {/* Price + Actions */}
                    <div className="shrink-0 flex flex-col items-end justify-between">
                        {/* Price */}
                        <div className="text-left">
                            <p className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-on-surface-variant mb-1">
                                الإجمالي
                            </p>
                            <p className="font-display text-2xl text-primary leading-none">
                                {formatPrice(order.financials?.totalAmount)}
                            </p>
                            <p className="text-[10px] font-body text-on-surface-variant mt-1">ريال سعودي</p>
                        </div>

                        {/* View Details Button */}
                        <button
                            onClick={onViewDetails}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-body font-semibold text-on-surface border border-outline-variant/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                        >
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>التفاصيل</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Existing Review Box */}
            {review && (
                <div className="mx-6 mb-4 p-3 bg-amber-500/5 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <StarRating value={review.rating} size="sm" showNumber />
                        {review.comment && (
                            <span className="text-xs font-body text-on-surface-variant line-clamp-1">
                                "{review.comment}"
                            </span>
                        )}
                    </div>
                    {canEditReview && (
                        <button
                            onClick={onOpenReview}
                            className="text-xs font-body font-semibold text-amber-700 hover:text-amber-800 underline"
                        >
                            تعديل التقييم
                        </button>
                    )}
                </div>
            )}

            {/* ─── Bottom Bar: Actions ─── */}
            {(canCancel || canRequestRefund || canConfirmDelivery || canCreateReview) && (
                <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-outline-variant/20 bg-surface-container-low/30">
                    {canCreateReview && (
                        <button
                            onClick={onOpenReview}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-body font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-premium"
                        >
                            <Star className="w-3.5 h-3.5 fill-amber-950 stroke-amber-950" />
                            <span>قيّم الفنان</span>
                        </button>
                    )}
                    {canConfirmDelivery && (
                        <button
                            onClick={onRequestConfirm}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-body font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-premium"
                        >
                            <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>تأكيد الاستلام</span>
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={onRequestCancel}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-body font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-premium"
                        >
                            <Ban className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>إلغاء الطلب</span>
                        </button>
                    )}
                    {canRequestRefund && (
                        <button
                            onClick={() => alert('طلب الاسترداد (Return flow) — مرحلة لاحقة')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-body font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-premium"
                        >
                            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>طلب استرداد</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════
// States
// ═══════════════════════════════════════════════════
function LoadingState() {
    return (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="bg-surface-container-lowest border border-outline-variant/30 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <div className="h-14 bg-surface-container-low/50" />
                    <div className="p-6">
                        <div className="flex gap-6">
                            <div className="w-28 h-32 bg-surface-container" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 w-2/3 bg-surface-container" />
                                <div className="h-4 w-1/3 bg-surface-container" />
                                <div className="h-4 w-1/2 bg-surface-container" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-8 w-24 bg-surface-container" />
                                <div className="h-9 w-28 bg-surface-container" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ErrorState() {
    return (
        <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-xl text-on-surface mb-2">حدث خطأ</h3>
            <p className="text-sm font-body text-on-surface-variant mb-6">
                لم نتمكن من تحميل طلباتك. يرجى المحاولة مرة أخرى.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-premium"
            >
                إعادة المحاولة
            </button>
        </div>
    )
}

function EmptyState({ activeTab }) {
    const messages = {
        all: {
            title: 'لا توجد طلبات بعد',
            desc: 'ابدأ رحلتك الفنية واكتشف أعمالاً فريدة من فناني المملكة',
        },
        PAID: {
            title: 'لا توجد طلبات مدفوعة',
            desc: 'الطلبات المدفوعة ستظهر هنا',
        },
        PROCESSING: {
            title: 'لا توجد طلبات قيد التجهيز',
            desc: 'الطلبات التي يتم تجهيزها ستظهر هنا',
        },
        SHIPPED: {
            title: 'لا توجد طلبات مشحونة',
            desc: 'الطلبات المشحونة ستظهر هنا',
        },
        DELIVERED: {
            title: 'لا توجد طلبات تم توصيلها',
            desc: 'الطلبات التي تم توصيلها ستظهر هنا',
        },
        COMPLETED: {
            title: 'لا توجد طلبات مكتملة',
            desc: 'الطلبات المكتملة ستظهر هنا',
        },
    }

    const message = messages[activeTab] || messages.all

    return (
        <div className="py-24 text-center">
            <div className="w-20 h-20 mx-auto bg-surface-container-low flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-on-surface-variant/40" strokeWidth={1} />
            </div>
            <h3 className="font-display text-2xl text-on-surface mb-3">{message.title}</h3>
            <p className="text-sm font-body text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
                {message.desc}
            </p>
            {activeTab === 'all' && (
                <Link to={ROUTES.ARTWORKS}>
                    <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-premium">
                        <span>استكشف المعرض</span>
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </Link>
            )}
        </div>
    )
}