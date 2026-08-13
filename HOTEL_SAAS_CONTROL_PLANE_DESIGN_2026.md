# HotelOS — Enterprise Hotel Management SaaS
## Control Plane + Customer Plane + Multi-Property Hotel Platform
### Product & Architecture Specification — 2026

---

# 1. Product Vision

HotelOS is a modern, enterprise-grade, multi-property Hotel Management Platform designed for hotel groups, luxury hotels, resorts, chains, and multinational hospitality organizations.

The platform consists of two major systems:

1. **SaaS Control Plane**
2. **Customer Hotel Platform**

The architecture must support:

- SaaS Cloud
- Dedicated Cloud
- Customer Cloud
- Private Cloud
- On-Premise
- Air-Gapped Enterprise deployments

The same core product should be deployable in all environments.

---

# 2. Core Architectural Principle

The SaaS owner's infrastructure must NOT become the permanent storage location for customer hotel operational data.

## Control Plane

Owned and controlled by the HotelOS SaaS company.

Contains:

- Organizations
- Licenses
- Plans
- Features
- Feature Flags
- UI Configuration
- Content
- Branding
- Guidelines
- Master Data
- Deployment Metadata
- Releases
- Version Management
- Support
- Billing
- Product Analytics
- Audit
- Optional Health Telemetry

## Customer Plane

Owned by the hotel/customer.

Contains:

- Guest Data
- Reservations
- Rooms
- Employees
- Finance
- Payments
- Housekeeping
- Maintenance
- F&B
- CRM
- Reports
- Documents
- Operational Data

---

# 3. Three-Plane Architecture

```text
                         HOTELos
                            |
                +-----------+-----------+
                |                       |
                v                       v
         CONTROL PLANE            CUSTOMER PLANE
         Your Platform            Customer Platform
                |                       |
        +-------+-------+       +-------+-------+
        |       |       |       |       |       |
      SaaS    UI      License   PMS    CRM    Finance
      Admin   CMS     Engine     |       |       |
        |       |       |        +-------+-------+
        |       |       |                |
        v       v       v          Customer Database
     Product Configuration          Customer Files


     Optional logical separation:

CONTROL PLANE
      |
      | Secure Control Channel
      |
      v
CUSTOMER PLANE
      |
      v
DATA PLANE
4. Deployment Architecture

HotelOS must support multiple deployment models.

4.1 SaaS
Hotel Customer
      |
      v
HotelOS Cloud
      |
      v
HotelOS Infrastructure
4.2 Dedicated Cloud
Hotel Customer
      |
      v
Dedicated HotelOS Environment
      |
      +---- Dedicated Database
      +---- Dedicated Application
4.3 Customer Cloud
Hotel Customer AWS/Azure/GCP
            |
            +---- HotelOS Application
            +---- HotelOS Database
            +---- HotelOS Storage
4.4 On-Premise
Customer Data Center
        |
        +---- HotelOS
        +---- PostgreSQL
        +---- Redis
        +---- Storage
4.5 Air-Gapped
No Internet
     |
     v
Customer Infrastructure
     |
     +---- HotelOS
     +---- Database
     +---- License
     +---- Local Updates
5. Control Plane

The Control Plane is the SaaS owner's master management system.

Navigation:

SUPER ADMIN
|
+-- Command Center
|
+-- Organizations
|
+-- Customers
|
+-- Properties
|
+-- Deployments
|
+-- Licenses & Plans
|
+-- Modules
|
+-- Feature Flags
|
+-- UI Studio
|
+-- Content Studio
|
+-- Brand Studio
|
+-- Organization Guidelines
|
+-- Master Data
|
+-- Configuration
|
+-- Integrations
|
+-- API Management
|
+-- Releases
|
+-- Update Manager
|
+-- Support
|
+-- Audit & Security
|
+-- Analytics
|
+-- Billing
|
+-- System Settings
6. Super Admin Command Center

The first screen should provide a complete SaaS business overview.

Dashboard
GOOD MORNING, ADMIN

CUSTOMERS
247 Active
18 Trial
6 Suspended

PROPERTIES
1,842

USERS
82,430

DEPLOYMENTS
Cloud        187
Customer      43
On-Prem       17

SYSTEM
● All Systems Operational

UPDATES
3 Customers Require Update

LICENSES
8 Expiring This Month

ALERTS
2 Critical
7 Warnings
7. Customer Health Dashboard
CUSTOMER HEALTH

Hotel Group          Properties    Version     Status

ABC Hospitality          42          2026.4     ● Healthy
XYZ Hotels               18          2026.3     ⚠ Update
Global Resorts            76          2026.4     ● Healthy

Health indicators:

Application
Database
License
Version
Storage
Backup
Integrations
Last Sync
Deployment
Security

For customer-managed infrastructure, health telemetry must be explicitly configured and customer-approved.

8. Organization Management

Organizations represent hotel groups or enterprise customers.

Example:

ABC Hospitality Group
|
+-- India
|   |
|   +-- Mumbai
|   +-- Delhi
|   +-- Bangalore
|
+-- UAE
|   |
|   +-- Dubai
|   +-- Abu Dhabi
|
+-- Singapore

Organization management:

Legal entity
Organization name
Parent company
Brands
Countries
Regions
Clusters
Properties
Licenses
Modules
Deployment
Subscription
Contacts
Support level
Contract
Technical configuration
9. Organization Profile
ABC HOSPITALITY GROUP

Organization ID:
ORG-000123

Industry:
Hospitality

Country:
India

Primary Contact:
...

Billing Contact:
...

Technical Contact:
...

Plan:
Enterprise

Deployment:
Customer Managed

Version:
2026.4

Properties:
42

Users:
4,821

Modules:
PMS
CRM
Revenue
Finance
HR
F&B
Engineering
Analytics
10. Property Management

Organization hierarchy:

Organization
    |
    +-- Brand
          |
          +-- Region
                |
                +-- Cluster
                      |
                      +-- Property

Example:

ABC Hospitality
|
+-- Luxury Brand
|     |
|     +-- India
|           |
|           +-- North
|                 |
|                 +-- Delhi Hotel
|                 +-- Jaipur Hotel
|
+-- Resort Brand
      |
      +-- Goa Resort
11. Deployment Manager

The SaaS owner must be able to create and manage deployments.

Deployment Wizard
NEW CUSTOMER

1. Select Organization
2. Select Plan
3. Select Modules
4. Select Deployment
5. Configure Environment
6. Configure License
7. Generate Deployment Package
8. Deploy
9. Verify
10. Activate
12. Deployment Modes
DEPLOYMENT MODE

○ SaaS
○ Dedicated Cloud
○ Customer Cloud
○ Private Cloud
○ On-Premise
○ Air-Gapped Enterprise
13. Customer Database Model

The customer deployment owns its operational database.

Recommended primary database:

PostgreSQL

Customer data:

Guest
Reservation
Room
Employee
Payment
Invoice
Finance
Housekeeping
Maintenance
F&B
CRM
Documents
Reports

The Control Plane should not require direct database access to operate the customer's hotel system.

14. License Engine

Use signed licenses rather than permanent database dependency.

Example:

LICENSE

Organization:
ABC Hospitality

Plan:
Enterprise

Valid Until:
31 Dec 2027

Properties:
100

Users:
Unlimited

Modules:
PMS
Finance
Revenue
CRM
Analytics

Deployment:
Customer Managed

Support:

Online license validation
Offline license
Signed license
Expiration
Property limits
User limits
Module limits
Deployment restrictions
Feature entitlements
15. Offline Licensing

For air-gapped environments:

HotelOS
   |
   +-- Offline License
   |
   +-- Signed Configuration
   |
   +-- Local Validation

The hotel must be able to operate without a permanent connection to the SaaS Control Plane.

16. Security Principle

Never implement a permanent hidden administrator backdoor.

Do NOT design:

SaaS Admin
     |
     v
Customer Database

Instead use:

Customer Support Request
        |
        v
Customer Approval
        |
        v
Temporary Access
        |
        v
Limited Scope
        |
        v
Audit
        |
        v
Automatic Expiration
17. Just-In-Time Support Access

Support access example:

SUPPORT ACCESS

Customer:
ABC Hospitality

Reason:
Troubleshoot reservation synchronization

Scope:
Application Logs

Duration:
30 Minutes

Approved By:
Customer IT Admin

Status:
Active

[REVOKE ACCESS]

Requirements:

Explicit approval
MFA
Time limit
Scope limit
Audit log
Automatic expiration
Manual revoke
18. Super Admin Roles

Do not give every internal employee full access.

SaaS Owner
Everything
SaaS Operations Admin
Customers
Deployments
Support
Health
SaaS Content Admin
UI
Content
Translations
Guidelines
SaaS Support Admin
Support
Diagnostics
Temporary Access
Logs
19. Break-Glass Access

Even the SaaS Owner should have controlled emergency access.

BREAK GLASS ACCESS

Reason:
Required

MFA:
Required

Duration:
Limited

Audit:
Required
20. UI Studio

The UI Studio is the central interface customization system.

UI STUDIO

Navigation
Themes
Colors
Typography
Buttons
Tables
Forms
Cards
Charts
Modals
Notifications
Empty States
Icons
Layouts
21. Design System Manager
DESIGN SYSTEM

Colors
Typography
Spacing
Radius
Shadows
Icons
Components
Layouts
Tables
Forms
Charts
Accessibility

Example:

Primary:
#0F766E

Secondary:
#D4AF37

Background:
#F8FAFC

Radius:
12px

Font:
Inter
22. Theme Management

Support:

Light Mode
Dark Mode
Auto Mode
Brand Theme
Organization Theme
Property Theme

Theme inheritance:

Global
  |
  v
Brand
  |
  v
Organization
  |
  v
Property
  |
  v
Role
  |
  v
User
23. White Label

Every organization can have its own branding.

Support:

Logo
Favicon
Primary Color
Secondary Color
Typography
Login Screen
Email Branding
PDF Branding
Invoice Branding
Guest Portal Branding
Mobile Branding
24. Organization UI Override

Example:

GLOBAL

Primary:
#0F766E

Organization:

ABC Hospitality

Primary:
#123456

Property:

Mumbai Hotel

Primary:
#8A6D3B
25. Content Studio

Content must be configurable without deploying code.

CONTENT STUDIO

Pages
Help Content
Tooltips
Announcements
System Messages
Email Templates
SMS Templates
Push Notifications
Onboarding
Guides
FAQs
Policy Text
Terms
26. Content Workflow
Draft
  |
  v
Review
  |
  v
Approve
  |
  v
Publish
  |
  v
Archive

Every content item must contain:

Key
Type
Locale
Version
Status
Fallback
Created By
Approved By
Published At
27. Translation Management

Support:

English
Hindi
Arabic
French
German
Spanish

Example:

reservation.check_in

English:
Check-in

Hindi:
चेक-इन

Arabic:
تسجيل الوصول
28. Dynamic UI Text

Example:

Key:
reservation.check_in

Default:

Check-in

Customer override:

Guest Check-In

The application should retrieve text from the configuration/content system.

29. Organization Guidelines Manager

Each organization can have its own standards.

ORGANIZATION GUIDELINES

Brand Guidelines
Operational Guidelines
Guest Service Guidelines
UI Guidelines
Communication Guidelines
Naming Guidelines
Department Guidelines
Data Guidelines
Security Guidelines
30. Hotel Profile Guidelines

Example:

HOTEL PROFILE STANDARD

Property Name:
Required

Short Description:
Maximum 300 Characters

Long Description:
Maximum 2,000 Characters

Logo:
Minimum 1000x1000

Cover Image:
16:9

Amenities:
Approved Taxonomy Only

Star Rating:
Controlled Field

Contact Information:
Required

Emergency Contact:
Required
31. Master Data Manager

Global master data:

MASTER DATA

Room Types
Room Features
Amenities
Departments
Job Titles
Countries
Currencies
Languages
Taxes
Payment Methods
Rate Types
Meal Plans
Guest Types
Market Segments
Source Codes
Reservation Types
Cancellation Reasons
Complaint Categories
Maintenance Categories
32. Master Taxonomy

Example:

ROOM TYPES

Standard Room
Deluxe Room
Executive Room
Suite
Presidential Suite
Villa

Master data should support:

Global values
Brand values
Organization values
Property values
Custom values
Active/inactive
Versioning
Audit
33. Configuration Ownership

Every configuration must have an owner.

Platform
Brand
Organization
Property
Department
Role
User
34. Configuration Inheritance

Example:

GLOBAL
   |
   v
BRAND
   |
   v
ORGANIZATION
   |
   v
PROPERTY
   |
   v
ROLE
   |
   v
USER

Default configuration should be inherited.

Customer-specific configuration can override it.

35. Reset to Global

If a customer overrides a value:

CUSTOM OVERRIDE

ABC Hospitality

Primary Color:
#123456

[Reset to Global]
36. Feature Management

Features must be independently controllable.

FEATURES

PMS                 ✓
Housekeeping        ✓
Revenue             ✓
CRM                 ✓
F&B                 ✓
Procurement         ✓
AI                  ✗
Advanced Analytics  ✓
37. Feature Flag System

Feature flags can operate at multiple levels:

Global
Environment
Plan
Organization
Property
Role
User

Example:

AI Assistant

Global:
OFF

Enterprise:
ON

ABC Hospitality:
ON

Small Hotel:
OFF
38. Product Plans

Plans should be configurable.

Example:

STARTER
PRO
ENTERPRISE
PRIVATE CLOUD
ON-PREMISE

Plans can define:

Properties
Users
Storage
Modules
API
SSO
Audit
Support
Deployment
AI
Analytics
39. Pricing Model

Support multiple pricing models:

Subscription
Annual License
Per Property
Per User
Per Module
Enterprise Contract
Perpetual + Maintenance

Pricing logic must not be hard-coded.

40. Subscription Management
CUSTOMER

Contract
Plan
License
Billing
Renewal
Usage
Modules
Deployment
41. License Expiration

The system should alert:

90 Days
60 Days
30 Days
14 Days
7 Days
1 Day
Expired
42. Release Manager

Central release management:

RELEASE CENTER

Version:
2026.5

New:
Revenue Dashboard
AI Assistant
New Booking Calendar

Fixed:
Housekeeping Issue
Invoice Issue

Security:
Security Patches

Migration:
Database Migration Required
43. Version Management

Example:

ABC Hospitality

Current:
2026.3

Latest:
2026.5

Status:
Update Available

Actions:

View Changes
View Compatibility
Generate Update
Schedule Update
44. Update Architecture
Control Plane
      |
      v
Signed Release
      |
      v
Customer Deployment Agent
      |
      v
Backup
      |
      v
Database Migration
      |
      v
Application Update
      |
      v
Health Check

Never blindly update production.

45. Database Migration Manager

Each release contains versioned migrations.

2026.4
   |
   +-- Migration 001
   +-- Migration 002
   +-- Migration 003
   |
   v
2026.5

Support:

Backup
Migration Preview
Migration Status
Migration Logs
Rollback Strategy
46. Backup Management

Configuration should support:

Daily
Weekly
Monthly
Retention
Encryption
Restore Testing

For customer-managed installations, backup storage remains under customer control.

47. Secrets Management

Never store sensitive secrets in ordinary application tables.

Examples:

Database Password
API Secret
Encryption Key
Payment Secret
OAuth Secret

Use:

Vault
Cloud KMS
Environment Secrets
Secrets Manager
48. Audit System

Every important administrative action must be logged.

Example:

SUPER ADMIN AUDIT

Admin:
John

Action:
Enabled Revenue Module

Organization:
ABC Hospitality

Previous:
Disabled

New:
Enabled

Reason:
Enterprise Contract

Timestamp:
2026-08-13 10:45
49. Audit Requirements

Audit:

Login
Logout
Configuration change
User creation
User deletion
Permission change
License change
Module activation
Deployment
Update
Support access
Content publishing
UI publishing
Data export
Security changes
50. Customer Hotel Platform

The customer-side platform is the actual hotel management application.

Main navigation:

HOTEL PLATFORM

Dashboard

Front Office
Reservations
Front Desk
Guest Management
Rooms
Housekeeping
Maintenance

Revenue
Rates
Inventory
Revenue Management

F&B
Restaurants
POS Integration
Menus
Orders

Finance
Invoices
Payments
Accounting
Reports

CRM
Guests
Profiles
Loyalty
Marketing

HR
Employees
Departments
Attendance
Roles

Procurement
Vendors
Purchase Orders
Inventory

Engineering
Assets
Work Orders
Preventive Maintenance

Analytics
Reports
Dashboards

Administration
Organization
Properties
Users
Roles
Permissions
Configuration
Integrations
Audit
51. Enterprise Hotel Hierarchy
SaaS Owner
   |
   +-- Organization
          |
          +-- Brand
                |
                +-- Region
                      |
                      +-- Country
                            |
                            +-- Cluster
                                  |
                                  +-- Property
                                        |
                                        +-- Department
                                              |
                                              +-- Team
                                                    |
                                                    +-- User
52. Hotel Roles

Example roles:

Managing Director
Regional Director
General Manager
Hotel Manager
Director of Operations
Director of Finance
Director of Sales
Revenue Manager
Front Office Manager
Housekeeping Manager
F&B Manager
Engineering Manager
HR Manager
Department Head
Supervisor
Staff
53. Permission Model

Use:

RBAC
+
ABAC
+
Scope
RBAC

Role-based permissions.

ABAC

Attribute-based permissions.

Scope

Permission applies to:

Global
Organization
Region
Country
Property
Department
Team
54. Example Permission
Permission:
VIEW_REVENUE_REPORT

Role:
General Manager

Scope:
Property

Access:
Allowed

Finance Director:

VIEW_FINANCIAL_REPORT

Scope:
Organization

Access:
Allowed

Front Desk:

VIEW_FINANCIAL_REPORT

Access:
Denied
55. Executive Dashboard

Managing Director dashboard:

GROUP PERFORMANCE

Occupancy
ADR
RevPAR
Revenue
GOP
Guest Satisfaction
Rooms Sold
Forecast
Market Segment
Property Comparison
56. General Manager Dashboard
TODAY

Occupancy
Arrivals
Departures
VIP Guests
Room Status
Revenue
Guest Complaints
Housekeeping
Maintenance
Staff
Alerts
57. Department Head Dashboard

Example Housekeeping:

HOUSEKEEPING

Rooms Dirty
Rooms Clean
Rooms Inspected
Stayover
Checkout
Out of Order
Pending Tasks
Staff Productivity
58. Front Desk Dashboard
FRONT DESK

Arrivals
Departures
Walk-ins
VIP
No Shows
Room Availability
Room Status
Pending Payments
Guest Requests
59. Guest Profile
GUEST

Identity
Contact
Preferences
Stay History
Reservations
Room History
Payments
Complaints
Requests
Loyalty
Communication
Documents
60. Reservation Management
RESERVATION

Guest
Property
Room
Rate
Dates
Guests
Market Segment
Source
Payment
Guarantee
Special Requests
Status
Notes

Statuses:

Inquiry
Tentative
Confirmed
Checked In
Checked Out
Cancelled
No Show
61. Room Management
ROOM

Room Number
Room Type
Floor
Building
Status
Housekeeping Status
Maintenance Status
Features
Rate
Occupancy

Room status:

Vacant
Occupied
Dirty
Clean
Inspected
Out of Order
Out of Service
Blocked
62. Housekeeping
HOUSEKEEPING

Room Board
Task Management
Assignments
Inspection
Lost & Found
Linen
Amenities
Productivity
Deep Cleaning
Maintenance Requests
63. Maintenance
ENGINEERING

Work Orders
Assets
Preventive Maintenance
Emergency Requests
Technicians
Parts
Vendors
Asset History
Maintenance Cost
64. Finance
FINANCE

Invoices
Payments
Refunds
Taxes
Folio
Accounts Receivable
Accounts Payable
General Ledger Integration
Revenue
Expense
Financial Reports
65. Revenue Management
REVENUE

Rates
Rate Plans
Restrictions
Inventory
Forecast
Demand
Pickup
Competitor Rates
Occupancy
ADR
RevPAR
Revenue Strategy
66. CRM
CRM

Guest Profiles
Segments
Preferences
Loyalty
Campaigns
Marketing
Feedback
Complaints
Guest Journey
Communication
67. F&B
F&B

Restaurants
Outlets
Menus
Tables
Orders
POS Integration
Kitchen
Inventory
Recipes
Costing
Revenue
68. Procurement
PROCUREMENT

Vendors
Products
Purchase Requests
Purchase Orders
Approvals
Goods Receiving
Invoices
Contracts
69. HR
HR

Employees
Departments
Roles
Attendance
Schedules
Leave
Documents
Training
Performance
70. Analytics

Analytics must support multiple hierarchy levels:

Group
Region
Country
Cluster
Property
Department

Reports:

Occupancy
ADR
RevPAR
Revenue
Profit
Guest Satisfaction
Labor
Housekeeping
Maintenance
F&B
Sales
Marketing
71. Tenant Simulator / Support View

The SaaS admin can request a customer support session.

Organizations
      |
      v
ABC Hospitality
      |
      v
[Request Support Session]
      |
      v
Customer Approval
      |
      v
Limited Session

The session must be:

Temporary
Audited
Scope-limited
Customer-approved
72. Configuration Impact Analysis

Before publishing configuration changes:

CHANGE IMPACT

This change affects:

42 Organizations
183 Properties
17 Reports
8 Integrations
3 Booking Templates

Actions:

Cancel
Review Impact
Publish
73. Configuration Diff

Example:

BEFORE

Refund Approval:
₹25,000

AFTER

Refund Approval:
₹50,000

Actions:

Approve
Reject
Schedule
74. Configuration Versioning
CONFIGURATION

Version 42
    |
    v
Version 43
    |
    v
Version 44

Actions:

Compare
Publish
Rollback
75. API Management

Control Plane should manage:

API Keys
OAuth Clients
Webhooks
API Usage
Rate Limits
API Logs
API Versions
Integration Credentials
76. Integration Marketplace

Potential integrations:

Payment
OTA
GDS
Accounting
Payroll
HR
POS
Door Locks
CCTV
Biometric
CRM
Revenue Management
Email
SMS
WhatsApp

Each integration:

Available
Enabled
Configured
Healthy
Warning
Failed
77. Integration Health

Example:

Booking Channel
● Connected

Payment Gateway
● Connected

Accounting
⚠ Token expires in 12 days

POS
🔴 Connection Failed
78. Enterprise Identity

Support:

OAuth2
OIDC
SAML
SSO
Microsoft Entra ID
Okta
Google Workspace
79. SCIM

Enterprise identity provisioning:

Corporate Identity Provider
          |
          v
         SCIM
          |
          v
      HotelOS
          |
    +-----+-----+
    |     |     |
 Users  Roles  Groups

When an employee leaves:

Identity Provider
       |
       v
Deactivate
       |
       v
HotelOS Access Removed
80. SaaS Support Center
SUPPORT

Open Tickets
Critical Tickets
Customer Issues
Deployment Issues
Integration Errors
Update Failures
Security Issues

Every ticket should connect to:

Organization
Property
Version
Deployment
Module
Error
User
81. Customer Data Boundary

The following data should normally stay inside the customer's environment:

Guest Data
Employee Data
Reservation Data
Financial Data
Payment Data
Operational Data
Documents
Hotel Reports
Guest Preferences

Control Plane should only store what is required for:

Licensing
Deployment
Product Management
Billing
Support
Optional Telemetry
82. Data Isolation

Every customer deployment must have strong isolation.

Preferred model:

Customer A
    |
    +-- Application
    +-- Database
    +-- Storage
    +-- Secrets

Customer B
    |
    +-- Application
    +-- Database
    +-- Storage
    +-- Secrets

Never mix customer operational data accidentally.

83. Recommended Technology Stack
Frontend
React
Next.js
TypeScript
Tailwind CSS
Enterprise Design System
Backend

Recommended options:

NestJS + TypeScript

or for large enterprise environments:

Java + Spring Boot

The final choice should be made based on team expertise, hiring, integrations, and enterprise requirements.

84. Database

Primary recommendation:

PostgreSQL

Optional enterprise support:

Microsoft SQL Server

Do not support many databases initially unless there is a real customer requirement.

85. Cache
Redis

Use for:

Sessions
Caching
Queues
Rate Limiting
Temporary Data
86. Messaging

Depending on scale:

RabbitMQ

or:

Kafka

Use event-driven architecture for:

Reservation Created
Guest Checked In
Payment Completed
Room Status Changed
Invoice Created
Maintenance Created
87. Object Storage

Use S3-compatible object storage.

Examples:

AWS S3
Azure Blob
Google Cloud Storage
MinIO

Customer-managed deployments should support customer-controlled storage.

88. Search

For advanced enterprise search:

OpenSearch

or:

Elasticsearch
89. Authentication

Recommended:

OAuth2
OIDC
SAML
MFA
Passkeys where appropriate
90. Deployment Technology

Support:

Docker
Kubernetes
Helm

Customer deployment package:

Docker Images
Helm Charts
Configuration
Database Migrations
License
Documentation
Health Checks
91. Observability

Recommended:

OpenTelemetry

Track:

Logs
Metrics
Traces
Errors
Performance
Availability

For customer-managed installations, telemetry must respect customer privacy and contractual settings.

92. Secrets

Support:

HashiCorp Vault
Cloud KMS
AWS Secrets Manager
Azure Key Vault
Kubernetes Secrets
93. One Codebase Strategy

Do NOT create separate products for:

SaaS
On-Premise
Customer Cloud
Private Cloud

Instead:

ONE CODEBASE
      |
      +-- SaaS Configuration
      |
      +-- Dedicated Configuration
      |
      +-- Customer Cloud Configuration
      |
      +-- On-Prem Configuration
      |
      +-- Air-Gapped Configuration
94. Product Architecture
                         HOTELos
                            |
            +---------------+---------------+
            |                               |
            v                               v
      CONTROL PLANE                    CUSTOMER PLANE
            |                               |
    +-------+-------+                +------+------+
    |       |       |                |      |      |
   UI    Content  License            PMS    CRM   Finance
   CMS    Studio   Engine             |      |      |
    |       |       |                 +------+------+
    +-------+-------+                        |
            |                          Customer DB
       Configuration                   Customer Files
            |
       Deployment
       Release
       Support
       Audit
95. Control Plane Ownership

The SaaS company owns:

Product
License
Subscription
Feature Flags
Release Versions
UI System
Content
Translations
Master Taxonomy
Organization Metadata
Deployment Metadata
Support
Product Analytics
96. Customer Ownership

The customer owns/controls:

Guests
Employees
Reservations
Payments
Invoices
Rooms
Operational Data
Documents
Financial Transactions
Customer Reports

The exact legal ownership and processing terms must be defined contractually.

97. Super Admin Master Control

The Super Admin should be able to manage:

Organizations
Brands
Properties
Plans
Licenses
Modules
Features
UI
Themes
Content
Translations
Guidelines
Master Data
Deployments
Releases
Updates
Support
Integrations
API
Security
Audit
Analytics
Billing
98. Master Dashboard

The SaaS Owner dashboard should answer:

What is happening with my entire HotelOS business?

Example:

MY SAAS

CUSTOMERS
247

ACTIVE PROPERTIES
1,842

USERS
82,430

DEPLOYMENTS
247

ONLINE
241

NEEDS ATTENTION
6

LICENSES
12 Expiring

UPDATES
38 Pending

SUPPORT
4 Critical

SECURITY
0 Critical

SYSTEM
99.99%
99. UX Principles

The entire product should follow these UX rules.

1. Enterprise First

The interface should feel professional and trustworthy.

2. Low Cognitive Load

Do not show every feature to every user.

3. Role-Based Navigation

Users see what they need.

4. Progressive Disclosure

Advanced settings remain hidden until needed.

5. Consistency

Same:

Button
Table
Modal
Form
Filter
Search
Pagination
Notification

throughout the system.

6. Fast Actions

Frequent hotel operations should require minimum clicks.

100. Design Language

Target visual style:

Modern
Premium
Professional
Calm
Enterprise
Luxury Hospitality
2026

Avoid:

Overly colorful dashboards
Huge gradients
Excessive animations
Clutter
Too many cards
Tiny text
Unnecessary popups
101. Recommended UI Style
Background:
Soft Neutral

Cards:
Minimal Border

Primary:
Deep Teal / Navy

Accent:
Luxury Gold

Success:
Green

Warning:
Amber

Danger:
Red

Typography:
Inter / Similar Enterprise Sans
102. Dashboard Layout

Preferred:

+------------------------------------------------+
| Header                                         |
+----------------+-------------------------------+
| Sidebar        | Page Header                   |
|                +-------------------------------+
| Navigation     | KPI / Summary                 |
|                +-------------------------------+
|                | Main Content                  |
|                |                               |
|                |                               |
+----------------+-------------------------------+
103. Responsive Design

Support:

Desktop
Laptop
Tablet
Mobile

Primary hotel operational UI should be optimized for desktop/tablet.

Guest-facing UI should be strongly mobile optimized.

104. Accessibility

Target:

WCAG 2.2 AA

Support:

Keyboard Navigation
Screen Readers
Focus States
Color Contrast
Reduced Motion
Accessible Forms
ARIA
105. Global Search

Enterprise-wide search should support:

Guest
Reservation
Room
Employee
Invoice
Property
Ticket
Vendor
Report

Search results should be permission aware.

106. Notification Center

Support:

System
Operational
Security
Approval
Task
Payment
Reservation
Maintenance

Channels:

In-App
Email
SMS
Push
Webhook
107. Approval Engine

Enterprise hotels need approval workflows.

Example:

Refund Request
      |
      v
Supervisor
      |
      v
Finance
      |
      v
Approved

Workflow engine should support:

Condition
Role
Amount
Department
Property
Escalation
SLA
Approval
Rejection
108. Workflow Engine

Build reusable workflows.

Example:

Purchase Request

Employee
   |
   v
Department Head
   |
   v
Finance
   |
   v
General Manager
   |
   v
Purchase Order
109. Document Management

Support:

Employee Documents
Guest Documents
Invoices
Contracts
Vendor Documents
Hotel Licenses
Certificates
Reports

Security:

Access Control
Encryption
Retention
Audit
Expiration
110. Multi-Currency

Support:

INR
USD
EUR
AED
GBP
SGD

with:

Base Currency
Property Currency
Reporting Currency
Exchange Rates
111. Multi-Language

Support:

English
Hindi
Arabic
French
German
Spanish

Architecture must be localization-first.

112. Multi-Timezone

Every property should have:

Timezone
Currency
Locale
Date Format
Time Format
Fiscal Calendar
113. Multi-Country

Country-level configuration:

Tax
Currency
Legal Requirements
Invoice Format
Address Format
Phone Format
Date Format
Language
114. Enterprise Audit

Audit must support:

Who
What
When
Where
Before
After
Reason
Approval
IP
Device
Session
115. Security Architecture

Minimum:

MFA
RBAC
ABAC
Encryption
Audit Logs
Session Management
Rate Limiting
API Security
Secrets Management
Backup
Disaster Recovery
116. Security Boundaries
CONTROL PLANE
     |
     | Secure API
     |
CUSTOMER CONTROL PLANE
     |
     | Internal
     |
CUSTOMER DATA PLANE

Customer data must not automatically flow to the SaaS Control Plane.

117. Disaster Recovery

Customer deployments should support:

Backup
Restore
Replication
Recovery Point Objective
Recovery Time Objective
Failover
Disaster Recovery Testing
118. High Availability

Enterprise deployments may use:

Load Balancer
Multiple Application Instances
Database HA
Redis HA
Object Storage
Queue Cluster
Monitoring
119. Air-Gapped Update Model
HotelOS Release
      |
      v
Signed Package
      |
      v
Customer Security Review
      |
      v
Offline Transfer
      |
      v
Deployment
      |
      v
Verification
120. Product Lifecycle
Idea
 |
 v
Design
 |
 v
Development
 |
 v
QA
 |
 v
Security Testing
 |
 v
Beta
 |
 v
Release
 |
 v
Deployment
 |
 v
Monitoring
 |
 v
Update
121. Recommended Repository Structure
hotel-os/
|
+-- apps/
|   |
|   +-- web/
|   +-- admin/
|   +-- customer/
|   +-- mobile/
|
+-- services/
|   |
|   +-- auth/
|   +-- organization/
|   +-- property/
|   +-- reservation/
|   +-- guest/
|   +-- room/
|   +-- housekeeping/
|   +-- finance/
|   +-- crm/
|   +-- revenue/
|   +-- hr/
|   +-- procurement/
|   +-- analytics/
|   +-- notification/
|   +-- workflow/
|
+-- control-plane/
|   |
|   +-- licensing/
|   +-- deployment/
|   +-- feature-flags/
|   +-- ui-config/
|   +-- content/
|   +-- master-data/
|   +-- releases/
|   +-- support/
|
+-- packages/
|   |
|   +-- ui/
|   +-- design-system/
|   +-- auth/
|   +-- types/
|   +-- config/
|   +-- validation/
|
+-- infrastructure/
|   |
|   +-- docker/
|   +-- kubernetes/
|   +-- helm/
|   +-- terraform/
|
+-- docs/
|
+-- tests/
122. Recommended Development Strategy

Do NOT build every hotel module simultaneously.

Build in phases.

Phase 1

Platform foundation:

Authentication
Organizations
Properties
Users
Roles
Permissions
Audit
Design System
Control Plane
Phase 2

Core PMS:

Rooms
Room Types
Reservations
Front Desk
Guest Profiles
Check-In
Check-Out
Housekeeping
Phase 3

Enterprise:

Multi-Property
Multi-Brand
Multi-Country
Multi-Currency
Multi-Language
SSO
SCIM
Approval Workflows
Phase 4

Business:

Finance
Revenue
CRM
F&B
Procurement
Engineering
HR
Phase 5

SaaS:

Licensing
Deployment Manager
Release Manager
UI Studio
Content Studio
Master Data
Feature Flags
Support
Phase 6

Enterprise Deployment:

Customer Cloud
Private Cloud
On-Premise
Air-Gapped
Offline Licensing
Signed Updates
123. MVP Priority

The first production-ready version should focus on:

Authentication
Organizations
Properties
Users
Roles
Permissions
PMS
Reservations
Front Desk
Rooms
Housekeeping
Guest Profiles
Dashboard
Audit

Alongside:

Control Plane
License Engine
Feature Flags
UI Theme
Deployment Configuration
124. Enterprise Version

Enterprise release should include:

Multi-Property
Multi-Brand
Multi-Country
SSO
SCIM
Advanced RBAC
ABAC
Approval Workflows
Revenue
Finance
CRM
F&B
Procurement
Engineering
Analytics
API
Webhooks
Integrations
On-Premise
Private Cloud
Air-Gapped
Offline Licensing
125. Most Important Product Differentiator

HotelOS should not only be a PMS.

It should be:

HOTEL OPERATING SYSTEM
+
ENTERPRISE MANAGEMENT PLATFORM
+
MULTI-PROPERTY PLATFORM
+
SAAS CONTROL PLANE
+
PRIVATE DEPLOYMENT PLATFORM
126. Final Architecture
                         HOTELos 2026
                              |
        +---------------------+---------------------+
        |                                           |
        v                                           v
   CONTROL PLANE                              CUSTOMER PLANE
   SaaS Owner                                Hotel Organization
        |                                           |
        +----------------+                          |
        |                |                          |
        v                v                          v
   Product Control    Deployment              Hotel Application
        |                |                          |
        |                |             +------------+------------+
        |                |             |            |            |
        v                v             v            v            v
 UI Studio          License         PMS          CRM         Finance
 Content Studio     Releases         |            |            |
 Brand Studio       Updates          |            |            |
 Master Data        Support          +------------+------------+
 Feature Flags      Audit                       |
 Guidelines        Analytics             Customer Database
127. Final Business Model

HotelOS can be sold as:

1. SaaS Subscription

2. Dedicated Cloud

3. Private Cloud

4. Customer Cloud

5. On-Premise License

6. Enterprise License

7. Enterprise + Support

8. Enterprise + Premium Modules

9. Per Property

10. Per User

11. Hybrid Enterprise Contract
128. Final Product Philosophy

The platform should follow these principles:

ONE PRODUCT
ONE CODEBASE
ONE DESIGN SYSTEM
ONE PERMISSION MODEL
ONE CONTROL PLANE

BUT

MULTIPLE DEPLOYMENT MODELS
MULTIPLE ORGANIZATIONS
MULTIPLE BRANDS
MULTIPLE PROPERTIES
MULTIPLE COUNTRIES
MULTIPLE LANGUAGES
MULTIPLE CURRENCIES
129. Golden Architecture Rule

The most important rule:

The SaaS Control Plane manages the product, but the customer controls their hotel data.

Therefore:

YOUR CONTROL PLANE
        |
        +-- License
        +-- Product
        +-- Features
        +-- UI
        +-- Content
        +-- Guidelines
        +-- Deployment
        +-- Releases
        +-- Support
        +-- Metadata
        |
        X
        |
        X No permanent unrestricted customer DB access
        |
        v
CUSTOMER ENVIRONMENT
        |
        +-- Hotel Application
        +-- Hotel Database
        +-- Hotel Files
        +-- Hotel Operational Data
130. End Goal

The finished platform should allow you to say:

"Give us your hotel group requirements, choose your modules, choose your deployment model, configure your branding and policies, and HotelOS can be deployed into your environment while remaining centrally manageable through our secure Control Plane."

That is the architecture required for a serious 2026 enterprise hospitality SaaS product.


**File name:** `HOTEL_SAAS_CONTROL_PLANE_DESIGN_2026.md`

This should be treated as the **master product/design specification**, and from this we can derive separate files for `ARCHITECTURE.md`, `DATABASE.md`, `RBAC.md`, `API.md`, `UI_DESIGN_SYSTEM.md`, `SUPER_ADMIN.md`, `HOTEL_PMS.md`, `DEPLOYMENT.md`, and `ROADMAP.md`.