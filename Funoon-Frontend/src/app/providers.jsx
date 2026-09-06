import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { setSharedQueryClient } from '../features/auth/stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ربط الـ queryClient بالـ authStore عشان logout يمسح الـ cache
setSharedQueryClient(queryClient)

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster position="top-center" toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
          }
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
