import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatMoney } from '../lib/format';

function Reports() {
  const [salesByStatus, setSalesByStatus] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [totals, setTotals] = useState({ orders: 0, sales: 0, paid: 0, avg: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [orders, payments, customers] = await Promise.all([
        supabase.from('orders').select('status, total_amount, customer_id, profiles:customer_id (full_name)'),
        supabase.from('payments').select('amount, status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'active'),
      ]);

      if (orders.error || payments.error || customers.error) {
        setError(orders.error?.message || payments.error?.message || customers.error?.message);
        return;
      }

      const orderRows = orders.data || [];
      const grouped = {};
      const byCustomer = {};

      orderRows.forEach((row) => {
        grouped[row.status] = grouped[row.status] || { status: row.status, count: 0, total: 0 };
        grouped[row.status].count += 1;
        grouped[row.status].total += Number(row.total_amount);

        if (row.status !== 'cancelled') {
          const key = row.customer_id;
          byCustomer[key] = byCustomer[key] || {
            name: row.profiles?.full_name || 'Unknown',
            total: 0,
            orders: 0,
          };
          byCustomer[key].total += Number(row.total_amount);
          byCustomer[key].orders += 1;
        }
      });

      const sales = orderRows
        .filter((row) => row.status !== 'cancelled')
        .reduce((sum, row) => sum + Number(row.total_amount), 0);
      const paid = (payments.data || [])
        .filter((row) => row.status === 'paid')
        .reduce((sum, row) => sum + Number(row.amount), 0);

      setSalesByStatus(Object.values(grouped));
      setTopCustomers(
        Object.values(byCustomer)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
      );
      setTotals({
        orders: orderRows.length,
        sales,
        paid,
        avg: orderRows.length ? sales / orderRows.filter((r) => r.status !== 'cancelled').length : 0,
        activeCustomers: customers.count || 0,
      });
    }

    load();
  }, []);

  return (
    <>
      {error ? <div className="alert">{error}</div> : null}

      <section className="dashboard-cards">
        <div className="card">
          <div>
            <p>All orders</p>
            <h2>{totals.orders}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Gross sales</p>
            <h2>{formatMoney(totals.sales)}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Collected revenue</p>
            <h2>{formatMoney(totals.paid)}</h2>
          </div>
        </div>
        <div className="card">
          <div>
            <p>Active customers</p>
            <h2>{totals.activeCustomers || 0}</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Sales by order status</h2>
            <p>Counts and totals from the orders table</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-header cols-3">
            <span>Status</span>
            <span>Orders</span>
            <span>Total</span>
          </div>
          {salesByStatus.map((row) => (
            <div className="table-row cols-3" key={row.status}>
              <span className={`status ${row.status}`}>{row.status}</span>
              <span>{row.count}</span>
              <span>{formatMoney(row.total)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Customer analytics</h2>
            <p>Top customers by non-cancelled order value</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-header cols-3">
            <span>Customer</span>
            <span>Orders</span>
            <span>Value</span>
          </div>
          {topCustomers.map((row) => (
            <div className="table-row cols-3" key={row.name}>
              <span>{row.name}</span>
              <span>{row.orders}</span>
              <span>{formatMoney(row.total)}</span>
            </div>
          ))}
        </div>
        <p className="hint">Average non-cancelled order: {formatMoney(totals.avg || 0)}</p>
      </section>
    </>
  );
}

export default Reports;
