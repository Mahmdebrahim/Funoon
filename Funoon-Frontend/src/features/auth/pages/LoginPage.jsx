import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ROUTES } from '../../../config/routes'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import Button from "../../../components/Ui/Button";
const loginSchema = z.object({
  email: z.string().trim().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      })

      if (response?.success && response.data) {
        const { user, accessToken } = response.data
        login(user, accessToken)
        toast.success('مرحباً بك! تم تسجيل الدخول بنجاح')

        if (user.role === 'admin') {
          navigate(ROUTES.ADMIN)
        } else if (user.role === 'artist') {
          navigate(ROUTES.ARTIST_DASHBOARD)
        } else {
          navigate(ROUTES.HOME)
        }
      }
    } catch (err) {
      // ✅ axios interceptor بيعمل reshape — err هنا هو الـ body مباشرة
      const status = err?.status;  // axios بيضيف status في الـ body
      const body = err || {};  // err نفسه هو الـ body

      console.log("🔍 Login error:", { err, status, body });

      // ✅ حالة 429: Rate Limit
      if (status === 429) {
        const msg = typeof body?.message === 'string'
          ? body.message
          : 'تم تجاوز عدد المحاولات — حاول بعد 15 دقيقة';
        toast.error(msg);
        return;
      }

      // ✅ استخراج needsVerification — من err.data مباشرة
      let needsData = null;

      if (body?.data?.needsVerification) {
        needsData = body.data;
      } else if (body?.needsVerification) {
        needsData = body;
      }

      if (needsData?.userId) {
        localStorage.setItem('_funoon_pending_userId', needsData.userId);
        localStorage.setItem('_funoon_pending_email', needsData.email || '');
        localStorage.setItem('otpSentAt', String(Date.now()));
        toast('يرجى تأكيد بريدك الإلكتروني — تم إرسال رمز جديد', { icon: '📧' });
        navigate(`${ROUTES.VERIFY_EMAIL}?userId=${needsData.userId}&email=${encodeURIComponent(needsData.email || '')}`);
        return;
      }

      // ✅ رسائل الأخطاء العادية
      let msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      if (typeof body?.message === 'string') msg = body.message;
      else if (status === 500) msg = 'حدث خطأ في الخادم';
      else if (status === 429) msg = 'تم تجاوز عدد المحاولات';

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 text-right">
      {/* Title block */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display text-primary leading-tight">تسجيل الدخول</h1>
        <p className="text-sm text-on-surface-variant font-body">
          أهلاً بك مجدداً في معرض فنون! يرجى إدخال بيانات حسابك للمتابعة.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none"
            placeholder="yourname@example.com"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-xs text-error mt-1.5 font-body">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">
            كلمة المرور
          </label>
          <input
            type="password"
            {...register('password')}
            className="w-full py-3 bg-transparent border-b border-outline/30 focus:border-primary focus:outline-none transition-premium text-base placeholder-on-surface-variant/40 font-body rounded-none"
            placeholder="••••••••"
            disabled={loading}
          />
          {errors.password && (
            <p className="text-xs text-error mt-1.5 font-body">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none font-body">
            <input
              type="checkbox"
              className="accent-primary w-4.5 h-4.5 border-outline/30 rounded-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-on-surface-variant">تذكرني في هذا المتصفح</span>
          </label>

          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-secondary hover:text-primary transition-premium font-semibold font-body"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
        >
          {loading ? "جاري التحقق..." : "تسجيل الدخول"}
        </Button>
      </form>

      {/* Alternative flow */}
      <p className="text-center text-sm text-on-surface-variant font-body">
        ليس لديك حساب فنان؟{' '}
        <Link to={ROUTES.REGISTER} className="text-secondary hover:text-primary font-semibold transition-premium">
          أنشئ حسابك الآن
        </Link>
      </p>
    </div>
  )
}
