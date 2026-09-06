import { Routes, Route } from "react-router-dom";
import { ROUTES } from "../config/routes";
import ProtectedRoute from "../components/ProtectedRoute";

// Layouts
import PublicLayout from "../components/layout/PublicLayout";
import AuthLayout from "../components/layout/AuthLayout";
import DashboardLayout from "../components/layout/DashboardLayout";

// Public
import Home from "../features/home/pages/Home";
import BrowseArtworksPage from "../features/artworks/pages/ArtworksPage";
import FeaturedArtworksPage from "../features/artworks/pages/FeaturedArtworksPage";
import ArtworkDetailsPage from "../features/artworks/pages/ArtworkDetails";
import ArtistsPage from "../features/artist/pages/ArtistsPage";
import ArtistProfilePage from "../features/artist/pages/ArtistProfilePage";
import ContactUsPage from "../features/pages/ContactPage";

// Auth
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPassword";
import ResetPasswordPage from "../features/auth/pages/ResetPassword";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";

// Buyer (protected)
import CartPage from "../features/cart/pages/CartPage";
import MyOrdersPage from "../features/orders/pages/MyOrdersPage";
import PaymentSuccessPage from "../features/cart/pages/PaymentSuccessPage";
import PaymentCancelPage from "../features/cart/pages/PaymentCancelPage";
import FavoritesPage from "../features/favorites/pages/FavoritesPage";
import ProfileLayout from "../features/profile/components/ProfileLayout";
import ProfilePage from "../features/profile/pages/ProfilePage";
import AddressPage from "../features/profile/pages/AddressPage";
import BankAccountPage from "../features/profile/pages/BankAccountPage";
import NotificationsPage from "../features/pages/NotificationsPage";
import SubscriptionPage from "../features/subscription/pages/SubscriptionPage";
import SubscriptionCheckoutPage from "../features/subscription/pages/SubscriptionCheckoutPage";
import SubscriptionSuccessPage from "../features/subscription/pages/SubscriptionSuccessPage";
import SubscriptionCancelPage from "../features/subscription/pages/SubscriptionCancelPage";

// Artist (protected + role)
import DashboardOverview from "../features/artist/pages/DashboardOverview";
import ArtistArtworksPage from "../features/artist/pages/ArtistArtworksPage";
import ArtistArtworkFormPage from "../features/artist/pages/ArtistArtworkFormPage";
import ArtistOrdersPage from "../features/artist/pages/ArtistOrdersPage";
import ArtistWalletPage from "../features/artist/pages/ArtistWalletPage";
import ArtistSubscriptionPage from "../features/artist/pages/ArtistSubscriptionPage";
import ArtistAnalyticsPage from "../features/artist/pages/ArtistAnalyticsPage";

// Admin (protected + role)
import AdminOverviewPage from "../features/admin/pages/AdminOverviewPage";
import AdminFinancialPage from "../features/admin/pages/AdminFinancialPage";
import AdminOrdersPage from "../features/admin/pages/AdminOrdersPage";
import AdminWithdrawalsPage from "../features/admin/pages/AdminWithdrawalsPage";
import AdminArtistsPage from "../features/admin/pages/AdminArtistsPage";
import AdminArtworksPage from "../features/admin/pages/AdminArtworksPage";
import AdminUsersPage from "../features/admin/pages/AdminUsersPage";
import AdminAuditLogsPage from "../features/admin/pages/AdminAuditLogsPage";

// Reviews
import ArtistReviewsPage from "../features/reviews/pages/ArtistReviewsPage";

// Common Pages
import NotFoundPage from "../features/pages/common/NotFoundPage";
import ServerErrorPage from "../features/pages/common/ServerErrorPage";
import UnauthorizedPage from "../features/pages/common/UnauthorizedPage";

// Placeholder
const Placeholder = ({ title }) => (
  <div className="p-8 text-center bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)]/40">
    <h3 className="text-xl font-display font-bold text-[var(--color-on-surface)] mb-2">{title}</h3>
    <p className="text-[var(--color-on-surface-variant)] text-sm">سيتم العمل على هذه الصفحة قريباً</p>
  </div>
);

export function AppRouter() {
  return (
    <Routes>

      {/* ═══ Public Pages ═══ */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.FEATURED} element={<FeaturedArtworksPage />} />
        <Route path={ROUTES.ARTWORKS} element={<BrowseArtworksPage />} />
        <Route path={ROUTES.ARTWORK} element={<ArtworkDetailsPage />} />
        <Route path={ROUTES.ARTISTS} element={<ArtistsPage />} />
        <Route path={ROUTES.ARTIST_PROFILE} element={<ArtistProfilePage />} />
        <Route path={ROUTES.ARTIST_REVIEWS} element={<ArtistReviewsPage />} />
        <Route path={ROUTES.SUBSCRIPTIONS} element={<SubscriptionPage />} />
        <Route path={ROUTES.CONTACT_US} element={<ContactUsPage />} />
      </Route>

      {/* ═══ Auth Pages ═══ */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
      </Route>

      {/* ═══ Buyer Protected ═══ */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.CART} element={
          <ProtectedRoute><CartPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.CHECKOUT} element={
          <ProtectedRoute><CartPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.PAYMENT_SUCCESS} element={
          <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.PAYMENT_CANCEL} element={
          <ProtectedRoute><PaymentCancelPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.MY_ORDERS} element={
          <ProtectedRoute><MyOrdersPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ORDER_DETAILS} element={
          <ProtectedRoute><Placeholder title="تفاصيل الطلب" /></ProtectedRoute>
        } />
        <Route path={ROUTES.FAVORITES} element={
          <ProtectedRoute><FavoritesPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.NOTIFICATIONS} element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.SUBSCRIPTION_CHECKOUT} element={
          <ProtectedRoute><SubscriptionCheckoutPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.SUBSCRIPTION_SUCCESS} element={
          <ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.SUBSCRIPTION_CANCEL} element={
          <ProtectedRoute><SubscriptionCancelPage /></ProtectedRoute>
        } />

        {/* Profile */}
        <Route path="/profile" element={
          <ProtectedRoute><ProfileLayout /></ProtectedRoute>
        }>
          <Route index element={<ProfilePage />} />
          <Route path="address" element={<AddressPage />} />
          <Route path="bank-account" element={<BankAccountPage />} />
        </Route>
      </Route>

      {/* ═══ Artist Dashboard ═══ */}
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.ARTIST_DASHBOARD} element={
          <ProtectedRoute roles={["artist", "admin"]}><DashboardOverview /></ProtectedRoute>
        } />
        <Route path={ROUTES.MY_ARTWORKS} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistArtworksPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADD_ARTWORK} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistArtworkFormPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.EDIT_ARTWORK} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistArtworkFormPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ARTIST_ORDERS} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistOrdersPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.WALLET} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistWalletPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.SUBSCRIPTION} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistSubscriptionPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ARTIST_ANALYTICS} element={
          <ProtectedRoute roles={["artist", "admin"]}><ArtistAnalyticsPage /></ProtectedRoute>
        } />
      </Route>

      {/* ═══ Admin ═══ */}
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.ADMIN} element={
          <ProtectedRoute roles={["admin"]}><AdminOverviewPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_FINANCE} element={
          <ProtectedRoute roles={["admin"]}><AdminFinancialPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_ORDERS} element={
          <ProtectedRoute roles={["admin"]}><AdminOrdersPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_WITHDRAWALS} element={
          <ProtectedRoute roles={["admin"]}><AdminWithdrawalsPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_ARTISTS} element={
          <ProtectedRoute roles={["admin"]}><AdminArtistsPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_ARTWORKS} element={
          <ProtectedRoute roles={["admin"]}><AdminArtworksPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_USERS} element={
          <ProtectedRoute roles={["admin"]}><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={
          <ProtectedRoute roles={["admin"]}><AdminAuditLogsPage /></ProtectedRoute>
        } />
      </Route>

      {/* ═══ 404 Catch-All ═══ */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}