# 🚗 SAKYAN — Car Rental Platform Blueprint v4
> Django REST + React Vite | Supabase | Railway + Vercel | MVP in 5 Days

> **v4 = Blueprint v3 + Supabase Realtime migration applied**
> Real-time messaging and notifications via Supabase Realtime (replaces Django Channels + Redis entirely). Django goes back to WSGI/gunicorn — no daphne, no consumers, no channel layer.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Folder & File Structure](#3-monorepo-folder--file-structure)
4. [Database Schema (Supabase)](#4-database-schema-supabase)
5. [Role System](#5-role-system)
6. [Backend Deep Dive (Django)](#6-backend-deep-dive-django)
7. [Frontend Deep Dive (React + Vite)](#7-frontend-deep-dive-react--vite)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Supabase Realtime Architecture](#9-supabase-realtime-architecture)
10. [Day-by-Day Plan (5 Days)](#10-day-by-day-plan-5-days)
11. [Deployment Guide](#11-deployment-guide)
12. [Environment Variables](#12-environment-variables)
13. [Post-MVP Roadmap](#13-post-mvp-roadmap)

---

## 1. Project Overview

**Sakyan** is a centralized car rental marketplace for small to medium car rental companies in the Philippines.

### Business Model
- Partners list their cars on Sakyan
- Sakyan takes **8–12% commission** of monthly income via the platform
- Customers browse, book, and pay (GCash or Cash)

### Three User Roles
| Role | Description |
|------|-------------|
| **Customer** | Browses cars, books, uploads license/ID |
| **Partner** | Lists cars, manages bookings, sees customer KYC info |
| **Admin** | Approves partners, oversees entire platform |

### What Changed from v3 → v4
| Area | Before (v3) | After (v4) |
|------|-------------|------------|
| Real-time transport | Django Channels WebSocket | Supabase Realtime (postgres_changes) |
| Channel layer | Redis (Railway plugin) | Removed entirely |
| ASGI server | `daphne` | `gunicorn` (back to WSGI) |
| push_notification | DB write + Redis group_send | DB write only — Supabase broadcasts INSERT |
| Frontend hooks | `reconnecting-websocket` | `supabase.channel()` subscriptions |
| Deleted files | — | `consumers/`, `middleware.py`, `routing.py`, `asgi.py` |
| New Supabase SQL | — | `REPLICA IDENTITY FULL` on messages + notifications |

---

## 2. Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TailwindCSS | Vercel |
| Backend | Django 5 + Django REST Framework + Channels | Railway |
| Database | Supabase (PostgreSQL) | Supabase |
| File Storage | Supabase Storage | Supabase |
| Auth | Supabase Auth (JWT) | Supabase |
| Real-time | Supabase Realtime (postgres_changes) | Supabase |
| Mobile (later) | Flutter | — |

### Key Libraries

**Backend:**
- `djangorestframework` — REST API
- `djangorestframework-simplejwt` — JWT validation (from Supabase)
- `psycopg2-binary` — PostgreSQL adapter
- `django-cors-headers` — CORS
- `python-dotenv` — env vars
- `Pillow` — image handling
- `supabase` — Supabase Python client
- `whitenoise` — static file serving
- `gunicorn` — WSGI server

**Frontend:**
- `react-router-dom` — routing
- `@tanstack/react-query` — server state, caching, loading states
- `axios` — HTTP client
- `@supabase/supabase-js` — Supabase Auth
- `react-hook-form` + `zod` — forms + validation
- `zustand` — global client state
- `tailwindcss` — styling
- `lucide-react` — icons
- `react-hot-toast` — notifications
- `date-fns` — date utilities
- `react-dropzone` — file upload UI

---

## 3. Monorepo Folder & File Structure

```
Sakyan/                                   ← GitHub monorepo root
│
├── README.md
├── .gitignore
├── .env.example
│
├── sakyan-backend/                        ← Django REST API → Railway
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   ├── Procfile                           ← For Railway process
│   │
│   ├── sakyan/                            ← Django project (settings)
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py                        ← Root URL config
│   │   └── wsgi.py
│   │
│   └── api/                               ← SINGLE Django app (handles everything)
│       ├── __init__.py
│       │
│       ├── models.py                      ← All database models
│       ├── serializers.py                 ← All DRF serializers
│       ├── urls.py                        ← All URL routes
│       ├── permissions.py                 ← Custom permission classes
│       ├── authentication.py              ← Supabase JWT authentication
│       ├── pagination.py                  ← Custom pagination
│       ├── filters.py                     ← Query filters
│       ├── utils.py                       ← Helper functions (push_notification = DB write only)
│       ├── storage.py                     ← Supabase Storage helper
│       ├── signals.py                     ← Django signals
│       │
│       ├── views/                         ← Grouped view files
│       │   ├── __init__.py
│       │   ├── auth_views.py              ← Register, me, profile
│       │   ├── car_views.py               ← CRUD for cars
│       │   ├── booking_views.py           ← Booking flow
│       │   ├── partner_views.py           ← Partner onboarding & management
│       │   ├── admin_views.py             ← Admin approval & oversight
│       │   ├── message_views.py           ← Messaging (REST history)
│       │   └── notification_views.py      ← Notifications (REST history)
│       │
│       └── migrations/
│           └── 0001_initial.py
│
└── sakyan-frontend/                       ← React + Vite → Vercel
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env
    ├── .env.example
    ├── vercel.json
    │
    └── src/
        ├── main.jsx                       ← App entry point
        ├── App.jsx                        ← Router setup
        │
        ├── assets/                        ← Static assets
        │   ├── images/
        │   │   ├── logo.svg
        │   │   └── hero-bg.jpg
        │   └── fonts/
        │
        ├── config/                        ← App-wide config
        │   ├── constants.js               ← App constants (roles, statuses)
        │   ├── supabase.js                ← Supabase client init
        │   └── axios.js                   ← Axios instance + interceptors
        │
        ├── store/                         ← Zustand global state
        │   ├── authStore.js               ← User session, role
        │   └── uiStore.js                 ← Sidebar open, modals
        │
        ├── hooks/                         ← Custom React hooks
        │   ├── useAuth.js                 ← Auth state + actions
        │   ├── useCars.js                 ← Car queries (react-query)
        │   ├── useBookings.js             ← Booking queries
        │   ├── usePartner.js              ← Partner queries
        │   ├── useMessages.js             ← UPDATED: Supabase Realtime + REST history
        │   ├── useNotifications.js        ← UPDATED: Supabase Realtime push + REST history
        │   ├── useAdmin.js                ← Admin queries
        │   ├── useFileUpload.js           ← Supabase Storage upload hook
        │   └── useDebounce.js             ← Debounce for search
        │
        ├── services/                      ← API service functions
        │   ├── auth.service.js
        │   ├── car.service.js
        │   ├── booking.service.js
        │   ├── partner.service.js
        │   ├── admin.service.js
        │   ├── message.service.js
        │   └── notification.service.js
        │
        ├── context/                       ← React Context (lightweight global)
        │   └── AuthContext.jsx            ← Auth provider wrapping app
        │
        ├── components/                    ← Reusable UI components
        │   ├── ui/                        ← Base UI primitives
        │   │   ├── Button.jsx
        │   │   ├── Input.jsx
        │   │   ├── Select.jsx
        │   │   ├── Badge.jsx
        │   │   ├── Card.jsx
        │   │   ├── Modal.jsx
        │   │   ├── Spinner.jsx
        │   │   ├── Avatar.jsx
        │   │   ├── Tabs.jsx
        │   │   └── EmptyState.jsx
        │   │
        │   ├── layout/                    ← Layout components
        │   │   ├── Navbar.jsx             ← Includes Supabase Realtime-powered notification bell
        │   │   ├── Footer.jsx
        │   │   ├── Sidebar.jsx            ← Dashboard sidebar
        │   │   ├── DashboardLayout.jsx    ← Wrapper for partner/admin
        │   │   └── PublicLayout.jsx       ← Wrapper for public pages
        │   │
        │   ├── auth/                      ← Auth-related components
        │   │   ├── ProtectedRoute.jsx     ← Route guard
        │   │   └── RoleGuard.jsx          ← Role-based access component
        │   │
        │   ├── cars/                      ← Car-specific components
        │   │   ├── CarCard.jsx            ← Grid card
        │   │   ├── CarGrid.jsx            ← Grid with loading skeleton
        │   │   ├── CarFilters.jsx         ← Sidebar filters
        │   │   ├── CarImageGallery.jsx
        │   │   ├── CarForm.jsx            ← Add/edit car form
        │   │   └── CarSkeleton.jsx        ← Loading placeholder
        │   │
        │   ├── booking/                   ← Booking components
        │   │   ├── BookingCard.jsx
        │   │   ├── BookingStatusBadge.jsx
        │   │   ├── DateRangePicker.jsx
        │   │   ├── PriceSummary.jsx
        │   │   └── KYCForm.jsx            ← Driver's license + ID upload
        │   │
        │   ├── partner/
        │   │   ├── OnboardingSteps.jsx    ← Step indicator
        │   │   ├── EarningsSummary.jsx
        │   │   └── BookingTable.jsx       ← Partner's booking list
        │   │
        │   ├── admin/
        │   │   ├── PartnerApplicationCard.jsx
        │   │   ├── StatsCard.jsx
        │   │   └── AdminTable.jsx
        │   │
        │   └── messaging/
        │       ├── ConversationList.jsx
        │       ├── ChatWindow.jsx         ← UPDATED: Supabase Realtime-aware
        │       └── MessageBubble.jsx
        │
        ├── pages/                         ← Route-level page components
        │   ├── public/
        │   │   ├── LandingPage.jsx
        │   │   ├── CarsPage.jsx           ← Browse all cars
        │   │   └── CarDetailPage.jsx
        │   │
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   ├── RegisterPage.jsx
        │   │   └── ForgotPasswordPage.jsx
        │   │
        │   ├── onboarding/                ← Partner onboarding flow
        │   │   ├── OnboardingLayout.jsx   ← Shared step wrapper
        │   │   ├── Step1TypePage.jsx      ← Individual vs Company
        │   │   ├── Step2InfoPage.jsx      ← Business info
        │   │   ├── Step3DocsPage.jsx      ← Upload documents
        │   │   └── Step4PendingPage.jsx   ← Awaiting approval
        │   │
        │   ├── booking/
        │   │   ├── CheckoutPage.jsx
        │   │   ├── ConfirmationPage.jsx
        │   │   └── MyBookingsPage.jsx
        │   │
        │   ├── dashboard/                 ← Partner dashboard
        │   │   ├── PartnerHomePage.jsx
        │   │   ├── MyCarsPage.jsx
        │   │   ├── AddCarPage.jsx
        │   │   ├── EditCarPage.jsx
        │   │   ├── PartnerBookingsPage.jsx
        │   │   └── EarningsPage.jsx
        │   │
        │   ├── messages/
        │   │   └── InboxPage.jsx
        │   │
        │   ├── admin/
        │   │   ├── AdminHomePage.jsx
        │   │   ├── AdminPartnersPage.jsx
        │   │   ├── AdminBookingsPage.jsx
        │   │   ├── AdminUsersPage.jsx
        │   │   └── AdminReportsPage.jsx
        │   │
        │   └── NotFoundPage.jsx
        │
        └── utils/                         ← Pure utility functions
            ├── formatters.js              ← Currency, date formatters
            ├── validators.js              ← Zod schemas
            └── helpers.js                ← Misc helpers
```

---

## 4. Database Schema (Supabase)

Run all of these in **Supabase → SQL Editor** in order.

### 4.1 `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(20),
  role        VARCHAR(20) DEFAULT 'customer'
              CHECK (role IN ('customer', 'partner', 'admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.2 `partners`
```sql
CREATE TABLE partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name        VARCHAR(255) NOT NULL,
  partner_type         VARCHAR(20) NOT NULL
                       CHECK (partner_type IN ('individual', 'company')),
  business_address     TEXT,
  business_permit_url  TEXT,
  government_id_url    TEXT NOT NULL,
  contact_person       VARCHAR(255),
  contact_phone        VARCHAR(20),
  commission_rate      DECIMAL(4,2) DEFAULT 10.00,
  status               VARCHAR(20) DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason     TEXT,
  approved_at          TIMESTAMPTZ,
  approved_by          UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.3 `cars`
```sql
CREATE TABLE cars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES partners(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  brand           VARCHAR(100),
  model           VARCHAR(100),
  year            INT,
  plate_number    VARCHAR(20) UNIQUE,
  transmission    VARCHAR(20) CHECK (transmission IN ('manual','automatic')),
  fuel_type       VARCHAR(20) CHECK (fuel_type IN ('gasoline','diesel','electric','hybrid')),
  seats           INT DEFAULT 5,
  color           VARCHAR(50),
  price_per_day   DECIMAL(10,2) NOT NULL,
  location        VARCHAR(255),
  description     TEXT,
  features        TEXT[] DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'active'
                  CHECK (status IN ('active','inactive')),
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.4 `car_images`
```sql
CREATE TABLE car_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id      UUID REFERENCES cars(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `customer_profiles` (KYC)
```sql
CREATE TABLE customer_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  birthday                 DATE,
  address                  TEXT,
  drivers_license_number   VARCHAR(50),
  drivers_license_url      TEXT,
  license_expiry           DATE,
  valid_id_type            VARCHAR(100),
  valid_id_url             TEXT,
  selfie_url               TEXT,
  is_verified              BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.6 `bookings`
```sql
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code      VARCHAR(20) UNIQUE NOT NULL,
  car_id            UUID REFERENCES cars(id),
  customer_id       UUID REFERENCES users(id),
  partner_id        UUID REFERENCES partners(id),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  pickup_location   TEXT,
  return_location   TEXT,
  total_days        INT NOT NULL,
  price_per_day     DECIMAL(10,2) NOT NULL,
  subtotal          DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  total_amount      DECIMAL(10,2) NOT NULL,
  payment_method    VARCHAR(20) CHECK (payment_method IN ('gcash','cash')),
  payment_status    VARCHAR(20) DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','refunded')),
  gcash_reference   VARCHAR(100),
  booking_status    VARCHAR(30) DEFAULT 'pending_review'
                    CHECK (booking_status IN (
                      'pending_review',
                      'approved',
                      'rejected',
                      'active',
                      'completed',
                      'cancelled'
                    )),
  special_requests  TEXT,
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4.7 `messages`
```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 `notifications`
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  type          VARCHAR(50),
  is_read       BOOLEAN DEFAULT FALSE,
  reference_id  UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.9 Supabase Storage Buckets
```sql
-- Run in dashboard: Storage → New Bucket
-- Bucket 1: car-images     → public: TRUE
-- Bucket 2: documents      → public: FALSE (private, for licenses/IDs)
-- Bucket 3: avatars        → public: TRUE
```

### 4.10 Row Level Security (RLS)
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: own profile only
CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Cars: anyone can read active cars
CREATE POLICY "cars_public_read" ON cars
  FOR SELECT USING (status = 'active' AND is_available = TRUE);

-- Bookings: customer or partner involved
CREATE POLICY "bookings_involved_parties" ON bookings
  FOR ALL USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM partners WHERE id = partner_id)
  );

-- Messages: only sender or receiver
CREATE POLICY "messages_participants" ON messages
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);
```

### 4.11 Enable Supabase Realtime

Run in **Supabase Dashboard → Database → Replication**: toggle on the `messages` and `notifications` tables. Then run this SQL so Supabase broadcasts the full row payload on INSERT:

```sql
-- Required for Supabase Realtime to include full row data in broadcast
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
```

> Without `REPLICA IDENTITY FULL`, Supabase only broadcasts the primary key on changes — not the message content or notification fields.

---

## 5. Role System

```
GUEST
  → Browse cars (read-only)
  → Cannot book

CUSTOMER  (role = 'customer')
  → Browse & search cars
  → Book car (with KYC upload)
  → View own bookings
  → Message partner (real-time via Supabase Realtime)

PARTNER  (role = 'partner', partner.status = 'approved')
  → List & manage cars
  → View incoming bookings + customer KYC info
  → Approve / reject bookings
  → Message customers (real-time via Supabase Realtime)
  → View earnings

ADMIN  (role = 'admin')
  → Approve / reject partner applications
  → View all platform data
  → Suspend accounts
  → View reports & stats
```

---

## 6. Backend Deep Dive (Django)

### 6.1 `requirements.txt`
```
django==5.0.4
djangorestframework==3.15.1
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
supabase==2.4.0
Pillow==10.3.0
whitenoise==6.6.0
gunicorn==21.2.0
```

> `channels`, `channels-redis`, and `daphne` are removed. `gunicorn` is back — Django runs as WSGI again.

### 6.2 `sakyan/settings.py`
```python
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]

ROOT_URLCONF = 'sakyan.urls'
WSGI_APPLICATION = 'sakyan.wsgi.application'  # back to WSGI — no ASGI_APPLICATION needed

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASS'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {'sslmode': 'require'},
    }
}

# No CHANNEL_LAYERS — Redis is gone

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.SupabaseJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.StandardPagination',
    'PAGE_SIZE': 12,
}

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

### 6.3 Files deleted in v4

The following files are no longer needed and should be removed:

```
sakyan/asgi.py              ← delete (or keep as bare minimum with no WS routing)
api/middleware.py           ← delete
api/routing.py              ← delete
api/consumers/              ← delete entire folder
  api/consumers/__init__.py
  api/consumers/chat_consumer.py
  api/consumers/notification_consumer.py
```

Django is back to pure WSGI. There are no WebSocket consumers, no channel layer, no ASGI router.

### 6.4 `sakyan/urls.py`
```python
from django.urls import path, include

urlpatterns = [
    path('api/', include('api.urls')),
]
```

### 6.5 `api/authentication.py`
```python
import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User


class SupabaseJWTAuthentication(BaseAuthentication):
    """Validates Supabase JWT tokens against Supabase Auth API."""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None  # Allow unauthenticated access for public routes

        token = auth_header.split(' ')[1]

        response = requests.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                'Authorization': f'Bearer {token}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
            },
            timeout=5
        )

        if response.status_code != 200:
            raise AuthenticationFailed('Invalid or expired token.')

        supabase_user = response.json()
        user_id = supabase_user.get('id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User profile not found. Please complete registration.')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'
```

### 6.6 `api/permissions.py`
```python
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsPartner(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'partner' and
            hasattr(request.user, 'partner') and
            request.user.partner.status == 'approved'
        )


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'


class IsPartnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('partner', 'admin')


class IsOwnerOrAdmin(BasePermission):
    """Object-level: only the owner or admin can access."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        if hasattr(obj, 'customer_id'):
            return obj.customer_id == request.user.id
        return False
```

### 6.7 `api/models.py`
```python
import uuid
from django.db import models


class User(models.Model):
    """Mirrors Supabase auth.users. id is the Supabase UUID."""
    ROLE_CHOICES = [('customer', 'Customer'), ('partner', 'Partner'), ('admin', 'Admin')]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    full_name   = models.CharField(max_length=255)
    email       = models.EmailField(unique=True)
    phone       = models.CharField(max_length=20, blank=True)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    avatar_url  = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    @property
    def is_authenticated(self):
        return True

    class Meta:
        db_table = 'users'


class Partner(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('rejected', 'Rejected'), ('suspended', 'Suspended')
    ]
    TYPE_CHOICES = [('individual', 'Individual'), ('company', 'Company')]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user                = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner')
    business_name       = models.CharField(max_length=255)
    partner_type        = models.CharField(max_length=20, choices=TYPE_CHOICES)
    business_address    = models.TextField(blank=True)
    business_permit_url = models.TextField(blank=True)
    government_id_url   = models.TextField()
    contact_person      = models.CharField(max_length=255, blank=True)
    contact_phone       = models.CharField(max_length=20, blank=True)
    commission_rate     = models.DecimalField(max_digits=4, decimal_places=2, default=10.00)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason    = models.TextField(blank=True)
    approved_at         = models.DateTimeField(null=True, blank=True)
    approved_by         = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_partners'
    )
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'partners'


class Car(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    TRANSMISSION_CHOICES = [('manual', 'Manual'), ('automatic', 'Automatic')]
    FUEL_CHOICES = [
        ('gasoline', 'Gasoline'), ('diesel', 'Diesel'),
        ('electric', 'Electric'), ('hybrid', 'Hybrid')
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4)
    partner       = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='cars')
    name          = models.CharField(max_length=255)
    brand         = models.CharField(max_length=100, blank=True)
    model         = models.CharField(max_length=100, blank=True)
    year          = models.IntegerField(null=True)
    plate_number  = models.CharField(max_length=20, unique=True)
    transmission  = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES, blank=True)
    fuel_type     = models.CharField(max_length=20, choices=FUEL_CHOICES, blank=True)
    seats         = models.IntegerField(default=5)
    color         = models.CharField(max_length=50, blank=True)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    location      = models.CharField(max_length=255)
    description   = models.TextField(blank=True)
    features      = models.JSONField(default=list)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_available  = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cars'


class CarImage(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images')
    image_url  = models.TextField()
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'car_images'
        ordering = ['sort_order']


class CustomerProfile(models.Model):
    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user                    = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    birthday                = models.DateField(null=True)
    address                 = models.TextField(blank=True)
    drivers_license_number  = models.CharField(max_length=50, blank=True)
    drivers_license_url     = models.TextField(blank=True)
    license_expiry          = models.DateField(null=True)
    valid_id_type           = models.CharField(max_length=100, blank=True)
    valid_id_url            = models.TextField(blank=True)
    selfie_url              = models.TextField(blank=True)
    is_verified             = models.BooleanField(default=False)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_profiles'


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_METHOD_CHOICES = [('gcash', 'GCash'), ('cash', 'Cash')]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'), ('paid', 'Paid'), ('refunded', 'Refunded')
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4)
    booking_code      = models.CharField(max_length=20, unique=True)
    car               = models.ForeignKey(Car, on_delete=models.PROTECT, related_name='bookings')
    customer          = models.ForeignKey(User, on_delete=models.PROTECT, related_name='bookings')
    partner           = models.ForeignKey(Partner, on_delete=models.PROTECT, related_name='bookings')
    start_date        = models.DateField()
    end_date          = models.DateField()
    pickup_location   = models.TextField(blank=True)
    return_location   = models.TextField(blank=True)
    total_days        = models.IntegerField()
    price_per_day     = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal          = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method    = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status    = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    gcash_reference   = models.CharField(max_length=100, blank=True)
    booking_status    = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    special_requests  = models.TextField(blank=True)
    admin_notes       = models.TextField(blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']


class Message(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    booking     = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='messages')
    sender      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content     = models.TextField()
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']


class Notification(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title         = models.CharField(max_length=255)
    message       = models.TextField()
    type          = models.CharField(max_length=50, blank=True)
    is_read       = models.BooleanField(default=False)
    reference_id  = models.UUIDField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
```

### 6.8 `api/serializers.py`
```python
from rest_framework import serializers
from .models import User, Partner, Car, CarImage, CustomerProfile, Booking, Message, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'avatar_url', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


class RegisterSerializer(serializers.Serializer):
    user_id   = serializers.UUIDField()
    full_name = serializers.CharField(max_length=255)
    email     = serializers.EmailField()
    phone     = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def create(self, validated_data):
        return User.objects.create(
            id=validated_data['user_id'],
            full_name=validated_data['full_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            role='customer'
        )


class CarImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ['id', 'image_url', 'is_primary', 'sort_order']


class CarListSerializer(serializers.ModelSerializer):
    primary_image    = serializers.SerializerMethodField()
    partner_name     = serializers.CharField(source='partner.business_name', read_only=True)

    class Meta:
        model = Car
        fields = [
            'id', 'name', 'brand', 'model', 'year', 'transmission',
            'fuel_type', 'seats', 'price_per_day', 'location',
            'is_available', 'primary_image', 'partner_name'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return img.image_url if img else None


class CarDetailSerializer(serializers.ModelSerializer):
    images           = CarImageSerializer(many=True, read_only=True)
    partner_name     = serializers.CharField(source='partner.business_name', read_only=True)
    partner_phone    = serializers.CharField(source='partner.contact_phone', read_only=True)
    partner_id       = serializers.UUIDField(source='partner.id', read_only=True)

    class Meta:
        model = Car
        fields = '__all__'


class CarWriteSerializer(serializers.ModelSerializer):
    image_urls = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = Car
        exclude = ['partner', 'created_at', 'updated_at']

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        partner = self.context['request'].user.partner
        car = Car.objects.create(partner=partner, **validated_data)
        for i, url in enumerate(image_urls):
            CarImage.objects.create(car=car, image_url=url, is_primary=(i == 0), sort_order=i)
        return car

    def update(self, instance, validated_data):
        image_urls = validated_data.pop('image_urls', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if image_urls is not None:
            instance.images.all().delete()
            for i, url in enumerate(image_urls):
                CarImage.objects.create(car=instance, image_url=url, is_primary=(i == 0), sort_order=i)
        return instance


class PartnerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Partner
        fields = '__all__'
        read_only_fields = ['id', 'status', 'approved_at', 'approved_by', 'created_at']


class PartnerApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = [
            'business_name', 'partner_type', 'business_address',
            'business_permit_url', 'government_id_url',
            'contact_person', 'contact_phone'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        return Partner.objects.create(user=user, **validated_data)


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        exclude = ['user']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'car', 'start_date', 'end_date',
            'pickup_location', 'return_location',
            'payment_method', 'gcash_reference', 'special_requests'
        ]

    def validate(self, data):
        start = data['start_date']
        end = data['end_date']
        if end <= start:
            raise serializers.ValidationError("End date must be after start date.")

        car = data['car']
        overlapping = Booking.objects.filter(
            car=car,
            booking_status__in=['approved', 'active'],
            start_date__lt=end,
            end_date__gt=start
        ).exists()
        if overlapping:
            raise serializers.ValidationError("Car is not available for the selected dates.")
        return data

    def create(self, validated_data):
        import uuid
        from datetime import date

        customer = self.context['request'].user
        car = validated_data['car']
        start = validated_data['start_date']
        end = validated_data['end_date']
        total_days = (end - start).days
        subtotal = car.price_per_day * total_days
        commission = subtotal * (car.partner.commission_rate / 100)

        booking_code = f"SKY-{date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

        return Booking.objects.create(
            booking_code=booking_code,
            customer=customer,
            partner=car.partner,
            total_days=total_days,
            price_per_day=car.price_per_day,
            subtotal=subtotal,
            commission_amount=commission,
            total_amount=subtotal,
            **validated_data
        )


class BookingSerializer(serializers.ModelSerializer):
    car_name         = serializers.CharField(source='car.name', read_only=True)
    car_image        = serializers.SerializerMethodField()
    customer_name    = serializers.CharField(source='customer.full_name', read_only=True)
    customer_email   = serializers.CharField(source='customer.email', read_only=True)
    customer_phone   = serializers.CharField(source='customer.phone', read_only=True)
    customer_profile = serializers.SerializerMethodField()
    partner_name     = serializers.CharField(source='partner.business_name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'

    def get_car_image(self, obj):
        img = obj.car.images.filter(is_primary=True).first()
        return img.image_url if img else None

    def get_customer_profile(self, obj):
        try:
            return CustomerProfileSerializer(obj.customer.profile).data
        except CustomerProfile.DoesNotExist:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'booking', 'sender', 'receiver', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']
```

### 6.9 `api/utils.py` — `push_notification` helper

`push_notification` is now just a DB write. Supabase Realtime watches the `notifications` table and broadcasts the INSERT automatically to any subscribed frontend client — no Redis, no channel layer, no async needed.

```python
def push_notification(user_id, title, message, notification_type='general', reference_id=None):
    """
    Write a notification row. Supabase Realtime broadcasts the INSERT
    automatically to any subscribed frontend client — no Redis needed.

    Usage is identical to before — call sites in booking_views.py and
    admin_views.py do not need to change:
        push_notification(
            user_id=booking.customer_id,
            title='Booking Approved! ✅',
            message='Your booking SKY-001 has been approved.',
            notification_type='booking',
            reference_id=str(booking.id)
        )
    """
    from api.models import Notification

    Notification.objects.create(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        reference_id=reference_id,
    )
    # That's it. Supabase detects the INSERT and pushes it to the frontend.
    # No channel_layer, no async_to_sync, no group_send.
```

### 6.10 `api/views/car_views.py`
```python
from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Car
from ..serializers import CarListSerializer, CarDetailSerializer, CarWriteSerializer
from ..permissions import IsPartner


class CarListView(generics.ListAPIView):
    serializer_class = CarListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'model', 'location']
    ordering_fields = ['price_per_day', 'created_at', 'year']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Car.objects.filter(status='active', is_available=True).select_related('partner')
        location = self.request.query_params.get('location')
        max_price = self.request.query_params.get('max_price')
        min_price = self.request.query_params.get('min_price')
        transmission = self.request.query_params.get('transmission')
        fuel_type = self.request.query_params.get('fuel_type')
        seats = self.request.query_params.get('seats')

        if location: qs = qs.filter(location__icontains=location)
        if max_price: qs = qs.filter(price_per_day__lte=max_price)
        if min_price: qs = qs.filter(price_per_day__gte=min_price)
        if transmission: qs = qs.filter(transmission=transmission)
        if fuel_type: qs = qs.filter(fuel_type=fuel_type)
        if seats: qs = qs.filter(seats__gte=seats)
        return qs


class CarDetailView(generics.RetrieveAPIView):
    queryset = Car.objects.all().select_related('partner').prefetch_related('images')
    serializer_class = CarDetailSerializer
    permission_classes = [AllowAny]


class PartnerCarListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsPartner]

    def get_serializer_class(self):
        return CarWriteSerializer if self.request.method == 'POST' else CarListSerializer

    def get_queryset(self):
        return Car.objects.filter(
            partner=self.request.user.partner
        ).prefetch_related('images')


class PartnerCarDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsPartner]

    def get_serializer_class(self):
        return CarWriteSerializer if self.request.method in ['PUT', 'PATCH'] else CarDetailSerializer

    def get_queryset(self):
        return Car.objects.filter(partner=self.request.user.partner)


class ToggleCarAvailabilityView(APIView):
    permission_classes = [IsPartner]

    def patch(self, request, pk):
        try:
            car = Car.objects.get(pk=pk, partner=request.user.partner)
        except Car.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        car.is_available = not car.is_available
        car.save()
        return Response({'is_available': car.is_available})
```

### 6.11 `api/views/booking_views.py`
```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Booking, CustomerProfile
from ..serializers import BookingSerializer, BookingCreateSerializer, CustomerProfileSerializer
from ..permissions import IsPartner, IsCustomer
from ..utils import push_notification


class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsCustomer]

    def perform_create(self, serializer):
        booking = serializer.save()
        push_notification(
            user_id=booking.partner.user_id,
            title='New Booking Request 🚗',
            message=f'{booking.customer.full_name} wants to book {booking.car.name} ({booking.booking_code})',
            notification_type='booking',
            reference_id=booking.id
        )


class CustomerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Booking.objects.filter(
            customer=self.request.user
        ).select_related('car', 'partner').prefetch_related('car__images')


class PartnerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        qs = Booking.objects.filter(
            partner=self.request.user.partner
        ).select_related('car', 'customer', 'customer__profile')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(booking_status=status_filter)
        return qs


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        if user.role == 'partner':
            return Booking.objects.filter(partner=user.partner)
        return Booking.objects.filter(customer=user)


class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, action):
        allowed_actions = {
            'approve': ('partner', 'pending_review', 'approved'),
            'reject':  ('partner', 'pending_review', 'rejected'),
            'cancel':  ('customer', 'pending_review', 'cancelled'),
            'complete':('partner', 'active', 'completed'),
        }
        if action not in allowed_actions:
            return Response({'error': 'Invalid action'}, status=400)

        required_role, from_status, to_status = allowed_actions[action]

        try:
            if request.user.role == 'partner':
                booking = Booking.objects.get(pk=pk, partner=request.user.partner)
            elif request.user.role == 'customer':
                booking = Booking.objects.get(pk=pk, customer=request.user)
            else:
                booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if booking.booking_status != from_status and request.user.role != 'admin':
            return Response({'error': f'Can only {action} bookings in {from_status} status'}, status=400)

        booking.booking_status = to_status
        if action == 'reject':
            booking.admin_notes = request.data.get('reason', '')
        booking.save()

        if action in ('approve', 'reject'):
            push_notification(
                user_id=booking.customer_id,
                title=f'Booking {to_status.title()} 📋',
                message=f'Your booking {booking.booking_code} has been {to_status}.',
                notification_type='booking',
                reference_id=booking.id
            )

        return Response(BookingSerializer(booking).data)


class SaveKYCView(generics.CreateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsCustomer]

    def create(self, request, *args, **kwargs):
        profile, created = CustomerProfile.objects.update_or_create(
            user=request.user,
            defaults=request.data
        )
        return Response(
            CustomerProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
```

### 6.12 `api/views/admin_views.py`
```python
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Count, Sum
from ..models import Partner, Booking, User
from ..serializers import PartnerSerializer, BookingSerializer, UserSerializer
from ..permissions import IsAdmin
from ..utils import push_notification
from django.utils import timezone


class AdminPartnerListView(generics.ListAPIView):
    serializer_class = PartnerSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        status = self.request.query_params.get('status', 'pending')
        return Partner.objects.filter(status=status).select_related('user')


class AdminPartnerActionView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk, action):
        try:
            partner = Partner.objects.get(pk=pk)
        except Partner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if action == 'approve':
            partner.status = 'approved'
            partner.approved_at = timezone.now()
            partner.approved_by = request.user
            partner.save()
            partner.user.role = 'partner'
            partner.user.save()
            push_notification(
                user_id=partner.user_id,
                title='Application Approved! 🎉',
                message='Congratulations! Your Sakyan partner application is approved. Start listing your cars!',
                notification_type='approval',
                reference_id=partner.id
            )

        elif action == 'reject':
            partner.status = 'rejected'
            partner.rejection_reason = request.data.get('reason', '')
            partner.save()
            push_notification(
                user_id=partner.user_id,
                title='Application Not Approved',
                message=f"Your application was not approved. Reason: {partner.rejection_reason}",
                notification_type='approval',
                reference_id=partner.id
            )

        elif action == 'suspend':
            partner.status = 'suspended'
            partner.save()
            partner.user.role = 'customer'
            partner.user.save()

        return Response(PartnerSerializer(partner).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = {
            'total_users': User.objects.count(),
            'total_partners': Partner.objects.filter(status='approved').count(),
            'pending_partners': Partner.objects.filter(status='pending').count(),
            'total_bookings': Booking.objects.count(),
            'active_bookings': Booking.objects.filter(booking_status='active').count(),
            'total_revenue': Booking.objects.filter(
                booking_status='completed'
            ).aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0,
        }
        return Response(stats)


class AdminAllBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Booking.objects.all().select_related('car', 'customer', 'partner')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(booking_status=status)
        return qs
```

### 6.13 `api/urls.py`
```python
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
    AdminStatsView, AdminAllBookingsView
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
    path('bookings/<uuid:pk>/', BookingDetailView.as_view()),
    path('bookings/<uuid:pk>/<str:action>/', UpdateBookingStatusView.as_view()),
    path('bookings/kyc/', SaveKYCView.as_view()),
    path('partner/bookings/', PartnerBookingListView.as_view()),

    # Partner onboarding
    path('partner/apply/', PartnerApplyView.as_view()),
    path('partner/profile/', PartnerProfileView.as_view()),

    # Admin
    path('admin/partners/', AdminPartnerListView.as_view()),
    path('admin/partners/<uuid:pk>/<str:action>/', AdminPartnerActionView.as_view()),
    path('admin/stats/', AdminStatsView.as_view()),
    path('admin/bookings/', AdminAllBookingsView.as_view()),

    # Messages (REST — history only; real-time via Supabase Realtime)
    path('messages/<uuid:booking_id>/', MessageListView.as_view()),
    path('messages/', SendMessageView.as_view()),
    path('messages/conversations/', ConversationListView.as_view()),

    # Notifications (REST — history only; real-time via Supabase Realtime)
    path('notifications/', NotificationListView.as_view()),
    path('notifications/<uuid:pk>/read/', MarkNotificationReadView.as_view()),
    path('notifications/read-all/', MarkNotificationReadView.as_view()),
]
```

---

## 7. Frontend Deep Dive (React + Vite)

### 7.1 `package.json`
```json
{
  "name": "sakyan-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-query-devtools": "^5.40.0",
    "axios": "^1.7.2",
    "@supabase/supabase-js": "^2.43.5",
    "react-hook-form": "^7.51.5",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.6.0",
    "zustand": "^4.5.2",
    "lucide-react": "^0.390.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^3.6.0",
    "react-dropzone": "^14.2.3",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.13",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19"
  }
}
```

### 7.2 `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### 7.3 `src/config/axios.js`
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sakyan_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sakyan_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 7.4 `src/config/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 7.5 `src/store/authStore.js`
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        localStorage.setItem('sakyan_token', token)
        set({ token })
      },
      logout: () => {
        localStorage.removeItem('sakyan_token')
        set({ user: null, token: null })
      },
    }),
    { name: 'sakyan-auth', partialize: (state) => ({ user: state.user }) }
  )
)
```

### 7.6 `src/hooks/useAuth.js`
```javascript
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, setUser, setToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: async (data) => {
      const token = data.session.access_token
      setToken(token)
      const res = await api.get('/auth/me')
      setUser(res.data)
      toast.success(`Welcome back, ${res.data.full_name}!`)
      redirectByRole(res.data.role)
    },
    onError: (err) => toast.error(err.message)
  })

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, full_name, phone }) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      await api.post('/auth/register', {
        user_id: data.user.id,
        full_name,
        email,
        phone
      })
      return data
    },
    onSuccess: () => {
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    },
    onError: (err) => toast.error(err.message)
  })

  const logoutAction = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/')
    toast.success('Logged out.')
  }

  const redirectByRole = (role) => {
    const routes = {
      admin: '/admin',
      partner: '/dashboard',
      customer: '/cars'
    }
    navigate(routes[role] || '/cars')
  }

  return { user, loginMutation, registerMutation, logoutAction }
}
```

### 7.7 `src/hooks/useCars.js`
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const carKeys = {
  all: ['cars'],
  lists: () => [...carKeys.all, 'list'],
  list: (filters) => [...carKeys.lists(), filters],
  detail: (id) => [...carKeys.all, 'detail', id],
  myList: () => [...carKeys.all, 'my'],
}

export function useCars(filters = {}) {
  return useQuery({
    queryKey: carKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      )
      const res = await api.get(`/cars/?${params}`)
      return res.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCar(id) {
  return useQuery({
    queryKey: carKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/cars/${id}/`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useMyPartnerCars() {
  return useQuery({
    queryKey: carKeys.myList(),
    queryFn: async () => {
      const res = await api.get('/partner/cars/')
      return res.data
    },
  })
}

export function useCreateCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/partner/cars/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      toast.success('Car listed successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to add car'),
  })
}

export function useUpdateCar(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.patch(`/partner/cars/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      qc.invalidateQueries({ queryKey: carKeys.detail(id) })
      toast.success('Car updated.')
    },
  })
}

export function useToggleCarAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.patch(`/partner/cars/${id}/toggle/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      toast.success('Availability updated.')
    },
  })
}
```

### 7.8 `src/hooks/useBookings.js`
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const bookingKeys = {
  all: ['bookings'],
  my: () => [...bookingKeys.all, 'my'],
  partner: (filters) => [...bookingKeys.all, 'partner', filters],
  detail: (id) => [...bookingKeys.all, id],
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.my(),
    queryFn: () => api.get('/bookings/my/').then(r => r.data),
  })
}

export function usePartnerBookings(filters = {}) {
  return useQuery({
    queryKey: bookingKeys.partner(filters),
    queryFn: () => {
      const params = new URLSearchParams(filters)
      return api.get(`/partner/bookings/?${params}`).then(r => r.data)
    },
  })
}

export function useBooking(id) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => api.get(`/bookings/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/bookings/', data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: bookingKeys.my() })
      toast.success(`Booking submitted! Code: ${data.booking_code}`)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Booking failed'),
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      api.patch(`/bookings/${id}/${action}/`, { reason }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all })
      toast.success('Booking status updated.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Action failed'),
  })
}
```

### 7.9 `src/hooks/useMessages.js` — Supabase Realtime
```javascript
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'

export function useMessages(bookingId) {
  const [realtimeMessages, setRealtimeMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef(null)

  // 1. Load message history via REST (same as before)
  const { data: history, isLoading } = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => api.get(`/messages/${bookingId}/`).then(r => r.data),
    enabled: !!bookingId,
  })

  // 2. Subscribe to Supabase Realtime for new inserts
  useEffect(() => {
    if (!bookingId) return

    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const msg = payload.new
          setRealtimeMessages(prev => {
            // deduplicate — safe even if sender sees their own message echoed back
            const exists = prev.some(m => m.id === msg.id)
            return exists ? prev : [...prev, msg]
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setRealtimeMessages([])
      setIsConnected(false)
    }
  }, [bookingId])

  // 3. Send a message — POST to Django, Django writes to DB,
  //    Supabase broadcasts the INSERT back to both clients
  const sendMessage = ({ content, receiverId }) => {
    if (!content.trim()) return
    api.post('/messages/', {
      booking: bookingId,
      receiver: receiverId,
      content: content.trim(),
    })
    // Supabase Realtime echoes the INSERT back within ~100ms.
    // The deduplication above handles any optimistic duplicates cleanly.
  }

  const historyList = history?.results || history || []
  const allMessages = [...historyList, ...realtimeMessages]

  return { messages: allMessages, isLoading, isConnected, sendMessage }
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations/').then(r => r.data),
    refetchInterval: 15000,
  })
}
```

### 7.10 `src/hooks/useNotifications.js` — Supabase Realtime
```javascript
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export function useNotifications() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef(null)

  // Load notification history
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/').then(r => r.data),
    enabled: !!user,
    onSuccess: (data) => {
      const items = data?.results || data || []
      setUnreadCount(items.filter(n => !n.is_read).length)
    },
  })

  // Subscribe to new notification inserts for this user
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new

          toast(notif.title, {
            icon: getNotificationIcon(notif.type),
            duration: 5000,
          })

          setUnreadCount(prev => prev + 1)
          qc.invalidateQueries({ queryKey: ['notifications'] })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user?.id])

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read/`)
    qc.invalidateQueries({ queryKey: ['notifications'] })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all/')
    qc.invalidateQueries({ queryKey: ['notifications'] })
    setUnreadCount(0)
  }

  return {
    notifications: notifications?.results || notifications || [],
    unreadCount,
    isConnected,
    markAsRead,
    markAllRead,
  }
}

function getNotificationIcon(type) {
  const icons = {
    booking: '🚗',
    approval: '✅',
    message: '💬',
    payment: '💳',
    general: '🔔',
  }
  return icons[type] || '🔔'
}
```

### 7.11 `src/hooks/useFileUpload.js`
```javascript
import { useState } from 'react'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'

export function useFileUpload(bucket = 'documents') {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadFile = async (file) => {
    if (!file) return null
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
      return null
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const uploadMultiple = async (files) => {
    const urls = await Promise.all(files.map(uploadFile))
    return urls.filter(Boolean)
  }

  return { uploadFile, uploadMultiple, uploading, progress }
}
```

### 7.12 `src/components/auth/ProtectedRoute.jsx`
```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
```

### 7.13 `src/components/messaging/ChatWindow.jsx` — Supabase Realtime-aware
```jsx
import { useEffect, useRef, useState } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/formatters'
import { Send, Wifi, WifiOff } from 'lucide-react'

export default function ChatWindow({ booking }) {
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const receiverId = user.id === booking.customer_id
    ? booking.partner_user_id
    : booking.customer_id

  const { messages, isLoading, isConnected, sendMessage } = useMessages(booking.id)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const content = input.trim()
    if (!content) return
    sendMessage({ content, receiverId })
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div>
          <p className="font-semibold text-gray-800">{booking.car_name}</p>
          <p className="text-xs text-gray-500">Booking #{booking.booking_code}</p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {isConnected
            ? <><Wifi size={14} className="text-green-500" /><span className="text-green-600">Live</span></>
            : <><WifiOff size={14} className="text-gray-400" /><span className="text-gray-400">Reconnecting…</span></>
          }
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                isOwn
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 text-blue-600">{msg.sender_name}</p>
                )}
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                  {formatDateTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isConnected}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white
                     rounded-xl p-2.5 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
```

### 7.14 `src/components/layout/Navbar.jsx` — Notification bell
```jsx
import { useNotifications } from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'

// Inside your Navbar component:
function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <button className="relative p-2">
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
                         text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
```

### 7.15 `src/App.jsx`
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'

import LandingPage from '@/pages/public/LandingPage'
import CarsPage from '@/pages/public/CarsPage'
import CarDetailPage from '@/pages/public/CarDetailPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import Step1TypePage from '@/pages/onboarding/Step1TypePage'
import Step2InfoPage from '@/pages/onboarding/Step2InfoPage'
import Step3DocsPage from '@/pages/onboarding/Step3DocsPage'
import Step4PendingPage from '@/pages/onboarding/Step4PendingPage'
import CheckoutPage from '@/pages/booking/CheckoutPage'
import ConfirmationPage from '@/pages/booking/ConfirmationPage'
import MyBookingsPage from '@/pages/booking/MyBookingsPage'
import PartnerHomePage from '@/pages/dashboard/PartnerHomePage'
import MyCarsPage from '@/pages/dashboard/MyCarsPage'
import AddCarPage from '@/pages/dashboard/AddCarPage'
import PartnerBookingsPage from '@/pages/dashboard/PartnerBookingsPage'
import EarningsPage from '@/pages/dashboard/EarningsPage'
import AdminHomePage from '@/pages/admin/AdminHomePage'
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'
import InboxPage from '@/pages/messages/InboxPage'
import NotFoundPage from '@/pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/onboarding">
            <Route path="step1" element={<ProtectedRoute><Step1TypePage /></ProtectedRoute>} />
            <Route path="step2" element={<ProtectedRoute><Step2InfoPage /></ProtectedRoute>} />
            <Route path="step3" element={<ProtectedRoute><Step3DocsPage /></ProtectedRoute>} />
            <Route path="pending" element={<ProtectedRoute><Step4PendingPage /></ProtectedRoute>} />
          </Route>

          <Route path="/booking">
            <Route path="checkout/:carId" element={
              <ProtectedRoute allowedRoles={['customer']}><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="confirmation/:bookingCode" element={
              <ProtectedRoute><ConfirmationPage /></ProtectedRoute>
            } />
            <Route path="my-bookings" element={
              <ProtectedRoute allowedRoles={['customer']}><MyBookingsPage /></ProtectedRoute>
            } />
          </Route>

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['partner']}><DashboardLayout role="partner" /></ProtectedRoute>
          }>
            <Route index element={<PartnerHomePage />} />
            <Route path="cars" element={<MyCarsPage />} />
            <Route path="cars/add" element={<AddCarPage />} />
            <Route path="bookings" element={<PartnerBookingsPage />} />
            <Route path="earnings" element={<EarningsPage />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>
          }>
            <Route index element={<AdminHomePage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
          </Route>

          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

### 7.16 `src/utils/formatters.js`
```javascript
import { format, differenceInDays } from 'date-fns'

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount)

export const formatDate = (date) =>
  format(new Date(date), 'MMM d, yyyy')

export const formatDateTime = (date) =>
  format(new Date(date), 'MMM d, yyyy h:mm a')

export const calcTotalDays = (start, end) =>
  differenceInDays(new Date(end), new Date(start))

export const calcTotal = (pricePerDay, start, end) =>
  pricePerDay * calcTotalDays(start, end)

export const STATUS_COLORS = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved:       'bg-green-100 text-green-800',
  rejected:       'bg-red-100 text-red-800',
  active:         'bg-blue-100 text-blue-800',
  completed:      'bg-gray-100 text-gray-800',
  cancelled:      'bg-red-50 text-red-600',
}
```

### 7.17 `src/utils/validators.js`
```javascript
import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email:     z.string().email('Invalid email'),
  phone:     z.string().min(10, 'Invalid phone number'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

export const carSchema = z.object({
  name:          z.string().min(2),
  brand:         z.string().min(2),
  model:         z.string().min(1),
  year:          z.number().int().min(1990).max(new Date().getFullYear() + 1),
  plate_number:  z.string().min(6),
  transmission:  z.enum(['manual', 'automatic']),
  fuel_type:     z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats:         z.number().int().min(2).max(15),
  price_per_day: z.number().positive('Price must be positive'),
  location:      z.string().min(2),
  description:   z.string().optional(),
})

export const bookingSchema = z.object({
  start_date:      z.string(),
  end_date:        z.string(),
  payment_method:  z.enum(['gcash', 'cash']),
  gcash_reference: z.string().optional(),
  special_requests:z.string().optional(),
})

export const kycSchema = z.object({
  birthday:               z.string(),
  address:                z.string().min(10),
  drivers_license_number: z.string().min(5),
  license_expiry:         z.string(),
  valid_id_type:          z.string().min(2),
})
```

---

## 8. API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create user profile after Supabase signup |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| GET | `/api/cars/` | No | List cars (with filters) |
| GET | `/api/cars/{id}/` | No | Car detail |
| GET | `/api/partner/cars/` | Partner | My cars |
| POST | `/api/partner/cars/` | Partner | Add car |
| PATCH | `/api/partner/cars/{id}/` | Partner | Update car |
| PATCH | `/api/partner/cars/{id}/toggle/` | Partner | Toggle availability |
| POST | `/api/bookings/` | Customer | Create booking |
| GET | `/api/bookings/my/` | Customer | My bookings |
| GET | `/api/partner/bookings/` | Partner | Incoming bookings |
| GET | `/api/bookings/{id}/` | Auth | Booking detail |
| PATCH | `/api/bookings/{id}/approve/` | Partner | Approve booking |
| PATCH | `/api/bookings/{id}/reject/` | Partner | Reject booking |
| PATCH | `/api/bookings/{id}/cancel/` | Customer | Cancel booking |
| POST | `/api/bookings/kyc/` | Customer | Save KYC |
| POST | `/api/partner/apply/` | Auth | Partner application |
| GET | `/api/partner/profile/` | Partner | My partner profile |
| GET | `/api/admin/partners/?status=pending` | Admin | List partner apps |
| PATCH | `/api/admin/partners/{id}/approve/` | Admin | Approve partner |
| PATCH | `/api/admin/partners/{id}/reject/` | Admin | Reject partner |
| GET | `/api/admin/stats/` | Admin | Platform stats |
| GET | `/api/admin/bookings/` | Admin | All bookings |
| GET | `/api/messages/{booking_id}/` | Auth | Get message history |
| POST | `/api/messages/` | Auth | Send message (Django writes to DB; Supabase broadcasts INSERT) |
| GET | `/api/messages/conversations/` | Auth | All conversations |
| GET | `/api/notifications/` | Auth | My notification history |
| PATCH | `/api/notifications/{id}/read/` | Auth | Mark as read |

> There are no WebSocket endpoints in v4. Real-time delivery is handled entirely by Supabase Realtime subscriptions on the frontend.

---

## 9. Supabase Realtime Architecture

### How it works

Supabase Realtime watches your PostgreSQL tables for `INSERT` events and pushes them to subscribed frontend clients automatically. Django just writes to the DB normally — no consumers, no Redis, no daphne.

```
FRONTEND (React)                        SUPABASE (PostgreSQL + Realtime)
────────────────                        ────────────────────────────────

useMessages(bookingId)
  │
  ├─ REST GET /messages/{id}/  ──────►  Django MessageListView (history)
  │
  └─ supabase.channel('chat:{id}')
       .on('postgres_changes', INSERT   ◄── Django writes Message row to DB
           table: messages,             ──► Supabase detects INSERT
           filter: booking_id=eq.{id}) ──► checks RLS policy
       .subscribe()                     ──► broadcasts payload to subscriber
           └─ setRealtimeMessages(...)       (only sender/receiver sees it)

useNotifications()
  │
  ├─ REST GET /notifications/  ──────►  Django NotificationListView (history)
  │
  └─ supabase.channel('notifications:{user_id}')
       .on('postgres_changes', INSERT   ◄── push_notification() writes row to DB
           table: notifications,        ──► Supabase detects INSERT
           filter: user_id=eq.{id})    ──► checks RLS policy
       .subscribe()                     ──► broadcasts payload to subscriber
           ├─ toast(notif.title)             (only that user sees their notif)
           ├─ setUnreadCount(prev + 1)
           └─ qc.invalidateQueries(...)
```

### Chat message flow
```
Customer types "Is the car available?" → Enter
  ▼
ChatWindow.handleSend()
  ▼
sendMessage({ content, receiverId })   → POST /api/messages/ to Django
  ▼
Django: Message.objects.create(...)    → INSERT into messages table
  ▼
Supabase Realtime detects INSERT
  ├─ RLS check: auth.uid() = sender_id OR receiver_id
  ├──► broadcast to Customer's channel subscription
  └──► broadcast to Partner's channel subscription
         ▼
       useMessages postgres_changes handler
         └─ setRealtimeMessages(prev => [...prev, newMsg])
              └─ React re-renders ChatWindow (~100ms latency)
```

### Notification push flow
```
Partner clicks "Approve Booking"
  ▼
UpdateBookingStatusView.patch()
  ├─ booking.booking_status = 'approved'
  └─ push_notification(user_id=booking.customer_id, ...)
       └─ Notification.objects.create(...)   ← DB write only
            ▼
          Supabase Realtime detects INSERT
            ├─ RLS check: auth.uid() = user_id
            └─ broadcast to Customer's channel subscription
                 ▼
               useNotifications postgres_changes handler
                 ├─ toast('Booking Approved! 🚗', ...)   ← instant
                 ├─ setUnreadCount(prev => prev + 1)     ← badge
                 └─ qc.invalidateQueries(['notifications'])
```

### Local development
```bash
# Terminal 1 — Django (WSGI with gunicorn)
cd sakyan-backend
source venv/bin/activate
python manage.py runserver 8000   # or: gunicorn sakyan.wsgi:application -p 8000

# Terminal 2 — React
cd sakyan-frontend
npm run dev
```

No Redis server needed locally. Supabase Realtime runs in the cloud — your local frontend connects directly to `wss://xxxxxxxxxx.supabase.co/realtime/v1/websocket`.

Test Supabase Realtime in browser console:
```javascript
import { supabase } from '@/config/supabase'

const channel = supabase
  .channel('test-notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => console.log('New notification:', payload.new)
  )
  .subscribe()
```

---

## 10. Day-by-Day Plan (5 Days)

### 🗓 DAY 1 — Project Setup, Supabase & Auth

#### Step 1: Create Monorepo
```bash
git clone https://github.com/yourname/Sakyan.git && cd Sakyan
mkdir sakyan-backend sakyan-frontend sakyan-app
```

#### Step 2: Supabase
1. [supabase.com](https://supabase.com) → New Project `sakyan`
2. SQL Editor → Run all SQL from Section 4
3. Storage → Create buckets: `car-images` (public), `documents` (private), `avatars` (public)
4. Copy: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `DB_*` from Settings

#### Step 3: Django Backend
```bash
cd sakyan-backend
python -m venv venv && source venv/bin/activate
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv \
  supabase whitenoise Pillow gunicorn
django-admin startproject sakyan .
python manage.py startapp api
# → copy all files from Section 6
python manage.py makemigrations api
python manage.py migrate
python manage.py runserver 8000
```

#### Step 4: React Frontend
```bash
cd ../sakyan-frontend
npm create vite@latest . -- --template react
npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools axios \
  @supabase/supabase-js react-hook-form zod @hookform/resolvers zustand lucide-react \
  react-hot-toast date-fns react-dropzone clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Step 5: Auth flow
- Login page calls `supabase.auth.signInWithPassword`
- Token stored in `localStorage` + zustand store
- `ProtectedRoute.jsx` guards private pages
- Register calls Supabase then POST `/api/auth/register`

**End of Day 1:** Login/register working, JWT hitting Django successfully, Supabase Realtime enabled on messages + notifications tables.

---

### 🗓 DAY 2 — Landing Page, Browse & Car Detail

**Backend tasks:**
- `CarListView` and `CarDetailView` working with filters
- Seed 3–5 fake cars manually in Supabase dashboard

**Frontend tasks:**
- `LandingPage.jsx` — hero + search bar + featured cars + partner CTA
- `CarsPage.jsx` — `useCars(filters)` hook + `CarGrid` + `CarFilters` sidebar
- `CarDetailPage.jsx` — `useCar(id)` hook + image gallery + booking CTA

**Key components to build:**
- `CarCard.jsx` — shows photo, name, location, price/day, Book button
- `CarFilters.jsx` — location input, price range, transmission, fuel, seats
- `CarSkeleton.jsx` — loading placeholder cards
- `CarImageGallery.jsx` — main image + thumbnail strip

**End of Day 2:** Public browsing fully working.

---

### 🗓 DAY 3 — Booking Flow & Partner Onboarding

**Backend tasks:**
- `CreateBookingView` — validate dates, calculate price, generate code
- `SaveKYCView` — upsert customer profile
- `PartnerApplyView` — save partner application

**Frontend tasks:**
- `CheckoutPage.jsx` — car summary, date picker, KYC form, payment method, `useCreateBooking()`
- `ConfirmationPage.jsx` — booking code display, next steps
- `MyBookingsPage.jsx` — `useMyBookings()` → `BookingCard` list
- Onboarding pages (Steps 1–4) — react-hook-form + Supabase Storage upload

**End of Day 3:** Full booking flow + partner onboarding working.

---

### 🗓 DAY 4 — Partner Dashboard, Admin Panel & Supabase Realtime Messaging

**Backend tasks:**
- `PartnerBookingListView` + `UpdateBookingStatusView`
- `AdminPartnerListView` + `AdminPartnerActionView`
- `AdminStatsView`
- `MessageListView` (REST history — Supabase Realtime handles push)

**Frontend tasks:**

Partner Dashboard:
- `PartnerHomePage.jsx` — stats cards
- `MyCarsPage.jsx` — table with toggle, edit, add button
- `AddCarPage.jsx` — `CarForm.jsx` with image upload
- `PartnerBookingsPage.jsx` — expandable rows with customer KYC
- `EarningsPage.jsx` — monthly summary

Admin Panel:
- `AdminHomePage.jsx` — 6 stats cards
- `AdminPartnersPage.jsx` — pending applications with approve/reject
- `AdminBookingsPage.jsx` — all bookings with status filter

Messaging (Supabase Realtime):
- `InboxPage.jsx` — left: `ConversationList`, right: `ChatWindow`
- `ChatWindow.jsx` uses `useMessages(bookingId)` — real-time via Supabase Realtime postgres_changes
- Connection status indicator (Live / Reconnecting…)
- Send with Enter key or button (disabled when disconnected)

`DashboardLayout.jsx`:
- Sidebar with nav links based on role
- Outlet for nested pages
- Top navbar with `NotificationBell` (Supabase Realtime-powered unread count), user avatar, logout

**End of Day 4:** All dashboards, real-time messaging and real-time notifications working.

---

### 🗓 DAY 5 — Polish, Testing & Deployment

#### Morning: Polish
- [ ] Error boundaries on all pages
- [ ] Empty states (`EmptyState.jsx`) for empty car lists, empty bookings
- [ ] Loading spinners on all async operations
- [ ] Mobile responsiveness (Tailwind responsive classes)
- [ ] Create first admin user: Supabase → Table Editor → `users` → set `role = 'admin'`
- [ ] Seed partner data and book a car end-to-end

#### Afternoon: Deploy

**Backend → Railway:**
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → root: `sakyan-backend`
2. Use the updated `Dockerfile` and `Procfile` (Section 11) — gunicorn, no Redis plugin needed
3. Set all env vars from Section 12
4. Run `python manage.py migrate` in Railway shell
5. Copy Railway URL → set in frontend `.env`

**Frontend → Vercel:**
1. [vercel.com](https://vercel.com) → New Project → `Sakyan` → root: `sakyan-frontend`
2. Set env vars — no `VITE_WS_BASE_URL` needed
3. Deploy → copy Vercel URL → add to Railway `CORS_ALLOWED_ORIGINS`

**End of Day 5:** Live MVP with real-time messaging and notifications via Supabase Realtime. 🎉

---

## 11. Deployment Guide

### `sakyan-backend/Dockerfile`
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

# gunicorn (WSGI) — daphne and Redis are no longer needed
CMD ["gunicorn", "sakyan.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
```

### `sakyan-backend/Procfile`
```
web: gunicorn sakyan.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

### `sakyan-frontend/vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 12. Environment Variables

### `sakyan-backend/.env`
```env
DJANGO_SECRET_KEY=your-very-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-railway-app.up.railway.app,localhost

# Supabase DB (Settings → Database → Connection String)
DB_HOST=db.xxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-db-password

# Supabase API keys (Settings → API)
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...   # ← Secret! Never expose this

CORS_ALLOWED_ORIGINS=https://sakyan.vercel.app,http://localhost:5173

# No REDIS_URL — Redis is removed in v4
```

### `sakyan-frontend/.env`
```env
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# No VITE_WS_BASE_URL — Supabase Realtime connects via the supabase-js client automatically
```

For local dev, same — no WebSocket URL needed. The Supabase client connects directly to `wss://xxxxxxxxxx.supabase.co`.

### `.gitignore` (root)
```
# Environment
.env
*.env
.env.local
.env.*.local

# Python
__pycache__/
*.pyc
venv/
.venv/
sakyan-backend/staticfiles/

# Node
node_modules/
dist/
.DS_Store

# IDE
.vscode/
.idea/
```

---

## 13. Post-MVP Roadmap

### Phase 2 (Week 2–3)
- Email notifications (Resend + Supabase Edge Functions)
- PayMongo integration (GCash, Maya, credit card)
- Car availability calendar blocking
- Reviews and ratings
- Map search (Google Maps or Mapbox)

### Phase 3 (Month 2)
- Flutter mobile app (`sakyan-app/`)
- Automated monthly commission invoicing (PDF)
- SMS notifications (Semaphore PH)
- Analytics dashboard with charts (Chart.js or Recharts)

### Phase 4 (Scaling)
- Multi-branch support per partner
- Car damage reporting flow
- Promo codes and seasonal pricing
- Insurance integration
- SEO-optimized server-side rendering (Next.js migration)

---

## 🎯 5-Day Master Checklist

```
DAY 1 ✅ Setup & Auth
  □ Monorepo scaffolded on GitHub
  □ Supabase: all 8 tables created, 3 storage buckets
  □ Supabase: REPLICA IDENTITY FULL set on messages + notifications tables, Realtime enabled
  □ Django: models, serializers, auth middleware, urls
  □ React: Vite project, Tailwind, axios, react-query, zustand
  □ Login/register pages working with Supabase + Django profile creation

DAY 2 ✅ Browse & Cars
  □ CarListView + CarDetailView backend endpoints working
  □ LandingPage: hero, search, featured cars, partner CTA
  □ CarsPage: grid, filters sidebar, loading skeletons
  □ CarDetailPage: gallery, specs, book button

DAY 3 ✅ Booking & Onboarding
  □ Booking create endpoint + KYC save endpoint
  □ CheckoutPage: date picker, price calc, KYC form, file upload, payment choice
  □ ConfirmationPage: booking code display
  □ MyBookingsPage: list with status badges
  □ Partner onboarding: 4 steps fully working

DAY 4 ✅ Dashboards, Messaging & Real-time
  □ Partner: my cars, add car with photos, incoming bookings + customer KYC view
  □ Partner: approve/reject bookings (triggers push_notification)
  □ Admin: stats, partner approval, all bookings view
  □ Supabase Realtime messaging: ChatWindow shows "Live" indicator, no polling
  □ Supabase Realtime notifications: bell badge updates in real-time on approval/rejection

DAY 5 ✅ Polish & Deploy
  □ Empty states on all pages
  □ Mobile responsive check
  □ Backend live on Railway with gunicorn (migrate done, no Redis plugin needed)
  □ Frontend live on Vercel (no VITE_WS_BASE_URL needed)
  □ Admin account created manually
  □ End-to-end smoke test: book a car, approve it, see instant Supabase Realtime notification
  □ CORS settings verified
```

---

## ⚡ First Commands — Run These Now

```bash
# 1. Scaffold the monorepo
git clone https://github.com/yourname/Sakyan.git && cd Sakyan
mkdir sakyan-app

# 2. Django backend
cd sakyan-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install django djangorestframework django-cors-headers \
  psycopg2-binary python-dotenv supabase whitenoise Pillow gunicorn
pip freeze > requirements.txt
django-admin startproject sakyan .
python manage.py startapp api
# → Build all files from Section 6
python manage.py makemigrations api
python manage.py migrate
python manage.py runserver 8000  # → http://localhost:8000

# 3. React frontend
cd ../sakyan-frontend
npm create vite@latest . -- --template react
npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools \
  axios @supabase/supabase-js react-hook-form zod @hookform/resolvers \
  zustand lucide-react react-hot-toast date-fns react-dropzone clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# → Build all files from Section 7
npm run dev                      # → http://localhost:5173

# 4. First commit
cd ..
git add .
git commit -m "chore: initialize Sakyan monorepo — Django REST + Supabase Realtime + React Vite"
git push origin main
```

---

*Sakyan — Ride the future, power small businesses.* 🚗🇵🇭
