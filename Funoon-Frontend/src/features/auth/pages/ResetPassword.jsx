// features/auth/pages/ResetPasswordPage.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import Button from "../../../components/Ui/Button";
import api from '../../../services/api'
import { toast } from 'react-hot-toast'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

const schema = z.object({
    password: z
        .string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
        .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
    confirmPassword: z.string(),
}).refine(
    (data) => data.password === data.confirmPassword,
    { message: 'كلمتا المرور غير متطابقتين', path: ['confirmPassword'] }
)

// مؤشر قوة كلمة المرور
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

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [passwordValue, setPasswordValue] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    })

    const strength = getPasswordStrength(passwordValue)

    // ── لو مفيش token في الـ URL ────────────────────────────
    if (!token) {
        return (
            <div className="space-y-6 text-right">
                <div className="flex flex-col items-center gap-4 py-8">
                    <XCircle className="w-16 h-16 text-error" />
                    <h1 className="text-2xl font-display text-primary">رابط غير صالح</h1>
                    <p className="text-sm text-on-surface-variant font-body text-center">
                        الرابط غير صحيح أو منتهي الصلاحية.
                        <br />
                        يرجى طلب رابط جديد.
                    </p>
                </div>
                <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="flex items-center justify-center w-full py-4 bg-primary 
                     text-white font-body text-sm font-semibold rounded-none
                     hover:bg-primary/90 transition-premium"
                >
                    طلب رابط جديد
                </Link>
            </div>
        )
    }

    // ── State: تم التغيير بنجاح ──────────────────────────────
    if (success) {
        return (
            <div className="space-y-6 text-right">
                <div className="flex flex-col items-center gap-4 py-8">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-display text-primary">تم التغيير!</h1>
                    <p className="text-sm text-on-surface-variant font-body text-center">
                        تم تغيير كلمة المرور بنجاح.
                        <br />
                        يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                    </p>
                </div>
                <Link
                    to={ROUTES.LOGIN}
                    className="flex items-center justify-center w-full py-4 bg-primary 
                     text-white font-body text-sm font-semibold rounded-none
                     hover:bg-primary/90 transition-premium"
                >
                    تسجيل الدخول
                </Link>
            </div>
        )
    }

    // ── State: الفورم ────────────────────────────────────────
    const onSubmit = async ({ password }) => {
        setLoading(true)
        try {
            await api.post('/auth/reset-password', { token, password })
            setSuccess(true)
        } catch (err) {
            const msg = err?.messageAr || err?.message || 'الرابط منتهي الصلاحية أو غير صحيح'
            toast.error(msg)

            // لو الـ token انتهى، وجّهه يطلب واحد جديد
            if (err?.status === 400) {
                setTimeout(() => navigate(ROUTES.FORGOT_PASSWORD), 2000)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 text-right">
            <div className="space-y-2">
                <h1 className="text-3xl font-display text-primary leading-tight">
                    تعيين كلمة مرور جديدة
                </h1>
                <p className="text-sm text-on-surface-variant font-body">
                    أدخل كلمة المرور الجديدة وتأكد من أنها قوية.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* كلمة المرور */}
                <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">
                        كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', {
                                onChange: (e) => setPasswordValue(e.target.value)
                            })}
                            className="w-full py-3 bg-transparent border-b border-outline/30 
                         focus:border-primary focus:outline-none transition-premium 
                         text-base placeholder-on-surface-variant/40 font-body 
                         rounded-none pl-10"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/50 
                         hover:text-primary transition-premium p-1"
                        >
                            {showPassword
                                ? <EyeOff className="w-4 h-4" />
                                : <Eye className="w-4 h-4" />
                            }
                        </button>
                    </div>

                    {/* مؤشر القوة */}
                    {passwordValue && (
                        <div className="space-y-1 pt-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-outline/20'
                                            }`}
                                    />
                                ))}
                            </div>
                            {strength.label && (
                                <p className="text-xs text-on-surface-variant font-body">
                                    قوة كلمة المرور: <span className="font-semibold">{strength.label}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {errors.password && (
                        <p className="text-xs text-error mt-1.5 font-body">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider font-sans font-semibold text-primary">
                        تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            className="w-full py-3 bg-transparent border-b border-outline/30 
                         focus:border-primary focus:outline-none transition-premium 
                         text-base placeholder-on-surface-variant/40 font-body 
                         rounded-none pl-10"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant/50 
                         hover:text-primary transition-premium p-1"
                        >
                            {showConfirm
                                ? <EyeOff className="w-4 h-4" />
                                : <Eye className="w-4 h-4" />
                            }
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-xs text-error mt-1.5 font-body">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                >
                    {loading ? (
                        <span>جاري الحفظ...</span>

                    ) : (
                        <span>حفظ كلمة المرور</span>
                    )}
                </Button>
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