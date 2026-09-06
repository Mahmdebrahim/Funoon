import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { useCartStore } from '../../features/cart/stores/cartStore'
import { getMediaUrl } from '../../utils/media'
import Button from '../Ui/Button'

import NotificationBell from '../NotificationBell'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Palette,
  Package,
  Heart,
  Settings,
  ChevronDown,
  LogInIcon,
} from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const cartItems = useCartStore((s) => s.items)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)   

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate(ROUTES.HOME)
  }

  const avatarUrl = getMediaUrl(user?.avatar)

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-[var(--color-outline-variant)]/30">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        <div className="flex justify-between h-20 items-center">

          {/* ═══════════════════════════════════════════════════ */}
          {/* Logo + Main Navigation                            */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center group">
              <img
                src="/src/assets/funoon_logo_gold.png"
                alt="Funoon"
                className="h-10 w-auto transition-premium group-hover:opacity-80"
              />
            </Link>

            {/* Main Nav - Desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                to={ROUTES.ARTWORKS}
                className="relative text-[var(--color-on-surface)] font-body text-sm font-medium tracking-wide hover:text-[var(--color-primary)] transition-premium group"
              >
                المعرض
                <span className="absolute -bottom-1 right-0 w-0 h-[1.5px] bg-[var(--color-secondary)] transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to={ROUTES.FEATURED}
                className="relative text-[var(--color-on-surface)] font-body text-sm font-medium tracking-wide hover:text-[var(--color-primary)] transition-premium group flex items-center gap-1"
              >
                <span>المميزة</span>
                <span className="absolute -bottom-1 right-0 w-0 h-[1.5px] bg-[var(--color-secondary)] transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to={ROUTES.ARTISTS}
                className="relative text-[var(--color-on-surface)] font-body text-sm font-medium tracking-wide hover:text-[var(--color-primary)] transition-premium group"
              >
                الفنانون
                <span className="absolute -bottom-1 right-0 w-0 h-[1.5px] bg-[var(--color-secondary)] transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to={ROUTES.SUBSCRIPTIONS}
                className="relative text-[var(--color-on-surface)] font-body text-sm font-medium tracking-wide hover:text-[var(--color-primary)] transition-premium group"
              >
                الاشتراكات
                <span className="absolute -bottom-1 right-0 w-0 h-[1.5px] bg-[var(--color-secondary)] transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to={ROUTES.CONTACT_US}
                className="relative text-[var(--color-on-surface)] font-body text-sm font-medium tracking-wide hover:text-[var(--color-primary)] transition-premium group"
              >
                تواصل معنا
                <span className="absolute -bottom-1 right-0 w-0 h-[1.5px] bg-[var(--color-secondary)] transition-all duration-300 group-hover:w-full" />
              </Link>
            </nav>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* Actions (Right side in RTL)                       */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-3">

            {/* Cart Icon */}
            <Link
              to={ROUTES.CART}
              className="relative p-2.5 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer group"
              aria-label="السلة"
            >
              <ShoppingCart className="w-5 h-5  group-hover:text-[var(--color-primary)] transition-premium" strokeWidth={1.5} />
              {/* Cart Badge */}
              {cartItems?.length > 0 && (
                <span className="absolute top-1 left-0 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--color-surface)]">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* ✅ 🔔 الجرس — بيظهر بس لو مسجل دخول */}
            {isAuthenticated && <NotificationBell />}

            {/* ═══ Authenticated User ═══ */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">

                {/* Admin/Artist Dashboard Badge */}
                {user?.role === 'admin' && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wider uppercase bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-premium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                    الإدارة
                  </Link>
                )}

                {user?.role === 'artist' && (
                  <Link
                    to={ROUTES.ARTIST_DASHBOARD}
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wider uppercase bg-inverse-surface text-white hover:bg-inverse-surface/70 transition-premium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2} />
                    لوحة التحكم
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex cursor-pointer items-center gap-2 p-1 pr-3"
                  >
                    <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[var(--color-on-surface-variant)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl shadow-xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]/40">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>

                      <nav className="py-2">
                        <Link
                          to={ROUTES.PROFILE}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-premium"
                        >
                          <User className="w-4 h-4" strokeWidth={1.5} />
                          الملف الشخصي
                        </Link>
                        <Link
                          to={ROUTES.ORDERS}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-premium"
                        >
                          <Package className="w-4 h-4" strokeWidth={1.5} />
                          طلباتي
                        </Link>
                        <Link
                          to={ROUTES.FAVORITES}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-premium"
                        >
                          <Heart className="w-4 h-4" strokeWidth={1.5} />
                          المفضلة
                        </Link>
                        <Link
                          to={ROUTES.SETTINGS}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-premium"
                        >
                          <Settings className="w-4 h-4" strokeWidth={1.5} />
                          الإعدادات
                        </Link>
                      </nav>

                      <div className="py-2 border-t border-[var(--color-outline-variant)]/30">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-premium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" strokeWidth={1.5} />
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* ═══ Guest User ═══ */
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-premium flex items-center gap-2"
                >
                  تسجيل الدخول
                  <LogInIcon className="w-4 h-4 mt-1" strokeWidth={1.5} />
                </Link>
                {/* <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">
                    انضم كفنان
                  </Button>
                </Link> */}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-full hover:bg-[var(--color-surface-container)] transition-premium"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[var(--color-on-surface)]" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5 text-[var(--color-on-surface)]" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Mobile Menu                                         */}
      {/* ═══════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
          <nav className="max-w-[1280px] mx-auto px-5 py-4 space-y-1">
            <Link
              to={ROUTES.ARTWORKS}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] transition-premium"
            >
              المعرض
            </Link>
            <Link
              to={ROUTES.ARTISTS}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] transition-premium"
            >
              الفنانون
            </Link>
            <Link
              to={ROUTES.SUBSCRIPTIONS}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] transition-premium"
            >
              الاشتراكات
            </Link>

            {isAuthenticated && (
              <Link
                to={ROUTES.NOTIFICATIONS}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] transition-premium"
              >
                الإشعارات
              </Link>
            )}

            {!isAuthenticated && (
              <div className="pt-3 mt-3 border-t border-[var(--color-outline-variant)] flex flex-col gap-2">
                <Button
                  as={Link}
                  to={ROUTES.LOGIN}
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setMobileMenuOpen(false)}
                >
                  تسجيل الدخول
                </Button>
                {/* <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="md" fullWidth
                    onClick={() => setMobileMenuOpen(false)}>
                    انضم كفنان
                  </Button>
                </Link> */}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}