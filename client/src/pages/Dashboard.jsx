import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, subscribeToUsers, subscribeToOrders, subscribeToReviews } from '../services/dataService';
import { formatMoney, formatDate } from '../lib/format';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    customers: 0,
    managers: 0,
    admins: 0,
    orders: 0,
    reviews: 0,
    sales: 0,
    revenue: 0,
    pending: 0,
    recentUsers: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [recentTab, setRecentTab] = useState('users'); // 'users' or 'orders'

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to sync database figures');
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load dashboard figures');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const unUsers = subscribeToUsers(() => {
      if (isMounted) {
        getDashboardStats().then((data) => {
          if (isMounted) {
            setStats(data);
          }
        });
      }
    });

    const unOrders = subscribeToOrders(() => {
      if (isMounted) {
        getDashboardStats().then((data) => {
          if (isMounted) {
            setStats(data);
          }
        });
      }
    });

    const unReviews = subscribeToReviews(() => {
      if (isMounted) {
        getDashboardStats().then((data) => {
          if (isMounted) {
            setStats(data);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unUsers();
      unOrders();
      unReviews();
    };
  }, []);

  return (
    <>
      {error ? <div className="alert">{error}</div> : null}

      {/* 4 Summary Cards - Live Synchronized */}
      <section className="dashboard-cards">
        <Link to="/customers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div>
              <p>Total Customers</p>
              <h2>{loading ? '…' : stats.customers}</h2>
              <small style={{ color: '#64748b', fontSize: '11px' }}>
                {stats.totalUsers} total user accounts
              </small>
            </div>
            <div className="card-icon blue">👥</div>
          </div>
        </Link>

        <Link to="/store-managers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div>
              <p>Store Managers</p>
              <h2>{loading ? '…' : stats.managers}</h2>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Branch supervisors</small>
            </div>
            <div className="card-icon green">👔</div>
          </div>
        </Link>

        <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div>
              <p>Total Orders</p>
              <h2>{loading ? '…' : stats.orders}</h2>
              <small style={{ color: '#64748b', fontSize: '11px' }}>
                {stats.pending} pending fulfilment
              </small>
            </div>
            <div className="card-icon purple">📦</div>
          </div>
        </Link>

        <Link to="/reviews" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <div>
              <p>Customer Reviews</p>
              <h2>{loading ? '…' : stats.reviews}</h2>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Feedback & ratings</small>
            </div>
            <div className="card-icon amber">⭐</div>
          </div>
        </Link>
      </section>

      {/* Business Performance Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Business Performance Overview</h2>
          </div>
          <div>
            <button
              type="button"
              onClick={handleManualSync}
              className="ghost-btn"
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Click to trigger instant database sync"
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: refreshing ? 'rotate(360deg)' : 'none',
                  transition: 'transform 0.4s ease',
                }}
              >
                🔄
              </span>
              {refreshing ? 'Syncing…' : 'Sync'}
            </button>
          </div>
        </div>

        <div className="overview-grid">
          <div className="overview-card">
            <h3>Gross Sales</h3>
            <div className="big-number">{formatMoney(stats.sales)}</div>
            <p>Non-cancelled orders</p>
          </div>

          <div className="overview-card">
            <h3>Collected Revenue</h3>
            <div className="big-number">{formatMoney(stats.revenue)}</div>
            <p>Settled payments</p>
          </div>

          <div className="overview-card">
            <h3>Pending Orders</h3>
            <div className="big-number">{stats.pending}</div>
            <p>Awaiting fulfilment</p>
          </div>
        </div>
      </section>

      {/* Recent Activity Section with Toggle */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Platform Activity</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="filter-tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={`tab-btn ${recentTab === 'users' ? 'active' : ''}`}
                onClick={() => setRecentTab('users')}
              >
                👥 Recent Users ({stats.recentUsers.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${recentTab === 'orders' ? 'active' : ''}`}
                onClick={() => setRecentTab('orders')}
              >
                📦 Recent Orders ({stats.recentOrders.length})
              </button>
            </div>
          </div>
        </div>

        {recentTab === 'users' ? (
          <div className="data-table">
            <div className="table-header cols-5">
              <span>User Name</span>
              <span>Email Address</span>
              <span>Role</span>
              <span>Contact / Location</span>
              <span>Registered Date</span>
            </div>
            {stats.recentUsers.length === 0 ? (
              <div className="empty-row" style={{ padding: '36px 16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {loading ? 'Loading database records…' : 'No users registered in database yet.'}
                </p>
                {!loading && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Click <Link to="/customers" style={{ color: '#4f46e5', fontWeight: 600 }}>Customers</Link> to create your first user record.
                  </p>
                )}
              </div>
            ) : (
              stats.recentUsers.map((user) => (
                <div className="table-row cols-5" key={user.id}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</span>
                  <span style={{ color: '#475569' }}>{user.email}</span>
                  <span>
                    <span className={`status ${user.role}`}>
                      {user.role === 'store_manager'
                        ? 'Store Manager'
                        : user.role === 'admin'
                        ? 'Administrator'
                        : 'Customer'}
                    </span>
                  </span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {user.phone !== '—' ? user.phone : user.address !== '—' ? user.address : '—'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {formatDate(user.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="data-table">
            <div className="table-header cols-5">
              <span>Order</span>
              <span>Customer</span>
              <span>Store Branch</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {stats.recentOrders.length === 0 ? (
              <div className="empty-row" style={{ padding: '36px 16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {loading ? 'Loading orders…' : 'No orders recorded in database yet.'}
                </p>
                {!loading && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Click <Link to="/orders" style={{ color: '#4f46e5', fontWeight: 600 }}>Orders</Link> to create your first transaction.
                  </p>
                )}
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <div className="table-row cols-5" key={order.id}>
                  <div>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {order.order_number}
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{order.customer_name}</strong>
                    <small style={{ color: '#64748b' }}>{formatDate(order.created_at)}</small>
                  </div>
                  <span style={{ color: '#475569', fontSize: '13px' }}>{order.store_name}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatMoney(order.total_amount)}</span>
                  <span>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default Dashboard;
