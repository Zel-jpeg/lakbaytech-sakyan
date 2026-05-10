import { useMyPartnerCars } from '@/hooks/useCars'
import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { Car, CalendarCheck, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line,
} from 'recharts'
import { useUIStore } from '@/store/uiStore'

// ─── Tiny sparkline (no axes, no grid) ──────────────────────────────────────
function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          strokeLinecap="round"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, sparkColor, sparkData, trend }) {
  const hasSpark   = sparkData && sparkData.length > 1
  const isPositive = trend === undefined || trend >= 0

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md dark:hover:shadow-dark-card transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value + label */}
      <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight leading-none">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{label}</p>

      {/* Sparkline */}
      {hasSpark && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}
    </div>
  )
}

// ─── Shared tooltip style builder ────────────────────────────────────────────
function useChartTheme(theme) {
  const isDark       = theme === 'dark'
  const textColor    = isDark ? '#6B7280' : '#9CA3AF'
  const gridColor    = isDark ? '#1F2937' : '#F3F4F6'
  const tooltipStyle = {
    borderRadius  : '12px',
    border        : `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
    boxShadow     : '0 10px 25px -5px rgb(0 0 0 / 0.12)',
    backgroundColor: isDark ? '#111827' : '#ffffff',
    color          : isDark ? '#F9FAFB' : '#111827',
    fontSize       : '12px',
    padding        : '10px 14px',
  }
  const cursorFill = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  return { isDark, textColor, gridColor, tooltipStyle, cursorFill }
}

// ─── Section header ──────────────────────────────────────────────────────────
function ChartHeader({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PartnerHomePage() {
  const { user }                 = useAuthStore()
  const { data: carsData }       = useMyPartnerCars()
  const { data: bookingsData }   = usePartnerBookings()
  const { theme }                = useUIStore()
  const chart                    = useChartTheme(theme)

  const cars     = carsData?.results     || carsData     || []
  const bookings = bookingsData?.results || bookingsData || []

  const pendingBookings   = bookings.filter(b => b.booking_status === 'pending_review')
  const activeBookings    = bookings.filter(b => b.booking_status === 'active')
  const completedBookings = bookings.filter(b => b.booking_status === 'completed')

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + (Number(b.total_amount) - Number(b.commission_amount || 0)), 0
  )

  // ── Monthly earnings for AreaChart + earnings sparkline ──────────────────
  const earningsByMonth = completedBookings.reduce((acc, b) => {
    const month = format(new Date(b.end_date), 'MMM yy')
    const rev   = (Number(b.total_amount) || 0) - (Number(b.commission_amount) || 0)
    acc[month]  = (acc[month] || 0) + rev
    return acc
  }, {})

  const earningsData = Object.keys(earningsByMonth)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(m => ({ name: m, Earnings: earningsByMonth[m] }))

  const earningsSparkData = earningsData.slice(-6).map(d => ({ name: d.name, value: d.Earnings }))

  // ── Monthly booking count for sparklines on booking cards ────────────────
  const bookingsByMonth = bookings.reduce((acc, b) => {
    const key  = format(new Date(b.created_at || b.start_date), 'MMM yy')
    acc[key]   = (acc[key] || 0) + 1
    return acc
  }, {})

  const bookingsSparkData = Object.keys(bookingsByMonth)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(-6)
    .map(m => ({ name: m, value: bookingsByMonth[m] }))

  // ── Pie chart data ───────────────────────────────────────────────────────
  const STATUS_COLORS = {
    pending_review: '#F59E0B',
    approved      : '#3B82F6',
    active        : '#10B981',
    completed     : '#6B7280',
    rejected      : '#EF4444',
    cancelled     : '#F87171',
  }

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.booking_status] = (acc[b.booking_status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.keys(statusCounts).map(key => ({
    name : key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: statusCounts[key],
    color: STATUS_COLORS[key] || '#9CA3AF',
  }))

  // ── Top performing cars bar chart ────────────────────────────────────────
  const carEarningsMap = completedBookings.reduce((acc, b) => {
    const name = b.car_name || 'Unknown'
    const rev  = (Number(b.total_amount) || 0) - (Number(b.commission_amount) || 0)
    acc[name]  = (acc[name] || 0) + rev
    return acc
  }, {})

  const topCarsData = Object.entries(carEarningsMap)
    .map(([name, rev]) => ({ name, Earnings: rev }))
    .sort((a, b) => b.Earnings - a.Earnings)
    .slice(0, 5)

  // ── Fleet utilization ────────────────────────────────────────────────────
  const uniqueActiveCars  = new Set(activeBookings.map(b => b.car)).size
  const fleetUtilization  = cars.length > 0 ? Math.round((uniqueActiveCars / cars.length) * 100) : 0

  const cardCls = 'bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800'

  return (
    <div>
      {/* ── Welcome ─────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Here's what's happening with your fleet today.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        <StatCard
          icon={Car}
          label="Listed Cars"
          value={cars.length}
          iconBg="bg-brand-500"
          sparkColor="#4F6BF6"
          sparkData={null}
        />
        <StatCard
          icon={Clock}
          label="Pending Reviews"
          value={pendingBookings.length}
          iconBg="bg-amber-500"
          sparkColor="#F59E0B"
          sparkData={bookingsSparkData}
        />
        <StatCard
          icon={CalendarCheck}
          label="Active Bookings"
          value={activeBookings.length}
          iconBg="bg-green-500"
          sparkColor="#10B981"
          sparkData={bookingsSparkData}
        />
        <StatCard
          icon={Car}
          label="Utilization Rate"
          value={`${fleetUtilization}%`}
          iconBg="bg-indigo-500"
          sparkColor="#6366F1"
          sparkData={null}
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          iconBg="bg-brand-500"
          sparkColor="#4F6BF6"
          sparkData={earningsSparkData}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Area chart — 2 cols */}
        <div className={`${cardCls} p-6 lg:col-span-2`}>
          <ChartHeader title="Earnings Trend" sub="Net earnings per month" />
          <div className="h-60">
            {earningsData.length === 0
              ? <EmptyChart message="No completed bookings yet" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData} margin={{ top: 5, right: 10, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#4F6BF6" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#4F6BF6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="0"
                      vertical={false}
                      stroke={chart.gridColor}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chart.textColor }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chart.textColor }}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                      width={44}
                    />
                    <Tooltip
                      formatter={v => [`₱${v.toLocaleString()}`, 'Earnings']}
                      contentStyle={chart.tooltipStyle}
                      cursor={{ stroke: '#4F6BF6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Earnings"
                      stroke="#4F6BF6"
                      strokeWidth={2.5}
                      fill="url(#earningsGrad)"
                      fillOpacity={1}
                      dot={false}
                      activeDot={{ r: 4, fill: '#4F6BF6', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Donut pie chart — 1 col */}
        <div className={`${cardCls} p-6`}>
          <ChartHeader title="Booking Statuses" sub="Distribution by status" />
          <div className="h-60">
            {statusData.length === 0
              ? <EmptyChart message="No bookings yet" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="44%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chart.tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      height={30}
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: '11px', color: chart.textColor }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Horizontal bar chart */}
        <div className={`${cardCls} p-6`}>
          <ChartHeader title="Top Performing Cars" sub="By net earnings" />
          <div className="h-60">
            {topCarsData.length === 0
              ? <EmptyChart message="Complete bookings to see stats" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCarsData}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="0"
                      horizontal={false}
                      vertical={true}
                      stroke={chart.gridColor}
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chart.textColor }}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chart.textColor }}
                      width={88}
                    />
                    <Tooltip
                      formatter={v => [`₱${v.toLocaleString()}`, 'Earnings']}
                      contentStyle={chart.tooltipStyle}
                      cursor={{ fill: chart.cursorFill }}
                    />
                    <Bar
                      dataKey="Earnings"
                      fill="#4F6BF6"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={20}
                      background={{
                        fill  : chart.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
                        radius: [0, 6, 6, 0],
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Pending bookings list */}
        <div className={`${cardCls} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pending Bookings</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {pendingBookings.length} awaiting review
              </p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarCheck size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No pending bookings</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {pendingBookings.slice(0, 5).map(booking => (
                <div
                  key={booking.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {booking.car_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {booking.customer_name} · #{booking.booking_code}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      {booking.start_date} → {booking.end_date}
                    </p>
                  </div>
                  <Link
                    to="/dashboard/bookings"
                    className="shrink-0 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400
                               text-xs font-semibold rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50
                               transition border border-brand-100 dark:border-brand-800"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}