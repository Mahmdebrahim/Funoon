import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersService } from "../services/orders.service";
import Button from "../../../components/Ui/Button";

export default function ConfirmDeliveryModal({ orderId, isOpen, onClose }) {
    const queryClient = useQueryClient();

    const confirmMutation = useMutation({
        mutationFn: () => ordersService.confirmDelivery(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            toast.success("تم تأكيد الاستلام بنجاح! تم تحويل الأموال للفنان ");
            onClose();
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "فشل تأكيد الاستلام. حاول مرة أخرى.",
            );
        },
    });

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
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <span>تأكيد استلام الطلب</span>
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
                                            هل تأكدت من استلام اللوحة بحالة جيدة؟
                                            {orderId && (
                                                <span className="block mt-1 font-mono text-xs text-on-surface">
                                                    #{orderId.slice(-8).toUpperCase()}
                                                </span>
                                            )}
                                        </p>

                                        <div className="bg-emerald-50 border border-emerald-200 p-3 text-xs font-body text-emerald-800 leading-relaxed">
                                            💡 بتأكيدك الاستلام سيتم تحويل المبلغ للفنان مباشرةً وإغلاق الطلب.
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 p-3 text-xs font-body text-amber-800 leading-relaxed">
                                            ⚠️ إذا كانت هناك مشكلة في الطلب (تلف، قطعة خاطئة...) لا تُؤكد الاستلام وتواصل مع الدعم أولاً.
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex gap-3 p-5 border-t border-outline-variant/30">
                                        <Button
                                            variant="ghost"
                                            fullWidth
                                            onClick={onClose}
                                            disabled={confirmMutation.isPending}
                                        >
                                            تراجع
                                        </Button>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={() => confirmMutation.mutate()}
                                            isLoading={confirmMutation.isPending}
                                            className="!bg-emerald-600 hover:!bg-emerald-700"
                                        >
                                            تأكيد الاستلام
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