import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate } from "react-router-dom";
import { Loader2, Search, CheckCircle2, Info } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../../components/Ui/Button";
import { ROUTES } from "../../../config/routes";
import { useAuthStore } from "../../auth/stores/authStore";
import { useAddress, useUpdateAddress, useLookupAddress } from "../hooks/useProfile";

// ═══════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════
const addressSchema = z
  .object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    district: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    buildingNo: z.string().trim().optional(),
    shortAddressCode: z.string().trim().optional(),
    secondaryAddressNumber: z.string().trim().optional(),
    lat: z.string().trim().optional(),
    lon: z.string().trim().optional(),
    country: z.string().trim().optional(),
  })
  .refine((data) => data.street || data.city || data.district, {
    message: "يجب إدخال الشارع أو المدينة أو الحي على الأقل",
    path: ["street"],
  });

const inputClass =
  "w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body rounded-none";

// ═══════════════════════════════════════════════════
// Field (label + input + error)
// ═══════════════════════════════════════════════════
function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--color-error)] mt-1.5">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Label + Tooltip (اللمبة) — نفس pattern الـ bank account
// ═══════════════════════════════════════════════════
function FieldLabel({ children, hint }) {
  return (
    <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
      <span>{children}</span>
      {hint && (
        <span className="group/tip relative inline-flex items-center">
          <Info
            className="w-3.5 h-3.5 text-[var(--color-on-surface-variant)] cursor-help hover:text-[var(--color-primary)] transition-colors"
            strokeWidth={1.5}
          />
          <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-72 rounded-md bg-stone-800 px-3 py-2.5 text-[11px] font-body font-normal normal-case tracking-normal text-white leading-relaxed text-right opacity-0 shadow-xl transition-opacity duration-200 group-hover/tip:opacity-100">
            {hint}
          </span>
        </span>
      )}
    </label>
  );
}

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
export default function AddressPage() {
  const user = useAuthStore((s) => s.user);
  const { data: address, isLoading } = useAddress();
  const updateAddress = useUpdateAddress();
  const lookupMutation = useLookupAddress();

  const [verified, setVerified] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      district: "",
      zipCode: "",
      buildingNo: "",
      shortAddressCode: "",
      secondaryAddressNumber: "",
      lat: "",
      lon: "",
      country: "SA",
    },
  });

  // املأ الـ form من العنوان المحفوظ
  useEffect(() => {
    if (address) {
      reset({
        street: address.street || "",
        city: address.city || "",
        district: address.district || "",
        zipCode: address.zipCode || "",
        buildingNo: address.buildingNo || "",
        shortAddressCode: address.shortAddressCode || "",
        secondaryAddressNumber: address.secondaryAddressNumber || "",
        lat: address.lat || "",
        lon: address.lon || "",
        country: address.country || "SA",
      });
    }
  }, [address, reset]);

  // ─── التحقق من الرمز + التعبئة التلقائية ───
  const handleLookup = async () => {
    const code = (getValues("shortAddressCode") || "").trim();
    if (!code) {
      toast.error("أدخل رمز العنوان المختصر أولاً");
      return;
    }
    if (!/^[A-Za-z0-9]{6,10}$/.test(code)) {
      toast.error("صيغة الرمز غير صحيحة (مثال: RRRD2929)");
      return;
    }
    try {
      await lookupMutation.mutateAsync(code.toUpperCase());
      setVerified(true);
      // الـ filling بيحصل تلقائياً: الـ onSuccess بيحدّث الـ query → الـ useEffect بيعمل reset
    } catch {
      // الـ toast بتطلع من الـ hook
    }
  };

  if (user?.role === "admin") {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }

  const onSubmit = (data) => {
    updateAddress.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-6 lg:p-8">
      <div className="mb-6 pb-4 border-b border-[var(--color-outline-variant)]">
        <h2 className="text-xl font-display text-[var(--color-on-surface)]">عنوان الشحن</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 font-body">
          {user?.role === "artist"
            ? "عنوانك للتواصل والشحن عند الحاجة"
            : "عنوانك لاستلام اللوحات التي تشتريها"}
        </p>
      </div>

      {!address && !isLoading && (
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 bg-[var(--color-surface-container-low)] p-4">
          لم تضف عنواناً بعد. أدخل رمز العنوان المختصر لتعبئة البيانات تلقائياً، أو املأ النموذج يدوياً.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ═══ 1) رمز العنوان المختصر — أول وأهم ═══ */}
        <div className="space-y-1.5">
          <FieldLabel hint="رمز العنوان الوطني المختصر (مثال: RRRD2929) — مكوّن من 4 أحرف تليها 4 أرقام. تجده في تطبيق «سبل» أو عبر موقع العنوان الوطني. عند إدخاله صحيحاً تُعبَّأ بيانات العنوان تلقائياً بدقة.">
            رمز العنوان المختصر
          </FieldLabel>

          <div className="flex gap-2">
            <input
              type="text"
              {...register("shortAddressCode")}
              onChange={(e) => {
                // سجل القيمة + أخفي حالة التحقق لو الـ user عدّل الرمز
                register("shortAddressCode").onChange(e);
                setVerified(false);
              }}
              placeholder="RRRD2929"
              dir="ltr"
              className="flex-1 py-3 px-3 bg-transparent border border-[var(--color-outline)]/40 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body rounded-none uppercase text-left tracking-wider"
              disabled={updateAddress.isPending}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupMutation.isPending}
              className="px-5 py-3 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-none hover:opacity-90 transition flex items-center gap-2 shrink-0 disabled:opacity-60"
            >
              {lookupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" strokeWidth={2} />
              )}
              <span>تحقق</span>
            </button>
          </div>

          {/* رابط شرح + preview بعد التحقق */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <a
              href="https://accounts.splonline.com.sa/ar/Registration"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors font-body"
            >
              كيف أحصل على الرمز؟ ↗
            </a>
          </div>

          {verified && lookupMutation.data?.formattedFullAddress && (
            <div className="flex items-start gap-2 mt-1 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-body">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>تم التحقق: {lookupMutation.data.formattedFullAddress}</span>
            </div>
          )}
        </div>

        {/* ═══ Divider ═══ */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-on-surface-variant)] font-body">
          <span className="flex-1 h-px bg-[var(--color-outline-variant)]/40" />
          <span>   أو أدخل العنوان يدوياً صحيحا</span>
          <span className="flex-1 h-px bg-[var(--color-outline-variant)]/40" />
        </div>

        {/* ═══ 2) الحقول اليدوية + overlay loading ═══ */}
        <div className="relative">
          {/* overlay أثناء التحقق */}
          {lookupMutation.isPending && (
            <div className="absolute inset-0 z-10 bg-[var(--color-surface-container-lowest)]/70 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-sm">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mb-2" />
              <span className="text-xs text-[var(--color-on-surface-variant)] font-body">
                جاري جلب تفاصيل العنوان...
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="المدينة" error={errors.city?.message}>
              <input type="text" {...register("city")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>

            <Field label="الحي" error={errors.district?.message}>
              <input type="text" {...register("district")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>

            <Field label="الشارع" error={errors.street?.message}>
              <input type="text" {...register("street")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>

            <Field label="رقم المبنى" error={errors.buildingNo?.message}>
              <input type="text" {...register("buildingNo")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>

            <Field label="الرمز البريدي" error={errors.zipCode?.message}>
              <input type="text" {...register("zipCode")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>

            <Field label="رقم الوحدة / الإضافي" error={errors.secondaryAddressNumber?.message}>
              <input type="text" {...register("secondaryAddressNumber")} className={inputClass} disabled={updateAddress.isPending} />
            </Field>
          </div>
        </div>

        {/* hidden fields للإحداثيات (مهمة للشحن عبر OTO) */}
        <input type="hidden" {...register("lat")} />
        <input type="hidden" {...register("lon")} />

        {/* ═══ حفظ ═══ */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={updateAddress.isPending}
            disabled={!isDirty && !!address || updateAddress.isPending}
          >
            حفظ العنوان
          </Button>
        </div>
      </form>
    </section>
  );
}