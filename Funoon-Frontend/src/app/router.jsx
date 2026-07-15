import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../config/routes'

// Layouts
import PublicLayout from '../components/layout/PublicLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DashboardLayout from '../components/layout/DashboardLayout'

// Pages
import Home from '../features/artworks/pages/Home'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import DashboardOverview from '../features/artist/pages/DashboardOverview'
import AdminDashboardOverview from '../features/admin/pages/AdminDashboardOverview'
import ForgotPasswordPage from '../features/auth/pages/ForgotPassword'
import ResetPasswordPage from '../features/auth/pages/ResetPassword'

// Small Inline Placeholders for other pages to avoid missing import errors
const Placeholder = ({ title }) => (
  <div className="p-8 text-center bg-white rounded-2xl border border-stone-150">
    <h3 className="text-xl font-bold text-stone-800 mb-2">{title}</h3>
    <p className="text-stone-500 text-sm">سيتم العمل على هذه الصفحة قريباً كجزء من مهام المشروع الأساسية.</p>
  </div>
)

export function AppRouter() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ARTWORKS} element={<Placeholder title="المعرض الفني" />} />
        <Route path={ROUTES.ARTWORK} element={<Placeholder title="تفاصيل اللوحة" />} />
        <Route path={ROUTES.ARTISTS} element={<Placeholder title="الفنانون" />} />
        <Route path={ROUTES.ARTIST} element={<Placeholder title="صفحة الفنان العامة" />} />
        <Route path={ROUTES.CART} element={<Placeholder title="سلة المشتريات" />} />
        <Route path={ROUTES.CHECKOUT} element={<Placeholder title="الدفع وإتمام الطلب" />} />
        <Route path={ROUTES.PAYMENT_SUCCESS} element={<Placeholder title="تم الدفع بنجاح" />} />
        <Route path={ROUTES.PAYMENT_CANCEL} element={<Placeholder title="تم إلغاء عملية الدفع" />} />
        <Route path={ROUTES.MY_ORDERS} element={<Placeholder title="طلباتي" />} />
        <Route path={ROUTES.ORDER_DETAILS} element={<Placeholder title="تفاصيل الطلب" />} />
        <Route path={ROUTES.PROFILE} element={<Placeholder title="الملف الشخصي" />} />
        <Route path={ROUTES.ADDRESS} element={<Placeholder title="العنوان" />} />
        <Route path={ROUTES.BANK_ACCOUNT} element={<Placeholder title="الحساب البنكي" />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage/>} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage/>} />
      </Route>

      {/* Artist Dashboard Pages */}
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.ARTIST_DASHBOARD} element={<DashboardOverview />} />
        <Route path={ROUTES.MY_ARTWORKS} element={<Placeholder title="إدارة لوحاتي الفنية" />} />
        <Route path={ROUTES.ADD_ARTWORK} element={<Placeholder title="إضافة لوحة جديدة" />} />
        <Route path={ROUTES.EDIT_ARTWORK} element={<Placeholder title="تعديل لوحة فنية" />} />
        <Route path={ROUTES.ARTIST_ORDERS} element={<Placeholder title="إدارة الطلبات الواردة" />} />
        <Route path={ROUTES.WALLET} element={<Placeholder title="المحفظة وسحب الأرباح" />} />
        <Route path={ROUTES.SUBSCRIPTION} element={<Placeholder title="اشتراكي وباقات الدفع" />} />
      </Route>

      {/* Admin Pages */}
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.ADMIN} element={<AdminDashboardOverview />} />
        <Route path={ROUTES.ADMIN_ORDERS} element={<Placeholder title="إدارة كافة الطلبات" />} />
        <Route path={ROUTES.ADMIN_WITHDRAWALS} element={<Placeholder title="إدارة طلبات سحب الأرباح" />} />
        <Route path={ROUTES.ADMIN_ARTISTS} element={<Placeholder title="إدارة حسابات الفنانين" />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
