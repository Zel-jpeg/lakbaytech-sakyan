import { useState, useMemo } from 'react'
import { useMyPartnerCars } from '@/hooks/useCars'
import { usePartnerBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { Car, CalendarCheck, DollarSign, Clock, ArrowUpRight, Zap, Star, Sparkles, X, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { format, startOfWeek, getISOWeek } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line,
} from 'recharts'
import { useUIStore } from '@/store/uiStore'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

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
      return `${format(weekStart, 'MMM d')}`
    }
    case 'monthly': return format(d, 'MMM yy')
    case 'yearly':  return format(d, 'yyyy')
    default:        return format(d, 'MMM yy')
  }
}

function sortPeriodKeys(keys, period) {
  return [...keys].sort((a, b) => {
    // Re-parse for sort
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

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data = [], color }) {
  const pts =
    data.length === 0 ? [{ v: 0 }, { v: 0 }]
    : data.length === 1 ? [{ v: 0 }, { v: data[0].value }]
    : data.map(d => ({ v: d.value }))

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line
          type="monotone" dataKey="v"
          stroke={color} strokeWidth={1.8}
          dot={false} isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sparkColor, sparkData }) {
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
        {value}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
        <ArrowUpRight
          size={13}
          className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
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

// ─── Shared wrappers ──────────────────────────────────────────────────────────
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

// ─── Boost Modal ──────────────────────────────────────────────────────────────
const BOOST_TYPES = [
  { value: 'featured',  label: 'Featured Listing',   desc: 'Your company shown in the Browse Cars carousel banner' },
  { value: 'spotlight', label: 'Spotlight Banner',    desc: 'Premium full-width spotlight at the top of the car catalogue' },
]
const DURATIONS = [1, 3, 6, 12]

function BoostModal({ onClose }) {
  const [boostType, setBoostType]         = useState('featured')
  const [durationMonths, setDuration]     = useState(1)
  const [submitted, setSubmitted]         = useState(false)
  const { user }                          = useAuthStore()
  const partnerName = user?.partner_status !== undefined ? (user?.full_name || 'your company') : 'your company'

  const autoMessage = `Hello Sakyan Admin! I would like to request a "${
    BOOST_TYPES.find(b => b.value === boostType)?.label
  }" for my business. Preferred duration: ${durationMonths} month${durationMonths > 1 ? 's' : ''}. Please let me know the next steps for payment and activation. Thank you!`

  const mutation = useMutation({
    mutationFn: () => api.post('/boosts/request/', { boost_type: boostType, duration_months: durationMonths }),
    onSuccess: () => setSubmitted(true),
    onError:   () => toast.error('Failed to send boost request. Please try again.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Request Sent! 🎉</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Your boost request has been sent to the Sakyan admin. Check your messages for their reply.
            </p>
            <button onClick={onClose} className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Boost Your Listing</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Boost type */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Boost Type</label>
              <div className="space-y-2">
                {BOOST_TYPES.map(bt => (
                  <label key={bt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    boostType === bt.value
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <input type="radio" name="boost_type" value={bt.value} checked={boostType === bt.value}
                      onChange={() => setBoostType(bt.value)} className="mt-0.5 accent-violet-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{bt.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{bt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      durationMonths === d
                        ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    {d === 1 ? '1 Mo' : `${d} Mo`}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto message preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Message that will be sent to admin:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">"{autoMessage}"</p>
            </div>

            {/* Pricing note */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-5 text-xs text-amber-700 dark:text-amber-300">
              💡 Pricing is discussed with the admin after approval. You'll be notified via messages with payment details.
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700
                         text-white text-sm font-semibold rounded-xl transition shadow-md shadow-violet-500/20
                         flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {mutation.isPending ? 'Sending Request…' : 'Send Boost Request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartnerHomePage() {
  const { user }               = useAuthStore()
  const { data: carsData }     = useMyPartnerCars()
  const { data: bookingsData } = usePartnerBookings()
  const { theme }              = useUIStore()
  const c                      = useChartTheme(theme)

  // Default period: monthly
  const [period, setPeriod] = useState('monthly')
  const [showBoostModal, setShowBoostModal] = useState(false)

  // Fetch partner's existing boost request
  const { data: boostData } = useQuery({
    queryKey: ['my-boost-requests'],
    queryFn: () => api.get('/boosts/request/').then(r => r.data),
    staleTime: 60000,
  })
  const boosts = boostData?.results || boostData || []
  const latestBoost = boosts[0]  // most recent
  const hasPendingOrApproved = latestBoost && ['pending', 'approved'].includes(latestBoost.status)
  const isLive = latestBoost?.status === 'paid'

  const cars     = carsData?.results     || carsData     || []
  const bookings = bookingsData?.results || bookingsData || []

  const pending   = bookings.filter(b => b.booking_status === 'pending_review')
  const active    = bookings.filter(b => b.booking_status === 'active')
  const completed = bookings.filter(b => b.booking_status === 'completed')

  const totalEarnings = completed.reduce(
    (s, b) => s + (Number(b.total_amount) - Number(b.commission_amount || 0) - Number(b.booking_fee || 0)), 0
  )

  // ── Dynamic chart data (period-aware) ───────────────────────────────────
  const earningsData = useMemo(() => {
    const map = completed.reduce((acc, b) => {
      const key = getPeriodKey(b.end_date, period)
      acc[key]  = (acc[key] || 0) + (Number(b.total_amount) - Number(b.commission_amount || 0) - Number(b.booking_fee || 0))
      return acc
    }, {})
    return sortPeriodKeys(Object.keys(map), period).map(k => ({ name: k, Earnings: map[k] }))
  }, [completed, period])

  const bookingsChartData = useMemo(() => {
    const map = bookings.reduce((acc, b) => {
      const key = getPeriodKey(b.created_at || b.start_date, period)
      acc[key]  = (acc[key] || 0) + 1
      return acc
    }, {})
    return sortPeriodKeys(Object.keys(map), period).map(k => ({ name: k, Bookings: map[k] }))
  }, [bookings, period])

  // Sparklines use monthly data always (all-time trend)
  const earningsSpark = useMemo(() => {
    const map = completed.reduce((acc, b) => {
      const k  = format(new Date(b.end_date), 'MMM yy')
      acc[k]   = (acc[k] || 0) + (Number(b.total_amount) - Number(b.commission_amount || 0) - Number(b.booking_fee || 0))
      return acc
    }, {})
    return Object.keys(map).sort((a, b) => new Date(a) - new Date(b)).map(k => ({ value: map[k] }))
  }, [completed])

  const bookingsSpark = useMemo(() => {
    const map = bookings.reduce((acc, b) => {
      const k  = format(new Date(b.created_at || b.start_date), 'MMM yy')
      acc[k]   = (acc[k] || 0) + 1
      return acc
    }, {})
    return Object.keys(map).sort((a, b) => new Date(a) - new Date(b)).slice(-6).map(k => ({ value: map[k] }))
  }, [bookings])

  // Pie — period-filtered booking statuses
  const statusData = useMemo(() => {
    const STATUS_COLORS = {
      pending_review: '#F59E0B', approved: '#3B82F6',
      active: '#10B981', completed: '#6B7280',
      rejected: '#EF4444', cancelled: '#F87171',
    }
    const filtered = bookings.filter(b => {
      // For period filtering on the pie we use start_date
      try {
        const key     = getPeriodKey(b.created_at || b.start_date, period)
        const allKeys = bookingsChartData.map(d => d.name)
        return allKeys.includes(key)
      } catch { return true }
    })
    const map = filtered.reduce((acc, b) => {
      acc[b.booking_status] = (acc[b.booking_status] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([k, v]) => ({
      name : k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: v,
      color: STATUS_COLORS[k] || '#9CA3AF',
    }))
  }, [bookings, period, bookingsChartData])

  // Top cars — period-filtered
  const topCarsData = useMemo(() => {
    const map = completed.reduce((acc, b) => {
      const key = getPeriodKey(b.end_date, period)
      // Only include if in current period range
      const inRange = earningsData.some(d => d.name === key)
      if (!inRange) return acc
      const n  = b.car_name || 'Unknown'
      acc[n]   = (acc[n] || 0) + (Number(b.total_amount) - Number(b.commission_amount || 0) - Number(b.booking_fee || 0))
      return acc
    }, {})
    return Object.entries(map)
      .map(([name, Earnings]) => ({ name, Earnings }))
      .sort((a, b) => b.Earnings - a.Earnings)
      .slice(0, 5)
  }, [completed, period, earningsData])

  const utilization = cars.length > 0
    ? Math.round((new Set(active.map(b => b.car)).size / cars.length) * 100)
    : 0

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? 'Monthly'

  return (
    <div>
      {showBoostModal && <BoostModal onClose={() => setShowBoostModal(false)} />}

      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Here's what's happening with your fleet today.
        </p>
      </div>

      {/* ── Boost Banner ──────────────────────────────────────────────────── */}
      {isLive ? (
        <div className="mb-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">🚀 Your boost is Live!</p>
            <p className="text-white/80 text-xs mt-0.5">
              Your {latestBoost?.boost_type === 'featured' ? 'Featured Listing' : 'Spotlight Banner'} is active
              {latestBoost?.end_date && <> until <span className="font-medium">{new Date(latestBoost.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span></>}.
            </p>
          </div>
        </div>
      ) : hasPendingOrApproved ? (
        <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20
                       border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
              Boost Request: <span className="capitalize">{latestBoost.status}</span>
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
              {latestBoost.status === 'pending'
                ? 'Your request is being reviewed by the admin. Check your messages for updates.'
                : 'Your request is approved! Please coordinate payment via messages to activate.'}
            </p>
          </div>
          <Link to="/dashboard/messages" className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition">
            Messages
          </Link>
        </div>
      ) : (
        <div className="mb-5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20
                       border border-violet-100 dark:border-violet-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <Star size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-violet-900 dark:text-violet-200 text-sm">Boost Your Listing</p>
            <p className="text-violet-600 dark:text-violet-400 text-xs mt-0.5">
              Get featured on the Browse Cars page and attract more renters.
            </p>
          </div>
          <button
            onClick={() => setShowBoostModal(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600
                       hover:from-violet-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition
                       shadow-sm shadow-violet-500/20"
          >
            <Zap size={13} /> Get Featured
          </button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Car}           label="Listed Cars"      value={cars.length}                   accent="#4F6BF6" sparkColor="#4F6BF6" sparkData={null}          />
        <StatCard icon={Clock}         label="Pending Reviews"  value={pending.length}                accent="#F59E0B" sparkColor="#F59E0B" sparkData={bookingsSpark}  />
        <StatCard icon={CalendarCheck} label="Active Bookings"  value={active.length}                 accent="#10B981" sparkColor="#10B981" sparkData={bookingsSpark}  />
        <StatCard icon={Car}           label="Utilization Rate" value={`${utilization}%`}             accent="#6366F1" sparkColor="#6366F1" sparkData={null}          />
        <StatCard icon={DollarSign}    label="Total Earnings"   value={formatCurrency(totalEarnings)} accent="#4F6BF6" sparkColor="#4F6BF6" sparkData={earningsSpark} />
      </div>

      {/* ── Period toggle + chart section header ─────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Analytics Overview</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Showing {periodLabel.toLowerCase()} data across all charts
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Area — 2 cols */}
        <Panel className="p-6 lg:col-span-2">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Earnings Trend</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Net earnings · {periodLabel}</p>
          </div>
          <div className="h-60">
            {earningsData.length === 0
              ? <Empty message="No completed bookings for this period" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#4F6BF6" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#4F6BF6" stopOpacity={0}    />
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
                      width={42}
                    />
                    <Tooltip
                      formatter={v => [`₱${v.toLocaleString()}`, 'Earnings']}
                      contentStyle={c.tip}
                      cursor={{ stroke: '#4F6BF6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone" dataKey="Earnings"
                      stroke="#4F6BF6" strokeWidth={2.5}
                      fill="url(#eg)" fillOpacity={1} dot={false}
                      activeDot={{ r: 4, fill: '#4F6BF6', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </Panel>

        {/* Donut — 1 col */}
        <Panel className="p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Booking Statuses</p>
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

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Horizontal bar */}
        <Panel className="p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Performing Cars</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By net earnings · {periodLabel}</p>
          </div>
          <div className="h-60">
            {topCarsData.length === 0
              ? <Empty message="No completed bookings for this period" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCarsData} layout="vertical" margin={{ top: 0, right: 10, left: 6, bottom: 0 }}>
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
                      formatter={v => [`₱${v.toLocaleString()}`, 'Earnings']}
                      contentStyle={c.tip} cursor={{ fill: c.cursor }}
                    />
                    <Bar
                      dataKey="Earnings" fill="#4F6BF6"
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

        {/* Pending list */}
        <Panel className="overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pending Bookings</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{pending.length} awaiting review</p>
            </div>
            <Link to="/dashboard/bookings" className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
              View all
            </Link>
          </div>

          {pending.length === 0
            ? (
              <div className="py-14 text-center">
                <CalendarCheck size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No pending bookings</p>
              </div>
            )
            : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {pending.slice(0, 5).map(b => (
                  <div
                    key={b.id}
                    className="px-6 py-4 flex items-center justify-between gap-4
                               hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{b.car_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {b.customer_name} · #{b.booking_code}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                        {b.start_date} → {b.end_date}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/bookings"
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
            )
          }
        </Panel>
      </div>
    </div>
  )
}