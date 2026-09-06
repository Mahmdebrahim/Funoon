import { AlertTriangle, Loader2 } from "lucide-react";
import Button from "../../../components/Ui/Button";

export default function DeleteArtworkModal({ artwork, isPending, onConfirm, onCancel }) {
    if (!artwork) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold text-[var(--color-on-surface)]">حذف اللوحة</h3>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">لا يمكن التراجع عن هذا الإجراء</p>
                    </div>
                </div>

                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 leading-relaxed">
                    هل أنت متأكد من حذف لوحة{" "}
                    <span className="font-semibold text-[var(--color-on-surface)]">«{artwork.title}»</span>؟
                    سيتم حذفها نهائياً من المعرض.
                </p>

                <div className="flex gap-3">
                    <Button
                        fullWidth
                        onClick={onConfirm}
                        disabled={isPending}
                        variant="danger"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>حذف نهائياً</span>
                    </Button>
                    <Button variant="ghost" fullWidth onClick={onCancel} disabled={isPending}>
                        إلغاء
                    </Button>
                </div>
            </div>
        </div>
    );
}