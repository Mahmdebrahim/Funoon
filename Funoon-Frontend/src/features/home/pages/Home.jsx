import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ShieldCheck, Truck, BadgeCheck, Lock, Star,
  Headphones, Search, CreditCard, PackageCheck, UserCheck,
  TrendingUp, Award, Image as ImageIcon,
} from "lucide-react";

import HeroSection from "../components/HeroSection";
import ArtworkCard from "../../../components/Ui/ArtworkCard";
import StarRating from "../../../components/Ui/StarRating";
import Button from "../../../components/Ui/Button";
import { ROUTES } from "../../../config/routes";
import { artworksService } from "../../artworks/services/artworks.service";
import { artistService } from "../../artist/services/artist.service";
import { reviewService } from "../../reviews/services/review.service";
import { getMediaUrl } from "../../../utils/media";
import badge from "../../../assets/badge.png";
import banner  from "../../../assets/banner3.png";
import { useAuthStore } from '../../../features/auth/stores/authStore'
// ═══════════════════════════════════════════════════
// Unified Section Header — بسيط ونضيف (بدون إيموجي)
// ═══════════════════════════════════════════════════
function SectionHeader({ eyebrow, title, subtitle, linkText, linkTo, center = false }) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 lg:mb-14 ${center ? "md:flex-col md:items-center text-center" : ""}`}>
      <div className={center ? "max-w-2xl" : ""}>
        {eyebrow && (
          <span className="block text-xs font-body font-semibold tracking-[0.2em] text-[#C5A880] mb-2">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl md:text-4xl font-display font-bold text-[var(--color-on-surface)] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-[var(--color-on-surface-variant)] mt-3 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {linkText && linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[#C5A880] transition-colors group shrink-0"
        >
          <span>{linkText}</span>
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Featured Card — مشترك بين الماركي والعرض الثابت
// ═══════════════════════════════════════════════════
function FeaturedCard({ item }) {
  return (
    <Link
      to={ROUTES.ARTWORK.replace(":id", item._id)}
      className="group relative flex-shrink-0 w-64 sm:w-82 bg-[var(--color-surface-container-lowest)] rounded-sm border border-[var(--color-outline-variant)]/30 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-[var(--color-surface-container)]">
        <img
          src={getMediaUrl(item.coverImage)}
          alt={item.title}
          crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#C5A880] text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-3 h-3 fill-white" strokeWidth={0} />
          مميزة
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
          <p className="font-display font-bold text-base truncate">{item.title}</p>
          <p className="text-xs text-stone-300 truncate mt-0.5">{item.artist?.name}</p>
          <p className="text-sm font-bold text-[#C5A880] mt-2">
            {(item.price || 0).toLocaleString()} ر.س
          </p>
        </div>
      </div>
      {/* <div className="p-3 text-right">
        <p className="font-display font-semibold text-sm text-[var(--color-on-surface)] truncate">
          {item.title}
        </p>
        <div className="flex items-center justify-between mt-1 text-xs text-[var(--color-on-surface-variant)]">
          <span className="truncate">{item.artist?.name}</span>
          <span className="font-bold text-[var(--color-primary)]">
            {(item.price || 0).toLocaleString()} ر.س
          </span>
        </div>
      </div> */}
    </Link>
  );
}

// ═══════════════════════════════════════════════════
// Section: Featured — ماركي لو 4+ / ثابت لو أقل
// ═══════════════════════════════════════════════════
function FeaturedMarqueeSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["featuredArtworksMarquee"],
    queryFn: () => artworksService.getFeatured({ limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const featuredItems = data?.artworks || [];

  if (!isLoading && featuredItems.length === 0) return null;

  const isMarquee = featuredItems.length >= 4;
  const marqueeItems = isMarquee ? [...featuredItems, ...featuredItems] : featuredItems;

  return (
    <section className="py-16 bg-[var(--color-surface-container-low)]/50 border-y border-[var(--color-outline-variant)]/30 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 mb-8">
        <SectionHeader
          eyebrow="نخبة الأعمال"
          title="مختارات مميزة"
          subtitle="لوحات فريدة اختارها فنانونا المتميزون لتتصدر المعرض."
          linkText="عرض كل المميزة"
          linkTo={ROUTES.FEATURED}
        />
      </div>

      {isLoading ? (
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 flex gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 w-72 shrink-0 bg-[var(--color-surface-container)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isMarquee ? (
        <div className="relative w-full overflow-hidden py-2">
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[var(--color-surface-container-low)] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[var(--color-surface-container-low)] to-transparent z-10 pointer-events-none" />
          <div
            className="animate-marquee flex gap-6 px-6"
            style={{ "--marquee-duration": `${Math.max(25, featuredItems.length * 4)}s` }}
          >
            {marqueeItems.map((item, idx) => (
              <FeaturedCard key={`${item._id}-${idx}`} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 flex flex-wrap justify-cente gap-6">
          {featuredItems.map((item) => (
            <FeaturedCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Latest Artworks
// ═══════════════════════════════════════════════════
function LatestArtworksSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["homeLatestArtworks"],
    queryFn: () => artworksService.getArtworks({ limit: 8, sort: "newest" }),
    staleTime: 2 * 60 * 1000,
  });

  const artworks = data?.artworks || [];

  return (
    <section className="py-16 max-w-[1280px] mx-auto px-5 lg:px-16">
      <SectionHeader
        eyebrow="وصل حديثاً"
        title="أحدث اللوحات"
        subtitle="تشكيلة متجددة من الأعمال المضافة حديثاً من فناني المنصة."
        linkText="عرض المعرض الكامل"
        linkTo={ROUTES.ARTWORKS}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[var(--color-surface-container-low)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {artworks.map((art) => (
            <ArtworkCard key={art._id} artwork={art} />
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: How It Works
// ═══════════════════════════════════════════════════
function HowItWorksSection() {
  const steps = [
    { num: "01", icon: Search, title: "اكتشف واختر", desc: "تصفح لوحات أصلية من فنانين موثقين واختر ما يناسب ذوقك ومساحتك." },
    { num: "02", icon: CreditCard, title: "ادفع بأمان", desc: "دفع مشفر عبر بوابات مرخصة، وأموالك محفوظة حتى تأكيد الاستلام." },
    { num: "03", icon: PackageCheck, title: "استلم لوحتك", desc: "تغليف فني متخصص وشحن مؤمَّن حتى باب منزلك في جميع مناطق المملكة." },
  ];

  return (
    <section className="py-20 bg-[var(--color-surface-container-low)]/40 border-y border-[var(--color-outline-variant)]/30">
      <div className="max-w-[1280px] flex items-center flex-col mx-auto px-5 lg:px-16">
        <SectionHeader
          center
          eyebrow="تجربة موثوقة"
          title="كيف تقتني عملك الفني؟"
          subtitle="ثلاث خطوات بسيطة تفصلك عن امتلاك تحفة سعودية أصلية."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="relative p-8 bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)]/40 transition-all duration-300">
                <span className="font-display font-bold text-4xl text-[#C5A880]/30 absolute top-6 left-6 select-none">
                  {s.num}
                </span>
                <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-bold text-xl text-[var(--color-on-surface)] mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed font-body">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Top Artists — 3 كروت بالستايل المتفق عليه
// ═══════════════════════════════════════════════════
function FeaturedArtistsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["homeTopArtists"],
    queryFn: () => artistService.getAllArtists({ limit: 3 }),
    staleTime: 5 * 60 * 1000,
  });

  const artists = data?.artists || [];

  return (
    <section className="py-16 max-w-[1280px] mx-auto px-5 lg:px-16 flex items-center flex-col">
      <SectionHeader
        center
        eyebrow="مبدعو المنصة"
        title="فنانون بارزون"
        subtitle="تعرّف على نخبة من أمهر الفنانين ومسيرتهم الفنية."
      // linkText="جميع الفنانين"
      // linkTo={ROUTES.ARTISTS}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-[var(--color-surface-container-low)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-17 md:gap-6 mt-14">
          {artists.map((artist) => (
            <div
              key={artist._id}
              className="relative bg-[var(--color-surface-container-lowest)] rounded-md shadow-sm pb-6 transition-all duration-300"
            >
              <div className="flex flex-col items-center px-5 pt-4 relative">
                {artist.avatar ? (
                  <img
                    src={getMediaUrl(artist.avatar)}
                    alt={artist.name}
                    crossOrigin="anonymous"
                    className="h-24 w-24 absolute -top-12 rounded-full object-cover border-4 border-[var(--color-surface)] shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 absolute -top-12 rounded-full border-4 border-[var(--color-surface)] shadow-md bg-white flex items-center justify-center font-display font-bold text-3xl text-[var(--color-primary)]">
                    {artist.name?.charAt(0)}
                  </div>
                )}

                <div className="pt-14 text-center">
                  <h3 className="font-display font-bold text-lg text-[var(--color-on-surface)] flex items-center justify-center gap-1.5">
                    {artist.name}
                    {artist.isVerified && (
                      <img src={badge} alt="badge"  className="w-8 h-8 mt-1.5" />
                    )}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[var(--color-on-surface-variant)] px-6 text-center leading-relaxed mt-3 line-clamp-2 min-h-[2rem]">
                {artist.bio || "فنان تشكيلي سعودي يعرض أعماله الأصلية عبر منصة فُنون."}
              </p>

              <div className="flex justify-center items-center gap-2 pt-4">
                <StarRating value={artist.avgRating || 0} size="sm" />
                {artist.reviewsCount > 0 && (
                  <span className="text-[11px] text-[var(--color-on-surface-variant)]">
                    ({artist.reviewsCount})
                  </span>
                )}
              </div>

              <div className="px-6 pt-4">
                <Link to={ROUTES.ARTIST_PROFILE.replace(":id", artist._id)} className="block">
                  <Button variant="outline" size="sm" fullWidth>
                    عرض البروفايل والأعمال
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Why Us
// ═══════════════════════════════════════════════════
function WhyUsSection() {
  const features = [
    { icon: ShieldCheck, title: "دفع آمن", desc: "بوابات دفع مشفرة ومراقبة عبر جهات مرخصة." },
    { icon: Truck, title: "شحن مؤمَّن لكل المملكة", desc: "تغليف فني متخصص وتوصيل لجميع المناطق." },
    { icon: BadgeCheck, title: "أعمال أصلية", desc: "فنانون موثقون وأعمال مراجعة من فريق المنصة." },
    { icon: Lock, title: "حماية حتى الاستلام", desc: "أموالك محفوظة لدينا حتى تستلم لوحتك بسلام." },
    { icon: Star, title: "تقييمات حقيقية", desc: "آراء مشترين حقيقيين بعد كل عملية شراء فعلية." },
    { icon: Headphones, title: "دعم واستشارة", desc: "فريق متخصص يساعدك في اختيار العمل المناسب." },
  ];

  return (
    <section className="py-16 bg-[var(--color-surface-container-low)]/50 border-y border-[var(--color-outline-variant)]/30">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 flex items-center flex-col">
        <SectionHeader
          center
          eyebrow="لماذا فُنون"
          title="ما يميزنا"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)]/30 flex items-start gap-4 hover:border-[#C5A880]/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--color-on-surface)] mb-1">{f.title}</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Reviews — ستايل الـ testimonials بالأسهم والـ dots
// ═══════════════════════════════════════════════════
function CustomerReviewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["homeRecentReviews"],
    queryFn: () => reviewService.getRecentReviews({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const reviews = data?.data || data || [];
  const hasReviews = Array.isArray(reviews) && reviews.length > 0;

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // auto-scroll للموبايل
  useEffect(() => {
    if (!isMobile || !hasReviews) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 >= reviews.length ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile, hasReviews, reviews.length]);

  if (!isLoading && !hasReviews) return null;

  const perView = isMobile ? 1 : 3;
  const visible = reviews.slice(currentIndex, currentIndex + perView);

  const handleNext = () =>
    setCurrentIndex((prev) =>
      prev + perView >= reviews.length ? 0 : prev + perView,
    );
  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev - perView < 0 ? Math.max(reviews.length - perView, 0) : prev - perView,
    );

  return (
    <section className="py-16 max-w-[1280px] mx-auto px-5 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="block text-xs font-body font-semibold tracking-[0.2em] text-[#C5A880] mb-2">
            تجارب حقيقية
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-[var(--color-on-surface)]">
            ماذا يقول مقتنونا؟
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-3 max-w-xl">
            آراء موثقة من مشترين اقتنوا أعمالاً فنية عبر المنصة.
          </p>
        </div>

        {/* أسهم التنقل — ديسكتوب فقط */}
        {!isMobile && reviews.length > perView && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              aria-label="السابق"
              className="h-10 w-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/40 flex items-center justify-center cursor-pointer hover:bg-[var(--color-surface-container)] transition-all text-[var(--color-on-surface-variant)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="التالي"
              className="h-10 w-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/40 flex items-center justify-center cursor-pointer hover:bg-[var(--color-surface-container)] transition-all text-[var(--color-on-surface-variant)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[var(--color-surface-container-low)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((rev) => (
            <div
              key={rev._id}
              className="bg-[var(--color-surface-container-lowest)] hover:-translate-y-1 transition duration-300 border border-[var(--color-outline-variant)]/40 rounded-2xl p-6 space-y-5"
            >
              {/* نجوم + تاريخ */}
              <div className="flex items-start justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-stone-300"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                  {new Date(rev.createdAt).toLocaleDateString("ar-SA", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>

              {/* التعليق */}
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed min-h-[3.5rem]">
                "{rev.comment || "تجربة رائعة من البداية حتى الاستلام."}"
              </p>

              {/* المقتني + اللوحة */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-outline-variant)]/20">
                {rev.reviewer?.avatar ? (
                  <img
                    src={getMediaUrl(rev.reviewer.avatar)}
                    alt={rev.reviewer.name}
                    crossOrigin="anonymous"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center">
                    {rev.reviewer?.name?.charAt(0) || "م"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">
                    {rev.reviewer?.name || "مقتنٍ"}
                  </p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                    {rev.artwork?.title ? `قيّم لوحة: ${rev.artwork.title}` : "عملية شراء موثقة"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* dots للموبايل */}
      {isMobile && reviews.length > 1 && (
        <div className="flex items-center justify-center mt-6 gap-2">
          {reviews.map((_, index) => (
            <span
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${index === currentIndex
                ? "bg-[var(--color-primary)] scale-110"
                : "bg-[var(--color-outline-variant)]"
                }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Stats — أرقام حقيقية فقط
// ═══════════════════════════════════════════════════
function PlatformStatsSection() {
  const { data } = useQuery({
    queryKey: ["platformStats"],
    queryFn: () => artworksService.getPlatformStats(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = data?.data || data || {};

  const statItems = [
    { label: "فنان سعودي", value: stats.artistCount ?? 0, icon: UserCheck },
    { label: "عمل فني أصيل", value: stats.artworkCount ?? 0, icon: ImageIcon },
    { label: "عملية اقتناء ناجحة", value: stats.salesCount ?? 0, icon: TrendingUp },
    { label: "تقييم موثق", value: stats.reviewCount ?? 0, icon: Award },
  ];

  return (
    <section className="py-16 bg-gradient-to-l from-[#3D0006] via-[#260004] to-[#1A0003] text-white">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[#C5A880] text-xs font-semibold tracking-[0.2em] mb-2 block font-body">
            أرقام تتحدث
          </span>
          <h2 className="text-3xl font-display font-bold">فُنون بالأرقام</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {statItems.map((st, i) => {
            const Icon = st.icon;
            return (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Icon className="w-8 h-8 text-[#C5A880] mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-display text-4xl lg:text-5xl font-bold text-[#C5A880] mb-2">
                  {st.value}+
                </p>
                <p className="text-xs lg:text-sm text-stone-300 font-body">{st.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// Section: Join CTA — بانر واحد أنيق
// ═══════════════════════════════════════════════════
function JoinCTASection() {
  const { user, isAuthenticated } = useAuthStore();
  console.log(isAuthenticated);
  console.log(user);
  return (
    <section className="py-20 max-w-[1280px] mx-auto px-5 lg:px-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#3D0006] via-[#260004] to-[#1A0003] px-8 py-14 lg:px-16 lg:py-16 text-center">
        {/* ديكور دواير ذهبية خفيفة */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-[#C5A880]/15 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full border border-[#C5A880]/10 pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full border border-[#C5A880]/10 pointer-events-none" />

        <div className="relative z-10">
          <span className="text-[#C5A880] text-xs font-semibold tracking-[0.2em] block font-body mb-3">
            منصة الفن السعودي
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            كن جزءاً من فُنون
          </h2>
          <p className="text-sm md:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto">
            سواء كنت فناناً يبحث عمّن يقدّر إبداعك، أو مقتنياً يبحث عن قطعة لا تتكرر — رحلتك تبدأ من هنا.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9">
            {!isAuthenticated && (
              <Link to={ROUTES.SUBSCRIPTIONS}>
                <Button className="bg-[#C5A880] text-[#1A0003] hover:bg-[#d6b78d] font-bold px-8">
                  انضم كفنان
                </Button>
              </Link>
            )}
            <Link to={ROUTES.ARTWORKS}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                تصفح المعرض
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Banner() {
  return (
    <div className="w-full max-w-7xl mx-auto overflow-hidden">
      <img
        src={banner}
        alt="banner"
        className="w-full h-full object-cover object-center"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Home — الترتيب النهائي (9 أقسام)
// ═══════════════════════════════════════════════════
export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <HeroSection />
      {/* <PlatformStatsSection /> */}
      <WhyUsSection />
      <LatestArtworksSection />
      <FeaturedMarqueeSection />
      <FeaturedArtistsSection />
      <Banner />
      <HowItWorksSection />
      <CustomerReviewsSection />
      <JoinCTASection />
    </main>
  );
}