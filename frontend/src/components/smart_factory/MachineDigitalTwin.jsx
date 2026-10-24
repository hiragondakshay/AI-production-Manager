import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Cpu, RefreshCw, Layers, Zap, ShieldCheck, 
  Activity, Gauge, Thermometer, Radio, CheckCircle2 
} from 'lucide-react';
import DemoTelemetryBadge from './DemoTelemetryBadge';

export default function MachineDigitalTwin({ machineId = 1 }) {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTwin = async () => {
    try {
      const res = await api.get(`/smart-factory/machines/${machineId}/digital-twin`);
      setTwin(res.data);
    } catch (err) {
      console.error('Failed to load Digital Twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, [machineId]);

  if (loading || !twin) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Synchronizing Digital Twin...</div>;
  }

  const { specifications, current_state } = twin;
  const { overview, live_telemetry, production, health } = current_state;

  const components = [
    { name: 'Spindle Assembly', health: health.health_score > 75 ? 94 : 68, status: 'Nominal', icon: Radio },
    { name: 'Motor Drive & Inverter', health: 96, status: 'Nominal', icon: Zap },
    { name: 'Angular Bearing Set', health: live_telemetry.vibration > 2.5 ? 64 : 91, status: live_telemetry.vibration > 2.5 ? 'Warning' : 'Nominal', icon: Activity },
    { name: 'Cooling & Lubricant', health: live_telemetry.temperature > 65 ? 72 : 95, status: live_telemetry.temperature > 65 ? 'Warning' : 'Nominal', icon: Thermometer },
    { name: 'Hydraulic Clamping', health: 93, status: 'Nominal', icon: Layers },
    { name: 'Electrical Power Grid', health: 98, status: 'Nominal', icon: ShieldCheck }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Digital Twin: {overview.name} ({overview.model_code})</h3>
            <span className="badge badge-running">CAD SYNC ACTIVE</span>
            <DemoTelemetryBadge />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Virtual real-time CAD representation, sub-component health telemetry & off-site engineering mirror
          </p>
        </div>

        <button onClick={fetchTwin} className="btn-secondary" style={{ padding: '8px 12px' }}>
          <RefreshCw size={14} />
          <span>Sync Twin State</span>
        </button>
      </div>

      {/* 3 Main Mirror Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '10px' }}>TECHNICAL SPECIFICATIONS</h4>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Manufacturer: <strong>{specifications.manufacturer}</strong></div>
            <div>Model Code: <strong className="text-mono">{specifications.model}</strong></div>
            <div>Machine Type: <strong>{specifications.machine_type}</strong></div>
            <div>Max Spindle RPM: <strong className="text-mono">{specifications.max_spindle_rpm} RPM</strong></div>
            <div>Max Power Rating: <strong className="text-mono">{specifications.max_power_rating_kw} kW</strong></div>
            <div>Firmware: <strong className="text-mono">{specifications.firmware_version}</strong></div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '10px' }}>LIVE OPERATOR & JOB REFLECTION</h4>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Active Operator: <strong>{overview.current_operator} ({overview.operator_code})</strong></div>
            <div>Current Work Order: <strong className="text-mono">{overview.current_job}</strong></div>
            <div>Assigned Operation: <strong>{overview.operation}</strong></div>
            <div>Shift: <strong>{overview.shift}</strong></div>
            <div>Target vs Completed: <strong className="text-mono">{production.completed_quantity} / {production.target_quantity} units ({production.completion_percentage}%)</strong></div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '10px' }}>LIVE SENSOR GAUGES</h4>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Composite Health: <strong className="text-mono" style={{ color: 'var(--accent-emerald)' }}>{health.health_score}% ({health.status_level})</strong></div>
            <div>Temperature: <strong className="text-mono">{live_telemetry.temperature}°C</strong></div>
            <div>Vibration: <strong className="text-mono">{live_telemetry.vibration} mm/s</strong></div>
            <div>Motor Load: <strong className="text-mono">{live_telemetry.motor_load}%</strong></div>
            <div>Spindle Speed: <strong className="text-mono">{live_telemetry.rpm} RPM</strong></div>
            <div>Power Consumption: <strong className="text-mono">{live_telemetry.power_consumption} kW</strong></div>
          </div>
        </div>
      </div>

      {/* Sub-Component Health Grid */}
      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={18} color="var(--accent-cyan)" />
          <span>Sub-Component Health Diagnostics & Degradation Meters</span>
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {components.map((c, i) => {
            const Icon = c.icon;
            const isGood = c.health >= 85;
            return (
              <div key={i} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={isGood ? 'var(--accent-cyan)' : 'var(--accent-amber)'} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{c.name}</span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: isGood ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                  }}>
                    {c.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${c.health}%`,
                    height: '100%',
                    background: isGood ? 'linear-gradient(90deg, #0284c7, #10b981)' : 'linear-gradient(90deg, #f59e0b, #e11d48)',
                    borderRadius: '3px'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Component Health</span>
                  <span className="text-mono" style={{ color: '#fff', fontWeight: 700 }}>{c.health}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
