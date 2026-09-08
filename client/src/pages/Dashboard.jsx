import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatMoney, formatDate } from '../lib/format';

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    managers: 0,
    orders: 0,
    reviews: 0,
    sales: 0,
    revenue: 0,
    pending: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        customers,
        managers,
        orders,
        reviews,
        pending,
        monthOrders,
        paid,
        recent,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'store_manager'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_amount').gte('created_at', startOfMonth.toISOString()).neq('status', 'cancelled'),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', startOfMonth.toISOString()),
        supabase
          .from('orders')
          .select('id, order_number, status, total_amount, created_at, profiles:customer_id (full_name)')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const firstError =
        customers.error ||
        managers.error ||
        orders.error ||
        reviews.error ||
        pending.error ||
        monthOrders.error ||
        paid.error ||
        recent.error;

      if (firstError) {
        setError(firstError.message);
        return;
      }

      const sales = (monthOrders.data || []).reduce((sum, row) => sum + Number(row.total_amount), 0);
      const revenue = (paid.data || []).reduce((sum, row) => sum + Number(row.amount), 0);

      setStats({
        customers: customers.count || 0,
        managers: managers.count || 0,
        orders: orders.count || 0,
        reviews: reviews.count || 0,
        sales,
        revenue,
        pending: pending.count || 0,
      });
      setRecentOrders(recent.data || []);
    }

    load();
  }, []);

  return (
    <>
      {error ? <div className="alert">{error}</div> : null}

      <section className="dashboard-cards">
        <div className="card">
          <div>
            <p>Total Customers</p>
            <h2>{stats.customers}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Store Managers</p>
            <h2>{stats.managers}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Total Orders</p>
            <h2>{stats.orders}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Customer Reviews</p>
            <h2>{stats.reviews}</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Business Overview</h2>
            <p>Figures for the current month from Supabase</p>
          </div>
        </div>
        <div className="overview-grid">
          <div className="overview-card">
            <h3>Sales</h3>
            <div className="big-number">{formatMoney(stats.sales)}</div>
            <p>Non-cancelled orders this month</p>
          </div>
          <div className="overview-card">
            <h3>Revenue</h3>
            <div className="big-number">{formatMoney(stats.revenue)}</div>
            <p>Paid payments this month</p>
          </div>
          <div className="overview-card">
            <h3>Pending Orders</h3>
            <div className="big-number">{stats.pending}</div>
            <p>Orders waiting for processing</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Latest customer orders</p>
          </div>
          <Link to="/orders" className="view-all">View All</Link>
        </div>

        <div className="data-table">
          <div className="table-header cols-4">
            <span>Order</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-row">No orders yet.</div>
          ) : (
            recentOrders.map((order) => (
              <div className="table-row cols-4" key={order.id}>
                <span>{order.order_number}</span>
                <span>{order.profiles?.full_name || '—'}</span>
                <span>{formatMoney(order.total_amount)}</span>
                <span className={`status ${order.status}`}>{order.status}</span>
              </div>
            ))
          )}
        </div>
        <p className="hint">Last updated {formatDate(new Date().toISOString())}</p>
      </section>
    </>
  );
}

export default Dashboard;
