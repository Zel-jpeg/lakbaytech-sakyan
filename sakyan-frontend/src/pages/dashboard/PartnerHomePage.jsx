import { useMyPartnerCars } from '@/hooks/useCars'
import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { Car, CalendarCheck, DollarSign, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'

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
    sum + (b.total_amount - b.commission_amount), 0)

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Car}          label="Listed Cars"       value={cars.length}             color="bg-blue-500" />
        <StatCard icon={Clock}        label="Pending Reviews"   value={pendingBookings.length}  color="bg-amber-500" />
        <StatCard icon={CalendarCheck} label="Active Bookings"  value={activeBookings.length}   color="bg-green-500" />
        <StatCard icon={DollarSign}   label="Total Earnings"    value={formatCurrency(totalEarnings)} color="bg-purple-500" />
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
  )
}