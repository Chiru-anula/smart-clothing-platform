# Smart Clothing Business Management Platform (Ceylon Gem Clothing)

Sprint 1 Implementation: **Epic 01 – Admin System & Business Management** (25% Platform Scope)  
**Student:** Sirimanna H.D.S.S (`IT24100908` - Scrum Master)  
**Project ID:** `ISE_WD_0101_12` • IE3121 Enterprise Architecture / Information Systems Project Management 2026  

Full documentation and criteria mapping available in [SPRINT_1_ADMIN_DOC.md](SPRINT_1_ADMIN_DOC.md).

---

## Quick Start (Run Immediately in VS Code)

You can launch and test all 8 functional admin modules immediately, with or without an active internet connection.

```bash
cd client
npm install
npm run dev
```
*(On Windows with script execution policies, run `npm.cmd run dev`)*

1. Open `http://localhost:5173` in your browser.
2. The login page provides a **"Fill Credentials"** button:
   - **Email:** `admin@smartclothing.lk`
   - **Password:** `Admin@123`
3. Click **Sign in to Admin Console**.

---

## Features Implemented in Sprint 1 (Epic 01: 25% Admin Scope)

1. **Admin Authentication & RBAC**: Session management, secure login, and role-based route protection.
2. **Business KPI Dashboard**: Customer counts, active managers, orders, reviews, gross sales (LKR), collected revenue, pending orders, and quick actions.
3. **Customer Account Management**: Full CRUD, search, status filter (`active`, `inactive`, `suspended`), and customer profile/order view modal.
4. **Store Manager Management**: Branch store assignment (Colombo, Kandy, Galle), contact details, and status management.
5. **User Role Management**: Role-based access control (`admin`, `store_manager`, `customer`), safety confirmation on admin demotions to prevent lockout.
6. **Customer Review Moderation**: Moderation workflow with 1-click **Approve** and **Reject**, star ratings (`★★★★☆`), and status queues.
7. **Order Fulfilment & Tracking**: Fulfilment status workflow (`pending` → `processing` → `shipped` → `delivered` / `cancelled`), line item breakdown modal, and audit transition history.
8. **Sales, Revenue & Customer Reports**: Dynamic metrics, period filtering (All time, Year, Month, Today), Sprint 0 Baseline KPI tracking, and **Export to CSV** + **Print / PDF**.
9. **System Settings**: Grouped store configurations, shipping rules, tax rate, low-stock threshold, maintenance mode, and reset defaults.

---

## Connecting to Live Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in Supabase and execute:
   - `supabase/migrations/001_init_schema.sql`
   - `supabase/seed.sql`
3. Under **Authentication → Users**, add user `admin@smartclothing.lk` with a password.
4. Turn off **Confirm email** under Authentication → Providers → Email.
5. Run this in the SQL Editor to link the seeded admin row to Auth:
   ```sql
   update public.profiles
   set auth_user_id = (select id from auth.users where email = 'admin@smartclothing.lk')
   where email = 'admin@smartclothing.lk';
   ```
6. Copy `client/.env.example` to `client/.env` and insert your Project URL and anon key from **Project Settings → API**.
7. Restart the dev server (`npm.cmd run dev`). The topbar pill will display **"Live Supabase Connected"**.

---

## Build and Lint Verification

```bash
cd client
npm.cmd run lint    # Passed: 0 errors, 0 warnings
npm.cmd run build   # Passed: production build verified
```
