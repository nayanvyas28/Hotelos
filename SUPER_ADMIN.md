# HotelOS Super Admin Control Plane

This document serves as the master technical specification and layout index for the **HotelOS SaaS Control Plane** (implemented in `/reports/super-admin/page.tsx`).

---

## 🏛️ 1. Control Plane Architecture Overview

The Control Plane manages the product ecosystem while respecting tenant database segregation boundaries (the Golden Architecture Rule). It is structured into **10 Integrated Control Towers**:

```
HOTELOS CONTROL PLANE
 ├── Tab 1: Command Center ───────── (Real-time telemetry, active keys, MRR, alerts)
 ├── Tab 2: Organizations & Clients ── (Tenant groups, Break-Glass JIT support sessions)
 ├── Tab 3: Licenses & Plans ─────── (Starter/Pro/Enterprise plan provisioning, module toggles)
 ├── Tab 4: UI & Theme Studio ─────── (Tenant brand settings, color styles, star rating preview)
 ├── Tab 5: Release Manager ───────── (App versions scheduling, DB migrations status)
 ├── Tab 6: API & Webhooks ────────── (Token keys, Stripe/Expedia hooks, active listeners)
 ├── Tab 7: Content & Broadcasts ──── (Global banners publishing, warning notice levels)
 ├── Tab 8: Master Data & Taxonomy ── (Global room types, amenities, payment auto-seeding)
 ├── Tab 9: Security Audit Trails ─── (Break-glass operator auditing, license modification logs)
 └── Tab 10: SaaS Subscription Billing (Monthly recurring revenue calculating, invoice dispatch)
```

---

## 🗄️ 2. Database Models & Schema Extensions

The Control Plane resides directly in the main schema bindings (`/prisma/schema.prisma`), facilitating transactional logging:

- **`Property`**: Holds plan details (`planString`), active modules (`activeModulesString`), feature flags (`featureFlagsString`), UI configurations (`uiConfigString`), and Groq API keys (`groqApiKey`).
- **`Announcement`**: System-wide notifications mapped to `PropertyId` (null for global broadcast).
- **`GlobalTaxonomy`**: Unified master taxonomy records scoped by category (`ROOM_TYPE`, `ROOM_FEATURE`, `AMENITY`, `PAYMENT_METHOD`).
- **`SaasInvoice`**: Dispatched monthly tenant subscription statements tracked per `Organization` group.
- **`AuditLog`**: Security action logging (`SUPPORT_ACCESS_START`, `PROVISION_PROPERTY`, `LICENSE_CHANGE`).

---

## 📡 3. Dedicated Server Actions API

All operational controls are backed by Next.js Server Actions:

1.  **SaaS Admin Actions (`/app/actions/saasAdmin.ts`)**:
    - `getSaaSAdminDataAction()`: Pulls all tenants and system statistics.
    - `provisionSaaSPropertyAction(orgName, propName, address)`: Provisions new tenant hotel instances.
    - `updateSaaSPropertyAction(propId, payload)`: Modifies active plans, modules, and AI settings.
    - `deleteSaaSPropertyAction(propId)`: Deletes property records.
2.  **SaaS Support Actions (`/app/actions/saasSupport.ts`)**:
    - `logSaaSSupportSessionStartAction(propId, reason, minutes)`: Starts and logs JIT support break-glass events.
    - `getSaaSAnnouncementsAction()` / `createSaaSAnnouncementAction(...)`: Global broadcasts CRUD.
3.  **SaaS API Actions (`/app/actions/saasApi.ts`)**:
    - Manage webhooks subscription and API key token assets.
4.  **SaaS Taxonomy Actions (`/app/actions/saasTaxonomy.ts`)**:
    - Manage global master taxonomy items with automatic database defaults seeding.
5.  **SaaS Audit Actions (`/app/actions/saasAudit.ts`)**:
    - Query audit streams.
6.  **SaaS Billing Actions (`/app/actions/saasBilling.ts`)**:
    - Subscription MRR calculators and mock invoices CRUD.

---

## 🔒 4. JIT Support Override (Break-Glass Session)

To prevent permanent unrestricted database access to customer accounts, the Control Plane integrates a JIT support session simulator:
- **Redirection**: Sets temporary keys in `sessionStorage` (`hotelos_support_session_active`).
- **Sidebar Bypass**: In `/components/layout/Sidebar.tsx`, the presence of active support overrides the `showOperations` restriction, rendering operations navigation elements (Front Office, Housekeeping, CRM, SPA, POS, etc.) automatically.
- **Context Override**: In `/context/SessionContext.tsx`, `activePropertyId` is locked to the support target property to ensure all CRUD database queries redirect to the simulated hotel's tables automatically.
- **Safety**: A sticky red layout countdown banner reminds the operator of the support session status with a quick "END SESSION" cleanup button.
