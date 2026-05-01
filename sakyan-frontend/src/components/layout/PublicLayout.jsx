import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Car, Menu, X, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react'
import { useState } from 'react'

export default function PublicLayout() {
  const { user } = useAuthStore()
  const { logoutAction } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Sakyan</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link to="/cars"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">
              Browse Cars
            </Link>

            {!user ? (
              <>
                <Link to="/login"
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">
                  Log in
                </Link>
                <Link to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {user.role === 'customer' && (
                  <Link to="/booking/my-bookings"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">
                    <CalendarCheck size={15} />
                    My Bookings
                  </Link>
                )}
                {(user.role === 'partner' || user.role === 'admin') && (
                  <Link to={dashboardPath}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center
                                  text-xs font-bold text-blue-600">
                    {user.full_name?.[0]?.toUpperCase()}
                  </div>
                  <button
                    onClick={logoutAction}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link to="/cars" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
              Browse Cars
            </Link>
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-blue-600 rounded-xl hover:bg-blue-50">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {user.role === 'customer' && (
                  <Link to="/booking/my-bookings" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                    My Bookings
                  </Link>
                )}
                {(user.role === 'partner' || user.role === 'admin') && (
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                    Dashboard
                  </Link>
                )}
                <button onClick={logoutAction}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-50">
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Car size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Sakyan</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Sakyan. Ride the future, power small businesses. 🇵🇭</p>
        </div>
      </footer>

    </div>
  )
}