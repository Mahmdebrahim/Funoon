import { useState } from 'react'
import { Outlet, Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { ROUTES } from '../../config/routes'
import { 
  Palette, LayoutDashboard, Image, ShoppingBag, 
  Wallet, Sparkles, User, ShieldAlert, LogOut, Menu, X, ArrowLeft
} from 'lucide-react'

export default function DashboardLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // Protect route
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Determine role and menu items
  const isAdmin = user?.role === 'admin'
  const isArtist = user?.role === 'artist'

  // If user is buyer but trying to access dashboard, redirect to home
  if (!isAdmin && !isArtist) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  // Sidebar Links
  const artistLinks = [
    { to: ROUTES.ARTIST_DASHBOARD, label: 'الرئيسية (الإحصائيات)', icon: LayoutDashboard, end: true },
    { to: ROUTES.MY_ARTWORKS, label: 'لوحاتي الفنية', icon: Image },
    { to: ROUTES.ARTIST_ORDERS, label: 'الطلبات الواردة', icon: ShoppingBag },
    { to: ROUTES.WALLET, label: 'المحفظة والسحب', icon: Wallet },
    { to: ROUTES.SUBSCRIPTION, label: 'اشتراكي (الباقة)', icon: Sparkles },
    { to: ROUTES.PROFILE, label: 'الملف الشخصي', icon: User },
  ]

  const adminLinks = [
    { to: ROUTES.ADMIN, label: 'الرئيسية (الإحصائيات)', icon: LayoutDashboard, end: true },
    { to: ROUTES.ADMIN_WITHDRAWALS, label: 'طلبات السحب', icon: Wallet },
    { to: ROUTES.ADMIN_ORDERS, label: 'إدارة الطلبات', icon: ShoppingBag },
    { to: ROUTES.ADMIN_ARTISTS, label: 'إدارة الفنانين', icon: Palette },
  ]

  const activeLinks = isAdmin ? adminLinks : artistLinks

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-900 text-stone-300 border-l border-stone-800 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-stone-800">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-premium">
              <Palette className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-500 transition-premium">
              فنون<span className="text-amber-500">.sa</span>
            </span>
          </Link>
        </div>

        {/* Sidebar User Info */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
            <span className="text-xs text-stone-500">
              {isAdmin ? 'مدير المنصة' : 'فنان تشكيلي'}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {activeLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-premium ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                      : 'hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-premium"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-stone-150 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-50 transition-premium"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-stone-900">
              {isAdmin ? 'لوحة تحكم الإدارة' : 'لوحة تحكم الفنان'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to={ROUTES.HOME} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-amber-600 hover:bg-stone-50 border border-stone-250 transition-premium"
            >
              <span>تصفح الموقع</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Main content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Sidebar - Mobile drawer backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-stone-900 text-stone-300 flex flex-col transform transition-transform duration-300 lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-stone-800">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center">
              <Palette className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">فنون<span className="text-amber-500">.sa</span></span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {activeLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-premium ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'hover:bg-stone-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button
            onClick={() => {
              setIsSidebarOpen(false)
              logout()
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-premium"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  )
}
