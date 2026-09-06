import { useState } from "react";
import { Outlet, Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { ROUTES } from "../../config/routes";
import {
  Palette, LayoutDashboard, Image, ShoppingBag,
  Wallet, Sparkles, User, LogOut, Menu, X, ArrowLeft,
  PanelRightClose, PanelRightOpen, BarChart3, Users, ScrollText
} from "lucide-react";
import { getMediaUrl } from '../../utils/media'
import logo2 from "../../assets/logo2.png";

export default function DashboardLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isDesktopOpen, setIsDesktopOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("dash-sidebar-open") !== "false";
  });

  const location = useLocation();

  const toggleDesktop = () => {
    setIsDesktopOpen((v) => {
      localStorage.setItem("dash-sidebar-open", String(!v));
      return !v;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const isAdmin = user?.role === "admin";
  const isArtist = user?.role === "artist";

  if (!isAdmin && !isArtist) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const artistLinks = [
    { to: ROUTES.ARTIST_DASHBOARD, label: "نظرة عامة", icon: LayoutDashboard, end: true },
    { to: ROUTES.MY_ARTWORKS, label: "لوحاتي", icon: Image },
    { to: ROUTES.ARTIST_ORDERS, label: "الطلبات الواردة", icon: ShoppingBag },
    { to: ROUTES.WALLET, label: "المحفظة والسحب", icon: Wallet },
    { to: ROUTES.SUBSCRIPTION, label: "اشتراكي", icon: Sparkles },
    { to: ROUTES.ARTIST_ANALYTICS, label: "الإحصائيات التفصيلية", icon: BarChart3 },
  ];

  const adminLinks = [
    { to: ROUTES.ADMIN, label: "نظرة عامة", icon: LayoutDashboard, end: true },
    { to: ROUTES.ADMIN_FINANCE, label: "المالية", icon: BarChart3 },
    { to: ROUTES.ADMIN_WITHDRAWALS, label: "طلبات السحب", icon: Wallet },
    { to: ROUTES.ADMIN_ORDERS, label: "إدارة الطلبات", icon: ShoppingBag },
    { to: ROUTES.ADMIN_ARTISTS, label: "إدارة الفنانين", icon: Palette },
    { to: ROUTES.ADMIN_ARTWORKS, label: "إدارة اللوحات", icon: Image },
    { to: ROUTES.ADMIN_USERS, label: "إدارة المستخدمين", icon: Users },
    { to: ROUTES.ADMIN_AUDIT_LOGS, label: "سجل العمليات", icon: ScrollText },
  ];

  const activeLinks = isAdmin ? adminLinks : artistLinks;

  // ─── Nav Links ───
  const renderLinks = (onClick, showLabels) =>
    activeLinks.map((link) => {
      const Icon = link.icon;
      return (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onClick}
          title={link.label}
          className={({ isActive }) =>
            `flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden ${showLabels ? "gap-3 px-4" : "gap-0 justify-center"
            } ${isActive
              ? "bg-[var(--color-primary)] text-white"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          {/* ✅ النص بيختفي من الـ layout خالص لما مقفول */}
          {showLabels && <span className="whitespace-nowrap">{link.label}</span>}
        </NavLink>
      );
    });

  return (
    <div className="min-h-screen bg-[var(--color-surface)] font-body flex" dir="rtl">
      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 right-0 z-40 flex-col bg-[var(--color-inverse-surface)] text-neutral-300 transition-all duration-300 overflow-hidden shadow-xl ${isDesktopOpen ? "w-64" : "w-[76px]"
          }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-neutral-800 shrink-0 ${isDesktopOpen ? "px-4" : "justify-center"}`}>
          <Link to={ROUTES.HOME} className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <img src={logo2} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className={`py-4 border-b border-neutral-800 flex items-center overflow-hidden shrink-0 ${isDesktopOpen ? "px-4 gap-3" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          {isDesktopOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <span className="text-xs text-[var(--color-secondary)]">
                {isAdmin ?? "مدير المنصة" }
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {renderLinks(undefined, isDesktopOpen)}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-neutral-800 shrink-0">
          <button
            onClick={logout}
            title="تسجيل الخروج"
            className={`flex items-center w-full py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition-all duration-200 overflow-hidden ${isDesktopOpen ? "gap-3 px-3" : "gap-0 justify-center"
              }`}
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            {isDesktopOpen && <span className="whitespace-nowrap">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ✅ Spacer ديناميكي */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ${isDesktopOpen ? "w-64" : "w-[76px]"
          }`}
      />

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/40 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={toggleDesktop}
              title={isDesktopOpen ? "طي القائمة" : "فتح القائمة"}
              className="hidden lg:flex p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] transition-colors"
            >
              {isDesktopOpen ? (
                <PanelRightClose className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <PanelRightOpen className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>

            <h1 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
              {isAdmin ? "لوحة تحكم الإدارة" : "لوحة تحكم الفنان"}
            </h1>
          </div>

          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/40 transition-all duration-200"
          >
            <span>تصفح الموقع</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ═══ Mobile Drawer ═══ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-[var(--color-inverse-surface)] text-neutral-300 flex flex-col transform transition-transform duration-300 lg:hidden ${isMobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800 shrink-0">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-white">
              فنون<span className="text-[var(--color-secondary)]">.sa</span>
            </span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
            <span className="text-xs text-[var(--color-secondary)]">
              {isAdmin ? "مدير المنصة" : "فنان تشكيلي"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {renderLinks(() => setIsMobileOpen(false), true)}
        </nav>

        <div className="p-3 border-t border-neutral-800">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}