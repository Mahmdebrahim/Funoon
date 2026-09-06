import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersService } from "../services/orders.service";
import Button from "../../../components/Ui/Button";

const CANCEL_REASONS = [
    "غيّرت رأيي",
    "وجدت سعر أفضل",
    "الطلب بالخطأ",
    "مدة التوصيل طويلة",
    "أخرى",
];

export default function CancelOrderModal({ orderId, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const cancelMutation = useMutation({
        mutationFn: () =>
            ordersService.cancelOrder(
                orderId,
                selectedReason === "أخرى" ? customReason : selectedReason,
            ),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });

            const hasRefund = data?.refund;
            toast.success(
                hasRefund
                    ? "تم إلغاء الطلب وسيتم إرجاع المبلغ خلال 3-14 يوم عمل"
                    : "تم إلغاء الطلب بنجاح",
            );
            onClose();
        },
        onError: (error) => {
            toast.error(error?.message || "فشل إلغاء الطلب. حاول مرة أخرى.");
        },
    });

    const handleConfirm = () => {
        if (!selectedReason) {
            toast.error("يرجى اختيار سبب الإلغاء");
            return;
        }
        if (selectedReason === "أخرى" && !customReason.trim()) {
            toast.error("يرجى كتابة السبب");
            return;
        }
        cancelMutation.mutate();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>

                        <Dialog.Content asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                            >
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto">
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
                                        <Dialog.Title className="font-display text-xl text-on-surface flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            <span>إلغاء الطلب</span>
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-premium">
                                                <X className="w-5 h-5" strokeWidth={1.5} />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 space-y-5">
                                        <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                                            هل أنت متأكد من إلغاء هذا الطلب؟
                                            {orderId && (
                                                <span className="block mt-1 font-mono text-xs text-on-surface">
                                                    #{orderId.slice(-8).toUpperCase()}
                                                </span>
                                            )}
                                        </p>

                                        {/* Reason selection */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-body font-semibold uppercase tracking-wide text-on-surface-variant">
                                                سبب الإلغاء *
                                            </label>
                                            <div className="space-y-2">
                                                {CANCEL_REASONS.map((reason) => (
                                                    <label
                                                        key={reason}
                                                        className={`flex items-center gap-3 p-3 border cursor-pointer transition-premium ${selectedReason === reason
                                                                ? "border-primary bg-primary/5"
                                                                : "border-outline-variant/40 hover:border-outline-variant"
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="cancelReason"
                                                            value={reason}
                                                            checked={selectedReason === reason}
                                                            onChange={(e) => setSelectedReason(e.target.value)}
                                                            className="accent-[var(--color-primary)]"
                                                        />
                                                        <span className="text-sm font-body text-on-surface">{reason}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Custom reason */}
                                            {selectedReason === "أخرى" && (
                                                <textarea
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    placeholder="اكتب السبب هنا..."
                                                    rows={3}
                                                    className="w-full p-3 bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none text-sm font-body resize-none"
                                                />
                                            )}
                                        </div>

                                        {/* Refund note */}
                                        <div className="bg-amber-50 border border-amber-200 p-3 text-xs font-body text-amber-800 leading-relaxed">
                                            💡 إذا كان الطلب مدفوعاً، سيتم إرجاع المبلغ كاملاً إلى حسابك خلال 3-14 يوم عمل حسب البنك.
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex gap-3 p-5 border-t border-outline-variant/30">
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            onClick={onClose}
                                            disabled={cancelMutation.isPending}
                                        >
                                            تراجع
                                        </Button>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={handleConfirm}
                                            isLoading={cancelMutation.isPending}
                                            // className="!bg-red-600 hover:!bg-red-700"
                                        >
                                            تأكيد الإلغاء
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}