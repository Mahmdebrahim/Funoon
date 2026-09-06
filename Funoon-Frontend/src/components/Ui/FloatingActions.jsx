import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

// ✅ غيّر الرقم ده لرقم المنصة الحقيقي (بصيغة دولية بدون +)
const WHATSAPP_NUMBER = "966500000000";
const WHATSAPP_MSG = encodeURIComponent(
    "مرحباً فريق فُنون، لدي استفسار بخصوص المنصة.",
);

export default function FloatingActions() {
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-3">
            <style>{`@keyframes fa-spin-slow { to { transform: rotate(360deg); } }`}</style>

            {/* ⬆ الرجوع لفوق — بيظهر بعد السكرول */}
            {showTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="العودة للأعلى"
                    title="العودة للأعلى"
                    className="w-11 h-11 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/50 rounded-lg shadow-md flex items-center justify-center text-[var(--color-on-surface)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/50 transition-all cursor-pointer"
                >
                    <ChevronUp className="w-5 h-5" strokeWidth={2} />
                </button>
            )}

            <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تواصل معنا عبر واتساب"
                title="تواصل معنا عبر واتساب"
                className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] shadow-lg flex items-center justify-center transition-all hover:scale-105"
            >
                {/* <span
                    className="absolute -inset-1.5 rounded-full border-2 border-white border-t-transparent border-b-transparent pointer-events-none"
                style={{ animation: "fa-spin-slow 2s linear infinite" }}
                /> */}
                <span
                    className="absolute -inset-1.5 rounded-full border-2 border-[var(--color-primary)] border-r-transparent border-l-transparent border-t-transparent pointer-events-none"
                style={{ animation: "fa-spin-slow 2s linear infinite" }}
                />
                <span
                    className="absolute -inset-1.5 rounded-full border-2 border-[var(--color-primary)] border-l-transparent border-r-transparent border-b-transparent pointer-events-none"
                    style={{ animation: "fa-spin-slow 2s linear infinite" }}
                />
                
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
}