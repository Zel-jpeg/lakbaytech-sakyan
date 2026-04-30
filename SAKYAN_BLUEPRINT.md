# 🚗 SAKYAN — Car Rental Platform Blueprint
> Airbnb for Cars | MVP in 5 Days | PHP + Bootstrap 5 + Supabase + Railway + Vercel

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Database Schema (Supabase)](#database-schema)
5. [Role System](#role-system)
6. [Feature Breakdown (MVP)](#feature-breakdown-mvp)
7. [Day-by-Day Plan (5 Days)](#day-by-day-plan)
8. [API Endpoints](#api-endpoints)
9. [Deployment Guide](#deployment-guide)
10. [Environment Variables](#environment-variables)
11. [Post-MVP Roadmap](#post-mvp-roadmap)

---

## 1. Project Overview

**Sakyan** is a centralized car rental marketplace for small to medium car rental companies in the Philippines. Think Airbnb but for cars.

### Business Model
- Rental companies list their cars on Sakyan
- Sakyan takes **8–12% commission** of monthly income generated through the platform
- Customers browse, book, and pay via the platform

### User Roles
| Role | Description |
|------|-------------|
| **Customer** | Browses and books cars, uploads license |
| **Partner/Company** | Lists cars, manages bookings, receives customer info |
| **Admin (Sakyan)** | Approves partners, oversees platform, resolves disputes |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Bootstrap 5, Vanilla CSS, Vanilla JS |
| Backend | PHP 8.2 (REST API) |
| Database | Supabase (PostgreSQL + Storage + Auth) |
| File Storage | Supabase Storage (driver's licenses, car photos) |
| Hosting (Backend) | Railway |
| Hosting (Frontend) | Vercel |
| Mobile (Later) | Flutter |
| Auth | Supabase Auth (JWT) |
| Payments | GCash (manual reference) + Cash on pickup |
| Messaging | In-platform (stored in Supabase) |

---

## 3. Monorepo Structure

```
Sakyan/                          ← Root of GitHub monorepo
│
├── README.md                    ← Project overview
├── .gitignore
├── .env.example                 ← Template for env vars
│
├── sakyan-backend/              ← PHP REST API → deployed on Railway
│   ├── .env
│   ├── composer.json
│   ├── index.php                ← Entry point / router
│   ├── Dockerfile               ← For Railway deployment
│   │
│   ├── config/
│   │   ├── database.php         ← Supabase DB connection (PDO/pg)
│   │   ├── supabase.php         ← Supabase client config
│   │   └── cors.php             ← CORS headers
│   │
│   ├── middleware/
│   │   ├── AuthMiddleware.php   ← Validate Supabase JWT
│   │   └── RoleMiddleware.php   ← Check user role
│   │
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── UserController.php
│   │   ├── CarController.php
│   │   ├── BookingController.php
│   │   ├── PartnerController.php
│   │   ├── AdminController.php
│   │   ├── MessageController.php
│   │   └── PaymentController.php
│   │
│   ├── models/
│   │   ├── User.php
│   │   ├── Car.php
│   │   ├── Booking.php
│   │   ├── Partner.php
│   │   └── Message.php
│   │
│   ├── routes/
│   │   ├── auth.php
│   │   ├── cars.php
│   │   ├── bookings.php
│   │   ├── partners.php
│   │   ├── admin.php
│   │   └── messages.php
│   │
│   ├── helpers/
│   │   ├── Response.php         ← JSON response helper
│   │   ├── Validator.php
│   │   └── FileUpload.php       ← Supabase Storage upload helper
│   │
│   └── uploads/                 ← Temporary local (use Supabase Storage instead)
│
├── sakyan-frontend/             ← Static HTML/CSS/JS → deployed on Vercel
│   ├── vercel.json              ← Vercel routing config
│   ├── .env.example
│   │
│   ├── public/
│   │   ├── index.html           ← Landing page
│   │   ├── favicon.ico
│   │   └── assets/
│   │       ├── css/
│   │       │   ├── main.css     ← Global styles
│   │       │   ├── components.css
│   │       │   └── pages/
│   │       │       ├── landing.css
│   │       │       ├── dashboard.css
│   │       │       ├── booking.css
│   │       │       └── admin.css
│   │       ├── js/
│   │       │   ├── config.js    ← API base URL, Supabase keys
│   │       │   ├── auth.js      ← Login/register/session
│   │       │   ├── api.js       ← Fetch wrapper for backend
│   │       │   ├── car-listing.js
│   │       │   ├── booking.js
│   │       │   ├── messaging.js
│   │       │   └── utils.js
│   │       └── img/
│   │           ├── logo.svg
│   │           └── hero-car.png
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   ├── register.html
│   │   │   └── forgot-password.html
│   │   │
│   │   ├── onboarding/          ← Partner onboarding flow
│   │   │   ├── step1-type.html       ← Individual vs Company
│   │   │   ├── step2-info.html       ← Business info
│   │   │   ├── step3-docs.html       ← Upload docs/permits
│   │   │   └── step4-pending.html    ← Waiting for admin approval
│   │   │
│   │   ├── browse/
│   │   │   ├── cars.html        ← Browse all cars
│   │   │   └── car-detail.html  ← Single car page
│   │   │
│   │   ├── booking/
│   │   │   ├── checkout.html    ← Book a car form + license upload
│   │   │   ├── confirmation.html
│   │   │   └── my-bookings.html ← Customer's booking history
│   │   │
│   │   ├── dashboard/           ← Partner dashboard
│   │   │   ├── partner-home.html
│   │   │   ├── my-cars.html
│   │   │   ├── add-car.html
│   │   │   ├── edit-car.html
│   │   │   ├── bookings.html    ← Incoming bookings + customer info
│   │   │   └── earnings.html
│   │   │
│   │   ├── messages/
│   │   │   └── inbox.html       ← Messaging between customer & partner
│   │   │
│   │   └── admin/
│   │       ├── admin-home.html
│   │       ├── partners.html    ← Approve/reject partner applications
│   │       ├── bookings.html    ← All bookings overview
│   │       ├── users.html
│   │       └── reports.html
│   │
│   └── components/              ← Reusable HTML snippets (loaded via JS)
│       ├── navbar.html
│       ├── footer.html
│       ├── car-card.html
│       └── booking-card.html
│
└── sakyan-app/                  ← Flutter mobile app (POST-MVP)
    ├── README.md
    └── (Flutter project files later)
```

---

## 4. Database Schema

> Create all tables in **Supabase → Table Editor** or via SQL Editor.

### 4.1 `users` (extends Supabase Auth)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 `partners` (Partner/Company profile)
```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  partner_type VARCHAR(20) CHECK (partner_type IN ('individual', 'company')),
  -- individual = 1-3 cars, company = 4+ cars
  business_address TEXT,
  business_permit_url TEXT,
  government_id_url TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  commission_rate DECIMAL(4,2) DEFAULT 10.00, -- 8-12%
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `cars`
```sql
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,          -- e.g. "Toyota Vios 2022"
  brand VARCHAR(100),
  model VARCHAR(100),
  year INT,
  plate_number VARCHAR(20) UNIQUE,
  transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic')),
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  seats INT DEFAULT 5,
  color VARCHAR(50),
  price_per_day DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),              -- City/area
  description TEXT,
  features TEXT[],                    -- ['A/C', 'GPS', 'Dashcam']
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'booked')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 `car_images`
```sql
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `customer_profiles` (KYC info for booking)
```sql
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  birthday DATE,
  address TEXT,
  drivers_license_number VARCHAR(50),
  drivers_license_url TEXT,           -- Supabase Storage URL
  license_expiry DATE,
  valid_id_type VARCHAR(100),
  valid_id_url TEXT,
  selfie_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,  -- Auto-verified or admin-verified
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(20) UNIQUE,    -- e.g. SKY-20240501-001
  car_id UUID REFERENCES cars(id),
  customer_id UUID REFERENCES users(id),
  partner_id UUID REFERENCES partners(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_location TEXT,
  return_location TEXT,
  total_days INT,
  price_per_day DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_method VARCHAR(20) CHECK (payment_method IN ('gcash', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  gcash_reference VARCHAR(100),       -- GCash ref number if applicable
  booking_status VARCHAR(30) DEFAULT 'pending_review'
    CHECK (booking_status IN (
      'pending_review',   -- Customer submitted, waiting
      'approved',         -- Partner/admin approved
      'rejected',         -- Partner/admin rejected
      'active',           -- Car is currently with customer
      'completed',        -- Returned
      'cancelled'         -- Cancelled by customer or partner
    )),
  special_requests TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7 `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),  -- 'booking', 'approval', 'message', 'payment'
  is_read BOOLEAN DEFAULT FALSE,
  reference_id UUID,  -- booking_id or partner_id etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.9 Row Level Security (RLS) — Enable in Supabase
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see their own profile
CREATE POLICY "Users view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Partners can see all approved cars
CREATE POLICY "Anyone can view active cars"
ON cars FOR SELECT
USING (status = 'active' AND is_available = TRUE);
```

---

## 5. Role System

```
GUEST (not logged in)
  → Can browse cars (view only)
  → Cannot book

CUSTOMER (logged in, role = 'customer')
  → Browse & search cars
  → Submit booking (with KYC/license upload)
  → View own bookings
  → Message partner about a booking

PARTNER (logged in, role = 'partner', partner.status = 'approved')
  → List and manage cars
  → See incoming bookings with customer info
  → Approve/reject bookings
  → Message customers
  → View earnings dashboard

ADMIN (logged in, role = 'admin')
  → Approve/reject partner applications
  → View all bookings, users, partners
  → Suspend accounts
  → View platform-wide reports
```

---

## 6. Feature Breakdown (MVP)

### ✅ Must-Have for MVP (5 Days)

#### Authentication
- [ ] Register (email + password via Supabase Auth)
- [ ] Login / Logout
- [ ] Role-based redirect after login

#### Landing Page
- [ ] Hero section with search bar (location, date range)
- [ ] Featured cars section
- [ ] How it works section
- [ ] "Start Listing" CTA button

#### Partner Onboarding (Multi-step form)
- [ ] Step 1: Choose type → **Individual** (1–3 cars) or **Company** (4+ cars)
- [ ] Step 2: Fill in business info (name, address, contact)
- [ ] Step 3: Upload documents (business permit / gov ID)
- [ ] Step 4: Pending approval screen

#### Car Browsing
- [ ] Grid of available cars with filters (location, price, transmission)
- [ ] Car detail page (photos, specs, price, owner info)
- [ ] Search by location

#### Booking Flow
- [ ] Click "Book Now" → redirect to login if not logged in
- [ ] Upload driver's license + valid ID (first time only, saved to profile)
- [ ] Select dates → calculate total
- [ ] Choose payment: GCash or Cash
- [ ] Submit booking → status: `pending_review`
- [ ] Booking confirmation page with booking code

#### Customer Dashboard
- [ ] My Bookings list (with statuses)
- [ ] Booking detail page

#### Partner Dashboard
- [ ] My Cars (add, edit, toggle availability)
- [ ] Incoming Bookings → view customer details (name, license, ID, contact)
- [ ] Approve or Reject bookings
- [ ] Earnings summary

#### Messaging
- [ ] Simple inbox per booking
- [ ] Send/receive messages between customer and partner

#### Admin Panel
- [ ] View all partner applications → Approve / Reject
- [ ] View all bookings
- [ ] View all users
- [ ] Basic stats (total bookings, revenue, active partners)

---

## 7. Day-by-Day Plan (5 Days)

---

### 🗓 DAY 1 — Setup, Auth & Database

#### Morning: Project Setup
```bash
# 1. Create GitHub repo
# Go to GitHub → New Repository → Name: Sakyan
# Initialize with README

# 2. Clone and set up folder structure
git clone https://github.com/yourusername/Sakyan.git
cd Sakyan
mkdir sakyan-backend sakyan-frontend sakyan-app
```

#### Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project → name it `sakyan`
2. Go to **SQL Editor** → paste and run all the SQL from Section 4 (tables)
3. Go to **Storage** → Create buckets:
   - `car-images` (public)
   - `documents` (private — for licenses and IDs)
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from **Settings → API**

#### Backend Setup (PHP)
```
sakyan-backend/
```
```php
// sakyan-backend/config/database.php
<?php
function getDB() {
    $host = getenv('DB_HOST');
    $db   = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');
    $port = getenv('DB_PORT') ?: '5432';

    try {
        $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB connection failed']);
        exit;
    }
}
```

```php
// sakyan-backend/config/cors.php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
```

```php
// sakyan-backend/helpers/Response.php
<?php
class Response {
    public static function json($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
    public static function error($message, $status = 400) {
        self::json(['error' => $message], $status);
    }
    public static function success($data, $message = 'Success') {
        self::json(['message' => $message, 'data' => $data]);
    }
}
```

```php
// sakyan-backend/middleware/AuthMiddleware.php
<?php
require_once __DIR__ . '/../config/database.php';

function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        Response::error('Unauthorized', 401);
    }

    $token = substr($authHeader, 7);
    $supabaseUrl = getenv('SUPABASE_URL');
    $supabaseKey = getenv('SUPABASE_SERVICE_KEY');

    // Validate token with Supabase
    $ch = curl_init("$supabaseUrl/auth/v1/user");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $token",
            "apikey: $supabaseKey"
        ]
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!isset($res['id'])) {
        Response::error('Invalid or expired token', 401);
    }

    // Get user from DB
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$res['id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

```php
// sakyan-backend/index.php — Main router
<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/helpers/Response.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Route matching
$routes = [
    '/api/auth'     => __DIR__ . '/routes/auth.php',
    '/api/cars'     => __DIR__ . '/routes/cars.php',
    '/api/bookings' => __DIR__ . '/routes/bookings.php',
    '/api/partners' => __DIR__ . '/routes/partners.php',
    '/api/admin'    => __DIR__ . '/routes/admin.php',
    '/api/messages' => __DIR__ . '/routes/messages.php',
];

foreach ($routes as $prefix => $file) {
    if (str_starts_with($uri, $prefix)) {
        require $file;
        exit;
    }
}

Response::error('Route not found', 404);
```

#### Frontend: Auth Pages
```
sakyan-frontend/pages/auth/login.html
sakyan-frontend/pages/auth/register.html
sakyan-frontend/public/assets/js/auth.js
```

```javascript
// sakyan-frontend/public/assets/js/config.js
const CONFIG = {
    API_BASE: 'https://your-railway-app.up.railway.app/api',
    SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
};
```

```javascript
// sakyan-frontend/public/assets/js/auth.js
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

async function login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Get user role from your DB
    const token = data.session.access_token;
    localStorage.setItem('sakyan_token', token);

    // Redirect based on role
    const user = await fetchUserProfile(token);
    redirectByRole(user.role);
}

async function register(email, password, fullName, phone) {
    const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    // After sign up, insert into users table via backend
    await fetch(`${CONFIG.API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, user_id: data.user.id, email })
    });
    return data;
}

function redirectByRole(role) {
    const redirects = {
        admin: '/pages/admin/admin-home.html',
        partner: '/pages/dashboard/partner-home.html',
        customer: '/pages/browse/cars.html'
    };
    window.location.href = redirects[role] || '/pages/browse/cars.html';
}

function logout() {
    supabaseClient.auth.signOut();
    localStorage.removeItem('sakyan_token');
    window.location.href = '/';
}
```

---

### 🗓 DAY 2 — Landing Page, Browse Cars & Car Detail

#### Landing Page (`index.html`)
Structure:
- Navbar (logo, Login, Register, "Start Listing" button)
- Hero section with big search bar (location dropdown, date pickers, Search button)
- "How Sakyan Works" — 3 steps: Browse → Book → Drive
- Featured Cars grid (fetch from API)
- Partner CTA section: "Have a car? Start earning"
- Footer

#### Car Listing Page (`pages/browse/cars.html`)
- Sidebar filters: Location, Price range, Transmission, Seats, Fuel type
- Car grid cards:
  ```
  [Car Photo]
  Toyota Vios 2022
  ⭐ Makati, Metro Manila
  PHP 1,500 / day
  [Book Now]
  ```
- Pagination or infinite scroll

#### Car Detail Page (`pages/browse/car-detail.html`)
- Image gallery (primary + thumbnails)
- Car specs (brand, year, seats, fuel, transmission)
- Price per day
- Owner/company name and location
- Availability calendar (simple date picker)
- "Book Now" button → goes to checkout or login

```javascript
// sakyan-frontend/public/assets/js/api.js
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('sakyan_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// Get all cars
async function getCars(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/cars?${params}`);
}

// Get single car
async function getCar(id) {
    return apiFetch(`/cars/${id}`);
}
```

```php
// sakyan-backend/routes/cars.php
<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

$db = getDB();
$uriParts = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
$carId = $uriParts[2] ?? null; // /api/cars/{id}

if ($method === 'GET' && !$carId) {
    // List cars with filters
    $location = $_GET['location'] ?? null;
    $maxPrice = $_GET['max_price'] ?? null;
    
    $query = "SELECT c.*, ci.image_url AS primary_image, p.business_name 
              FROM cars c 
              LEFT JOIN car_images ci ON ci.car_id = c.id AND ci.is_primary = TRUE
              LEFT JOIN partners p ON p.id = c.partner_id
              WHERE c.status = 'active' AND c.is_available = TRUE";
    
    $params = [];
    if ($location) { $query .= " AND c.location ILIKE ?"; $params[] = "%$location%"; }
    if ($maxPrice) { $query .= " AND c.price_per_day <= ?"; $params[] = $maxPrice; }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $carId) {
    $stmt = $db->prepare("
        SELECT c.*, p.business_name, p.contact_phone,
               json_agg(ci.image_url) AS images
        FROM cars c
        LEFT JOIN car_images ci ON ci.car_id = c.id
        LEFT JOIN partners p ON p.id = c.partner_id
        WHERE c.id = ?
        GROUP BY c.id, p.business_name, p.contact_phone
    ");
    $stmt->execute([$carId]);
    $car = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$car) Response::error('Car not found', 404);
    Response::success($car);
}
```

---

### 🗓 DAY 3 — Booking Flow & Partner Onboarding

#### Booking Flow

**Step 1: Checkout Page** (`pages/booking/checkout.html`)
- Show car summary (name, photo, price/day)
- Date picker: start date → end date (calculate total days & price)
- Payment method: GCash (enter reference number) or Cash
- Special requests textarea
- KYC Section (if first booking):
  - Full name, Birthday, Address
  - Upload Driver's License (front photo)
  - Upload Valid ID
- Submit → POST to `/api/bookings`

**Step 2: Confirmation** (`pages/booking/confirmation.html`)
- Show booking code (e.g., `SKY-20240501-001`)
- Status: "Pending Review"
- What to expect next (message from partner, confirmation, etc.)

```javascript
// sakyan-frontend/public/assets/js/booking.js
async function submitBooking(formData) {
    // 1. Upload files to Supabase Storage
    const licenseUrl = await uploadFile(formData.licenseFile, 'documents');
    const idUrl = await uploadFile(formData.idFile, 'documents');

    // 2. Save customer profile (KYC)
    await apiFetch('/bookings/kyc', {
        method: 'POST',
        body: JSON.stringify({
            birthday: formData.birthday,
            address: formData.address,
            drivers_license_number: formData.licenseNumber,
            drivers_license_url: licenseUrl,
            valid_id_url: idUrl
        })
    });

    // 3. Create booking
    const booking = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
            car_id: formData.carId,
            start_date: formData.startDate,
            end_date: formData.endDate,
            payment_method: formData.paymentMethod,
            gcash_reference: formData.gcashRef || null,
            special_requests: formData.specialRequests
        })
    });

    window.location.href = `/pages/booking/confirmation.html?code=${booking.data.booking_code}`;
}

async function uploadFile(file, bucket) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
}
```

```php
// sakyan-backend/routes/bookings.php (key parts)
<?php
if ($method === 'POST' && $uri === '/api/bookings') {
    $user = getAuthUser();
    $body = json_decode(file_get_contents('php://input'), true);
    
    // Calculate total
    $start = new DateTime($body['start_date']);
    $end   = new DateTime($body['end_date']);
    $days  = $start->diff($end)->days;
    
    // Get car price
    $stmt = $db->prepare("SELECT price_per_day, partner_id FROM cars WHERE id = ?");
    $stmt->execute([$body['car_id']]);
    $car = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $subtotal = $car['price_per_day'] * $days;
    $commission = $subtotal * 0.10; // 10%
    $total = $subtotal;
    
    $bookingCode = 'SKY-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
    
    $stmt = $db->prepare("
        INSERT INTO bookings (booking_code, car_id, customer_id, partner_id,
            start_date, end_date, total_days, price_per_day, subtotal,
            commission_amount, total_amount, payment_method, gcash_reference,
            special_requests, booking_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')
        RETURNING *
    ");
    $stmt->execute([
        $bookingCode, $body['car_id'], $user['id'], $car['partner_id'],
        $body['start_date'], $body['end_date'], $days, $car['price_per_day'],
        $subtotal, $commission, $total, $body['payment_method'],
        $body['gcash_reference'] ?? null, $body['special_requests'] ?? null
    ]);
    
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    Response::success($booking, 'Booking submitted successfully');
}
```

#### Partner Onboarding Flow

**Step 1** (`step1-type.html`): Two big cards
- 🚗 **Individual** — "I have 1–3 personal cars I want to rent out"
- 🏢 **Company** — "I run a car rental business with 4+ vehicles"
- Click one → save to `sessionStorage` → go to Step 2

**Step 2** (`step2-info.html`): Business info form
- Business/Trade name
- Complete address
- Contact person name & phone
- Email (pre-filled from account)

**Step 3** (`step3-docs.html`): Document upload
- For Individual: Government-issued ID
- For Company: DTI/SEC Registration + Mayor's Permit + Owner's ID
- Upload → stored in Supabase Storage

**Step 4** (`step4-pending.html`): Waiting screen
- "Your application is under review"
- "We'll notify you within 24–48 hours"
- Show submitted info summary

```php
// sakyan-backend/routes/partners.php
<?php
if ($method === 'POST' && $uri === '/api/partners/apply') {
    $user = getAuthUser();
    $body = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $db->prepare("
        INSERT INTO partners (user_id, business_name, partner_type, business_address,
            business_permit_url, government_id_url, contact_person, contact_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        RETURNING id
    ");
    $stmt->execute([
        $user['id'], $body['business_name'], $body['partner_type'],
        $body['business_address'], $body['business_permit_url'] ?? null,
        $body['government_id_url'], $body['contact_person'], $body['contact_phone']
    ]);
    
    Response::success(['status' => 'pending'], 'Application submitted! Awaiting admin approval.');
}
```

---

### 🗓 DAY 4 — Dashboards (Partner + Admin) & Messaging

#### Partner Dashboard

**My Cars** (`pages/dashboard/my-cars.html`)
- Table/grid of their listed cars
- Status badge (Active / Inactive)
- Edit button, Toggle availability toggle
- "+ Add New Car" button

**Add Car Form** (`pages/dashboard/add-car.html`)
- Car name, brand, model, year
- Plate number, color
- Transmission (Manual/Automatic), Fuel type, Seats
- Price per day (PHP)
- Location / Area
- Description
- Features checkboxes (A/C, GPS, Dashcam, Child Seat, etc.)
- Upload photos (up to 5, first = primary)

**Incoming Bookings** (`pages/dashboard/bookings.html`)
- Table with columns: Booking Code | Customer | Car | Dates | Amount | Status | Actions
- Click row → expand customer info:
  - Full name, Birthday, Phone, Email
  - Driver's license photo (viewable)
  - Valid ID photo
  - Payment method & reference
- Buttons: ✅ Approve | ❌ Reject | 💬 Message Customer

**Earnings** (`pages/dashboard/earnings.html`)
- Monthly summary: Total bookings, Gross income, Sakyan commission (10%), Net earnings
- Table of all completed bookings with amounts

#### Admin Panel

**Partner Applications** (`pages/admin/partners.html`)
- List of pending applications
- Click to view full details + uploaded documents
- "Approve" → update partner status + update user role to 'partner'
- "Reject" → ask for reason → send notification

**All Bookings** (`pages/admin/bookings.html`)
- Filter by status, date range, partner
- View full details

```php
// sakyan-backend/routes/admin.php
<?php
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
$admin = getAuthUser();
if ($admin['role'] !== 'admin') Response::error('Forbidden', 403);

// GET /api/admin/partners?status=pending
if ($method === 'GET' && str_contains($uri, '/api/admin/partners')) {
    $status = $_GET['status'] ?? 'pending';
    $stmt = $db->prepare("
        SELECT p.*, u.full_name, u.email, u.phone
        FROM partners p
        JOIN users u ON u.id = p.user_id
        WHERE p.status = ?
        ORDER BY p.created_at DESC
    ");
    $stmt->execute([$status]);
    Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// PATCH /api/admin/partners/{id}/approve
if ($method === 'PATCH' && preg_match('#/api/admin/partners/([^/]+)/approve#', $uri, $matches)) {
    $partnerId = $matches[1];
    
    // Get user_id from partner
    $stmt = $db->prepare("SELECT user_id FROM partners WHERE id = ?");
    $stmt->execute([$partnerId]);
    $partner = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update partner status
    $db->prepare("UPDATE partners SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?")
       ->execute([$admin['id'], $partnerId]);
    
    // Update user role
    $db->prepare("UPDATE users SET role = 'partner' WHERE id = ?")
       ->execute([$partner['user_id']]);
    
    // Create notification for the partner
    $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'approval')")
       ->execute([$partner['user_id'], 'Application Approved! 🎉', 'Congratulations! Your Sakyan partner application has been approved. You can now start listing your cars.']);
    
    Response::success(null, 'Partner approved successfully');
}
```

#### Messaging

**Inbox** (`pages/messages/inbox.html`)
- Left sidebar: List of booking conversations
- Right: Chat window with messages
- Real-time feel: poll every 5 seconds (or use Supabase Realtime)

```javascript
// sakyan-frontend/public/assets/js/messaging.js
async function loadMessages(bookingId) {
    const data = await apiFetch(`/messages/${bookingId}`);
    renderMessages(data.data);
}

async function sendMessage(bookingId, content) {
    await apiFetch(`/messages`, {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, content })
    });
}

// Poll for new messages every 5s
setInterval(() => {
    if (currentBookingId) loadMessages(currentBookingId);
}, 5000);
```

---

### 🗓 DAY 5 — Polish, Testing & Deployment

#### Morning: Bug Fixes & UI Polish
- [ ] Test full booking flow end-to-end
- [ ] Test partner onboarding + admin approval
- [ ] Test messaging
- [ ] Mobile responsiveness check (Bootstrap breakpoints)
- [ ] Add loading states to all async buttons
- [ ] Add error toast notifications

#### Navbar Component
```javascript
// Load navbar dynamically
async function loadComponent(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(url);
    el.innerHTML = await res.text();
    
    // Update nav based on auth state
    const token = localStorage.getItem('sakyan_token');
    if (token) {
        document.getElementById('auth-buttons')?.classList.add('d-none');
        document.getElementById('user-menu')?.classList.remove('d-none');
    }
}
loadComponent('#navbar-placeholder', '/components/navbar.html');
```

#### Afternoon: Deployment

---

## 8. API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login (return JWT) | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Cars
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cars` | List all cars (with filters) | No |
| GET | `/api/cars/{id}` | Get car detail | No |
| POST | `/api/cars` | Add new car | Partner |
| PUT | `/api/cars/{id}` | Update car | Partner (owner) |
| PATCH | `/api/cars/{id}/toggle` | Toggle availability | Partner |
| DELETE | `/api/cars/{id}` | Delete car | Partner (owner) |

### Bookings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bookings` | Create booking | Customer |
| GET | `/api/bookings/my` | My bookings (customer) | Customer |
| GET | `/api/bookings/partner` | Incoming bookings | Partner |
| GET | `/api/bookings/{id}` | Booking detail | Customer/Partner |
| PATCH | `/api/bookings/{id}/approve` | Approve booking | Partner |
| PATCH | `/api/bookings/{id}/reject` | Reject booking | Partner |
| PATCH | `/api/bookings/{id}/cancel` | Cancel booking | Customer |
| POST | `/api/bookings/kyc` | Save customer KYC | Customer |

### Partners
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/partners/apply` | Submit partner application | Customer |
| GET | `/api/partners/me` | My partner profile | Partner |
| PUT | `/api/partners/me` | Update partner info | Partner |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/partners` | List partner applications | Admin |
| PATCH | `/api/admin/partners/{id}/approve` | Approve partner | Admin |
| PATCH | `/api/admin/partners/{id}/reject` | Reject partner | Admin |
| GET | `/api/admin/bookings` | All bookings | Admin |
| GET | `/api/admin/users` | All users | Admin |
| GET | `/api/admin/stats` | Platform stats | Admin |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/{booking_id}` | Get messages for booking | Customer/Partner |
| POST | `/api/messages` | Send message | Customer/Partner |
| GET | `/api/messages/conversations` | All conversations | Customer/Partner |

---

## 9. Deployment Guide

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `Sakyan` repo → Set **Root Directory** to `sakyan-backend`
3. Add a `Dockerfile` in `sakyan-backend/`:

```dockerfile
FROM php:8.2-apache

RUN apt-get update && apt-get install -y libpq-dev curl \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite

COPY . /var/www/html/

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

EXPOSE 80
```

4. Add `.htaccess` in `sakyan-backend/`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

5. Add Environment Variables in Railway (see Section 10)
6. Deploy → copy your Railway URL (e.g., `https://sakyan-backend.up.railway.app`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub `Sakyan`
2. Set **Root Directory** to `sakyan-frontend`
3. Framework Preset: **Other** (static)
4. Add `vercel.json` in `sakyan-frontend/`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

5. Add Environment Variables in Vercel (see Section 10)
6. Deploy → your frontend is live at `https://sakyan.vercel.app`

---

## 10. Environment Variables

### Backend (`sakyan-backend/.env`)
```env
# Database (from Supabase → Settings → Database)
DB_HOST=db.xxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-db-password

# Supabase
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key  ← Keep secret!

# App
APP_ENV=production
FRONTEND_URL=https://sakyan.vercel.app
```

### Frontend (`sakyan-frontend/.env.example`)
```env
# These are injected into config.js at build time
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_BASE_URL=https://sakyan-backend.up.railway.app/api
```

> ⚠️ **NEVER commit `.env` files.** Add them to `.gitignore`.

### `.gitignore` (root level)
```
*.env
.env
.env.local
node_modules/
vendor/
__pycache__/
.DS_Store
*.log
```

---

## 11. Post-MVP Roadmap

### Phase 2 (Week 2–3)
- [ ] Email notifications (booking confirmed, approved, etc.) via Supabase Edge Functions or Resend
- [ ] GCash integration (PayMongo or Paymaya)
- [ ] Review & rating system for cars and drivers
- [ ] Calendar blocking (unavailable dates per car)
- [ ] Search with map (Google Maps or Mapbox)

### Phase 3 (Month 2)
- [ ] Flutter mobile app (sakyan-app/)
- [ ] Partner analytics (monthly reports, charts)
- [ ] Automated commission invoicing
- [ ] SMS notifications (Semaphore PH or Vonage)
- [ ] Admin revenue dashboard with charts

### Phase 4 (Scaling)
- [ ] Insurance integration
- [ ] Car damage reporting flow
- [ ] Multiple locations / branches per partner
- [ ] Promo codes and discounts system
- [ ] SEO optimized car listing pages

---

## 🎯 Quick Reference — 5-Day Checklist

```
DAY 1 ✅
  □ GitHub monorepo created
  □ Supabase project created, all tables created
  □ PHP backend scaffolded (config, helpers, middleware, index.php)
  □ Login and Register pages working
  □ JWT auth flow working

DAY 2 ✅
  □ Landing page complete (hero, search, featured cars, partner CTA)
  □ Browse cars page with filters
  □ Car detail page
  □ Cars API endpoints working

DAY 3 ✅
  □ Booking checkout page with file upload
  □ Booking API (create, list)
  □ Customer profile / KYC save
  □ Partner onboarding 4-step flow (UI + API)

DAY 4 ✅
  □ Partner dashboard (my cars, add car, incoming bookings)
  □ Admin panel (approve/reject partners, view bookings)
  □ Messaging (inbox + send)
  □ Notifications table seeded

DAY 5 ✅
  □ End-to-end testing of full flow
  □ Mobile responsiveness
  □ Backend deployed on Railway
  □ Frontend deployed on Vercel
  □ Smoke test on live URLs
  □ Create admin account manually in Supabase
```

---

## 🛠 First Commands to Run

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/Sakyan.git
cd Sakyan

# 2. Create folder structure
mkdir -p sakyan-backend/{config,middleware,controllers,models,routes,helpers}
mkdir -p sakyan-frontend/{public/assets/{css/pages,js,img},pages/{auth,onboarding,browse,booking,dashboard,messages,admin},components}
mkdir sakyan-app

# 3. Initialize composer in backend
cd sakyan-backend
composer init --no-interaction
cd ..

# 4. First commit
git add .
git commit -m "chore: initialize Sakyan monorepo structure"
git push origin main
```

---

*Built with ❤️ for Filipino car rental businesses.*
*Sakyan — Your ride, their wheels.*
