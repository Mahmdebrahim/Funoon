import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Package,
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    Calendar,
    CreditCard,
    Palette,
    Ruler,
    Phone,
    Mail,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Star
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ordersService } from '../services/orders.service'
import { reviewService } from '../../reviews/services/review.service'
import ReviewModal from '../../reviews/components/ReviewModal'
import StarRating from '../../../components/Ui/StarRating'
import { getMediaUrl } from '../../../utils/media'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

// Status config
const STATUS_CONFIG = {
    PENDING_PAYMENT: { label: 'بانتظار الدفع', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300' },
    PAID: { label: 'تم الدفع', icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300' },
    PROCESSING: { label: 'قيد التجهيز', icon: Package, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
    SHIPPED: { label: 'تم الشحن', icon: Truck, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300' },
    DELIVERED: { label: 'تم التوصيل', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
    COMPLETED: { label: 'مكتمل', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
    CANCELLED: { label: 'ملغي', icon: X, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
}

const STATUS_STEPS = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED']

export default function OrderDetailsModal({ orderId, isOpen, onClose }) {
    const { data: order, isLoading, isError } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => ordersService.getOrderById(orderId),
        enabled: !!orderId && isOpen,
    })

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

    const { data: myReviewsData } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: () => reviewService.getMyReviews(),
        enabled: !!orderId && isOpen && order?.status === 'COMPLETED',
    })

    const review = myReviewsData?.reviews?.find(
        (r) => (r.order?._id || r.order)?.toString() === orderId?.toString()
    )

    const completedDate = order?.completedAt || (order?.status === 'COMPLETED' ? order?.updatedAt : null)
    const daysSinceCompleted = completedDate ? (Date.now() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24) : 999
    const canCreateReview = order?.status === 'COMPLETED' && !review && daysSinceCompleted <= 30

    const daysSinceReview = review ? (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999
    const canEditReview = order?.status === 'COMPLETED' && review && daysSinceReview <= 7

    const formatDate = (date) => {
        if (!date) return '-'
        try {
            return format(new Date(date), 'dd MMMM yyyy', { locale: ar })
        } catch {
            return new Date(date).toLocaleDateString('ar-SA')
        }
    }

    const formatPrice = (v) =>
        new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v || 0)

    const statusConfig = STATUS_CONFIG[order?.status] || STATUS_CONFIG.PENDING_PAYMENT
    const StatusIcon = statusConfig.icon

    // Calculate current step for timeline
    const currentStepIndex = STATUS_STEPS.indexOf(order?.status)

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>

                        {/* Content */}
                        <Dialog.Content asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-outline-variant/40 shadow-2xl pointer-events-auto">

                                    {/* Header */}
                                    <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/40 p-5 flex items-center justify-between z-10">
                                        <div className="flex items-center gap-3">
                                            <Dialog.Title className="font-display text-xl text-on-surface">
                                                طلب #{orderId?.slice(-8).toUpperCase()}
                                            </Dialog.Title>
                                            {order && (
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-body font-semibold uppercase ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                                                    <StatusIcon className="w-3 h-3" strokeWidth={2} />
                                                    <span>{statusConfig.label}</span>
                                                </div>
                                            )}
                                        </div>
                                        <Dialog.Close asChild>
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-premium"
                                                aria-label="إغلاق"
                                            >
                                                <X className="w-5 h-5" strokeWidth={1.5} />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6 space-y-8">
                                        {isLoading ? (
                                            <LoadingState />
                                        ) : isError || !order ? (
                                            <ErrorState />
                                        ) : (
                                            <>
                                                {/* ═══ Cancellation Reason (if cancelled) ═══ */}
                                                {order.status === 'CANCELLED' && order.cancellationReason && (
                                                    <div className="bg-red-50 border border-red-200 p-4">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                            <div className='w-full flex items-center gap-1'>
                                                                <p className="text-xs font-body font-semibold text-red-700 mb-1">
                                                                    سبب الإلغاء:
                                                                </p>
                                                                <p className="text-sm font-body text-red-600">
                                                                    {order.cancellationReason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* ═══ Timeline ═══ */}
                                                <OrderTimeline status={order.status} currentStepIndex={currentStepIndex} />

                                                {/* ═══ Order Info Grid ═══ */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <InfoCard icon={Calendar} label="تاريخ الطلب" value={formatDate(order.createdAt)} />
                                                    <InfoCard icon={CreditCard} label="طريقة الدفع" value={order.payment?.method === 'creditcard' ? 'بطاقة ائتمان' : order.payment?.method || '-'} />
                                                    <InfoCard icon={Truck} label="شركة الشحن" value={order.shipping?.deliveryCompanyName || '-'} />
                                                    <InfoCard icon={Package} label="عدد القطع" value={`${order.items?.length || 0} قطعة`} />
                                                </div>

                                                {/* ═══ Items ═══ */}
                                                <div>
                                                    <h3 className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-on-surface-variant mb-4">
                                                        القطع المشتراة
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {order.items?.map((item, idx) => (
                                                            <ItemCard key={idx} item={item} formatPrice={formatPrice} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ═══ Addresses ═══ */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <AddressCard
                                                        title="عنوان التوصيل"
                                                        address={order.shipping?.buyerAddress}
                                                        icon={MapPin}
                                                    />
                                                    <AddressCard
                                                        title="معلومات الفنان"
                                                        address={order.shipping?.artistAddress}
                                                        icon={Palette}
                                                    />
                                                </div>

                                                {/* ═══ Financial Summary ═══ */}
                                                <div className="bg-surface-container-low border border-outline-variant/40 p-5">
                                                    <h3 className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-on-surface-variant mb-4">
                                                        ملخص مالي
                                                    </h3>
                                                    <div className="space-y-2 text-sm font-body">
                                                        <Row label="المجموع الفرعي" value={`${formatPrice(order.financials?.subtotal)} SAR`} />
                                                        <Row label="الشحن" value={`${formatPrice(order.financials?.shippingCost)} SAR`} />
                                                        <div className="border-t border-outline-variant/30 pt-2 mt-2">
                                                            <Row label="الإجمالي" value={`${formatPrice(order.financials?.totalAmount)} SAR`} bold primary />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ═══ Tracking (if available) ═══ */}
                                                {order.shipping?.trackingNumber && (
                                                    <div className="bg-surface-container-low border border-outline-variant/40 p-5">
                                                        <h3 className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-on-surface-variant mb-3">
                                                            تتبع الشحنة
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 font-mono text-sm text-on-surface">
                                                                {order.shipping.trackingNumber}
                                                            </div>
                                                            {order.shipping.trackingUrl && (
                                                                <a
                                                                    href={order.shipping.trackingUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-secondary hover:text-primary transition-premium"
                                                                >
                                                                    <span>تتبع</span>
                                                                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ═══ Review Section (if COMPLETED) ═══ */}
                                                {order?.status === 'COMPLETED' && (
                                                    <div className="bg-amber-500/5 border border-amber-500/30 p-5">
                                                        <h3 className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-amber-900 mb-3 flex items-center gap-2">
                                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                            <span>تقييم الفنان</span>
                                                        </h3>
                                                        {review ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <StarRating value={review.rating} showNumber size="md" />
                                                                    {canEditReview && (
                                                                        <button
                                                                            onClick={() => setIsReviewModalOpen(true)}
                                                                            className="px-3 py-1 text-xs font-body font-semibold text-amber-900 bg-amber-200/60 hover:bg-amber-200 transition-colors"
                                                                        >
                                                                            تعديل التقييم
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {review.comment && (
                                                                    <p className="text-xs font-body text-on-surface-variant bg-surface-container-lowest p-3 border border-outline-variant/30">
                                                                        "{review.comment}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : canCreateReview ? (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <p className="text-xs font-body text-on-surface-variant">
                                                                    تم اكتمال طلبك! شارك رأيك وقيم تجربة العمل مع الفنان.
                                                                </p>
                                                                <button
                                                                    onClick={() => setIsReviewModalOpen(true)}
                                                                    className="px-4 py-2 text-xs font-body font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-1.5"
                                                                >
                                                                    <Star className="w-3.5 h-3.5 fill-amber-950" />
                                                                    <span>قيّم الفنان</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-body text-on-surface-variant">
                                                                انتهت فترة التقييم المسموحة (30 يوماً من تاريخ التوصيل).
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>

            {/* ✅ Review Modal */}
            <ReviewModal
                orderId={orderId}
                existingReview={review}
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
            />
        </Dialog.Root>
    )
}

// ═══════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════

function OrderTimeline({ status, currentStepIndex }) {
    if (status === 'CANCELLED' || status === 'PENDING_PAYMENT') {
        return null
    }

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, idx) => {
                    const stepConfig = STATUS_CONFIG[step]
                    const StepIcon = stepConfig.icon
                    const isCompleted = idx < currentStepIndex
                    const isCurrent = idx === currentStepIndex
                    const isPending = idx > currentStepIndex

                    return (
                        <div key={step} className="flex-1 flex flex-col items-center relative">
                            {/* Line */}
                            {idx > 0 && (
                                <div
                                    className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${isCompleted || isCurrent ? 'bg-secondary' : 'bg-outline-variant/40'
                                        }`}
                                />
                            )}

                            {/* Icon */}
                            <div
                                className={`relative z-1 w-8 h-8 flex items-center justify-center border-2 transition-premium ${isCompleted
                                    ? 'bg-secondary border-secondary text-white'
                                    : isCurrent
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface-variant'
                                    }`}
                            >
                                <StepIcon className="w-4 h-4" strokeWidth={2} />
                            </div>

                            {/* Label */}
                            <span
                                className={`mt-2 text-[10px] font-body font-semibold tracking-wider uppercase text-center ${isCompleted || isCurrent ? 'text-on-surface' : 'text-on-surface-variant'
                                    }`}
                            >
                                {stepConfig.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="bg-surface-container-low border border-outline-variant/40 p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
                <p className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-on-surface-variant">
                    {label}
                </p>
            </div>
            <p className="text-sm font-body font-medium text-on-surface line-clamp-1">{value}</p>
        </div>
    )
}

function ItemCard({ item, formatPrice }) {
    return (
        <div className="flex gap-4 bg-surface-container-low border border-outline-variant/40 p-4">
            <div className="w-20 h-24 shrink-0 bg-surface-container overflow-hidden">
                {item.artwork?.coverImage && (
                    <img
                        src={getMediaUrl(item.artwork.coverImage)}
                        alt={item.artwork.title}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-display text-base text-on-surface line-clamp-1 mb-1">
                    {item.artwork?.title || item.artworkSnapshot?.title || 'عمل فني'}
                </h4>
                {item.artwork?.medium && (
                    <p className="text-xs font-body text-on-surface-variant mb-1">
                        {item.artwork.medium}
                    </p>
                )}
                {item.artwork?.dimensions && (
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant font-body mb-2">
                        <Ruler className="w-3 h-3" strokeWidth={1.5} />
                        <span>
                            {item.artwork.dimensions.width}×{item.artwork.dimensions.height} سم
                        </span>
                    </div>
                )}
                <p className="text-sm font-body font-semibold text-primary">
                    {formatPrice(item.artwork?.price || item.artworkSnapshot?.price || item.financials?.artworkPrice)} SAR
                </p>
            </div>
        </div>
    )
}

function AddressCard({ title, address, icon: Icon }) {
    if (!address) return null

    return (
        <div className="bg-surface-container-low border border-outline-variant/40 p-5">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                <h3 className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-on-surface-variant">
                    {title}
                </h3>
            </div>
            <div className="space-y-1.5 text-sm font-body text-on-surface">
                <p className="font-semibold">{address.name}</p>
                {address.phone && (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Phone className="w-3 h-3" strokeWidth={1.5} />
                        <span dir="ltr">{address.phone}</span>
                    </div>
                )}
                <p className="text-xs text-on-surface-variant">
                    {address.street && `${address.street}, `}
                    {address.district && `${address.district}, `}
                    {address.city}
                    {address.zipCode && ` ${address.zipCode}`}
                </p>
            </div>
        </div>
    )
}

function Row({ label, value, bold, primary }) {
    return (
        <div className="flex items-center justify-between">
            <span className={`${bold ? 'font-semibold' : 'text-on-surface-variant'} ${primary ? 'text-on-surface' : ''}`}>
                {label}
            </span>
            <span className={`${bold ? 'font-display text-lg' : ''} ${primary ? 'text-primary font-semibold' : ''}`}>
                {value}
            </span>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="space-y-4">
            <div className="h-20 bg-surface-container animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-surface-container animate-pulse" />
                ))}
            </div>
            <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-24 bg-surface-container animate-pulse" />
                ))}
            </div>
        </div>
    )
}

function ErrorState() {
    return (
        <div className="py-12 text-center">
            <p className="text-sm font-body text-red-600">فشل تحميل تفاصيل الطلب</p>
        </div>
    )
}