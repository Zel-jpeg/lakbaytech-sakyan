import { Link } from 'react-router-dom'
import { Bell, Car, MessageCircle, Menu, X, ChevronDown, LayoutDashboard, BookOpen, Users, User, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import { useConversations } from '@/hooks/useMessages'
import { useUIStore } from '@/store/uiStore'

export default function Navbar() {
  const { user }          = useAuthStore()
  const { logoutAction }  = useAuth()
  const unreadCount       = useUnreadCount()
  const { theme, toggleTheme } = useUIStore()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Unread message count across all conversations (only when logged in)
  const { data: conversations } = useConversations({ enabled: !!user })
  const unreadMsgCount = user
    ? (conversations?.results || conversations || []).reduce((s, c) => s + (c.unread_count || 0), 0)
    : 0

  const closeAll = () => { setDropdownOpen(false); setMenuOpen(false) }

  return (
    <nav className="sticky top-0 z-50 glass-strong shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/sakyan-logo.png" alt="Sakyan"
                 className="h-[34px] w-auto object-contain transition group-hover:scale-105" />
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cars"
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-brand-500
                         dark:hover:text-brand-400 font-medium transition">
              <Car size={18} /> Browse Cars
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && (
              <>
                {/* Messages icon with unread badge */}
                <Link to="/messages" className="relative text-gray-600 dark:text-gray-300 hover:text-brand-500
                                            dark:hover:text-brand-400 transition">
                  <MessageCircle size={20} />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px]
                                     font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* Notifications bell */}
                <Link to="/notifications" className="relative text-gray-600 dark:text-gray-300 hover:text-brand-500
                                                     dark:hover:text-brand-400 transition">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs
                                     rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800
                               rounded-full pl-2 pr-3 py-1.5 transition"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center
                                      justify-center text-white font-semibold text-sm">
                        {user.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-lg py-1 z-50 animate-fade-in">

                      {/* Common Links */}
                      <Link to="/profile" onClick={closeAll}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                   hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <User size={15} className="text-gray-400" /> My Profile
                      </Link>

                      {/* Customer */}
                      {user.role === 'customer' && (
                        <>
                          <Link to="/booking/my-bookings" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <BookOpen size={15} className="text-gray-400" /> My Bookings
                          </Link>
                          <Link to="/messages" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <MessageCircle size={15} className="text-gray-400" /> Messages
                          </Link>
                          <Link to="/onboarding/step1" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <Car size={15} className="text-gray-400" /> Start Listing
                          </Link>
                        </>
                      )}

                      {/* Partner */}
                      {user.role === 'partner' && (
                        <>
                          <Link to="/booking/my-bookings" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <BookOpen size={15} className="text-gray-400" /> My Bookings
                          </Link>
                          <Link to="/messages" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                       hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <MessageCircle size={15} className="text-gray-400" /> Messages
                          </Link>
                          <Link to="/dashboard" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-600 dark:text-brand-400
                                       hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium transition">
                            <LayoutDashboard size={15} /> Partner Dashboard
                          </Link>
                        </>
                      )}

                      {/* Admin */}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={closeAll}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <Users size={15} className="text-gray-400" /> Admin Panel
                        </Link>
                      )}

                      <hr className="my-1 border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={() => { logoutAction(); closeAll() }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost">Sign In</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-4 space-y-1 animate-fade-in">
            <Link to="/cars"
              className="block text-gray-700 dark:text-gray-300 font-medium py-2 px-2 rounded-lg
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={closeAll}>Browse Cars</Link>

            {user ? (
              <>
                <Link to="/messages"
                  className="flex items-center justify-between text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  onClick={closeAll}>
                  <span>Messages</span>
                  {unreadMsgCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>
                <Link to="/notifications"
                  className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  onClick={closeAll}>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile"
                  className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  onClick={closeAll}>My Profile</Link>
                <Link to="/booking/my-bookings"
                  className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  onClick={closeAll}>My Bookings</Link>

                {user.role === 'customer' && (
                  <Link to="/onboarding/step1"
                    className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    onClick={closeAll}>Start Listing</Link>
                )}
                {user.role === 'partner' && (
                  <Link to="/dashboard"
                    className="block text-brand-600 dark:text-brand-400 font-medium py-2 px-2 rounded-lg
                               hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
                    onClick={closeAll}>Partner Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin"
                    className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    onClick={closeAll}>Admin Panel</Link>
                )}

                <button
                  onClick={() => { logoutAction(); closeAll() }}
                  className="block text-red-600 dark:text-red-400 py-2 px-2 font-medium w-full text-left rounded-lg
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg
                                            hover:bg-gray-50 dark:hover:bg-gray-800 transition" onClick={closeAll}>
                  Sign In
                </Link>
                <Link to="/register"
                  className="block bg-brand-500 text-white px-4 py-2 rounded-xl text-center font-medium mt-2
                             hover:bg-brand-600 transition"
                  onClick={closeAll}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}