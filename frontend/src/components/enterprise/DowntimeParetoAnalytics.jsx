import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  AlertOctagon, Clock, IndianRupee, PieChart as PieIcon, 
  TrendingDown, ShieldAlert, RefreshCw, BarChart2 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, 
  YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

export default function DowntimeParetoAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDowntime = async () => {
    try {
      const res = await api.get('/enterprise/downtime/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load downtime analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDowntime();
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Analyzing Machine Downtime Events & Pareto 80/20 Distribution...</div>;
  }

  const { summary, pareto_chart, recent_downtime_events } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={26} color="var(--accent-rose)" />
            <span>Downtime Analytics & Pareto 80/20 Distribution (₹ INR)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Root category classification, production loss impact, MTTR, MTBF, and 80/20 Pareto bottleneck analysis
          </p>
        </div>

        <button onClick={fetchDowntime} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Downtime</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Downtime</span>
            <Clock size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-rose)' }} className="text-mono">
            {summary.total_downtime_hours} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Across {summary.total_incidents} logged incidents
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Production Loss</span>
            <TrendingDown size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-amber)' }} className="text-mono">
            {summary.total_production_loss_units} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Lost manufactured product output
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Cost Impact</span>
            <IndianRupee size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: '#fff' }} className="text-mono">
            ₹{Math.round(summary.total_cost_loss_usd * 83.5).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Direct labor + machine idle overhead
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reliability Metrics</span>
            <ShieldAlert size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--accent-cyan)' }} className="text-mono">
            MTTR: {summary.mttr_minutes}m
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            MTBF: {summary.mtbf_hours} hrs between failures
          </div>
        </div>
      </div>

      {/* Pareto 80/20 Composed Chart */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="var(--accent-cyan)" />
          <span>Pareto Analysis (80% of Downtime from Top Causes)</span>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Bars indicate total downtime minutes per category; the orange line displays cumulative % towards the 80% threshold.
        </p>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <ComposedChart data={pareto_chart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} unit="m" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent-amber)" fontSize={12} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="duration_minutes" name="Downtime (Minutes)" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative_percentage" name="Cumulative %" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>Recent Logged Machine Downtime Events</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Machine</th>
                <th style={{ padding: '10px 8px' }}>Category</th>
                <th style={{ padding: '10px 8px' }}>Reason Description</th>
                <th style={{ padding: '10px 8px' }}>Duration</th>
                <th style={{ padding: '10px 8px' }}>Units Lost</th>
                <th style={{ padding: '10px 8px' }}>Cost Loss</th>
                <th style={{ padding: '10px 8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recent_downtime_events.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>{e.machine_name}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: e.category === 'Mechanical' ? 'rgba(244, 63, 94, 0.2)' : e.category === 'Electrical' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: e.category === 'Mechanical' ? 'var(--accent-rose)' : e.category === 'Electrical' ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                    }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{e.reason}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }} className="text-mono">{e.duration_minutes} min</td>
                  <td style={{ padding: '10px 8px', color: 'var(--accent-rose)' }} className="text-mono">{e.loss_units}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{Math.round(e.cost_impact * 83.5).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
