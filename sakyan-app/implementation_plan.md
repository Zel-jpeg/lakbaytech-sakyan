# Sakyan Flutter Mobile App — Implementation Plan

## Overview

Build a professional Flutter mobile app for the **Sakyan** car rental platform that replicates and extends the web platform's features for both **Customer** and **Partner** roles. The app will connect to the existing Django REST backend (already deployed on Railway), use Supabase for auth and file storage, and feature a polished onboarding experience on first launch.

The app will live inside the existing monorepo at:
```
c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\
```

---

## User Review Required

> [!IMPORTANT]
> The following sections contain **design decisions that need your input** before we begin coding. Please review the Open Questions at the bottom before approving.

> [!WARNING]
> The existing `sakyan-app/` folder is currently **empty**. We will initialize a brand-new Flutter project inside it. This is a fresh start — no existing code will be overwritten.

---

## Proposed Folder & File Structure

This follows professional Flutter architecture using **feature-first** organization with **clean architecture** principles (data → domain → presentation layers).

```
sakyan-app/
├── android/                        # Android native project
├── ios/                            # iOS native project
├── assets/
│   ├── images/                     # App images & illustrations
│   ├── icons/                      # Custom SVG/PNG icons
│   └── fonts/                      # Custom fonts (e.g., Plus Jakarta Sans)
├── lib/
│   ├── main.dart                   # Entry point
│   ├── app.dart                    # Root MaterialApp / router setup
│   │
│   ├── core/                       # Shared, app-wide utilities
│   │   ├── constants/
│   │   │   ├── api_constants.dart  # Base URL, endpoint strings
│   │   │   ├── app_constants.dart  # SharedPreferences keys, timeouts
│   │   │   └── app_colors.dart     # Design token colors
│   │   ├── theme/
│   │   │   ├── app_theme.dart      # Light & dark ThemeData
│   │   │   └── text_styles.dart    # Typography scale
│   │   ├── utils/
│   │   │   ├── date_utils.dart     # Date formatting helpers
│   │   │   ├── currency_utils.dart # PHP peso formatting
│   │   │   └── validators.dart     # Form validation helpers
│   │   ├── widgets/                # Truly global reusable widgets
│   │   │   ├── sakyan_button.dart
│   │   │   ├── sakyan_text_field.dart
│   │   │   ├── car_card.dart
│   │   │   ├── status_badge.dart
│   │   │   ├── loading_overlay.dart
│   │   │   └── error_widget.dart
│   │   ├── services/
│   │   │   ├── api_service.dart    # Dio HTTP client wrapper
│   │   │   ├── storage_service.dart# SharedPreferences wrapper
│   │   │   └── supabase_service.dart # File upload (images, KYC docs)
│   │   └── router/
│   │       └── app_router.dart     # GoRouter route definitions
│   │
│   ├── features/
│   │   │
│   │   ├── onboarding/             # First-launch experience
│   │   │   ├── models/
│   │   │   ├── screens/
│   │   │   │   ├── onboarding_screen.dart   # 3-slide intro carousel
│   │   │   │   └── onboarding_page_model.dart
│   │   │   └── widgets/
│   │   │       └── onboarding_slide.dart
│   │   │
│   │   ├── auth/                   # Login, Register, Forgot Password
│   │   │   ├── data/
│   │   │   │   ├── auth_repository.dart
│   │   │   │   └── auth_remote_source.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart   # Riverpod StateNotifier
│   │   │   └── screens/
│   │   │       ├── login_screen.dart
│   │   │       ├── register_screen.dart
│   │   │       └── forgot_password_screen.dart
│   │   │
│   │   ├── home/                   # Public browse / landing feed
│   │   │   ├── data/
│   │   │   │   └── home_repository.dart
│   │   │   ├── providers/
│   │   │   │   └── home_provider.dart
│   │   │   └── screens/
│   │   │       └── home_screen.dart     # Browse cars, stats banner
│   │   │
│   │   ├── cars/                   # Car listing & detail
│   │   │   ├── data/
│   │   │   │   └── cars_repository.dart
│   │   │   ├── models/
│   │   │   │   ├── car_model.dart
│   │   │   │   └── car_image_model.dart
│   │   │   ├── providers/
│   │   │   │   └── cars_provider.dart
│   │   │   └── screens/
│   │   │       ├── cars_list_screen.dart    # Filter & search
│   │   │       └── car_detail_screen.dart   # Full detail + booking CTA
│   │   │
│   │   ├── booking/                # Customer booking flow
│   │   │   ├── data/
│   │   │   │   └── booking_repository.dart
│   │   │   ├── models/
│   │   │   │   └── booking_model.dart
│   │   │   ├── providers/
│   │   │   │   └── booking_provider.dart
│   │   │   └── screens/
│   │   │       ├── checkout_screen.dart     # Date picker, payment method
│   │   │       ├── confirmation_screen.dart # Booking confirmed screen
│   │   │       └── my_bookings_screen.dart  # Customer booking history
│   │   │
│   │   ├── kyc/                    # Customer identity verification
│   │   │   ├── data/
│   │   │   │   └── kyc_repository.dart
│   │   │   ├── models/
│   │   │   │   └── kyc_model.dart
│   │   │   ├── providers/
│   │   │   │   └── kyc_provider.dart
│   │   │   └── screens/
│   │   │       ├── kyc_verification_screen.dart # Upload license, ID, selfie
│   │   │       └── kyc_pending_screen.dart
│   │   │
│   │   ├── notifications/          # In-app notification centre
│   │   │   ├── data/
│   │   │   │   └── notification_repository.dart
│   │   │   ├── models/
│   │   │   │   └── notification_model.dart
│   │   │   ├── providers/
│   │   │   │   └── notification_provider.dart
│   │   │   └── screens/
│   │   │       └── notifications_screen.dart
│   │   │
│   │   ├── messages/               # In-booking chat + support
│   │   │   ├── data/
│   │   │   │   └── message_repository.dart
│   │   │   ├── models/
│   │   │   │   └── message_model.dart
│   │   │   ├── providers/
│   │   │   │   └── message_provider.dart
│   │   │   └── screens/
│   │   │       ├── inbox_screen.dart
│   │   │       └── chat_screen.dart
│   │   │
│   │   ├── profile/                # User profile & settings
│   │   │   ├── data/
│   │   │   │   └── profile_repository.dart
│   │   │   ├── providers/
│   │   │   │   └── profile_provider.dart
│   │   │   └── screens/
│   │   │       └── profile_screen.dart
│   │   │
│   │   └── partner/                # Partner-role screens
│   │       ├── data/
│   │       │   ├── partner_repository.dart
│   │       │   └── partner_car_repository.dart
│   │       ├── models/
│   │       │   └── partner_model.dart
│   │       ├── providers/
│   │       │   ├── partner_provider.dart
│   │       │   └── partner_cars_provider.dart
│   │       └── screens/
│   │           ├── partner_home_screen.dart      # Dashboard overview
│   │           ├── partner_bookings_screen.dart  # Manage bookings
│   │           ├── my_cars_screen.dart           # Car inventory
│   │           ├── add_car_screen.dart           # Add new listing
│   │           ├── edit_car_screen.dart          # Edit listing
│   │           ├── earnings_screen.dart          # Revenue overview
│   │           ├── partner_inbox_screen.dart     # Messages from customers
│   │           └── partner_onboarding/           # Become a partner flow
│   │               ├── step1_type_screen.dart    # Individual or Company
│   │               ├── step2_info_screen.dart    # Business info
│   │               ├── step3_docs_screen.dart    # Document uploads
│   │               └── step4_pending_screen.dart # Waiting for approval
│   │
│   └── shared/                     # Models & widgets shared across features
│       └── bottom_nav/
│           └── main_scaffold.dart  # Bottom nav shell (Customer / Partner)
│
├── test/
│   ├── unit/
│   └── widget/
│
├── pubspec.yaml                    # All dependencies declared here
├── analysis_options.yaml          # Linting rules
└── README.md
```

---

## Proposed App Screens & Flow

### 1. First Launch — Onboarding (shown once, skipped on subsequent opens)

| Slide | Title | Subtitle |
|---|---|---|
| 1 | **Find Your Perfect Ride** | Browse hundreds of cars near you in seconds |
| 2 | **Book in Minutes** | Secure your rental with GCash or cash payment |
| 3 | **Earn with Your Car** | List your vehicle and start earning today |

→ "Get Started" → Login/Register gate

---

### 2. Auth Flow
- Login (email + password, Google OAuth if confirmed)
- Register
- Forgot Password (email link)

---

### 3. Customer Role — Bottom Nav (4 tabs)

| Tab | Icon | Screen |
|---|---|---|
| 🏠 Home | house | Browse cars, platform stats |
| 🔍 Cars | magnifier | Search, filter by location/price/type |
| 📋 Bookings | clipboard | My booking history & status |
| 👤 Profile | person | Profile, KYC, Notifications, Logout |

**Key screens:**
- Car detail page (photo gallery, specs, map pin, Book Now CTA)
- Checkout (date range picker, fulfillment type, payment method, special requests)
- Booking confirmation
- KYC verification (camera + file upload for license, valid ID, selfie)
- Notifications centre
- In-booking chat

---

### 4. Partner Role — Bottom Nav (4 tabs)

| Tab | Icon | Screen |
|---|---|---|
| 🏠 Dashboard | house | Revenue, booking stats, quick actions |
| 🚗 My Cars | car | Inventory, toggle availability, add car |
| 📋 Bookings | clipboard | Approve/reject/manage bookings |
| 💬 Inbox | chat | Customer messages, support |

**Key screens:**
- Partner onboarding wizard (4 steps — only for new accounts applying)
- Add / Edit car (multi-image upload, specs, location picker)
- Booking detail modal (approve, reject, update payment, log rental times)
- Earnings page (revenue summary, commission breakdown)

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | **Flutter 3.x** | Cross-platform iOS + Android from one codebase |
| State Management | **Riverpod 2.x** | Scalable, testable, compile-safe |
| Navigation | **GoRouter** | Declarative routing with deep links |
| HTTP Client | **Dio** | Interceptors for JWT token injection |
| Auth | **Supabase Flutter SDK** | Matches existing backend auth |
| File Upload | **Supabase Storage** | Already used by backend for images/docs |
| Local Storage | **SharedPreferences** | Token + onboarding seen flag |
| Image Picker | **image_picker** | Camera & gallery for KYC / car photos |
| Maps | **flutter_map + OpenStreetMap** *(or Google Maps — see Q4)* | Car location display |
| Date Picker | **table_calendar** | Booking date range selection |
| UI Polish | **animations, shimmer, lottie** | Smooth transitions & loading states |
| Fonts | **Plus Jakarta Sans** | Matches modern, premium feel |

---

## Proposed App Design Language

- **Dark mode first** with light mode support (matches website's dual-mode)
- **Color palette**: Deep navy (`#0A0F1E`) base, vibrant orange-red accent (`#FF4D1C`), surfaces in `#111827`
- **Typography**: Plus Jakarta Sans (Google Fonts)
- **Cards**: Glassmorphism-style with subtle blur and gradient borders
- **Animations**: Page transitions with fade+slide, shimmer loading, Lottie success states
- **Bottom nav**: Floating pill-style nav bar with active indicator

---

## Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Initialize Flutter project in `sakyan-app/`
- [ ] Configure `pubspec.yaml` with all dependencies
- [ ] Set up folder structure exactly as above
- [ ] Implement `app_theme.dart` (colors, typography, dark/light)
- [ ] Implement `api_service.dart` (Dio + JWT interceptor)
- [ ] Implement `app_router.dart` (GoRouter with auth guards)

### Phase 2 — Onboarding & Auth (Week 1–2)
- [ ] Build onboarding 3-slide carousel with `PageView`
- [ ] SharedPreferences flag: skip onboarding on 2nd+ launch
- [ ] Login screen
- [ ] Register screen
- [ ] Forgot password screen
- [ ] AuthProvider (Riverpod) — token storage, session persistence

### Phase 3 — Customer Features (Week 2–3)
- [ ] Home screen (public stats + featured cars)
- [ ] Cars list with filters
- [ ] Car detail page (gallery, specs, map)
- [ ] Checkout flow
- [ ] Booking confirmation
- [ ] My Bookings (with status badges)
- [ ] KYC verification (document upload)
- [ ] Notifications screen

### Phase 4 — Partner Features (Week 3–4)
- [ ] Partner onboarding wizard (Steps 1–4)
- [ ] Partner dashboard (stats overview)
- [ ] My Cars (list, toggle availability)
- [ ] Add Car / Edit Car (multi-image + location)
- [ ] Partner Bookings (approve/reject, rental time logging)
- [ ] Earnings screen
- [ ] Partner inbox + chat screen

### Phase 5 — Polish & Testing (Week 4–5)
- [ ] Shimmer loading states on all list screens
- [ ] Empty state illustrations
- [ ] Error handling (network errors, API errors)
- [ ] Dark/light mode toggle in Profile
- [ ] Push notifications (FCM setup — see Q5)
- [ ] Widget tests for key screens
- [ ] Integration test: end-to-end booking flow
- [ ] App icon + splash screen

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Google Sign-In on Mobile?**
> The website has Google OAuth (Supabase). Do you want to include **Sign in with Google** in the mobile app? This requires extra setup (SHA-1 certificate for Android, App Store config for iOS).
> - Option A: ✅ Yes, include Google Sign-In
> - Option B: ❌ No, email/password only for now

> [!IMPORTANT]
> **Q2 — Maps Provider?**
> For showing car pickup locations, we need a map. Two options:
> - Option A: **Google Maps** (requires Google Maps API key, looks premium)
> - Option B: **OpenStreetMap via flutter_map** (free, no API key needed)
> Which do you prefer?

> [!IMPORTANT]
> **Q3 — Target API / Backend URL?**
> What is the **deployed backend URL** for the app to connect to?
> Is it the Railway URL (e.g., `https://sakyan-backend.up.railway.app`)? Please confirm the exact base URL.

> [!IMPORTANT]
> **Q4 — GCash Payment Integration?**
> The website records GCash reference numbers manually. For mobile, do you want to:
> - Option A: **Same as web** — user enters GCash reference number manually
> - Option B: **Deep link to GCash app** — open GCash on the phone for payment
> - Option C: **PayMongo or similar gateway** — full in-app payment
> (Option C requires a merchant account and is more complex)

> [!IMPORTANT]
> **Q5 — Push Notifications?**
> Do you want real push notifications (e.g., "Your booking was approved!")?
> - Option A: ✅ Yes — requires setting up **Firebase Cloud Messaging (FCM)** and updating the Django backend to send push payloads
> - Option B: ❌ No — in-app notifications only (polling the `/notifications/` endpoint)

> [!NOTE]
> **Q6 — App Name & Bundle ID?**
> What should be the app's display name and bundle ID?
> Suggested defaults:
> - Display name: `Sakyan`
> - Bundle ID: `com.sakyan.app`
> Is this correct?

> [!NOTE]
> **Q7 — Flutter Version / Dev Environment?**
> Do you have Flutter already installed? If yes, what version (`flutter --version`)?
> If not, I can include Flutter installation steps at the start of Phase 1.

---

## Verification Plan

### Per-phase verification
- After each phase: run `flutter run` on Android emulator/device and confirm screens render correctly
- API calls verified with real backend data (not mocked)

### Final verification
- Run `flutter test` — all unit + widget tests pass
- Build release APK: `flutter build apk --release`
- Manual test checklist:
  - [ ] First launch shows onboarding, second launch skips it
  - [ ] Customer can browse, book, and view booking status
  - [ ] Partner can add a car, approve a booking, view earnings
  - [ ] Dark mode renders correctly on all screens
  - [ ] Images upload successfully to Supabase Storage
