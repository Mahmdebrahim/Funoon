# Funoon.sa - Frontend Master Specification

---

## 🎯 Project Overview

**Funoon.sa (فنون)** is a premium Saudi art marketplace.
- Artists pay annual subscriptions to list and sell physical artworks
- Buyers browse, add to cart, and purchase artworks
- Platform takes commission (10-15% based on artist plan)
- Shipping via OTO Express (integrated in backend)
- Payments via Moyasar (Saudi payment gateway)

---

## 🛠️ Tech Stack (STRICT - do not change)

```
Framework:      React 18 + Vite
Styling:        Tailwind CSS v3
State:          Zustand
Server State:   TanStack Query v5
Routing:        React Router DOM v6
Forms:          React Hook Form + Zod
HTTP:           Axios
Icons:          Lucide React
Notifications:  React Hot Toast
```

**Install command:**
```bash
npm create vite@latest funoon-frontend -- --template react
cd funoon-frontend
npm install \
  react-router-dom \
  @tanstack/react-query \
  zustand \
  axios \
  react-hook-form \
  @hookform/resolvers \
  zod \
  lucide-react \
  react-hot-toast \
  tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 📁 Project Structure (EXACT - follow this)

```
src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   ├── providers.jsx
│   └── routes.jsx
│
├── assets/
│   └── styles/
│       └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Loading.jsx
│   │   └── index.js
│   │
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── PublicLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   └── shared/
│       ├── ArtworkCard.jsx
│       ├── OrderStatusBadge.jsx
│       ├── PriceDisplay.jsx
│       └── EmptyState.jsx
│
├── features/
│   ├── auth/
│   ├── artworks/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── artist/
│   ├── subscription/
│   ├── profile/
│   └── admin/
│
├── hooks/
│   ├── useDebounce.js
│   └── useMediaQuery.js
│
├── services/
│   ├── api.js
│   ├── endpoints.js
│   └── storage.service.js
│
├── stores/
│   └── uiStore.js
│
├── utils/
│   ├── formatCurrency.js
│   ├── formatDate.js
│   ├── constants.js
│   └── helpers.js
│
├── config/
│   └── routes.js
│
└── main.jsx
```

---

## 🌐 API Configuration

### Base URL
```
Development: http://localhost:5000/api/v1
Production:  https://funoon.sa/api/v1
```

### Environment Variables (.env)
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Funoon.sa
```

---

## 🔐 Authentication Flow

### Token Strategy
```
Access Token:  JWT, stored in localStorage, expires in 15min-30d
Refresh Token: httpOnly Cookie (set by backend automatically)
```

### Auth Store (Zustand)
```javascript
// features/auth/stores/authStore.js
{
  user: null,           // current user object
  accessToken: null,    // JWT token
  isAuthenticated: false,
  isLoading: false,
  
  // Actions
  login(user, token),
  logout(),
  updateUser(updates),
  setToken(token),
}
```

### API Interceptors (api.js)
```javascript
// Request: auto-attach Bearer token
// Response 401: try refresh via POST /auth/refresh-token
//   → success: retry original request with new token
//   → fail: logout + redirect to /login
```

### User Roles
```
buyer   → default role, can browse and purchase
artist  → has active subscription, can list artworks
admin   → full access
```

---

## 📡 API Endpoints Reference

### Auth
```
POST /auth/register          body: { name, email, password, phone, role, termsAccepted }
POST /auth/login             body: { email, password }
POST /auth/refresh-token     cookie: refreshToken → returns { accessToken }
POST /auth/logout
GET  /auth/me                → returns current user
POST /auth/forgot-password   body: { email }
POST /auth/reset-password    body: { token, password }
```

### Users / Profile
```
GET  /users/profile          → my profile
PUT  /users/profile          → update profile (name, phone, bio, avatar)
PUT  /users/address          → update address
GET  /users/address          → get my address
```

### Artworks
```
GET  /artworks               query: { category, minPrice, maxPrice, search, artist, sort, page, limit }
GET  /artworks/:id           → artwork details + view counter
POST /artworks               multipart/form-data (artist only)
PUT  /artworks/:id           multipart/form-data (artist only)
DELETE /artworks/:id         (artist/admin only)
PUT  /artworks/:id/toggle    → toggle active/inactive
```

### Artists
```
GET  /artists                query: { page, limit } → sorted by plan (Prestige first)
GET  /artists/:artistId      → public profile + artworks
GET  /artists/my/profile-views  → (Plus/Prestige only)
```

### Cart
```
GET    /cart                 → cart with summary { items, summary: { subtotal, totalShipping, total } }
POST   /cart/items           body: { artworkId }
DELETE /cart/items/:artworkId
DELETE /cart                 → clear cart
```

### Checkout & Orders
```
POST /orders/checkout        body: { paymentMethod } → returns { paymentUrl, grandTotal, orders }
GET  /orders/my              → buyer's orders
GET  /orders/artist          → artist's received orders
GET  /orders/:id             → order details
PUT  /orders/:id/process     → artist: PAID → PROCESSING
PUT  /orders/:id/confirm-delivery → buyer: SHIPPED/DELIVERED → COMPLETED
```

### Shipping
```
POST /shipping/calculate     body: { artworkId, destinationCity }
POST /shipping/create        body: { orderId } (artist only)
GET  /shipping/:orderId/awb  → AWB print URL
GET  /shipping/:orderId/track → tracking info
```

### Wallet & Withdrawals
```
GET  /wallet                 → { balance: { available, pending }, totalEarned }
GET  /wallet/transactions    → paginated transactions
POST /withdrawals            body: { amount, iban, accountHolder, bankName }
GET  /withdrawals/my         → my withdrawal history
POST /bank-account           body: { iban, accountHolder, bankName }
GET  /bank-account           → my bank account
```

### Subscriptions
```
POST /subscriptions/purchase body: { plan } → returns { paymentUrl }
GET  /subscriptions/my       → current subscription details
```

### Notifications
```
GET  /notifications          → { notifications, unreadCount }
PUT  /notifications/:id/read
PUT  /notifications/read-all
```

### Admin
```
GET  /admin/withdrawals      query: { status, page, limit }
PUT  /admin/withdrawals/:id/approve
PUT  /admin/withdrawals/:id/mark-paid  body: { transferReference }
PUT  /admin/withdrawals/:id/reject     body: { reason }
GET  /admin/orders           → all orders with filters
GET  /admin/artists          → all artists
GET  /admin/stats            → dashboard stats
```

---

## 💳 Moyasar Payment Integration

After checkout, backend returns `paymentUrl`. Redirect user to it:

```javascript
// In CheckoutPage.jsx
const handleCheckout = async () => {
  const { paymentUrl } = await checkoutService.checkout({ paymentMethod: 'creditcard' })
  window.location.href = paymentUrl  // redirect to Moyasar payment page
}

// Success URL: /payment/success?id=xxx
// Cancel URL:  /payment/cancel
```

### Payment Result Pages
```
/payment/success  → show success, clear cart, redirect to orders
/payment/cancel   → show cancel message, go back to cart
```

---

## 🎨 Subscription Plans (Display Info)

```javascript
export const PLANS = {
  opal_classic: {
    name: 'أوبال كلاسيك',
    price: 299,
    commission: '15%',
    maxArtworks: 5,
    color: 'gray',
    badge: null,
    features: [
      'عرض حتى 5 لوحات',
      'بروفايل شخصي',
      'ظهور في البحث',
      'عمولة 15% على المبيعات',
      'تكلفة الشحن على المشتري',
    ],
  },
  opal_plus: {
    name: 'أوبال بلس',
    price: 399,
    commission: '15%',
    maxArtworks: 15,
    color: 'blue',
    badge: 'شارة موثق',
    features: [
      'عرض حتى 15 لوحة',
      'ظهور مميز في البحث',
      'شارة "فنان موثق"',
      'عمولة 15% على المبيعات',
      'تكلفة الشحن على المشتري',
      'إحصائيات مشاهدات البروفايل',
    ],
  },
  opal_prestige: {
    name: 'أوبال بريستيج',
    price: 599,
    commission: '10%',
    maxArtworks: Infinity,
    color: 'gold',
    badge: 'شارة ذهبية',
    features: [
      'عرض لوحات غير محدود',
      'أولوية في نتائج البحث',
      'شارة ذهبية مميزة',
      'تبويب "مجموعة مختارة"',
      'عمولة 10% فقط على المبيعات',
      'الشحن المجاني للمشتري (قياسي)',
      'إحصائيات متقدمة',
    ],
  },
}
```

---

## 📦 Order Status Flow

```javascript
export const ORDER_STATUSES = {
  PENDING_PAYMENT: { label: 'في انتظار الدفع',   color: 'yellow' },
  PAID:            { label: 'تم الدفع',           color: 'blue'   },
  PROCESSING:      { label: 'جاري التحضير',       color: 'purple' },
  SHIPPED:         { label: 'في الطريق',           color: 'indigo' },
  DELIVERED:       { label: 'تم التسليم',          color: 'teal'   },
  COMPLETED:       { label: 'مكتمل',              color: 'green'  },
  CANCELLED:       { label: 'ملغي',               color: 'red'    },
  DISPUTED:        { label: 'متنازع عليه',         color: 'orange' },
  REFUNDED:        { label: 'مسترد',              color: 'gray'   },
}
```

---

## 🏗️ Core Files to Build First

### 1. src/services/api.js
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,  // للـ refresh token cookie
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
let isRefreshing = false
let failedQueue = []

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { accessToken } = await api.post('/auth/refresh-token')
        localStorage.setItem('accessToken', accessToken)
        
        failedQueue.forEach(({ resolve }) => resolve(accessToken))
        failedQueue = []
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError))
        failedQueue = []
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default api
```

### 2. src/app/providers.jsx
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

### 3. src/config/routes.js
```javascript
export const ROUTES = {
  // Public
  HOME:           '/',
  ARTWORKS:       '/artworks',
  ARTWORK:        '/artworks/:id',
  ARTISTS:        '/artists',
  ARTIST:         '/artists/:id',
  
  // Auth
  LOGIN:          '/login',
  REGISTER:       '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Buyer
  CART:           '/cart',
  CHECKOUT:       '/checkout',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCEL: '/payment/cancel',
  MY_ORDERS:      '/orders',
  ORDER_DETAILS:  '/orders/:id',
  
  // Artist Dashboard
  ARTIST_DASHBOARD: '/dashboard',
  MY_ARTWORKS:    '/dashboard/artworks',
  ADD_ARTWORK:    '/dashboard/artworks/new',
  EDIT_ARTWORK:   '/dashboard/artworks/:id/edit',
  ARTIST_ORDERS:  '/dashboard/orders',
  WALLET:         '/dashboard/wallet',
  SUBSCRIPTION:   '/dashboard/subscription',
  
  // Profile
  PROFILE:        '/profile',
  ADDRESS:        '/profile/address',
  BANK_ACCOUNT:   '/profile/bank-account',
  
  // Admin
  ADMIN:          '/admin',
  ADMIN_ORDERS:   '/admin/orders',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_ARTISTS:  '/admin/artists',
}
```

---

## 🎨 Design Guidelines

### Language & Direction
```
Primary Language: Arabic (RTL)
dir="rtl" on <html>
Font: Cairo or Tajawal (Google Fonts)
```

### Color Palette (Tailwind)
```
Primary:    amber-600 / amber-500   ← main brand color
Secondary:  stone-800 / stone-700
Background: stone-50 / white
Text:       stone-900 / stone-600
Success:    green-500
Error:      red-500
Warning:    yellow-500
```

### Subscription Badge Colors
```
opal_classic:  gray
opal_plus:     blue  
opal_prestige: amber/gold
```

---

## 🔄 Key Business Logic for Frontend

### 1. Shipping Cost Display
```javascript
// In cart and artwork details
const getShippingLabel = (shippingType, artistPlan) => {
  if (shippingType === 'giant') return '30 ريال (توصيل ثقيل)'
  if (artistPlan === 'opal_prestige') return 'شحن مجاني'
  return '25 ريال'
}
```

### 2. Artwork Limit Check (for artists)
```javascript
// Before showing "Add Artwork" button
const canAddArtwork = (user, currentArtworkCount) => {
  const limits = { opal_classic: 5, opal_plus: 15, opal_prestige: Infinity }
  return currentArtworkCount < (limits[user.subscription?.plan] || 0)
}
```

### 3. Wallet Display
```javascript
// Always show both balances
{
  available: 850,   // قابل للسحب
  pending:   200,   // قيد المعالجة (محجوز)
}
```

### 4. Withdrawal Rules (validate on frontend too)
```
Minimum amount: 50 SAR
Max once per week
Requires bank account (IBAN) to be set first
Saudi IBAN format: SA + 22 digits
```

---

## 📱 Pages to Build (Priority Order)

### Phase 1: Foundation
1. `PublicLayout` + `AuthLayout` + `DashboardLayout`
2. Login / Register pages
3. Home page (hero + featured artworks)
4. Browse Artworks page (grid + filters)
5. Artwork Details page
6. Artist Public Profile page

### Phase 2: Commerce  
7. Cart page + Cart Drawer
8. Checkout page (shipping address + payment method)
9. Payment Success/Cancel pages
10. My Orders page (buyer)
11. Order Details page

### Phase 3: Artist Dashboard
12. Artist Dashboard (stats overview)
13. My Artworks page (manage)
14. Add/Edit Artwork page (with image upload)
15. Artist Orders page (manage shipping)
16. Wallet page (balance + withdrawal request)
17. Subscription page (buy/manage plan)

### Phase 4: Profile & Admin
18. Profile page (edit info + address)
19. Bank Account page
20. Admin Dashboard
21. Admin Withdrawals management
22. Admin Orders management

---

## ⚠️ Important Notes for Agent

1. **RTL First**: All layouts must be RTL (Arabic). Use `dir="rtl"` on root.

2. **Auth Check**: Use `ProtectedRoute` component that checks `isAuthenticated` from Zustand store. Redirect to `/login` if not authenticated.

3. **Role-based Routes**:
   - Artist routes → check `user.role === 'artist'` AND `user.subscription.isActive`
   - Admin routes → check `user.role === 'admin'`

4. **Error Handling**: All API errors come as `{ message, messageAr }`. Show `messageAr` to user.

5. **Image Upload**: Use `multipart/form-data` with `Content-Type` header removed (axios sets it automatically with FormData).

6. **Moyasar Payment**: After checkout API call, redirect to `paymentUrl` returned from backend. Don't implement payment form yourself.

7. **Cart Sync**: On login, call `GET /cart` to sync cart state. Cart is stored in DB, not localStorage.

8. **Subscription Check**: Artist can only add artworks if `user.subscription.isActive === true`. Show upgrade prompt otherwise.

9. **Refresh Token**: Cookie-based, handled by backend. Just call `POST /auth/refresh-token` with `withCredentials: true` in axios.

10. **Loading States**: Use TanStack Query's `isLoading` / `isFetching` states. Show skeleton loaders, not spinners where possible.

---

## 🚀 Start Command

```
Build in this exact order:
1. Setup project structure
2. Install dependencies  
3. Configure Tailwind (RTL support)
4. Build api.js + providers.jsx
5. Build authStore.js
6. Build Login + Register pages
7. Build PublicLayout + Navbar
8. Then continue with Phase 1 pages
```