import { Link } from 'react-router-dom'
import { Bell, Car, MessageCircle, Menu, X, ChevronDown, LayoutDashboard, BookOpen, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'

export default function Navbar() {
  const { user } = useAuthStore()
  const { logoutAction } = useAuth()
  const unreadCount = useUnreadCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const closeAll = () => { setDropdownOpen(false); setMenuOpen(false) }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/sakyan-logo.png" alt="Sakyan" className="h-[34px] w-auto object-contain" />
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cars"
              className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-medium transition">
              <Car size={18} /> Browse Cars
            </Link>

            {user && (
              <>
                {/* Messages */}
                <Link to="/inbox" className="text-gray-600 hover:text-blue-600 transition">
                  <MessageCircle size={20} />
                </Link>

                {/* Notifications bell */}
                <Link to="/notifications" className="relative text-gray-600 hover:text-blue-600 transition">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs
                                     rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded-full pl-2 pr-3 py-1.5 transition"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center
                                      justify-center text-white font-semibold text-sm">
                        {user.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg
                                    border border-gray-100 py-1 z-50">

                      {/* Customer */}
                      {user.role === 'customer' && (
                        <>
                          <Link to="/booking/my-bookings" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <BookOpen size={15} className="text-gray-400" /> My Bookings
                          </Link>
                          <Link to="/onboarding/step1" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <Car size={15} className="text-gray-400" /> Become a Partner
                          </Link>
                        </>
                      )}

                      {/* Partner — no "Become a Partner", just bookings + dashboard */}
                      {user.role === 'partner' && (
                        <>
                          <Link to="/booking/my-bookings" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <BookOpen size={15} className="text-gray-400" /> My Bookings
                          </Link>
                          <Link to="/dashboard" onClick={closeAll}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600
                                       hover:bg-blue-50 font-medium">
                            <LayoutDashboard size={15} className="text-blue-500" /> Partner Dashboard
                          </Link>
                        </>
                      )}

                      {/* Admin */}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={closeAll}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Users size={15} className="text-gray-400" /> Admin Panel
                        </Link>
                      )}

                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => { logoutAction(); closeAll() }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition">
                  Sign In
                </Link>
                <Link to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            <Link to="/cars"
              className="block text-gray-700 font-medium py-2 px-2 rounded-lg hover:bg-gray-50"
              onClick={closeAll}>Browse Cars</Link>

            {user ? (
              <>
                <Link to="/inbox"
                  className="block text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-50"
                  onClick={closeAll}>Messages</Link>
                <Link to="/notifications"
                  className="block text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-50"
                  onClick={closeAll}>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/booking/my-bookings"
                  className="block text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-50"
                  onClick={closeAll}>My Bookings</Link>

                {user.role === 'customer' && (
                  <Link to="/onboarding/step1"
                    className="block text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-50"
                    onClick={closeAll}>Become a Partner</Link>
                )}
                {user.role === 'partner' && (
                  <Link to="/dashboard"
                    className="block text-blue-600 font-medium py-2 px-2 rounded-lg hover:bg-blue-50"
                    onClick={closeAll}>Partner Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin"
                    className="block text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-50"
                    onClick={closeAll}>Admin Panel</Link>
                )}

                <button
                  onClick={() => { logoutAction(); closeAll() }}
                  className="block text-red-600 py-2 px-2 font-medium w-full text-left rounded-lg hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 py-2 px-2" onClick={closeAll}>
                  Sign In
                </Link>
                <Link to="/register"
                  className="block bg-blue-600 text-white px-4 py-2 rounded-xl text-center font-medium mt-2"
                  onClick={closeAll}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}