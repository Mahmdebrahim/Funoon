import { useEffect } from 'react'
import { Providers } from './providers'
import { AppRouter } from './router'
import { useAuthStore } from '../features/auth/stores/authStore'

// This component lives inside Providers so it can safely use hooks
function AuthInitializer({ children }) {
  const { initializeAuth, isLoading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show a minimal full-screen loader while checking session
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-surface">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  //         <p className="text-sm text-on-surface-variant font-body">جارٍ التحقق من الجلسة...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return children
}

export default function App() {
  return (
    <Providers>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
    </Providers>
  )
}
