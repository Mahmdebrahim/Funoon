import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, Ban, CheckCircle2, X, Loader2, Wallet, ShoppingBag, ShieldAlert,
} from "lucide-react";
import { adminService } from "../services/admin.service";

const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);

const ROLE_META = {
    buyer: { label: "مشترى", color: "bg-blue-50 text-blue-700 border-blue-200" },
    artist: { label: "فنان", color: "bg-purple-50 text-purple-700 border-purple-200" },
    admin: { label: "أدمن", color: "bg-stone-100 text-stone-700 border-stone-300" },
};

const TABS = [
    { value: "all", label: "الكل", role: "all", banned: "false" },
    { value: "buyer", label: "مشترين", role: "buyer", banned: "false" },
    { value: "artist", label: "فنانين", role: "artist", banned: "false" },
    { value: "banned", label: "محظورين", role: "all", banned: "true" },
];

export default function AdminUsersPage() {
    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [banTarget, setBanTarget] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const activeTab = TABS.find((t) => t.value === tab) || TABS[0];

    const { data, isLoading } = useQuery({
        queryKey: ["adminUsers", tab, debouncedSearch, page],
        queryFn: () =>
            adminService.getAdminUsers({
                role: activeTab.role,
                banned: activeTab.banned,
                search: debouncedSearch,
                page,
                limit: 15,
            }),
    });

    const users = data?.users || [];
    const pagination = data?.pagination || { total: 0, pages: 0 };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-display text-2xl text-on-surface">إدارة المستخدمين</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                    تابع المستخدمين واحظر المخالفين — الحظر يخفي لوحات الفنان ويجمّد محفظته
                </p>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => { setTab(t.value); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-body font-semibold border transition-premium ${tab === t.value
                                    ? t.value === "banned"
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-primary text-white border-primary"
                                    : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:border-primary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-on-surface-variant" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الإيميل..."
                        className="pr-9 pl-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:outline-none w-56"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-low/50">
                            <th className="p-3">المستخدم</th>
                            <th className="p-3">الدور</th>
                            <th className="p-3">النشاط</th>
                            <th className="p-3">المحفظة</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">جاري التحميل...</td></tr>
                        )}
                        {!isLoading && users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <Users className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                                    <p className="text-sm text-on-surface-variant">لا يوجد مستخدمون</p>
                                </td>
                            </tr>
                        )}
                        {users.map((u) => (
                            <tr key={u._id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/30">
                                <td className="p-3">
                                    <p className="text-on-surface font-medium">{u.name}</p>
                                    <p className="text-xs text-on-surface-variant">{u.email}</p>
                                    <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                                        انضم: {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                                    </p>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold border ${ROLE_META[u.role]?.color}`}>
                                        {ROLE_META[u.role]?.label}
                                    </span>
                                </td>
                                <td className="p-3">
                                    {u.role === "artist" ? (
                                        u.wallet ? (
                                            <span className="text-xs text-on-surface-variant">
                                                معلق: <strong className="text-on-surface">{fmt(u.wallet.pending)}</strong>
                                            </span>
                                        ) : "—"
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                            <ShoppingBag className="w-3 h-3" />
                                            <span>{u.ordersCount} طلب</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-3">
                                    {u.wallet ? (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Wallet className="w-3 h-3 text-emerald-600" />
                                            <span className="text-on-surface-variant">متاح:</span>
                                            <span className="font-semibold text-emerald-600">{fmt(u.wallet.available)}</span>
                                        </div>
                                    ) : "—"}
                                </td>
                                <td className="p-3">
                                    {u.isBanned ? (
                                        <div>
                                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                                محظور 🔒
                                            </span>
                                            {u.banReason && (
                                                <p className="text-[10px] text-red-600 mt-1 max-w-[140px] truncate" title={u.banReason}>
                                                    {u.banReason}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            نشط
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {u.role !== "admin" && (
                                        u.isBanned ? (
                                            <UnbanButton user={u} />
                                        ) : (
                                            <button
                                                onClick={() => setBanTarget(u)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-premium"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                                حظر
                                            </button>
                                        )
                                    )}
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

            <BanModal user={banTarget} onClose={() => setBanTarget(null)} />
        </div>
    );
}

// ═══ Unban Button ═══
function UnbanButton({ user }) {
    const queryClient = useQueryClient();
    const unban = useMutation({
        mutationFn: () => adminService.unbanUser(user._id),
        onSuccess: () => {
            toast.success("تم فك الحظر ✅ — اللوحات رجعت ظاهرة");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });
    return (
        <button
            onClick={() => {
                if (window.confirm(`فك الحظر عن ${user.name}؟`)) unban.mutate();
            }}
            disabled={unban.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-premium disabled:opacity-50"
        >
            <CheckCircle2 className="w-3.5 h-3.5" />
            فك الحظر
        </button>
    );
}

// ═══ Ban Modal ═══
function BanModal({ user, onClose }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");

    const ban = useMutation({
        mutationFn: () => adminService.banUser(user._id, reason),
        onSuccess: () => {
            toast.success("تم حظر المستخدم 🔒");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            setReason("");
            onClose();
        },
        onError: (e) => toast.error(e?.response?.data?.message || e.message),
    });

    return (
        <Dialog.Root open={!!user} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {user && (
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
                                            <ShieldAlert className="w-4 h-4 text-red-600" /> حظر المستخدم
                                        </Dialog.Title>
                                        <Dialog.Close asChild><button className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button></Dialog.Close>
                                    </div>

                                    <p className="text-sm text-on-surface-variant mb-3">
                                        <strong className="text-on-surface">{user?.name}</strong> · {ROLE_META[user?.role]?.label}
                                    </p>

                                    <label className="text-xs font-semibold text-on-surface-variant block mb-1">سبب الحظر *</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثال: سرقة أعمال فنية، احتيال، إساءة..."
                                        rows={3}
                                        className="w-full p-3 text-sm bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:outline-none resize-none"
                                    />

                                    {user?.role === "artist" && (
                                        <div className="bg-red-50 border border-red-200 p-2.5 mt-3 text-xs text-red-800 space-y-1">
                                            <p>⚠️ عند الحظر:</p>
                                            <p>• لوحاته هتختفي فوراً</p>
                                            <p>• محفظته هتتجمد</p>
                                            <p>• سحوباته المعلقة هتتلغى وترجع للمحفظة</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => ban.mutate()}
                                        disabled={!reason.trim() || ban.isPending}
                                        className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold"
                                    >
                                        {ban.isPending ? "جاري الحظر..." : "تأكيد الحظر 🔒"}
                                    </button>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}