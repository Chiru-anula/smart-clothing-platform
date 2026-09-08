import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/format';

function Reviews() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data, error: loadError } = await supabase
      .from('reviews')
      .select('id, rating, comment, status, created_at, profiles:customer_id (full_name), products:product_id (name)')
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

  async function moderate(id, status) {
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ status, moderated_by: profile?.id || null })
      .eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Customer Reviews</h2>
          <p>Approve or reject reviews before they stay published</p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="data-table">
        <div className="table-header cols-6">
          <span>Customer</span>
          <span>Product</span>
          <span>Rating</span>
          <span>Comment</span>
          <span>Status</span>
          <span></span>
        </div>
        {rows.map((row) => (
          <div className="table-row cols-6" key={row.id}>
            <span>{row.profiles?.full_name}</span>
            <span>{row.products?.name || '—'}</span>
            <span>{row.rating} / 5</span>
            <span>{row.comment}</span>
            <span className={`status ${row.status}`}>{row.status}</span>
            <span className="row-actions">
              <button type="button" onClick={() => moderate(row.id, 'approved')}>Approve</button>
              <button type="button" onClick={() => moderate(row.id, 'rejected')}>Reject</button>
              <small>{formatDate(row.created_at)}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Reviews;
