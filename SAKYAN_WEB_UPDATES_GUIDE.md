# Sakyan Web Platform — Feature Update Guide
*Last updated: May 2026*

This document describes all new features added to the Sakyan web platform (frontend + backend) in this update cycle.

---

## 1. Partner / Rental Company Filter on Browse Cars

### What changed
- Added a **"Rental Company"** filter section to the Browse Cars filter sidebar
- Users can now filter cars by the rental partner/company that owns them
- Filter shows approved partners only (those with at least 1 active car)
- Display format: **Business Name** (for companies) or **Full Name** (for individuals) + partner type badge

### How it works
- **Backend:** `GET /api/cars/` now accepts a `partner_id` query parameter
- **Backend:** New public endpoint `GET /api/partners/approved/` returns list of approved partners with car counts
- **Frontend:** `CarFilters.jsx` has a new partner section with:
  - Searchable dropdown listing all approved partners
  - Quick pill toggles for top partners
- **Frontend:** `CarsPage.jsx` passes `partner_id` through the filter state

---

## 2. Featured Partner Banners & Boost Request System

### Free Auto Badges (computed automatically)
| Badge | Trigger |
|---|---|
| ⭐ Most Cars Listed | Partner with the highest number of active car listings |
| 🔥 Most Rented | Partner with the most completed bookings |
| 🚗 Top Rental Car | The individual car with the most completed bookings |
| ✅ Verified Partner | All approved partners receive this |

### Paid Featured / Boost System
- Partners can request a **Featured** or **Spotlight** listing from their dashboard
- Clicking "Boost Your Listing" opens a modal and auto-sends a message to the admin
- Admin reviews requests in the new **Boost Requests** page under Admin Panel

#### Partner Boost Request Flow:
1. Partner clicks **"Boost Your Listing"** in Partner Dashboard
2. Selects boost type (Featured Listing / Spotlight Banner) and preferred duration (1/3/6/12 months)
3. System auto-sends a message to admin: *"I would like to be featured on Sakyan..."*
4. Admin reviews, approves/declines, sets duration, marks as paid
5. Admin can reply to partner via the messaging system
6. Approved + paid boosts go live on the Browse Cars carousel

### Featured Banners Carousel (top of Browse Cars page)
Full-width carousel with 4 slides:
- **Slide 1:** Featured Partner (paid boost, if active) — company banner with name, car count, CTA
- **Slide 2:** Most Cars Listed partner spotlight
- **Slide 3:** Most Rented Partner spotlight
- **Slide 4:** Top Rented Car spotlight

### New Model: `PartnerBoostRequest`
```
- partner (FK → Partner)
- boost_type: 'featured' | 'spotlight'
- status: 'pending' | 'approved' | 'paid' | 'declined'
- duration_months: 1 | 3 | 6 | 12
- start_date / end_date
- admin_notes
- created_at / updated_at
```

### New API Endpoints
| Method | URL | Description |
|---|---|---|
| `POST` | `/api/boosts/request/` | Partner submits boost request |
| `GET` | `/api/admin/boosts/` | Admin list all boost requests |
| `PATCH` | `/api/admin/boosts/<id>/<action>/` | approve / decline / mark-paid |
| `GET` | `/api/public/featured/` | Public: featured partner + auto-badge winners |

### New Admin Page
- Route: `/admin/boosts`
- Features: table of all requests, status filter tabs, per-row actions (Approve/Decline/Mark Paid), duration picker, reply button

---

## 3. Commission Rate Changes (3–5%)

### Default Rates
| Partner Type | New Default Commission |
|---|---|
| Individual | **3%** |
| Company | **5%** |

> Previously the default was flat 10% for all partners.

### Rules
- Admin can still override per partner (no hard cap — fully adjustable)
- Commission is applied at booking creation using the **partner's specific rate**
- Global default `commission_rate` platform setting in Admin → Settings controls the fallback
- Per-partner override is done in Admin → Partners → (select partner) → Edit Commission

### Where Commission Is Calculated
- `sakyan-backend/api/views/booking_views.py` — uses `booking.partner.commission_rate`
- `commission_amount = subtotal × (partner.commission_rate / 100)`

---

## 4. KYC Rental Agreement (Step 4)

### Overview
A proper Philippine-law rental agreement is now embedded as **Step 4** of the KYC verification flow. The KYC cannot be submitted without completing the agreement.

### Step 4 Flow
1. Customer scrolls through the full agreement text
2. Checks **"I have read and agree to this Rental Agreement"**
3. Types their **full legal name** as a digital signature
4. Clicks **Submit Verification** → all 4 steps submitted together

### Agreement Clauses
1. Identification of Parties
2. Vehicle Use (lawful use only, within Philippines)
3. Driver Responsibility (renter = sole authorized driver)
4. Damage Liability (renter fully liable for damage, theft, loss)
5. Traffic Violations & Penalties (renter responsible for all fines)
6. Fuel Policy (return with same fuel level)
7. Late Return Policy (extra charges apply)
8. Prohibited Uses (no subletting, no off-road, no illegal activities)
9. Insurance Acknowledgment (no comprehensive insurance unless stated)
10. Governing Law (Philippine law, barangay mediation first)

### New Fields on `CustomerProfile`
| Field | Type | Description |
|---|---|---|
| `agreement_accepted` | Boolean | True when customer checked the agreement box |
| `agreement_signature` | CharField(255) | Customer's typed full name |
| `agreement_signed_at` | DateTimeField | Timestamp of submission |

### Agreement Visibility
- **Admin KYC page** shows: ✅ Agreement Signed + name + date
- **Partners** (via admin view) can see that the customer has signed
- Agreement is **one-time** with the KYC submission — not repeated

---

## 5. Partner Onboarding Agreement

### Overview
A shorter **Partner Platform Terms Agreement** added to the partner onboarding flow (Step 3 — Documents page).

### Clauses
1. Listing Accuracy (all car details must be truthful)
2. Commission Acceptance (partner agrees to commission deductions)
3. Vehicle Legitimacy (partner guarantees legal ownership / authority to list)
4. Platform Rules (no price manipulation, no off-platform bookings)
5. Customer Handling (partner must honor approved bookings)
6. Governing Terms (Sakyan reserves the right to suspend non-compliant accounts)

### Mechanic
- Same as KYC: scroll → checkbox → type name to sign
- Saved with the partner application before admin review

---

## 6. Messages Link in Public Navbar (PublicLayout)

> ⚠️ **Note for developers:** The public-facing navbar is in `PublicLayout.jsx`, **NOT** `Navbar.jsx`. `Navbar.jsx` is a legacy unused component.

### What was added to `PublicLayout.jsx`
- **Desktop top bar:** Messages icon (`MessageCircle`) with unread count badge, visible next to the theme toggle
- **Desktop dropdown:** "Messages" link for `customer` and `partner` roles, with unread badge
- **Mobile menu:** "Messages" link with unread badge for all logged-in users

### Unread Count Logic
- Uses `useConversations()` hook to fetch all conversations
- Sums `unread_count` across all conversations
- Shows animated red badge when unread > 0

---

## File Change Reference

### Backend (`sakyan-backend/`)
| File | Change |
|---|---|
| `api/models.py` | Added `PartnerBoostRequest` model; new fields on `CustomerProfile`; `Partner.commission_rate` default → 5.00 |
| `api/serializers.py` | New serializers for boost requests + agreement fields |
| `api/views/car_views.py` | Added `partner_id` filter; new `ApprovedPartnersView` |
| `api/views/admin_views.py` | New boost CRUD views; partner type-aware commission default |
| `api/views/partner_views.py` | Boost request submit view |
| `api/urls.py` | New routes for boosts, approved partners, featured endpoint |
| `api/migrations/` | New migration for all model changes |

### Frontend (`sakyan-frontend/src/`)
| File | Change |
|---|---|
| `components/layout/PublicLayout.jsx` | Messages icon + link in dropdown + mobile menu |
| `components/cars/CarFilters.jsx` | New partner filter section |
| `components/cars/FeaturedBanner.jsx` | **[NEW]** Featured carousel component |
| `pages/public/CarsPage.jsx` | FeaturedBanner integration; partner filter state |
| `pages/kyc/KYCVerificationPage.jsx` | Step 4 — Rental Agreement |
| `pages/admin/AdminBoostRequestsPage.jsx` | **[NEW]** Admin boost management page |
| `pages/admin/AdminSettingsPage.jsx` | Updated commission description text |
| `pages/admin/AdminKYCPage.jsx` | Show agreement signature info |
| `pages/dashboard/PartnerHomePage.jsx` | "Boost Your Listing" button + modal |
| `App.jsx` | New `/admin/boosts` route |
| `components/layout/DashboardLayout.jsx` | "Boosts" link in admin sidebar |

---

## Running Locally

### Backend
```bash
cd sakyan-backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd sakyan-frontend
npm run dev
```

---

## Notes
- The `Navbar.jsx` file in `src/components/layout/` is **not currently used** by any route. All public pages use `PublicLayout.jsx` which has its own inline header.
- Commission changes only affect **new bookings** — existing bookings retain their original `commission_amount`.
- Boost requests are for **display purposes only** in the capstone; actual payment is agreed upon between admin and partner via the messaging system.
