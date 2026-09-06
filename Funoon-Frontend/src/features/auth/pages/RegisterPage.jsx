import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ROUTES } from '../../../config/routes'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import Button from "../../../components/Ui/Button";
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import ar from 'react-phone-number-input/locale/ar'

// 1. تحديث الـ Schema ليشمل تأكيد كلمة المرور والتحقق من التطابق
const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح'),
  phone: z
    .string()
    .min(1, 'رقم الجوال مطلوب')
    .refine((val) => val && isValidPhoneNumber(val), 'رقم الجوال غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل'),
  confirmPassword: z.string().min(8, 'يرجى تأكيد كلمة المرور'),
  role: z.enum(['buyer', 'artist']),
  termsAccepted: z.boolean().refine(val => val === true, 'يجب الموافقة على الشروط والأحكام')
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"], // يربط الخطأ بحقل تأكيد كلمة المرور
})

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'ضعيفة', color: 'bg-red-500' },
    { score: 2, label: 'متوسطة', color: 'bg-yellow-500' },
    { score: 3, label: 'جيدة', color: 'bg-blue-500' },
    { score: 4, label: 'قوية', color: 'bg-green-500' },
  ]
  return levels[score]
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // حالة منفصلة للتأكيد
  const [passwordValue, setPasswordValue] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'buyer',
      termsAccepted: false,
      phone: ''
    }
  })

  const strength = getPasswordStrength(passwordValue)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
        termsAccepted: data.termsAccepted
      })

      if (response?.success && response.data) {
        const { userId, email } = response.data
        // احفظ مؤقتاً عشان صفحة التأكيد تقدر تقرأهم
        localStorage.setItem('_funoon_pending_userId', userId)
        localStorage.setItem('_funoon_pending_email', email)
        toast.success('تم إنشاء الحساب — يرجى تأكيد بريدك الإلكتروني')
        localStorage.setItem('otpSentAt', String(Date.now()));
        navigate(`${ROUTES.VERIFY_EMAIL}?userId=${userId}&email=${encodeURIComponent(email)}`)
      }
    } catch (err) {
      console.error('Registration error details:', err)
      const errorMsg = err.message || err.data?.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى التحقق من المدخلات.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 text-right">
      <div className="space-y-2">
        <h1 className="text-3xl font-display text-primary leading-tight">إنشاء حساب جديد</h1>
        <p className="text-sm text-on-surface-variant font-body">
          انضم كفنان لعرض لوحاتك الفنية أو كمقتنٍ لشراء واقتناء الفن السعودي الأصيل.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* الاسم الكامل */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">الاسم الكامل</label>
          <input type="text" {...register('name')} className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none" placeholder="الاسم الثنائي أو الثلاثي" disabled={loading} />
          {errors.name && <p className="text-xs text-error mt-1.5 font-body">{errors.name.message}</p>}
        </div>

        {/* البريد الإلكتروني */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">البريد الإلكتروني</label>
          <input type="email" {...register('email')} className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none" placeholder="yourname@example.com" disabled={loading} />
          {errors.email && <p className="text-xs text-error mt-1.5 font-body">{errors.email.message}</p>}
        </div>

        {/* رقم الجوال */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">رقم الجوال</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <PhoneInput
                  {...field}
                  labels={ar}
                  defaultCountry="SA"
                  countries={['SA']}
                  international
                  withCountryCallingCode
                  placeholder="5xxxxxxxx"
                  disabled={loading}
                  value={field.value || ''}
                  onChange={(value) => field.onChange(value)}
                  className="w-full py-3 bg-transparent border-b border-outline/30 focus-within:border-primary transition-premium text-base font-body rounded-none"
                  inputClassName="w-full bg-transparent focus:outline-none text-base placeholder-on-surface-variant/40 font-body"
                  countrySelectClassName="hidden" // Hide country selector since we only want SA
                  numberInputProps={{
                    className: "w-full bg-transparent focus:outline-none text-base placeholder-on-surface-variant/40 font-body"
                  }}
                  flagClassName="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                  arrowClassName="w-3 h-3 text-on-surface-variant"
                />
              </div>
            )}
          />
          {errors.phone && <p className="text-xs text-error mt-1.5 font-body">{errors.phone.message}</p>}
        </div>

        {/* كلمة المرور */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })}
              className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none pl-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-premium p-1">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordValue && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-outline/20'}`} />
                ))}
              </div>
              {strength.label && <p className="text-xs text-on-surface-variant font-body">قوة كلمة المرور: <span className="font-semibold">{strength.label}</span></p>}
            </div>
          )}
          {errors.password && <p className="text-xs text-error mt-1.5 font-body">{errors.password.message}</p>}
        </div>

        {/* 2. حقل تأكيد كلمة المرور الجديد */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">تأكيد كلمة المرور</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none pl-10"
              placeholder="••••••••"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-premium p-1">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-error mt-1.5 font-body">{errors.confirmPassword.message}</p>}
        </div>

        {/* الشروط والأحكام */}
        <div className="space-y-1 pt-2">
          <div className="flex items-start gap-2.5">
            <input type="checkbox" id="termsAccepted" {...register('termsAccepted')} className="mt-1 accent-primary w-4.5 h-4.5 border-outline/30 rounded-none focus:ring-0 focus:ring-offset-0 cursor-pointer" disabled={loading} />
            <label htmlFor="termsAccepted" className="text-xs text-on-surface-variant leading-normal font-body select-none cursor-pointer">
              أوافق على{' '}
              <Link to={ROUTES.TERMS} className="text-secondary hover:text-primary transition-premium font-semibold underline">الشروط والأحكام</Link>
              {' '}وسياسة العرض والبيع والشحن المعتمدة في منصة فنون.sa.
            </label>
          </div>
          {errors.termsAccepted && <p className="text-xs text-error mt-1.5 font-body">{errors.termsAccepted.message}</p>}
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
        >
          {loading ? "جارى إنشاء الحساب ..." : "إنشاء الحساب"}
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant font-body">
        لديك حساب بالفعل؟{' '}
        <Link to={ROUTES.LOGIN} className="text-secondary hover:text-primary font-semibold transition-premium">سجل الدخول الآن</Link>
      </p>
    </div>
  )
}