import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '../../../components/Ui/Button'
import { ROUTES } from '../../../config/routes'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-[100vh] flex items-center justify-center px-5 py-20">
            <div className="text-center max-w-md">
                <div className="w-25 h-25 mx-auto -mt-6 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldAlert className="w-15 h-15 text-[var(--color-primary)]" strokeWidth={1} />
                </div>
                <p className="font-display text-[90px] leading-none font-bold text-[var(--color-primary)]/15 select-none">403</p>
                <h1 className="font-display text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                    غير مصرّح بالوصول
                </h1>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-8">
                    حسابك الحالي لا يملك صلاحية عرض هذه الصفحة.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link to={ROUTES.HOME}><Button variant="primary" size="md">العودة للرئيسية</Button></Link>
                    <Link to={ROUTES.CONTACT || '/contact'}><Button variant="outline" size="md">تواصل معنا</Button></Link>
                </div>
            </div>
        </div>
    )
}