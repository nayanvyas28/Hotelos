# 🏨 HotelOS — Complete Hotel Management System

## Development Plan — 2026 Edition

**Product Type:** Commercial Hotel Property Management System (PMS)
**Target:** Small, Medium & Multi-Property Hotels
**Architecture:** Multi-tenant SaaS + Self-hosted option
**Primary Stack:** Next.js + React + TypeScript + PostgreSQL
**Document Version:** 1.0
**Year:** 2026

---

# 1. Product Vision

Build a modern, production-ready Hotel Property Management System that can be:

1. Sold as a SaaS product.
2. Licensed to individual hotels.
3. White-labeled for agencies.
4. Self-hosted on hotel servers/VPS.
5. Extended into a multi-property hotel management platform.

The product must be more than an online hotel booking website.

It should handle the complete hotel operation:

```text
Reservations
    ↓
Front Desk
    ↓
Check-in
    ↓
Guest Stay
    ↓
Room / Housekeeping
    ↓
Charges / Folio
    ↓
Payment
    ↓
Invoice
    ↓
Check-out
    ↓
Reports
```

---

# 2. Product Editions

Create three commercial editions.

## Edition A — Starter

For small hotels.

Includes:

* Rooms
* Room types
* Guests
* Reservations
* Check-in
* Check-out
* Payments
* Invoices
* Basic dashboard
* Basic reports
* Staff accounts

---

## Edition B — Professional

For hotels with larger operations.

Everything in Starter plus:

* Housekeeping
* Maintenance
* Expenses
* Restaurant/POS
* Advanced reports
* Rate plans
* Seasonal pricing
* Discounts
* Taxes
* Audit logs
* Notifications
* Multiple users
* Advanced permissions
* Online booking engine

---

## Edition C — Enterprise

For hotel groups.

Everything in Professional plus:

* Multi-property
* Central dashboard
* Central reservations
* Channel manager integrations
* OTA integrations
* Corporate accounts
* Group reservations
* Advanced revenue management
* API
* Webhooks
* White-label branding
* Custom domains
* SSO
* Advanced audit/security
* Enterprise support

---

# 3. Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
TanStack Table
Recharts
Lucide Icons
```

Use the Next.js App Router architecture.

---

## Backend

For the first version:

```text
Next.js Server Components
Next.js Server Actions
Route Handlers
TypeScript
```

For larger enterprise integrations:

```text
Dedicated API layer
REST API
Webhooks
Background workers
```

Do NOT create a completely separate backend unnecessarily in V1.

---

# 4. Database

Use:

```text
PostgreSQL
Prisma ORM
Redis
```

PostgreSQL is the primary transactional database.

Redis is used for:

* Sessions
* Rate limiting
* Caching
* Queues
* Temporary locks
* Background jobs

---

# 5. Storage

Use object storage rather than storing uploaded files on the application server.

```text
AWS S3
Cloudflare R2
or compatible S3 storage
```

Store:

* Guest documents
* Hotel logo
* Room images
* Invoice PDFs
* Staff documents
* Property documents

---

# 6. Authentication

Implement:

```text
Email + Password
Google OAuth
Password reset
Email verification
2FA
Session management
Device/session management
```

Enterprise:

```text
SSO
SAML/OIDC
```

---

# 7. Authorization

Use RBAC.

Default roles:

```text
SUPER_ADMIN
OWNER
PROPERTY_ADMIN
GENERAL_MANAGER
FRONT_DESK
RESERVATION_MANAGER
HOUSEKEEPING_MANAGER
HOUSEKEEPER
ACCOUNTANT
CASHIER
RESTAURANT_MANAGER
RESTAURANT_STAFF
MAINTENANCE
AUDITOR
REPORT_VIEWER
```

Permissions should be granular.

Example:

```text
reservation.create
reservation.update
reservation.cancel
reservation.view

guest.create
guest.update
guest.view

payment.create
payment.refund

invoice.create
invoice.download

room.update
room.status.update

report.view
report.export
```

Never hard-code permissions directly into UI only.

Permissions must also be checked server-side.

---

# 8. Multi-Tenant Architecture

The system should be SaaS-ready from the beginning.

Hierarchy:

```text
Platform
   │
   ├── Organization
   │      │
   │      ├── Property
   │      │      ├── Floors
   │      │      ├── Rooms
   │      │      ├── Staff
   │      │      └── Reservations
   │      │
   │      └── Users
   │
   └── Platform Admin
```

Every hotel-related database record must belong to a tenant/property where appropriate.

Example:

```text
organizationId
propertyId
```

Never allow one hotel to access another hotel's data.

---

# 9. Core Database Models

Minimum database models:

```text
Organization
Property
User
Role
Permission
RolePermission
UserRole

Guest
GuestDocument
GuestAddress
GuestNote

Room
RoomType
Floor
RoomAmenity
RoomImage

RatePlan
Season
PriceRule
Discount
Tax

Reservation
ReservationGuest
ReservationRoom
ReservationStatus
ReservationSource

Stay
CheckIn
CheckOut

Folio
FolioItem
Charge
Payment
Refund
Invoice
InvoiceItem

HousekeepingTask
HousekeepingStatus

MaintenanceTicket

Expense
ExpenseCategory

Restaurant
MenuItem
Order
OrderItem
Table

Notification
EmailLog
SmsLog

AuditLog

Setting
Currency
Country
Language

Subscription
Plan
Feature
```

---

# 10. Property Setup

Hotel onboarding flow:

```text
Create Account
      ↓
Create Organization
      ↓
Create Property
      ↓
Hotel Information
      ↓
Currency
      ↓
Tax Configuration
      ↓
Room Types
      ↓
Rooms
      ↓
Rate Plans
      ↓
Staff
      ↓
Complete Setup
```

Setup wizard should be easy enough for a hotel manager to complete without developer help.

---

# 11. Dashboard

Main dashboard should show:

```text
Today's Arrivals
Today's Departures
Current Guests
Available Rooms
Occupied Rooms
Dirty Rooms
Out of Order
Today's Revenue
Occupancy %
ADR
RevPAR
Pending Payments
Pending Housekeeping
Maintenance Issues
```

Charts:

```text
Revenue
Occupancy
Bookings
Room Type Performance
Booking Sources
Payment Methods
```

---

# 12. Room Management

## Room Types

Examples:

```text
Single
Double
Twin
Deluxe
Suite
Family
Presidential
```

Fields:

```text
Name
Code
Description
Capacity
Beds
Base Price
Amenities
Images
Status
```

---

## Rooms

Fields:

```text
Room Number
Room Type
Floor
Status
Housekeeping Status
Price Override
Notes
```

Statuses:

```text
AVAILABLE
OCCUPIED
RESERVED
DIRTY
CLEAN
INSPECTED
OUT_OF_ORDER
MAINTENANCE
BLOCKED
```

---

# 13. Reservation System

Reservation creation:

```text
Select Dates
      ↓
Check Availability
      ↓
Select Room
      ↓
Select Rate
      ↓
Add Guest
      ↓
Add Extras
      ↓
Apply Discount
      ↓
Calculate Tax
      ↓
Payment
      ↓
Confirm Reservation
```

Reservation statuses:

```text
INQUIRY
PENDING
CONFIRMED
CHECKED_IN
CHECKED_OUT
CANCELLED
NO_SHOW
```

Sources:

```text
DIRECT
WALK_IN
PHONE
EMAIL
WEBSITE
BOOKING_ENGINE
OTA
AGENT
CORPORATE
```

---

# 14. Availability Engine

This is one of the most important parts of the PMS.

The system must prevent double booking.

Availability must consider:

```text
Existing reservations
Checked-in stays
Blocked rooms
Maintenance
Out-of-order rooms
Room type inventory
Cancellation
Room transfers
Group reservations
```

Never rely only on frontend availability.

The server/database must enforce reservation consistency.

Use database transactions and appropriate locking/concurrency controls.

---

# 15. Reservation Calendar

Build a professional calendar similar to:

```text
                 MAY 2026

Room       10   11   12   13   14   15   16

101       █████████████
102            █████████████
103                 ██████████
104       █████
105                 ███████████████
```

Features:

* Drag reservation
* Resize reservation
* Room move
* Quick booking
* Quick check-in
* Filter by room type
* Filter by floor
* Filter by status
* Search guest
* Color-coded status

---

# 16. Front Desk

Front desk dashboard:

```text
Arrivals
Departures
In-house Guests
Walk-ins
Room Availability
Pending Payments
Special Requests
VIP Guests
```

Quick actions:

```text
New Reservation
Walk-in
Check-in
Check-out
Room Transfer
Add Payment
Print Invoice
```

---

# 17. Check-In

Check-in workflow:

```text
Reservation
    ↓
Verify Guest
    ↓
Verify ID
    ↓
Assign Room
    ↓
Registration Form
    ↓
Payment / Deposit
    ↓
Confirm Check-in
```

Support:

* Passport
* National ID
* Driving license
* Custom ID types

Upload document images securely.

---

# 18. Check-Out

Workflow:

```text
Open Folio
     ↓
Review Charges
     ↓
Add Pending Charges
     ↓
Apply Discount
     ↓
Calculate Tax
     ↓
Payment
     ↓
Generate Invoice
     ↓
Checkout
     ↓
Room → Dirty
```

After checkout:

```text
Room status = DIRTY
Housekeeping task = CREATED
```

---

# 19. Folio System

Every stay should have a folio.

Example:

```text
Room Charge             ₹5,000
Extra Bed               ₹1,000
Breakfast                 ₹800
Laundry                   ₹500
Restaurant              ₹1,200
------------------------------
Subtotal                ₹8,500
GST                     ₹1,530
------------------------------
Total                  ₹10,030
Paid                    ₹5,000
------------------------------
Balance                 ₹5,030
```

Folio must support:

```text
Room charges
Food
Laundry
Transport
Mini bar
Extra bed
Spa
Taxes
Discounts
Manual charges
Payments
Refunds
```

---

# 20. Payment System

Payment methods:

```text
CASH
CARD
UPI
BANK_TRANSFER
ONLINE
WALLET
OTHER
```

Support:

```text
Partial payment
Advance payment
Deposit
Refund
Split payment
Multiple payment methods
Payment receipt
```

India-ready:

```text
INR
GST
CGST
SGST
IGST
HSN/SAC
GSTIN
UPI
```

Do not hard-code Indian tax rules.

Make tax configuration flexible.

---

# 21. Invoice System

Invoice must contain:

```text
Hotel logo
Hotel name
Address
GSTIN
Invoice number
Invoice date
Guest information
Room
Stay dates
Charges
Taxes
Discount
Payments
Balance
Terms
```

Formats:

```text
PDF
Print
Email
Download
```

Invoice numbering should be configurable per property/fiscal year.

---

# 22. Housekeeping

Housekeeping dashboard:

```text
Dirty
Clean
Inspected
Occupied Dirty
Checkout Dirty
Deep Cleaning
Out of Service
```

Tasks:

```text
Room
Assigned Staff
Priority
Due Time
Status
Notes
```

Workflow:

```text
Checkout
   ↓
Dirty
   ↓
Housekeeper Assigned
   ↓
Cleaning
   ↓
Clean
   ↓
Inspection
   ↓
Inspected
   ↓
Available
```

---

# 23. Maintenance

Maintenance tickets:

```text
Room
Issue
Priority
Assigned Staff
Created At
Due Date
Status
Cost
Notes
Images
```

Statuses:

```text
OPEN
ASSIGNED
IN_PROGRESS
WAITING
RESOLVED
CLOSED
```

---

# 24. Guest CRM

Guest profile:

```text
Name
Phone
Email
Nationality
Date of Birth
Address
ID
Preferences
Notes
VIP status
Total stays
Total spending
Last stay
```

Guest history:

```text
Reservations
Stays
Payments
Invoices
Complaints
Preferences
Notes
```

---

# 25. Rate Management

Support:

```text
Base Rate
Weekend Rate
Seasonal Rate
Holiday Rate
Corporate Rate
Group Rate
Long Stay Rate
Non-refundable Rate
Last-minute Rate
```

Pricing hierarchy:

```text
Base Rate
    ↓
Season Rule
    ↓
Room Type
    ↓
Rate Plan
    ↓
Occupancy
    ↓
Discount
    ↓
Tax
```

---

# 26. Discount System

Support:

```text
Percentage
Fixed Amount
Promo Code
Corporate Discount
Long Stay
Early Bird
Last Minute
Manual Discount
```

Permission required for manual high-value discounts.

---

# 27. Restaurant / POS

Optional Professional module.

Modules:

```text
Tables
Menu Categories
Menu Items
Orders
Kitchen
Billing
Payments
Room Charge
Reports
```

Important feature:

```text
Restaurant Order
      ↓
Select "Charge to Room"
      ↓
Verify Room + Guest
      ↓
Create Folio Charge
```

---

# 28. Inventory

Inventory module:

```text
Products
Categories
Units
Suppliers
Purchases
Stock In
Stock Out
Adjustments
Low Stock
Stock History
```

Hotel examples:

```text
Bedsheets
Towels
Soap
Shampoo
Water
Cleaning Chemicals
Food
Beverages
Amenities
```

---

# 29. Expense Management

Expenses:

```text
Category
Amount
Vendor
Date
Payment Method
Property
Description
Receipt
Created By
```

Categories:

```text
Utilities
Salary
Maintenance
Food
Cleaning
Marketing
Supplies
Transport
Other
```

---

# 30. Reports

Create exportable reports.

## Operational

```text
Occupancy
Arrivals
Departures
In-house
No-show
Cancellation
Room Status
Housekeeping
```

## Financial

```text
Daily Revenue
Revenue by Room
Revenue by Source
Tax Report
Payment Report
Expense Report
Profit/Loss
Outstanding Balance
```

## Guest

```text
Guest History
Nationality
Repeat Guests
VIP Guests
Average Stay
Guest Spending
```

## Management

```text
ADR
RevPAR
Occupancy
Room Revenue
F&B Revenue
Total Revenue
```

Exports:

```text
PDF
CSV
Excel
```

---

# 31. Audit Log

Every important action must be logged.

Example:

```text
User: Rahul
Action: RESERVATION_UPDATED
Reservation: RES-2026-00125
Old Value: Room 101
New Value: Room 205
IP: ...
Timestamp: ...
```

Track:

```text
Login
Logout
Reservation changes
Room changes
Payment
Refund
Invoice
Discount
User changes
Permission changes
Settings changes
```

Audit logs should be append-only for normal users.

---

# 32. Notifications

Channels:

```text
Email
SMS
WhatsApp
In-app
```

Events:

```text
Booking confirmation
Booking cancellation
Payment receipt
Check-in reminder
Checkout reminder
Invoice
Payment pending
Housekeeping assignment
Maintenance assignment
```

Build a notification abstraction:

```text
NotificationService
    ├── EmailProvider
    ├── WhatsAppProvider
    ├── SMSProvider
    └── InAppProvider
```

This allows changing providers later.

---

# 33. Online Booking Engine

Public website:

```text
/
 /rooms
 /rooms/[slug]
 /booking
 /booking/confirmation
 /offers
 /contact
```

Booking flow:

```text
Dates
 ↓
Guests
 ↓
Available Rooms
 ↓
Rate
 ↓
Guest Information
 ↓
Payment
 ↓
Confirmation
```

Hotel should be able to embed booking engine:

```text
hotel.com/book
```

or:

```text
book.hotel.com
```

---

# 34. Channel Manager

Enterprise phase.

Integrations should synchronize:

```text
Availability
Rates
Reservations
Restrictions
Cancellation
```

Potential channels:

```text
Booking.com
Expedia
Airbnb
Agoda
MakeMyTrip
Goibibo
```

Do not directly hard-code channel logic into reservation models.

Create:

```text
ChannelAdapter
```

Example:

```text
ChannelAdapter
    ├── BookingAdapter
    ├── ExpediaAdapter
    ├── AirbnbAdapter
    └── GenericAdapter
```

---

# 35. API

Create public API.

Example:

```text
GET    /api/v1/rooms
GET    /api/v1/room-types
GET    /api/v1/availability

POST   /api/v1/reservations
GET    /api/v1/reservations/:id
PATCH  /api/v1/reservations/:id
DELETE /api/v1/reservations/:id

POST   /api/v1/check-in
POST   /api/v1/check-out

GET    /api/v1/guests
POST   /api/v1/guests

GET    /api/v1/invoices
GET    /api/v1/payments
```

Use API keys:

```text
API Key
Secret
Scopes
Rate Limit
Created At
Last Used
```

---

# 36. Webhooks

Events:

```text
reservation.created
reservation.updated
reservation.cancelled

guest.created

payment.created
payment.refunded

checkin.completed
checkout.completed

invoice.created

room.status.changed
```

---

# 37. AI Features

AI should be an additional module, not the foundation of the PMS.

Features:

```text
AI hotel assistant
AI report summaries
AI revenue insights
AI guest message generation
AI complaint summarization
AI booking assistant
AI housekeeping prioritization
```

Example:

```text
"Why was revenue lower this week?"

AI:
Revenue decreased 8.4% compared with last week.
The main causes were:
1. Occupancy decreased 5%.
2. Weekend ADR decreased 3%.
3. Cancellation rate increased 2%.
```

AI must never directly modify financial records without explicit user confirmation.

---

# 38. Mobile / PWA

The UI must work on:

```text
Desktop
Tablet
Mobile
```

Housekeepers should be able to use a phone.

Mobile screens:

```text
My Tasks
Room Status
Cleaning Checklist
Maintenance
Guest Requests
Notifications
```

---

# 39. Security

Implement:

```text
HTTPS
Secure cookies
CSRF protection where applicable
XSS protection
SQL injection protection
Rate limiting
Input validation
File validation
Upload size limits
RBAC
Audit logs
Password hashing
2FA
Session expiry
Account lockout
Security headers
```

Never trust client-side validation.

All critical validation must happen server-side.

---

# 40. File Upload Security

Allowed:

```text
PDF
JPG
JPEG
PNG
WEBP
```

Limit:

```text
Maximum file size
Maximum dimensions
Allowed MIME types
```

Generate unique storage keys.

Never expose raw private guest documents publicly.

---

# 41. Testing Strategy

## Unit Tests

Test:

```text
Pricing
Tax
Discount
Availability
Reservation rules
Folio
Payment
Refund
Permissions
```

## Integration Tests

Test:

```text
Reservation → Room
Reservation → Folio
Check-in → Stay
Checkout → Housekeeping
Payment → Invoice
Restaurant → Folio
```

## E2E Tests

Use Playwright.

Critical flows:

```text
Login
Create hotel
Create room
Create reservation
Check-in
Add charge
Payment
Checkout
Invoice
```

---

# 42. CI/CD

Use GitHub Actions.

Pipeline:

```text
Push
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Build
 ↓
Integration Tests
 ↓
E2E
 ↓
Deploy
```

Production deployment must require successful checks.

---

# 43. Project Structure

Recommended:

```text
hotel-os/
│
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── booking/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── reservation/
│   ├── room/
│   ├── guest/
│   ├── billing/
│   └── housekeeping/
│
├── features/
│   ├── reservations/
│   ├── rooms/
│   ├── guests/
│   ├── billing/
│   ├── housekeeping/
│   ├── maintenance/
│   ├── reports/
│   └── settings/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── payments/
│   ├── notifications/
│   ├── storage/
│   ├── audit/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── emails/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
│
├── docs/
│
├── scripts/
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── README.md
└── DEVELOPMENT_PLAN.md
```

---

# 44. Development Phases

## Phase 0 — Planning

Duration: 3–5 days

Tasks:

```text
Finalize requirements
Database architecture
UX flows
Permission matrix
Tenant architecture
Pricing strategy
License strategy
```

Deliverables:

```text
ERD
Wireframes
Architecture diagram
Feature specification
```

---

# 45. Phase 1 — Foundation

Duration: 1 week

Build:

```text
Next.js setup
TypeScript
Tailwind
UI system
Database
Prisma
Authentication
Tenant model
RBAC
Logging
Error handling
```

Definition of Done:

```text
User can register
User can login
User can create organization
User can create property
User roles work
Database migrations work
```

---

# 46. Phase 2 — Property Setup

Duration: 1 week

Build:

```text
Property
Floors
Room types
Rooms
Amenities
Settings
Taxes
Currency
```

---

# 47. Phase 3 — Guest Management

Duration: 4–5 days

Build:

```text
Guest CRUD
Guest profile
Documents
Notes
Guest history
Search
Filters
```

---

# 48. Phase 4 — Reservations

Duration: 2 weeks

Build:

```text
Availability engine
Reservation CRUD
Reservation calendar
Room assignment
Rate plans
Discounts
Cancellation
No-show
Group reservation foundation
```

This is a critical phase.

Do not rush the availability engine.

---

# 49. Phase 5 — Front Desk

Duration: 1–2 weeks

Build:

```text
Arrivals
Departures
Walk-in
Check-in
Check-out
Room transfer
Guest registration
Deposits
```

---

# 50. Phase 6 — Billing

Duration: 1–2 weeks

Build:

```text
Folio
Charges
Taxes
Discount
Payments
Refunds
Invoices
PDF
Receipts
```

---

# 51. Phase 7 — Housekeeping

Duration: 1 week

Build:

```text
Housekeeping dashboard
Task assignment
Room cleaning status
Inspection
Mobile UI
```

---

# 52. Phase 8 — Reports

Duration: 1 week

Build:

```text
Dashboard analytics
Occupancy
ADR
RevPAR
Revenue
Payments
Taxes
Expenses
Exports
```

---

# 53. Phase 9 — Restaurant

Duration: 1–2 weeks

Build:

```text
Menu
Tables
Orders
Kitchen
Payments
Room charge
Restaurant reports
```

Make this module optional.

---

# 54. Phase 10 — Inventory + Expenses

Duration: 1 week

Build:

```text
Inventory
Suppliers
Purchasing
Stock
Expenses
Categories
Reports
```

---

# 55. Phase 11 — Notifications

Duration: 4–5 days

Build:

```text
Email
WhatsApp abstraction
SMS abstraction
Templates
Notification logs
```

---

# 56. Phase 12 — Online Booking

Duration: 1–2 weeks

Build:

```text
Public hotel page
Room listing
Availability
Booking
Payment
Confirmation
Booking management
```

---

# 57. Phase 13 — Enterprise

Duration: 2–4 weeks

Build:

```text
Multi-property
Central dashboard
API
API keys
Webhooks
Advanced roles
White labeling
Custom domains
Subscription
Usage limits
```

---

# 58. Phase 14 — Channel Manager

Separate project phase.

Build:

```text
Channel abstraction
Availability sync
Rate sync
Reservation sync
Error recovery
Webhook handling
Sync logs
Manual resync
```

Start with one provider.

Do not attempt five OTA integrations simultaneously.

---

# 59. Phase 15 — AI

Add after the core PMS is stable.

Build:

```text
AI assistant
Report summaries
Guest message generator
Revenue insights
Operational summaries
```

---

# 60. Phase 16 — Production Hardening

Duration: 1–2 weeks

Checklist:

```text
Security audit
Performance audit
Database indexes
Caching
Rate limiting
Error tracking
Logging
Backup
Restore testing
Email testing
Payment testing
Browser testing
Mobile testing
Accessibility
SEO
```

---

# 61. Demo Data

Create a realistic demo hotel.

Example:

```text
Hotel:
Grand Horizon Hotel

Rooms:
101–130
201–230
301–320

Room Types:
Standard
Deluxe
Executive
Suite

Guests:
100+

Reservations:
200+

Payments:
200+

Invoices:
200+

Housekeeping:
50+

Expenses:
100+
```

The demo must look like a real hotel system immediately after installation.

---

# 62. Demo Accounts

Create:

```text
admin@demo.hotel
manager@demo.hotel
frontdesk@demo.hotel
housekeeping@demo.hotel
accountant@demo.hotel
```

Each account should have different permissions.

---

# 63. SaaS Billing

Plans:

```text
FREE/TRIAL
STARTER
PRO
BUSINESS
ENTERPRISE
```

Possible limits:

```text
Number of rooms
Number of users
Number of properties
Booking volume
API requests
Storage
WhatsApp messages
```

---

# 64. White Label

Hotel/admin should be able to configure:

```text
Logo
Favicon
Primary color
Secondary color
Hotel name
Email sender
Invoice branding
Login branding
Custom domain
```

Example:

```text
Powered by HotelOS
```

can be hidden depending on license.

---

# 65. Licensing Model

Offer:

### SaaS

Monthly/yearly subscription.

### Self-hosted

One-time license.

### White-label

Higher-priced commercial license.

### Enterprise

Custom pricing.

Do NOT bundle a license system so tightly that customers cannot run the product offline/self-hosted.

---

# 66. Documentation

Create:

```text
README.md

docs/
├── installation.md
├── configuration.md
├── deployment.md
├── database.md
├── authentication.md
├── permissions.md
├── reservations.md
├── billing.md
├── housekeeping.md
├── reports.md
├── api.md
├── webhooks.md
├── troubleshooting.md
└── upgrade.md
```

---

# 67. Installation Experience

Target:

```bash
git clone ...
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

For production:

```bash
npm run build
npm run start
```

Also provide Docker:

```bash
docker compose up -d
```

---

# 68. Environment Variables

Example:

```env
DATABASE_URL=

AUTH_SECRET=

NEXT_PUBLIC_APP_URL=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

EMAIL_HOST=
EMAIL_USER=
EMAIL_PASSWORD=

WHATSAPP_API_KEY=
SMS_API_KEY=

REDIS_URL=

SENTRY_DSN=
```

Never commit real secrets.

---

# 69. Performance Requirements

Target:

```text
Dashboard load < 2 sec
Normal API response < 500 ms
Search < 500 ms
Availability query < 1 sec
Reports should use optimized queries
```

Use:

```text
Pagination
Database indexes
Caching
Lazy loading
Server Components
Background jobs
Query optimization
```

Do not load thousands of reservations into the browser.

---

# 70. Database Indexing

Important indexes:

```text
Reservation(propertyId, checkIn)
Reservation(propertyId, checkOut)
Reservation(roomId, checkIn, checkOut)

Guest(propertyId, phone)
Guest(propertyId, email)

Room(propertyId, status)
Room(propertyId, roomTypeId)

Payment(propertyId, createdAt)
Invoice(propertyId, createdAt)

AuditLog(propertyId, createdAt)
```

Review indexes using real production query patterns.

---

# 71. Backup Strategy

Database:

```text
Daily backup
Point-in-time recovery where available
30-day retention minimum
```

Files:

```text
Object storage
Versioning where appropriate
Lifecycle rules
```

Test restore regularly.

A backup that has never been restored is not a verified backup.

---

# 72. Observability

Use:

```text
Error tracking
Structured logs
Performance monitoring
Database monitoring
Uptime monitoring
Audit logs
```

Track:

```text
Errors
Slow queries
Failed payments
Failed notifications
Failed integrations
Background job failures
```

---

# 73. Definition of Production Ready

The product is NOT ready to sell until:

```text
[ ] Authentication works
[ ] RBAC works
[ ] Tenant isolation verified
[ ] Reservation concurrency tested
[ ] Double booking prevented
[ ] Check-in tested
[ ] Checkout tested
[ ] Folio tested
[ ] Payments tested
[ ] Refund tested
[ ] Invoice tested
[ ] Housekeeping tested
[ ] Reports verified
[ ] Audit logs verified
[ ] Backup tested
[ ] Restore tested
[ ] Mobile tested
[ ] Security tested
[ ] E2E tests pass
[ ] Production deployment tested
[ ] Documentation complete
```

---

# 74. Recommended MVP

Do NOT build everything before selling.

First commercial version should contain:

```text
Authentication
Multi-tenancy
Property
Rooms
Room Types
Guests
Reservations
Availability
Front Desk
Check-in
Check-out
Folio
Payments
Invoices
Housekeeping
Dashboard
Reports
RBAC
Audit Logs
```

This is the **real MVP**.

Restaurant, inventory, channel manager and AI can follow.

---

# 75. Recommended Build Order

```text
1. Architecture
2. Database
3. Authentication
4. Multi-tenancy
5. RBAC
6. Property setup
7. Rooms
8. Guests
9. Availability engine
10. Reservations
11. Front desk
12. Check-in
13. Folio
14. Payments
15. Invoice
16. Check-out
17. Housekeeping
18. Reports
19. Notifications
20. Online booking
21. Restaurant
22. Inventory
23. Expenses
24. Multi-property
25. API
26. Channel manager
27. AI
```

---

# 76. Critical Business Rules

Never violate these rules.

## Reservation

```text
A room cannot have overlapping confirmed stays.
```

## Checkout

```text
Checkout cannot complete with unresolved mandatory balance unless hotel policy allows it.
```

## Payment

```text
Payment amount cannot be negative.
Refund cannot exceed refundable payment.
```

## Discount

```text
Discount cannot exceed configured maximum without authorization.
```

## Room

```text
Out-of-order rooms cannot be assigned.
```

## Tenant

```text
Tenant A cannot access Tenant B data.
```

## Audit

```text
Financial changes must be auditable.
```

---

# 77. Commercial UI Requirements

The product should look like a premium SaaS product.

Design principles:

```text
Clean
Fast
Professional
Minimal
Responsive
Accessible
Keyboard friendly
Dark mode
```

Avoid:

```text
Old Bootstrap-style UI
Huge forms
Cluttered dashboards
Too many colors
Tiny buttons
Desktop-only design
```

---

# 78. Recommended Navigation

```text
Dashboard

Front Desk
├── Today
├── Arrivals
├── Departures
├── In-House
└── Walk-ins

Reservations
├── Calendar
├── All Reservations
├── New Reservation
└── Groups

Rooms
├── Room Grid
├── Room Types
├── Floors
└── Maintenance

Guests
├── Guests
├── VIP
└── Guest History

Housekeeping
├── Dashboard
├── Tasks
└── Inspection

Billing
├── Folios
├── Payments
├── Invoices
└── Refunds

Reports
├── Revenue
├── Occupancy
├── ADR
├── RevPAR
├── Tax
└── Payments

Restaurant

Inventory

Expenses

Staff

Settings
```

---

# 79. Release Strategy

## v1.0

```text
Core PMS
```

## v1.1

```text
Online booking
Notifications
Advanced reports
```

## v1.2

```text
Restaurant
Inventory
Expenses
```

## v2.0

```text
Multi-property
API
Webhooks
White label
```

## v2.5

```text
Channel manager
```

## v3.0

```text
AI
Revenue management
Advanced automation
```

---

# 80. Final Goal

The final product should allow a hotel owner to do this:

```text
Create Hotel
      ↓
Configure Rooms
      ↓
Add Staff
      ↓
Set Prices
      ↓
Receive Booking
      ↓
Manage Guest
      ↓
Check-in
      ↓
Manage Stay
      ↓
Housekeeping
      ↓
Add Charges
      ↓
Receive Payment
      ↓
Generate Invoice
      ↓
Check-out
      ↓
Generate Reports
```

And an enterprise customer should eventually be able to manage:

```text
Company
   │
   ├── Hotel A
   ├── Hotel B
   ├── Hotel C
   └── Hotel D
```

from one centralized platform.

---

# 81. Final Architecture

```text
                    ┌──────────────────────┐
                    │   Public Website     │
                    │   Booking Engine     │
                    └──────────┬───────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────┐
│                  HOTELOS PLATFORM                  │
│                                                    │
│  Front Desk   Reservations   Housekeeping         │
│  Guests       Billing        Reports              │
│  Restaurant   Inventory      Expenses             │
│  Staff        Settings       Notifications        │
│                                                    │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Business Services   │
              │                     │
              │ Availability        │
              │ Pricing             │
              │ Folio               │
              │ Payments            │
              │ Tax                 │
              │ Notifications       │
              │ Audit               │
              └──────────┬──────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      ┌──────────────┐       ┌──────────────┐
      │ PostgreSQL   │       │    Redis     │
      │              │       │              │
      │ Hotel Data   │       │ Cache/Queue  │
      │ Reservations │       │ Jobs         │
      │ Billing      │       │ Rate Limit   │
      └──────────────┘       └──────────────┘
             │
             ▼
      ┌──────────────────┐
      │ Object Storage   │
      │ S3 / R2          │
      └──────────────────┘
```

---

# 82. Success Criteria

The project is successful when:

```text
A small hotel can install it.
A receptionist can use it without training for days.
A manager can understand the dashboard immediately.
An accountant can verify payments and invoices.
A housekeeper can use it from a mobile phone.
A hotel owner can see revenue and occupancy.
An agency can white-label it.
A SaaS customer can subscribe to it.
A developer can extend it through APIs.
```

**Primary objective:**

> Build a Hotel PMS that feels like a modern SaaS product, not an old desktop hotel application.

**Development principle:**

> Build the core reservation + stay + folio + payment engine correctly first. Everything else should integrate around that foundation.
