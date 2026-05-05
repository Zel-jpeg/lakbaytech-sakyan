import { useState } from 'react'
import { useAdminUsers } from '@/hooks/useAdmin'
import { format } from 'date-fns'
import { Search, Users, ShieldCheck, Car, User } from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ROLE_STYLE = {
  admin:    { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ShieldCheck },
  partner:  { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         icon: Car },
  customer: { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',            icon: User },
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
]

function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function UserAvatar({ url, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  const colorClass = getAvatarColor(name)
  const initial = name?.[0]?.toUpperCase() || '?'

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm shrink-0 ${sizeClass}`}
      />
    )
  }

  return (
    <div className={`rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-gray-800 shadow-sm shrink-0 ${sizeClass} ${colorClass}`}>
      {initial}
    </div>
  )
}

function RoleBadge({ role }) {
  const { badge } = ROLE_STYLE[role] || ROLE_STYLE.customer
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${badge}`}>
      {role}
    </span>
  )
}

// ─── Row skeleton ─────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-2" />
      </td>
      <td className="px-5 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" /></td>
      <td className="px-5 py-4"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter]   = useState('')
  const [search, setSearch]           = useState('')
  const { data, isLoading, isError }  = useAdminUsers(roleFilter)

  const allUsers = data?.results || data || []
  const users = search.trim()
    ? allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
    : allUsers

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Users</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          View and filter all registered users on Sakyan.
        </p>
      </div>

      {/* Stats row */}
      {!isLoading && allUsers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total Users',  value: allUsers.length,                          color: 'text-brand-600 dark:text-brand-400' },
            { label: 'Customers',    value: allUsers.filter(u => u.role === 'customer').length,  color: 'text-gray-700 dark:text-gray-300' },
            { label: 'Partners',     value: allUsers.filter(u => u.role === 'partner').length,   color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Admins',       value: allUsers.filter(u => u.role === 'admin').length,     color: 'text-purple-600 dark:text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a1d2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', 'customer', 'partner', 'admin'].map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition capitalize ${
                roleFilter === role
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
              }`}>
              {role === '' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {isLoading && [...Array(6)].map((_, i) => <RowSkeleton key={i} />)}

              {isError && (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-sm text-red-500 dark:text-red-400">
                    Failed to load users. Please try again.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-5 py-16 text-center">
                    <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {search ? `No users found for "${search}"` : 'No users found.'}
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar url={user.avatar_url} name={user.full_name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate" title={user.id}>
                          {user.id?.substring(0, 12)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {user.phone || user.customer_profile?.contact_number || <span className="italic text-gray-300 dark:text-gray-600">No phone</span>}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!isLoading && users.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Showing {users.length} of {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
