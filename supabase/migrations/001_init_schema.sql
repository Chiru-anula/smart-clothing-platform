-- Smart Clothing Business Management Platform
-- Sprint 1 — full database schema (Admin, Customer, Store Manager domains)
-- Run this file in the Supabase SQL Editor (or via supabase db push).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'store_manager', 'customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.custom_order_status as enum (
    'requested', 'quoted', 'approved', 'in_production', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (all platform users: admin, store manager, customer)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null unique,
  full_name text not null,
  phone text,
  role public.user_role not null default 'customer',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.customer_details (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  address_line text,
  city text,
  postal_code text
);

-- ---------------------------------------------------------------------------
-- Stores
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  manager_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog & inventory
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  sku text unique,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color text,
  sku text unique,
  extra_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  min_stock_level integer not null default 5 check (min_stock_level >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_id, store_id)
);

drop trigger if exists trg_inventory_updated_at on public.inventory;
create trigger trg_inventory_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders, payments, reviews
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('ORD-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_id uuid not null references public.profiles (id),
  store_id uuid references public.stores (id),
  status public.order_status not null default 'pending',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  shipping_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  product_id uuid references public.products (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status public.review_status not null default 'pending',
  moderated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customer shopping extras + store promotions + custom apparel
-- ---------------------------------------------------------------------------
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_percent numeric(5, 2) check (discount_percent >= 0 and discount_percent <= 100),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_apparel_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id),
  description text not null,
  status public.custom_order_status not null default 'requested',
  quoted_price numeric(12, 2) check (quoted_price is null or quoted_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_custom_apparel_updated_at on public.custom_apparel_orders;
create trigger trg_custom_apparel_updated_at
before update on public.custom_apparel_orders
for each row execute function public.set_updated_at();

create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  label text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

drop trigger if exists trg_system_settings_updated_at on public.system_settings;
create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_auth_user on public.profiles (auth_user_id);
create index if not exists idx_stores_manager on public.stores (manager_id);
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_inventory_store on public.inventory (store_id);
create index if not exists idx_inventory_product on public.inventory (product_id);
create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_payments_order on public.payments (order_id);
create index if not exists idx_reviews_status on public.reviews (status);
create index if not exists idx_reviews_customer on public.reviews (customer_id);

-- ---------------------------------------------------------------------------
-- Auth helper: create profile when a new auth user is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  )
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id,
        full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  );
$$;

create or replace function public.is_store_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'store_manager'
      and p.status = 'active'
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.customer_details enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.promotions enable row level security;
alter table public.custom_apparel_orders enable row level security;
alter table public.system_settings enable row level security;

-- Drop existing policies if re-running
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Admin: full access on every table
create policy admin_all_profiles on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_customer_details on public.customer_details
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_stores on public.stores
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_categories on public.categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_products on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_product_variants on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_inventory on public.inventory
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_orders on public.orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_order_items on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_order_status_history on public.order_status_history
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_payments on public.payments
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_reviews on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_wishlists on public.wishlists
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_cart_items on public.cart_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_promotions on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_custom_apparel on public.custom_apparel_orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy admin_all_settings on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Users can read / update their own profile
create policy profiles_self_select on public.profiles
  for select using (auth_user_id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy customer_details_self on public.customer_details
  for all using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- Public catalog (customers / managers can browse)
create policy categories_read on public.categories for select using (true);
create policy products_read on public.products for select using (is_active = true or public.is_store_manager());
create policy variants_read on public.product_variants for select using (true);
create policy promotions_read on public.promotions for select using (is_active = true or public.is_store_manager());

-- Store managers: catalog + inventory + stores
create policy stores_manager_read on public.stores
  for select using (public.is_store_manager() or public.is_admin());
create policy products_manager_write on public.products
  for all using (public.is_store_manager()) with check (public.is_store_manager());
create policy variants_manager_write on public.product_variants
  for all using (public.is_store_manager()) with check (public.is_store_manager());
create policy categories_manager_write on public.categories
  for all using (public.is_store_manager()) with check (public.is_store_manager());
create policy inventory_manager_all on public.inventory
  for all using (public.is_store_manager()) with check (public.is_store_manager());
create policy promotions_manager_write on public.promotions
  for all using (public.is_store_manager()) with check (public.is_store_manager());

-- Customers: own orders, cart, wishlist, reviews, custom orders
create policy orders_customer_select on public.orders
  for select using (customer_id = public.current_profile_id());
create policy orders_customer_insert on public.orders
  for insert with check (customer_id = public.current_profile_id());
create policy order_items_customer_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = public.current_profile_id()
    )
  );
create policy order_items_customer_insert on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = public.current_profile_id()
    )
  );
create policy payments_customer_select on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = public.current_profile_id()
    )
  );
create policy reviews_customer_own on public.reviews
  for all using (customer_id = public.current_profile_id())
  with check (customer_id = public.current_profile_id());
create policy reviews_public_approved on public.reviews
  for select using (status = 'approved');
create policy wishlists_own on public.wishlists
  for all using (customer_id = public.current_profile_id())
  with check (customer_id = public.current_profile_id());
create policy cart_own on public.cart_items
  for all using (customer_id = public.current_profile_id())
  with check (customer_id = public.current_profile_id());
create policy custom_orders_own on public.custom_apparel_orders
  for all using (customer_id = public.current_profile_id())
  with check (customer_id = public.current_profile_id());

create policy order_history_customer_select on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = public.current_profile_id()
    )
  );

create policy settings_public_read on public.system_settings
  for select using (true);
