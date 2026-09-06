import { useParams, Link } from 'react-router-dom'
import { MapPin, Eye, Calendar, Palette, Award, ChevronLeft, CheckCircle2, Globe, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useArtist } from '../hooks/useArtist'
import { reviewService } from '../../reviews/services/review.service'
import ArtworkCard from '../../../components/Ui/ArtworkCard'
import ReviewCard from '../../../components/Ui/ReviewCard'
import StarRating from '../../../components/Ui/StarRating'
import { getMediaUrl } from '../../../utils/media'
import { ROUTES } from '../../../config/routes'
import badge from "../../../assets/badge.png";

const PLAN_STYLES = {
    opal_prestige: { bg: 'bg-secondary', text: 'text-white', label: 'Prestige', icon: Award },
    opal_plus: { bg: 'bg-primary', text: 'text-white', label: 'Plus', icon: Palette },
    opal_classic: { bg: 'bg-surface-container-high', text: 'text-on-surface', label: 'Classic', icon: Palette },
}

// ✅ أيقونات SVG مضمونة (بدل lucide اللي ممكن تكون مش موجودة)
function InstagramIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    )
}

function FacebookIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 10h-4V7.5c0-.83.67-1.5 1.5-1.5H19V2h-4A4.5 4.5 0 0 0 10.5 6.5V10H7v4h3.5V22h5v-8H19z" />
        </svg>
    )
}

function SnapchatIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M7 15h10M7 9h10M12 19v2M12 2V4" />
        </svg>
    )
}

function TwitterIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
    )
}

export default function ArtistProfilePage() {
    const { id } = useParams()
    const { data, isLoading, isError } = useArtist(id)
    console.log(data)

    const { data: reviewsData } = useQuery({
        queryKey: ['artist-reviews-summary', id],
        queryFn: () => reviewService.getArtistReviews(id, { limit: 3 }),
        enabled: !!id,
    })

    if (isLoading) return <LoadingSkeleton />
    if (isError || !data) return <NotFoundState />

    const {
        name, avatar, bio, city, profileViewsCount, memberSince, plan, artworks,
        coverImage, socialLinks, isVerified, avgRating, reviewsCount
    } = data
    const recentReviews = reviewsData?.reviews || []
    const reviewsSummary = reviewsData?.summary || { avgRating: avgRating || 0, total: reviewsCount || 0 }

    const planStyle = PLAN_STYLES[plan?.id] || PLAN_STYLES.opal_classic
    const PlanIcon = planStyle.icon
    const memberSinceYear = memberSince ? new Date(memberSince).getFullYear() : null

    const hasSocial = socialLinks && (socialLinks.instagram || socialLinks.twitter || socialLinks.website || socialLinks.snapchat || socialLinks.facebook)

    return (
        <div className="min-h-screen bg-surface">
            {/* ═══ Breadcrumb ═══ */}
            <div className="border-b border-outline-variant/30 bg-surface-container-lowest">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-4">
                    <nav className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
                        <Link to={ROUTES.HOME} className="hover:text-primary transition-premium">الرئيسية</Link>
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <Link to={ROUTES.ARTISTS || '/artists'} className="hover:text-primary transition-premium">الفنانون</Link>
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="text-on-surface line-clamp-1">{name}</span>
                    </nav>
                </div>
            </div>

            {/* ═══ Hero Section (تصميم نظيف) ═══ */}
            <div className="bg-surface border-b border-outline-variant/30">
                {/* ─── Cover Image: ارتفاع ثابت، من غير aspect ratio ─── */}
                {coverImage && (
                    <div className="max-w-7xl mx-auto px-5 lg:px-16 pt-6">
                        <div className="h-44 md:h-60 lg:h-82 overflow-hidden bg-surface-container-high">
                            <img
                                src={getMediaUrl(coverImage)}
                                alt={`${name} cover`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-5 lg:px-16 pb-10">
                    {/* ─── Avatar + Name + Social: صف واحد، الأفاتار بس اللي بيoverlap ─── */}
                    <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8">
                        {/* Avatar — بيطلع فوق الـ cover شوية بس */}
                        <div className={`shrink-0 ${coverImage ? '-mt-10 md:-mt-14' : 'mt-12'}`}>
                            <div className="w-28 h-28 md:w-36 md:h-36 bg-surface-container-high overflow-hidden border-4 border-surface shadow-soft">
                                {avatar ? (
                                    <img src={getMediaUrl(avatar)} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="font-display text-5xl text-on-surface-variant">{name?.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name + Badges + Bio */}
                        <div className="flex-1 min-w-0 md:pb-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-1">
                                <h1 className="font-display text-3xl lg:text-4xl text-on-surface leading-tight tracking-tight">
                                    {name}
                                </h1>

                                {isVerified && (
                                    <img src={badge} alt="badge" className="w-12 h-12 object-contain mt-3" />
                                )}
                            </div>

                            {bio && (
                                <p className="text-base font-body text-on-surface-variant leading-relaxed max-w-2xl">
                                    {bio}
                                </p>
                            )}
                        </div>

                        {/* Social Links — جنب الاسم على الديسكتوب */}
                        {hasSocial && (
                            <div className="flex items-center gap-2 md:pb-2">
                                {socialLinks.facebook && (
                                    <a
                                        href={`https://facebook.com/${socialLinks.facebook.replace(/^@/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Facebook"
                                        title="Facebook"
                                        className="w-9 h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary transition-premium"
                                    >
                                        <FacebookIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {socialLinks.instagram && (
                                    <a
                                        href={`https://instagram.com/${socialLinks.instagram.replace(/^@/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                        title="Instagram"
                                        className="w-9 h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary transition-premium"
                                    >
                                        <InstagramIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {socialLinks.snapchat && (
                                    <a
                                        href={`https://snapchat.com/${socialLinks.snapchat.replace(/^@/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Snapchat"
                                        title="Snapchat"
                                        className="w-9 h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary transition-premium"
                                    >
                                        <SnapchatIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {socialLinks.twitter && (
                                    <a
                                        href={`https://twitter.com/${socialLinks.twitter.replace(/^@/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Twitter"
                                        title="Twitter / X"
                                        className="w-9 h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary transition-premium"
                                    >
                                        <TwitterIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {socialLinks.website && (
                                    <a
                                        href={socialLinks.website.startsWith("http") ? socialLinks.website : `https://${socialLinks.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Website"
                                        title="الموقع الإلكتروني"
                                        className="w-9 h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary transition-premium"
                                    >
                                        <Globe className="w-4 h-4" strokeWidth={1.5} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ─── Stats: صف منفصل تحت خط فاصل ─── */}
                    <div className="flex flex-wrap items-center gap-6 pt-6 mt-6 border-t border-outline-variant/20">
                        {city && (
                            <div className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
                                <MapPin className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                                <span>{city}، السعودية</span>
                            </div>
                        )}
                        {memberSinceYear && (
                            <div className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
                                <Calendar className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                                <span>عضو منذ {memberSinceYear}</span>
                            </div>
                        )}
                        {isVerified && (<div className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
                            <Eye className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                            <span>{profileViewsCount || 0} زيارة</span>
                        </div>)}
                        
                        <div className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
                            <StarRating value={reviewsSummary.avgRating || 0} size="sm" showNumber />
                            <span>({reviewsSummary.total || 0} تقييم)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Artworks Section ═══ */}
            <div className="max-w-7xl mx-auto px-5 lg:px-16 py-12 lg:py-16">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-[11px] font-body font-semibold tracking-[0.2em] uppercase text-secondary mb-2">
                            مجموعة الأعمال
                        </p>
                        <h2 className="font-display text-3xl lg:text-4xl text-on-surface">
                            أعمال <span className="text-primary">{name?.split(' ')[0]}</span>
                        </h2>
                    </div>
                    <div className="text-sm font-body text-on-surface-variant">
                        <span className="font-display text-2xl text-primary">{artworks?.total || 0}</span>
                        <span className="mr-1">عمل فني</span>
                    </div>
                </div>

                {artworks?.items?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                        {artworks.items.map((artwork) => (
                            <ArtworkCard key={artwork._id} artwork={artwork} showArtist={false} showDimensions={true} />
                        ))}
                    </div>
                ) : (
                    <EmptyArtworksState artistName={name} />
                )}
            </div>

            {/* ═══ Reviews Section ═══ */}
            <div className="max-w-7xl mx-auto px-5 lg:px-16 py-12 border-t border-outline-variant/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-[11px] font-body font-semibold tracking-[0.2em] uppercase text-secondary mb-2">
                            آراء المشتريين
                        </p>
                        <div className="flex items-center gap-3">
                            <h2 className="font-display text-3xl lg:text-4xl text-on-surface">
                                تقييمات <span className="text-primary">{name?.split(' ')[0]}</span>
                            </h2>
                            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 text-amber-600 rounded-full text-xs font-semibold">
                                <StarRating value={reviewsSummary.avgRating || 0} showNumber size="sm" />
                                <span>({reviewsSummary.total || 0})</span>
                            </div>
                        </div>
                    </div>

                    {(reviewsSummary.total || 0) > 0 && (
                        <Link
                            to={`/artists/${id}/reviews`}
                            className="text-sm font-body font-semibold text-secondary hover:text-primary transition-premium inline-flex items-center gap-1"
                        >
                            <span>عرض كل التقييمات ({reviewsSummary.total || 0})</span>
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {recentReviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentReviews.map((review) => (
                            <ReviewCard key={review._id} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-surface-container-low border border-outline-variant/30 p-6">
                        <p className="text-sm font-body text-on-surface-variant">
                            لا توجد تقييمات لهذا الفنان بعد.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-surface">
            <div className="bg-surface-container-low border-b border-outline-variant/30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-12 lg:py-16">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-32 h-32 lg:w-40 lg:h-40 bg-surface-container-high animate-pulse" />
                        <div className="flex-1 space-y-4">
                            <div className="h-12 w-64 bg-surface-container-high animate-pulse" />
                            <div className="h-4 w-full max-w-lg bg-surface-container-high animate-pulse" />
                            <div className="h-4 w-3/4 max-w-lg bg-surface-container-high animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[3/4] bg-surface-container-high" />
                            <div className="pt-4 space-y-2">
                                <div className="h-5 w-3/4 bg-surface-container-high" />
                                <div className="h-4 w-1/2 bg-surface-container-high" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function NotFoundState() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-surface">
            <div className="text-center space-y-4 px-5">
                <div className="w-20 h-20 mx-auto bg-surface-container-high flex items-center justify-center">
                    <Palette className="w-10 h-10 text-on-surface-variant" strokeWidth={1.5} />
                </div>
                <h1 className="font-display text-3xl text-on-surface">الفنان غير موجود</h1>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    عذراً، لم نتمكن من العثور على هذا الفنان.
                </p>
                <Link to={ROUTES.HOME}>
                    <button className="mt-4 px-6 py-3 bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-premium">
                        العودة للرئيسية
                    </button>
                </Link>
            </div>
        </div>
    )
}

function EmptyArtworksState({ artistName }) {
    return (
        <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto bg-surface-container-high flex items-center justify-center mb-4">
                <Palette className="w-10 h-10 text-on-surface-variant" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-2xl text-on-surface mb-2">لا توجد أعمال حالياً</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                {artistName} لم يرفع أي أعمال فنية بعد.
            </p>
        </div>
    )
}