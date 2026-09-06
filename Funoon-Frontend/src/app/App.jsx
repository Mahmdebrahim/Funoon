// src/app/App.jsx
import { useEffect } from 'react'
import { Providers } from './providers'
import { AppRouter } from './router'
import { useAuthStore } from '../features/auth/stores/authStore'
import { useCartStore } from '../features/cart/stores/cartStore'
import ErrorBoundary from '../features/pages/common/ErrorBoundary';

function AuthInitializer({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const initializeAuth = useAuthStore((s) => s.initializeAuth)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const resetCart = useCartStore((s) => s.resetCart)

  // ✅ مهم: تحقق من الـ auth state عند بدء التطبيق
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // ✅ حمل الـ cart لما المستخدم يسجل دخول
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    } else {
      resetCart()
    }
  }, [isAuthenticated, fetchCart, resetCart])

  return children
}

export default function App() {
  return (
    <Providers>
      <AuthInitializer>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </AuthInitializer>
    </Providers>
  )
}