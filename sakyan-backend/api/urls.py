from django.urls import path
from .views.auth_views import RegisterView, MeView, UpdateProfileView
from .views.car_views import (
    CarListView, CarDetailView, CarBookedDatesView,
    PartnerCarListCreateView, PartnerCarDetailView,
    ToggleCarAvailabilityView
)
from .views.booking_views import (
    CreateBookingView, CustomerBookingListView, PartnerBookingListView,
    BookingDetailView, UpdateBookingStatusView, UpdatePaymentStatusView,
    UpdateRentalTimesView, SaveKYCView
)
from .views.partner_views import PartnerApplyView, PartnerProfileView
from .views.admin_views import (
    AdminPartnerListView, AdminPartnerActionView,
    AdminStatsView, PublicStatsView, AdminAllBookingsView, AdminUserListView,
    AdminSettingsView, AdminSettingUpdateView,
    AdminKYCListView, AdminKYCActionView,
    AdminSettlementListView, AdminCreateSettlementView, AdminSettlementActionView,
)
from .views.message_views import MessageListView, SendMessageView, ConversationListView, SupportThreadView
from .views.notification_views import NotificationListView, MarkNotificationReadView

urlpatterns = [
    # Auth
    path('auth/register', RegisterView.as_view()),
    path('auth/me', MeView.as_view()),
    path('auth/me/', MeView.as_view()),
    path('auth/profile', UpdateProfileView.as_view()),
    path('auth/profile/', UpdateProfileView.as_view()),

    # Cars (public)
    path('cars/', CarListView.as_view()),
    path('cars/<uuid:pk>/', CarDetailView.as_view()),
    path('cars/<uuid:pk>/booked-dates/', CarBookedDatesView.as_view()),

    # Public stats (landing page)
    path('public/stats/', PublicStatsView.as_view()),

    # Cars (partner)
    path('partner/cars/', PartnerCarListCreateView.as_view()),
    path('partner/cars/<uuid:pk>/', PartnerCarDetailView.as_view()),
    path('partner/cars/<uuid:pk>/toggle/', ToggleCarAvailabilityView.as_view()),

    # Bookings
    path('bookings/', CreateBookingView.as_view()),
    path('bookings/my/', CustomerBookingListView.as_view()),
    path('bookings/kyc/', SaveKYCView.as_view()),
    path('bookings/<uuid:pk>/', BookingDetailView.as_view()),
    path('bookings/<uuid:pk>/<str:action>/', UpdateBookingStatusView.as_view()),
    path('partner/bookings/', PartnerBookingListView.as_view()),
    path('partner/bookings/<uuid:pk>/payment-status/', UpdatePaymentStatusView.as_view()),
    path('partner/bookings/<uuid:pk>/rental-times/', UpdateRentalTimesView.as_view()),

    # Partner onboarding
    path('partner/apply/', PartnerApplyView.as_view()),
    path('partner/profile/', PartnerProfileView.as_view()),

    # Admin — Partners
    path('admin/partners/', AdminPartnerListView.as_view()),
    path('admin/partners/<uuid:pk>/<str:action>/', AdminPartnerActionView.as_view()),

    # Admin — Stats & Bookings
    path('admin/stats/', AdminStatsView.as_view()),
    path('admin/bookings/', AdminAllBookingsView.as_view()),
    path('admin/users/', AdminUserListView.as_view()),

    # Admin — Settings
    path('admin/settings/', AdminSettingsView.as_view()),
    path('admin/settings/<str:key>/', AdminSettingUpdateView.as_view()),

    # Admin — KYC
    path('admin/kyc/', AdminKYCListView.as_view()),
    path('admin/kyc/<uuid:pk>/<str:action>/', AdminKYCActionView.as_view()),

    # Admin — Settlements
    path('admin/settlements/', AdminCreateSettlementView.as_view()),
    path('admin/settlements/list/', AdminSettlementListView.as_view()),
    path('admin/settlements/<uuid:pk>/settle/', AdminSettlementActionView.as_view()),

    # Customer KYC
    path('customer/kyc/', SaveKYCView.as_view()),

    # Messages
    path('messages/', SendMessageView.as_view()),
    path('messages/support/', SupportThreadView.as_view()),
    path('messages/conversations/', ConversationListView.as_view()),
    path('messages/<uuid:booking_id>/', MessageListView.as_view()),

    # Notifications
    path('notifications/', NotificationListView.as_view()),
    path('notifications/read-all/', MarkNotificationReadView.as_view()),
    path('notifications/<uuid:pk>/read/', MarkNotificationReadView.as_view()),
]