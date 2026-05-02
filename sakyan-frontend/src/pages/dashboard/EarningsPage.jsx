import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { DollarSign, TrendingUp, CalendarCheck, Percent } from 'lucide-react'

function EarningStatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md dark:hover:shadow-dark-card transition">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your completed bookings and revenue breakdown.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <EarningStatCard icon={DollarSign}    label="Net Earnings"      value={formatCurrency(netTotal)}       color="bg-green-500" />
        <EarningStatCard icon={TrendingUp}    label="Gross Revenue"     value={formatCurrency(grossTotal)}     color="bg-brand-500" />
        <EarningStatCard icon={Percent}       label="Platform Commission" value={formatCurrency(commissionTotal)} color="bg-amber-500" />
        <EarningStatCard icon={CalendarCheck} label="Completed Bookings" value={bookings.length}               color="bg-purple-500" />
      </div>

      {/* Transactions table */}
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Transaction History</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="py-20 text-center">
            <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-50" />
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">No completed bookings yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your earnings will appear here once bookings are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['Booking', 'Customer', 'Car', 'Dates', 'Gross', 'Commission', 'Net'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i > 3 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">#{b.booking_code}</td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{b.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{b.car_name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(b.start_date)} <span className="opacity-50 mx-1">–</span> {formatDate(b.end_date)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-800 dark:text-gray-200">{formatCurrency(b.total_amount)}</td>
                    <td className="px-6 py-4 text-right text-red-500 dark:text-red-400">-{formatCurrency(b.commission_amount)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
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