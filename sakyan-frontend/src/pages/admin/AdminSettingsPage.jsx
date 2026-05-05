import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, DollarSign, CreditCard, CheckCircle2, Phone } from 'lucide-react'
import api from '@/config/axios'
import toast from 'react-hot-toast'

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"

// Numeric settings (booking_fee, commission_rate)
function NumericSettingCard({ setting, onSave }) {
  const [value, setValue] = useState(Number(setting.value))
  const [saved, setSaved] = useState(false)
  const isDirty = value !== Number(setting.value)

  const handleSave = () => {
    onSave(setting.key, { value }, () => { setSaved(true); setTimeout(() => setSaved(false), 2000) })
  }

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <DollarSign size={18} className="text-brand-600 dark:text-brand-400" />
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₱</span>
          <input
            type="number" min="0" step="0.01" value={value}
            onChange={e => setValue(Number(e.target.value))}
            className={inputCls + " pl-7"}
          />
        </div>
        <button onClick={handleSave} disabled={!isDirty}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600
                     text-white text-sm font-semibold rounded-xl transition shrink-0">
          <Save size={15} /> Save
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Changes take effect immediately for new bookings.
      </p>
    </div>
  )
}

// Text settings (platform_gcash)
function TextSettingCard({ setting, onSave }) {
  const [value, setValue] = useState(setting.text_value || '')
  const [saved, setSaved]  = useState(false)
  const isDirty = value !== (setting.text_value || '')

  const handleSave = () => {
    onSave(setting.key, { text_value: value }, () => { setSaved(true); setTimeout(() => setSaved(false), 2000) })
  }

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-amber-200 dark:border-amber-900/50 p-6 shadow-sm ring-1 ring-amber-100/60 dark:ring-amber-900/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <CreditCard size={18} className="text-amber-600 dark:text-amber-400" />
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. 09171234567"
            className={inputCls + " pl-8"}
          />
        </div>
        <button onClick={handleSave} disabled={!isDirty}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600
                     text-white text-sm font-semibold rounded-xl transition shrink-0">
          <Save size={15} /> Save
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        This GCash number is shown to customers on the checkout page. Customers send the ₱100 booking fee here.
      </p>
    </div>
  )
}

// Setting type router
function SettingCard({ setting, onSave }) {
  const textKeys = ['platform_gcash']
  if (textKeys.includes(setting.key)) {
    return <TextSettingCard setting={setting} onSave={onSave} />
  }
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
            Configure platform-wide fees, GCash number, and policies.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No settings found.</div>
      ) : (
        <div className="space-y-4 max-w-lg">
          {settings.map(setting => (
            <SettingCard key={setting.key} setting={setting} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  )
}
