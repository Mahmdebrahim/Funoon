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
