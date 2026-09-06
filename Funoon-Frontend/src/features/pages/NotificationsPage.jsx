import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck, Inbox } from "lucide-react";
import {
    useNotifications, useMarkAsRead, useMarkAllAsRead,
} from "../../hooks/useNotifications";
import { getMeta, timeAgo } from "../../utils/notificationMeta";

export default function NotificationsPage() {
    const [tab, setTab] = useState("all");
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const { data, isLoading } = useNotifications({
        page,
        limit: 15,
        unreadOnly: tab === "unread" ? "true" : undefined,
    });
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;
    const pagination = data?.pagination || { pages: 1 };

    const handleClick = (n) => {
        if (!n.isRead) markAsRead.mutate(n._id);
        if (n.data?.route) navigate(n.data.route);
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] py-10 px-5" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* ═══ Header ═══ */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-[var(--color-on-surface)]">
                                الإشعارات
                            </h1>
                            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
                                {unreadCount > 0
                                    ? `لديك ${unreadCount} إشعار غير مقروء`
                                    : "أنت على اطلاع بكل جديد"}
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[var(--color-primary)] rounded-full hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            <CheckCheck className="w-4 h-4" />
                            تعليم الكل كمقروء
                        </button>
                    )}
                </div>

                {/* ═══ Tabs (Segmented) ═══ */}
                <div className="flex p-1 bg-[var(--color-surface-container-low)] rounded-full w-fit">
                    {[
                        { value: "all", label: "الكل" },
                        { value: "unread", label: `غير المقروء${unreadCount ? ` (${unreadCount})` : ""}` },
                    ].map((t) => (
                        <button
                            key={t.value}
                            onClick={() => { setTab(t.value); setPage(1); }}
                            className={`px-5 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${tab === t.value
                                    ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
                                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ═══ Content ═══ */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-2xl p-4 flex gap-4 animate-pulse">
                                <div className="w-11 h-11 rounded-full bg-[var(--color-surface-container-low)] shrink-0" />
                                <div className="flex-1 space-y-2.5 py-1">
                                    <div className="h-4 w-1/3 bg-[var(--color-surface-container-low)] rounded" />
                                    <div className="h-3 w-3/4 bg-[var(--color-surface-container-low)] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 mx-auto bg-[var(--color-surface-container-low)] rounded-full flex items-center justify-center mb-4">
                            {tab === "unread" ? (
                                <BellOff className="w-7 h-7 text-[var(--color-on-surface-variant)]/40" strokeWidth={1} />
                            ) : (
                                <Inbox className="w-7 h-7 text-[var(--color-on-surface-variant)]/40" strokeWidth={1} />
                            )}
                        </div>
                        <h3 className="font-display text-lg text-[var(--color-on-surface)] mb-1">
                            {tab === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات بعد"}
                        </h3>
                        {/* <p className="text-sm text-[var(--color-on-surface-variant)]">
                            {tab === "unread" ? "كل حاجة تمام — أنت مطلع على كل جديد" : "هتوصلك إشعارات هنا عن لوحاتك وطلباتك وسحوباتك"}
                        </p> */}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n) => {
                            const meta = getMeta(n.type);
                            const Icon = meta.icon;
                            return (
                                <button
                                    key={n._id}
                                    onClick={() => handleClick(n)}
                                    className={`w-full text-right rounded-2xl p-4 flex gap-4 transition-all cursor-pointer border group ${!n.isRead
                                            ? "bg-[var(--color-surface-container-lowest)] border-[var(--color-primary)]/25 shadow-sm"
                                            : "bg-[var(--color-surface-container-lowest)]/60 border-[var(--color-outline-variant)]/30 hover:border-[var(--color-outline-variant)]/60"
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-11 h-11 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-5 h-5 ${meta.color}`} strokeWidth={2} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className={`text-sm leading-snug ${!n.isRead
                                                    ? "font-bold text-[var(--color-on-surface)]"
                                                    : "font-medium text-[var(--color-on-surface-variant)]"
                                                }`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-[var(--color-on-surface-variant)]/70 shrink-0 mt-0.5">
                                                {timeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--color-on-surface-variant)] mt-1.5 leading-relaxed">
                                            {n.body}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.isRead && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shrink-0 self-center group-hover:scale-125 transition-transform" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ═══ Pagination ═══ */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-5 py-2.5 text-xs font-semibold border border-[var(--color-outline-variant)]/40 rounded-full disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer"
                        >
                            السابق
                        </button>
                        <span className="text-sm text-[var(--color-on-surface-variant)]">
                            {page} / {pagination.pages}
                        </span>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-5 py-2.5 text-xs font-semibold border border-[var(--color-outline-variant)]/40 rounded-full disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}