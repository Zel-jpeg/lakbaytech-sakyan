from django.urls import path
from .views.auth_views import RegisterView, MeView, UpdateProfileView
from .views.car_views import (
    CarListView, CarDetailView,
    PartnerCarListCreateView, PartnerCarDetailView,
    ToggleCarAvailabilityView
)
from .views.booking_views import (
    CreateBookingView, CustomerBookingListView, PartnerBookingListView,
    BookingDetailView, UpdateBookingStatusView, SaveKYCView
)
from .views.partner_views import PartnerApplyView, PartnerProfileView
from .views.admin_views import (
    AdminPartnerListView, AdminPartnerActionView,
    AdminStatsView, AdminAllBookingsView, AdminUserListView,
    AdminSettingsView, AdminSettingUpdateView
)
from .views.message_views import MessageListView, SendMessageView, ConversationListView
from .views.notification_views import NotificationListView, MarkNotificationReadView

urlpatterns = [
    # Auth
    path('auth/register', RegisterView.as_view()),
    path('auth/me', MeView.as_view()),
    path('auth/profile', UpdateProfileView.as_view()),

    # Cars (public)
    path('cars/', CarListView.as_view()),
    path('cars/<uuid:pk>/', CarDetailView.as_view()),

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

    # Partner onboarding
    path('partner/apply/', PartnerApplyView.as_view()),
    path('partner/profile/', PartnerProfileView.as_view()),

    # Admin
    path('admin/partners/', AdminPartnerListView.as_view()),
    path('admin/partners/<uuid:pk>/<str:action>/', AdminPartnerActionView.as_view()),
    path('admin/stats/', AdminStatsView.as_view()),
    path('admin/bookings/', AdminAllBookingsView.as_view()),
    path('admin/users/', AdminUserListView.as_view()),
    path('admin/settings/', AdminSettingsView.as_view()),
    path('admin/settings/<str:key>/', AdminSettingUpdateView.as_view()),

    # Messages
    path('messages/', SendMessageView.as_view()),
    path('messages/conversations/', ConversationListView.as_view()),
    path('messages/<uuid:booking_id>/', MessageListView.as_view()),

    # Notifications
    path('notifications/', NotificationListView.as_view()),
    path('notifications/read-all/', MarkNotificationReadView.as_view()),
    path('notifications/<uuid:pk>/read/', MarkNotificationReadView.as_view()),
]