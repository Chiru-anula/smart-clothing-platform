import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Initial seed data matching Supabase seed.sql for Ceylon Gem Clothing
const INITIAL_SEED = {
  profiles: [
    { id: '11111111-1111-1111-1111-111111111111', email: 'admin@smartclothing.lk', full_name: 'Platform Administrator', phone: '0112000000', role: 'admin', status: 'active', created_at: '2026-01-10T08:00:00Z' },
    { id: '22222222-2222-2222-2222-222222222221', email: 'nimal@smartclothing.lk', full_name: 'Nimal Perera', phone: '0771111111', role: 'store_manager', status: 'active', created_at: '2026-01-12T09:30:00Z' },
    { id: '22222222-2222-2222-2222-222222222222', email: 'saman@smartclothing.lk', full_name: 'Saman Fernando', phone: '0772222222', role: 'store_manager', status: 'active', created_at: '2026-01-15T11:00:00Z' },
    { id: '33333333-3333-3333-3333-333333333331', email: 'amaya@example.com', full_name: 'Amaya Silva', phone: '0711111111', role: 'customer', status: 'active', created_at: '2026-02-01T10:15:00Z' },
    { id: '33333333-3333-3333-3333-333333333332', email: 'kasun@example.com', full_name: 'Kasun Jayawardena', phone: '0712222222', role: 'customer', status: 'active', created_at: '2026-02-05T14:20:00Z' },
    { id: '33333333-3333-3333-3333-333333333333', email: 'dilani@example.com', full_name: 'Dilani Wickramasinghe', phone: '0713333333', role: 'customer', status: 'active', created_at: '2026-02-10T16:45:00Z' },
    { id: '33333333-3333-3333-3333-333333333334', email: 'ruwan@example.com', full_name: 'Ruwan Bandara', phone: '0714444444', role: 'customer', status: 'inactive', created_at: '2026-02-15T09:00:00Z' },
    { id: '33333333-3333-3333-3333-333333333335', email: 'ishara@example.com', full_name: 'Ishara Gunasekara', phone: '0715555555', role: 'customer', status: 'active', created_at: '2026-02-20T13:30:00Z' },
  ],
  customer_details: [
    { profile_id: '33333333-3333-3333-3333-333333333331', address_line: '12 Galle Road', city: 'Colombo', postal_code: '00300' },
    { profile_id: '33333333-3333-3333-3333-333333333332', address_line: '88 Kandy Road', city: 'Kandy', postal_code: '20000' },
    { profile_id: '33333333-3333-3333-3333-333333333333', address_line: '5 Beach Road', city: 'Galle', postal_code: '80000' },
    { profile_id: '33333333-3333-3333-3333-333333333334', address_line: '21 Main Street', city: 'Negombo', postal_code: '11500' },
    { profile_id: '33333333-3333-3333-3333-333333333335', address_line: '9 Temple Road', city: 'Matara', postal_code: '81000' },
  ],
  stores: [
    { id: '44444444-4444-4444-4444-444444444441', name: 'Ceylon Gem — Colombo Flagship', address: 'Colombo 03', phone: '0112555000', manager_id: '22222222-2222-2222-2222-222222222221', is_active: true },
    { id: '44444444-4444-4444-4444-444444444442', name: 'Ceylon Gem — Kandy Mall', address: 'Kandy City Centre', phone: '0812223000', manager_id: '22222222-2222-2222-2222-222222222222', is_active: true },
    { id: '44444444-4444-4444-4444-444444444443', name: 'Ceylon Gem — Galle Fort', address: 'Church Street, Galle Fort', phone: '0912245000', manager_id: null, is_active: true },
  ],
  products: [
    { id: '66666666-6666-6666-6666-666666666661', name: 'Linen Shirt', sku: 'MEN-SHIRT-001', price: 6500 },
    { id: '66666666-6666-6666-6666-666666666662', name: 'Slim Chinos', sku: 'MEN-PANT-002', price: 4500 },
    { id: '66666666-6666-6666-6666-666666666663', name: 'Cotton Dress', sku: 'WOM-DRESS-003', price: 8000 },
    { id: '66666666-6666-6666-6666-666666666664', name: 'Knit Cardigan', sku: 'WOM-CARD-004', price: 7200 },
    { id: '66666666-6666-6666-6666-666666666665', name: 'Kids Tee', sku: 'KID-TEE-005', price: 2200 },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Kids Shorts', sku: 'KID-SHORT-006', price: 1800 },
  ],
  orders: [
    {
      id: '88888888-8888-8888-8888-888888888881',
      order_number: 'ORD-001001',
      customer_id: '33333333-3333-3333-3333-333333333331',
      store_id: '44444444-4444-4444-4444-444444444441',
      status: 'pending',
      subtotal: 6500,
      total_amount: 6500,
      shipping_address: '12 Galle Road, Colombo',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: '88888888-8888-8888-8888-888888888882',
      order_number: 'ORD-001002',
      customer_id: '33333333-3333-3333-3333-333333333332',
      store_id: '44444444-4444-4444-4444-444444444441',
      status: 'processing',
      subtotal: 4500,
      total_amount: 4500,
      shipping_address: '88 Kandy Road, Kandy',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: '88888888-8888-8888-8888-888888888883',
      order_number: 'ORD-001003',
      customer_id: '33333333-3333-3333-3333-333333333333',
      store_id: '44444444-4444-4444-4444-444444444442',
      status: 'delivered',
      subtotal: 8000,
      total_amount: 8000,
      shipping_address: '5 Beach Road, Galle',
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: '88888888-8888-8888-8888-888888888884',
      order_number: 'ORD-001004',
      customer_id: '33333333-3333-3333-3333-333333333335',
      store_id: '44444444-4444-4444-4444-444444444442',
      status: 'shipped',
      subtotal: 4000,
      total_amount: 4000,
      shipping_address: '9 Temple Road, Matara',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: '88888888-8888-8888-8888-888888888885',
      order_number: 'ORD-001005',
      customer_id: '33333333-3333-3333-3333-333333333331',
      store_id: '44444444-4444-4444-4444-444444444441',
      status: 'cancelled',
      subtotal: 7200,
      total_amount: 7200,
      shipping_address: '12 Galle Road, Colombo',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ],
  order_items: [
    { id: '1', order_id: '88888888-8888-8888-8888-888888888881', product_name: 'Linen Shirt', quantity: 1, unit_price: 6500, line_total: 6500 },
    { id: '2', order_id: '88888888-8888-8888-8888-888888888882', product_name: 'Slim Chinos', quantity: 1, unit_price: 4500, line_total: 4500 },
    { id: '3', order_id: '88888888-8888-8888-8888-888888888883', product_name: 'Cotton Dress', quantity: 1, unit_price: 8000, line_total: 8000 },
    { id: '4', order_id: '88888888-8888-8888-8888-888888888884', product_name: 'Kids Tee', quantity: 1, unit_price: 2200, line_total: 2200 },
    { id: '5', order_id: '88888888-8888-8888-8888-888888888884', product_name: 'Kids Shorts', quantity: 1, unit_price: 1800, line_total: 1800 },
    { id: '6', order_id: '88888888-8888-8888-8888-888888888885', product_name: 'Knit Cardigan', quantity: 1, unit_price: 7200, line_total: 7200 },
  ],
  order_status_history: [
    { id: 'h1', order_id: '88888888-8888-8888-8888-888888888882', from_status: 'pending', to_status: 'processing', note: 'Payment confirmed via Credit Card', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 'h2', order_id: '88888888-8888-8888-8888-888888888883', from_status: 'pending', to_status: 'processing', note: 'Order packed in Kandy branch', created_at: new Date(Date.now() - 17 * 86400000).toISOString() },
    { id: 'h3', order_id: '88888888-8888-8888-8888-888888888883', from_status: 'processing', to_status: 'shipped', note: 'Handed over to courier partner', created_at: new Date(Date.now() - 16 * 86400000).toISOString() },
    { id: 'h4', order_id: '88888888-8888-8888-8888-888888888883', from_status: 'shipped', to_status: 'delivered', note: 'Successfully delivered to customer', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  ],
  payments: [
    { id: 'p1', order_id: '88888888-8888-8888-8888-888888888881', amount: 6500, status: 'pending', method: 'card', paid_at: null },
    { id: 'p2', order_id: '88888888-8888-8888-8888-888888888882', amount: 4500, status: 'paid', method: 'card', paid_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'p3', order_id: '88888888-8888-8888-8888-888888888883', amount: 8000, status: 'paid', method: 'bank_transfer', paid_at: new Date(Date.now() - 18 * 86400000).toISOString() },
    { id: 'p4', order_id: '88888888-8888-8888-8888-888888888884', amount: 4000, status: 'paid', method: 'card', paid_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'p5', order_id: '88888888-8888-8888-8888-888888888885', amount: 7200, status: 'refunded', method: 'card', paid_at: new Date(Date.now() - 11 * 86400000).toISOString() },
  ],
  reviews: [
    {
      id: 'r1',
      customer_id: '33333333-3333-3333-3333-333333333333',
      product_id: '66666666-6666-6666-6666-666666666663',
      rating: 5,
      comment: 'Beautiful dress and good fit. Perfect fabric quality!',
      status: 'approved',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'r2',
      customer_id: '33333333-3333-3333-3333-333333333332',
      product_id: '66666666-6666-6666-6666-666666666662',
      rating: 4,
      comment: 'Nice quality chinos, delivery was a bit slow to Kandy.',
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'r3',
      customer_id: '33333333-3333-3333-3333-333333333331',
      product_id: '66666666-6666-6666-6666-666666666661',
      rating: 2,
      comment: 'Colour looked slightly different from the catalog photo.',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  system_settings: [
    { key: 'business_name', value: 'Ceylon Gem Clothing', label: 'Business Name', group: 'general' },
    { key: 'currency', value: 'LKR', label: 'Currency', group: 'general' },
    { key: 'support_email', value: 'support@smartclothing.lk', label: 'Customer Support Email', group: 'general' },
    { key: 'support_phone', value: '+94 11 200 0000', label: 'Support Hotline', group: 'general' },
    { key: 'delivery_fee', value: '350', label: 'Standard Delivery Fee (LKR)', group: 'operations' },
    { key: 'free_shipping_threshold', value: '10000', label: 'Free Shipping Threshold (LKR)', group: 'operations' },
    { key: 'tax_rate_percent', value: '0', label: 'VAT / Tax Rate (%)', group: 'operations' },
    { key: 'low_stock_alert', value: '5', label: 'Default Low-Stock Alert Threshold', group: 'operations' },
    { key: 'allow_new_registrations', value: 'true', label: 'Allow Public Customer Registration', group: 'system' },
    { key: 'maintenance_mode', value: 'false', label: 'Maintenance Mode', group: 'system' },
  ],
};

const STORAGE_KEY = 'smart_clothing_admin_demo_db';

// Initialize local database if not exists
function getLocalDb() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
  return INITIAL_SEED;
}

function saveLocalDb(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Check connectivity to Supabase
let supabaseOnline = null;
let lastCheckTime = 0;

export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured || !supabase) {
    supabaseOnline = false;
    return false;
  }
  if (supabaseOnline !== null && Date.now() - lastCheckTime < 15000) {
    return supabaseOnline;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 2500),
    );
    const queryPromise = supabase.from('profiles').select('id', { count: 'exact', head: true });
    const res = await Promise.race([queryPromise, timeoutPromise]);
    if (res && !res.error) {
      supabaseOnline = true;
    } else {
      supabaseOnline = false;
    }
  } catch {
    supabaseOnline = false;
  }
  lastCheckTime = Date.now();
  return supabaseOnline;
}

export function getConnectionStatus() {
  const isDemoOverride = localStorage.getItem('smart_clothing_force_demo') === 'true';
  if (isDemoOverride) {
    return { mode: 'demo', label: 'Demo Mode (Offline / Pre-seeded)', isOnline: false };
  }
  if (supabaseOnline) {
    return { mode: 'supabase', label: 'Live Supabase Connected', isOnline: true };
  }
  return { mode: 'demo', label: 'Demo Mode (Local Storage)', isOnline: false };
}

export function setForceDemo(enabled) {
  if (enabled) {
    localStorage.setItem('smart_clothing_force_demo', 'true');
  } else {
    localStorage.removeItem('smart_clothing_force_demo');
  }
}

// ---------------------------------------------------------------------------
// 1. DASHBOARD & TOTALS
// ---------------------------------------------------------------------------
export async function getDashboardStats() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [customers, managers, orders, reviews, pending, monthOrders, paid, recent] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'store_manager'),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('orders').select('total_amount').gte('created_at', startOfMonth.toISOString()).neq('status', 'cancelled'),
          supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', startOfMonth.toISOString()),
          supabase.from('orders').select('id, order_number, status, total_amount, created_at, profiles:customer_id (full_name)').order('created_at', { ascending: false }).limit(6),
        ]);

      const sales = (monthOrders.data || []).reduce((sum, r) => sum + Number(r.total_amount), 0);
      const revenue = (paid.data || []).reduce((sum, r) => sum + Number(r.amount), 0);

      return {
        customers: customers.count || 0,
        managers: managers.count || 0,
        orders: orders.count || 0,
        reviews: reviews.count || 0,
        sales,
        revenue,
        pending: pending.count || 0,
        recentOrders: recent.data || [],
      };
    } catch {
      // fallback to local
    }
  }

  // Local fallback
  const db = getLocalDb();
  const customers = db.profiles.filter((p) => p.role === 'customer').length;
  const managers = db.profiles.filter((p) => p.role === 'store_manager').length;
  const orders = db.orders.length;
  const reviews = db.reviews.length;
  const pending = db.orders.filter((o) => o.status === 'pending').length;
  const sales = db.orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_amount), 0);
  const revenue = db.payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);

  const recentOrders = [...db.orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)
    .map((o) => {
      const cust = db.profiles.find((p) => p.id === o.customer_id);
      return {
        ...o,
        profiles: { full_name: cust ? cust.full_name : 'Unknown' },
      };
    });

  return {
    customers,
    managers,
    orders,
    reviews,
    sales,
    revenue,
    pending,
    recentOrders,
  };
}

// ---------------------------------------------------------------------------
// 2. CUSTOMERS (CRUD)
// ---------------------------------------------------------------------------
export async function getCustomers() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, status, created_at, customer_details (city, address_line, postal_code)')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  return db.profiles
    .filter((p) => p.role === 'customer')
    .map((p) => {
      const details = db.customer_details.find((d) => d.profile_id === p.id);
      return {
        ...p,
        customer_details: details || null,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function saveCustomer(formData, editingId = null) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const profilePayload = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: 'customer',
      status: formData.status || 'active',
    };

    let profileId = editingId;
    if (editingId) {
      const { error } = await supabase.from('profiles').update(profilePayload).eq('id', editingId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from('profiles').insert(profilePayload).select('id').single();
      if (error) throw new Error(error.message);
      profileId = data.id;
    }

    await supabase.from('customer_details').upsert({
      profile_id: profileId,
      city: formData.city,
      address_line: formData.address_line,
      postal_code: formData.postal_code,
    });
    return profileId;
  }

  // Local storage save
  const db = getLocalDb();
  let profileId = editingId;

  if (editingId) {
    db.profiles = db.profiles.map((p) =>
      p.id === editingId
        ? { ...p, full_name: formData.full_name, email: formData.email, phone: formData.phone, status: formData.status }
        : p,
    );
  } else {
    profileId = 'cust-' + Date.now();
    db.profiles.unshift({
      id: profileId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: 'customer',
      status: formData.status || 'active',
      created_at: new Date().toISOString(),
    });
  }

  const existingDetailIndex = db.customer_details.findIndex((d) => d.profile_id === profileId);
  const detailData = {
    profile_id: profileId,
    city: formData.city || '',
    address_line: formData.address_line || '',
    postal_code: formData.postal_code || '',
  };

  if (existingDetailIndex >= 0) {
    db.customer_details[existingDetailIndex] = detailData;
  } else {
    db.customer_details.push(detailData);
  }

  saveLocalDb(db);
  return profileId;
}

export async function deleteCustomer(id) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = getLocalDb();
  db.profiles = db.profiles.filter((p) => p.id !== id);
  db.customer_details = db.customer_details.filter((d) => d.profile_id !== id);
  saveLocalDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// 3. STORE MANAGERS & STORES
// ---------------------------------------------------------------------------
export async function getStoreManagers() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const [managers, stores] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, status, stores (id, name)').eq('role', 'store_manager').order('full_name'),
        supabase.from('stores').select('id, name, manager_id, address, phone').order('name'),
      ]);
      if (!managers.error && !stores.error) {
        return { managers: managers.data || [], stores: stores.data || [] };
      }
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  const stores = db.stores || [];
  const managers = db.profiles
    .filter((p) => p.role === 'store_manager')
    .map((p) => {
      const assignedStore = stores.find((s) => s.manager_id === p.id);
      return {
        ...p,
        stores: assignedStore ? [assignedStore] : [],
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return { managers, stores };
}

export async function saveStoreManager(formData, editingId = null) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: 'store_manager',
      status: formData.status || 'active',
    };

    let managerId = editingId;
    if (editingId) {
      const { error } = await supabase.from('profiles').update(payload).eq('id', editingId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from('profiles').insert(payload).select('id').single();
      if (error) throw new Error(error.message);
      managerId = data.id;
    }

    await supabase.from('stores').update({ manager_id: null }).eq('manager_id', managerId);
    if (formData.store_id) {
      await supabase.from('stores').update({ manager_id: managerId }).eq('id', formData.store_id);
    }
    return managerId;
  }

  const db = getLocalDb();
  let managerId = editingId;
  if (editingId) {
    db.profiles = db.profiles.map((p) =>
      p.id === editingId
        ? { ...p, full_name: formData.full_name, email: formData.email, phone: formData.phone, status: formData.status }
        : p,
    );
  } else {
    managerId = 'mgr-' + Date.now();
    db.profiles.push({
      id: managerId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: 'store_manager',
      status: formData.status || 'active',
      created_at: new Date().toISOString(),
    });
  }

  // Clear previous assignments for this manager
  db.stores = (db.stores || []).map((s) => (s.manager_id === managerId ? { ...s, manager_id: null } : s));
  if (formData.store_id) {
    db.stores = db.stores.map((s) => (s.id === formData.store_id ? { ...s, manager_id: managerId } : s));
  }

  saveLocalDb(db);
  return managerId;
}

// ---------------------------------------------------------------------------
// 4. USER ROLES & PERMISSIONS
// ---------------------------------------------------------------------------
export async function getUsersForRoles() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at')
        .order('role')
        .order('full_name');
      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  return [...db.profiles].sort((a, b) => a.role.localeCompare(b.role) || a.full_name.localeCompare(b.full_name));
}

export async function updateUserRole(id, role) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = getLocalDb();
  db.profiles = db.profiles.map((p) => (p.id === id ? { ...p, role } : p));
  saveLocalDb(db);
  return true;
}

export async function updateUserStatus(id, status) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = getLocalDb();
  db.profiles = db.profiles.map((p) => (p.id === id ? { ...p, status } : p));
  saveLocalDb(db);
  return true;
}

export async function createUserWithRole(userPayload) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { data, error } = await supabase.from('profiles').insert(userPayload).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDb();
  const newUser = {
    id: 'user-' + Date.now(),
    ...userPayload,
    created_at: new Date().toISOString(),
  };
  db.profiles.push(newUser);
  saveLocalDb(db);
  return newUser;
}

// ---------------------------------------------------------------------------
// 5. REVIEWS MODERATION
// ---------------------------------------------------------------------------
export async function getReviews() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, status, created_at, profiles:customer_id (full_name, email), products:product_id (name, sku)')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  return (db.reviews || [])
    .map((r) => {
      const customer = db.profiles.find((p) => p.id === r.customer_id);
      const product = db.products.find((p) => p.id === r.product_id);
      return {
        ...r,
        profiles: customer ? { full_name: customer.full_name, email: customer.email } : { full_name: 'Customer' },
        products: product ? { name: product.name, sku: product.sku } : { name: 'Item' },
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function moderateReview(id, status, moderatedBy = null) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error } = await supabase.from('reviews').update({ status, moderated_by: moderatedBy }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = getLocalDb();
  db.reviews = db.reviews.map((r) => (r.id === id ? { ...r, status, moderated_by: moderatedBy } : r));
  saveLocalDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// 6. ORDERS & FULFILMENT
// ---------------------------------------------------------------------------
export async function getOrders() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, subtotal, shipping_address, created_at, profiles:customer_id (full_name, email, phone), stores:store_id (name)')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  return (db.orders || [])
    .map((o) => {
      const customer = db.profiles.find((p) => p.id === o.customer_id);
      const store = (db.stores || []).find((s) => s.id === o.store_id);
      return {
        ...o,
        profiles: customer ? { full_name: customer.full_name, email: customer.email, phone: customer.phone } : { full_name: 'Unknown' },
        stores: store ? { name: store.name } : null,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getOrderDetails(orderId) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const [orderRes, itemsRes, historyRes, paymentRes] = await Promise.all([
        supabase.from('orders').select('*, profiles:customer_id (full_name, email, phone), stores:store_id (name)').eq('id', orderId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
        supabase.from('payments').select('*').eq('order_id', orderId).maybeSingle(),
      ]);

      if (!orderRes.error) {
        return {
          order: orderRes.data,
          items: itemsRes.data || [],
          history: historyRes.data || [],
          payment: paymentRes.data || null,
        };
      }
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');

  const customer = db.profiles.find((p) => p.id === order.customer_id);
  const store = (db.stores || []).find((s) => s.id === order.store_id);
  const items = (db.order_items || []).filter((i) => i.order_id === orderId);
  const history = (db.order_status_history || []).filter((h) => h.order_id === orderId);
  const payment = (db.payments || []).find((p) => p.order_id === orderId) || null;

  return {
    order: {
      ...order,
      profiles: customer ? { full_name: customer.full_name, email: customer.email, phone: customer.phone } : null,
      stores: store ? { name: store.name } : null,
    },
    items,
    history,
    payment,
  };
}

export async function updateOrderStatus(orderId, fromStatus, toStatus, note = '', changedBy = null) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error: updateError } = await supabase.from('orders').update({ status: toStatus }).eq('id', orderId);
    if (updateError) throw new Error(updateError.message);

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      note: note || `Status updated to ${toStatus} from Admin Console`,
      changed_by: changedBy,
    });
    return true;
  }

  const db = getLocalDb();
  db.orders = db.orders.map((o) => (o.id === orderId ? { ...o, status: toStatus } : o));
  if (!db.order_status_history) db.order_status_history = [];
  db.order_status_history.push({
    id: 'h-' + Date.now(),
    order_id: orderId,
    from_status: fromStatus,
    to_status: toStatus,
    note: note || `Status updated to ${toStatus} from Admin Console`,
    created_at: new Date().toISOString(),
  });
  saveLocalDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// 7. REPORTS & BUSINESS ANALYTICS
// ---------------------------------------------------------------------------
export async function getReportsData(timeRange = 'all') {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  let orders = [];
  let payments = [];
  let customersCount = 0;

  if (isOnline && !isForcedDemo) {
    try {
      const [orderRes, payRes, custRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, status, total_amount, customer_id, created_at, profiles:customer_id (full_name)'),
        supabase.from('payments').select('id, amount, status, method, paid_at'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'active'),
      ]);
      orders = orderRes.data || [];
      payments = payRes.data || [];
      customersCount = custRes.count || 0;
    } catch {
      // fallback
    }
  }

  if (orders.length === 0) {
    const db = getLocalDb();
    orders = db.orders.map((o) => {
      const c = db.profiles.find((p) => p.id === o.customer_id);
      return {
        ...o,
        profiles: { full_name: c ? c.full_name : 'Unknown' },
      };
    });
    payments = db.payments || [];
    customersCount = db.profiles.filter((p) => p.role === 'customer' && p.status === 'active').length;
  }

  // Filter by date range if applicable
  const now = new Date();
  let filteredOrders = [...orders];

  if (timeRange === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    filteredOrders = orders.filter((o) => new Date(o.created_at).getTime() >= todayStart);
  } else if (timeRange === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    filteredOrders = orders.filter((o) => new Date(o.created_at).getTime() >= monthStart);
  } else if (timeRange === 'year') {
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    filteredOrders = orders.filter((o) => new Date(o.created_at).getTime() >= yearStart);
  }

  // Calculations
  const totalOrders = filteredOrders.length;
  const nonCancelledOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
  const grossSales = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const collectedRevenue = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
  const refundedRevenue = payments.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + Number(p.amount), 0);
  const avgOrderValue = nonCancelledOrders.length > 0 ? grossSales / nonCancelledOrders.length : 0;

  // Status breakdown
  const statusGroup = {};
  filteredOrders.forEach((o) => {
    statusGroup[o.status] = statusGroup[o.status] || { status: o.status, count: 0, total: 0 };
    statusGroup[o.status].count += 1;
    statusGroup[o.status].total += Number(o.total_amount);
  });

  // Top Customers
  const customerSpending = {};
  nonCancelledOrders.forEach((o) => {
    const cid = o.customer_id;
    customerSpending[cid] = customerSpending[cid] || {
      name: o.profiles?.full_name || 'Customer',
      orders: 0,
      total: 0,
    };
    customerSpending[cid].orders += 1;
    customerSpending[cid].total += Number(o.total_amount);
  });

  const topCustomers = Object.values(customerSpending)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalOrders,
    grossSales,
    collectedRevenue,
    pendingRevenue,
    refundedRevenue,
    avgOrderValue,
    activeCustomers: customersCount,
    salesByStatus: Object.values(statusGroup),
    topCustomers,
    rawOrders: filteredOrders,
  };
}

// ---------------------------------------------------------------------------
// 8. SYSTEM SETTINGS
// ---------------------------------------------------------------------------
export async function getSystemSettings() {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    try {
      const { data, error } = await supabase.from('system_settings').select('key, value, label').order('key');
      if (!error && data && data.length > 0) return data;
    } catch {
      // fallback
    }
  }

  const db = getLocalDb();
  return db.system_settings || INITIAL_SEED.system_settings;
}

export async function saveSystemSettings(settingsArray, updatedBy = null) {
  const isOnline = await checkSupabaseHealth();
  const isForcedDemo = localStorage.getItem('smart_clothing_force_demo') === 'true';

  if (isOnline && !isForcedDemo) {
    const { error } = await supabase.from('system_settings').upsert(
      settingsArray.map((row) => ({
        key: row.key,
        value: String(row.value),
        label: row.label,
        updated_by: updatedBy,
      })),
    );
    if (error) throw new Error(error.message);
    return true;
  }

  const db = getLocalDb();
  db.system_settings = settingsArray.map((s) => ({
    key: s.key,
    value: String(s.value),
    label: s.label || s.key,
  }));
  saveLocalDb(db);
  return true;
}

export function resetLocalData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
  return INITIAL_SEED;
}
