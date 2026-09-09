import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage key for offline fallback
const USERS_STORAGE_KEY = 'smart_clothing_users_db';
const ORDERS_STORAGE_KEY = 'smart_clothing_orders_db';
const REVIEWS_STORAGE_KEY = 'smart_clothing_reviews_db';

// Clean initial state (no dummy records)
const INITIAL_FALLBACK = {
  users: [
    {
      id: 'cdfb2123-1ebb-48cf-afce-911e1e6edc95',
      name: 'Sirimanna H.D.S.S',
      email: 'admin@smartclothing.lk',
      role: 'admin',
      status: 'active',
      phone: '0712345678',
      address: 'Colombo, Sri Lanka',
      created_at: '2026-09-08T15:07:43.945068+00:00',
    },
    {
      id: '9f23ac44-1234-4567-8901-23456789abcd',
      name: 'Amaya Silva',
      email: 'amaya@example.com',
      role: 'customer',
      status: 'active',
      phone: '0711111111',
      address: '12 Galle Road, Colombo',
      created_at: '2026-09-08T15:11:00.000000+00:00',
    },
  ],
  stores: [
    { id: '1', name: 'Ceylon Gem — Colombo' },
    { id: '2', name: 'Ceylon Gem — Kandy' },
  ],
  orders: [],
  reviews: [],
};

function getLocalUsers() {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_FALLBACK.users));
  return INITIAL_FALLBACK.users;
}

function saveLocalUsers(data) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
}

function getLocalOrders() {
  const existing = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        return parsed.filter((o) => !['ORD-1001', 'ORD-1002', 'ORD-1003', 'ORD-1004'].includes(o.order_number));
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function saveLocalOrders(data) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data));
}

function getLocalReviews() {
  const existing = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }
  return [];
}

function saveLocalReviews(data) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// EVENT DISPATCHERS FOR INTRA-APP REALTIME SYNC
// ---------------------------------------------------------------------------
export function dispatchUsersUpdated(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-users-updated', { detail }));
  }
}

export function dispatchOrdersUpdated(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-orders-updated', { detail }));
  }
}

export function dispatchReviewsUpdated(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-reviews-updated', { detail }));
  }
}

let supabaseOnline = null;
let lastCheckTime = 0;

export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured || !supabase) {
    supabaseOnline = false;
    return false;
  }
  if (supabaseOnline !== null && Date.now() - lastCheckTime < 10000) {
    return supabaseOnline;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 3000),
    );
    const queryPromise = supabase.from('users').select('id', { count: 'exact', head: true });
    const res = await Promise.race([queryPromise, timeoutPromise]);
    supabaseOnline = Boolean(res && !res.error);
  } catch {
    supabaseOnline = false;
  }
  lastCheckTime = Date.now();
  return supabaseOnline;
}

// ---------------------------------------------------------------------------
// REALTIME SUBSCRIPTION HELPERS
// ---------------------------------------------------------------------------
export function subscribeToUsers(callback) {
  let channel = null;

  if (supabase) {
    try {
      channel = supabase
        .channel('realtime_users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          callback({ source: 'supabase_realtime', payload });
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime users error:', err);
    }
  }

  const handleCustomEvent = (e) => {
    callback({ source: 'app_event', detail: e.detail });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('app-users-updated', handleCustomEvent);
  }

  const handleFocus = () => callback({ source: 'window_focus' });
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
  }

  const interval = setInterval(() => callback({ source: 'polling' }), 6000);

  return () => {
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('app-users-updated', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
    }
    clearInterval(interval);
  };
}

export function subscribeToOrders(callback) {
  let channel = null;

  if (supabase) {
    try {
      channel = supabase
        .channel('realtime_orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          callback({ source: 'supabase_realtime', payload });
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime orders error:', err);
    }
  }

  const handleCustomEvent = (e) => callback({ source: 'app_event', detail: e.detail });
  if (typeof window !== 'undefined') {
    window.addEventListener('app-orders-updated', handleCustomEvent);
  }

  const handleFocus = () => callback({ source: 'window_focus' });
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
  }

  const interval = setInterval(() => callback({ source: 'polling' }), 6000);

  return () => {
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('app-orders-updated', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
    }
    clearInterval(interval);
  };
}

export function subscribeToReviews(callback) {
  let channel = null;

  if (supabase) {
    try {
      channel = supabase
        .channel('realtime_reviews')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
          callback({ source: 'supabase_realtime', payload });
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime reviews error:', err);
    }
  }

  const handleCustomEvent = (e) => callback({ source: 'app_event', detail: e.detail });
  if (typeof window !== 'undefined') {
    window.addEventListener('app-reviews-updated', handleCustomEvent);
  }

  const handleFocus = () => callback({ source: 'window_focus' });
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
  }

  const interval = setInterval(() => callback({ source: 'polling' }), 6000);

  return () => {
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('app-reviews-updated', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
    }
    clearInterval(interval);
  };
}

// ---------------------------------------------------------------------------
// 1. DASHBOARD STATS (CONCURRENT LIVE SUPABASE DATA)
// ---------------------------------------------------------------------------
export async function getDashboardStats() {
  const isOnline = await checkSupabaseHealth();

  let users = [];
  let orders = [];
  let reviews = [];

  if (isOnline && supabase) {
    try {
      const [usersRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      ]);

      if (!usersRes.error && usersRes.data) {
        users = usersRes.data;
        saveLocalUsers(users);
      } else {
        users = getLocalUsers();
      }

      if (!ordersRes.error && ordersRes.data) {
        orders = ordersRes.data;
        saveLocalOrders(orders);
      } else {
        orders = getLocalOrders();
      }

      if (!reviewsRes.error && reviewsRes.data) {
        reviews = reviewsRes.data;
        saveLocalReviews(reviews);
      } else {
        reviews = getLocalReviews();
      }
    } catch (err) {
      console.warn('Error reading dashboard stats from Supabase:', err);
      users = getLocalUsers();
      orders = getLocalOrders();
      reviews = getLocalReviews();
    }
  } else {
    users = getLocalUsers();
    orders = getLocalOrders();
    reviews = getLocalReviews();
  }

  const totalUsers = users.length;
  const customers = users.filter((u) => !u.role || u.role.toLowerCase() === 'customer').length;
  const managers = users.filter((u) => u.role?.toLowerCase() === 'store_manager' || u.role?.toLowerCase() === 'manager').length;
  const admins = users.filter((u) => u.role?.toLowerCase() === 'admin').length;

  const grossSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const collectedRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const recentUsers = users.slice(0, 8).map((u) => ({
    id: u.id,
    name: u.name || 'Unnamed User',
    email: u.email || '—',
    role: u.role || 'customer',
    phone: u.phone || '—',
    address: u.address || '—',
    created_at: u.created_at || new Date().toISOString(),
  }));

  const recentOrders = orders.slice(0, 6).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    customer_email: o.customer_email || '—',
    store_name: o.store_name || 'Ceylon Gem — Colombo',
    total_amount: Number(o.total_amount || 0),
    status: o.status || 'pending',
    created_at: o.created_at || new Date().toISOString(),
  }));

  return {
    totalUsers,
    customers,
    managers,
    admins,
    orders: orders.length,
    reviews: reviews.length,
    sales: grossSales,
    revenue: collectedRevenue,
    pending: pendingOrders,
    recentUsers,
    recentOrders,
  };
}

// ---------------------------------------------------------------------------
// 2. CUSTOMERS
// ---------------------------------------------------------------------------
export async function getCustomers() {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const customerList = data.filter((u) => !u.role || u.role.toLowerCase() === 'customer');
        return customerList.map((u) => ({
          id: u.id,
          full_name: u.name || 'Customer',
          email: u.email,
          phone: u.phone || '',
          status: 'active',
          role: u.role || 'customer',
          created_at: u.created_at || new Date().toISOString(),
          customer_details: {
            city: '',
            address_line: u.address || '',
            postal_code: '',
          },
        }));
      }
    } catch (err) {
      console.warn('Supabase getCustomers error:', err);
    }
  }

  const users = getLocalUsers();
  return users
    .filter((u) => (u.role || 'customer') === 'customer')
    .map((u) => ({
      ...u,
      full_name: u.name,
      customer_details: { city: '', address_line: u.address || '', postal_code: '' },
    }));
}

export async function saveCustomer(formData, editingId = null) {
  const isOnline = await checkSupabaseHealth();
  const name = formData.full_name || formData.name;
  const email = formData.email;
  const phone = formData.phone || null;
  const address = [formData.address_line, formData.city].filter(Boolean).join(', ') || formData.address || null;
  const password = formData.password || 'Welcome@2026';
  let savedId = editingId;

  if (isOnline && supabase) {
    try {
      if (editingId && !editingId.startsWith('cust-')) {
        const { error } = await supabase
          .from('users')
          .update({ name, email, phone, address })
          .eq('id', editingId);
        if (error) console.error('Supabase updateCustomer error:', error);
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert({
            name,
            email,
            phone,
            address,
            password,
            role: 'customer',
          })
          .select()
          .single();
        if (error) console.error('Supabase insertCustomer error:', error);
        if (data?.id) savedId = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveCustomer error:', err);
    }
  }

  const users = getLocalUsers();
  if (editingId) {
    const updated = users.map((u) =>
      u.id === editingId
        ? { ...u, name, email, phone: formData.phone, address, status: formData.status || 'active' }
        : u,
    );
    saveLocalUsers(updated);
  } else {
    savedId = savedId || 'cust-' + Date.now();
    users.unshift({
      id: savedId,
      name,
      email,
      phone: formData.phone || '',
      address,
      role: 'customer',
      status: formData.status || 'active',
      created_at: new Date().toISOString(),
    });
    saveLocalUsers(users);
  }
  dispatchUsersUpdated({ action: editingId ? 'update_customer' : 'create_customer', id: savedId });
  return savedId;
}

export async function deleteCustomer(id) {
  const isOnline = await checkSupabaseHealth();
  if (isOnline && supabase && !id.startsWith('cust-') && !id.startsWith('user-')) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) console.error('Supabase deleteCustomer error:', error);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  const users = getLocalUsers();
  const updated = users.filter((u) => u.id !== id);
  saveLocalUsers(updated);
  dispatchUsersUpdated({ action: 'delete_customer', id });
  return true;
}

// ---------------------------------------------------------------------------
// 3. STORE MANAGERS
// ---------------------------------------------------------------------------
export async function getStoreManagers() {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or('role.eq.store_manager,role.eq.manager')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const managers = data.map((u) => ({
          id: u.id,
          full_name: u.name,
          email: u.email,
          phone: u.phone || '',
          status: 'active',
          stores: [{ id: '1', name: 'Ceylon Gem — Colombo' }],
        }));
        return {
          managers,
          stores: [
            { id: '1', name: 'Ceylon Gem — Colombo' },
            { id: '2', name: 'Ceylon Gem — Kandy' },
          ],
        };
      }
    } catch (err) {
      console.warn('Supabase getStoreManagers error:', err);
    }
  }

  const users = getLocalUsers();
  const managers = users
    .filter((u) => u.role === 'store_manager' || u.role === 'manager')
    .map((u) => ({
      ...u,
      full_name: u.name,
      stores: [{ id: '1', name: 'Ceylon Gem — Colombo' }],
    }));

  return { managers, stores: INITIAL_FALLBACK.stores };
}

export async function saveStoreManager(formData, editingId = null) {
  const isOnline = await checkSupabaseHealth();
  const name = formData.full_name || formData.name;
  const email = formData.email;
  const phone = formData.phone || null;
  const password = formData.password || 'Welcome@2026';
  let savedId = editingId;

  if (isOnline && supabase) {
    try {
      if (editingId && !editingId.startsWith('mgr-')) {
        const { error } = await supabase.from('users').update({ name, email, phone }).eq('id', editingId);
        if (error) console.error('Supabase updateStoreManager error:', error);
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert({ name, email, phone, password, role: 'store_manager' })
          .select()
          .single();
        if (error) console.error('Supabase insertStoreManager error:', error);
        if (data?.id) savedId = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveStoreManager error:', err);
    }
  }

  const users = getLocalUsers();
  if (editingId) {
    const updated = users.map((u) =>
      u.id === editingId ? { ...u, name, email, phone: formData.phone, status: formData.status || 'active' } : u,
    );
    saveLocalUsers(updated);
  } else {
    savedId = savedId || 'mgr-' + Date.now();
    users.push({
      id: savedId,
      name,
      email,
      phone: formData.phone || '',
      role: 'store_manager',
      status: formData.status || 'active',
      created_at: new Date().toISOString(),
    });
    saveLocalUsers(users);
  }

  dispatchUsersUpdated({ action: editingId ? 'update_manager' : 'create_manager', id: savedId });
  return savedId;
}

// ---------------------------------------------------------------------------
// 4. USER ROLES
// ---------------------------------------------------------------------------
export async function getUsersForRoles() {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((u) => ({
          id: u.id,
          full_name: u.name || 'User',
          email: u.email,
          role: u.role || 'customer',
          status: 'active',
          created_at: u.created_at || null,
        }));
      }
    } catch (err) {
      console.warn('Supabase getUsersForRoles error:', err);
    }
  }

  const users = getLocalUsers();
  return users.map((u) => ({
    ...u,
    full_name: u.name,
  }));
}

export async function updateUserRole(id, role) {
  const isOnline = await checkSupabaseHealth();
  if (isOnline && supabase && !id.startsWith('user-') && !id.startsWith('cust-') && !id.startsWith('mgr-')) {
    try {
      const { error } = await supabase.from('users').update({ role }).eq('id', id);
      if (error) console.error('Supabase updateUserRole error:', error);
    } catch (err) {
      console.warn('Supabase updateUserRole error:', err);
    }
  }

  const users = getLocalUsers();
  const updated = users.map((u) => (u.id === id ? { ...u, role } : u));
  saveLocalUsers(updated);
  dispatchUsersUpdated({ action: 'role_update', id, role });
  return true;
}

export async function updateUserStatus(id, status) {
  const users = getLocalUsers();
  const updated = users.map((u) => (u.id === id ? { ...u, status } : u));
  saveLocalUsers(updated);
  dispatchUsersUpdated({ action: 'status_update', id, status });
  return true;
}

export async function createUserWithRole(userPayload) {
  const isOnline = await checkSupabaseHealth();
  const name = userPayload.full_name || userPayload.name;
  const email = userPayload.email;
  const role = userPayload.role || 'customer';
  const phone = userPayload.phone || null;
  const address = userPayload.address || null;
  const password = userPayload.password || 'Welcome@2026';
  let newId = 'user-' + Date.now();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({ name, email, role, phone, address, password })
        .select()
        .single();
      if (error) console.error('Supabase createUserWithRole error:', error);
      if (data?.id) newId = data.id;
    } catch (err) {
      console.warn('Supabase createUserWithRole error:', err);
    }
  }

  const users = getLocalUsers();
  const newUser = {
    id: newId,
    name,
    email,
    role,
    status: userPayload.status || 'active',
    created_at: new Date().toISOString(),
  };
  users.unshift(newUser);
  saveLocalUsers(users);
  dispatchUsersUpdated({ action: 'create_user', user: newUser });
  return newUser;
}

// ---------------------------------------------------------------------------
// 5. ORDERS (DIRECT SUPABASE 'orders' TABLE + REALTIME)
// ---------------------------------------------------------------------------
export async function getOrders() {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalOrders(data);
        return data.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customer_name,
          customer_email: o.customer_email || '—',
          store_name: o.store_name || 'Ceylon Gem — Colombo',
          total_amount: Number(o.total_amount || 0),
          status: o.status || 'pending',
          items_count: o.items_count || 1,
          created_at: o.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase getOrders notice:', err);
    }
  }

  return getLocalOrders();
}

export async function createOrder(orderPayload) {
  const isOnline = await checkSupabaseHealth();
  const orderNumber = orderPayload.order_number || `ORD-${Date.now().toString().slice(-4)}`;
  const customerName = orderPayload.customer_name || 'Customer';
  const customerEmail = orderPayload.customer_email || '';
  const storeName = orderPayload.store_name || 'Ceylon Gem — Colombo';
  const totalAmount = Number(orderPayload.total_amount || 0);
  const status = orderPayload.status || 'pending';
  const itemsCount = Number(orderPayload.items_count || 1);
  let orderId = 'ord-' + Date.now();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          store_name: storeName,
          total_amount: totalAmount,
          status,
          items_count: itemsCount,
        })
        .select()
        .single();

      if (!error && data?.id) {
        orderId = data.id;
      } else if (error) {
        console.warn('Supabase createOrder note (run SQL setup if table missing):', error.message);
      }
    } catch (err) {
      console.warn('Supabase createOrder error:', err);
    }
  }

  const localOrders = getLocalOrders();
  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    store_name: storeName,
    total_amount: totalAmount,
    status,
    items_count: itemsCount,
    created_at: new Date().toISOString(),
  };
  localOrders.unshift(newOrder);
  saveLocalOrders(localOrders);

  dispatchOrdersUpdated({ action: 'create_order', order: newOrder });
  return newOrder;
}

export async function updateOrderStatus(orderId, nextStatus) {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase && !orderId.startsWith('ord-')) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      if (error) console.warn('Supabase updateOrderStatus note:', error.message);
    } catch (err) {
      console.warn('Supabase updateOrderStatus error:', err);
    }
  }

  const localOrders = getLocalOrders();
  const updated = localOrders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
  saveLocalOrders(updated);

  dispatchOrdersUpdated({ action: 'update_status', id: orderId, status: nextStatus });
  return true;
}

export async function deleteOrder(orderId) {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase && !orderId.startsWith('ord-')) {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) console.warn('Supabase deleteOrder note:', error.message);
    } catch (err) {
      console.warn('Supabase deleteOrder error:', err);
    }
  }

  const localOrders = getLocalOrders();
  const updated = localOrders.filter((o) => o.id !== orderId);
  saveLocalOrders(updated);

  dispatchOrdersUpdated({ action: 'delete_order', id: orderId });
  return true;
}

// ---------------------------------------------------------------------------
// 6. REVIEWS (DIRECT SUPABASE 'reviews' TABLE + REALTIME)
// ---------------------------------------------------------------------------
export async function getReviews() {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalReviews(data);
        return data.map((r) => ({
          id: r.id,
          customer_name: r.customer_name,
          customer_email: r.customer_email || '—',
          product_name: r.product_name,
          rating: Number(r.rating || 5),
          comment: r.comment || '',
          status: r.status || 'pending',
          created_at: r.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase getReviews notice:', err);
    }
  }

  return getLocalReviews();
}

export async function createReview(reviewPayload) {
  const isOnline = await checkSupabaseHealth();
  const customerName = reviewPayload.customer_name || 'Customer';
  const customerEmail = reviewPayload.customer_email || '';
  const productName = reviewPayload.product_name || 'Item';
  const rating = Number(reviewPayload.rating || 5);
  const comment = reviewPayload.comment || '';
  const status = reviewPayload.status || 'pending';
  let reviewId = 'rev-' + Date.now();

  if (isOnline && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail,
          product_name: productName,
          rating,
          comment,
          status,
        })
        .select()
        .single();

      if (!error && data?.id) {
        reviewId = data.id;
      } else if (error) {
        console.warn('Supabase createReview note (run SQL setup if table missing):', error.message);
      }
    } catch (err) {
      console.warn('Supabase createReview error:', err);
    }
  }

  const localReviews = getLocalReviews();
  const newReview = {
    id: reviewId,
    customer_name: customerName,
    customer_email: customerEmail,
    product_name: productName,
    rating,
    comment,
    status,
    created_at: new Date().toISOString(),
  };
  localReviews.unshift(newReview);
  saveLocalReviews(localReviews);

  dispatchReviewsUpdated({ action: 'create_review', review: newReview });
  return newReview;
}

export async function moderateReview(reviewId, nextStatus) {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase && !reviewId.startsWith('rev-')) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: nextStatus })
        .eq('id', reviewId);
      if (error) console.warn('Supabase moderateReview note:', error.message);
    } catch (err) {
      console.warn('Supabase moderateReview error:', err);
    }
  }

  const localReviews = getLocalReviews();
  const updated = localReviews.map((r) => (r.id === reviewId ? { ...r, status: nextStatus } : r));
  saveLocalReviews(updated);

  dispatchReviewsUpdated({ action: 'moderate_review', id: reviewId, status: nextStatus });
  return true;
}

export async function deleteReview(reviewId) {
  const isOnline = await checkSupabaseHealth();

  if (isOnline && supabase && !reviewId.startsWith('rev-')) {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) console.warn('Supabase deleteReview note:', error.message);
    } catch (err) {
      console.warn('Supabase deleteReview error:', err);
    }
  }

  const localReviews = getLocalReviews();
  const updated = localReviews.filter((r) => r.id !== reviewId);
  saveLocalReviews(updated);

  dispatchReviewsUpdated({ action: 'delete_review', id: reviewId });
  return true;
}
