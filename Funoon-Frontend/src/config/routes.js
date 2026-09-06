export const ROUTES = {
  // Public
  HOME: "/",
  FEATURED: "/featured",
  NOTIFICATIONS: "/notifications",
  ARTWORKS: "/artworks",
  ARTWORK: "/artworks/:id",
  ARTISTS: "/artists",
  ARTIST_PROFILE: "/artists/:id",
  ARTIST_REVIEWS: "/artists/:id/reviews",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Buyer
  CART: "/cart",
  CHECKOUT: "/checkout",
  PAYMENT_SUCCESS: "/payment/success",
  PAYMENT_CANCEL: "/payment/cancel",
  MY_ORDERS: "/orders",
  ORDERS: "/orders",
  ORDER_DETAILS: "/orders/:id",
  FAVORITES: "/favorites",
  SUBSCRIPTIONS: "/subscription",
  SUBSCRIPTION_CHECKOUT: "/subscription/checkout",
  SUBSCRIPTION_SUCCESS: "/subscription/success",
  SUBSCRIPTION_CANCEL: "/subscription/cancel",
  CONTACT_US: "/contact-us",
  POLICY: "/policy",
  TERMS: "/terms",

  // Artist Dashboard
  ARTIST_DASHBOARD: "/dashboard",
  MY_ARTWORKS: "/dashboard/artworks",
  ARTIST_ANALYTICS: "/dashboard/analytics",
  ADD_ARTWORK: "/dashboard/artworks/new",
  EDIT_ARTWORK: "/dashboard/artworks/:id/edit",
  ARTIST_ORDERS: "/dashboard/orders",
  WALLET: "/dashboard/wallet",
  SUBSCRIPTION: "/dashboard/subscription",

  // Profile
  PROFILE: "/profile",
  ADDRESS: "/profile/address",
  BANK_ACCOUNT: "/profile/bank-account",
  SETTINGS: "/profile",

  // Admin
  ADMIN: "/admin",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_WITHDRAWALS: "/admin/withdrawals",
  ADMIN_ARTISTS: "/admin/artists",
  ADMIN_ARTWORKS: "/admin/artworks",
  ADMIN_USERS: "/admin/users",
  ADMIN_FINANCE: "/admin/finance",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
};
