import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function Roles() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .order('role')
      .order('full_name');

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(id, role) {
    const { error: updateError } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  }

  async function updateStatus(id, status) {
    const { error: updateError } = await supabase.from('profiles').update({ status }).eq('id', id);
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
          <h2>User Role Management</h2>
          <p>Change roles and account status for platform users</p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="data-table">
        <div className="table-header cols-5">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span></span>
        </div>
        {rows.map((row) => (
          <div className="table-row cols-5" key={row.id}>
            <span>{row.full_name}</span>
            <span>{row.email}</span>
            <span>
              <select value={row.role} onChange={(e) => updateRole(row.id, e.target.value)}>
                <option value="admin">admin</option>
                <option value="store_manager">store_manager</option>
                <option value="customer">customer</option>
              </select>
            </span>
            <span>
              <select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </span>
            <span className={`status ${row.role}`}>{row.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Roles;
