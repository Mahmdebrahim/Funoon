import { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, User, Eye, EyeOff, Image as ImageIcon, Globe, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import ar from "react-phone-number-input/locale/ar";
import Button from "../../../components/Ui/Button";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useUploadCoverImage,
  useDeleteCoverImage,
  useChangePassword,
  useDeleteAccount,
} from "../hooks/useProfile";
import { getMediaUrl } from "../../../utils/media";
import { PLANS } from "../../subscription/config/plans";

const profileSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), "رقم الجوال غير صحيح"),
  bio: z.string().max(500, "النبذة يجب ألا تتجاوز 500 حرف").optional(),
});

const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  snapchat: z.string().optional(),
  website: z
    .string()
    .url("الرابط غير صحيح")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string().min(8, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "كلمة المرور الجديدة يجب أن تختلف عن الحالية",
    path: ["newPassword"],
  });

const deleteSchema = z.object({
  password: z.string().min(1, "كلمة المرور مطلوبة للتأكيد"),
  confirmDelete: z.boolean().refine((v) => v === true, "يجب الموافقة على حذف الحساب"),
});

function SectionCard({ title, description, children, badge }) {
  return (
    <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-6 lg:p-8">
      <div className="mb-6 pb-4 border-b border-[var(--color-outline-variant)]">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-display text-[var(--color-on-surface)]">{title}</h2>
          {badge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 font-body">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

// ═══ Avatar Upload ═══
function AvatarSection({ profile }) {
  const fileInputRef = useRef(null);
  const uploadAvatar = useUploadAvatar();
  const avatarUrl = getMediaUrl(profile?.avatar);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    uploadAvatar.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <div className="w-24 h-24 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-premium"
        >
          <Camera className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-on-surface)]">الصورة الشخصية</p>
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 mb-3">
          JPG أو PNG، بحد أقصى 10 ميجابايت
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={uploadAvatar.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          تغيير الصورة
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// ═══ Cover Image (Plus/Prestige) ═══
function CoverImageSection({ profile }) {
  const fileInputRef = useRef(null);
  const uploadCover = useUploadCoverImage();
  const deleteCover = useDeleteCoverImage();
  const coverUrl = getMediaUrl(profile?.coverImage);
  const hasPremium = profile?.subscription?.plan === "opal_plus" || profile?.subscription?.plan === "opal_prestige";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    uploadCover.mutate(file);
    e.target.value = "";
  };

  if (!hasPremium) return null;

  return (
    <div className="space-y-4">
      <div className="relative group aspect-[16/6] bg-[var(--color-surface-container-high)] overflow-hidden border border-[var(--color-outline-variant)]/40">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-[var(--color-on-surface-variant)]/40" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-premium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadCover.isPending}
            className="px-4 py-2 bg-white text-stone-800 text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-stone-100"
          >
            <Camera className="w-3.5 h-3.5" />
            {coverUrl ? "تغيير" : "رفع"}
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => {
                if (confirm("حذف صورة الغلاف؟")) deleteCover.mutate();
              }}
              disabled={deleteCover.isPending}
              className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          يُفضل رفع صورة بحجم 1600×600 بكسل لأفضل عرض
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// ═══ Social Links (Plus/Prestige) ═══
function SocialLinksForm({ profile }) {
  const updateProfile = useUpdateProfile();
  const hasPremium = profile?.subscription?.plan === "opal_plus" || profile?.subscription?.plan === "opal_prestige";

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      instagram: profile?.socialLinks?.instagram || "",
      twitter: profile?.socialLinks?.twitter || "",
      website: profile?.socialLinks?.website || "",
      facebook: profile?.socialLinks?.facebook || "",
      snapchat: profile?.socialLinks?.snapchat || "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        instagram: profile.socialLinks?.instagram || "",
        twitter: profile.socialLinks?.twitter || "",
        website: profile.socialLinks?.website || "",
        facebook: profile?.socialLinks?.facebook || "",
        snapchat: profile?.socialLinks?.snapchat || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data) => {
    updateProfile.mutate({
      socialLinks: {
        instagram: data.instagram || undefined,
        twitter: data.twitter || undefined,
        website: data.website || undefined,
        facebook: data.facebook || undefined,
        snapchat: data.snapchat || undefined,
      },
    });
  };

  if (!hasPremium) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)] flex items-center gap-2">
          {/* <Instagram className="w-3.5 h-3.5" /> */}
          Instagram
        </label>
        <input
          type="text"
          {...register("instagram")}
          placeholder="username"
          disabled={updateProfile.isPending}
          className="w-full py-3 px-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-sm font-body"
        />
        {errors.instagram && (
          <p className="text-xs text-[var(--color-error)] mt-1">{errors.instagram.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)] flex items-center gap-2">
          Facebook
        </label>
        <input
          type="text"
          {...register("facebook")}
          placeholder="username"
          disabled={updateProfile.isPending}
          className="w-full py-3 px-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-sm font-body"
        />
        {errors.facebook && (
          <p className="text-xs text-[var(--color-error)] mt-1">{errors.instagram.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)] flex items-center gap-2">
          Snapchat
        </label>
        <input
          type="text"
          {...register("snapchat")}
          placeholder="username"
          disabled={updateProfile.isPending}
          className="w-full py-3 px-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-sm font-body"
        />
        {errors.snapchat && (
          <p className="text-xs text-[var(--color-error)] mt-1">{errors.instagram.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)] flex items-center gap-2">
          {/* <Twitter className="w-3.5 h-3.5" /> */}
          Facebook
        </label>
        <input
          type="text"
          {...register("twitter")}
          placeholder="@username"
          disabled={updateProfile.isPending}
          className="w-full py-3 px-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-sm font-body"
        />
        {errors.twitter && (
          <p className="text-xs text-[var(--color-error)] mt-1">{errors.twitter.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)] flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          الموقع الإلكتروني
        </label>
        <input
          type="url"
          {...register("website")}
          placeholder="https://yourwebsite.com"
          disabled={updateProfile.isPending}
          className="w-full py-3 px-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-sm font-body"
          dir="ltr"
        />
        {errors.website && (
          <p className="text-xs text-[var(--color-error)] mt-1">{errors.website.message}</p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={updateProfile.isPending}
          disabled={!isDirty}
        >
          حفظ الروابط
        </Button>
      </div>
    </form>
  );
}

// ═══ Profile Form ═══
function ProfileForm({ profile }) {
  const updateProfile = useUpdateProfile();
  const isArtist = profile?.role === "artist";

  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      phone: data.phone || undefined,
    };
    if (isArtist) payload.bio = data.bio || "";
    updateProfile.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AvatarSection profile={profile} />

      <div className="space-y-1 pt-4">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
          الاسم الكامل
        </label>
        <input
          type="text"
          {...register("name")}
          className="w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body"
          disabled={updateProfile.isPending}
        />
        {errors.name && (
          <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={profile?.email || ""}
          disabled
          className="w-full py-3 bg-transparent border-b border-[var(--color-outline)]/20 text-[var(--color-on-surface-variant)] cursor-not-allowed font-body"
        />
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
          لا يمكن تغيير البريد الإلكتروني
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
          رقم الجوال
        </label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              {...field}
              labels={ar}
              defaultCountry="SA"
              countries={["SA"]}
              international
              withCountryCallingCode
              placeholder="5xxxxxxxx"
              disabled={updateProfile.isPending}
              value={field.value || ""}
              onChange={(value) => field.onChange(value || "")}
              className="w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus-within:border-[var(--color-primary)] transition-premium text-base font-body"
              countrySelectClassName="hidden"
            />
          )}
        />
        {errors.phone && (
          <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.phone.message}</p>
        )}
      </div>

      {isArtist && (
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
            نبذة عنك
          </label>
          <textarea
            {...register("bio")}
            rows={4}
            maxLength={500}
            placeholder="اكتب نبذة قصيرة عنك كفنان..."
            className="w-full py-3 px-0 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body resize-none"
            disabled={updateProfile.isPending}
          />
          {errors.bio && (
            <p className="text-xs text-[var(--color-error)] mt-1.5">{errors.bio.message}</p>
          )}
        </div>
      )}

      <div className="pt-2">
        <Button type="submit" variant="primary" size="md" isLoading={updateProfile.isPending} disabled={!isDirty}>
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}

// ═══ Change Password ═══
function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() },
    );
  };

  const inputClass =
    "w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body pl-10";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {[
        { name: "currentPassword", label: "كلمة المرور الحالية", show: showCurrent, setShow: setShowCurrent },
        { name: "newPassword", label: "كلمة المرور الجديدة", show: showNew, setShow: setShowNew },
        { name: "confirmPassword", label: "تأكيد كلمة المرور", show: showConfirm, setShow: setShowConfirm },
      ].map(({ name, label, show, setShow }) => (
        <div key={name} className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--color-primary)]">
            {label}
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              {...register(name)}
              className={inputClass}
              disabled={changePassword.isPending}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]/50 hover:text-[var(--color-primary)] p-1"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors[name] && (
            <p className="text-xs text-[var(--color-error)] mt-1.5">{errors[name].message}</p>
          )}
        </div>
      ))}
      <Button type="submit" variant="secondary" size="md" isLoading={changePassword.isPending}>
        تغيير كلمة المرور
      </Button>
    </form>
  );
}

// ═══ Delete Account ═══
function DeleteAccountForm() {
  const deleteAccount = useDeleteAccount();
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(deleteSchema),
    defaultValues: { confirmDelete: false },
  });

  const onSubmit = (data) => deleteAccount.mutate(data.password);

  if (!showConfirm) {
    return (
      <div>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
          حذف حسابك نهائياً. لن تتمكن من استعادته بعد ذلك.
        </p>
        <Button type="button" variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
          حذف الحساب
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-[var(--color-error)]">
        هذا الإجراء لا يمكن التراجع عنه. أدخل كلمة المرور للتأكيد.
      </p>
      <input
        type="password"
        {...register("password")}
        className="w-full py-3 bg-transparent border-b border-[var(--color-outline)]/30 focus:border-[var(--color-primary)] focus:outline-none transition-premium text-base font-body"
        disabled={deleteAccount.isPending}
      />
      {errors.password && (
        <p className="text-xs text-[var(--color-error)]">{errors.password.message}</p>
      )}
      <div className="flex items-start gap-2.5">
        <input type="checkbox" id="confirmDelete" {...register("confirmDelete")} className="mt-1 accent-[var(--color-error)] w-4 h-4" />
        <label htmlFor="confirmDelete" className="text-xs text-[var(--color-on-surface-variant)]">
          أؤكد رغبتي في حذف حسابي نهائياً
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="danger" size="sm" isLoading={deleteAccount.isPending}>
          تأكيد الحذف
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowConfirm(false)} disabled={deleteAccount.isPending}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

// ═══ Main Page ═══
export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  if (isLoading) return null;

  const isArtist = profile?.role === "artist";
  const hasPremium = profile?.subscription?.plan === "opal_plus" || profile?.subscription?.plan === "opal_prestige";

  return (
    <div className="space-y-8">
      <SectionCard title="البيانات الشخصية" description="حدّث معلوماتك الأساسية وصورتك الشخصية">
        <ProfileForm profile={profile} />
      </SectionCard>

      {isArtist && hasPremium && (
        <SectionCard
          title="صورة الغلاف"
          description="اجعل بروفايلك مميزاً بصورة غلاف احترافية"
          badge="Plus / Prestige"
        >
          <CoverImageSection profile={profile} />
        </SectionCard>
      )}

      {isArtist && hasPremium && (
        <SectionCard
          title="الروابط الاجتماعية"
          description="أضف روابط حساباتك الاجتماعية لتواصل أكبر مع جمهورك"
          badge="Plus / Prestige"
        >
          <SocialLinksForm profile={profile} />
        </SectionCard>
      )}

      <SectionCard title="كلمة المرور" description="غيّر كلمة المرور لحماية حسابك">
        <ChangePasswordForm />
      </SectionCard>

      <SectionCard title="حذف الحساب">
        <DeleteAccountForm />
      </SectionCard>
    </div>
  );
}