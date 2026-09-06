import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShoppingBag,
  DollarSign,
  Truck,
  Wallet,
  Landmark,
  Clock,
  Bell,
  Banknote,
  RefreshCw,
  Headphones,
} from "lucide-react";

export const NOTIFICATION_META = {
  ARTWORK_APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  ARTWORK_REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ARTWORK_SUSPENDED: {
    icon: ShieldAlert,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  ARTWORK_UPDATED_NEEDS_REVIEW: {
    icon: RefreshCw,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  ORDER_CREATED: {
    icon: ShoppingBag,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  ORDER_PAID: {
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  ORDER_SHIPPED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  ORDER_DELIVERED: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  ORDER_FUNDS_RELEASED: {
    icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  WITHDRAWAL_APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  WITHDRAWAL_REJECTED: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  WITHDRAWAL_PAID: { icon: Landmark, color: "text-blue-600", bg: "bg-blue-50" },
  SUBSCRIPTION_EXPIRING: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  ARTWORK_SUBMITTED: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  WITHDRAWAL_REQUESTED: {
    icon: Banknote,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  SUPPORT_MESSAGE_RECEIVED: {
    icon: Headphones,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  GENERAL: { icon: Bell, color: "text-stone-600", bg: "bg-stone-100" },
};

export const getMeta = (type) =>
  NOTIFICATION_META[type] || NOTIFICATION_META.GENERAL;

// ⏰ "منذ 5 دقائق" بالعربي
export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString("ar-EG");
}
