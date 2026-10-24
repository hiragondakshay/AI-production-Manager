import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Wrench, Plus, CheckCircle2, Clock, AlertTriangle, 
  UserCheck, IndianRupee, Filter, RefreshCw, X 
} from 'lucide-react';

export default function MaintenanceWorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [machineId, setMachineId] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTech, setAssignedTech] = useState('Carlos Santana');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [cost, setCost] = useState(15000.0);
  const [creating, setCreating] = useState(false);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/enterprise/work-orders');
      setWorkOrders(res.data);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/enterprise/work-orders', {
        machine_id: machineId,
        title,
        description,
        priority,
        assigned_technician: assignedTech,
        estimated_hours: estimatedHours,
        cost
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchWorkOrders();
    } catch (err) {
      console.error('Failed to create work order:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (woId, newStatus) => {
    try {
      await api.put(`/enterprise/work-orders/${woId}/status`, { status: newStatus });
      fetchWorkOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredOrders = workOrders.filter(w => {
    if (filterStatus === 'all') return true;
    return w.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={26} color="var(--accent-amber)" />
            <span>Maintenance Work Orders & Dispatch Manager (₹ INR)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Create, assign, schedule, and track corrective & preventive maintenance work orders
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '8px 16px' }}>
            <Plus size={16} />
            <span>Create Work Order</span>
          </button>
          <button onClick={fetchWorkOrders} className="btn-secondary" style={{ padding: '8px 14px' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {['all', 'pending', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={filterStatus === st ? "btn-primary" : "btn-secondary"}
            style={{ padding: '6px 14px', fontSize: '0.8rem', textTransform: 'capitalize' }}
          >
            {st.replace('_', ' ')} ({workOrders.filter(w => st === 'all' || w.status === st).length})
          </button>
        ))}
      </div>

      {/* Work Orders Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading work orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No work orders found under this status filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Code</th>
                  <th style={{ padding: '10px 8px' }}>Machine</th>
                  <th style={{ padding: '10px 8px' }}>Title & Scope</th>
                  <th style={{ padding: '10px 8px' }}>Priority</th>
                  <th style={{ padding: '10px 8px' }}>Technician</th>
                  <th style={{ padding: '10px 8px' }}>Est. Hours</th>
                  <th style={{ padding: '10px 8px' }}>Budget Cost</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((w) => {
                  const isPending = w.status === 'pending';
                  const isInProg = w.status === 'in_progress';
                  const isComp = w.status === 'completed';

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--accent-cyan)' }} className="text-mono">
                        {w.work_order_code}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>
                        {w.machine_name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({w.model_code})</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{w.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.description}</div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: w.priority === 'urgent' || w.priority === 'high' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: w.priority === 'urgent' || w.priority === 'high' ? 'var(--accent-rose)' : 'var(--accent-amber)'
                        }}>
                          {w.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={14} color="var(--accent-cyan)" />
                          <span>{w.assigned_technician}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }} className="text-mono">{w.estimated_hours}h</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--accent-emerald)' }} className="text-mono">₹{Math.round(w.cost * 83.5).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isComp ? 'rgba(16, 185, 129, 0.2)' : isInProg ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isComp ? 'var(--accent-emerald)' : isInProg ? 'var(--accent-cyan)' : 'var(--accent-amber)'
                        }}>
                          {w.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'in_progress')}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid var(--accent-cyan)',
                              color: 'var(--accent-cyan)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            Start Job
                          </button>
                        )}
                        {isInProg && (
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'completed')}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid var(--accent-emerald)',
                              color: 'var(--accent-emerald)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Done
                          </button>
                        )}
                        {isComp && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1500, padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Create Maintenance Work Order</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>TARGET MACHINE</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value={1}>CNC Alpha (CNC-001)</option>
                  <option value={2}>CNC Beta (CNC-002)</option>
                  <option value={3}>CNC Gamma (CNC-003)</option>
                  <option value={4}>Lathe Alpha (LTH-001)</option>
                  <option value={5}>Press Alpha (PRS-001)</option>
                  <option value={6}>Laser Alpha (LSR-001)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>WORK ORDER TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spindle Vibration Calibration & Grease Flush"
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>JOB DESCRIPTION</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details on corrective procedure, replacement parts..."
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>ASSIGN TECHNICIAN</label>
                  <input
                    type="text"
                    value={assignedTech}
                    onChange={(e) => setAssignedTech(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>ESTIMATED HOURS</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>BUDGET COST (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={creating} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
                <span>{creating ? 'Creating Work Order...' : 'Dispatch Maintenance Work Order'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
