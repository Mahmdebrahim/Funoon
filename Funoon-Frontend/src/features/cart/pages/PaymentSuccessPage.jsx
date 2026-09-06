// src/features/cart/pages/PaymentSuccessPage.jsx
import React, { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { ROUTES } from "../../../config/routes";
import Button from "../../../components/Ui/Button";
import {
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ShieldCheck,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("id") || searchParams.get("payment_id");
  const status = (searchParams.get("status") || "").toLowerCase();

  const outcome = useMemo(() => {
    if (status === "paid") return "paid";
    if (["failed", "declined", "canceled", "cancelled", "expired"].includes(status))
      return "failed";
    return "pending";
  }, [status]);

  useEffect(() => {
    if (outcome === "paid") {
      useCartStore.getState().syncAfterPayment();
    }
  }, [outcome]);

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[var(--color-surface)] font-body"
      dir="rtl"
    >
      <div className="max-w-md w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-sm p-8 text-center space-y-6 shadow-sm">

        {/* ═══ حالة النجاح ═══ */}
        {outcome === "paid" && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-[var(--color-primary)]">
                تمت عملية الشراء بنجاح!
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                شكراً لثقتكم ودعمكم للفن السعودي. تم استلام دفعتك وسيتم إخطار
                الفنان لتجهيز طلبك.
              </p>
            </div>
          </>
        )}

        {/* ═══ حالة الفشل / الرفض ═══ */}
        {outcome === "failed" && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <XCircle className="w-12 h-12" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-[var(--color-primary)]">
                لم تتم عملية الدفع
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                تم رفض أو إلغاء العملية من البنك. لم يتم خصم أي مبلغ، واللوحات
                لسه محفوظة في سلتك. تقدر تحاول تاني في أي وقت.
              </p>
            </div>
          </>
        )}

        {/* ═══ حالة معلّقة / مفيش status ═══ */}
        {outcome === "pending" && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                <Clock className="w-12 h-12" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-[var(--color-primary)]">
                جاري تأكيد العملية
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                بنأكد حالة دفعتك دلوقتي. لو اتخصم المبلغ، هتلاقي طلبك في صفحة
                "طلباتي" خلال لحظات.
              </p>
            </div>
          </>
        )}

        {/* ═══ تفاصيل العملية ═══ */}
        {paymentId && (
          <div className="bg-stone-50 border border-stone-150 p-4 rounded-sm text-right space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span className="font-semibold">رقم العملية:</span>
              <span className="font-mono text-stone-800 select-all">{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">الحالة:</span>
              <span
                className={`font-semibold ${outcome === "paid"
                    ? "text-emerald-700"
                    : outcome === "failed"
                      ? "text-red-600"
                      : "text-amber-700"
                  }`}
              >
                {outcome === "paid"
                  ? "مقبول / ناجح"
                  : outcome === "failed"
                    ? "مرفوض / فاشل"
                    : "قيد التحقق"}
              </span>
            </div>
          </div>
        )}

        {/* ═══ ملاحظة الأمان (للنجاح بس) ═══ */}
        {outcome === "paid" && (
          <div className="bg-[var(--color-surface-container-low)] p-4 rounded-sm text-right flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-[var(--color-secondary)] shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 leading-relaxed">
              تم إخطار الفنانين بطلبك لتجهيز اللوحات. ستتلقى تحديثات الشحن عبر
              بريدك الإلكتروني وصفحة طلباتي.
            </p>
          </div>
        )}

        {/* ═══ الأزرار (تختلف حسب الحالة) ═══ */}
        <div className="flex flex-col gap-3 pt-4">
          {outcome === "failed" ? (
            <>
              {/* ❗ في حالة الفشل: رجّعه للسلة علشان يدفع تاني */}
              <Link to={ROUTES.CART}>
                <Button variant="primary" fullWidth icon={RefreshCw}>
                  حاول الدفع مرة أخرى
                </Button>
              </Link>
              <Link to={ROUTES.ARTWORKS}>
                <Button variant="outline" fullWidth icon={ShoppingBag}>
                  مواصلة التسوق
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to={ROUTES.MY_ORDERS}>
                <Button variant="primary" fullWidth icon={FileText}>
                  استعراض طلباتي
                </Button>
              </Link>
              <Link to={ROUTES.ARTWORKS}>
                <Button variant="outline" fullWidth icon={ShoppingBag}>
                  مواصلة التسوق
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}