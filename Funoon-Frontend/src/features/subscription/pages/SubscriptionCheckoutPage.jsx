import { useRef } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import {
    ChevronRight,
    Loader2,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { useMoyasarForm } from "../../../hooks/useMoyasarForm";
import { getPlanById } from "../config/plans";
import { useState } from "react";

export default function SubscriptionCheckoutPage() {
    const [searchParams] = useSearchParams();
    const invoiceId = searchParams.get("invoice"); // ✅ من الـ URL
    const planId = searchParams.get("plan");
    const planConfig = getPlanById(planId);
    const formRef = useRef(null);
    const [retryCount, setRetryCount] = useState(0);

    // لو مفيش invoiceId → ارجع لصفحة الباقات
    if (!invoiceId || !planConfig) {
        return <Navigate to="/subscription" replace />;
    }

    const { isLoading: formLoading, error: formError, retry } = useMoyasarForm({
        containerRef: formRef,
        invoiceId, // ✅ من الـ URL مباشرة
        amount: planConfig.price,
        description: `Funoon.sa - ${planConfig.name} Subscription`,
        callbackPath: "/subscription/success",
        enabled: true,
        key: retryCount, // عشان الـ retry يشتغل
    });

    const handleRetry = () => {
        setRetryCount((c) => c + 1);
        retry?.();
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] py-14 px-4 font-body" dir="rtl">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors mb-6"
                >
                    <ChevronRight className="w-4 h-4" />
                    <span>الرجوع للباقات</span>
                </button>

                <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-2xl p-6 lg:p-8">
                    {/* ملخص الباقة */}
                    <div className="mb-6 pb-5 border-b border-[var(--color-outline-variant)]/40">
                        <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">الاشتراك في باقة</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {planConfig.popular && <Sparkles className="w-4 h-4 text-[var(--color-secondary)]" />}
                                <h3 className="font-display text-xl text-[var(--color-on-surface)]">{planConfig.name}</h3>
                            </div>
                            <div className="text-left">
                                <span className="font-display text-xl text-[var(--color-primary)]">{planConfig.price}</span>
                                <span className="text-xs text-[var(--color-on-surface-variant)] mr-1">ر.س / سنة</span>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {formLoading && !formError && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mb-3" />
                            <span className="text-xs text-[var(--color-on-surface-variant)]">جاري تحميل بوابة الدفع...</span>
                        </div>
                    )}

                    {/* Error */}
                    {formError && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <AlertCircle className="w-10 h-10 text-red-500 mb-3" strokeWidth={1.5} />
                            <p className="text-sm text-[var(--color-on-surface)] mb-4">تعذّر تحميل بوابة الدفع</p>
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-sm font-semibold text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                إعادة المحاولة
                            </button>
                        </div>
                    )}

                    {/* Form */}
                    <div ref={formRef} className="moyasar-wrapper" />

                    {/* Security */}
                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-on-surface-variant)] mt-5 pt-4 border-t border-[var(--color-outline-variant)]/40">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>دفع مشفّر وآمن عبر ميسّر ومدى</span>
                    </div>
                </div>
            </div>
        </div>
    );
}