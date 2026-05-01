import { useMyPartnerCars } from '@/hooks/useCars'
import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { Car, CalendarCheck, DollarSign, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function PartnerHomePage() {
  const { user } = useAuthStore()
  const { data: carsData } = useMyPartnerCars()
  const { data: bookingsData } = usePartnerBookings()

  const cars     = carsData?.results     || carsData     || []
  const bookings = bookingsData?.results || bookingsData || []

  const pendingBookings   = bookings.filter(b => b.booking_status === 'pending_review')
  const activeBookings    = bookings.filter(b => b.booking_status === 'active')
  const completedBookings = bookings.filter(b => b.booking_status === 'completed')
  const totalEarnings     = completedBookings.reduce((sum, b) =>
    sum + (Number(b.total_amount) - Number(b.commission_amount || 0)), 0)

  // 1. Process earnings by month for AreaChart
  const earningsByMonth = completedBookings.reduce((acc, b) => {
    // b.end_date is usually "YYYY-MM-DD"
    const month = format(new Date(b.end_date), 'MMM yyyy')
    const rev = (Number(b.total_amount) || 0) - (Number(b.commission_amount) || 0)
    acc[month] = (acc[month] || 0) + rev
    return acc
  }, {})

  const earningsData = Object.keys(earningsByMonth)
    .sort((a,b) => new Date(a) - new Date(b))
    .map(m => ({ name: m, Earnings: earningsByMonth[m] }))

  // 2. Process bookings by status for PieChart
  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.booking_status] = (acc[b.booking_status] || 0) + 1
    return acc
  }, {})

  const STATUS_COLORS = {
    pending_review: '#F59E0B', // amber-500
    approved:       '#3B82F6', // blue-500
    active:         '#10B981', // emerald-500
    completed:      '#6B7280', // gray-500
    rejected:       '#EF4444', // red-500
    cancelled:      '#F87171', // red-400
  }

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: statusCounts[key],
    color: STATUS_COLORS[key] || '#9CA3AF'
  }))

  // 3. Process Top Performing Cars
  const carEarningsMap = completedBookings.reduce((acc, b) => {
    const name = b.car_name || 'Unknown Car'
    const rev = (Number(b.total_amount) || 0) - (Number(b.commission_amount) || 0)
    acc[name] = (acc[name] || 0) + rev
    return acc
  }, {})

  const topCarsData = Object.entries(carEarningsMap)
    .map(([name, rev]) => ({ name, Earnings: rev }))
    .sort((a, b) => b.Earnings - a.Earnings)
    .slice(0, 5)

  // 4. Fleet Utilization Rate
  const uniqueActiveCarsCount = new Set(activeBookings.map(b => b.car)).size
  const fleetUtilization = cars.length > 0 ? Math.round((uniqueActiveCarsCount / cars.length) * 100) : 0

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your fleet today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Car}          label="Listed Cars"       value={cars.length}             color="bg-blue-500" />
        <StatCard icon={Clock}        label="Pending Reviews"   value={pendingBookings.length}  color="bg-amber-500" />
        <StatCard icon={CalendarCheck} label="Active Bookings"  value={activeBookings.length}   color="bg-green-500" />
        <StatCard icon={Car}          label="Utilization Rate"  value={`${fleetUtilization}%`}  color="bg-indigo-500" />
        <StatCard icon={DollarSign}   label="Total Earnings"    value={formatCurrency(totalEarnings)} color="bg-purple-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Earnings Area Chart (Spans 2 cols) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-6">Earnings Trend</h2>
          <div className="h-64 w-full">
            {earningsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No completed bookings yet to show earnings.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
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
                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Earnings']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Earnings" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Booking Status Pie Chart (Spans 1 col) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-6">Booking Statuses</h2>
          <div className="h-64 w-full">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No bookings.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Cars (Horizontal BarChart) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-6">Top Performing Cars</h2>
          <div className="h-64 w-full">
            {topCarsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Not enough data. Complete bookings to see stats!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCarsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip 
                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Earnings']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Earnings" fill="#8B5CF6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent pending bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Pending Bookings</h2>
          <Link to="/dashboard/bookings" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No pending bookings</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{booking.car_name}</p>
                  <p className="text-sm text-gray-500">{booking.customer_name} · #{booking.booking_code}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {booking.start_date} → {booking.end_date}
                  </p>
                </div>
                <Link
                  to="/dashboard/bookings"
                  className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs
                             font-semibold rounded-lg hover:bg-blue-100 transition"
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