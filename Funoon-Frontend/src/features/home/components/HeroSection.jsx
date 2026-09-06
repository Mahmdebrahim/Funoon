import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import Button from '../../../components/Ui/Button'
import { ArrowLeft, Shield, Truck, Award, Sparkles } from 'lucide-react'

// Import local images
import heroMain from '../../../assets/hero (1).png'
import hero2 from '../../../assets/hero (2).png'
import hero3 from '../../../assets/hero (3).png'

export default function HeroSection() {
    return (
        <section className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-surface py-8 lg:py-4">

            {/* ═══ Background Layers ═══ */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-bl from-surface via-surface-container-low to-surface" />
                <div className="absolute top-0 right-0 w-[500px] lg:w-[700px] h-[500px] lg:h-[700px] bg-secondary/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[400px] lg:w-[500px] h-[400px] lg:h-[500px] bg-primary/3 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to bottom, #1c1b1b 1px, transparent 1px),
                            linear-gradient(to right, #1c1b1b 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            <div className="max-w-[1280px] mx-auto px-5 lg:px-16 w-full">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

                    {/* ═══ النص ═══ */}
                    <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-start space-y-4 lg:space-y-8">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 border border-secondary/30 bg-secondary/5">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" strokeWidth={2} />
                            <span className="text-[11px] font-body font-semibold tracking-[0.2em] uppercase text-secondary">
                                منصة الفن السعودي الأصيل
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] text-on-surface leading-[1.1] ">
                            اكتشف
                            <br />
                            <span className="relative inline-block">
                                <span className="text-secondary">روائع</span>
                                {/* <span className="hidden lg:block absolute bottom-2 right-0 w-full h-0.5 bg-secondary/60" /> */}
                            </span>{' '}
                            الفن السعودي
                        </h1>

                        {/* Subtitle */}
                        <p className="max-w-md text-base lg:text-lg text-on-surface-variant leading-[1.7] font-body">
                            وجهة راقية لاقتناء اللوحات الفنية الأصلية من أمهر الفنانين السعوديين.
                            كل عمل فني{' '}
                            <span className="text-on-surface font-medium">مُوثّق</span>،{' '}
                            <span className="text-on-surface font-medium">مُعتمد</span>، ويصلك بأعلى معايير العناية.
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Button
                                as={Link}
                                to={ROUTES.ARTWORKS}
                                variant="primary"
                                size="lg"
                                icon={ArrowLeft}
                                iconPosition="end"
                            >
                                استكشف المعرض
                            </Button>
                            <Button
                                as={Link}
                                to={ROUTES.REGISTER}
                                variant="secondary"
                                size="lg"
                            >
                                انضم كفنان
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 pt-2 border-t border-outline-variant w-full">
                            <div className="flex items-center gap-2.5 text-[13px] text-on-surface-variant">
                                <Shield className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                                <span className="font-body">دفع آمن 100%</span>
                            </div>
                            <div className="w-px h-3 bg-outline-variant hidden sm:block" />
                            <div className="flex items-center gap-2.5 text-[13px] text-on-surface-variant">
                                <Truck className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                                <span className="font-body">توصيل لباب البيت</span>
                            </div>
                            <div className="w-px h-3 bg-outline-variant hidden sm:block" />
                            <div className="flex items-center gap-2.5 text-[13px] text-on-surface-variant">
                                <Award className="w-4 h-4 text-secondary" strokeWidth={1.5} />
                                <span className="font-body">أعمال موثّقة</span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ الصور — ارتفاع ثابت عشان الشاشة متطولش ═══ */}
                    <div className="hidden lg:block lg:col-span-7 relative">
                        <div className="grid grid-cols-12 gap-5 h-[400px] xl:h-[480px] 2xl:h-[540px]">

                            {/* Main Large Artwork */}
                            <div className="col-span-8 relative group overflow-hidden bg-surface-container h-full">
                                <img
                                    src={heroMain}
                                    alt="لوحة فنية سعودية"
                                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-premium" />
                                <div className="absolute inset-0 border border-white/10 pointer-events-none" />
                            </div>

                            {/* Side Column */}
                            <div className="col-span-4 flex flex-col gap-5 h-full">
                                <div className="flex-1 relative group overflow-hidden bg-surface-container">
                                    <img
                                        src={hero2}
                                        alt="لوحة فنية"
                                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-premium" />
                                    <div className="absolute inset-0 border border-white/10 pointer-events-none" />
                                </div>

                                <div className="flex-1 relative group overflow-hidden bg-surface-container">
                                    <img
                                        src={hero3}
                                        alt="لوحة فنية"
                                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-premium" />
                                    <div className="absolute inset-0 border border-white/10 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 animate-bounce">
                <span className="text-[10px] font-body tracking-[0.2em] uppercase text-on-surface-variant">
                    استكشف
                </span>
                <div className="w-px h-6 bg-on-surface-variant/40" />
            </div>
        </section>
    )
}