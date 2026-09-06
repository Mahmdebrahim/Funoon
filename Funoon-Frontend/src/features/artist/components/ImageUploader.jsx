import { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { getMediaUrl } from "../../../utils/media";

export default function ImageUploader({
    files = [],
    setFiles,
    keptExisting = [],      // ✅ الصور الموجودة المحتفظ بيها (editable)
    setKeptExisting,        // ✅ setter
    maxFiles = 10,
}) {
    const inputRef = useRef(null);

    const totalImages = keptExisting.length + files.length;

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        const remaining = maxFiles - totalImages;
        if (remaining <= 0) return;
        setFiles([...files, ...newFiles.slice(0, remaining)]);
        e.target.value = "";
    };

    const removeNewFile = (index) => setFiles(files.filter((_, i) => i !== index));
    const removeExisting = (index) => setKeptExisting(keptExisting.filter((_, i) => i !== index));

    // الغلاف = أول صورة في الـ combined (الموجود الأول، وإلا الجديدة الأولى)
    const isCoverExisting = (i) => i === 0;
    const isCoverNew = (i) => keptExisting.length === 0 && i === 0;

    return (
        <div className="space-y-4">
            {/* ─── Upload Area ─── */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={totalImages >= maxFiles}
                className="w-full border-2 border-dashed border-[var(--color-outline-variant)]/50 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Upload className="w-8 h-8 text-[var(--color-on-surface-variant)]/50" strokeWidth={1.5} />
                <span className="text-sm font-medium text-[var(--color-on-surface)]">
                    {totalImages > 0 ? "إضافة صور أخرى" : "اضغط لرفع الصور"}
                </span>
                <span className="text-xs text-[var(--color-on-surface-variant)]">
                    JPG, PNG, WebP • حتى {maxFiles} صور • الأولى هي الغلاف
                </span>
            </button>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* ─── Existing Images (editable — ليها ✕) ─── */}
            {keptExisting.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-2">
                        الصور الحالية ({keptExisting.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {keptExisting.map((img, i) => (
                            <div key={img.key || i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-outline-variant)]/40 group">
                                <img src={getMediaUrl(img.url)} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeExisting(i)}
                                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                                    title="حذف الصورة"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                {isCoverExisting(i) && (
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded">
                                        غلاف
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── New Files Preview ─── */}
            {files.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-2">
                        صور جديدة ({files.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {files.map((file, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-outline-variant)]/40">
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeNewFile(i)}
                                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                {isCoverNew(i) && (
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded">
                                        غلاف
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {totalImages === 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                    <span>مطلوب صورة واحدة على الأقل</span>
                </div>
            )}
        </div>
    );
}