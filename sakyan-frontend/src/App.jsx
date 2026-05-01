import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AuthCallback from '@/pages/auth/AuthCallback'

// Public
import LandingPage from '@/pages/public/LandingPage'
import CarsPage from '@/pages/public/CarsPage'
import CarDetailPage from '@/pages/public/CarDetailPage'

// Booking
import CheckoutPage from '@/pages/booking/CheckoutPage'
import ConfirmationPage from '@/pages/booking/ConfirmationPage'
import MyBookingsPage from '@/pages/booking/MyBookingsPage'

// Onboarding
import Step1TypePage from '@/pages/onboarding/Step1TypePage'
import Step2InfoPage from '@/pages/onboarding/Step2InfoPage'
import Step3DocsPage from '@/pages/onboarding/Step3DocsPage'
import Step4PendingPage from '@/pages/onboarding/Step4PendingPage'

// Partner dashboard
import PartnerHomePage from '@/pages/dashboard/PartnerHomePage'
import MyCarsPage from '@/pages/dashboard/MyCarsPage'
import AddCarPage from '@/pages/dashboard/AddCarPage'
import EditCarPage from '@/pages/dashboard/EditCarPage'
import PartnerBookingsPage from '@/pages/dashboard/PartnerBookingsPage'
import EarningsPage from '@/pages/dashboard/EarningsPage'

// Admin
import AdminHomePage from '@/pages/admin/AdminHomePage'
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'

// Messages & Notifications
import InboxPage from '@/pages/messages/InboxPage'
import NotificationsPage from '@/pages/NotificationsPage'

// 404
import NotFoundPage from '@/pages/NotFoundPage'

// ─── Protected Route ──────────────────────────────────────────────────────────

function ProtectedRoute({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>

      {/* ── Public + Booking: share PublicLayout (Navbar + Footer) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Booking */}
        <Route path="/booking/checkout/:carId" element={
          <ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/booking/confirmation/:bookingCode" element={
          <ProtectedRoute roles={['customer']}><ConfirmationPage /></ProtectedRoute>
        } />
        <Route path="/booking/my-bookings" element={
          <ProtectedRoute roles={['customer']}><MyBookingsPage /></ProtectedRoute>
        } />
      </Route>

      {/* ── Auth callback (no layout) ── */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ── Onboarding (no layout — full-screen steps) ── */}
      <Route path="/onboarding/step1" element={<ProtectedRoute><Step1TypePage /></ProtectedRoute>} />
      <Route path="/onboarding/step2" element={<ProtectedRoute><Step2InfoPage /></ProtectedRoute>} />
      <Route path="/onboarding/step3" element={<ProtectedRoute><Step3DocsPage /></ProtectedRoute>} />
      <Route path="/onboarding/pending" element={<ProtectedRoute><Step4PendingPage /></ProtectedRoute>} />

      {/* ── Partner dashboard (DashboardLayout as parent) ── */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['partner']}><DashboardLayout role="partner" /></ProtectedRoute>
      }>
        <Route index element={<PartnerHomePage />} />
        <Route path="cars" element={<MyCarsPage />} />
        <Route path="cars/add" element={<AddCarPage />} />
        <Route path="cars/:id/edit" element={<EditCarPage />} />
        <Route path="bookings" element={<PartnerBookingsPage />} />
        <Route path="earnings" element={<EarningsPage />} />
      </Route>

      {/* ── Admin dashboard (DashboardLayout as parent) ── */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>
      }>
        <Route index element={<AdminHomePage />} />
        <Route path="partners" element={<AdminPartnersPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>

      {/* ── Inbox & Notifications ── */}
      <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  )
}