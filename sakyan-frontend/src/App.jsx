import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AuthCallback from '@/pages/auth/AuthCallback'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

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
import ProfilePage from '@/pages/dashboard/ProfilePage'
import PartnerHomePage from '@/pages/dashboard/PartnerHomePage'
import MyCarsPage from '@/pages/dashboard/MyCarsPage'
import AddCarPage from '@/pages/dashboard/AddCarPage'
import EditCarPage from '@/pages/dashboard/EditCarPage'
import PartnerBookingsPage from '@/pages/dashboard/PartnerBookingsPage'
import EarningsPage from '@/pages/dashboard/EarningsPage'
import PartnerInboxPage from '@/pages/dashboard/PartnerInboxPage'

// Admin
import AdminHomePage from '@/pages/admin/AdminHomePage'
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminKYCPage from '@/pages/admin/AdminKYCPage'
import AdminSettlementPage from '@/pages/admin/AdminSettlementPage'
import AdminRefundQueuePage from '@/pages/admin/AdminRefundQueuePage'
import AdminInboxPage from '@/pages/admin/AdminInboxPage'

// KYC
import KYCVerificationPage from '@/pages/kyc/KYCVerificationPage'
import KYCPendingPage from '@/pages/kyc/KYCPendingPage'

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

// ─── App Init — refresh user profile on every page load ──────────────────────

function AppInit() {
  const { user, refreshUser } = useAuthStore()

  useEffect(() => {
    // If user is logged in (from persisted storage), fetch latest profile
    // so that KYC status, avatar, etc. are always up-to-date
    if (user) {
      refreshUser()
    }
  }, []) // only on mount

  return null
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <AppInit />
      <Routes>

      {/* ── Public + Booking: share PublicLayout (Navbar + Footer) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Booking */}
        <Route path="/booking/checkout/:carId" element={
          <ProtectedRoute roles={['customer', 'partner']}><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/booking/confirmation/:bookingCode" element={
          <ProtectedRoute roles={['customer', 'partner']}><ConfirmationPage /></ProtectedRoute>
        } />
        <Route path="/booking/my-bookings" element={
          <ProtectedRoute roles={['customer', 'partner']}><MyBookingsPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Route>

      {/* ── Auth callback (no layout) ── */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ── Onboarding (no layout — full-screen steps) ── */}
      <Route path="/onboarding/step1" element={<ProtectedRoute><Step1TypePage /></ProtectedRoute>} />
      <Route path="/onboarding/step2" element={<ProtectedRoute><Step2InfoPage /></ProtectedRoute>} />
      <Route path="/onboarding/step3" element={<ProtectedRoute><Step3DocsPage /></ProtectedRoute>} />
      <Route path="/onboarding/pending" element={<ProtectedRoute><Step4PendingPage /></ProtectedRoute>} />

      {/* ── KYC (no layout — full-screen) ── */}
      <Route path="/kyc/verify" element={<ProtectedRoute roles={['customer', 'partner']}><KYCVerificationPage /></ProtectedRoute>} />
      <Route path="/kyc/pending" element={<ProtectedRoute roles={['customer', 'partner']}><KYCPendingPage /></ProtectedRoute>} />

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
        <Route path="messages" element={<PartnerInboxPage />} />
      </Route>

      {/* ── Admin dashboard (DashboardLayout as parent) ── */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>
      }>
        <Route index element={<AdminHomePage />} />
        <Route path="partners"    element={<AdminPartnersPage />} />
        <Route path="bookings"    element={<AdminBookingsPage />} />
        <Route path="users"       element={<AdminUsersPage />} />
        <Route path="kyc"         element={<AdminKYCPage />} />
        <Route path="settlements" element={<AdminSettlementPage />} />
        <Route path="refunds"     element={<AdminRefundQueuePage />} />
        <Route path="reports"     element={<AdminReportsPage />} />
        <Route path="settings"    element={<AdminSettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="messages"      element={<AdminInboxPage />} />
      </Route>

      {/* ── Inbox & Notifications ── */}
      <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
    </>
  )
}