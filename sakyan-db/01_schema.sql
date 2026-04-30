-- ============================================================
-- SAKYAN — Step 1: Full Schema
-- Run this AFTER the cleanup script in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. users (extends Supabase Auth)
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. partners (Partner/Company profile)
-- ─────────────────────────────────────────────
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  partner_type VARCHAR(20) CHECK (partner_type IN ('individual', 'company')),
  business_address TEXT,
  business_permit_url TEXT,
  government_id_url TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  commission_rate DECIMAL(4,2) DEFAULT 10.00,  -- 8-12%: Sakyan earns from partner
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. cars
-- ─────────────────────────────────────────────
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INT,
  plate_number VARCHAR(20) UNIQUE,
  transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic')),
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  seats INT DEFAULT 5,
  color VARCHAR(50),
  price_per_day DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  features TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'booked')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. car_images
-- ─────────────────────────────────────────────
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. customer_profiles (KYC)
-- ─────────────────────────────────────────────
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  birthday DATE,
  address TEXT,
  drivers_license_number VARCHAR(50),
  drivers_license_url TEXT,
  license_expiry DATE,
  valid_id_type VARCHAR(100),
  valid_id_url TEXT,
  selfie_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. bookings
-- ─────────────────────────────────────────────
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(20) UNIQUE,
  car_id UUID REFERENCES cars(id),
  customer_id UUID REFERENCES users(id),
  partner_id UUID REFERENCES partners(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_location TEXT,
  return_location TEXT,
  total_days INT,
  price_per_day DECIMAL(10,2),
  subtotal DECIMAL(10,2),           -- price_per_day × total_days
  booking_fee DECIMAL(10,2) DEFAULT 100.00,  -- ₱80–150 flat fee charged to customer
  commission_amount DECIMAL(10,2),  -- subtotal × commission_rate (partner pays to Sakyan)
  total_amount DECIMAL(10,2),       -- subtotal + booking_fee (what customer pays)
  partner_net DECIMAL(10,2),        -- subtotal − commission_amount (what partner receives)
  payment_method VARCHAR(20) CHECK (payment_method IN ('gcash', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  gcash_reference VARCHAR(100),
  booking_status VARCHAR(30) DEFAULT 'pending_review'
    CHECK (booking_status IN (
      'pending_review',
      'approved',
      'rejected',
      'active',
      'completed',
      'cancelled'
    )),
  special_requests TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. messages
-- ─────────────────────────────────────────────
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. notifications
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50) CHECK (type IN ('booking', 'approval', 'message', 'payment', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. app_settings (admin-configurable values)
-- ─────────────────────────────────────────────
CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default booking fee (admin can change via admin panel)
INSERT INTO app_settings (key, value, description)
VALUES
  ('booking_fee', '100', 'Flat booking fee charged to customers per booking in PHP (range: 80-150)'),
  ('platform_name', 'Sakyan', 'Platform display name'),
  ('min_booking_days', '1', 'Minimum number of rental days per booking');

-- ─────────────────────────────────────────────
-- 10. Row Level Security (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Users: can see own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE USING (auth.uid() = id);

-- Cars: anyone can view active available cars
CREATE POLICY "Anyone can view active cars"
ON cars FOR SELECT USING (status = 'active' AND is_available = TRUE);

-- Car images: public
CREATE POLICY "Anyone can view car images"
ON car_images FOR SELECT USING (TRUE);

-- Partners: can manage own cars
CREATE POLICY "Partners can insert cars"
ON cars FOR INSERT WITH CHECK (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

CREATE POLICY "Partners can update own cars"
ON cars FOR UPDATE USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

-- Bookings: customer/partner can see own bookings
CREATE POLICY "Customers can view own bookings"
ON bookings FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Partners can view their bookings"
ON bookings FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

-- Messages: sender or receiver can see messages
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

-- Notifications: own only
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT USING (user_id = auth.uid());

-- App settings: public read (for booking fee display)
CREATE POLICY "Anyone can read app settings"
ON app_settings FOR SELECT USING (TRUE);

-- ─────────────────────────────────────────────
-- Verify: list all tables created
-- ─────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
