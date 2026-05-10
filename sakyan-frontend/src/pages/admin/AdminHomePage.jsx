import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Car, CalendarCheck,
  Clock, CheckCircle2, AlertCircle,
  Shield, Wallet, ArrowUpRight,
  CreditCard, UserCheck, ChevronRight,
  Activity, BarChart3, DollarSign,
} from 'lucide-react'
import { useAdminStats, useAdminPartners, useAdminAllBookings } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { format } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, ComposedChart,
} from 'recharts'

/* ─── Color Palette ─────────────────────────────────────────────────────────── */
const CHART_COLORS = {
  brand:    '#4F6BF6',
  brandLight: '#7793f7',
  green:    '#10B981',
  amber:    '#F59E0B',
  red:      '#EF4444',
  sky:      '#0EA5E9',
  violet:   '#8B5CF6',
  orange:   '#F97316',
  teal:     '#14B8A6',
  rose:     '#F43F5E',
  slate:    '#64748B',
}

const STATUS_COLORS = {
  pending_review: CHART_COLORS.amber,
  approved:       CHART_COLORS.sky,
  active:         CHART_COLORS.green,
  completed:      CHART_COLORS.brand,
  rejected:       CHART_COLORS.red,
  cancelled:      CHART_COLORS.slate,
}

const STATUS_LABELS = {
  pending_review: 'Pending Review',
  approved:       'Approved',
  active:         'Active',
  completed:      'Completed',
  rejected:       'Rejected',
  cancelled:      'Cancelled',
}

/* ─── Custom Tooltip ────────────────────────────────────────────────────────── */
function GlassTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 dark:bg-[#1e2235]/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl px-4 py-3 text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-300 text-xs">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white text-xs">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
function HeroStatCard({ icon: Icon, label, value, gradient, sub, trend }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 group hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300">
      {/* Background decorative gradient */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.08] dark:opacity-[0.12] ${gradient} blur-2xl group-hover:opacity-[0.15] dark:group-hover:opacity-[0.2] transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between relative">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value ?? '—'}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight size={12} className="text-emerald-500" />}
              {trend === 'down' && <ArrowDownRight size={12} className="text-red-400" />}
              {sub}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

/* ─── Quick Stat Pill ───────────────────────────────────────────────────────── */
function QuickStatPill({ icon: Icon, label, value, color, to }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group cursor-pointer">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
      </div>
      {to && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors shrink-0" />}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

/* ─── Quick Action Button ───────────────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-[#1a1d2e] hover:shadow-md transition-all duration-200 group"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
        {label}
      </span>
      <ChevronRight size={14} className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors shrink-0" />
    </Link>
  )
}

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
const STATUS_BADGE_STYLES = {
  pending_review: 'bg-amber-50 text-amber-700 ring-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800/30',
  approved:       'bg-blue-50 text-blue-700 ring-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800/30',
  active:         'bg-emerald-50 text-emerald-700 ring-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800/30',
  completed:      'bg-gray-50 text-gray-600 ring-gray-200/50 dark:bg-gray-800/50 dark:text-gray-300 dark:ring-gray-700/30',
  rejected:       'bg-red-50 text-red-600 ring-red-200/50 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/30',
  cancelled:      'bg-red-50/50 text-red-400 ring-red-200/30 dark:bg-red-900/10 dark:text-red-400 dark:ring-red-800/20',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1
                      ${STATUS_BADGE_STYLES[status] || 'bg-gray-50 dark:bg-gray-800 text-gray-500 ring-gray-200/50 dark:ring-gray-700/30'}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#94A3B8' }} />
      {STATUS_LABELS[status] || status?.replace('_', ' ')}
    </span>
  )
}

/* ─── Donut Center Label ────────────────────────────────────────────────────── */
function DonutCenterLabel({ viewBox, value, label }) {
  const { cx, cy } = viewBox || {}
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} y={cy - 8} className="fill-gray-900 dark:fill-white text-2xl font-bold">
        {value}
      </tspan>
      <tspan x={cx} y={cy + 14} className="fill-gray-400 dark:fill-gray-500 text-[11px]">
        {label}
      </tspan>
    </text>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════════
   ADMIN HOME PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminHomePage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingPartners } = useAdminPartners('pending')
  const { data: recentBookings } = useAdminAllBookings({})

  const partnerList = pendingPartners?.results || pendingPartners || []
  const allBookings = recentBookings?.results || recentBookings || []
  const bookingList = allBookings.slice(0, 5)

  /* ── Revenue by month ────────────────────────────────────────────────────── */
  const revenueData = useMemo(() => {
    const byMonth = allBookings
      .filter(b => b.booking_status === 'completed')
      .reduce((acc, b) => {
        if (!b.end_date) return acc
        const month = format(new Date(b.end_date), 'MMM yyyy')
        const rev = (Number(b.commission_amount) || 0) + (Number(b.booking_fee) || 0)
        if (!acc[month]) acc[month] = { Revenue: 0, Bookings: 0 }
        acc[month].Revenue += rev
        acc[month].Bookings += 1
        return acc
      }, {})

    return Object.keys(byMonth)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(m => ({ name: m, ...byMonth[m] }))
  }, [allBookings])

  /* ── Booking status breakdown ────────────────────────────────────────────── */
  const bookingStatusData = useMemo(() => {
    if (!stats) return []
    const mapping = [
      { key: 'pending_bookings',   status: 'pending_review' },
      { key: 'active_bookings',    status: 'active' },
      { key: 'completed_bookings', status: 'completed' },
      { key: 'cancelled_bookings', status: 'cancelled' },
      { key: 'rejected_bookings',  status: 'rejected' },
    ]
    return mapping
      .map(({ key, status }) => ({
        name:  STATUS_LABELS[status],
        value: stats[key] || 0,
        color: STATUS_COLORS[status],
      }))
      .filter(d => d.value > 0)
  }, [stats])

  /* ── Top grossing partners ───────────────────────────────────────────────── */
  const topPartnersData = useMemo(() => {
    const map = allBookings
      .filter(b => b.booking_status === 'completed')
      .reduce((acc, b) => {
        const name = b.partner_name || 'Unknown Partner'
        const rev = (Number(b.commission_amount) || 0) + (Number(b.booking_fee) || 0)
        acc[name] = (acc[name] || 0) + rev
        return acc
      }, {})

    return Object.entries(map)
      .map(([name, rev]) => ({ name, Commission: rev }))
      .sort((a, b) => b.Commission - a.Commission)
      .slice(0, 5)
  }, [allBookings])

  /* ── Earnings breakdown ──────────────────────────────────────────────────── */
  const earnings = useMemo(() => {
    if (!stats) return null
    const total = stats.total_revenue || 0
    const comm = stats.total_commission || 0
    const fees = stats.total_booking_fees || 0
    return {
      total,
      commission: comm,
      fees,
      commPct: total > 0 ? (comm / total) * 100 : 0,
      feesPct: total > 0 ? (fees / total) * 100 : 0,
    }
  }, [stats])

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Platform overview and key metrics
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          Last updated: {format(new Date(), 'MMM d, yyyy · h:mm a')}
        </p>
      </div>

      {/* ── Hero Stat Cards ────────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 h-[110px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroStatCard
            icon={DollarSign}
            label="Total Revenue"
            value={stats?.total_revenue != null ? formatCurrency(stats.total_revenue) : '—'}
            gradient="from-brand-500 to-violet-500"
            sub="Platform commissions & fees"
            trend="up"
          />
          <HeroStatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats?.total_bookings}
            gradient="from-emerald-500 to-teal-500"
            sub={`${stats?.completed_bookings || 0} completed`}
          />
          <HeroStatCard
            icon={Users}
            label="Total Users"
            value={stats?.total_users}
            gradient="from-sky-500 to-blue-500"
            sub={`${stats?.total_customers || 0} customers · ${stats?.total_partners || 0} partners`}
          />
          <HeroStatCard
            icon={Car}
            label="Listed Cars"
            value={stats?.total_cars}
            gradient="from-orange-500 to-amber-500"
            sub="Available on platform"
          />
        </div>
      )}

      {/* ── Quick Stats Strip ──────────────────────────────────────────────── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStatPill
            icon={Clock}
            label="Pending Partners"
            value={stats.pending_partners}
            color="bg-amber-400"
            to="/admin/partners"
          />
          <QuickStatPill
            icon={CheckCircle2}
            label="Active Partners"
            value={stats.active_partners}
            color="bg-emerald-500"
          />
          <QuickStatPill
            icon={Shield}
            label="Pending KYC"
            value={stats.kyc_pending || stats.pending_kyc || 0}
            color="bg-violet-500"
            to="/admin/kyc"
          />
          <QuickStatPill
            icon={AlertCircle}
            label="Pending Bookings"
            value={stats.pending_bookings}
            color="bg-sky-500"
            to="/admin/bookings"
          />
        </div>
      )}

      {/* ── Charts Row: Revenue + Booking Status + Earnings ────────────────── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Revenue & Bookings Combo Chart */}
          <div className="xl:col-span-7 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">Revenue Overview</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Monthly revenue from completed bookings</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Bookings
                </span>
              </div>
            </div>
            <div className="h-72 w-full">
              {revenueData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <BarChart3 size={36} className="mb-2 opacity-40" />
                  <p className="text-sm">No completed bookings yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      dy={8}
                    />
                    <YAxis
                      yAxisId="rev"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="count"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                    <Tooltip content={
                      <GlassTooltip formatter={(v, name) =>
                        name === 'Revenue' ? `₱${v.toLocaleString()}` : v
                      } />
                    } />
                    <Bar
                      yAxisId="count"
                      dataKey="Bookings"
                      fill={CHART_COLORS.green}
                      opacity={0.25}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Area
                      yAxisId="rev"
                      type="monotone"
                      dataKey="Revenue"
                      stroke={CHART_COLORS.brand}
                      strokeWidth={2.5}
                      fill="url(#gradRevenue)"
                      dot={{ r: 3, fill: CHART_COLORS.brand, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: CHART_COLORS.brand, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right column: Booking Status Donut + Earnings Breakdown */}
          <div className="xl:col-span-5 flex flex-col gap-6">

            {/* Booking Status Donut */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 flex-1">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Booking Status</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Current booking pipeline</p>
              <div className="h-52 w-full">
                {bookingStatusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No bookings yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {bookingStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<GlassTooltip />}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Earnings Breakdown */}
            {earnings && (
              <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
                <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Earnings Breakdown</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400">Platform Commission</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(earnings.commission)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${Math.min(earnings.commPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400">Booking Fees</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(earnings.fees)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                        style={{ width: `${Math.min(earnings.feesPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(earnings.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Partners + Quick Actions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Grossing Partners */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">Top Revenue Partners</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Commission generated by partner</p>
            </div>
            <Link
              to="/admin/partners"
              className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="h-64 w-full">
            {topPartnersData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <Activity size={32} className="mb-2 opacity-40" />
                <p className="text-sm">Not enough data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPartnersData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPartner" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS.violet} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#E5E7EB" strokeOpacity={0.4} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={
                    <GlassTooltip formatter={(v) => `₱${v.toLocaleString()}`} />
                  } />
                  <Bar
                    dataKey="Commission"
                    fill="url(#gradPartner)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            <QuickAction
              icon={UserCheck}
              label="Review Partners"
              to="/admin/partners"
              color="from-amber-400 to-orange-500"
            />
            <QuickAction
              icon={Shield}
              label="Verify KYC"
              to="/admin/kyc"
              color="from-violet-500 to-purple-600"
            />
            <QuickAction
              icon={CalendarCheck}
              label="Manage Bookings"
              to="/admin/bookings"
              color="from-sky-400 to-blue-500"
            />
            <QuickAction
              icon={CreditCard}
              label="Process Refunds"
              to="/admin/refunds"
              color="from-rose-400 to-red-500"
            />
            <QuickAction
              icon={Wallet}
              label="Settlements"
              to="/admin/settlements"
              color="from-emerald-400 to-teal-500"
            />
            <QuickAction
              icon={BarChart3}
              label="View Reports"
              to="/admin/reports"
              color="from-brand-400 to-brand-600"
            />
          </div>
        </div>
      </div>

      {/* ── Activity Panels: Pending Partners + Recent Bookings ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Partners */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800 dark:text-white">Pending Applications</h2>
              {partnerList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {partnerList.length}
                </span>
              )}
            </div>
            <Link
              to="/admin/partners"
              className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {partnerList.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">All caught up!</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {partnerList.slice(0, 5).map(partner => (
                <div
                  key={partner.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {(partner.business_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {partner.business_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {partner.partner_type} · {partner.user?.email}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold ring-1 ring-amber-200/50 dark:ring-amber-800/30 shrink-0">
                    <Clock size={10} /> Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800 dark:text-white">Recent Bookings</h2>
              {bookingList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {stats?.total_bookings || allBookings.length}
                </span>
              )}
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {bookingList.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                <CalendarCheck size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No bookings yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookingList.map(booking => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0">
                    <Car size={16} className="text-brand-500 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {booking.car_name}
                      </p>
                      <StatusBadge status={booking.booking_status} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {booking.customer_name} · {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white shrink-0 tabular-nums">
                    {formatCurrency(booking.total_amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
