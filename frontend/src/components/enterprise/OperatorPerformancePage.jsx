import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, Award, TrendingUp, CheckCircle, ShieldCheck, 
  RefreshCw, BarChart2, Star 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, 
  YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

export default function OperatorPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    try {
      const res = await api.get('/enterprise/operators/performance');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load operator performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Compiling Operator Productivity Scorecards & Quality Ratings...</div>;
  }

  const { summary, operators } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="var(--accent-purple)" />
            <span>Operator Productivity & Quality Performance Matrix</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track machine operator work duration, output units, defect rates, overall efficiency, and leaderboard rankings
          </p>
        </div>

        <button onClick={fetchPerformance} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Scorecards</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Workforce</span>
            <Users size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-purple)' }} className="text-mono">
            {summary.total_active_operators} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Technicians</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Certified CNC & Fabrication Operators
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Workforce Efficiency</span>
            <TrendingUp size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-emerald)' }} className="text-mono">
            {summary.average_plant_efficiency}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Target benchmark: 90.0%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>First-Pass Quality Yield</span>
            <ShieldCheck size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-cyan)' }} className="text-mono">
            {summary.average_quality_score}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Minimal scrap and rework overhead
          </div>
        </div>
      </div>

      {/* Operator Leaderboard Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--accent-amber)" />
          <span>Operator Performance Leaderboard</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Rank</th>
                <th style={{ padding: '10px 8px' }}>Operator</th>
                <th style={{ padding: '10px 8px' }}>Department & Role</th>
                <th style={{ padding: '10px 8px' }}>Assigned Machine</th>
                <th style={{ padding: '10px 8px' }}>Hours</th>
                <th style={{ padding: '10px 8px' }}>Units Output</th>
                <th style={{ padding: '10px 8px' }}>Efficiency</th>
                <th style={{ padding: '10px 8px' }}>Quality</th>
                <th style={{ padding: '10px 8px' }}>Composite Score</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op, idx) => (
                <tr key={op.employee_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800 }}>
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>
                    {op.name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({op.employee_code})</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{op.department}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{op.role_title}</div>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{op.assigned_machine}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">{op.hours_worked}h</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }} className="text-mono">{op.units_produced.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--accent-emerald)', fontWeight: 700 }} className="text-mono">{op.efficiency_percentage}%</td>
                  <td style={{ padding: '10px 8px', color: 'var(--accent-cyan)', fontWeight: 700 }} className="text-mono">{op.quality_percentage}%</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: op.overall_performance_score >= 95 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      color: op.overall_performance_score >= 95 ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                    }}>
                      ★ {op.overall_performance_score}% ({op.rating_tier})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
