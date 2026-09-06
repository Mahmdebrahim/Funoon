import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import ArtworkCard from '../../../components/Ui/ArtworkCard'
import { artworksService } from '../services/artworks.service'
import Button from '../../../components/Ui/Button'

import { CATEGORIES, PAINT_TYPES, CANVAS_THICKNESS_OPTIONS, DIMENSION_TYPES } from '../constants/filters'

// ═══════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════
const SORT_OPTIONS = [
    { value: 'priority', label: 'الأكثر تميزاً' }, // VIP first
    { value: 'newest', label: 'الأحدث' },
    { value: 'price_asc', label: 'السعر: من الأقل' },
    { value: 'price_desc', label: 'السعر: من الأعلى' },
    { value: 'popular', label: 'الأكثر شعبية' },
]

const PRICE_RANGES = [
    { value: '0-1000', label: 'أقل من 1,000', min: 0, max: 1000 },
    { value: '1000-2500', label: '1,000 - 2,500', min: 1000, max: 2500 },
    { value: '2500-4000', label: '2,500 - 4,000', min: 2500, max: 4000 },
    { value: '4000-5000', label: '4,000 - 5,000', min: 4000, max: 5000 },
]

const SUBSCRIPTION_PLANS = [
    { value: 'opal_prestige', label: 'Prestige (VIP)' },
    // { value: 'opal_plus', label: 'Plus' },
    // { value: 'opal_classic', label: 'Classic' },
]

const SIZE_OPTIONS = [
    { value: 'small', label: 'صغير', description: 'أقل من 30 سم' },
    { value: 'medium', label: 'متوسط', description: '30 - 60 سم' },
    { value: 'large', label: 'كبير', description: '60 - 100 سم' },
    { value: 'giant', label: 'ضخم', description: 'أكثر من 100 سم' },
]

const RATING_OPTIONS = [
    { value: 5, label: '5 نجوم', stars: 5 },
    { value: 4, label: '4 نجوم فأكثر', stars: 4 },
    { value: 3, label: '3 نجوم فأكثر', stars: 3 },
    { value: 2, label: '2 نجوم فأكثر', stars: 2 },
]

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
export default function BrowseArtworksPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    // Parse filters from URL
    const filters = useMemo(() => {
        const parseArray = (v) => (!v ? [] : Array.isArray(v) ? v : v.split(','))
        const parseIntOrNull = (v) => { const p = parseInt(v); return isNaN(p) ? null : p }

        return {
            sort: searchParams.get('sort') || 'priority',
            page: parseInt(searchParams.get('page')) || 1,
            limit: 6,
            search: searchParams.get('search') || '',
            category: parseArray(searchParams.get('category')),
            medium: parseArray(searchParams.get('medium')),
            paintType: parseArray(searchParams.get('paintType')),
            canvasThickness: parseArray(searchParams.get('canvasThickness')),
            dimensionType: parseArray(searchParams.get('dimensionType')),
            size: parseArray(searchParams.get('size')),
            tags: parseArray(searchParams.get('tags')),
            subscriptionPlan: parseArray(searchParams.get('subscriptionPlan')),
            minPrice: parseIntOrNull(searchParams.get('minPrice')),
            maxPrice: parseIntOrNull(searchParams.get('maxPrice')),
            minRating: parseIntOrNull(searchParams.get('minRating')),
        }
    }, [searchParams])

    // Update filter
    const setFilter = (key, value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (key !== 'page') next.set('page', '1') // Reset page on filter change

            if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                next.delete(key)
            } else if (Array.isArray(value)) {
                next.set(key, value.join(','))
            } else {
                next.set(key, String(value))
            }
            return next
        }, { replace: true })
    }

    const toggleArrayFilter = (key, value) => {
        const current = filters[key] || []
        const newValue = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value]
        setFilter(key, newValue)
    }

    const clearFilters = () => setSearchParams({}, { replace: true })

    const goToPage = (page) => setFilter('page', page)

    // Fetch
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['artworks', filters],
        queryFn: () => artworksService.getArtworks(filters),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
    })

    const { data: filterOptions } = useQuery({
        queryKey: ['filterOptions'],
        queryFn: artworksService.getFilterOptions,
        staleTime: 30 * 60 * 1000,
    })

    const artworks = data?.artworks || []
    const pagination = data?.pagination || { total: 0, page: 1, pages: 0 }

    const activeFiltersCount =
        filters.category.length + filters.medium.length +
        filters.paintType.length + filters.canvasThickness.length + filters.dimensionType.length +
        filters.tags.length +
        filters.size.length + filters.subscriptionPlan.length +
        (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
        (filters.minRating !== null ? 1 : 0) +
        (filters.search ? 1 : 0)

    return (
        <div className="min-h-screen bg-surface">
            {/* ═══ Sort Bar ═══ */}
            <div className="bg-surface-container-lowest border-b border-outline-variant/40 sticky top-20 z-30">
                <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-body text-on-surface-variant">
                                {isFetching ? '...' : pagination.total || 0} عمل فني
                            </span>
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-outline-variant"
                            >
                                <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
                                <span className="text-sm font-body">الفلاتر</span>
                                {activeFiltersCount > 0 && (
                                    <span className="w-5 h-5 bg-secondary text-white text-xs font-bold flex items-center justify-center rounded-full">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" strokeWidth={1.5} />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilter('search', e.target.value)}
                                    placeholder="ابحث بالأسم أو الوصف أو كلمات مفناحيه أو التصنيف..."
                                    className="w-full pr-10 pl-10 py-2.5 bg-surface-container-low border border-outline-variant/50 text-sm font-body focus:outline-none focus:border-secondary"
                                />
                                {filters.search && (
                                    <button onClick={() => setFilter('search', '')} className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <X className="w-4 h-4" strokeWidth={1.5} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={filters.sort}
                                onChange={(e) => setFilter('sort', e.target.value)}
                                className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/50 text-sm font-body cursor-pointer"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Active Filters ═══ */}
            {activeFiltersCount > 0 && (
                <div className="bg-surface border-b border-outline-variant/40">
                    <div className="max-w-7xl mx-auto px-5 lg:px-16 py-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-body font-semibold text-on-surface-variant uppercase">الفلاتر:</span>
                        {filters.search && <Chip label={`بحث: ${filters.search}`} onRemove={() => setFilter('search', '')} />}
                        {filters.tags.map((t) => <Chip key={t} label={t} onRemove={() => toggleArrayFilter('tags', t)} />)}
                        {filters.category.map((c) => <Chip key={c} label={c} onRemove={() => toggleArrayFilter('category', c)} />)}
                        {filters.paintType.map((pt) => <Chip key={pt} label={pt} onRemove={() => toggleArrayFilter('paintType', pt)} />)}
                        {filters.canvasThickness.map((ct) => <Chip key={ct} label={ct} onRemove={() => toggleArrayFilter('canvasThickness', ct)} />)}
                        {filters.dimensionType.map((dt) => <Chip key={dt} label={dt === '2D' ? 'ثنائي الأبعاد (2D)' : 'ثلاثي الأبعاد (3D)'} onRemove={() => toggleArrayFilter('dimensionType', dt)} />)}
                        {filters.medium.map((m) => <Chip key={m} label={m} onRemove={() => toggleArrayFilter('medium', m)} />)}
                        {filters.subscriptionPlan.map((p) => <Chip key={p} label={p} onRemove={() => toggleArrayFilter('subscriptionPlan', p)} />)}
                        {(filters.minPrice !== null || filters.maxPrice !== null) && (
                            <Chip label="السعر" onRemove={() => { setFilter('minPrice', null); setFilter('maxPrice', null) }} />
                        )}
                        {filters.minRating !== null && (
                            <Chip
                                label={`${filters.minRating}★ فأكثر`}
                                onRemove={() => setFilter('minRating', null)}
                            />
                        )}
                        <button onClick={clearFilters} className="text-xs font-semibold text-primary hover:text-secondary mr-auto">
                            مسح الكل
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Main Content ═══ */}
            <div className="max-w-7xl mx-auto px-5 lg:px-16 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-40 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                            <FilterSection title="تقييم الفنان" defaultOpen={true}>
                                <RatingFilter
                                    value={filters.minRating}
                                    onChange={(val) => setFilter('minRating', val)}
                                />
                            </FilterSection>

                            <FilterSection title="التصنيف الفني" defaultOpen={false}>
                                {CATEGORIES.map((cat) => (
                                    <Checkbox key={cat.value} label={cat.label} checked={filters.category.includes(cat.value)} onChange={() => toggleArrayFilter('category', cat.value)} />
                                ))}
                            </FilterSection>

                            <FilterSection title="نوع الألوان" defaultOpen={false}>
                                {PAINT_TYPES.map((pt) => (
                                    <Checkbox key={pt.value} label={pt.label} checked={filters.paintType.includes(pt.value)} onChange={() => toggleArrayFilter('paintType', pt.value)} />
                                ))}
                            </FilterSection>

                            <FilterSection title="سماكة الكانفاس" defaultOpen={false}>
                                {CANVAS_THICKNESS_OPTIONS.map((ct) => (
                                    <Checkbox key={ct.value} label={ct.label} checked={filters.canvasThickness.includes(ct.value)} onChange={() => toggleArrayFilter('canvasThickness', ct.value)} />
                                ))}
                            </FilterSection>

                            <FilterSection title="نوع البُعد (2D / 3D)" defaultOpen={false}>
                                {DIMENSION_TYPES.map((dt) => (
                                    <Checkbox key={dt.value} label={dt.label} checked={filters.dimensionType.includes(dt.value)} onChange={() => toggleArrayFilter('dimensionType', dt.value)} />
                                ))}
                            </FilterSection>

                            <FilterSection title="السعر">
                                {PRICE_RANGES.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => {
                                            if (range.max == null) {
                                                setFilter('minPrice', range.min)
                                                setFilter('maxPrice', null)
                                            }
                                            filters.minPrice === range.min && filters.maxPrice === range.max
                                                ? (setFilter('minPrice', null), setFilter('maxPrice', null))
                                                : (setFilter('minPrice', range.min), setFilter('maxPrice', range.max))
                                        }
                                        }
                                        className={`w-full text-right px-3 py-2 text-sm border transition-premium ${filters.minPrice === range.min && filters.maxPrice === range.max
                                            ? 'bg-secondary/10 border-secondary text-secondary'
                                            : 'border-transparent hover:bg-surface-container'
                                            }`}
                                    >
                                        {range.label} ر.س
                                    </button>
                                ))}
                            </FilterSection>

                            <FilterSection title="الحجم" defaultOpen={false}>
                                {SIZE_OPTIONS.map((s) => (
                                    <Checkbox
                                        key={s.value}
                                        label={`${s.label} - ${s.description}`}
                                        checked={filters.size.includes(s.value)}
                                        onChange={() => toggleArrayFilter('size', s.value)}
                                    />
                                ))}
                            </FilterSection>

                            <FilterSection title=" الفنان">
                                {SUBSCRIPTION_PLANS.map((plan) => (
                                    <Checkbox
                                        key={plan.value}
                                        label={plan.label}
                                        checked={filters.subscriptionPlan.includes(plan.value)}
                                        onChange={() => toggleArrayFilter('subscriptionPlan', plan.value)}
                                    />
                                ))}
                            </FilterSection>


                        </div>
                    </aside>

                    {/* Grid */}
                    <main className="flex-1">
                        {isLoading ? (
                            <LoadingGrid />
                        ) : artworks.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                                    {artworks.map((artwork) => (
                                        <ArtworkCard key={artwork._id} artwork={artwork} aspect="portrait" showDimensions={true} />
                                    ))}
                                </div>

                                {/* ═══ Pagination ═══ */}
                                {pagination.pages > 1 && (
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.pages}
                                        onPageChange={goToPage}
                                        isLoading={isFetching}
                                    />
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileFiltersOpen && (
                <MobileDrawer
                    filters={filters}
                    filterOptions={filterOptions}
                    toggleArrayFilter={toggleArrayFilter}
                    setFilter={setFilter}
                    clearFilters={clearFilters}
                    onClose={() => setMobileFiltersOpen(false)}
                />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════
// Pagination Component
// ═══════════════════════════════════════════════════
function Pagination({ currentPage, totalPages, onPageChange, isLoading }) {
    const pages = []

    // Logic: show first, last, current ± 1, and ellipsis
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i)
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...')
        }
    }

    return (
        <div className="flex items-center justify-center gap-2 pt-12">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="w-10 h-10 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-premium"
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            {pages.map((page, idx) => (
                page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-on-surface-variant">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        disabled={isLoading}
                        className={`w-10 h-10 flex items-center justify-center text-sm font-body transition-premium ${page === currentPage
                            ? 'bg-primary text-white'
                            : 'border border-outline-variant text-on-surface hover:border-secondary hover:text-secondary'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {page}
                    </button>
                )
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="w-10 h-10 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-premium"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
        </div>
    )
}

// ═══════════════════════════════════════════════════
// Mobile Drawer
// ═══════════════════════════════════════════════════
function MobileDrawer({ filters, filterOptions, toggleArrayFilter, setFilter, clearFilters, onClose }) {
    return (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mr-auto w-80 max-w-full bg-surface-container-lowest h-full overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-xl">الفلاتر</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-4">
                    <FilterSection title="التصنيف الفني" defaultOpen={false}>
                        {CATEGORIES.map((cat) => (
                            <Checkbox key={cat.value} label={cat.label} checked={filters.category.includes(cat.value)} onChange={() => toggleArrayFilter('category', cat.value)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="نوع الألوان" defaultOpen={false}>
                        {PAINT_TYPES.map((pt) => (
                            <Checkbox key={pt.value} label={pt.label} checked={filters.paintType.includes(pt.value)} onChange={() => toggleArrayFilter('paintType', pt.value)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="سماكة الكانفاس" defaultOpen={false}>
                        {CANVAS_THICKNESS_OPTIONS.map((ct) => (
                            <Checkbox key={ct.value} label={ct.label} checked={filters.canvasThickness.includes(ct.value)} onChange={() => toggleArrayFilter('canvasThickness', ct.value)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="نوع البُعد (2D / 3D)" defaultOpen={false}>
                        {DIMENSION_TYPES.map((dt) => (
                            <Checkbox key={dt.value} label={dt.label} checked={filters.dimensionType.includes(dt.value)} onChange={() => toggleArrayFilter('dimensionType', dt.value)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="اشتراك الفنان" defaultOpen={false}>
                        {SUBSCRIPTION_PLANS.map((plan) => (
                            <Checkbox key={plan.value} label={plan.label} checked={filters.subscriptionPlan.includes(plan.value)} onChange={() => toggleArrayFilter('subscriptionPlan', plan.value)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="تقييم الفنان" defaultOpen={true}>
                        <RatingFilter
                            value={filters.minRating}
                            onChange={(val) => setFilter('minRating', val)}
                        />
                    </FilterSection>

                    <FilterSection title="السعر" defaultOpen={false}>
                        {PRICE_RANGES.map((range) => (
                            <button
                                key={range.value}
                                onClick={() =>
                                    filters.minPrice === range.min && filters.maxPrice === range.max
                                        ? (setFilter('minPrice', null), setFilter('maxPrice', null))
                                        : (setFilter('minPrice', range.min), setFilter('maxPrice', range.max))
                                }
                                className={`w-full text-right px-3 py-2 text-sm border transition-premium ${filters.minPrice === range.min && filters.maxPrice === range.max
                                    ? 'bg-secondary/10 border-secondary text-secondary'
                                    : 'border-transparent hover:bg-surface-container'
                                    }`}
                            >
                                {range.label} ر.س
                            </button>
                        ))}
                    </FilterSection>
                </div>

                <div className="mt-6 flex gap-2 sticky bottom-0 bg-surface-container-lowest pt-4">
                    <Button variant="primary" size="md" fullWidth onClick={onClose}>تطبيق</Button>
                    <Button variant="outline" size="md" onClick={clearFilters}>مسح</Button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════
// Small Components
// ═══════════════════════════════════════════════════
function Chip({ label, onRemove }) {
    return (
        <button onClick={onRemove} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 text-sm hover:border-primary hover:text-primary transition-premium">
            <span>{label}</span>
            <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
    )
}

function FilterSection({ title, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    return (
        <div className="bg-surface-container-lowest border border-outline-variant/40 ">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-premium cursor-pointer">
                <h3 className="text-sm font-semibold uppercase text-on-surface">{title}</h3>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </button>
            {isOpen && <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/30 pt-3">{children}</div>}
        </div>
    )
}

function RatingFilter({ value, onChange }) {
    return (
        <div className="space-y-1">
            {RATING_OPTIONS.map((opt) => {
                const isActive = value === opt.value
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(isActive ? null : opt.value)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-premium border ${isActive
                                ? 'bg-secondary/10 border-secondary text-secondary'
                                : 'border-transparent hover:bg-surface-container'
                            }`}
                    >
                        <span className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${star <= opt.value
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-outline-variant'
                                        }`}
                                    strokeWidth={1.5}
                                />
                            ))}
                        </span>
                        <span className="font-body text-xs">{opt.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-secondary cursor-pointer" />
            <span className="text-sm">{label}</span>
        </label>
    )
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-surface-container" />
                    <div className="pt-4 space-y-2">
                        <div className="h-5 bg-surface-container w-3/4" />
                        <div className="h-4 bg-surface-container w-1/2" />
                        <div className="h-6 bg-surface-container w-1/3 mt-3" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function EmptyState() {
    return (
        <div className="py-20 text-center">
            <h3 className="font-display text-2xl text-on-surface mb-2">لا توجد نتائج</h3>
            <p className="text-sm text-on-surface-variant">جرّب تغيير الفلاتر أو مسحها</p>
        </div>
    )
}


