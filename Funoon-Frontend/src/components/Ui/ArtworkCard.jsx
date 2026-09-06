import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Eye, Ruler, User, ShoppingBag, Check, Star } from 'lucide-react'
import { ROUTES } from '../../config/routes'
import { useFavorites } from '../../features/favorites/hooks/useFavorites'
import { useCart, useIsInCart } from '../../features/cart/hooks/useCart'
import { useAuthStore } from '../../features/auth/stores/authStore'
import toast from 'react-hot-toast'
import {getMediaUrl} from '../../utils/media'
import badge from "../../assets/badge.png";

/**
 * ArtworkCard - Museum-grade display for artworks
 */
export default function ArtworkCard({
    artwork,
    aspect = 'portrait',
    showArtist = true,
    showPrice = true,
    showDimensions = false,
    showFavorite = true,
    showAddToCart = true,
    className = '',
    onFavoriteToggle,
    onAddToCart,
}) {
    const navigate = useNavigate()
    const [isFavorite, setIsFavorite] = useState(artwork?.isFavorite ?? false)
    const [isAddingToCart, setIsAddingToCart] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const { toggleFavorite, isLoading: isTogglingFavorite } = useFavorites()
    const { addToCart } = useCart()

    const artworkId = artwork?._id ? String(artwork._id) : null
    const inCart = useIsInCart(artworkId)

    useEffect(() => {
        setIsFavorite(artwork?.isFavorite ?? false)
    }, [artworkId, artwork?.isFavorite])

    if (!artwork) return null

    const {
        title,
        coverImage,
        price,
        dimensions,
        artist,
        isSold,
        createdAt,
        _id
    } = artwork

    const requireAuth = () => {
        toast.error('سجل الدخول أولاً')
        navigate(ROUTES.LOGIN)
    }

    const aspectClasses = {
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
        landscape: 'aspect-[4/3]',
        tall: 'aspect-[4/5]',
    }

    const formatPrice = (value) => {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0,
        }).format(value)
    }

    const isNew = () => {
        if (!createdAt) return false
        const diff = Date.now() - new Date(createdAt).getTime()
        return diff < 3 * 24 * 60 * 60 * 1000
    }

    const handleFavoriteClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated) {
            requireAuth()
            return
        }

        const previousState = isFavorite
        const nextState = !isFavorite
        setIsFavorite(nextState)

        try {
            const result = await toggleFavorite(artworkId)
            if (typeof result?.isFavorite === 'boolean') {
                setIsFavorite(result.isFavorite)
            }
            onFavoriteToggle?.(nextState)
        } catch {
            setIsFavorite(previousState)
        }
    }

    const handleAddToCartClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (isSold || inCart || isAddingToCart) return

        if (!isAuthenticated) {
            requireAuth()
            return
        }

        setIsAddingToCart(true)
        try {
            await addToCart(artworkId)
            onAddToCart?.(artworkId)
        } catch {
            // toast handled in useCart
        } finally {
            setIsAddingToCart(false)
        }
    }
    const coverImageUrl = getMediaUrl(coverImage)

    return (
        <article
            className={`group relative ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image frame — buttons live outside any link */}
            <Link to={`/artworks/${artwork._id}`} className="">
                <div
                    className={`relative overflow-hidden bg-surface-container ${aspectClasses[aspect]}`}
                >
                    <img
                        src={coverImageUrl || '/placeholder-artwork.jpg'}
                        alt={title}
                        onLoad={() => setImageLoaded(true)}
                        className={`
                        absolute inset-0 w-full h-full object-cover
                        transition-transform duration-1200 ease-out
                        group-hover:scale-105
                        ${!imageLoaded ? 'opacity-0' : 'opacity-100'}
                    `}
                    />

                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-linear-to-br from-surface-container to-surface-container-high animate-pulse pointer-events-none" />
                    )}

                    <div
                        className={`
                        absolute inset-0 pointer-events-none
                        bg-linear-to-t from-black/80 via-black/20 to-transparent
                        transition-opacity duration-500
                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}
                    />

                    <div
                        className="
                        absolute inset-0 border-2 border-transparent pointer-events-none
                        group-hover:border-secondary/70
                        transition-all duration-500
                    "
                    />

                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 pointer-events-none">
                        {artwork.isFeatured && (
                            <div className="px-3 py-1 bg-[#C5A880] text-white text-[10px] font-body font-bold rounded-full backdrop-blur-sm flex items-center gap-1 shadow-xs">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                                <span>مميزة</span>
                            </div>
                        )}

                        {isSold && (
                            <div className="px-3 py-1.5 bg-primary text-white text-[10px] font-body font-bold tracking-[0.15em] uppercase backdrop-blur-sm">
                                مباع
                            </div>
                        )}

                        {!isSold && isNew() && (
                            <div className="px-3 py-1.5 bg-secondary text-white text-[10px] font-body font-bold tracking-[0.15em] uppercase backdrop-blur-sm">
                                جديد
                            </div>
                        )}
                    </div>

                    {showFavorite && !isSold && (
                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                            aria-pressed={isFavorite}
                            className={`
                            absolute top-3 left-3 z-20
                            w-10 h-10
                            flex items-center justify-center
                            bg-white/90 backdrop-blur-sm
                            border border-outline-variant/30
                            transition-premium cursor-pointer
                            ${isFavorite ? 'text-primary' : 'text-on-surface-variant'}
                            hover:text-primary
                        `}
                        >
                            {isTogglingFavorite ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                                <Heart
                                    className="w-4 h-4"
                                    strokeWidth={1.5}
                                    fill={isFavorite ? 'currentColor' : 'none'}
                                />
                            )}
                        </button>
                    )}

                    <div
                        className={`
                        absolute bottom-0 right-0 left-0 p-4 z-10 pointer-events-none
                        translate-y-4
                        transition-all duration-500
                        ${isHovered ? 'translate-y-0 opacity-100' : 'opacity-0'}
                    `}
                    >
                        <div className="flex items-center justify-center gap-2 text-white/90 mb-2">

                            <Eye className="w-4 h-4" strokeWidth={1.5} />
                            <span className="text-xs font-body font-semibold tracking-wider uppercase">
                                عرض التفاصيل
                            </span>

                        </div>

                        {showDimensions && dimensions && (
                            <div className="flex items-center justify-center gap-1.5 text-white/70 text-xs font-body">
                                <Ruler className="w-3 h-3" strokeWidth={1.5} />
                                <span>
                                    {dimensions.width} × {dimensions.height} سم
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-5 pb-2">
                    <h3 className="font-display text-lg text-on-surface leading-tight line-clamp-1 group-hover:text-primary transition-premium">
                        {title}
                    </h3>

                    {showArtist && artist && (
                        <div className="flex items-center gap-2 group/artist mt-3">
                            <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                                {artist.avatar ? (
                                    <img
                                        src={getMediaUrl(artist.avatar)}
                                        alt={artist.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-3 h-3 text-on-surface-variant" strokeWidth={1.5} />
                                )}
                            </div>

                            <span className="text-xs font-body font-medium tracking-wide text-on-surface-variant group-hover/artist:text-primary transition-premium line-clamp-1">
                                {artist.name}
                            </span>

                            {artist.isVerified && (
                                <img src={badge} alt="badge" className="w-7 h-7 object-contain pt-1" />
                            )}
                        </div>
                    )}

                    <div className="my-4 border-t border-outline-variant/40" />

                    <div className="flex items-end justify-between gap-3">
                        {showPrice && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-on-surface-variant mb-1">
                                    {isSold ? 'سعر البيع' : 'السعر'}
                                </span>
                                <span
                                    className={`
                                    font-display flex items-center gap-1.5 text-xl leading-none
                                    ${isSold ? 'text-on-surface-variant line-through' : 'text-primary'}
                                `}
                                >
                                    {formatPrice(price)}
                                    <img src="/src/assets/sa.svg" className="w-4 h-4 opacity-80" alt="SAR" />
                                </span>

                                {showDimensions && dimensions && (
                                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-on-surface-variant font-body">
                                        <Ruler className="w-3 h-3" strokeWidth={1.5} />
                                        <span>
                                            {dimensions.width}×{dimensions.height} سم
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {showAddToCart && (
                            <button
                                type="button"
                                onClick={handleAddToCartClick}
                                disabled={isSold || inCart || isAddingToCart}
                                aria-label={
                                    isSold
                                        ? 'العمل مباع'
                                        : inCart
                                            ? 'مضاف للسلة'
                                            : 'أضف للسلة'
                                }
                                title={
                                    isSold
                                        ? 'هذا العمل مباع'
                                        : inCart
                                            ? 'مضاف للسلة بالفعل'
                                            : 'أضف للسلة'
                                }
                                className={`
                                relative shrink-0 z-10
                                w-9 h-9
                                flex items-center justify-center
                                border transition-premium cursor-pointer
                                ${isSold
                                        ? 'bg-surface-container text-on-surface-variant/50 border-outline-variant/30 cursor-not-allowed'
                                        : inCart
                                            ? 'bg-secondary/10 text-secondary border-secondary'
                                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
                                    }
                                ${!isSold && !inCart && !isAddingToCart ? 'hover:scale-105' : ''}
                            `}
                            >
                                {isAddingToCart ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary" />
                                ) : inCart ? (
                                    <Check className="w-4 h-4" strokeWidth={2} />
                                ) : (
                                    <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    )
}
