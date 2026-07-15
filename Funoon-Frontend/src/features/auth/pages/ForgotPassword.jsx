// features/auth/pages/ForgotPasswordPage.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import api from '../../../services/api'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react'

const schema = z.object({
    email: z.string().trim().email('البريد الإلكتروني غير صحيح'),
})

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [sentEmail, setSentEmail] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    })

    const onSubmit = async ({ email }) => {
        setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setSentEmail(email)
            setSent(true)
        } catch (err) {
            // حتى لو الـ email مش موجود، الـ backend بيرجع success
            // فالـ error هنا يكون network error بس
            toast.error(err?.messageAr || 'حدث خطأ، حاول مجدداً')
        } finally {
            setLoading(false)
        }
    }

    // ── State: تم الإرسال ─────────────────────────────────────
    if (sent) {
        return (
            <div className="space-y-6 text-right">
                <div className="flex flex-col items-center gap-4 py-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-display text-primary">تم الإرسال!</h1>
                    <p className="text-sm text-on-surface-variant font-body text-center leading-relaxed">
                        أرسلنا رابط إعادة تعيين كلمة المرور إلى
                        <br />
                        <span className="font-semibold text-primary">{sentEmail}</span>
                        <br />
                        تحقق من بريدك الإلكتروني واتبع التعليمات.
                    </p>
                    <p className="text-xs text-on-surface-variant/60 font-body text-center">
                        الرابط صالح لمدة 10 دقائق فقط
                    </p>
                </div>

                <div className="space-y-3">
                    {/* إعادة الإرسال */}
                    <button
                        onClick={() => setSent(false)}
                        className="w-full py-3 border border-outline/30 text-on-surface-variant 
                       font-body text-sm hover:border-primary hover:text-primary 
                       transition-all rounded-none"
                    >
                        لم تصلك الرسالة؟ أعد الإرسال
                    </button>

                    {/* رجوع للـ Login */}
                    <Link
                        to={ROUTES.LOGIN}
                        className="flex items-center justify-center gap-2 w-full py-3 
                       bg-primary text-white font-body text-sm font-semibold
                       hover:bg-primary/90 transition-all rounded-none"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </div>
        )
    }

    // ── State: الفورم ─────────────────────────────────────────
    return (
        <div className="space-y-8 text-right">
            <div className="space-y-2">
                <h1 className="text-3xl font-display text-primary leading-tight">
                    نسيت كلمة المرور؟
                </h1>
                <p className="text-sm text-on-surface-variant font-body">
                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">
                        البريد الإلكتروني
                    </label>
                    <input
                        type="email"
                        {...register('email')}
                        className="w-full py-3 bg-transparent border-b border-outline/30 
                       focus:border-primary focus:outline-none transition-premium 
                       text-base placeholder-on-surface-variant/40 font-body rounded-none"
                        placeholder="yourname@example.com"
                        disabled={loading}
                    />
                    {errors.email && (
                        <p className="text-xs text-error mt-1.5 font-body">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white font-body text-sm 
                     font-semibold tracking-wider hover:bg-primary/90 
                     transition-premium flex items-center justify-center gap-2 
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الإرسال...</span>
                        </>
                    ) : (
                        <span>إرسال رابط الاستعادة</span>
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-on-surface-variant font-body">
                تذكرت كلمة المرور؟{' '}
                <Link
                    to={ROUTES.LOGIN}
                    className="text-secondary hover:text-primary font-semibold transition-premium"
                >
                    تسجيل الدخول
                </Link>
            </p>
        </div>
    )
}