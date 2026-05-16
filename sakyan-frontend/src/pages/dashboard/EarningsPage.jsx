import { useState } from 'react'
import { usePartnerBookings } from '@/hooks/useBookings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { DollarSign, TrendingUp, CalendarCheck, Percent, ArrowUpDown, CreditCard, List, X } from 'lucide-react'

// Derive actual commission % from stored amounts (handles historical 10% bookings
// and new 3–5% bookings correctly without hardcoding)
function commissionPct(booking) {
  const sub = parseFloat(booking.subtotal || booking.total_amount || 0)
  const comm = parseFloat(booking.commission_amount || 0)
  if (!sub || !comm) return null
  return Math.round((comm / sub) * 100 * 10) / 10  // one decimal place
}

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

function TransactionModal({ booking, onClose }) {
  if (!booking) return null;
  const totalDeductions = parseFloat(booking.commission_amount || 0) + parseFloat(booking.booking_fee || 0)
  const net = parseFloat(booking.total_amount || 0) - totalDeductions

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1d2e] rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-8">Transaction Details</h3>
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-brand-500 font-mono text-xs">#{booking.booking_code}</span>
            <span className="font-bold text-xl text-gray-900 dark:text-white">{booking.customer_name}</span>
          </div>

          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Car Rented</span>
            <span className="font-bold text-gray-900 dark:text-white">{booking.car_name}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 font-medium">Dates</span>
            <span className="text-gray-900 dark:text-white font-medium">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-t border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 font-medium">Gross Amount</span>
            <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(booking.total_amount)}</span>
          </div>
          
          <div className="space-y-3 pb-3">
            <div className="flex justify-between items-center text-red-500 dark:text-red-400 font-semibold pt-1 border-t border-gray-100 dark:border-gray-800">
              <span>Total Fees</span>
              <span>-{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="pl-4 space-y-2 border-l-2 border-red-100 dark:border-red-900/30">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Platform Commission{commissionPct(booking) !== null ? ` (${commissionPct(booking)}%)` : ''}</span>
                <span>-{formatCurrency(booking.commission_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Booking Fee</span>
                <span>-{formatCurrency(booking.booking_fee || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wide text-xs">Net Earned</span>
            <span className="font-black text-green-600 dark:text-green-500 text-2xl">{formatCurrency(net)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TransactionCard({ booking, onClick }) {
  const totalDeductions = parseFloat(booking.commission_amount || 0) + parseFloat(booking.booking_fee || 0)
  const net = parseFloat(booking.total_amount || 0) - totalDeductions
  
  return (
    <div 
      className="p-5 bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm transition hover:shadow-md dark:hover:shadow-dark-card hover:border-brand-500/30 cursor-pointer group" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4 border-b border-gray-50 dark:border-gray-800/50 pb-4">
        <div>
          <div className="font-bold text-gray-900 dark:text-white text-lg truncate pr-2 group-hover:text-brand-500 transition-colors">{booking.customer_name}</div>
          <div className="text-xs text-brand-500 font-mono mt-1 opacity-80">#{booking.booking_code}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-black text-green-600 dark:text-green-400 text-xl">{formatCurrency(net)}</div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">Net Earned</div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/30 py-1.5 px-3 rounded-lg">
          <span className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Car</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate ml-4">{booking.car_name}</span>
        </div>
        <div className="flex justify-between px-1 text-gray-500 dark:text-gray-400 text-xs">
          <span>Dates</span>
          <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
        </div>
        <div className="flex justify-between px-1 text-gray-500 dark:text-gray-400 text-xs mt-1 border-t border-gray-50 dark:border-gray-800 pt-2">
          <span>Click to view fee breakdown →</span>
        </div>
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const { data } = usePartnerBookings({ booking_status: 'completed' })
  const bookings = data?.results || data || []
  
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' = newest first
  const [viewMode, setViewMode] = useState('list') // 'list' or 'card'
  const [selectedBooking, setSelectedBooking] = useState(null)

  const grossTotal = bookings.reduce((s, b) => s + parseFloat(b.total_amount || 0), 0)
  const validCommission = bookings.reduce((s, b) => s + parseFloat(b.commission_amount || 0), 0)
  const validBookingFee = bookings.reduce((s, b) => s + parseFloat(b.booking_fee || 0), 0)
  const totalDeductions = validCommission + validBookingFee
  const netTotal = grossTotal - totalDeductions

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime()
    const dateB = new Date(b.start_date).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

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
        <EarningStatCard icon={Percent}       label="Platform Fees"     value={formatCurrency(totalDeductions)} color="bg-red-500" />
        <EarningStatCard icon={CalendarCheck} label="Completed Bookings" value={bookings.length}               color="bg-purple-500" />
      </div>

      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Transaction History</h2>
        
        {bookings.length > 0 && (
          <div className="flex items-center gap-3">
            {/* View Toggle (Hidden on mobile) */}
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                title="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md text-sm transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                title="Card View"
              >
                <CreditCard size={18} />
              </button>
            </div>

            <button 
              onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm w-full sm:w-auto justify-center"
            >
              <ArrowUpDown size={16} className="text-gray-400" />
              <span>Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center shadow-sm">
          <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-50" />
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">No completed bookings yet.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your earnings will appear here once bookings are completed.</p>
        </div>
      ) : (
        <>
          {/* Card View Output (default mobile, optional desktop) */}
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
            {sortedBookings.map(b => (
              <TransactionCard key={b.id} booking={b} onClick={() => setSelectedBooking(b)} />
            ))}
          </div>

          {/* List View Output (desktop only) */}
          {viewMode === 'list' && (
            <div className="hidden md:block bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['Booking', 'Customer', 'Car', 'Dates', 'Gross', 'Deductions', 'Net'].map((h, i) => (
                        <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {sortedBookings.map(b => {
                      const totalDeductions = parseFloat(b.commission_amount || 0) + parseFloat(b.booking_fee || 0)
                      const net = parseFloat(b.total_amount || 0) - totalDeductions

                      return (
                        <tr 
                          key={b.id} 
                          onClick={() => setSelectedBooking(b)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-5 font-mono text-xs text-brand-500 dark:text-brand-400 font-medium">#{b.booking_code}</td>
                          <td className="px-6 py-5 font-semibold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{b.customer_name}</td>
                          <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">{b.car_name}</td>
                          <td className="px-6 py-5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(b.start_date)} <span className="opacity-50 mx-1">–</span> {formatDate(b.end_date)}
                          </td>
                          <td className="px-6 py-5 text-right text-gray-900 dark:text-white font-semibold">{formatCurrency(b.total_amount)}</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex flex-col items-end align-middle justify-center h-full">
                              <div className="text-red-500 dark:text-red-400 font-medium pb-1 mb-1 border-b border-gray-100 dark:border-gray-800">
                                -{formatCurrency(totalDeductions)}
                              </div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 flex flex-col items-end leading-tight whitespace-nowrap">
                                <span>Comm{commissionPct(b) !== null ? ` (${commissionPct(b)}%)` : ''}: -{formatCurrency(b.commission_amount || 0)}</span>
                                <span>Booking Fee: -{formatCurrency(b.booking_fee || 0)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-green-600 dark:text-green-500 text-base">
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <TransactionModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
    </div>
  )
}