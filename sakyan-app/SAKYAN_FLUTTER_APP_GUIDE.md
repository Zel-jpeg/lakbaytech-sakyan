# 🚗 Sakyan Flutter Mobile App — Complete Developer Guide

> **PURPOSE:** This file is a complete context dump to continue Flutter development in any new conversation without losing progress. Read this file first before writing any code.

---

## 📍 Project Location

```
Monorepo root:    c:\Users\acer\Downloads\capstone\Sakyan\
Flutter app dir:  c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\   ← work here
Web frontend:     c:\Users\acer\Downloads\capstone\Sakyan\sakyan-frontend\
Django backend:   c:\Users\acer\Downloads\capstone\Sakyan\sakyan-backend\
```

The `sakyan-app/` folder is where ALL Flutter work goes.

---

## ✅ All Decisions & Answers (Finalized)

| Question | Decision |
|---|---|
| Auth | **Google Sign-In ONLY** on mobile (Supabase OAuth) — no email/password |
| Maps | **OpenStreetMap via flutter_map** (free, no API key) |
| Backend URL | `https://lakbaytech-sakyan-production.up.railway.app` |
| Payment | **No payment gateway** — customer & partner message each other about payment |
| Push Notifications | **Yes — Firebase Cloud Messaging (FCM)** |
| App name | **Sakyan** |
| Bundle ID | `com.sakyan.app` |
| Flutter version | **Flutter 3.38.4**, Dart 3.10.3 (already installed) |
| State management | **Riverpod 2.x** |
| Navigation | **GoRouter** |

---

## 🏗️ Backend & Auth Context

### Backend
- **Stack:** Django REST Framework, deployed on Railway
- **Base URL:** `https://lakbaytech-sakyan-production.up.railway.app/api/`
- **Auth method:** Bearer token (JWT from Supabase), sent as `Authorization: Bearer <token>`
- **Database:** PostgreSQL on Supabase (AWS ap-northeast-2)

### Supabase Config
```
SUPABASE_URL     = https://qmgudvzujoxfvilipjgn.supabase.co
SUPABASE_ANON_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZ3Vkdnp1am94ZnZpbGlwamduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDU4NzcsImV4cCI6MjA5MjkyMTg3N30.8K7szkdyOEMjCYR7IWXtiegqiWe5ne9qIbMvJlmq-4I
```
- Supabase is used for: **Google OAuth flow** + **file/image storage**
- The Supabase JWT token is sent to the Django backend as the Bearer token
- On login/register Django also syncs the user into its `users` table via `/api/auth/register`

### How Auth Works (web → replicate in Flutter)
1. User taps "Sign in with Google"
2. Supabase handles OAuth flow → returns `session.access_token`
3. Flutter sends `POST /api/auth/register` with the Supabase token → Django upserts user into DB and returns user data
4. Store `access_token` in `SharedPreferences` as `sakyan_token`
5. All subsequent API calls include `Authorization: Bearer <token>`
6. On app start, if token exists → call `GET /api/auth/me` to restore session

---

## 📡 Complete API Endpoints

**Base:** `https://lakbaytech-sakyan-production.up.railway.app/api/`

### Auth
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | None | Supabase token in body, syncs user to DB |
| GET | `/auth/me` | Bearer | Returns current user object |
| PATCH | `/auth/profile` | Bearer | Update name, phone, avatar |

### Cars (Public)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/cars/` | None | List all available cars, supports filters |
| GET | `/cars/<uuid>/` | None | Car detail |
| GET | `/cars/<uuid>/booked-dates/` | None | Array of booked date ranges |
| GET | `/public/stats/` | None | Platform stats for landing page |

### Bookings (Customer)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/bookings/` | Bearer | Create booking |
| GET | `/bookings/my/` | Bearer | Customer's booking list |
| GET | `/bookings/<uuid>/` | Bearer | Single booking detail |
| POST | `/bookings/<uuid>/cancel/` | Bearer | Cancel booking |
| POST | `/bookings/kyc/` | Bearer | Save KYC documents |
| GET | `/customer/kyc/` | Bearer | Get KYC status |

### Partner Cars
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET/POST | `/partner/cars/` | Bearer | List/create partner's cars |
| GET/PUT/DELETE | `/partner/cars/<uuid>/` | Bearer | Manage single car |
| POST | `/partner/cars/<uuid>/toggle/` | Bearer | Toggle car availability |

### Partner Bookings
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/partner/bookings/` | Bearer | All bookings for partner's cars |
| POST | `/bookings/<uuid>/approve/` | Bearer | Approve booking |
| POST | `/bookings/<uuid>/reject/` | Bearer | Reject booking |
| POST | `/bookings/<uuid>/complete/` | Bearer | Mark completed |
| PATCH | `/partner/bookings/<uuid>/payment-status/` | Bearer | Update payment status |
| PATCH | `/partner/bookings/<uuid>/rental-times/` | Bearer | Log actual start/return times |

### Partner Onboarding
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/partner/apply/` | Bearer | Submit partner application |
| GET | `/partner/profile/` | Bearer | Get partner profile & status |

### Messages
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/messages/conversations/` | Bearer | List all conversations |
| GET | `/messages/<booking_uuid>/` | Bearer | Messages for a booking |
| POST | `/messages/` | Bearer | Send a message |
| GET/POST | `/messages/support/` | Bearer | Support thread (no booking) |

### Notifications
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/notifications/` | Bearer | List notifications |
| POST | `/notifications/read-all/` | Bearer | Mark all read |
| POST | `/notifications/<uuid>/read/` | Bearer | Mark single read |

---

## 📊 Data Models (from Django backend)

### User
```json
{
  "id": "uuid",
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "role": "customer | partner | admin",
  "avatar_url": "string (url)",
  "created_at": "datetime"
}
```

### Car
```json
{
  "id": "uuid",
  "partner": "uuid",
  "name": "string",
  "brand": "string",
  "model": "string",
  "year": "int",
  "plate_number": "string",
  "transmission": "manual | automatic",
  "fuel_type": "gasoline | diesel | electric | hybrid",
  "seats": "int",
  "color": "string",
  "price_per_day": "decimal",
  "location": "string",
  "location_lat": "float",
  "location_lng": "float",
  "description": "string",
  "features": ["string"],
  "status": "active | inactive",
  "is_available": "bool",
  "images": [{"id": "uuid", "image_url": "string", "is_primary": "bool"}]
}
```

### Booking
```json
{
  "id": "uuid",
  "booking_code": "string (e.g. BK-XXXXXXXX)",
  "car": { /* Car object */ },
  "customer": { /* User object */ },
  "partner": { /* Partner object */ },
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "pickup_location": "string",
  "return_location": "string",
  "total_days": "int",
  "price_per_day": "decimal",
  "subtotal": "decimal",
  "commission_amount": "decimal",
  "total_amount": "decimal",
  "payment_method": "gcash | cash",
  "payment_status": "pending | partial | paid | refunded",
  "gcash_reference": "string",
  "booking_status": "pending_review | approved | rejected | active | completed | cancelled",
  "special_requests": "string",
  "fulfillment_type": "pickup | delivery",
  "delivery_address": "string",
  "actual_start_time": "datetime",
  "actual_return_time": "datetime",
  "created_at": "datetime"
}
```

### Partner
```json
{
  "id": "uuid",
  "user": { /* User object */ },
  "business_name": "string",
  "partner_type": "individual | company",
  "business_address": "string",
  "business_permit_url": "string",
  "government_id_url": "string",
  "contact_person": "string",
  "contact_phone": "string",
  "commission_rate": "decimal (default 10.00)",
  "status": "pending | approved | rejected | suspended",
  "rejection_reason": "string"
}
```

### Notification
```json
{
  "id": "uuid",
  "user": "uuid",
  "title": "string",
  "message": "string",
  "type": "string",
  "is_read": "bool",
  "reference_id": "uuid",
  "created_at": "datetime"
}
```

### Message
```json
{
  "id": "uuid",
  "booking": "uuid (null for support)",
  "sender": { /* User object */ },
  "receiver": { /* User object */ },
  "content": "string",
  "is_read": "bool",
  "created_at": "datetime"
}
```

---

## 📁 Professional Folder Structure

```
sakyan-app/
├── android/
├── ios/
├── assets/
│   ├── images/
│   │   ├── logo.png              ← Copy from web frontend or design
│   │   ├── onboarding_1.png
│   │   ├── onboarding_2.png
│   │   └── onboarding_3.png
│   ├── icons/
│   └── fonts/
│       └── PlusJakartaSans/      ← Download from Google Fonts
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── app_constants.dart
│   │   │   └── app_colors.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   └── text_styles.dart
│   │   ├── utils/
│   │   │   ├── date_utils.dart
│   │   │   ├── currency_utils.dart
│   │   │   └── validators.dart
│   │   ├── widgets/
│   │   │   ├── sakyan_button.dart
│   │   │   ├── sakyan_text_field.dart
│   │   │   ├── car_card.dart
│   │   │   ├── status_badge.dart
│   │   │   ├── loading_overlay.dart
│   │   │   └── sakyan_error_widget.dart
│   │   ├── services/
│   │   │   ├── api_service.dart
│   │   │   ├── storage_service.dart
│   │   │   └── supabase_service.dart
│   │   └── router/
│   │       └── app_router.dart
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── models/
│   │   │   │   └── onboarding_page_model.dart
│   │   │   └── screens/
│   │   │       └── onboarding_screen.dart
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart
│   │   │   └── screens/
│   │   │       └── login_screen.dart
│   │   ├── home/
│   │   │   ├── data/
│   │   │   │   └── home_repository.dart
│   │   │   ├── providers/
│   │   │   │   └── home_provider.dart
│   │   │   └── screens/
│   │   │       └── home_screen.dart
│   │   ├── cars/
│   │   │   ├── data/
│   │   │   │   └── cars_repository.dart
│   │   │   ├── models/
│   │   │   │   ├── car_model.dart
│   │   │   │   └── car_image_model.dart
│   │   │   ├── providers/
│   │   │   │   └── cars_provider.dart
│   │   │   └── screens/
│   │   │       ├── cars_list_screen.dart
│   │   │       └── car_detail_screen.dart
│   │   ├── booking/
│   │   │   ├── data/
│   │   │   │   └── booking_repository.dart
│   │   │   ├── models/
│   │   │   │   └── booking_model.dart
│   │   │   ├── providers/
│   │   │   │   └── booking_provider.dart
│   │   │   └── screens/
│   │   │       ├── checkout_screen.dart
│   │   │       ├── confirmation_screen.dart
│   │   │       └── my_bookings_screen.dart
│   │   ├── kyc/
│   │   │   ├── data/
│   │   │   │   └── kyc_repository.dart
│   │   │   ├── models/
│   │   │   │   └── kyc_model.dart
│   │   │   ├── providers/
│   │   │   │   └── kyc_provider.dart
│   │   │   └── screens/
│   │   │       ├── kyc_verification_screen.dart
│   │   │       └── kyc_pending_screen.dart
│   │   ├── notifications/
│   │   │   ├── data/
│   │   │   │   └── notification_repository.dart
│   │   │   ├── models/
│   │   │   │   └── notification_model.dart
│   │   │   ├── providers/
│   │   │   │   └── notification_provider.dart
│   │   │   └── screens/
│   │   │       └── notifications_screen.dart
│   │   ├── messages/
│   │   │   ├── data/
│   │   │   │   └── message_repository.dart
│   │   │   ├── models/
│   │   │   │   └── message_model.dart
│   │   │   ├── providers/
│   │   │   │   └── message_provider.dart
│   │   │   └── screens/
│   │   │       ├── inbox_screen.dart
│   │   │       └── chat_screen.dart
│   │   ├── profile/
│   │   │   ├── data/
│   │   │   │   └── profile_repository.dart
│   │   │   ├── providers/
│   │   │   │   └── profile_provider.dart
│   │   │   └── screens/
│   │   │       └── profile_screen.dart
│   │   └── partner/
│   │       ├── data/
│   │       │   ├── partner_repository.dart
│   │       │   └── partner_car_repository.dart
│   │       ├── models/
│   │       │   └── partner_model.dart
│   │       ├── providers/
│   │       │   ├── partner_provider.dart
│   │       │   └── partner_cars_provider.dart
│   │       └── screens/
│   │           ├── partner_home_screen.dart
│   │           ├── partner_bookings_screen.dart
│   │           ├── my_cars_screen.dart
│   │           ├── add_car_screen.dart
│   │           ├── edit_car_screen.dart
│   │           ├── earnings_screen.dart
│   │           ├── partner_inbox_screen.dart
│   │           └── partner_onboarding/
│   │               ├── step1_type_screen.dart
│   │               ├── step2_info_screen.dart
│   │               ├── step3_docs_screen.dart
│   │               └── step4_pending_screen.dart
│   └── shared/
│       └── bottom_nav/
│           └── main_scaffold.dart
├── test/
│   ├── unit/
│   └── widget/
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## 📦 pubspec.yaml (Complete)

```yaml
name: sakyan_app
description: Sakyan — Car Rental Mobile App
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.10.0 <4.0.0'
  flutter: '>=3.38.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.3.5

  # Navigation
  go_router: ^14.6.2

  # HTTP
  dio: ^5.7.0

  # Auth & Storage
  supabase_flutter: ^2.7.0
  google_sign_in: ^6.2.2

  # Local Storage
  shared_preferences: ^2.3.2

  # Maps
  flutter_map: ^7.0.2
  latlong2: ^0.9.1

  # Image handling
  image_picker: ^1.1.2
  cached_network_image: ^3.4.1

  # Calendar / Date Picker
  table_calendar: ^3.1.2

  # UI & Animations
  shimmer: ^3.0.0
  animations: ^2.0.11
  google_fonts: ^6.2.1
  flutter_svg: ^2.0.10+1
  lottie: ^3.1.3

  # Utilities
  intl: ^0.19.0
  uuid: ^4.5.0

  # Push Notifications
  firebase_core: ^3.8.0
  firebase_messaging: ^15.1.5
  flutter_local_notifications: ^18.0.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  riverpod_generator: ^2.4.3
  build_runner: ^2.4.13

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/

  fonts:
    - family: PlusJakartaSans
      fonts:
        - asset: assets/fonts/PlusJakartaSans/PlusJakartaSans-Regular.ttf
        - asset: assets/fonts/PlusJakartaSans/PlusJakartaSans-Medium.ttf
          weight: 500
        - asset: assets/fonts/PlusJakartaSans/PlusJakartaSans-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/PlusJakartaSans/PlusJakartaSans-Bold.ttf
          weight: 700
```

---

## 🎨 Design System

### Color Palette (Dark Mode First)
```dart
// lib/core/constants/app_colors.dart
class AppColors {
  // Backgrounds
  static const bgBase      = Color(0xFF0A0F1E);   // deepest bg
  static const bgSurface   = Color(0xFF111827);   // card bg
  static const bgElevated  = Color(0xFF1C2333);   // elevated card

  // Accent
  static const primary     = Color(0xFFFF4D1C);   // orange-red (Sakyan brand)
  static const primaryDark = Color(0xFFD93A10);
  static const primaryGlow = Color(0x33FF4D1C);   // for glow shadows

  // Text
  static const textPrimary   = Color(0xFFF9FAFB);
  static const textSecondary = Color(0xFF9CA3AF);
  static const textMuted     = Color(0xFF6B7280);

  // Status
  static const success  = Color(0xFF10B981);
  static const warning  = Color(0xFFF59E0B);
  static const error    = Color(0xFFEF4444);
  static const info     = Color(0xFF3B82F6);

  // Booking Status
  static const statusPending   = Color(0xFFF59E0B);
  static const statusApproved  = Color(0xFF10B981);
  static const statusRejected  = Color(0xFFEF4444);
  static const statusActive    = Color(0xFF3B82F6);
  static const statusCompleted = Color(0xFF8B5CF6);
  static const statusCancelled = Color(0xFF6B7280);
}
```

### Typography
- **Font family:** Plus Jakarta Sans (bundled in assets/fonts/)
- **Scale:** Display 32px Bold → Headline 24px SemiBold → Title 18px SemiBold → Body 14px Regular → Caption 12px Regular

### Key Design Rules
- Cards use `border-radius: 16px`, glass effect: `Color(0xFF1C2333)` with slight opacity
- Buttons: 50px height, primary color gradient (`#FF4D1C → #D93A10`), 12px radius
- Bottom nav: Floating pill shape with blur background
- All lists use shimmer while loading
- Empty states use illustration + friendly message

---

## 🔑 App Architecture Patterns

### 1. API Service (Dio with JWT interceptor)
```dart
// lib/core/services/api_service.dart
// Mirrors web's axios.js — attaches Bearer token from SharedPreferences
class ApiService {
  static final _dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,  // https://lakbaytech-sakyan-production.up.railway.app/api/
    headers: {'Content-Type': 'application/json'},
  ));

  static void init() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Clear token, redirect to login
          StorageService.clearAll();
          // GoRouter navigate to /login
        }
        handler.next(error);
      },
    ));
  }
}
```

### 2. Auth Flow (Google Sign-In → Supabase → Django)
```dart
// lib/features/auth/data/auth_repository.dart
Future<User> signInWithGoogle() async {
  // 1. Supabase Google OAuth
  await Supabase.instance.client.auth.signInWithOAuth(OAuthProvider.google);
  // 2. Wait for session
  final session = Supabase.instance.client.auth.currentSession;
  final supabaseToken = session!.accessToken;
  // 3. Register/sync with Django backend
  final response = await ApiService.post('/auth/register', {});
  // (token is sent via interceptor header)
  // 4. Store token
  await StorageService.saveToken(supabaseToken);
  return User.fromJson(response.data);
}
```

### 3. Riverpod Auth Provider
```dart
// lib/features/auth/providers/auth_provider.dart
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<UserModel?> build() => const AsyncValue.data(null);

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final user = await ref.read(authRepositoryProvider).signInWithGoogle();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    await StorageService.clearAll();
    state = const AsyncValue.data(null);
  }
}
```

### 4. GoRouter with Auth Guard
```dart
// lib/core/router/app_router.dart
final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  redirect: (context, state) async {
    final isLoggedIn = await StorageService.hasToken();
    final seenOnboarding = await StorageService.hasSeenOnboarding();
    final path = state.uri.path;

    if (!seenOnboarding) return '/onboarding';
    if (!isLoggedIn && path != '/login') return '/login';
    return null;
  },
  routes: [
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (_, __, child) => MainScaffold(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/cars', builder: (_, __) => const CarsListScreen()),
        GoRoute(path: '/cars/:id', builder: (ctx, state) => CarDetailScreen(carId: state.pathParameters['id']!)),
        GoRoute(path: '/bookings', builder: (_, __) => const MyBookingsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
    // Partner routes (only accessible if user.role == 'partner')
    GoRoute(path: '/partner', builder: (_, __) => const PartnerHomeScreen()),
    // ... more routes
  ],
);
```

### 5. Onboarding (First Launch Only)
```dart
// lib/features/onboarding/screens/onboarding_screen.dart
// Use PageView with 3 slides
// On "Get Started" tap → await StorageService.setSeenOnboarding(true) → navigate to /login
// Slides:
//   1. "Find Your Perfect Ride" — illustration of car search
//   2. "Book in Minutes" — illustration of calendar/booking
//   3. "Earn with Your Car" — illustration of earning
```

### 6. Storage Service
```dart
// lib/core/services/storage_service.dart
class StorageService {
  static const _keyToken          = 'sakyan_token';
  static const _keyOnboardingSeen = 'sakyan_onboarding_seen';
  static const _keyUser           = 'sakyan_user';

  static Future<void> saveToken(String token) async { ... }
  static Future<String?> getToken() async { ... }
  static Future<bool> hasToken() async { ... }
  static Future<void> clearAll() async { ... }
  static Future<void> setSeenOnboarding() async { ... }
  static Future<bool> hasSeenOnboarding() async { ... }
}
```

---

## 📱 Screen Inventory

### Customer Role — Bottom Nav
| Tab | Route | Screen |
|---|---|---|
| Home | `/` | `HomeScreen` — browse cars, stats |
| Cars | `/cars` | `CarsListScreen` — search + filter |
| Bookings | `/bookings` | `MyBookingsScreen` — booking history |
| Profile | `/profile` | `ProfileScreen` — account, KYC, logout |

### Additional Customer Screens

| Screen | Route | Description |
|---|---|---|
| Car Detail | `/cars/:id` | Photo gallery, specs, map, "Book Now" button |
| Checkout | `/checkout/:carId` | Date range, fulfillment type, payment method, special requests |
| Confirmation | `/confirmation/:code` | Booking confirmed, show booking code |
| KYC Verify | `/kyc/verify` | Upload: driver's license, valid ID, selfie |
| KYC Pending | `/kyc/pending` | Waiting for admin review |
| Chat | `/chat/:bookingId` | In-booking message thread with partner |
| Notifications | `/notifications` | Push & in-app notification list |

### Partner Role — Bottom Nav
| Tab | Route | Screen |
|---|---|---|
| Dashboard | `/partner` | Stats overview, quick actions |
| My Cars | `/partner/cars` | Car inventory list |
| Bookings | `/partner/bookings` | Manage incoming bookings |
| Inbox | `/partner/inbox` | Customer messages |

### Additional Partner Screens
| Screen | Route | Description |
|---|---|---|
| Add Car | `/partner/cars/add` | Multi-photo + specs + location |
| Edit Car | `/partner/cars/:id/edit` | Edit listing |
| Earnings | `/partner/earnings` | Revenue chart + commission |
| Onboarding Step 1 | `/partner/onboarding/step1` | Individual vs Company |
| Onboarding Step 2 | `/partner/onboarding/step2` | Business info form |
| Onboarding Step 3 | `/partner/onboarding/step3` | Document uploads |
| Onboarding Step 4 | `/partner/onboarding/pending` | Waiting for admin approval |

---

## 🚀 Step-by-Step Build Phases

### PHASE 1 — Initialize Flutter Project
```powershell
# Navigate to the empty sakyan-app directory
cd c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app

# Create Flutter project (run in parent folder first, then move)
flutter create --org com.sakyan --project-name sakyan_app .

# Verify it works
flutter run
```

**After init:**
1. Delete `lib/main.dart` default counter code
2. Create ALL folders as per the structure above (use `mkdir` or create files directly)
3. Replace `pubspec.yaml` with the complete version above
4. Run `flutter pub get`
5. Download Plus Jakarta Sans fonts from Google Fonts → place in `assets/fonts/PlusJakartaSans/`

---

### PHASE 2 — Foundation Files (Build These First)

**Order matters — build dependencies first:**

1. `lib/core/constants/app_colors.dart` — color tokens
2. `lib/core/constants/api_constants.dart` — base URL, endpoints as constants
3. `lib/core/constants/app_constants.dart` — SharedPrefs keys
4. `lib/core/theme/app_theme.dart` — ThemeData (dark + light)
5. `lib/core/services/storage_service.dart` — SharedPreferences wrapper
6. `lib/core/services/api_service.dart` — Dio singleton with JWT interceptor
7. `lib/core/services/supabase_service.dart` — Supabase client init
8. `lib/core/router/app_router.dart` — GoRouter with auth + onboarding guard
9. `lib/app.dart` — MaterialApp.router with ProviderScope
10. `lib/main.dart` — entry point: init Supabase, init ApiService, runApp

---

### PHASE 3 — Onboarding & Auth

1. `lib/features/onboarding/screens/onboarding_screen.dart`
   - PageView with 3 slides
   - Progress dots at bottom
   - "Skip" button top-right
   - "Get Started" / "Next" button
   - On complete: `StorageService.setSeenOnboarding()` → `context.go('/login')`

2. `lib/features/auth/models/user_model.dart`
   - fromJson, toJson, copyWith

3. `lib/features/auth/data/auth_repository.dart`
   - `signInWithGoogle()` → Supabase OAuth → POST /auth/register → store token
   - `getMe()` → GET /auth/me
   - `signOut()` → Supabase signOut + clear storage

4. `lib/features/auth/providers/auth_provider.dart` — Riverpod notifier

5. `lib/features/auth/screens/login_screen.dart`
   - Single "Continue with Google" button (Sakyan branded)
   - App logo centered
   - Dark background with gradient

---

### PHASE 4 — Customer Home & Cars

1. `lib/features/home/screens/home_screen.dart`
   - Hero banner with `GET /public/stats/`
   - Featured cars horizontal scroll
   - Search bar → navigates to /cars

2. `lib/features/cars/models/car_model.dart` + `car_image_model.dart`

3. `lib/features/cars/data/cars_repository.dart`
   - `getCars({filters})` → GET /cars/
   - `getCarById(id)` → GET /cars/<id>/
   - `getBookedDates(carId)` → GET /cars/<id>/booked-dates/

4. `lib/features/cars/screens/cars_list_screen.dart`
   - Filter chips: Transmission, Fuel Type, Max Price
   - 2-column grid of car cards
   - Shimmer while loading

5. `lib/features/cars/screens/car_detail_screen.dart`
   - Photo carousel (PageView)
   - Specs row: seats, transmission, fuel, year
   - Features chips
   - flutter_map with marker at car location
   - Sticky "Book Now" button at bottom (₱X/day)

---

### PHASE 5 — Booking Flow

1. `lib/features/booking/models/booking_model.dart`

2. `lib/features/booking/screens/checkout_screen.dart`
   - Date range picker (table_calendar, respect booked-dates)
   - Fulfillment: Self-Pickup vs Delivery (show address field if delivery)
   - Payment method: GCash or Cash
   - GCash reference field (if GCash selected — same as website, no gateway)
   - Special requests text area
   - Price summary card
   - Confirm Booking button → POST /bookings/

3. `lib/features/booking/screens/confirmation_screen.dart`
   - Success animation (Lottie)
   - Booking code display
   - "View My Bookings" button

4. `lib/features/booking/screens/my_bookings_screen.dart`
   - Filter tabs: All, Pending, Active, Completed
   - Booking cards with status badges
   - Tap to expand → show details + chat button

---

### PHASE 6 — KYC, Notifications, Messages

1. `lib/features/kyc/screens/kyc_verification_screen.dart`
   - Stepper: Personal Info → Documents → Review
   - image_picker for license, valid ID, selfie
   - Upload to Supabase Storage bucket
   - Submit → POST /bookings/kyc/

2. `lib/features/notifications/screens/notifications_screen.dart`
   - GET /notifications/ — grouped by date
   - Tap to mark read
   - Mark all read button

3. `lib/features/messages/screens/inbox_screen.dart`
   - GET /messages/conversations/
   - List of conversations (grouped by booking)

4. `lib/features/messages/screens/chat_screen.dart`
   - GET /messages/<bookingId>/
   - Real-time: poll every 3 seconds (simple approach) or use Supabase realtime
   - POST /messages/ to send

---

### PHASE 7 — Partner Features

1. `lib/features/partner/screens/partner_onboarding/` — 4 step wizard
   - Step 1: Select partner type (Individual / Company) → radio buttons
   - Step 2: Business name, address, contact person, phone
   - Step 3: Upload docs (government ID required; business permit for company)
   - Step 4: Pending approval screen (poll /partner/profile/ for status change)

2. `lib/features/partner/screens/partner_home_screen.dart`
   - Stats cards: Total Earnings, Active Bookings, Total Cars, Pending Requests
   - Recent bookings list

3. `lib/features/partner/screens/my_cars_screen.dart`
   - Car cards with toggle availability switch
   - FAB to add new car

4. `lib/features/partner/screens/add_car_screen.dart` / `edit_car_screen.dart`
   - Multi-image picker (up to 10 images)
   - Form: name, brand, model, year, plate, transmission, fuel, seats, color, price/day
   - Features multi-select chips
   - Location search → show on map

5. `lib/features/partner/screens/partner_bookings_screen.dart`
   - Filter tabs: Pending, Approved, Active, Completed
   - Booking card → expand for details
   - Approve / Reject buttons (pending_review)
   - Update payment status dropdown
   - Log actual rental times (date-time pickers)

6. `lib/features/partner/screens/earnings_screen.dart`
   - Revenue summary
   - Bookings count breakdown

---

### PHASE 8 — Push Notifications (FCM)

1. Create Firebase project → add Android & iOS apps
2. Download `google-services.json` → `android/app/`
3. Download `GoogleService-Info.plist` → `ios/Runner/`
4. Initialize Firebase in `main.dart`:
   ```dart
   await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
   final fcmToken = await FirebaseMessaging.instance.getToken();
   // Send fcmToken to Django backend via PATCH /auth/profile
   ```
5. Handle foreground/background messages in `main.dart`
6. **Backend update needed:** Django backend must store FCM tokens and send push notifications on booking status changes

---

### PHASE 9 — Polish

1. App icon: Use Sakyan logo (place in `android/app/src/main/res/` folders + iOS `Assets.xcassets`)
2. Splash screen: Dark bg + Sakyan logo centered
3. Empty states: Add illustrations for empty bookings, no cars, etc.
4. Error handling: Wrap all API calls in try-catch, show user-friendly SnackBars
5. Pull-to-refresh on all list screens
6. Dark/Light mode toggle stored in SharedPreferences

---

## ⚠️ Important Notes & Gotchas

### Google Sign-In on Android
- Must generate SHA-1 fingerprint from keystore and add to Firebase Console + Supabase dashboard
- Command: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`

### Supabase Google OAuth on Mobile
- Use `supabase_flutter` package's `signInWithOAuth(OAuthProvider.google)`
- Set redirect URL in Supabase dashboard to: `com.sakyan.app://login-callback`
- Add this scheme to `AndroidManifest.xml` and `Info.plist`

### iOS Setup
- Need Xcode (macOS only) for iOS builds — if developing on Windows, Android only for now
- Bundle ID must match: `com.sakyan.app`

### API Date Format
- All dates: `YYYY-MM-DD` (e.g., `2025-12-25`)
- All datetimes: ISO 8601 (e.g., `2025-12-25T14:30:00Z`)

### Supabase File Upload Pattern
```dart
// For car images, KYC docs, etc.
final file = File(pickedImage.path);
final fileName = '${uuid.v4()}.jpg';
await Supabase.instance.client.storage
  .from('car-images')   // or 'kyc-documents'
  .upload(fileName, file);
final url = Supabase.instance.client.storage
  .from('car-images')
  .getPublicUrl(fileName);
```

### PHP Currency Formatting
```dart
// lib/core/utils/currency_utils.dart
String formatPeso(double amount) {
  final formatter = NumberFormat.currency(locale: 'en_PH', symbol: '₱');
  return formatter.format(amount);
}
```

---

## 🔄 Current Progress Tracker

Update this section as you complete each phase:

- [ ] **Phase 1** — Flutter project initialized, folder structure created
- [ ] **Phase 2** — Foundation files (colors, theme, api service, router)
- [ ] **Phase 3** — Onboarding carousel + Auth (Google Sign-In)
- [ ] **Phase 4** — Home screen + Cars list + Car detail
- [ ] **Phase 5** — Checkout + Booking confirmation + My Bookings
- [ ] **Phase 6** — KYC + Notifications + In-booking Chat
- [ ] **Phase 7** — All Partner screens + Partner onboarding wizard
- [ ] **Phase 8** — Push Notifications (FCM)
- [ ] **Phase 9** — Polish (app icon, splash, empty states, error handling)

---

## 💬 How to Continue in a New Conversation

When pasting this context to a new AI session, say:

> "I am building a Flutter app for Sakyan (car rental platform). Read this guide file first:
> `c:\Users\acer\Downloads\capstone\Sakyan\SAKYAN_FLUTTER_APP_GUIDE.md`
> I am currently on Phase [X]. Please continue from Phase [X], building the files in order as described. The Flutter project is at `c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\`"

---

*Last updated: 2026-05-09 | Flutter 3.38.4 | Dart 3.10.3*
