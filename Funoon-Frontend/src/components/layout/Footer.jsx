import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { useState } from 'react'
import {
  // Instagram,
  // Twitter,
  // Facebook,
  // Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
  Send,
  Palette,
  Shield,
  Award,
} from 'lucide-react'
import Button from '../Ui/Button'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)]">

      {/* ═══════════════════════════════════════════════════ */}
      {/* Newsletter Section - CTA                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-3">
                ابقَ على اطلاع
              </p>
              <h3 className="font-display text-3xl lg:text-4xl text-[var(--color-inverse-on-surface)] leading-tight">
                اكتشف أحدث الأعمال الفنية
                <br />
                <span className="text-[var(--color-secondary)]">من فناني المملكة</span>
              </h3>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 text-[var(--color-inverse-on-surface)] placeholder:text-white/40 focus:outline-none focus:border-[var(--color-secondary)] transition-premium"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                icon={Send}
                iconPosition="end"
              >
                {subscribed ? 'تم الاشتراك ✓' : 'اشترك الآن'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Main Footer Content - 4 Columns                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* ═══ Brand Column ═══ */}
          <div className="lg:col-span-4">
            <Link to={ROUTES.HOME} className="inline-block mb-6">
              <img
                src="/src/assets/funoon_logo_gold.png"
                alt="Funoon"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
              منصة سعودية راقية تربط بين الفنانين السعوديين الموهوبين ومقتني الفن الأصيل.
              نحتفي بالإبداع المحلي ونوصله إلى بيوتكم بأعلى معايير الجودة والأمانة.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Shield className="w-4 h-4 text-[var(--color-secondary)]" strokeWidth={1.5} />
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Award className="w-4 h-4 text-[var(--color-secondary)]" strokeWidth={1.5} />
                <span>أعمال موثقة</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Palette className="w-4 h-4 text-[var(--color-secondary)]" strokeWidth={1.5} />
                <span>فن سعودي أصيل</span>
              </div>
            </div>
          </div>

          {/* ═══ Explore Column ═══ */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-6">
              استكشف
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to={ROUTES.ARTWORKS}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  المعرض الفني
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ARTISTS}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  الفنانون
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.SUBSCRIPTIONS}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  خطط الأسعار
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.CATEGORIES}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  التصنيفات
                </Link>
              </li>
            </ul>
          </div>

          {/* ═══ For Artists Column ═══ */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-6">
              للفنانين
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to={ROUTES.REGISTER}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  انضم كفنان
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ARTIST_DASHBOARD}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  لوحة الفنان
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ARTIST_GUIDE}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  دليل الفنان
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.SHIPPING_INFO}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  الشحن والتوصيل
                </Link>
              </li>
            </ul>
          </div>

          {/* ═══ Support Column ═══ */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-6">
              الدعم
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to={ROUTES.FAQ}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.CONTACT}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.RETURNS}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  سياسة الإرجاع
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ABOUT}
                  className="text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium"
                >
                  عن Funoon
                </Link>
              </li>
            </ul>
          </div>

          {/* ═══ Contact Column ═══ */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-secondary)] mb-6">
              تواصل معنا
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:hello@funoon.sa"
                  className="flex items-start gap-3 text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium group"
                >
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-[var(--color-secondary)]" strokeWidth={1.5} />
                  <span>hello@funoon.sa</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+966112345678"
                  className="flex items-start gap-3 text-sm text-white/70 hover:text-[var(--color-secondary)] transition-premium group"
                  dir="ltr"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-[var(--color-secondary)]" strokeWidth={1.5} />
                  <span>+966 11 234 5678</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <span>الرياض، المملكة العربية السعودية</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Bottom Bar - Copyright + Social + Legal           */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Copyright */}
            <div className="text-xs text-white/50 text-center md:text-right">
              © 2026 Funoon.sa — جميع الحقوق محفوظة. صُنع بـ <span className="text-[var(--color-secondary)]">♥</span> في المملكة العربية السعودية
            </div>

            {/* Social Icons */}
            {/* <div className="flex items-center gap-2">
              {[
                { icon: Instagram, href: 'https://instagram.com/funoon.sa', label: 'Instagram' },
                { icon: Twitter, href: 'https://twitter.com/funoon_sa', label: 'X (Twitter)' },
                { icon: Facebook, href: 'https://facebook.com/funoon.sa', label: 'Facebook' },
                { icon: Youtube, href: 'https://youtube.com/@funoon.sa', label: 'YouTube' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 flex items-center justify-center border border-white/10 text-white/60 hover:text-[var(--color-secondary)] hover:border-[var(--color-secondary)] transition-premium"
                >
                  <social.icon className="w-4 h-4" strokeWidth={1.5} />
                </a>
              ))}
            </div> */}

            {/* Legal Links + Back to top */}
            <div className="flex items-center gap-6">
              <Link
                to={ROUTES.TERMS}
                className="text-xs text-white/50 hover:text-[var(--color-secondary)] transition-premium"
              >
                الشروط والأحكام
              </Link>
              <Link
                to={ROUTES.PRIVACY}
                className="text-xs text-white/50 hover:text-[var(--color-secondary)] transition-premium"
              >
                الخصوصية
              </Link>
              <button
                onClick={scrollToTop}
                aria-label="العودة للأعلى"
                className="w-9 h-9 flex items-center justify-center border border-white/10 text-white/60 hover:text-[var(--color-secondary)] hover:border-[var(--color-secondary)] transition-premium"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )

}