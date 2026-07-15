import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { Palette, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2 space-y-4">
            <Link to={ROUTES.HOME} className="flex items-center gap-2 group w-max">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-premium">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white group-hover:text-amber-500 transition-premium">
                فنون<span className="text-amber-500">.sa</span>
              </span>
            </Link>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              منصة فنون هي سوق فني سعودي فاخر يربط بين الفنانين المبدعين وعشاق الفن والمقتنين في المملكة العربية السعودية وخارجها. تسوق لوحات أصلية متميزة بكل أمان.
            </p>
          </div>

          {/* Site Links */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={ROUTES.ARTWORKS} className="hover:text-amber-500 transition-premium">
                  المعرض الفني
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ARTISTS} className="hover:text-amber-500 transition-premium">
                  الفنانون
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="hover:text-amber-500 transition-premium">
                  انضم كفنان
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">الدعم والسياسات</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="hover:text-amber-500 cursor-pointer transition-premium">شروط الاستخدام</li>
              <li className="hover:text-amber-500 cursor-pointer transition-premium">سياسة الخصوصية</li>
              <li className="hover:text-amber-500 cursor-pointer transition-premium">سياسة الشحن والإرجاع</li>
              <li className="hover:text-amber-500 cursor-pointer transition-premium">الدعم الفني</li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} فنون.sa. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1.5">
            صنع بحب وشغف بالفن السعودي
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  )
}
