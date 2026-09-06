import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldCheck, AlertCircle, Info } from "lucide-react";
import Button from "../../../components/Ui/Button";
import { ROUTES } from "../../../config/routes";
import { useAuthStore } from "../../auth/stores/authStore";
import { useBankAccount, useSetBankAccount } from "../hooks/useProfile";

// ═══════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════
const bankSchema = z.object({
  accountHolder: z
    .string()
    .trim()
    .min(3, "اسم صاحب الحساب يجب أن يكون 3 أحرف على الأقل")
    .max(100, "اسم صاحب الحساب طويل جداً")
    // ✅ ارفض الحروف العربية — نوجّه الفنان يكتب بالإنجليزي
    .refine(
      (v) => !/[\u0600-\u06FF]/.test(v),
      "يرجى كتابة الاسم بالحروف الإنجليزية فقط",
    ),
  iban: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/\s/g, ""))
    .refine((v) => /^SA\d{22}$/.test(v), "صيغة الآيبان غير صحيحة (SA + 22 رقم)"),
  bankName: z
    .string()
    .trim()
    .min(2, "يرجى اختيار البنك")
    .max(100, "اسم البنك طويل جداً"),
});

// ✅ value بالإنجليزي (يتخزن + يُرسل لـ Moyasar) / label عربي (يتعرض)
const SAUDI_BANKS = [
  { value: "Saudi National Bank (SNB)", label: "البنك الأهلي السعودي" },
  { value: "Al Rajhi Bank", label: "مصرف الراجحي" },
  { value: "Riyad Bank", label: "بنك الرياض" },
  { value: "Saudi French Bank (BSF)", label: "البنك السعودي الفرنسي" },
  { value: "SABB", label: "بنك ساب" },
  { value: "Arab National Bank (ANB)", label: "البنك العربي الوطني" },
  { value: "Bank AlBilad", label: "بنك البلاد" },
  { value: "Bank AlJazira", label: "بنك الجزيرة" },
  { value: "Alinma Bank", label: "مصرف الإنماء" },
  { value: "Gulf International Bank (GIB)", label: "بنك الخليج الدولي" },
];

const inputClass =
  "w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body rounded-none";

// ═══════════════════════════════════════════════════
// Label + Tooltip (اللمبة)
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
          {/* Tooltip يظهر عند الـ hover */}
          <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-60 rounded-md bg-stone-800 px-3 py-2 text-[11px] font-body font-normal normal-case tracking-normal text-white leading-relaxed text-right opacity-0 shadow-xl transition-opacity duration-200 group-hover/tip:opacity-100">
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
export default function BankAccountPage() {
  const user = useAuthStore((s) => s.user);
  const { data: bankAccount, isLoading } = useBankAccount();
  const setBankAccount = useSetBankAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountHolder: "",
      iban: "",
      bankName: "",
    },
  });

  useEffect(() => {
    if (bankAccount) {
      reset({
        accountHolder: bankAccount.accountHolder || "",
        iban: bankAccount.iban || "",
        bankName: bankAccount.bankName || "",
      });
    }
  }, [bankAccount, reset]);

  if (user?.role !== "artist") {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }

  const onSubmit = (data) => {
    setBankAccount.mutate(data);
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
        <h2 className="text-xl font-display text-[var(--color-on-surface)]">الحساب البنكي</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 font-body">
          بيانات حسابك لاستلام أرباح مبيعات لوحاتك
        </p>
      </div>

      {/* ─── لم يضف حساب بعد ─── */}
      {!bankAccount && !isLoading && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-[var(--color-surface-container-low)] text-sm text-[var(--color-on-surface-variant)]">
          <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-secondary)]" />
          <p>لم تضف حساباً بنكياً بعد. أضف بياناتك لتمكين سحب الأرباح.</p>
        </div>
      )}

      {/* ─── تم التحقق ─── */}
      {bankAccount?.isVerified && (
        <>
          <div className="flex items-center gap-2 mb-2 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>تم التحقق من حسابك البنكي</span>
          </div>
          <p className="text-xs text-amber-600 mb-6">
            ⚠️ تعديل أي بيانات سيعيد عملية التحقق من قبل الإدارة.
          </p>
        </>
      )}

      {/* ─── قيد المراجعة (بس لو مفيش رفض) ─── */}
      {bankAccount && !bankAccount.isVerified && !bankAccount.rejectionReason && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>حسابك قيد المراجعة من قبل الإدارة</span>
        </div>
      )}

      {/* ─── مرفوض ─── */}
      {bankAccount?.rejectionReason && (
        <div className="flex items-start gap-2 mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">تم رفض حسابك البنكي</p>
            <p className="mt-1">السبب: {bankAccount.rejectionReason}</p>
            <p className="mt-1 text-xs">يرجى تصحيح البيانات وإعادة الإرسال.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ─── اسم صاحب الحساب ─── */}
        <div className="space-y-1">
          <FieldLabel hint="اكتب الاسم الكامل بالحروف الإنجليزية كما يظهر في كشف الحساب البنكي أو بطاقة الهوية، لضمان مطابقة بيانات السحب.">
            اسم صاحب الحساب
          </FieldLabel>
          <input
            type="text"
            {...register("accountHolder")}
            placeholder="e.g. Sara Al-Qahtani"
            dir="ltr"
            className={`${inputClass} text-left`}
            disabled={setBankAccount.isPending}
          />
          {errors.accountHolder && (
            <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.accountHolder.message}</p>
          )}
        </div>

        {/* ─── الآيبان ─── */}
        <div className="space-y-1">
          <FieldLabel hint="الآيبان السعودي يبدأ بـ SA ويتكوّن من 24 خانة. تجده في تطبيق بنكك تحت تفاصيل الحساب.">
            رقم الآيبان (IBAN)
          </FieldLabel>
          <input
            type="text"
            {...register("iban")}
            placeholder="SA00 0000 0000 0000 0000 0000"
            dir="ltr"
            className={`${inputClass} text-left`}
            disabled={setBankAccount.isPending}
          />
          {errors.iban && (
            <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.iban.message}</p>
          )}
        </div>

        {/* ─── اسم البنك ─── */}
        <div className="space-y-1">
          <FieldLabel hint="اختر البنك الذي فيه حسابك. يُرسل اسم البنك بالإنجليزي لبوابة الدفع تلقائياً.">
            اسم البنك
          </FieldLabel>
          <select
            {...register("bankName")}
            className={`${inputClass} cursor-pointer`}
            disabled={setBankAccount.isPending}
          >
            <option value="">اختر البنك</option>
            {SAUDI_BANKS.map((bank) => (
              <option key={bank.value} value={bank.value}>
                {bank.label}
              </option>
            ))}
          </select>
          {errors.bankName && (
            <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.bankName.message}</p>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="md" isLoading={setBankAccount.isPending} disabled={setBankAccount.isPending} >
            {bankAccount ? "تحديث البيانات" : "حفظ الحساب البنكي"}
          </Button>
        </div>
      </form>
    </section>
  );
}