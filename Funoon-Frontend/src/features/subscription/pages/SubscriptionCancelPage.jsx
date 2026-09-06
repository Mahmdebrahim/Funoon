import { Link } from "react-router-dom";
import { XCircle, RefreshCw } from "lucide-react";
import Button from "../../../components/Ui/Button";

export default function SubscriptionCancelPage() {
    return (
        <div
            className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[var(--color-surface)] font-body"
            dir="rtl"
        >
            <div className="max-w-md w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-2xl p-8 text-center space-y-6 shadow-sm">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                        <XCircle className="w-12 h-12" strokeWidth={1.5} />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                        تم إلغاء العملية
                    </h2>
                    <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                        رجعت قبل إتمام الدفع. مفيش أي مبلغ اتخصم. تقدر تشترك في أي وقت.
                    </p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                    <Link to="/subscription">
                        <Button variant="primary" fullWidth icon={RefreshCw}>
                            الرجوع للباقات
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}