import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, Percent, DollarSign, CheckCircle2, Info, Users, RefreshCw, Building2, User } from 'lucide-react'
import api from '@/config/axios'
import toast from 'react-hot-toast'

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"

// Per-setting metadata (icon, color, description, suffix)
const SETTING_META = {
  booking_fee: {
    icon: DollarSign,
    color: 'bg-brand-50 dark:bg-brand-900/30',
    iconCls: 'text-brand-600 dark:text-brand-400',
    description: 'One-time platform fee charged to customers per booking. Takes effect for new bookings immediately.',
    suffix: '₱',
  },
  commission_rate: {
    icon: Percent,
    color: 'bg-indigo-50 dark:bg-indigo-900/30',
    iconCls: 'text-indigo-600 dark:text-indigo-400',
    description: 'Default commission % reference. Use the Bulk Commission Reset below to actually apply rates to all partners.',
    suffix: '%',
  },
}

// ─── Bulk Commission Reset Card ────────────────────────────────────────────────
function BulkCommissionCard() {
  const [companyRate,    setCompanyRate]    = useState('5')
  const [individualRate, setIndividualRate] = useState('3')
  const [result,         setResult]         = useState(null)

  const mutation = useMutation({
    mutationFn: () => api.patch('/admin/partners/bulk-commission/', {
      company_rate:    parseFloat(companyRate),
      individual_rate: parseFloat(individualRate),
    }),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success(`Updated ${(res.data.updated_company || 0) + (res.data.updated_individual || 0)} partner(s)!`)
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to update commissions.'
      toast.error(msg)
    },
  })

  const handleApply = () => {
    const c = parseFloat(companyRate)
    const i = parseFloat(individualRate)
    if (isNaN(c) || c < 0 || c > 100) { toast.error('Company rate must be 0–100.'); return }
    if (isNaN(i) || i < 0 || i > 100) { toast.error('Individual rate must be 0–100.'); return }
    setResult(null)
    mutation.mutate()
  }

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Bulk Commission Reset</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Apply new commission rates to <strong>all approved partners</strong> by type. This overwrites individual overrides.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Company rate */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Building2 size={12} className="text-purple-500" /> Company Partners
          </label>
          <div className="relative">
            <input
              type="number" min="0" max="100" step="0.5"
              value={companyRate}
              onChange={e => setCompanyRate(e.target.value)}
              className={inputCls + ' pr-8'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Recommended: 5%</p>
        </div>

        {/* Individual rate */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <User size={12} className="text-blue-500" /> Individual Partners
          </label>
          <div className="relative">
            <input
              type="number" min="0" max="100" step="0.5"
              value={individualRate}
              onChange={e => setIndividualRate(e.target.value)}
              className={inputCls + ' pr-8'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Recommended: 3%</p>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Commission rates updated!</p>
            <p className="text-xs mt-0.5">
              {result.updated_company ?? 0} company partner(s) → {result.company_rate}% &nbsp;·&nbsp;
              {result.updated_individual ?? 0} individual partner(s) → {result.individual_rate}%
            </p>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 mb-4">
        <Info size={12} className="shrink-0 mt-0.5" />
        <p>This applies to all existing approved partners and overrides any per-partner custom rates. New bookings will immediately use the new rates.</p>
      </div>

      <button
        onClick={handleApply}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700
                   disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400
                   text-white text-sm font-semibold rounded-xl transition"
      >
        {mutation.isPending
          ? <><RefreshCw size={15} className="animate-spin" /> Applying…</>
          : <><RefreshCw size={15} /> Apply to All Partners</>}
      </button>
    </div>
  )
}

// Numeric setting card
function NumericSettingCard({ setting, onSave }) {
  const [value, setValue] = useState(Number(setting.value))
  const [saved, setSaved] = useState(false)
  const isDirty = value !== Number(setting.value)
  const meta = SETTING_META[setting.key] || { icon: DollarSign, color: 'bg-gray-50 dark:bg-gray-800', iconCls: 'text-gray-500', description: '', suffix: '' }
  const Icon = meta.icon

  const handleSave = () => {
    onSave(setting.key, { value }, () => { setSaved(true); setTimeout(() => setSaved(false), 2000) })
  }

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
            <Icon size={18} className={meta.iconCls} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{setting.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{setting.key}</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-xs font-medium">
            <CheckCircle2 size={14} /> Saved
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{meta.suffix}</span>
          <input
            type="number" min="0" step={meta.suffix === '%' ? '0.5' : '1'} value={value}
            onChange={e => setValue(Number(e.target.value))}
            className={inputCls + ' pl-7'}
          />
        </div>
        <button onClick={handleSave} disabled={!isDirty}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600
                     text-white text-sm font-semibold rounded-xl transition shrink-0">
          <Save size={15} /> Save
        </button>
      </div>

      {meta.description && (
        <div className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p>{meta.description}</p>
        </div>
      )}
    </div>
  )
}

// Hide stale text-type settings (platform_gcash no longer needed)
function SettingCard({ setting, onSave }) {
  const hiddenKeys = ['platform_gcash']
  if (hiddenKeys.includes(setting.key)) return null
  return <NumericSettingCard setting={setting} onSave={onSave} />
}

export default function AdminSettingsPage() {
  const qc = useQueryClient()

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings/').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, payload }) => api.patch(`/admin/settings/${key}/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['platform-settings'] })
    },
    onError: () => toast.error('Failed to update setting'),
  })

  const handleSave = (key, payload, onDone) => {
    updateMutation.mutate({ key, payload }, {
      onSuccess: () => { toast.success('Setting updated!'); onDone() },
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
          <Settings size={20} className="text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure platform-wide fees and commission rates.
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Bulk Commission Reset — always show */}
        <BulkCommissionCard />

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">Other Platform Settings</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>

        {isLoading ? (
          <>
            {[1, 2].map(i => (
              <div key={i} className="h-36 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
            ))}
          </>
        ) : settings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">No settings found.</div>
        ) : (
          settings.map(setting => (
            <SettingCard key={setting.key} setting={setting} onSave={handleSave} />
          ))
        )}
      </div>
    </div>
  )
}

