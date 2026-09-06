import { useQuery } from "@tanstack/react-query";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, Legend, Cell
} from "recharts";
import { Banknote, TrendingUp, Wallet, Landmark, Trophy, ArrowDownToLine } from "lucide-react";
import { adminService } from "../services/admin.service";

const fmt = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v || 0);
const monthLabel = (key) =>
    new Date(key + "-01T00:00:00").toLocaleDateString("ar-EG", { month: "short", year: "2-digit" });

export default function AdminFinancialPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["adminFinancial"],
        queryFn: () => adminService.getFinancialStats(),
    });

    if (isLoading) return <LoadingState />;
    if (!data) return null;

    const { cards, months, bestMonth } = data;

    const totals = months.reduce(
        (acc, m) => ({
            orders: acc.orders + m.orders,
            revenue: acc.revenue + m.revenue,
            commission: acc.commission + m.commission,
            subscriptions: acc.subscriptions + m.subscriptions,
            platformIncome: acc.platformIncome + m.platformIncome,
            withdrawals: acc.withdrawals + m.withdrawals,
        }),
        { orders: 0, revenue: 0, commission: 0, subscriptions: 0, platformIncome: 0, withdrawals: 0 },
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-display text-2xl text-on-surface">المالية</h2>
                    <p className="text-sm text-on-surface-variant mt-1">أرباح المنصة والاشتراكات والسحوبات شهر بشهر</p>
                </div>
                {bestMonth?.key && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs font-semibold">
                            أفضل شهر: {monthLabel(bestMonth.key)} بقيمة {fmt(bestMonth.revenue)} ر.س
                        </span>
                    </div>
                )}
            </div>

            {/* ═══ Cards ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card icon={TrendingUp} label="عمولة هذا الشهر" value={`${fmt(cards.monthCommission)} ر.س`} sub={`${fmt(cards.monthOrders)} طلب`} />
                <Card icon={Landmark} label="اشتراكات هذا الشهر" value={`${fmt(cards.monthSubscriptions)} ر.س`} sub="دخل متكرر (MRR)" accent="text-secondary" />
                <Card icon={Wallet} label="أموال معلقة (Escrow)" value={`${fmt(cards.escrowPending)} ر.س`} sub="مستحقة للفنانين" accent="text-amber-600" />
                <Card icon={ArrowDownToLine} label="مسحوبات هذا الشهر" value={`${fmt(cards.monthWithdrawals)} ر.س`} sub="فلوس خارجة" accent="text-red-600" />
            </div>

            {/* ═══ Monthly Revenue ═══ */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
                <h3 className="text-sm font-body font-semibold text-on-surface mb-4">المبيعات الشهرية (ر.س)</h3>
                <div dir="ltr" className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={months}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="key" tickFormatter={monthLabel} tick={{ fontSize: 9 }} interval={0} />
                            <YAxis tick={{ fontSize: 10 }} width={50} />
                            <Tooltip formatter={(v) => `${fmt(v)} ر.س`} labelFormatter={monthLabel} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                {months.map((m) => (
                                    <Cell
                                        key={m.key}
                                        fill={m.key === bestMonth.key ? "var(--color-secondary)" : "var(--color-primary)"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ═══ Platform Income + Withdrawals ═══ */}
            <div className="grid lg:grid-cols-2 gap-4">

                <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
                    <h3 className="text-sm font-body font-semibold text-on-surface mb-4">دخل المنصة (عمولة + اشتراكات)</h3>
                    <div dir="ltr" className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={months}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="key" tickFormatter={monthLabel} tick={{ fontSize: 9 }} interval={0} />
                                <YAxis tick={{ fontSize: 10 }} width={50} />
                                <Tooltip formatter={(v) => `${fmt(v)} ر.س`} labelFormatter={monthLabel} />
                                <Legend formatter={(v) => (v === "commission" ? "عمولة" : "اشتراكات")} />
                                <Bar dataKey="commission" stackId="a" fill="var(--color-primary)" />
                                <Bar dataKey="subscriptions" stackId="a" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg">
                    <h3 className="text-sm font-body font-semibold text-on-surface mb-4">السحوبات المدفوعة شهرياً</h3>
                    <div dir="ltr" className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={months}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="key" tickFormatter={monthLabel} tick={{ fontSize: 9 }} interval={0} />
                                <YAxis tick={{ fontSize: 10 }} width={50} />
                                <Tooltip formatter={(v) => `${fmt(v)} ر.س`} labelFormatter={monthLabel} />
                                <Bar dataKey="withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ═══ Monthly Table ═══ */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 overflow-x-auto rounded-lg">
                <h3 className="text-sm font-body font-semibold text-on-surface mb-4">الملخص الشهري</h3>
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="text-right text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30">
                            <th className="pb-2 pr-2">الشهر</th>
                            <th className="pb-2">طلبات</th>
                            <th className="pb-2">مبيعات</th>
                            <th className="pb-2">عمولة</th>
                            <th className="pb-2">اشتراكات</th>
                            <th className="pb-2">دخل المنصة</th>
                            <th className="pb-2">مسحوبات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...months].reverse().map((m) => (
                            <tr key={m.key} className="border-b border-outline-variant/20 last:border-0">
                                <td className="py-2.5 pr-2 font-semibold text-on-surface">{monthLabel(m.key)}</td>
                                <td className="py-2.5 text-on-surface-variant">{fmt(m.orders)}</td>
                                <td className="py-2.5 text-on-surface">{fmt(m.revenue)}</td>
                                <td className="py-2.5 text-on-surface">{fmt(m.commission)}</td>
                                <td className="py-2.5 text-secondary">{fmt(m.subscriptions)}</td>
                                <td className="py-2.5 font-semibold text-on-surface">{fmt(m.platformIncome)}</td>
                                <td className="py-2.5 text-red-600">{fmt(m.withdrawals)}</td>
                            </tr>
                        ))}
                        <tr className="bg-surface-container-low font-semibold border-t-2 border-outline-variant/40">
                            <td className="py-2.5 pr-2 text-on-surface">الإجمالي (12 شهر)</td>
                            <td className="py-2.5">{fmt(totals.orders)}</td>
                            <td className="py-2.5">{fmt(totals.revenue)}</td>
                            <td className="py-2.5">{fmt(totals.commission)}</td>
                            <td className="py-2.5 text-secondary">{fmt(totals.subscriptions)}</td>
                            <td className="py-2.5">{fmt(totals.platformIncome)}</td>
                            <td className="py-2.5 text-red-600">{fmt(totals.withdrawals)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Card({ icon: Icon, label, value, sub, accent = "text-primary" }) {
    return (
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-lg ">
            <div className={`w-9 h-9 flex items-center justify-center bg-surface-container-low mb-3 ${accent}`}>
                <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
            <p className="font-display text-2xl text-on-surface leading-none">{value}</p>
            {sub && <p className="text-xs text-on-surface-variant mt-2">{sub}</p>}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6">
            <div className="h-10 w-64 bg-surface-container animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface-container animate-pulse" />)}
            </div>
            <div className="h-72 bg-surface-container animate-pulse" />
        </div>
    );
}