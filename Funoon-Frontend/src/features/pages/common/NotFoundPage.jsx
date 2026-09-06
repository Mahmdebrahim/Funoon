import { Link } from 'react-router-dom'
import { OctagonX } from 'lucide-react'
import Button from '../../../components/Ui/Button'
import { ROUTES } from '../../../config/routes'

export default function NotFoundPage() {
    return (
        <div className="min-h-[100vh] flex items-center justify-center px-5 py-20">
            <div className="text-center max-w-md">
                <div className="w-25 h-25 mx-auto -mt-6 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <OctagonX className="w-15 h-15 text-[var(--color-primary)]" strokeWidth={1} />
                </div>
                <p className="font-display text-[90px] leading-none font-bold text-[var(--color-primary)]/15 select-none">404</p>
                <h1 className="font-display text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                    الصفحة غير موجودة
                </h1>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-8">
                    يبدو أن الرابط الذي تبحث عنه غير موجود أو تم نقله.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link to={ROUTES.HOME}><Button variant="primary" size="md">العودة للرئيسية</Button></Link>
                    <Link to={ROUTES.CONTACT || '/contact'}><Button variant="outline" size="md">تواصل معنا</Button></Link>
                </div>
            </div>
        </div>
    )
}