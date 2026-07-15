import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { ROUTES } from '../../config/routes'
import { ArrowLeft, Landmark } from 'lucide-react'
import loginBg from '../../assets/login.png'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-surface font-body select-none">
      {/* Right Column: Form Container (7/12 width) - Scrollable Internally */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-between h-full overflow-y-auto p-6 sm:p-12 md:p-16 lg:p-20 bg-surface-container-lowest border-l border-outline/10">

        {/* Top Header */}
        <div className="flex items-center justify-between w-full">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            {/* Elegant minimal logo frame */}
            {/* <div className="w-10 h-10 border border-primary/20 flex items-center justify-center group-hover:border-primary transition-premium bg-surface-container-low rounded-none">
              <span className="font-display text-primary text-xl font-bold">ف</span>
            </div> */}
            <span className="text-2xl font-display font-semibold tracking-tight text-primary transition-premium">
              <img src='src\assets\funoon_logo_gold.png' alt=' ' className='w-18' />
            </span>
          </Link>
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-premium font-medium"
          >
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Form Content Wrapper */}
        <div className="my-auto py-10 max-w-md w-full mx-auto">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-xs text-on-surface-variant/60 font-body">
          © {new Date().getFullYear()} فنون جميع الحقوق محفوظة. منصة مخصصة للفنون التشكيلية السعودية.
        </div>
      </div>

      {/* Left Column: Artistic Brand Banner (5/12 width) - Fixed Height, Hidden on Mobile */}
      <div className="hidden lg:block lg:col-span-5 relative h-full overflow-hidden bg-primary">
        {/* Gallery Image */}
        <img
          src={loginBg}
          alt="معرض فنون"
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        {/* Subtle, elegant vignette overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/45 to-transparent z-10" />
        <div className="absolute inset-0 bg-black/10 z-10" />

        {/* Content Box */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-12 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-secondary/30 bg-primary/60 backdrop-blur-md text-secondary text-xs tracking-widest font-sans font-semibold">
            <Landmark className="w-3.5 h-3.5" />
            <span>بوابة الفنانين والجامعين</span>
          </div>
          <h2 className="text-3xl font-display text-white mb-3 leading-snug">
            الفن ليس ما تراه، بل ما تجعل الآخرين يرونه.
          </h2>
          <p className="text-surface-container-high/90 text-sm max-w-md leading-relaxed">
            المنصة الرائدة للاقتناء والتفاعل مع رواد الحركة التشكيلية والمعاصرة في المملكة العربية السعودية.
          </p>
        </div>
      </div>
    </div>
  )
}
