import { Link } from 'react-router-dom'
import {
  Users, Car, CalendarCheck, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { useAdminStats, useAdminPartners } from '@/hooks/useAdmin'
import { useAdminAllBookings } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { format } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex gap-4 items-center">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active:         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  rejected:       'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  cancelled:      'bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-400',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                      ${STATUS_STYLES[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

export default function AdminHomePage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingPartners } = useAdminPartners('pending')
  const { data: recentBookings } = useAdminAllBookings({})

  const partnerList = pendingPartners?.results || pendingPartners || []
  const allBookings = recentBookings?.results || recentBookings || []
  const bookingList = allBookings.slice(0, 6)

  // 1. Process platform revenue by month
  const revenueByMonth = allBookings
    .filter(b => b.booking_status === 'completed')
    .reduce((acc, b) => {
      if (!b.end_date) return acc
      const month = format(new Date(b.end_date), 'MMM yyyy')
      const rev = Number(b.commission_amount) || 0
      acc[month] = (acc[month] || 0) + rev
      return acc
    }, {})

  const revenueData = Object.keys(revenueByMonth)
    .sort((a,b) => new Date(a) - new Date(b))
    .map(m => ({ name: m, Revenue: revenueByMonth[m] }))

  // 2. Process partner distribution for PieChart
  const partnerDistributionData = stats ? [
    { name: 'Active',  value: stats.active_partners,  color: '#10B981' },
    { name: 'Pending', value: stats.pending_partners, color: '#F59E0B' },
  ].filter(d => d.value > 0) : []

  // 3. Process top grossing partners
  const partnerEarningsMap = allBookings
    .filter(b => b.booking_status === 'completed')
    .reduce((acc, b) => {
      const name = b.partner_name || 'Unknown Partner'
      const rev = Number(b.commission_amount) || 0
      acc[name] = (acc[name] || 0) + rev
      return acc
    }, {})

  const topPartnersData = Object.entries(partnerEarningsMap)
    .map(([name, rev]) => ({ name, Commission: rev }))
    .sort((a, b) => b.Commission - a.Commission)
    .slice(0, 5)

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview at a glance.</p>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.total_users}
            color="bg-blue-500"
          />
          <StatCard
            icon={Car}
            label="Listed Cars"
            value={stats?.total_cars}
            color="bg-violet-500"
          />
          <StatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats?.total_bookings}
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={stats?.total_revenue != null ? formatCurrency(stats.total_revenue) : '—'}
            color="bg-orange-500"
            sub="Platform commissions"
          />
        </div>
      )}

      {/* Secondary stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock}          label="Pending Partners"  value={stats.pending_partners}  color="bg-amber-400" />
          <StatCard icon={CheckCircle2}   label="Active Partners"   value={stats.active_partners}   color="bg-teal-500"  />
          <StatCard icon={AlertCircle}    label="Pending Bookings"  value={stats.pending_bookings}  color="bg-sky-500"   />
          <StatCard icon={XCircle}        label="Active Bookings"   value={stats.active_bookings}   color="bg-indigo-500"/>
        </div>
      )}

      {/* Charts Row */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue Area Chart (Spans 2 cols) */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:col-span-2">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-6">Platform Revenue Trend</h2>
            <div className="h-64 w-full">
              {revenueData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No completed bookings yet to calculate revenue.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="#F97316" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Partner Distribution Pie Chart (Spans 1 col) */}
          <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-6">Partner Distribution</h2>
            <div className="h-64 w-full">
              {partnerDistributionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No partners found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {partnerDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Grossing Partners */}
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-2">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-6">Top Grossing Partners</h2>
        <div className="h-64 w-full">
          {topPartnersData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Not enough data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPartnersData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Commissions Generated']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Commission" fill="#F59E0B" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Partners */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Pending Partner Applications</h2>
            <Link to="/admin/partners"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {partnerList.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No pending applications 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partnerList.slice(0, 5).map(partner => (
                <div key={partner.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {partner.business_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {partner.partner_type} · {partner.user?.email}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Recent Bookings</h2>
            <Link to="/admin/bookings"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {bookingList.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookingList.map(booking => (
                <div key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {booking.car_name}
                      </p>
                      <StatusBadge status={booking.booking_status} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {booking.customer_name} · {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
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
