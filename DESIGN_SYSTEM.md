# HotelOS — UI/UX Design System

## 2026 Premium Hotel PMS Design Specification

**Product:** HotelOS
**Type:** Hotel Property Management System / SaaS
**Design Version:** 2026.1
**Design Direction:** Premium SaaS + Hospitality Operations
**Primary UI:** Desktop-first, responsive
**Mobile:** Housekeeping + Front Desk optimized
**Accessibility:** WCAG 2.2 AA target

---

# 1. Design Vision

HotelOS should feel like a combination of:

```text
Modern SaaS
        +
Premium Hotel Brand
        +
Professional Operations Software
```

The UI must NOT look like:

```text
❌ Old Bootstrap admin panel
❌ Generic CRM
❌ Government software
❌ Overly colorful dashboard
❌ Excessive gradients
❌ Huge cards everywhere
❌ Dense spreadsheet-only interface
```

The interface should communicate:

```text
Fast
Calm
Reliable
Premium
Professional
Clear
Operational
```

---

# 2. Core UX Principles

## Principle 1 — Information First

Hotel employees need information quickly.

A receptionist should be able to answer:

> "Which rooms are available right now?"

within seconds.

---

## Principle 2 — Fewer Clicks

Common operations should require minimal interaction.

Example:

```text
Guest calls
    ↓
Search guest
    ↓
Select dates
    ↓
Select room
    ↓
Confirm
```

Avoid:

```text
Page → Modal → Form → Another page → Confirmation → Another modal
```

---

# 3. Design Personality

HotelOS personality:

```text
Professional
        ↓
Calm
        ↓
Premium
        ↓
Human
        ↓
Efficient
```

Use subtle visual details rather than decoration.

---

# 4. Visual Style

## Overall

```text
Background:
Soft neutral

Cards:
Clean white / dark surfaces

Borders:
Subtle

Radius:
Medium

Shadows:
Very light

Typography:
Modern sans-serif

Icons:
Minimal line icons

Accent:
One primary brand color
```

Avoid excessive shadows.

Avoid excessive rounded cards.

---

# 5. Color System

## Light Theme

### Background

```text
App Background
#F6F7F9

Surface
#FFFFFF

Surface Secondary
#F9FAFB

Surface Hover
#F3F4F6
```

### Text

```text
Primary
#111827

Secondary
#4B5563

Muted
#6B7280

Disabled
#9CA3AF
```

### Borders

```text
Default
#E5E7EB

Strong
#D1D5DB
```

---

# 6. Brand Colors

Default HotelOS brand:

```text
Primary
#2563EB

Primary Hover
#1D4ED8

Primary Light
#EFF6FF
```

Optional premium accent:

```text
Accent
#8B5CF6
```

Do NOT use both colors aggressively.

Primary blue should remain the main action color.

---

# 7. Semantic Colors

## Success

```text
#16A34A
```

Use for:

```text
Paid
Available
Confirmed
Completed
Clean
Success
```

## Warning

```text
#D97706
```

Use for:

```text
Pending
Attention
Late checkout
Low stock
```

## Error

```text
#DC2626
```

Use for:

```text
Failed
Cancelled
Overdue
Blocked
Critical
```

## Info

```text
#0284C7
```

Use for:

```text
Information
Tips
System messages
```

---

# 8. Dark Mode

Dark mode should be a first-class theme.

Do NOT simply invert colors.

Dark surfaces:

```text
Background
#0B0F14

Surface
#111827

Surface Secondary
#172033

Surface Hover
#1F2937

Border
#273244
```

Text:

```text
Primary
#F9FAFB

Secondary
#CBD5E1

Muted
#94A3B8
```

Primary:

```text
#60A5FA
```

---

# 9. Typography

Recommended font:

```text
Inter
```

Fallback:

```text
system-ui
-apple-system
BlinkMacSystemFont
"Segoe UI"
sans-serif
```

Optional premium marketing font:

```text
Manrope
```

But application UI should prioritize readability.

---

# 10. Type Scale

```text
Display
32px / 40px / 700

H1
28px / 36px / 700

H2
24px / 32px / 700

H3
20px / 28px / 600

H4
18px / 26px / 600

Body Large
16px / 24px

Body
14px / 22px

Body Small
13px / 20px

Caption
12px / 18px
```

Do not use extremely small text for important information.

---

# 11. Spacing System

Use 4px base spacing.

```text
4
8
12
16
20
24
32
40
48
64
80
```

Recommended:

```text
Page padding:
24px desktop

Card padding:
20px

Form gap:
16px

Section gap:
32px

Major section:
48px
```

---

# 12. Border Radius

```text
Small:
6px

Default:
8px

Medium:
10px

Large:
12px

Modal:
16px

Marketing:
20px
```

The application should not make every element pill-shaped.

---

# 13. Shadows

Use shadows only to establish hierarchy.

```text
Small:
0 1px 2px rgba(0,0,0,.05)

Medium:
0 4px 12px rgba(0,0,0,.08)

Modal:
0 20px 50px rgba(0,0,0,.15)
```

Most cards should rely on borders rather than shadows.

---

# 14. Application Layout

Desktop:

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar │ Top Navigation                                 │
│         ├───────────────────────────────────────────────┐ │
│         │ Breadcrumb / Page Title                        │ │
│         │                                                │ │
│         │ Main Content                                   │ │
│         │                                                │ │
│         │                                                │ │
│         └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

# 15. Sidebar

Width:

```text
Expanded:
248px

Collapsed:
72px
```

Sidebar structure:

```text
HotelOS
────────────────

Overview
Dashboard

Front Desk
Reservations
Calendar
Arrivals
Departures
In-House

Operations
Rooms
Housekeeping
Maintenance

Guests
Guests
VIP Guests

Finance
Folios
Payments
Invoices
Expenses

Analytics
Reports

Management
Staff
Inventory
Restaurant

System
Settings
```

---

# 16. Sidebar UX

Active navigation:

```text
Background:
#EFF6FF

Text:
#2563EB

Left indicator:
3px blue bar
```

Hover:

```text
#F3F4F6
```

Collapsed mode:

Show tooltips.

Never hide critical navigation without an accessible tooltip.

---

# 17. Top Bar

Top bar:

```text
┌────────────────────────────────────────────────────────────┐
│ ☰  Search...                  + New   🔔   ?   User Avatar │
└────────────────────────────────────────────────────────────┘
```

Features:

```text
Global Search
Quick Create
Notifications
Help
Property Switcher
User Menu
```

---

# 18. Property Switcher

For multi-property accounts:

```text
┌─────────────────────────────┐
│ 🏨 Grand Horizon Hotel      │
│    Bhopal                   │
│                             │
│ ✓ Grand Horizon Hotel       │
│   Lakeview Resort           │
│   City Palace Hotel         │
│                             │
│ Manage Properties →         │
└─────────────────────────────┘
```

Remember the last selected property.

---

# 19. Global Search

Shortcut:

```text
Cmd/Ctrl + K
```

Search:

```text
Guest
Reservation
Room
Invoice
Payment
Staff
```

Example:

```text
Search "Rahul"

Guests
Rahul Sharma
Rahul Verma

Reservations
RES-2026-00142

Invoices
INV-2026-00491
```

Keyboard navigation:

```text
↑ ↓
Enter
Esc
```

---

# 20. Command Palette

Support:

```text
Cmd/Ctrl + K
```

Commands:

```text
Create reservation
Check-in guest
Check-out guest
Find room
Open guest
Create invoice
Record payment
Open housekeeping
Open reports
Switch property
```

---

# 21. Dashboard Design

The dashboard should NOT contain 20 random cards.

Use hierarchy.

```text
Good Morning, Sarah
Monday, August 10

Grand Horizon Hotel
────────────────────────────────────────

[ 78% Occupancy ] [ ₹4.2L Revenue ] [ 126 Guests ]

────────────────────────────────────────

Today's Operations
┌─────────────────────┐ ┌─────────────────────┐
│ Arrivals       18   │ │ Departures     14   │
│ Check-ins      12   │ │ Pending         3   │
└─────────────────────┘ └─────────────────────┘

────────────────────────────────────────

Occupancy & Revenue
[                 Chart                 ]

────────────────────────────────────────

Room Status
[Available] [Occupied] [Dirty] [Maintenance]

────────────────────────────────────────

Today's Activity
```

---

# 22. KPI Cards

KPI card:

```text
Occupancy

78.4%
↑ 6.2%

vs previous week
```

Do not overload cards with:

```text
icons
badges
multiple charts
five numbers
```

One KPI should have one clear purpose.

---

# 23. Dashboard Charts

Recommended charts:

### Occupancy

Line/area chart.

### Revenue

Bar + line combination.

### Booking Source

Donut chart.

### Room Performance

Horizontal bars.

### Revenue Trend

7 / 30 / 90 day switch.

---

# 24. Dashboard Filters

Global dashboard filter:

```text
Today
Yesterday
7 Days
30 Days
This Month
Last Month
Custom
```

Property:

```text
All Properties
Grand Horizon
Lakeview
```

---

# 25. Room Grid

The room grid is one of the most important screens.

```text
┌─────────────────────────────────────────────────────────┐
│ Rooms                    Search      Filter   + Room    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 101  AVAILABLE     102 OCCUPIED      103 DIRTY        │
│     ₹4,500              Rahul             Clean         │
│                                                         │
│ 104  RESERVED      105 CLEAN          106 MAINTENANCE  │
│     14 Aug               —                 AC Issue     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# 26. Room Status Colors

Use color + text.

```text
Available
Green

Occupied
Blue

Reserved
Purple

Dirty
Amber

Maintenance
Red

Out of Order
Dark Red
```

Never rely on color alone.

Example:

```text
● Available
● Occupied
● Dirty
```

---

# 27. Reservation Calendar

Desktop calendar:

```text
                 AUG 10       AUG 11       AUG 12

Room 101      █████████████████████████
Room 102             █████████████████
Room 103      ███████
Room 104                       █████████████
Room 105             ███████████████████
```

Features:

```text
Drag
Resize
Move
Click
Hover preview
Quick actions
```

---

# 28. Reservation Card

Display:

```text
Rahul Sharma
RES-00125

Aug 10 → Aug 13
Room 205
Deluxe

₹18,500
CONFIRMED
```

Hover:

```text
View
Edit
Move Room
Check-in
Cancel
```

---

# 29. Reservation Creation UX

Use a side panel rather than a huge full-page form.

```text
┌───────────────────────────────────┐
│ New Reservation               ×   │
│                                   │
│ Guest                             │
│ [ Search guest...              ]  │
│                                   │
│ Dates                             │
│ [10 Aug] → [13 Aug]              │
│                                   │
│ Guests                            │
│ Adults [2] Children [0]           │
│                                   │
│ Room                              │
│ [Deluxe — Room 205]               │
│                                   │
│ Rate                              │
│ [Flexible Rate]                   │
│                                   │
│ Total                             │
│ ₹18,500                           │
│                                   │
│ [Cancel] [Confirm Reservation]    │
└───────────────────────────────────┘
```

---

# 30. Check-In UX

Make check-in a focused workflow.

```text
STEP 1
Guest

STEP 2
Room

STEP 3
Documents

STEP 4
Payment

STEP 5
Confirm
```

Progress indicator:

```text
● Guest ── ● Room ── ○ Documents ── ○ Payment ── ○ Confirm
```

---

# 31. Front Desk Screen

The front desk should be operationally dense.

```text
Today's Front Desk

┌─────────────────────────────────────────────────┐
│ Arrivals 18 │ Departures 14 │ In-house 126    │
└─────────────────────────────────────────────────┘

ARRIVALS

Guest          Room     Time      Status      Action

Rahul Sharma   205      12:00     Confirmed   Check-in
Amit Verma     310      13:00     Pending     Review
Sara Khan      104      14:00     Confirmed   Check-in
```

Actions should be one click.

---

# 32. Guest Profile

Header:

```text
Rahul Sharma
VIP Guest

+91 XXXXX XXXXX
rahul@email.com

[New Reservation]
[Check-in]
[Add Note]
```

Tabs:

```text
Overview
Reservations
Stays
Folio
Payments
Invoices
Notes
Documents
```

---

# 33. Guest Profile Summary

Show:

```text
Total Stays
8

Total Nights
24

Total Spent
₹2,84,500

Last Visit
July 2026
```

---

# 34. Folio UI

Folio should feel like a financial workspace.

```text
Rahul Sharma
Room 205 · Aug 10–13

──────────────────────────────────────

ROOM
Aug 10             ₹5,000
Aug 11             ₹5,000
Aug 12             ₹5,000

SERVICES
Breakfast            ₹800
Laundry              ₹500

──────────────────────────────────────

Subtotal           ₹16,300
Tax                 ₹2,934

TOTAL              ₹19,234

Paid                ₹10,000
Balance              ₹9,234

[Add Charge] [Payment] [Invoice]
```

---

# 35. Payment Modal

Keep it simple.

```text
Record Payment

Amount
[ ₹ 9,234 ]

Method
○ Cash
○ Card
○ UPI
○ Bank Transfer

Reference
[________________]

[Cancel] [Record Payment]
```

---

# 36. Invoice Design

Invoice must look printable and professional.

```text
┌───────────────────────────────────────────┐
│ HOTEL LOGO                                │
│ GRAND HORIZON HOTEL                       │
│ Address                                   │
│ GSTIN                                     │
│                                           │
│ INVOICE #INV-2026-00125                   │
│                                           │
│ Bill To: Rahul Sharma                     │
│                                           │
│ Room      Stay             Amount         │
│ 205       Aug 10–13        ₹15,000        │
│                                           │
│ Services                    ₹1,300        │
│ Tax                         ₹2,934        │
│                                           │
│ TOTAL                      ₹19,234        │
└───────────────────────────────────────────┘
```

---

# 37. Housekeeping UI

Housekeeping should be optimized for mobile.

Desktop:

```text
Housekeeping

Dirty       18
Cleaning     7
Inspection   4
Clean       42

──────────────────────────────

Room  Staff       Status

101   Priya       Cleaning
102   Aman        Dirty
103   Neha        Inspection
```

Mobile:

```text
101
Deluxe Room

Checkout
2:30 PM

● Dirty

[Start Cleaning]
```

---

# 38. Cleaning Checklist

```text
Room 205

☑ Bed
☑ Bathroom
☑ Towels
☑ Amenities
☐ Minibar
☑ Floor
☑ Trash

Notes
[________________]

[Mark as Clean]
```

Use large touch targets.

---

# 39. Maintenance UI

Ticket card:

```text
Room 205

AC not cooling

HIGH

Assigned:
Raj

Created:
10:42 AM

[Start] [Resolve]
```

---

# 40. Reports UI

Reports should use a consistent layout.

```text
Revenue Report

[Date Range] [Property] [Export]

Total Revenue
₹42,50,000

Room Revenue
₹31,20,000

F&B
₹8,40,000

Other
₹2,90,000

────────────────────────────

Revenue Trend
[ Chart ]

────────────────────────────

Details
[ Table ]
```

---

# 41. Tables

Tables are critical for PMS applications.

Rules:

```text
Readable
Sortable
Filterable
Paginated
Sticky header
Responsive
Keyboard accessible
```

Desktop row:

```text
Guest         Room     Dates         Status       Amount

Rahul Sharma  205      Aug 10–13     Confirmed    ₹18,500
Amit Verma    310      Aug 11–15     Checked-in   ₹24,000
```

---

# 42. Table Actions

Do not put 10 icons in every row.

Use:

```text
Primary action
+
More menu
```

Example:

```text
[Check-in] [•••]
```

More:

```text
View
Edit
Move Room
Payment
Invoice
Cancel
```

---

# 43. Forms

Forms should be divided into logical sections.

Bad:

```text
50 fields in one page
```

Good:

```text
Guest Information

Contact Information

Stay Information

Billing Information

Additional Information
```

Use progressive disclosure.

---

# 44. Form Validation

Validation should appear close to the field.

```text
Email
[rahul@]

Please enter a valid email address.
```

Do not show:

```text
ERROR: INVALID INPUT
```

Use human language.

---

# 45. Buttons

## Primary

```text
Blue background
White text
```

Example:

```text
[Create Reservation]
```

## Secondary

```text
White
Border
```

## Destructive

```text
Red
```

Example:

```text
[Cancel Reservation]
```

Require confirmation for destructive financial operations.

---

# 46. Button Hierarchy

Never have:

```text
[Blue] [Blue] [Blue] [Blue]
```

Prefer:

```text
[Primary Action] [Secondary] [More]
```

---

# 47. Empty States

Do not show blank screens.

Example:

```text
No reservations yet

Once reservations are created, they'll appear here.

[Create Reservation]
```

---

# 48. Loading States

Use skeletons.

Example:

```text
██████████████
████████
████████████████
```

Avoid full-page spinners for normal navigation.

---

# 49. Error States

Example:

```text
Something went wrong

We couldn't load today's reservations.

[Try Again]
```

Do not expose technical stack traces to users.

---

# 50. Toast Notifications

Use for small confirmations.

```text
✓ Reservation created successfully
```

Error:

```text
Could not process payment.
Please try again.
```

Do not use toasts for critical information that users must act on.

---

# 51. Confirmation Dialogs

Use for destructive actions.

```text
Cancel reservation?

This reservation will be cancelled and the room
will become available.

[Keep Reservation] [Cancel Reservation]
```

For financial actions:

```text
Refund ₹5,000?

This action cannot be automatically reversed.

[Cancel] [Confirm Refund]
```

---

# 52. Command UX

Common keyboard shortcuts:

```text
Cmd/Ctrl + K
Search

N
New reservation

G then R
Reservations

G then G
Guests

G then H
Housekeeping

Esc
Close modal

Enter
Confirm
```

Only use shortcuts when they don't interfere with normal typing.

---

# 53. Responsive Breakpoints

```text
Mobile:
< 640px

Tablet:
640–1024px

Desktop:
1024–1440px

Large:
1440px+
```

---

# 54. Mobile Navigation

Mobile should use bottom navigation for frequently used functions.

```text
┌──────────────────────────────────────┐
│                                      │
│             CONTENT                  │
│                                      │
├──────────────────────────────────────┤
│ Home │ Desk │ Rooms │ Tasks │ More  │
└──────────────────────────────────────┘
```

Housekeeping users should not have to open a hamburger menu repeatedly.

---

# 55. Mobile Touch Targets

Minimum:

```text
44 × 44px
```

Prefer:

```text
48 × 48px
```

for housekeeping actions.

---

# 56. Mobile Front Desk

Mobile screen:

```text
Good Morning

Arrivals
18

Departures
14

────────────────────

Next Arrival

Rahul Sharma
Room 205
12:00 PM

[Check-in]
```

---

# 57. Accessibility

Target:

```text
WCAG 2.2 AA
```

Requirements:

```text
Keyboard navigation
Visible focus
Screen reader labels
Sufficient contrast
No color-only status
Accessible modals
Accessible forms
Reduced motion
```

---

# 58. Focus States

Keyboard focus should be clearly visible.

Example:

```text
outline:
2px solid #2563EB

outline-offset:
2px
```

Never remove focus outlines without replacement.

---

# 59. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

Animations should be subtle.

---

# 60. Animation System

Animation should communicate state.

Use:

```text
150ms
200ms
250ms
```

Examples:

```text
Dropdown
Modal
Toast
Sidebar
Hover
Skeleton
```

Avoid:

```text
Long page transitions
Bouncing cards
Large animated backgrounds
```

---

# 61. Micro-interactions

Examples:

### Reservation created

```text
Button
Creating...

↓

✓ Reservation Created
```

### Room cleaned

```text
Dirty
 ↓
Cleaning
 ↓
✓ Clean
```

Small transitions make the system feel polished.

---

# 62. Status Badge Design

Use subtle badges.

```text
✓ Confirmed

● Checked-in

● Pending

● Cancelled
```

Example:

```text
background: light semantic color
text: dark semantic color
radius: 6px
padding: 4px 8px
```

Avoid giant pills.

---

# 63. Date & Time UX

Always show clear dates.

Prefer:

```text
10 Aug 2026
12:30 PM
```

instead of:

```text
2026-08-10T12:30:00
```

Store timestamps consistently in UTC where appropriate, but display in the property's configured timezone.

---

# 64. Currency UX

Always display currency.

```text
₹18,500
$245.00
€245.00
```

Do not display:

```text
18500
```

when context is ambiguous.

---

# 65. Search UX

Search should support fuzzy matching.

Example:

```text
Search:
rahul

Results:

Rahul Sharma
Room 205
Checked-in

Rahul Verma
Reservation #124
Aug 14
```

Highlight matched terms.

---

# 66. Filters

Use filter button:

```text
[Filter 3]
```

Panel:

```text
Status
☑ Confirmed
☐ Pending
☐ Cancelled

Room Type
☑ Deluxe

Date
[Aug 10] → [Aug 20]

[Clear] [Apply]
```

---

# 67. Notification Center

```text
Notifications

Today

🔔 Payment received
₹12,500 from Rahul Sharma

🧹 Room 205 cleaned

⚠ Room 104 maintenance issue

📅 New reservation received
```

Unread indicator:

```text
blue dot
```

---

# 68. User Profile Menu

```text
Sarah Johnson
General Manager

My Profile
Preferences
Keyboard Shortcuts
Help
Security
Sign out
```

---

# 69. Settings Architecture

Settings should not be one giant page.

Use categories:

```text
General
Property
Rooms
Reservations
Rates
Taxes
Billing
Payments
Notifications
Users & Roles
Integrations
Booking Engine
Branding
Security
API
Audit Logs
```

---

# 70. Onboarding UX

First login:

```text
Welcome to HotelOS

Let's set up your hotel.

1 ─ Hotel
2 ─ Rooms
3 ─ Rates
4 ─ Staff
5 ─ Finish
```

Progress should persist.

---

# 71. Setup Checklist

Dashboard:

```text
Hotel Setup

✓ Hotel profile
✓ Add rooms
✓ Add room types
✓ Configure taxes
○ Add staff
○ Configure payment
○ Enable booking engine

4 / 7 completed
```

Clicking an item takes user directly to the required screen.

---

# 72. Design Tokens

Create tokens in code.

Example:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;

  --color-background: #f6f7f9;
  --color-surface: #ffffff;

  --color-text: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #6b7280;

  --color-border: #e5e7eb;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}
```

Use semantic tokens instead of hard-coded colors throughout components.

---

# 73. Component Library

Build reusable components:

```text
Button
IconButton
Input
Textarea
Select
Combobox
DatePicker
DateRangePicker
TimePicker
Checkbox
Radio
Switch
Tabs
Badge
Avatar
Tooltip
Popover
Dropdown
Modal
Drawer
Toast
Alert
Card
Table
DataTable
Pagination
CommandPalette
Calendar
Timeline
StatCard
Chart
EmptyState
Skeleton
Breadcrumb
```

---

# 74. Hospitality Components

Create specialized components:

```text
RoomCard
RoomStatusBadge
ReservationCard
ReservationTimeline
GuestCard
GuestAvatar
FolioTable
PaymentSummary
InvoicePreview
HousekeepingCard
MaintenanceTicket
OccupancyChart
RevenueChart
RateCalendar
RoomGrid
FrontDeskQueue
```

These should become the visual identity of HotelOS.

---

# 75. Room Card Design

```text
┌─────────────────────────┐
│ 205              Deluxe │
│                         │
│ ● OCCUPIED              │
│                         │
│ Rahul Sharma            │
│ Checkout: Aug 13        │
│                         │
│ [Open]          •••     │
└─────────────────────────┘
```

---

# 76. Premium Detail Pages

Every major detail page should use:

```text
Header
Summary
Primary Actions

Tabs

Main Content
Sidebar / Context
```

Example:

```text
Guest Profile
──────────────────────────────

Rahul Sharma       [Check-out]

VIP · Room 205

Overview | Stay | Folio | Payments | Notes

──────────────────────────────

Timeline
```

---

# 77. Data Density

Hotel PMS is operational software.

Therefore:

```text
Dashboard:
Medium density

Front Desk:
High density

Reservations:
High density

Reports:
High density

Settings:
Low/medium density

Marketing:
Low density
```

Do not use the same spacing everywhere.

---

# 78. Visual Hierarchy

Every page should answer:

```text
1. Where am I?
2. What is important?
3. What should I do?
4. What happened?
```

Example:

```text
Reservations
↓
Today's bookings
↓
[New Reservation]
↓
Reservation table
```

---

# 79. Design Don'ts

Never:

```text
❌ Use 5 primary colors
❌ Use giant gradients
❌ Use excessive glassmorphism
❌ Put everything inside cards
❌ Use tiny 10px text
❌ Use icon-only buttons without tooltip
❌ Hide important actions
❌ Create giant forms
❌ Use color as the only status indicator
❌ Use desktop-only interactions
```

---

# 80. Design Quality Checklist

Before shipping each screen:

```text
[ ] Clear page title
[ ] Clear primary action
[ ] Correct spacing
[ ] Good typography
[ ] Responsive
[ ] Keyboard accessible
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Success state
[ ] Mobile state
[ ] Dark mode
[ ] Accessibility labels
[ ] Proper focus state
```

---

# 81. 2026 UX Features

HotelOS should feel current in 2026.

Include:

```text
Command Palette
AI-assisted actions
Smart search
Keyboard shortcuts
Responsive PWA
Dark mode
Real-time updates
Optimistic UI where safe
Contextual actions
Smart notifications
Activity timeline
Saved filters
Personalized dashboard
```

---

# 82. AI UX

AI should appear as an assistant, not dominate the interface.

Example:

```text
✨ Hotel Assistant

Ask about your hotel...

"Why is occupancy low this week?"

[Ask]
```

Suggested questions:

```text
"Show today's revenue"
"Which rooms need attention?"
"Why are cancellations high?"
"Summarize today's operations"
```

---

# 83. Real-Time UX

Use real-time updates for:

```text
Room status
Reservations
Payments
Housekeeping
Notifications
Front desk
```

Example:

```text
Room 205

● Cleaning...

Updated just now
```

Avoid constantly refreshing the entire page.

---

# 84. Optimistic UI

Use optimistic updates for safe actions.

Example:

```text
Housekeeper:
Mark Clean

UI:
✓ Clean

Server:
Save
```

If server fails:

```text
Unable to update room status.

[Retry]
```

Do NOT use unsafe optimistic behavior for irreversible financial transactions.

---

# 85. UX for Errors

Every error should tell the user:

```text
What happened
Why it happened if useful
What they can do next
```

Example:

```text
Room unavailable

Room 205 was just reserved by another guest.

Choose another room.
```

This is much better than:

```text
409 Conflict
```

---

# 86. Final Design Direction

HotelOS should visually resemble a premium modern SaaS platform:

```text
┌─────────────────────────────────────────────────────────┐
│ HOTEL OS        Search...     + New    🔔    Sarah      │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ Dashboard    │ Good morning, Sarah                     │
│              │                                          │
│ Front Desk   │ ┌────────┐ ┌────────┐ ┌────────┐       │
│ Reservations │ │78%     │ │₹4.2L   │ │126     │       │
│ Rooms        │ │Occup.  │ │Revenue │ │Guests  │       │
│ Housekeeping │ └────────┘ └────────┘ └────────┘       │
│              │                                          │
│ Guests       │ Today's Operations                      │
│ Billing      │ ┌────────────────────────────────────┐   │
│ Reports      │ │ Arrivals 18   Departures 14        │   │
│              │ └────────────────────────────────────┘   │
│ Settings     │                                          │
│              │ Occupancy & Revenue                     │
│              │ ┌────────────────────────────────────┐   │
│              │ │            CHART                   │   │
│              │ │                                    │   │
│              │ └────────────────────────────────────┘   │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

# 87. Final Product Experience

The ideal experience is:

### Hotel Owner

```text
Login
 ↓
See business performance
 ↓
Revenue
Occupancy
ADR
RevPAR
 ↓
Understand hotel performance
```

### Receptionist

```text
Login
 ↓
See arrivals
 ↓
Find guest
 ↓
Check-in
 ↓
Take payment
 ↓
Done
```

### Housekeeper

```text
Open mobile app
 ↓
See assigned rooms
 ↓
Clean room
 ↓
Complete checklist
 ↓
Mark Clean
```

### Accountant

```text
Login
 ↓
Payments
 ↓
Invoices
 ↓
Taxes
 ↓
Revenue reports
 ↓
Export
```

### Hotel Manager

```text
Dashboard
 ↓
Operations
 ↓
Rooms
 ↓
Housekeeping
 ↓
Revenue
 ↓
Reports
```

---

# 88. Golden Rule

The design should always optimize for:

```text
CLARITY
   ↓
SPEED
   ↓
CONFIDENCE
   ↓
EFFICIENCY
```

Not:

```text
Animation
   ↓
Decoration
   ↓
More Cards
   ↓
More Colors
```

---

# 89. Final Design Acceptance Criteria

The UI is ready for commercial release only when:

```text
[ ] Looks professional without customization
[ ] Works on 1366px desktop
[ ] Works on 1440px desktop
[ ] Works on mobile
[ ] Works on tablet
[ ] Dark mode complete
[ ] WCAG 2.2 AA target
[ ] Keyboard navigation works
[ ] Command palette works
[ ] Global search works
[ ] Empty states complete
[ ] Loading states complete
[ ] Error states complete
[ ] Success states complete
[ ] Front desk optimized
[ ] Housekeeping optimized
[ ] Financial screens readable
[ ] Reservation calendar usable
[ ] No unnecessary clicks
[ ] No confusing forms
[ ] Consistent components
[ ] Consistent spacing
[ ] Consistent typography
[ ] Consistent status colors
[ ] No color-only indicators
[ ] Mobile touch targets ≥ 44px
[ ] Print/PDF layouts tested
[ ] Demo hotel looks realistic
```

---

# 90. Design North Star

> **HotelOS should make a busy hotel employee feel faster, not overwhelmed.**

Every screen should answer the user's question immediately:

**"What is happening, what needs my attention, and what can I do next?"**

That is the core UX principle of the entire 2026 HotelOS design system.
