import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/stores/authStore'
import UnauthorizedPage from '../features/pages/common/UnauthorizedPage'
import { ROUTES } from '../config/routes'

export default function ProtectedRoute({ roles, children }) {
    const { user, isAuthenticated } = useAuthStore()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
    }

    // لو المستخدم مسجل بس بريده مش مؤكد → ارسله لصفحة التأكيد
    if (user && user.emailVerified === false) {
        return <Navigate to={`${ROUTES.VERIFY_EMAIL}?userId=${user._id}`} replace />
    }

    if (roles && roles.length && !roles.includes(user?.role)) {
        return <UnauthorizedPage />
    }
    return children
}