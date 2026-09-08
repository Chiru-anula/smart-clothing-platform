import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/dataService';
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
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load dashboard figures');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {error ? <div className="alert">{error}</div> : null}

      {/* 4 Summary Cards */}
      <section className="dashboard-cards">
        <div className="card">
          <div>
            <p>Total Customers</p>
            <h2>{loading ? '…' : stats.customers}</h2>
          </div>
          <div className="card-icon blue">👥</div>
        </div>

        <div className="card">
          <div>
            <p>Store Managers</p>
            <h2>{loading ? '…' : stats.managers}</h2>
          </div>
          <div className="card-icon green">👔</div>
        </div>

        <div className="card">
          <div>
            <p>Total Orders</p>
            <h2>{loading ? '…' : stats.orders}</h2>
          </div>
          <div className="card-icon purple">📦</div>
        </div>

        <div className="card">
          <div>
            <p>Customer Reviews</p>
            <h2>{loading ? '…' : stats.reviews}</h2>
          </div>
          <div className="card-icon amber">⭐</div>
        </div>
      </section>

      {/* Business Performance Overview (All 0 as requested for Sprint 1) */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Business Performance Overview</h2>
            <p>Baseline operational metrics for current period</p>
          </div>
        </div>

        <div className="overview-grid">
          <div className="overview-card">
            <h3>Gross Sales</h3>
            <div className="big-number">LKR 0.00</div>
            <p>Non-cancelled orders</p>
          </div>

          <div className="overview-card">
            <h3>Collected Revenue</h3>
            <div className="big-number">LKR 0.00</div>
            <p>Settled payments</p>
          </div>

          <div className="overview-card">
            <h3>Pending Orders</h3>
            <div className="big-number">0</div>
            <p>Awaiting fulfilment</p>
          </div>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Latest customer transactions</p>
          </div>
          <Link to="/orders" className="view-all">
            View All →
          </Link>
        </div>

        <div className="data-table">
          <div className="table-header cols-4">
            <span>Order</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="empty-row">{loading ? 'Loading orders…' : 'No orders yet.'}</div>
          ) : (
            stats.recentOrders.map((order) => (
              <div className="table-row cols-4" key={order.id}>
                <span style={{ fontWeight: 600 }}>{order.order_number}</span>
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
