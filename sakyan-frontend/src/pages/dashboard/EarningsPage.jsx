import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { DollarSign, TrendingUp, CalendarCheck, Percent } from 'lucide-react'

function EarningStatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function EarningsPage() {
  const { data } = usePartnerBookings({ booking_status: 'completed' })
  const bookings = data?.results || data || []

  const grossTotal    = bookings.reduce((s, b) => s + parseFloat(b.total_amount), 0)
  const commissionTotal = bookings.reduce((s, b) => s + parseFloat(b.commission_amount), 0)
  const netTotal      = grossTotal - commissionTotal
  const avgPerBooking = bookings.length > 0 ? netTotal / bookings.length : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your completed bookings and revenue breakdown.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <EarningStatCard icon={DollarSign}    label="Net Earnings"      value={formatCurrency(netTotal)}       color="bg-green-500" />
        <EarningStatCard icon={TrendingUp}    label="Gross Revenue"     value={formatCurrency(grossTotal)}     color="bg-blue-500" />
        <EarningStatCard icon={Percent}       label="Platform Commission" value={formatCurrency(commissionTotal)} color="bg-amber-500" />
        <EarningStatCard icon={CalendarCheck} label="Completed Bookings" value={bookings.length}               color="bg-purple-500" />
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Transaction History</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No completed bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Booking', 'Customer', 'Car', 'Dates', 'Gross', 'Commission', 'Net'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{b.booking_code}</td>
                    <td className="px-4 py-3 text-gray-700">{b.customer_name}</td>
                    <td className="px-4 py-3 text-gray-700">{b.car_name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(b.start_date)} – {formatDate(b.end_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{formatCurrency(b.total_amount)}</td>
                    <td className="px-4 py-3 text-red-500">-{formatCurrency(b.commission_amount)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      {formatCurrency(b.total_amount - b.commission_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}