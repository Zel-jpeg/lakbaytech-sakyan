# Sakyan Flutter App — Build Progress

## Phase 1 — Initialize & Foundation
- [x] Initialize Flutter project in `sakyan-app/`
- [x] Create full folder structure
- [x] Write `pubspec.yaml`
- [x] `core/constants/app_colors.dart`
- [x] `core/constants/api_constants.dart`
- [x] `core/constants/app_constants.dart`
- [x] `core/theme/app_theme.dart`
- [x] `core/services/storage_service.dart`
- [x] `core/services/api_service.dart`
- [x] `core/services/supabase_service.dart`
- [x] `core/router/app_router.dart`
- [x] `app.dart`
- [x] `main.dart`

## Phase 2 — Onboarding & Auth
- [x] `onboarding/screens/onboarding_screen.dart`
- [x] `auth/models/user_model.dart`
- [x] `auth/data/auth_repository.dart`
- [x] `auth/providers/auth_provider.dart`
- [x] `auth/screens/login_screen.dart`

## Phase 3 — Home & Cars
- [x] `home/models/public_stats_model.dart`
- [x] `home/data/home_repository.dart`
- [x] `home/providers/home_provider.dart`
- [x] `home/screens/home_screen.dart`
- [x] `cars/models/car_model.dart` + `car_image_model.dart`
- [x] `cars/data/cars_repository.dart`
- [x] `cars/providers/cars_provider.dart`
- [x] `cars/screens/cars_list_screen.dart`
- [x] `cars/screens/car_detail_screen.dart`

## Phase 4 — Booking Flow
- [x] `booking/models/booking_model.dart`
- [x] `booking/data/booking_repository.dart`
- [x] `booking/providers/booking_provider.dart`
- [x] `booking/screens/checkout_screen.dart`
- [x] `booking/screens/confirmation_screen.dart`
- [x] `booking/screens/my_bookings_screen.dart`

## Phase 5 — KYC, Notifications, Messages
- [ ] `kyc/` screens
- [ ] `notifications/` screens
- [ ] `messages/` screens (inbox + chat)

## Phase 6 — Partner Features
- [ ] Partner onboarding wizard (4 steps)
- [ ] Partner dashboard
- [ ] My Cars + Add/Edit Car
- [ ] Partner Bookings
- [ ] Earnings screen
- [ ] Partner Inbox

## Phase 7 — Push Notifications (FCM)
- [ ] Firebase setup
- [ ] FCM token registration
- [ ] Foreground / background message handlers

## Phase 8 — Polish
- [ ] App icon + Splash screen
- [ ] Empty states
- [ ] Error handling + pull-to-refresh
- [ ] Dark/light mode toggle
