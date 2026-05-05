import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import {
  Car, Menu, X, LogOut, LayoutDashboard, CalendarCheck,
  ChevronDown, User as UserIcon, Sun, Moon,
  MapPin, Mail, Globe, MessageSquare, Camera,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import LogoutModal from '@/components/ui/LogoutModal'

export default function PublicLayout() {
  const { user } = useAuthStore()
  const { logoutAction } = useAuth()
  const { theme, toggleTheme } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Scroll detection for header background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex flex-col">

      {/* ── Navbar ── */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'glass-strong shadow-glass'
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/sakyan-logo.png"
              alt="Sakyan"
              className="h-[30px] w-auto object-contain rounded-md transition group-hover:scale-105"
            />
          </Link>

          {/* Centered nav links */}
          <nav className="hidden sm:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition"
            >
              Home
            </Link>
            <Link
              to="/cars"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition"
            >
              Browse Cars
            </Link>
          </nav>

          {/* Right-side */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="btn-ghost"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {/* Profile Dropdown */}
                <div className="relative ml-1 pl-3 border-l border-gray-200 dark:border-gray-700" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-full transition"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile"
                           className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
                        {user.full_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <ChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-lg py-1 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                   hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <UserIcon size={15} className="text-gray-400" /> My Profile
                      </Link>

                      {(user.role === 'customer' || user.role === 'partner') && (
                        <Link to="/booking/my-bookings" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <CalendarCheck size={15} className="text-gray-400" /> My Bookings
                        </Link>
                      )}

                      {user.role === 'customer' && (
                        <Link to="/onboarding/step1" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <Car size={15} className="text-gray-400" /> Start Listing
                        </Link>
                      )}

                      {(user.role === 'partner' || user.role === 'admin') && (
                        <Link to={dashboardPath} onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-600 dark:text-brand-400
                                     hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium transition">
                          <LayoutDashboard size={15} />
                          {user.role === 'admin' ? 'Admin Panel' : 'Partner Dashboard'}
                        </Link>
                      )}

                      <hr className="my-1 border-gray-100 dark:border-gray-700" />

                      <button onClick={() => { setShowLogout(true); setDropdownOpen(false) }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600
                                   dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900
                          px-4 py-3 space-y-1 animate-fade-in">
            <Link to="/" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Home
            </Link>
            <Link to="/cars" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Browse Cars
            </Link>
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                             hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-brand-600 dark:text-brand-400
                             rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                             hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  My Profile
                </Link>
                {(user.role === 'customer' || user.role === 'partner') && (
                  <Link to="/booking/my-bookings" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                               hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    My Bookings
                  </Link>
                )}
                {user.role === 'customer' && (
                  <Link to="/onboarding/step1" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                               hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    Start Listing
                  </Link>
                )}
                {(user.role === 'partner' || user.role === 'admin') && (
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl
                               hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    {user.role === 'admin' ? 'Admin Panel' : 'Partner Dashboard'}
                  </Link>
                )}
                <button onClick={() => { setShowLogout(true); setMobileOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-500 dark:text-red-400
                             rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img src="/sakyan-logo.png" alt="Sakyan" className="h-[28px] w-auto object-contain brightness-200" />
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                Connecting customers with trusted local car rental partners across the Philippines.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-brand-500 flex items-center justify-center transition">
                  <Globe size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-brand-500 flex items-center justify-center transition">
                  <MessageSquare size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-brand-500 flex items-center justify-center transition">
                  <Camera size={14} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/cars" className="text-sm hover:text-brand-400 transition">Browse Cars</Link></li>
                <li><Link to="/register" className="text-sm hover:text-brand-400 transition">Sign Up</Link></li>
                <li><Link to="/login" className="text-sm hover:text-brand-400 transition">Log In</Link></li>
              </ul>
            </div>

            {/* For Partners */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-4">For Partners</h4>
              <ul className="space-y-2.5">
                <li><Link to="/onboarding/step1" className="text-sm hover:text-brand-400 transition">List Your Car</Link></li>
                <li><Link to="/dashboard" className="text-sm hover:text-brand-400 transition">Partner Dashboard</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-4">Contact</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-brand-400 shrink-0" />
                  Philippines
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-brand-400 shrink-0" />
                  support@sakyan.app
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Sakyan. Ride the future, power small businesses. 🇵🇭
            </p>
            <p className="text-xs text-gray-600">
              Built with ❤️ in the Philippines
            </p>
          </div>
        </div>
      </footer>

      <LogoutModal
        open={showLogout}
        onConfirm={() => {
          logoutAction()
          setShowLogout(false)
        }}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  )
}