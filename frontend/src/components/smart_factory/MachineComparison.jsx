import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, RefreshCw } from 'lucide-react';

export default function MachineComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComparison = async () => {
    try {
      const res = await api.get('/smart-factory/machines/compare/analytics?machine_ids=1,2,3,4,5,6');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load machine comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading multi-machine analytics comparison...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-cyan)" />
            <span>Multi-Machine Cross-Fleet Analytics & Comparison</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Compare health scores, temperature, vibration, motor load, and energy consumption across machines
          </p>
        </div>

        <button onClick={fetchComparison} className="btn-secondary" style={{ padding: '8px 12px' }}>
          <RefreshCw size={14} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Chart 1: Health Score vs Motor Load */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>Fleet Health Score (%) vs Motor Load (%)</h4>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="health_score" fill="#10b981" name="Health Score (%)" radius={[4,4,0,0]} />
                <Bar dataKey="motor_load" fill="#818cf8" name="Motor Load (%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Temperature (°C) vs Vibration (mm/s x10) */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>Thermal (°C) & Vibration Stress Levels</h4>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.map(d => ({ ...d, vibration_scaled: d.vibration * 10 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="temperature" fill="#f59e0b" name="Temperature (°C)" radius={[4,4,0,0]} />
                <Bar dataKey="vibration_scaled" fill="#38bdf8" name="Vibration (mm/s x10)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
