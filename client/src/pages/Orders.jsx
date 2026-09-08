import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDate } from '../lib/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function Orders() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data, error: loadError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, profiles:customer_id (full_name), stores:store_id (name)')
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(order, nextStatus) {
    if (order.status === nextStatus) return;

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: nextStatus,
      changed_by: profile?.id || null,
      note: 'Updated from admin panel',
    });

    load();
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Orders</h2>
          <p>Update fulfilment status. Invalid transitions are still blocked by the database enum.</p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="data-table">
        <div className="table-header cols-6">
          <span>Order</span>
          <span>Customer</span>
          <span>Store</span>
          <span>Amount</span>
          <span>Placed</span>
          <span>Status</span>
        </div>
        {rows.map((row) => (
          <div className="table-row cols-6" key={row.id}>
            <span>{row.order_number}</span>
            <span>{row.profiles?.full_name}</span>
            <span>{row.stores?.name || '—'}</span>
            <span>{formatMoney(row.total_amount)}</span>
            <span>{formatDate(row.created_at)}</span>
            <span>
              <select
                value={row.status}
                onChange={(e) => updateStatus(row, e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Orders;
