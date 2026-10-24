import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Zap, IndianRupee, Leaf, AlertTriangle, 
  Activity, RefreshCw, BarChart2, ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, 
  YAxis, Tooltip, CartesianGrid, BarChart, Bar 
} from 'recharts';

export default function EnergyMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEnergy = async () => {
    try {
      const res = await api.get('/enterprise/energy/monitoring');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load energy monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnergy();
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Metering Machine Energy Consumption & Carbon Footprint...</div>;
  }

  const { factory_energy_kpis, machine_energy_breakdown, energy_consumption_timeline } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={26} color="var(--accent-amber)" />
            <span>Industrial Energy & Power Analytics (₹ INR)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time kilowatt-hour telemetry, energy cost per produced unit, carbon emissions, and power surge alerts
          </p>
        </div>

        <button onClick={fetchEnergy} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Meters</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Energy Consumption</span>
            <Zap size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-amber)' }} className="text-mono">
            {factory_energy_kpis.total_shift_consumption_kwh} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Total 8-hr factory electrical draw
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Energy Cost</span>
            <IndianRupee size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-emerald)' }} className="text-mono">
            ₹{Math.round(factory_energy_kpis.total_energy_cost_usd * 83.5).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Industrial Tariff: ₹8.50 / kWh
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CO2 Footprint</span>
            <Leaf size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-cyan)' }} className="text-mono">
            {factory_energy_kpis.total_co2_footprint_kg} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Calculated carbon footprint
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency Rating</span>
            <ShieldCheck size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--accent-purple)' }}>
            {factory_energy_kpis.energy_efficiency_rating}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            Optimized Power Factor 0.92
          </div>
        </div>
      </div>

      {/* Hourly Energy Draw Timeline Chart */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-amber)" />
          <span>Factory Power Profile (Hourly kWh Profile)</span>
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={energy_consumption_timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} unit=" kWh" />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="kwh" name="Energy Draw (kWh)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#energyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Breakdown Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>Machine-Wise Energy Intensity & Unit Cost</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Machine</th>
                <th style={{ padding: '10px 8px' }}>Instant Power</th>
                <th style={{ padding: '10px 8px' }}>Shift kWh</th>
                <th style={{ padding: '10px 8px' }}>Energy Cost</th>
                <th style={{ padding: '10px 8px' }}>kWh / Unit</th>
                <th style={{ padding: '10px 8px' }}>Efficiency</th>
                <th style={{ padding: '10px 8px' }}>Surge Status</th>
              </tr>
            </thead>
            <tbody>
              {machine_energy_breakdown.map((m) => (
                <tr key={m.machine_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>
                    {m.machine_name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({m.model_code})</span>
                  </td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">{m.current_power_kw} kW</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">{m.shift_kwh} kWh</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{Math.round(m.energy_cost_usd * 83.5).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--accent-cyan)' }} className="text-mono">{m.kwh_per_produced_unit}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">{m.energy_efficiency_pct}%</td>
                  <td style={{ padding: '10px 8px' }}>
                    {m.is_abnormal_surge ? (
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}>
                        ⚠️ POWER SURGE
                      </span>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
                        ✓ NOMINAL
                      </span>
                    )}
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
