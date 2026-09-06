import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/stores/authStore";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Crown,
    Palette,
    LayoutDashboard,
    RefreshCw,
} from "lucide-react";
import { subscriptionsService } from "../services/subscriptions.service";
import Button from "../../../components/Ui/Button";

export default function SubscriptionSuccessPage() {
    const [searchParams] = useSearchParams();
    const status = (searchParams.get("status") || "").toLowerCase();

    const isPaid = status === "paid";
    const isFailed = ["failed", "declined", "canceled", "cancelled", "expired"].includes(status);

    const refreshUser = useAuthStore((s) => s.refreshUser);
    const authUserRole = useAuthStore((s) => s.user?.role);

    const [timedOut, setTimedOut] = useState(false);

    // ─── polling على الـ subscription لحد ما الـ webhook يفعّلها ───
    const { data: subscription } = useQuery({
        queryKey: ["mySubscription"],
        queryFn: subscriptionsService.getMySubscription,
        enabled: isPaid,
        refetchInterval: (query) => {
            // وقف الـ polling لما الـ subscription تتفعل أو timeout
            if (query.state.data?.isActive || timedOut) return false;
            return 2000;
        },
    });

    const isActivated = subscription?.isActive;

    // timeout 30 ثانية — لو الـ webhook اتأخر
    useEffect(() => {
        if (!isPaid) return;
        const timer = setTimeout(() => setTimedOut(true), 30000);
        return () => clearTimeout(timer);
    }, [isPaid]);

    useEffect(() => {
        if (isActivated && authUserRole !== "artist") {
            refreshUser();
        }
    }, [isActivated, authUserRole, refreshUser]);

    return (
        <div
            className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[var(--color-surface)] font-body"
            dir="rtl"
        >
            <div className="max-w-md w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/60 rounded-2xl p-8 text-center space-y-6 shadow-sm">

                {/* ═══ حالة النجاح + التفعيل ═══ */}
                {isPaid && isActivated && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                                مبروك، أنت الآن فنان! 🎨
                            </h2>
                            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                                تم تفعيل اشتراكك في باقة{" "}
                                <span className="font-semibold text-[var(--color-primary)]">
                                    {subscription?.label}
                                </span>
                                . يمكنك الآن رفع لوحاتك وبدء البيع.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Link to="/dashboard">
                                <Button variant="primary" fullWidth icon={LayoutDashboard}>
                                    لوحة تحكم الفنان
                                </Button>
                            </Link>
                            <Link to="/artworks/new">
                                <Button variant="outline" fullWidth icon={Palette}>
                                    ارفع أول لوحة
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ═══ حالة النجاح + جاري التفعيل (الـ webhook لسه ما خلصش) ═══ */}
                {isPaid && !isActivated && !timedOut && (
                    <>
                        <div className="flex justify-center">
                            <Loader2 className="w-14 h-14 animate-spin text-[var(--color-primary)]" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                                تم الدفع بنجاح!
                            </h2>
                            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                                جاري تفعيل اشتراكك... لحظات وسيتم تحويل حسابك لحساب فنان.
                            </p>
                        </div>
                    </>
                )}

                {/* ═══ حالة النجاح + timeout (الـ webhook اتأخر) ═══ */}
                {isPaid && !isActivated && timedOut && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                                <Crown className="w-12 h-12" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                                تم الدفع بنجاح!
                            </h2>
                            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                                التفعيل بياخد وقت بسيط. هتلاقي اشتراكك مفعّل في البروفايل خلال
                                لحظات. لو ما ظهرش، تواصل مع الدعم.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Link to="/profile">
                                <Button variant="primary" fullWidth icon={LayoutDashboard}>
                                    الذهاب للبروفايل
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ═══ حالة الفشل ═══ */}
                {isFailed && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                                <XCircle className="w-12 h-12" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                                لم تتم عملية الدفع
                            </h2>
                            <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
                                تم رفض أو إلغاء العملية. لم يتم خصم أي مبلغ. يمكنك المحاولة مرة
                                أخرى في أي وقت.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Link to="/subscription">
                                <Button variant="primary" fullWidth icon={RefreshCw}>
                                    حاول مرة أخرى
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ═══ حالة غير معروفة (مفيش status) ═══ */}
                {!isPaid && !isFailed && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                                <Loader2 className="w-12 h-12" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-display text-[var(--color-on-surface)]">
                                جاري التحقق...
                            </h2>
                            <p className="text-[var(--color-on-surface-variant)] text-sm">
                                بنأكد حالة دفعتك. هتلاقي اشتراكك في البروفايل خلال لحظات.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Link to="/profile">
                                <Button variant="primary" fullWidth icon={LayoutDashboard}>
                                    الذهاب للبروفايل
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}