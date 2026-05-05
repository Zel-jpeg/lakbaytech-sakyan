import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Car, CalendarCheck, DollarSign,
         Users, ClipboardList, LogOut, Menu, X, Bell, Home, BarChart, Sun, Moon, Settings, ShieldCheck, Wallet, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useConversations } from '@/hooks/useMessages'
import { useUIStore } from '@/store/uiStore'
import LogoutModal from '@/components/ui/LogoutModal'

const PARTNER_NAV = [
  { to: '/dashboard',          label: 'Overview',  icon: LayoutDashboard, end: true },
  { to: '/dashboard/cars',     label: 'My Cars',   icon: Car },
  { to: '/dashboard/bookings', label: 'Bookings',  icon: CalendarCheck },
  { to: '/dashboard/earnings', label: 'Earnings',  icon: DollarSign },
  { to: '/dashboard/messages', label: 'Messages',  icon: MessageCircle },
]

const ADMIN_NAV = [
  { to: '/admin',              label: 'Overview',        icon: LayoutDashboard, end: true },
  { to: '/admin/partners',     label: 'Partners',        icon: Users },
  { to: '/admin/kyc',         label: 'Customer KYC',    icon: ShieldCheck },
  { to: '/admin/settlements',  label: 'Commissions',     icon: Wallet },
  { to: '/admin/bookings',     label: 'Bookings',        icon: ClipboardList },
  { to: '/admin/users',        label: 'Platform Users',  icon: Users },
  { to: '/admin/reports',      label: 'Reports',         icon: BarChart },
  { to: '/admin/settings',     label: 'Settings',        icon: Settings },
]

export default function DashboardLayout({ role }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const { user, logoutAction } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, toggleTheme } = useUIStore()
  const { data: conversations } = useConversations({ enabled: role === 'partner' })
  const nav = role === 'admin' ? ADMIN_NAV : PARTNER_NAV

  // Total unread messages across all conversations
  const unreadMsgCount = (conversations?.results || conversations || [])
    .reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col items-start justify-center">
        <Link to="/">
          <img src="/sakyan-logo.png" alt="Sakyan" className="h-8 w-auto object-contain" />
        </Link>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{role} Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {/* Unread badge — only for Messages link */}
            {label === 'Messages' && unreadMsgCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px]
                               font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center
                            text-sm font-semibold text-brand-600 dark:text-brand-400 ring-2 ring-brand-100 dark:ring-brand-900">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        {role !== 'admin' && (
          <Link
            to="/"
            className="flex items-center gap-2 w-full px-3 py-2 mb-1 text-sm text-gray-600 dark:text-gray-400
                       hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20
                       rounded-xl transition"
          >
            <Home size={16} />
            Back to Home
          </Link>
        )}
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400
                     hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                     rounded-xl transition"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1117] overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-50 animate-fade-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800
                           px-4 py-3 flex items-center justify-between lg:px-6">
          <button
            className="lg:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Notifications */}
            <button
              onClick={() => navigate(role === 'admin' ? '/admin/notifications' : '/notifications')}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
                                 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation */}
      <LogoutModal
        open={showLogout}
        onConfirm={logoutAction}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  )
}