import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { ShoppingCart, User, Menu, LogOut, Palette, LayoutDashboard, ShieldCheck } from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-stone-150 transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-8">
            <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
              <img src='src\assets\funoon_logo_gold.png' alt=' ' className='w-18' />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to={ROUTES.ARTWORKS} className="text-stone-600 hover:text-amber-600 font-medium transition-premium">
                المعرض الفني
              </Link>
              <Link to={ROUTES.ARTISTS} className="text-stone-600 hover:text-amber-600 font-medium transition-premium">
                الفنانون
              </Link>
            </nav>
          </div>

          {/* User actions / Cart / Login */}
          <div className="flex items-center gap-4">
            <Link 
              to={ROUTES.CART} 
              className="p-2.5 rounded-xl text-stone-600 hover:text-amber-600 hover:bg-stone-50 transition-premium relative"
            >
              <ShoppingCart className="w-5.5 h-5.5" />
              {/* Optional: Cart Badge can be added here */}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <Link 
                    to={ROUTES.ADMIN} 
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-premium"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    لوحة التحكم
                  </Link>
                )}
                
                {user?.role === 'artist' && (
                  <Link 
                    to={ROUTES.ARTIST_DASHBOARD} 
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-premium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    لوحة الفنان
                  </Link>
                )}

                <Link 
                  to={ROUTES.PROFILE} 
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-stone-50/50 transition-premium"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 font-bold overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-stone-700">
                    {user?.name || 'الملف الشخصي'}
                  </span>
                </Link>

                <button 
                  onClick={logout} 
                  className="p-2.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-premium"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to={ROUTES.LOGIN} 
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:text-stone-900 transition-premium"
                >
                  تسجيل الدخول
                </Link>
                <Link 
                  to={ROUTES.REGISTER} 
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-amber-600 shadow-sm transition-premium"
                >
                  انضم كفنان
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
