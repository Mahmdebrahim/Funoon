// src/features/cart/pages/PaymentCancelPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import Button from "../../../components/Ui/Button";
import { AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[var(--color-surface)] font-body" dir="rtl">
      <div className="max-w-md w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-sm p-8 text-center space-y-6 shadow-sm">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-[var(--color-error)]">
            <AlertCircle className="w-12 h-12" strokeWidth={1.5} />
          </div>
        </div>

        {/* Cancel Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-display text-[var(--color-primary)]">فشلت أو ألغيت عملية الدفع</h2>
          <p className="text-stone-500 text-sm">
            لم نتمكن من إتمام عملية الدفع الخاصة بطلبك. قد يكون ذلك بسبب إلغاء العملية، أو انتهاء الجلسة، أو رفض البطاقة من البنك المصدر.
          </p>
        </div>

        {/* Helpful Tips */}
        <div className="bg-stone-50 p-4 border border-stone-150 rounded-sm text-right space-y-2 text-xs text-stone-650">
          <p className="font-semibold text-stone-800">نصائح لإتمام الدفع بنجاح:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>تأكد من صحة رقم البطاقة وتاريخ الانتهاء ورمز التحقق (CVV).</li>
            <li>تأكد من تفعيل الشراء عبر الإنترنت ورصيد كافٍ في بطاقتك.</li>
            <li>تأكد من إدخال رمز التحقق (OTP) المرسل لهاتفك بشكل صحيح.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Link to={ROUTES.CART}>
            <Button variant="primary" fullWidth icon={ShoppingBag}>
              العودة إلى سلة المشتريات
            </Button>
          </Link>
          <Link to={ROUTES.ARTWORKS}>
            <Button variant="outline" fullWidth>
              تصفح اللوحات الأخرى
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
