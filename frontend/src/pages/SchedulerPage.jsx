import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CalendarRange, Sparkles, Clock, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SchedulerPage() {
  const [orders, setOrders] = useState([]);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRunAIScheduler = async () => {
    setOptimizing(true);
    try {
      const res = await api.post('/ai/schedule');
      setAiSchedule(res.data);
    } catch (err) {
      console.error('Failed to run AI schedule optimizer:', err);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarRange size={24} color="var(--accent-cyan)" />
            <span>AI Production Job Scheduler</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Capacity & priority-aware optimization engine for job scheduling and machine allocation
          </p>
        </div>
        <button
          onClick={handleRunAIScheduler}
          disabled={optimizing}
          className="btn-primary"
        >
          <Sparkles size={18} />
          <span>{optimizing ? 'Calculating Optimal Schedule...' : 'Run AI Optimization Engine'}</span>
        </button>
      </div>

      {/* AI Schedule Optimization Output Banner if available */}
      {aiSchedule && (
        <div className="glass-panel" style={{ padding: '24px', borderColor: 'var(--accent-cyan)', background: 'rgba(2, 132, 199, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              <span>AI Optimized Job Allocation Plan ({aiSchedule.scheduled_count} Orders Scheduled)</span>
            </h3>
            <span className="badge badge-running">Optimization Complete</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {aiSchedule.schedule.map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.order_number}</span>
                  <span className="badge badge-info">{item.priority.toUpperCase()}</span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.product_name} ({item.quantity} pcs)</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <Cpu size={15} color="var(--accent-purple)" />
                  <span>Assigned Machine: <strong>{item.recommended_machine_name}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Start: <strong style={{ color: '#fff' }}>{item.estimated_start}</strong></div>
                  <div>Finish: <strong style={{ color: '#fff' }}>{item.estimated_completion}</strong> ({item.estimated_duration_hours}h)</div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                  💡 {item.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Queue Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Pending & In-Production Jobs Queue</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{o.order_number}</td>
                <td style={{ fontWeight: 600 }}>{o.product_name}</td>
                <td>{o.quantity.toLocaleString()} pcs</td>
                <td>
                  <span className={`badge badge-${o.priority === 'urgent' ? 'breakdown' : o.priority === 'high' ? 'warning' : 'info'}`}>
                    {o.priority}
                  </span>
                </td>
                <td>{new Date(o.deadline).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge-${o.status === 'in_production' ? 'running' : 'idle'}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
