import { useAdminStats } from '@/hooks/useAdmin'
import Spinner from '@/components/ui/Spinner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { formatCurrency } from '@/utils/formatters'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminReportsPage() {
  const { data: stats, isLoading, isError } = useAdminStats()

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500">
        <p className="text-red-500 font-medium mb-2">Failed to load reports data.</p>
        <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  // Derived data for charts
  const partnerData = [
    { name: 'Active', value: stats.active_partners },
    { name: 'Pending', value: stats.pending_partners },
  ]
  
  const bookingData = [
    { name: 'Active', value: stats.active_bookings },
    { name: 'Pending', value: stats.pending_bookings },
    { name: 'Other', value: stats.total_bookings - stats.active_bookings - stats.pending_bookings },
  ].filter(d => d.value > 0)

  // Pseudo-bar chart data combining all main entities
  const overviewData = [
    { name: 'Users', count: stats.total_users },
    { name: 'Partners', count: stats.total_partners || (stats.active_partners + stats.pending_partners) },
    { name: 'Cars', count: stats.total_cars },
    { name: 'Bookings', count: stats.total_bookings },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Analytics and health overview of Sakyan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1d2e] p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {formatCurrency(stats.total_revenue || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1a1d2e] p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.total_users}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1d2e] p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.total_bookings}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1d2e] p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cars Listed</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.total_cars}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Entity Overview Bar Chart */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Platform Entities Growth</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 13}} />
                <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partners Status Pie Chart */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Partner Status Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={partnerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {partnerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
