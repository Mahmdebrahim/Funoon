import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette, CheckCircle2, XCircle, Search, Loader2, X,
    Wallet, Image, ShoppingBag, Landmark, Calendar, Clock,
} from "lucide-react";
import { adminService } from "../services/admin.service";

const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const PLAN_NAMES = {
    opal_classic: "كلاسيك",
    opal_plus: "بلس",
    opal_prestige: "برستيج",
};

// ═══ Bank Info (بنفس اللي في السحوبات + copy) ═══
function BankInfo({ bank }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("تم النسخ ✅");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("فشل النسخ");
        }
    };
    if (!bank) return <span className="text-on-surface-variant/50 text-xs">لا يوجد</span>;
    const name = bank.bankName || "";
    const iban = bank.iban || "";
    const holder = bank.accountHolder || "";
    return (
        <div className="text-xs space-y-1">
            <p className="text-on-surface font-medium">{name} {holder && `· ${holder}`}</p>
            {iban && (
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-on-surface-variant" dir="ltr">{iban}</span>
                    <button
                        onClick={() => handleCopy(iban)}
                        title={copied ? "تم النسخ" : "نسخ IBAN"}
                        className={`p-1 shrink-0 ${copied ? "text-emerald-600" : "text-on-surface-variant/50 hover:text-primary"}`}
                    >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

function BankStatusBadge({ bank }) {
    if (!bank) return <span className="px-2 py-0.5 text-[10px] font-semibold bg-surface-container-low text-on-surface-variant">لا يوجد</span>;
    if (bank.isVerified) return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ موثق</span>;
    if (bank.rejectionReason) return <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">مرفوض</span>;
    return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">بانتظار المراجعة</span>;
}

export default function AdminArtistsPage() {
    const [tab, setTab] = useState("artists");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [verifyTarget, setVerifyTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const { data: artistsData, isLoading: loadingArtists } = useQuery({
        queryKey: ["adminArtists", debouncedSearch, page],
        queryFn: () => adminService.getAdminArtists({ search: debouncedSearch, page, limit: 15 }),
    });

    console.log(artistsData)

    const { data: pendingData } = useQuery({
        queryKey: ["pendingBankAccounts"],
        queryFn: () => adminService.getPendingBankAccounts(),
    });

    const artists = artistsData?.artists || [];
    const pagination = artistsData?.pagination || { total: 0, pages: 0 };
    const pendingAccounts = pendingData?.accounts || [];

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-display text-2xl text-on-surface">إدارة الفنانين</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                    تابع الفنانين، باقاتهم، محافظهم، وراجع حساباتهم البنكية
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
                <TabButton active={tab === "artists"} onClick={() => setTab("artists")}>
                    <Palette className="w-3.5 h-3.5" /> كل الفنانين ({pagination.total || 0})
                </TabButton>
                <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
                    <Landmark className="w-3.5 h-3.5" /> التوثيقات المعلقة
                    {pendingAccounts.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">
                            {pendingAccounts.length}
                        </span>
                    )}
                </TabButton>
            </div>

            {tab === "artists" ? (
                <ArtistsTab
                    artists={artists}
                    loading={loadingArtists}
                    search={search}
                    setSearch={setSearch}
                    page={page}
                    setPage={setPage}
                    pagination={pagination}
                />
            ) : (
                <PendingTab
                    accounts={pendingAccounts}
                    onVerify={setVerifyTarget}
                    onReject={setRejectTarget}
                />
            )}

            <VerifyModal account={verifyTarget} onClose={() => setVerifyTarget(null)} />
            <RejectModal account={rejectTarget} onClose={() => setRejectTarget(null)} />
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-body font-semibold border transition-premium ${active
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:border-primary"
                }`}
        >
            {children}
        </button>
    );
}

// ═══ Artists Tab ═══
function ArtistsTab({ artists, loading, search, setSearch, page, setPage, pagination }) {
    return (
        <>
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-on-surface-variant" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الإيميل..."
                    className="pr-9 pl-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:outline-none w-full"
                />
                {search && search.trim() !== (search && search.trim()) && (
                    <Loader2 className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 left-3 text-on-surface-variant animate-spin" />
                )}
            </div>

            {/* Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-low/50">
                            <th className="p-3">الفنان</th>
                            <th className="p-3">الباقة</th>
                            <th className="p-3">الإحصائيات</th>
                            <th className="p-3">المحفظة</th>
                            <th className="p-3">البنك</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">جاري التحميل...</td></tr>
                        )}
                        {!loading && artists.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <Palette className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                                    <p className="text-sm text-on-surface-variant">لا يوجد فنانون</p>
                                </td>
                            </tr>
                        )}
                        {artists.map((a) => (
                            <tr key={a._id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/30">
                                <td className="p-3">
                                    <p className="text-on-surface font-medium">{a.name}</p>
                                    <p className="text-xs text-on-surface-variant">{a.email}</p>
                                    <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                                        سجّل: {new Date(a.createdAt).toLocaleDateString("ar-EG")}
                                    </p>
                                </td>
                                <td className="p-3">
                                    <SubscriptionCell sub={a.subscription} />
                                </td>
                                <td className="p-3">
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <Image className="w-3 h-3" />
                                            <span>{a.stats.artworks} لوحة</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <ShoppingBag className="w-3 h-3" />
                                            <span>{a.stats.sales} مبيعة</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                                            <span>{fmt(a.stats.revenue)} ر.س</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Wallet className="w-3 h-3 text-amber-600" />
                                            <span className="text-on-surface-variant">معلق:</span>
                                            <span className="font-semibold text-on-surface">{fmt(a.wallet.pending)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3" />
                                            <span className="text-on-surface-variant">متاح:</span>
                                            <span className="font-semibold text-emerald-600">{fmt(a.wallet.available)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="mb-1.5"><BankStatusBadge bank={a.bankAccount} /></div>
                                    <BankInfo bank={a.bankAccount} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div className="flex justify-center gap-3">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">السابق</button>
                    <span className="text-sm self-center text-on-surface-variant">{page} / {pagination.pages}</span>
                    <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-xs border border-outline-variant/40 disabled:opacity-40">التالي</button>
                </div>
            )}
        </>
    );
}

function SubscriptionCell({ sub }) {
    if (!sub) return <span className="text-xs text-on-surface-variant/50">مفيش اشتراك</span>;
    const name = PLAN_NAMES[sub.plan] || sub.plan;
    return (
        <div className="space-y-1 text-xs">
            <p className="text-on-surface font-medium">{name}</p>
            {sub.expiresAt && (
                <div className="flex items-center gap-1 text-on-surface-variant">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(sub.expiresAt).toLocaleDateString("ar-EG")}</span>
                </div>
            )}
            <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${sub.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                {sub.active ? "نشط" : "منتهي"}
            </span>
        </div>
    );
}

// ═══ Pending Tab ═══
function PendingTab({ accounts, onVerify, onReject }) {
    return (
        <>
            {accounts.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/40 p-12 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm text-on-surface">كل الحسابات موثقة ✅</p>
                    <p className="text-xs text-on-surface-variant mt-1">مفيش حسابات في طابور المراجعة</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {accounts.map((acc) => (
                        <div key={acc._id} className="bg-surface-container-lowest border border-outline-variant/40 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-3 min-w-0 flex-1">
                                    <div>
                                        <p className="text-sm font-semibold text-on-surface">{acc.user?.name}</p>
                                        <p className="text-xs text-on-surface-variant">{acc.user?.email}</p>
                                    </div>
                                    <div className="bg-surface-container-low p-3 text-xs">
                                        <p className="text-on-surface font-medium">{acc.bankName} · {acc.accountHolder}</p>
                                        <p className="font-mono text-on-surface-variant mt-1" dir="ltr">{acc.iban}</p>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        قُدّم: {new Date(acc.updatedAt).toLocaleDateString("ar-EG")}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => onVerify(acc)}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-premium"
                                    >
                                        ✅ توثيق
                                    </button>
                                    <button
                                        onClick={() => onReject(acc)}
                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-premium"
                                    >
                                        رفض
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// ═══ Verify Modal ═══
function VerifyModal({ account, onClose }) {
    const queryClient = useQueryClient();
    const verify = useMutation({
        mutationFn: () => adminService.verifyBankAccount(account._id),
        onSuccess: () => {
            toast.success("تم توثيق الحساب ✅ — الفنان الآن يقدر يسحب");
            queryClient.invalidateQueries({ queryKey: ["pendingBankAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["adminArtists"] });
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!account} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {account && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> توثيق الحساب البنكي
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>

                                    <div className="bg-surface-container-low p-4 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-on-surface-variant">الفنان</span><span className="font-semibold text-on-surface">{account.user?.name}</span></div>
                                        <div className="flex justify-between"><span className="text-on-surface-variant">البنك</span><span className="font-semibold text-on-surface">{account.bankName}</span></div>
                                        <div className="flex justify-between"><span className="text-on-surface-variant">صاحب الحساب</span><span className="font-semibold text-on-surface">{account.accountHolder}</span></div>
                                        <div className="border-t border-outline-variant/20 pt-2">
                                            <p className="text-xs text-on-surface-variant mb-1">IBAN:</p>
                                            <p className="font-mono text-sm text-on-surface" dir="ltr">{account.iban}</p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 mt-3 text-xs text-emerald-800">
                                        ✅ بعد التوثيق، الفنان يقدر يطلب سحوبات للحساب ده.
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={onClose} disabled={verify.isPending}
                                            className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-low transition-premium disabled:opacity-40">
                                            إلغاء
                                        </button>
                                        <button onClick={() => verify.mutate()} disabled={verify.isPending}
                                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-premium disabled:opacity-50">
                                            {verify.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "تأكيد التوثيق"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}

// ═══ Reject Modal ═══
function RejectModal({ account, onClose }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");

    const reject = useMutation({
        mutationFn: () => adminService.rejectBankAccount(account._id, reason),
        onSuccess: () => {
            toast.success("تم الرفض — الفنان هيشوف السبب ويحدّث البيانات");
            queryClient.invalidateQueries({ queryKey: ["pendingBankAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["adminArtists"] });
            setReason("");
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!account} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {account && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild forceMount>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                        </Dialog.Overlay>
                        <Dialog.Content asChild forceMount>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                <div className="bg-surface-container-lowest w-full max-w-md border border-outline-variant/40 shadow-2xl pointer-events-auto p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="font-display text-lg text-on-surface flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" /> رفض الحساب البنكي
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>

                                    <p className="text-sm text-on-surface-variant mb-3">
                                        حساب <strong className="text-on-surface">{account.user?.name}</strong>
                                    </p>

                                    <label className="text-xs font-semibold text-on-surface-variant block mb-1">سبب الرفض * (هيظهر للفنان)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثال: اسم صاحب الحساب لا يطابق اسم الفنان..."
                                        rows={3}
                                        className="w-full p-3 text-sm bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none resize-none"
                                    />

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={onClose} disabled={reject.isPending}
                                            className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-low transition-premium disabled:opacity-40">
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={() => reject.mutate()}
                                            disabled={!reason.trim() || reject.isPending}
                                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-premium disabled:opacity-50">
                                            {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "تأكيد الرفض"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}