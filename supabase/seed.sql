-- Demo data for Sprint 1. Run AFTER 001_init_schema.sql.
-- Does not create Auth users. After you create an admin in Authentication,
-- link them with the UPDATE at the bottom of this file.

-- Fixed ids so the seed is repeatable
delete from public.order_status_history;
delete from public.order_items;
delete from public.payments;
delete from public.reviews;
delete from public.wishlists;
delete from public.cart_items;
delete from public.custom_apparel_orders;
delete from public.inventory;
delete from public.product_variants;
delete from public.products;
delete from public.promotions;
delete from public.orders;
delete from public.customer_details;
delete from public.stores;
delete from public.categories;
delete from public.system_settings;
delete from public.profiles
where email in (
  'admin@smartclothing.lk',
  'nimal@smartclothing.lk',
  'saman@smartclothing.lk',
  'amaya@example.com',
  'kasun@example.com',
  'dilani@example.com',
  'ruwan@example.com',
  'ishara@example.com'
);

insert into public.profiles (id, email, full_name, phone, role, status) values
  ('11111111-1111-1111-1111-111111111111', 'admin@smartclothing.lk', 'Platform Administrator', '0112000000', 'admin', 'active'),
  ('22222222-2222-2222-2222-222222222221', 'nimal@smartclothing.lk', 'Nimal Perera', '0771111111', 'store_manager', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'saman@smartclothing.lk', 'Saman Fernando', '0772222222', 'store_manager', 'active'),
  ('33333333-3333-3333-3333-333333333331', 'amaya@example.com', 'Amaya Silva', '0711111111', 'customer', 'active'),
  ('33333333-3333-3333-3333-333333333332', 'kasun@example.com', 'Kasun Jayawardena', '0712222222', 'customer', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'dilani@example.com', 'Dilani Wickramasinghe', '0713333333', 'customer', 'active'),
  ('33333333-3333-3333-3333-333333333334', 'ruwan@example.com', 'Ruwan Bandara', '0714444444', 'customer', 'inactive'),
  ('33333333-3333-3333-3333-333333333335', 'ishara@example.com', 'Ishara Gunasekara', '0715555555', 'customer', 'active');

insert into public.customer_details (profile_id, address_line, city, postal_code) values
  ('33333333-3333-3333-3333-333333333331', '12 Galle Road', 'Colombo', '00300'),
  ('33333333-3333-3333-3333-333333333332', '88 Kandy Road', 'Kandy', '20000'),
  ('33333333-3333-3333-3333-333333333333', '5 Beach Road', 'Galle', '80000'),
  ('33333333-3333-3333-3333-333333333334', '21 Main Street', 'Negombo', '11500'),
  ('33333333-3333-3333-3333-333333333335', '9 Temple Road', 'Matara', '81000');

insert into public.stores (id, name, address, phone, manager_id) values
  ('44444444-4444-4444-4444-444444444441', 'Ceylon Gem — Colombo', 'Colombo 03', '0112555000', '22222222-2222-2222-2222-222222222221'),
  ('44444444-4444-4444-4444-444444444442', 'Ceylon Gem — Kandy', 'Kandy City Centre', '0812223000', '22222222-2222-2222-2222-222222222222');

insert into public.categories (id, name, description) values
  ('55555555-5555-5555-5555-555555555551', 'Men', 'Men''s clothing'),
  ('55555555-5555-5555-5555-555555555552', 'Women', 'Women''s clothing'),
  ('55555555-5555-5555-5555-555555555553', 'Kids', 'Children''s clothing');

insert into public.products (id, category_id, name, description, sku, price) values
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'Linen Shirt', 'Breathable linen shirt', 'MEN-SHIRT-001', 6500),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', 'Slim Chinos', 'Everyday chinos', 'MEN-PANT-002', 4500),
  ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555552', 'Cotton Dress', 'Casual cotton dress', 'WOM-DRESS-003', 8000),
  ('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555552', 'Knit Cardigan', 'Light knit cardigan', 'WOM-CARD-004', 7200),
  ('66666666-6666-6666-6666-666666666665', '55555555-5555-5555-5555-555555555553', 'Kids Tee', 'Soft cotton t-shirt', 'KID-TEE-005', 2200),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555553', 'Kids Shorts', 'Play shorts', 'KID-SHORT-006', 1800);

insert into public.product_variants (id, product_id, size, color, sku) values
  ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', 'M', 'White', 'MEN-SHIRT-001-M-W'),
  ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666661', 'L', 'Blue', 'MEN-SHIRT-001-L-B'),
  ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666663', 'S', 'Red', 'WOM-DRESS-003-S-R');

insert into public.inventory (product_id, variant_id, store_id, quantity, min_stock_level) values
  ('66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444441', 24, 5),
  ('66666666-6666-6666-6666-666666666662', null, '44444444-4444-4444-4444-444444444441', 18, 5),
  ('66666666-6666-6666-6666-666666666663', '77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444442', 10, 4),
  ('66666666-6666-6666-6666-666666666665', null, '44444444-4444-4444-4444-444444444442', 3, 8);

insert into public.orders (id, order_number, customer_id, store_id, status, subtotal, total_amount, shipping_address, created_at) values
  ('88888888-8888-8888-8888-888888888881', 'ORD-001001', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 'pending', 6500, 6500, '12 Galle Road, Colombo', now() - interval '2 days'),
  ('88888888-8888-8888-8888-888888888882', 'ORD-001002', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444441', 'processing', 4500, 4500, '88 Kandy Road, Kandy', now() - interval '5 days'),
  ('88888888-8888-8888-8888-888888888883', 'ORD-001003', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444442', 'delivered', 8000, 8000, '5 Beach Road, Galle', now() - interval '18 days'),
  ('88888888-8888-8888-8888-888888888884', 'ORD-001004', '33333333-3333-3333-3333-333333333335', '44444444-4444-4444-4444-444444444442', 'shipped', 4000, 4000, '9 Temple Road, Matara', now() - interval '3 days'),
  ('88888888-8888-8888-8888-888888888885', 'ORD-001005', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 'cancelled', 7200, 7200, '12 Galle Road, Colombo', now() - interval '12 days');

insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total) values
  ('88888888-8888-8888-8888-888888888881', '66666666-6666-6666-6666-666666666661', 'Linen Shirt', 1, 6500, 6500),
  ('88888888-8888-8888-8888-888888888882', '66666666-6666-6666-6666-666666666662', 'Slim Chinos', 1, 4500, 4500),
  ('88888888-8888-8888-8888-888888888883', '66666666-6666-6666-6666-666666666663', 'Cotton Dress', 1, 8000, 8000),
  ('88888888-8888-8888-8888-888888888884', '66666666-6666-6666-6666-666666666665', 'Kids Tee', 1, 2200, 2200),
  ('88888888-8888-8888-8888-888888888884', '66666666-6666-6666-6666-666666666666', 'Kids Shorts', 1, 1800, 1800),
  ('88888888-8888-8888-8888-888888888885', '66666666-6666-6666-6666-666666666664', 'Knit Cardigan', 1, 7200, 7200);

insert into public.order_status_history (order_id, from_status, to_status, note) values
  ('88888888-8888-8888-8888-888888888882', 'pending', 'processing', 'Payment confirmed'),
  ('88888888-8888-8888-8888-888888888883', 'pending', 'processing', 'Packed'),
  ('88888888-8888-8888-8888-888888888883', 'processing', 'shipped', 'Handed to courier'),
  ('88888888-8888-8888-8888-888888888883', 'shipped', 'delivered', 'Delivered to customer');

insert into public.payments (order_id, amount, status, method, paid_at) values
  ('88888888-8888-8888-8888-888888888881', 6500, 'pending', 'card', null),
  ('88888888-8888-8888-8888-888888888882', 4500, 'paid', 'card', now() - interval '5 days'),
  ('88888888-8888-8888-8888-888888888883', 8000, 'paid', 'bank_transfer', now() - interval '18 days'),
  ('88888888-8888-8888-8888-888888888884', 4000, 'paid', 'card', now() - interval '3 days'),
  ('88888888-8888-8888-8888-888888888885', 7200, 'refunded', 'card', now() - interval '11 days');

insert into public.reviews (customer_id, product_id, order_id, rating, comment, status) values
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666663', '88888888-8888-8888-8888-888888888883', 5, 'Beautiful dress and good fit.', 'approved'),
  ('33333333-3333-3333-3333-333333333332', '66666666-6666-6666-6666-666666666662', '88888888-8888-8888-8888-888888888882', 4, 'Nice quality, shipping was a bit slow.', 'pending'),
  ('33333333-3333-3333-3333-333333333331', '66666666-6666-6666-6666-666666666661', '88888888-8888-8888-8888-888888888881', 2, 'Colour looked different from the photo.', 'pending');

insert into public.wishlists (customer_id, product_id) values
  ('33333333-3333-3333-3333-333333333331', '66666666-6666-6666-6666-666666666664'),
  ('33333333-3333-3333-3333-333333333335', '66666666-6666-6666-6666-666666666663');

insert into public.cart_items (customer_id, product_id, quantity) values
  ('33333333-3333-3333-3333-333333333332', '66666666-6666-6666-6666-666666666661', 1);

insert into public.promotions (name, discount_percent, starts_at, ends_at, is_active) values
  ('New Season 10%', 10, now() - interval '7 days', now() + interval '30 days', true);

insert into public.custom_apparel_orders (customer_id, description, status, quoted_price) values
  ('33333333-3333-3333-3333-333333333331', 'Custom batik shirt, size L, navy', 'quoted', 9500);

insert into public.system_settings (key, value, label) values
  ('business_name', 'Ceylon Gem Clothing', 'Business name'),
  ('currency', 'LKR', 'Currency'),
  ('support_email', 'support@smartclothing.lk', 'Support email'),
  ('low_stock_alert', '5', 'Default low-stock threshold'),
  ('allow_new_registrations', 'true', 'Allow customer registration');

-- After creating the Auth user admin@smartclothing.lk, run:
-- update public.profiles
-- set auth_user_id = (select id from auth.users where email = 'admin@smartclothing.lk')
-- where email = 'admin@smartclothing.lk';
--
-- Then set that user's role to admin in Authentication > Users > user metadata:
-- { "role": "admin", "full_name": "Platform Administrator" }
-- Or keep the UPDATE above; the profile row already has role = admin.
