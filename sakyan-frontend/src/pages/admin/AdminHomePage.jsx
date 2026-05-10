import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Car, CalendarCheck, DollarSign,
  Clock, CheckCircle2, AlertCircle, Shield,
  Wallet, CreditCard, UserCheck, ChevronRight,
  ArrowUpRight, BarChart3,
} from 'lucide-react'
import { useAdminStats, useAdminPartners, useAdminAllBookings } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { format, startOfWeek } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, LineChart, Line,
} from 'recharts'
import { useUIStore } from '@/store/uiStore'

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED UTILITIES  (matching partner dashboard style)
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── Period config ────────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly'  },
]

function getPeriodKey(dateStr, period) {
  const d = new Date(dateStr)
  switch (period) {
    case 'daily':   return format(d, 'MMM d')
    case 'weekly': {
      const weekStart = startOfWeek(d, { weekStartsOn: 1 })
      return format(weekStart, 'MMM d')
    }
    case 'monthly': return format(d, 'MMM yy')
    case 'yearly':  return format(d, 'yyyy')
    default:        return format(d, 'MMM yy')
  }
}

function sortPeriodKeys(keys, period) {
  return [...keys].sort((a, b) => {
    const parseKey = k => {
      try {
        if (period === 'yearly') return new Date(`Jan 1 ${k}`)
        return new Date(`${k} ${new Date().getFullYear()}`)
      } catch { return new Date(0) }
    }
    return parseKey(a) - parseKey(b)
  })
}

// ─── Period toggle ────────────────────────────────────────────────────────────
function PeriodToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            value === p.key
              ? 'bg-white dark:bg-[#1a1d2e] text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ─── Chart theme ──────────────────────────────────────────────────────────────
function useChartTheme(theme) {
  const isDark = theme === 'dark'
  return {
    isDark,
    text  : isDark ? '#6B7280' : '#9CA3AF',
    grid  : isDark ? '#1F2937' : '#F3F4F6',
    tip   : {
      borderRadius   : '12px',
      border         : `1px solid ${isDark ? '#1F2937' : '#F0F0F0'}`,
      boxShadow      : '0 10px 30px -5px rgb(0 0 0 / 0.15)',
      backgroundColor: isDark ? '#111827' : '#ffffff',
      color          : isDark ? '#F9FAFB' : '#111827',
      fontSize       : '12px',
      padding        : '10px 14px',
    },
    cursor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  }
}

// ─── Shared components ────────────────────────────────────────────────────────
function Panel({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}>
      {children}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div
      className="relative bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100
                 dark:border-gray-800 p-5 overflow-hidden
                 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                 dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                 transition-all duration-300 group"
    >
      <div
        className="absolute -top-5 -right-5 w-24 h-24 rounded-full
                   opacity-[0.07] dark:opacity-[0.12]
                   group-hover:opacity-[0.13] dark:group-hover:opacity-[0.18]
                   transition-opacity duration-300"
        style={{ background: accent }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm"
        style={{ background: accent }}
      >
        <Icon size={17} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
        {value ?? '—'}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
        <ArrowUpRight
          size={13}
          className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
      {sub && (
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 truncate">{sub}</p>
      )}
    </div>
  )
}

// ─── Quick action ─────────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, to, accent }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-gray-800/50
                 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: accent }}
      >
        <Icon size={15} className="text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
        {label}
      </span>
      <ChevronRight size={14} className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors shrink-0" />
    </Link>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS_MAP = {
  pending_review: '#F59E0B',
  approved:       '#3B82F6',
  active:         '#10B981',
  completed:      '#6B7280',
  rejected:       '#EF4444',
  cancelled:      '#F87171',
}

const STATUS_BADGE_STYLES = {
  pending_review: 'bg-amber-50 text-amber-700 ring-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800/30',
  approved:       'bg-blue-50 text-blue-700 ring-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800/30',
  active:         'bg-emerald-50 text-emerald-700 ring-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800/30',
  completed:      'bg-gray-50 text-gray-600 ring-gray-200/50 dark:bg-gray-800/50 dark:text-gray-300 dark:ring-gray-700/30',
  rejected:       'bg-red-50 text-red-600 ring-red-200/50 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/30',
  cancelled:      'bg-red-50/50 text-red-400 ring-red-200/30 dark:bg-red-900/10 dark:text-red-400 dark:ring-red-800/20',
}

function StatusBadge({ status }) {
  const label = status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1
                      ${STATUS_BADGE_STYLES[status] || 'bg-gray-50 dark:bg-gray-800 text-gray-500 ring-gray-200/50 dark:ring-gray-700/30'}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS_MAP[status] || '#94A3B8' }} />
      {label}
    </span>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════════
   ADMIN HOME PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminHomePage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingPartners } = useAdminPartners('pending')
  const { data: recentBookings }  = useAdminAllBookings({})
  const { theme } = useUIStore()
  const c = useChartTheme(theme)

  const [period, setPeriod] = useState('daily')

  const partnerList = pendingPartners?.results || pendingPartners || []
  const allBookings = recentBookings?.results  || recentBookings  || []
  const bookingList = allBookings.slice(0, 5)

  const completedBookings = useMemo(
    () => allBookings.filter(b => b.booking_status === 'completed'),
    [allBookings]
  )

  /* ── Revenue data (period-aware) ─────────────────────────────────────────── */
  const revenueData = useMemo(() => {
    const map = completedBookings.reduce((acc, b) => {
      if (!b.end_date) return acc
      const key = getPeriodKey(b.end_date, period)
      const rev = (Number(b.commission_amount) || 0) + (Number(b.booking_fee) || 0)
      acc[key] = (acc[key] || 0) + rev
      return acc
    }, {})
    return sortPeriodKeys(Object.keys(map), period).map(k => ({ name: k, Revenue: map[k] }))
  }, [completedBookings, period])

  const totalRevenue = stats?.total_revenue || 0

  /* ── Bookings overview (period-aware bar chart) ──────────────────────────── */
  const bookingsChartData = useMemo(() => {
    const map = allBookings.reduce((acc, b) => {
      const key = getPeriodKey(b.created_at || b.start_date, period)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return sortPeriodKeys(Object.keys(map), period).map(k => ({ name: k, Bookings: map[k] }))
  }, [allBookings, period])

  /* ── Booking status donut (period-filtered) ──────────────────────────────── */
  const statusData = useMemo(() => {
    const STATUS_COLORS = {
      pending_review: '#F59E0B', approved: '#3B82F6',
      active: '#10B981', completed: '#4F6BF6',
      rejected: '#EF4444', cancelled: '#F87171',
    }
    const filtered = allBookings.filter(b => {
      try {
        const key = getPeriodKey(b.created_at || b.start_date, period)
        const allKeys = bookingsChartData.map(d => d.name)
        return allKeys.includes(key)
      } catch { return true }
    })
    const map = filtered.reduce((acc, b) => {
      acc[b.booking_status] = (acc[b.booking_status] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([k, v]) => ({
      name:  k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: v,
      color: STATUS_COLORS[k] || '#9CA3AF',
    }))
  }, [allBookings, period, bookingsChartData])

  /* ── Top performing partners (compact) ───────────────────────────────────── */
  const topPartnersData = useMemo(() => {
    const map = completedBookings.reduce((acc, b) => {
      // Filter by period
      const key = getPeriodKey(b.end_date, period)
      const inRange = revenueData.some(d => d.name === key)
      if (!inRange) return acc
      const name = b.partner_name || 'Unknown Partner'
      const rev = (Number(b.commission_amount) || 0) + (Number(b.booking_fee) || 0)
      acc[name] = (acc[name] || 0) + rev
      return acc
    }, {})
    return Object.entries(map)
      .map(([name, Commission]) => ({ name, Commission }))
      .sort((a, b) => b.Commission - a.Commission)
      .slice(0, 5)
  }, [completedBookings, period, revenueData])

  /* ── Earnings breakdown ──────────────────────────────────────────────────── */
  const earnings = useMemo(() => {
    if (!stats) return null
    const total = stats.total_revenue || 0
    const comm  = stats.total_commission || 0
    const fees  = stats.total_booking_fees || 0
    return {
      total, commission: comm, fees,
      commPct: total > 0 ? (comm / total) * 100 : 0,
      feesPct: total > 0 ? (fees / total) * 100 : 0,
    }
  }, [stats])

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? 'Daily'

  return (
    <div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Platform-wide financial overview and commission tracking.
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 h-[120px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            accent="#4F6BF6"
            sub="Commissions + booking fees"
          />
          <StatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats?.total_bookings}
            accent="#10B981"
            sub={`${stats?.completed_bookings || 0} completed`}
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.total_users}
            accent="#F59E0B"
            sub={`${stats?.total_customers || 0} customers · ${stats?.total_partners || 0} partners`}
          />
          <StatCard
            icon={Car}
            label="Listed Cars"
            value={stats?.total_cars}
            accent="#6366F1"
            sub="Available on platform"
          />
        </div>
      )}

      {/* ── Period toggle ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Analytics Overview</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Showing {periodLabel.toLowerCase()} data across all charts
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* ── Charts Row 1: Bookings Overview + Booking Status ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Bookings Overview — Bar Chart (2 cols) */}
        <Panel className="p-6 lg:col-span-2">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bookings Overview</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Total bookings · {periodLabel}</p>
          </div>
          <div className="h-60">
            {bookingsChartData.length === 0
              ? <Empty message="No bookings for this period" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingsChartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradBook" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F6BF6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#4F6BF6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
                    <XAxis
                      dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: c.text }} dy={8}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: c.text }}
                      width={30}
                    />
                    <Tooltip
                      formatter={v => [v, 'Bookings']}
                      contentStyle={c.tip}
                      cursor={{ fill: c.cursor }}
                    />
                    <Bar
                      dataKey="Bookings" fill="url(#gradBook)"
                      radius={[4, 4, 0, 0]} maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </Panel>

        {/* Booking Status — Donut (1 col) */}
        <Panel className="p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Booking Status</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Distribution · {periodLabel}</p>
          </div>
          <div className="h-60">
            {statusData.length === 0
              ? <Empty message="No bookings for this period" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData} cx="50%" cy="43%"
                      innerRadius={50} outerRadius={72}
                      paddingAngle={3} dataKey="value" strokeWidth={0}
                    >
                      {statusData.map((e, i) => (
                        <Cell key={i} fill={e.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={c.tip} />
                    <Legend
                      verticalAlign="bottom" height={30}
                      iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: '11px', color: c.text }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </Panel>
      </div>

      {/* ── Revenue Growth — Full Width Area Chart ─────────────────────────── */}
      <Panel className="p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-5 gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue Growth</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(totalRevenue)}
              </span>
              {completedBookings.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {completedBookings.length} completed
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="h-72">
          {revenueData.length === 0
            ? <Empty message="No completed bookings yet to calculate revenue" />
            : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F6BF6" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#4F6BF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
                  <XAxis
                    dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fontSize: 11, fill: c.text }} dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 11, fill: c.text }}
                    tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip
                    formatter={v => [`₱${v.toLocaleString()}`, 'Revenue']}
                    contentStyle={c.tip}
                    cursor={{ stroke: '#4F6BF6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone" dataKey="Revenue"
                    stroke="#4F6BF6" strokeWidth={2.5}
                    fill="url(#gradRev)" fillOpacity={1} dot={false}
                    activeDot={{ r: 5, fill: '#4F6BF6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </Panel>

      {/* ── Row 2: Top Partners (compact) + Earnings Breakdown ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Top Performing Partners */}
        <Panel className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Performing Partners</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By commission · {periodLabel}</p>
            </div>
            <Link
              to="/admin/partners"
              className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="h-60">
            {topPartnersData.length === 0
              ? <Empty message="No completed bookings for this period" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPartnersData} layout="vertical" margin={{ top: 0, right: 10, left: 6, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke={c.grid} strokeDasharray="0" />
                    <XAxis
                      type="number" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: c.text }}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="name" type="category"
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: c.text }} width={90}
                    />
                    <Tooltip
                      formatter={v => [`₱${v.toLocaleString()}`, 'Commission']}
                      contentStyle={c.tip} cursor={{ fill: c.cursor }}
                    />
                    <Bar
                      dataKey="Commission" fill="#4F6BF6"
                      radius={[0, 6, 6, 0]} maxBarSize={20}
                      background={{
                        fill  : c.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
                        radius: [0, 6, 6, 0],
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </Panel>

        {/* Earnings Breakdown */}
        <Panel className="p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Earnings Breakdown</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Platform revenue composition</p>
          </div>
          {earnings ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    Platform Commission
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(earnings.commission)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-700"
                    style={{ width: `${Math.min(earnings.commPct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{earnings.commPct.toFixed(1)}% of total</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Booking Fees
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(earnings.fees)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(earnings.feesPct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{earnings.feesPct.toFixed(1)}% of total</p>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(earnings.total)}</span>
              </div>
            </div>
          ) : (
            <Empty message="No revenue data" />
          )}
        </Panel>
      </div>

      {/* ── Quick Stats + Quick Actions Row ────────────────────────────────── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Quick Stats */}
          <Panel className="p-6 lg:col-span-2">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Platform Health</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Key metrics requiring attention</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pending Partners',  value: stats.pending_partners,  color: '#F59E0B', to: '/admin/partners' },
                { label: 'Active Partners',   value: stats.active_partners,   color: '#10B981' },
                { label: 'Pending KYC',       value: stats.kyc_pending || stats.pending_kyc || 0, color: '#6366F1', to: '/admin/kyc' },
                { label: 'Pending Bookings',  value: stats.pending_bookings,  color: '#0EA5E9', to: '/admin/bookings' },
              ].map(item => (
                <Link
                  key={item.label}
                  to={item.to || '#'}
                  className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800
                             hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.label}</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value ?? 0}</p>
                </Link>
              ))}
            </div>
          </Panel>

          {/* Quick Actions */}
          <Panel className="p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Actions</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Go to common tasks</p>
            </div>
            <div className="space-y-2">
              <QuickAction icon={UserCheck}     label="Review Partners"  to="/admin/partners"    accent="#F59E0B" />
              <QuickAction icon={Shield}        label="Verify KYC"      to="/admin/kyc"         accent="#6366F1" />
              <QuickAction icon={CreditCard}    label="Process Refunds" to="/admin/refunds"     accent="#EF4444" />
              <QuickAction icon={Wallet}        label="Settlements"     to="/admin/settlements" accent="#10B981" />
              <QuickAction icon={BarChart3}     label="View Reports"    to="/admin/reports"     accent="#4F6BF6" />
            </div>
          </Panel>
        </div>
      )}

      {/* ── Activity Panels: Pending Partners + Recent Bookings ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending Partners */}
        <Panel className="overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pending Applications</p>
              {partnerList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {partnerList.length}
                </span>
              )}
            </div>
            <Link to="/admin/partners" className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
              View all
            </Link>
          </div>

          {partnerList.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle2 size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No pending applications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {partnerList.slice(0, 5).map(partner => (
                <div
                  key={partner.id}
                  className="px-6 py-4 flex items-center justify-between gap-4
                             hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {(partner.business_name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{partner.business_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {partner.partner_type} · {partner.user?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/admin/partners"
                    className="shrink-0 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30
                               text-brand-600 dark:text-brand-400 text-xs font-semibold rounded-lg
                               hover:bg-brand-100 dark:hover:bg-brand-900/50 transition
                               border border-brand-100 dark:border-brand-800"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent Bookings */}
        <Panel className="overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Bookings</p>
              {bookingList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {stats?.total_bookings || allBookings.length}
                </span>
              )}
            </div>
            <Link to="/admin/bookings" className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
              View all
            </Link>
          </div>

          {bookingList.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarCheck size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No bookings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {bookingList.map(booking => (
                <div
                  key={booking.id}
                  className="px-6 py-4 flex items-center justify-between gap-4
                             hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
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
        </Panel>
      </div>
    </div>
  )
}
