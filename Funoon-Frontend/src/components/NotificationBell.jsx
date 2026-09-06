import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import {
    useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead,
} from "../hooks/useNotifications";
import { getMeta, timeAgo } from "../utils/notificationMeta";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    const { data: unreadCount = 0 } = useUnreadCount();
    const { data } = useNotifications({ limit: 5 });
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    // click outside → close
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const notifications = data?.notifications || [];

    const handleClick = (n) => {
        if (!n.isRead) markAsRead.mutate(n._id);
        setOpen(false);
        if (n.data?.route) navigate(n.data.route);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                aria-label="الإشعارات"
            >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 left-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--color-surface)]">
                        {unreadCount > 9 ? "+9" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-2 w-[340px] max-w-[90vw] bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]/30">
                        <span className="font-display text-sm font-semibold text-[var(--color-on-surface)]">
                            الإشعارات
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                قراءة الكل
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                            <Inbox className="w-8 h-8 mx-auto mb-2 text-[var(--color-on-surface-variant)]/30" strokeWidth={1} />
                            <p className="text-xs text-[var(--color-on-surface-variant)]">لا توجد إشعارات بعد</p>
                        </div>
                    ) : (
                        <div className="max-h-[250px] overflow-y-auto divide-y divide-[var(--color-outline-variant)]/20">
                            {notifications.map((n) => {
                                const meta = getMeta(n.type);
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleClick(n)}
                                        className={`w-full text-right px-4 py-3 flex gap-3 transition-colors cursor-pointer hover:bg-[var(--color-surface-container-low)]/50 ${!n.isRead ? "bg-[var(--color-primary)]/5" : ""
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-4 h-4 ${meta.color}`} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-relaxed ${!n.isRead ? "font-semibold text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate mt-0.5">
                                                {n.body}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-on-surface-variant)]/60 mt-1">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    <button
                        onClick={() => { setOpen(false); navigate("/notifications"); }}
                        className="w-full py-2.5 text-center text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]/50 transition-colors cursor-pointer border-t border-[var(--color-outline-variant)]/30"
                    >
                        عرض كل الإشعارات
                    </button>
                </div>
            )}
        </div>
    );
}