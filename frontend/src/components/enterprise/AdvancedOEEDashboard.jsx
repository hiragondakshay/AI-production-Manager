import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Gauge, TrendingUp, CheckCircle, Clock, Zap, 
  BarChart2, Award, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, BarChart, Bar, Legend 
} from 'recharts';

export default function AdvancedOEEDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOEE = async () => {
    try {
      const res = await api.get('/enterprise/oee/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load OEE analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOEE();
    const interval = setInterval(fetchOEE, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Calculating Real-Time Overall Equipment Effectiveness...</div>;
  }

  const { plant_kpis, historical_trends, machine_oee_breakdown } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gauge size={26} color="var(--accent-cyan)" />
            <span>Advanced Overall Equipment Effectiveness (OEE) Dashboard</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time availability, performance speed, quality yield and world-class OEE benchmark analytics
          </p>
        </div>

        <button onClick={fetchOEE} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh OEE</span>
        </button>
      </div>

      {/* 4 Core KPI Pillar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Overall OEE */}
        <div className="glass-panel" style={{
          padding: '20px',
          background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 70%), var(--surface-card)',
          border: '1px solid var(--accent-cyan)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Plant Overall OEE</span>
            <Award size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, margin: '10px 0 2px 0', color: '#fff' }} className="text-mono">
            {plant_kpis.overall_oee}%
          </div>
          <div style={{ fontSize: '0.76rem', color: plant_kpis.overall_oee >= 85 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>
            {plant_kpis.overall_oee >= 85 ? '★ World Class Benchmark (>85%)' : '▲ Target Benchmark: 85.0%'}
          </div>
        </div>

        {/* Availability */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Availability Score</span>
            <Clock size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-emerald)' }} className="text-mono">
            {plant_kpis.availability}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Operating Time vs Planned Production
          </div>
        </div>

        {/* Performance */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Performance Score</span>
            <Zap size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-purple)' }} className="text-mono">
            {plant_kpis.performance}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Actual Speed vs Theoretical Max Rate
          </div>
        </div>

        {/* Quality */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Yield</span>
            <ShieldCheck size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-amber)' }} className="text-mono">
            {plant_kpis.quality}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            First-Pass Good Parts vs Total Output
          </div>
        </div>
      </div>

      {/* 7-Day OEE Trend Chart */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-cyan)" />
          <span>7-Day Plant OEE & Factor Trend</span>
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={historical_trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={12} />
              <YAxis domain={[60, 100]} stroke="var(--text-muted)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="oee" name="Overall OEE" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#oeeGrad)" />
              <Area type="monotone" dataKey="availability" name="Availability" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#availGrad)" />
              <Area type="monotone" dataKey="performance" name="Performance" stroke="#c084fc" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine-Wise OEE Table & Comparison Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>Machine-Wise OEE Ratings</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Machine</th>
                  <th style={{ padding: '10px 8px' }}>Avail</th>
                  <th style={{ padding: '10px 8px' }}>Perf</th>
                  <th style={{ padding: '10px 8px' }}>Qual</th>
                  <th style={{ padding: '10px 8px' }}>OEE</th>
                  <th style={{ padding: '10px 8px' }}>Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {machine_oee_breakdown.map((m) => (
                  <tr key={m.machine_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>
                      {m.machine_name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({m.model_code})</span>
                    </td>
                    <td style={{ padding: '10px 8px' }} className="text-mono">{m.availability}%</td>
                    <td style={{ padding: '10px 8px' }} className="text-mono">{m.performance}%</td>
                    <td style={{ padding: '10px 8px' }} className="text-mono">{m.quality}%</td>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: m.oee >= 85 ? 'var(--accent-emerald)' : m.oee >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)' }} className="text-mono">
                      {m.oee}%
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {m.benchmark_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machine OEE Bar Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="var(--accent-purple)" />
            <span>OEE Comparison by Unit</span>
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={machine_oee_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="model_code" stroke="var(--text-muted)" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="oee" name="OEE Score" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
