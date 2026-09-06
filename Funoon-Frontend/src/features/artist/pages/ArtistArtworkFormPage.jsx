import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import {
    useCreateArtwork,
    useUpdateArtwork,
    useArtwork,
} from "../hooks/useDashboard";
import { CATEGORIES, PAINT_TYPES, CANVAS_THICKNESS_OPTIONS, DIMENSION_TYPES } from "../config/categories";
import { ROUTES } from "../../../config/routes";
import Button from "../../../components/Ui/Button";
import ImageUploader from "../components/ImageUploader";
import TagsInput from "../components/TagsInput";

// ═══════════════════════════════════════════════════
// Validation (يطابق الـ backend validator)
// ═══════════════════════════════════════════════════
const artworkSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "العنوان مطلوب")
        .max(100, "العنوان لا يتجاوز 100 حرف"),
    description: z
        .string()
        .trim()
        .min(1, "الوصف مطلوب")
        .max(2000, "الوصف لا يتجاوز 2000 حرف"),
    price: z.coerce
        .number({ invalid_type_error: "السعر يجب أن يكون رقماً" })
        .min(1, "السعر يجب أن يكون 1 ر.س على الأقل")
        .max(5000, "السعر لا يمكن أن يتجاوز 5,000 ر.س في الفترة التجريبية الحالية"),
    weight: z.coerce.number().min(0.1, "الوزن يجب أن يكون 0.1 كجم على الأقل"),
    width: z.coerce.number().min(0.1, "العرض مطلوب"),
    height: z.coerce.number().min(0.1, "الارتفاع مطلوب"),
    depth: z.coerce.number().min(0, "العمق لا يمكن أن يكون سالباً").optional().or(z.literal(0)),
    category: z.string().optional(),
    paintType: z.string().optional(),
    canvasThickness: z.string().optional(),
    dimensionType: z.enum(["2D", "3D"]).default("2D"),
    medium: z.string().trim().max(100, "الوسيط لا يتجاوز 100 حرف").optional(),
});

const inputClass =
    "w-full p-3 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors text-sm rounded-lg";

function Field({ label, error, required, children, hint }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-[var(--color-on-surface-variant)]/70">{hint}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
export default function ArtistArtworkFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const createMutation = useCreateArtwork();
    const updateMutation = useUpdateArtwork();
    const { data: existingArtwork, isLoading: isArtworkLoading } = useArtwork(id);

    const artworkData = existingArtwork?.artwork || existingArtwork;


    const [files, setFiles] = useState([]);
    const [keptExisting, setKeptExisting] = useState([]);
    const [tags, setTags] = useState([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(artworkSchema),
        defaultValues: {
            title: "",
            description: "",
            price: "",
            weight: "",
            width: "",
            height: "",
            depth: "",
            category: "",
            paintType: "",
            canvasThickness: "",
            dimensionType: "2D",
            medium: "",
        },
    });

    // ─── Edit mode: املأ الـ form ───
    useEffect(() => {
        if (isEdit && artworkData) {
            reset({
                title: artworkData.title || "",
                description: artworkData.description || "",
                price: artworkData.price || "",
                weight: artworkData.weight || "",
                width: artworkData.dimensions?.width || "",
                height: artworkData.dimensions?.height || "",
                depth: artworkData.dimensions?.depth || "",
                category: artworkData.category || "",
                paintType: artworkData.paintType || artworkData.medium || "",
                canvasThickness: artworkData.canvasThickness || "",
                dimensionType: artworkData.dimensionType || "2D",
                medium: artworkData.medium || "",
            });
            setTags(artworkData.tags || []);
            setKeptExisting(artworkData.images || []); // ✅ الصور الموجودة
        }
    }, [isEdit, artworkData, reset]);

    const onSubmit = (data) => {
        // ✅ لازم صورة على الأقل (موجود + جديد) — في الـ create والـ edit
        if (keptExisting.length + files.length === 0) {
            toast.error("اللوحة لازم يكون فيها صورة واحدة على الأقل");
            return;
        }

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("price", data.price);
        formData.append("weight", data.weight);
        formData.append(
            "dimensions",
            JSON.stringify({
                width: Number(data.width),
                height: Number(data.height),
                depth: Number(data.depth) || 0,
            }),
        );
        if (data.category) formData.append("category", data.category);
        if (data.paintType) formData.append("paintType", data.paintType);
        if (data.canvasThickness) formData.append("canvasThickness", data.canvasThickness);
        if (data.dimensionType) formData.append("dimensionType", data.dimensionType);
        if (data.medium) formData.append("medium", data.medium);
        if (tags.length > 0) formData.append("tags", JSON.stringify(tags));

        // ✅ قائمة الـ keys اللي عايز تحتفظ بيها (الـ backend يحذف الباقي)
        formData.append("existingImageKeys", JSON.stringify(keptExisting.map((i) => i.key)));

        // صور جديدة
        files.forEach((file) => formData.append("images", file));

        if (isEdit) {
            updateMutation.mutate({ id, formData }, { onSuccess: () => navigate(ROUTES.MY_ARTWORKS) });
        } else {
            createMutation.mutate(formData, { onSuccess: () => navigate(ROUTES.MY_ARTWORKS) });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    // ─── Edit loading ───
    if (isEdit && isArtworkLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex items-center gap-3">
                <Link
                    to={ROUTES.MY_ARTWORKS}
                    className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">
                        {isEdit ? "تعديل اللوحة" : "رفع لوحة جديدة"}
                    </h1>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
                        {isEdit
                            ? "عدّل تفاصيل لوحتك الفنية"
                            : "أضف لوحة فنية جديدة لتظهر في المعرض"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* ═══ Section 1: الصور ═══ */}
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-6">
                    <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)] mb-4">
                        صور اللوحة <span className="text-red-500">*</span>
                    </h2>
                    <ImageUploader
                        files={files}
                        setFiles={setFiles}
                        keptExisting={keptExisting}      
                        setKeptExisting={setKeptExisting} 
                        maxFiles={10}
                    />
                </section>

                {/* ═══ Section 2: المعلومات الأساسية ═══ */}
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
                        المعلومات الأساسية
                    </h2>

                    <Field label="عنوان اللوحة" required error={errors.title?.message}>
                        <input type="text" {...register("title")} placeholder="مثال: غروب على شاطئ جدة" className={inputClass} />
                    </Field>

                    <Field label="الوصف" required error={errors.description?.message}>
                        <textarea
                            {...register("description")}
                            rows={5}
                            placeholder="اكتب وصفاً تفصيلياً للوحة: الفكرة، الخامات، الإلهام..."
                            className={`${inputClass} resize-none`}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="السعر (ر.س)" required error={errors.price?.message} hint="حد أقصى 5,000 ر.س للفترة التجريبية الحالية">
                            <input type="number" min="0" step="1" {...register("price")} placeholder="1500" className={inputClass} />
                        </Field>

                        <Field label="الوزن (كجم)" required error={errors.weight?.message}>
                            <input type="number" min="0" step="0.1" {...register("weight")} placeholder="2.5" className={inputClass} />
                        </Field>
                    </div>
                </section>

                {/* ═══ Section 3: الأبعاد والأبعاد الهندسية ═══ */}
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
                        الأبعاد ونوع اللوحة
                    </h2>
                    
                    <Field label="نوع أبعاد اللوحة (2D / 3D)" error={errors.dimensionType?.message}>
                        <div className="flex gap-4">
                            {DIMENSION_TYPES.map((dim) => (
                                <label key={dim.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                    <input
                                        type="radio"
                                        value={dim.value}
                                        {...register("dimensionType")}
                                        className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                                    />
                                    <span>{dim.label}</span>
                                </label>
                            ))}
                        </div>
                    </Field>

                    <div className="grid grid-cols-3 gap-4">
                        <Field label="العرض (سم)" required error={errors.width?.message}>
                            <input type="number" min="0" step="0.1" {...register("width")} placeholder="80" className={inputClass} />
                        </Field>
                        <Field label="الارتفاع (سم)" required error={errors.height?.message}>
                            <input type="number" min="0" step="0.1" {...register("height")} placeholder="60" className={inputClass} />
                        </Field>
                        <Field label="العمق (سم)" error={errors.depth?.message}>
                            <input type="number" min="0" step="0.1" {...register("depth")} placeholder="0" className={inputClass} />
                        </Field>
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                        💡 لو أي بُعد أكبر من 120 سم، اللوحة هتتصنف كـ "شحن عملاق" تلقائياً.
                    </p>
                </section>

                {/* ═══ Section 4: مواصفات اللوحة والتصنيف ═══ */}
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-display font-semibold text-[var(--color-on-surface)]">
                        مواصفات اللوحة والتصنيف
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="التصنيف الفني" error={errors.category?.message}>
                            <select {...register("category")} className={`${inputClass} cursor-pointer`}>
                                <option value="">اختر التصنيف</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="نوع الألوان المستخدمة" error={errors.paintType?.message}>
                            <select {...register("paintType")} className={`${inputClass} cursor-pointer`}>
                                <option value="">اختر نوع الألوان</option>
                                {PAINT_TYPES.map((pt) => (
                                    <option key={pt.value} value={pt.value}>
                                        {pt.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="سماكة قماش الكانفاس (Canvas)" error={errors.canvasThickness?.message}>
                            <select {...register("canvasThickness")} className={`${inputClass} cursor-pointer`}>
                                <option value="">اختر سماكة الكانفاس</option>
                                {CANVAS_THICKNESS_OPTIONS.map((ct) => (
                                    <option key={ct.value} value={ct.value}>
                                        {ct.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="الوسيط / خامات إضافية" error={errors.medium?.message} hint="ألوان زيتية، أوراق ذهب على قماش...">
                            <input type="text" {...register("medium")} placeholder="تفاصيل إضافية للخامات" className={inputClass} />
                        </Field>
                    </div>

                    <Field label="الوسوم (Tags)" hint="تساعد المشترين يلاقوا لوحتك في البحث">
                        <TagsInput tags={tags} setTags={setTags} />
                    </Field>
                </section>

                {/* ═══ Submit ═══ */}
                <div className="flex gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isPending}
                        icon={Save}
                    >
                        {isEdit ? "حفظ التعديلات" : "نشر اللوحة"}
                    </Button>
                    <Link to={ROUTES.MY_ARTWORKS}>
                        <Button type="button" variant="outline" size="md">
                            إلغاء
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}