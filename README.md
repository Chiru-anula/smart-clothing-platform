# Smart Clothing Business Management Platform

Admin application for Sprint 1 (Epic 1: Admin System & Business Management).
The database covers the whole platform so later sprints can add customer and store-manager apps on the same schema.

## Sprint 1 scope (admin)

- Admin login
- Dashboard totals from the database
- Customers, store managers, roles, reviews, orders, reports, settings

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**.
3. Run `supabase/migrations/001_init_schema.sql`.
4. Run `supabase/seed.sql`.
5. In **Authentication → Users**, add `admin@smartclothing.lk` with a password.
6. Turn off **Confirm email** under Authentication → Providers → Email (easier for local work).
7. Run this in SQL Editor so the seeded admin row is linked to Auth:

```sql
update public.profiles
set auth_user_id = (select id from auth.users where email = 'admin@smartclothing.lk')
where email = 'admin@smartclothing.lk';
```

If you create the Auth user before seeding, the trigger may already create a profile. Still run the `update` above, and make sure that row has `role = 'admin'` and `status = 'active'`.

## 2. Connect the admin app

```bash
cd client
copy .env.example .env
```

Put the Project URL and anon key from **Project Settings → API** into `client/.env`.

```bash
npm install
npm run dev
```

Sign in at `/login` with the admin Auth user.

Do not put the service role key in the frontend.
