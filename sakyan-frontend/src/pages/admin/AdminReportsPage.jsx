import { useAdminStats } from '@/hooks/useAdmin'
import { formatCurrency } from '@/utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  AreaChart, Area,
} from 'recharts'
import { Users, CalendarCheck, DollarSign, Building2 } from 'lucide-react'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND   = '#6366f1'
const EMERALD = '#10b981'
const AMBER   = '#f59e0b'
const RED     = '#ef4444'
const BLUE    = '#3b82f6'
const PURPLE  = '#8b5cf6'

const TT = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
  fontSize: '12px',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// ChartCard owns height so ResponsiveContainer always gets a positive px value
function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      {title && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</p>}
      <div style={{ width: '100%', height: 224 }}>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 dark:border-gray-800 my-8" />
}

function RC({ children }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const { data: stats, isLoading, isError } = useAdminStats()

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              ))}
            </div>
            <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
        <p className="text-red-500 dark:text-red-400 font-medium">Failed to load reports data.</p>
        <button onClick={() => window.location.reload()} className="text-brand-600 dark:text-brand-400 hover:underline text-sm">
          Try again
        </button>
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const totalRevenue     = Number(stats.total_revenue     || 0)
  const totalCommission  = Number(stats.total_commission  || 0)
  const totalBookingFees = Number(stats.total_booking_fees|| 0)

  const revenueBreakdown = [
    { name: 'Commission',   value: totalCommission  },
    { name: 'Booking Fees', value: totalBookingFees },
    { name: 'Other',        value: Math.max(0, totalRevenue - totalCommission - totalBookingFees) },
  ].filter(d => d.value > 0)

  const bookingByStatus = [
    { name: 'Pending',   value: stats.pending_bookings   || 0, fill: AMBER   },
    { name: 'Active',    value: stats.active_bookings    || 0, fill: EMERALD  },
    { name: 'Completed', value: stats.completed_bookings || 0, fill: BLUE    },
    { name: 'Cancelled', value: stats.cancelled_bookings || 0, fill: RED     },
    { name: 'Rejected',  value: stats.rejected_bookings  || 0, fill: '#6b7280' },
  ].filter(d => d.value > 0)

  const partnerByStatus = [
    { name: 'Approved',  value: stats.active_partners    || 0, fill: EMERALD  },
    { name: 'Pending',   value: stats.pending_partners   || 0, fill: AMBER   },
    { name: 'Rejected',  value: stats.rejected_partners  || 0, fill: RED     },
    { name: 'Suspended', value: stats.suspended_partners || 0, fill: '#6b7280' },
  ].filter(d => d.value > 0)

  const usersByRole = [
    { name: 'Customers', value: stats.total_customers || 0, fill: BLUE   },
    { name: 'Partners',  value: stats.total_partners  || 0, fill: PURPLE },
    { name: 'Admins',    value: stats.total_admins    || 0, fill: BRAND  },
  ].filter(d => d.value > 0)

  const kycData = [
    { name: 'Approved', value: stats.kyc_approved || 0, fill: EMERALD },
    { name: 'Pending',  value: stats.kyc_pending  || 0, fill: AMBER   },
    { name: 'Rejected', value: stats.kyc_rejected || 0, fill: RED     },
  ].filter(d => d.value > 0)

  const monthlyTrend = stats.monthly_revenue || stats.monthly_bookings || []

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analytics and performance overview of Sakyan</p>
      </div>

      {/* ── Section 1: Revenue & Finance ─────────────────────────────────────── */}
      <SectionHeader icon={DollarSign} color="bg-emerald-500" title="Revenue & Finance" subtitle="Platform income from commissions and booking fees" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Revenue"    value={formatCurrency(totalRevenue)}     color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Total Commission" value={formatCurrency(totalCommission)}  color="text-brand-600 dark:text-brand-400" />
        <StatCard label="Booking Fees"     value={formatCurrency(totalBookingFees)} color="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Revenue charts — full width when only one chart available */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
        {/* Donut — only if there is actual revenue data */}
        {revenueBreakdown.length > 0 && (
          <ChartCard title="Revenue Breakdown">
            <RC>
              <PieChart>
                <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value">
                  {revenueBreakdown.map((_, i) => <Cell key={i} fill={[EMERALD, AMBER, BLUE][i % 3]} />)}
                </Pie>
                <RTooltip formatter={v => formatCurrency(v)} contentStyle={TT} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </RC>
          </ChartCard>
        )}

        {/* Monthly trend OR fallback bar — spans full width when no donut */}
        <div className={revenueBreakdown.length === 0 ? 'lg:col-span-2' : ''}>
          {monthlyTrend.length > 0 ? (
            <ChartCard title="Monthly Revenue Trend">
              <RC>
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={EMERALD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EMERALD} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `₱${v >= 1000 ? `${Math.round(v/1000)}k` : v}`} />
                  <RTooltip formatter={v => formatCurrency(v)} contentStyle={TT} />
                  <Area type="monotone" dataKey="revenue" stroke={EMERALD} strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: EMERALD }} />
                </AreaChart>
              </RC>
            </ChartCard>
          ) : (
            <ChartCard title="Revenue Summary">
              <RC>
                <BarChart
                  data={[
                    { name: 'Commission',   value: totalCommission,  fill: EMERALD },
                    { name: 'Booking Fees', value: totalBookingFees, fill: AMBER   },
                    { name: 'Other',        value: Math.max(0, totalRevenue - totalCommission - totalBookingFees), fill: BLUE },
                  ]}
                  margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `₱${v >= 1000 ? `${Math.round(v/1000)}k` : v}`} />
                  <RTooltip formatter={v => formatCurrency(v)} contentStyle={TT} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={56}>
                    {[EMERALD, AMBER, BLUE].map((fill, i) => <Cell key={i} fill={fill} />)}
                  </Bar>
                </BarChart>
              </RC>
            </ChartCard>
          )}
        </div>
      </div>

      <Divider />

      {/* ── Section 2: Bookings ───────────────────────────────────────────────── */}
      <SectionHeader icon={CalendarCheck} color="bg-blue-500" title="Bookings" subtitle="Rental booking volume and status breakdown" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Bookings"  value={stats.total_bookings    || 0} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Active Now"      value={stats.active_bookings   || 0} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Pending"         value={stats.pending_bookings  || 0} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Completed"       value={stats.completed_bookings|| 0} color="text-gray-700 dark:text-gray-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
        <ChartCard title="Bookings by Status">
          <RC>
            <BarChart data={bookingByStatus} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <RTooltip contentStyle={TT} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {bookingByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </RC>
        </ChartCard>

        <ChartCard title="Booking Status Share">
          <RC>
            <PieChart>
              <Pie data={bookingByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                {bookingByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <RTooltip contentStyle={TT} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </RC>
        </ChartCard>
      </div>

      <Divider />

      {/* ── Section 3: Partners & Fleet ───────────────────────────────────────── */}
      <SectionHeader icon={Building2} color="bg-purple-500" title="Partners & Fleet" subtitle="Partner onboarding status and vehicle listings" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Partners"  value={(stats.active_partners || 0) + (stats.pending_partners || 0)} color="text-purple-600 dark:text-purple-400" />
        <StatCard label="Approved"        value={stats.active_partners  || 0} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Pending Review"  value={stats.pending_partners || 0} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Cars Listed"     value={stats.total_cars       || 0} color="text-blue-600 dark:text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
        <ChartCard title="Partner Status Distribution">
          <RC>
            <PieChart>
              <Pie data={partnerByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                {partnerByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <RTooltip contentStyle={TT} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </RC>
        </ChartCard>

        <ChartCard title="Partner Approval Funnel">
          <RC>
            <BarChart data={partnerByStatus} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} width={70} />
              <RTooltip contentStyle={TT} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                {partnerByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </RC>
        </ChartCard>
      </div>

      <Divider />

      {/* ── Section 4: Users & KYC ────────────────────────────────────────────── */}
      <SectionHeader icon={Users} color="bg-indigo-500" title="Users & KYC" subtitle="Registered users and identity verification status" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Users"  value={stats.total_users   || 0} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard label="KYC Approved" value={stats.kyc_approved  || 0} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="KYC Pending"  value={stats.kyc_pending   || 0} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="KYC Rejected" value={stats.kyc_rejected  || 0} color="text-red-500 dark:text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Users by Role">
          <RC>
            <BarChart data={usersByRole} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <RTooltip contentStyle={TT} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                {usersByRole.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </RC>
        </ChartCard>

        <ChartCard title="KYC Verification Status">
          {kycData.length > 0 ? (
            <RC>
              <PieChart>
                <Pie data={kycData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                  {kycData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <RTooltip contentStyle={TT} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </RC>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
              No KYC data yet
            </div>
          )}
        </ChartCard>
      </div>

    </div>
  )
}
