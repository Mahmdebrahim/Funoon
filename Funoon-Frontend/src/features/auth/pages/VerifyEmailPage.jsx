import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Mail, RefreshCw, AlertCircle } from 'lucide-react'
import { ROUTES } from '../../../config/routes'
import { useAuthStore } from '../stores/authStore'
import authService from '../../../services/auth.service'
import Button from '../../../components/Ui/Button'

// ─── مدة صلاحية الـ OTP (لازم تكون نفس المدة في الباك) ───
const OTP_TTL_MS = 5 * 60 * 1000
const OTP_TTL_SECONDS = OTP_TTL_MS / 1000

// ─── OTP Input Component ─────────────────────────────────────────────────────
function OTPInput({ length = 6, value, onChange, disabled, error }) {
  const inputRefs = useRef([])

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) return

    const newVal = value.split('')
    newVal[index] = val[val.length - 1]
    onChange(newVal.join(''))

    if (index < length - 1 && val) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const newVal = value.split('')
        newVal[index] = ''
        onChange(newVal.join(''))
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newVal = value.split('')
        newVal[index - 1] = ''
        onChange(newVal.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length)
    if (!pasted) return
    onChange(pasted.padEnd(length, '').slice(0, length))
    const focusIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          id={`otp-input-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`رقم التأكيد ${i + 1}`}
          className={`
            w-12 h-14 text-center text-2xl font-mono font-bold
            border-2 rounded-lg transition-all duration-200
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-[var(--color-error)] bg-[var(--color-error)]/5 text-[var(--color-error)]'
              : value[i]
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]'
            }
            focus:border-[var(--color-primary)] focus:bg-[var(--color-primary)]/5
          `}
        />
      ))}
    </div>
  )
}

// ─── Countdown Timer — بيدعم function عشان يحسب المتبقي من localStorage ───
function useCountdown(initialOrFn) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof initialOrFn === 'function') return initialOrFn()
    return initialOrFn
  })

  const reset = useCallback((newSeconds) => {
    setTimeLeft(newSeconds ?? OTP_TTL_SECONDS)
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const formatted = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
  return { timeLeft, formatted, reset }
}

// ─── Helper: احسب المتبقي من وقت الإرسال الحقيقي ───
function getRemainingSeconds() {
  const sentAt = Number(localStorage.getItem('otpSentAt') || 0)
  if (!sentAt) return OTP_TTL_SECONDS
  const elapsed = Date.now() - sentAt
  return Math.max(0, Math.floor((OTP_TTL_MS - elapsed) / 1000))
}

// ─── Main VerifyEmailPage ────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, user, isAuthenticated } = useAuthStore()

  // اقرأ userId + email من query params أو localStorage
  const userId =
    searchParams.get('userId') ||
    localStorage.getItem('_funoon_pending_userId')
  const email =
    searchParams.get('email') ||
    localStorage.getItem('_funoon_pending_email')

  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // ✅ لو مفيش otpSentAt (أول مرة تفتح الصفحة) — خزّن الآن
  useEffect(() => {
    if (!localStorage.getItem('otpSentAt')) {
      localStorage.setItem('otpSentAt', String(Date.now()))
    }
  }, [])

  // Countdown من الـ localStorage الحقيقي
  const otpCountdown = useCountdown(getRemainingSeconds)
  const resendCountdown = useCountdown(0)

  // لو المستخدم مؤكد بالفعل → redirect
  if (isAuthenticated && user?.emailVerified !== false) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  // لو مفيش userId → ارجع لـ register
  if (!userId) {
    return <Navigate to={ROUTES.REGISTER} replace />
  }

  // ─── Mutation: Verify ────────────────────────────────────────────────────
  const verifyMutation = useMutation({
    mutationFn: () => authService.verifyEmail(userId, otp),
    onSuccess: (data) => {
      if (data?.success && data.data) {
        const { user: verifiedUser, accessToken } = data.data
        login(verifiedUser, accessToken)

        // ✅ نظّف localStorage المؤقت
        localStorage.removeItem('_funoon_pending_userId')
        localStorage.removeItem('_funoon_pending_email')
        localStorage.removeItem('otpSentAt')

        toast.success('تم تأكيد بريدك الإلكتروني بنجاح!')
        setErrorMsg('')

        if (verifiedUser.role === 'admin') {
          navigate(ROUTES.ADMIN, { replace: true })
        } else if (verifiedUser.role === 'artist') {
          navigate(ROUTES.ARTIST_DASHBOARD, { replace: true })
        } else {
          navigate(ROUTES.HOME, { replace: true })
        }
      }
    },
    onError: (err) => {
      const body = err?.response?.data || {}
      const msg =
        typeof body?.message === 'string'
          ? body.message
          : err?.message || 'رمز التأكيد غير صحيح أو منتهي الصلاحية'
      setErrorMsg(msg)
      setOtp('')
    },
  })

  // ─── Mutation: Resend ────────────────────────────────────────────────────
  const resendMutation = useMutation({
    mutationFn: () => authService.resendOtp(userId),
    onSuccess: () => {
      // ✅ حدّث otpSentAt عشان العداد يبدأ من 5 دقايق حقيقية
      localStorage.setItem('otpSentAt', String(Date.now()))
      toast.success('تم إعادة إرسال الرمز إلى بريدك الإلكتروني')
      setErrorMsg('')
      setOtp('')
      otpCountdown.reset(OTP_TTL_SECONDS)
      resendCountdown.reset(60)
    },
    onError: (err) => {
      const body = err?.response?.data || {}
      const msg =
        typeof body?.message === 'string'
          ? body.message
          : err?.message || 'فشل إعادة الإرسال — حاول مرة أخرى'
      setErrorMsg(msg)
    },
  })

  const handleVerify = () => {
    if (otp.length !== 6) return
    setErrorMsg('')
    verifyMutation.mutate()
  }

  const handleResend = () => {
    if (resendCountdown.timeLeft > 0 || resendMutation.isPending) return
    resendMutation.mutate()
  }

  const isVerifying = verifyMutation.isPending
  const otpFull = otp.replace(/\s/g, '').length === 6

  return (
    <div className="space-y-8 text-right">
      {/* ─── Header ─── */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-primary)/10', border: '2px solid var(--color-secondary)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #C5A880))' }}
          >
            <Mail className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-display text-[var(--color-on-surface)] leading-tight">
            تأكيد البريد الإلكتروني
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] font-body mt-1.5 leading-relaxed">
            أدخل الرمز المكوّن من 6 أرقام المرسل إلى
          </p>
          {email && (
            <p
              className="text-sm font-mono font-semibold mt-1 px-3 py-1 rounded-md inline-block"
              style={{ color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
              dir="ltr"
            >
              {decodeURIComponent(email)}
            </p>
          )}
        </div>
      </div>

      {/* ─── OTP Countdown ─── */}
      {otpCountdown.timeLeft > 0 ? (
        <div className="text-center">
          <p className="text-xs text-[var(--color-on-surface-variant)] font-body">
            الرمز صالح لمدة{' '}
            <span className="font-mono font-bold text-[var(--color-primary)]">
              {otpCountdown.formatted}
            </span>
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-[var(--color-error)]">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs font-body">انتهت صلاحية الرمز — اضغط إعادة الإرسال</p>
        </div>
      )}

      {/* ─── OTP Inputs ─── */}
      <div className="space-y-4">
        <OTPInput
          length={6}
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
          error={!!errorMsg}
        />

        {errorMsg && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-body"
            style={{
              color: 'var(--color-error)',
              background: 'color-mix(in srgb, var(--color-error) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ─── Verify Button ─── */}
      <Button
        id="btn-verify-otp"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!otpFull || isVerifying || otpCountdown.timeLeft <= 0}
        isLoading={isVerifying}
        onClick={handleVerify}
      >
        {isVerifying ? 'جارٍ التحقق...' : otpCountdown.timeLeft <= 0 ? 'انتهت الصلاحية' : 'تأكيد الرمز'}
      </Button>

      {/* ─── Resend ─── */}
      <div className="text-center space-y-2">
        <p className="text-sm text-[var(--color-on-surface-variant)] font-body">
          لم تستلم الرمز؟
        </p>
        <button
          id="btn-resend-otp"
          onClick={handleResend}
          disabled={resendCountdown.timeLeft > 0 || resendMutation.isPending}
          className="inline-flex items-center gap-2 text-sm font-semibold font-body transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          <RefreshCw
            className={`w-4 h-4 ${resendMutation.isPending ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
          {resendMutation.isPending
            ? 'جارٍ الإرسال...'
            : resendCountdown.timeLeft > 0
              ? `إعادة الإرسال بعد ${resendCountdown.timeLeft}ث`
              : 'إعادة إرسال الرمز'}
        </button>
      </div>

      {/* ─── Help Text ─── */}
      <p className="text-center text-xs text-[var(--color-on-surface-variant)]/60 font-body leading-relaxed">
        تأكيد بريدك الإلكتروني يضمن أمان حسابك ويمنحك الوصول الكامل للمنصة
      </p>
    </div>
  )
}