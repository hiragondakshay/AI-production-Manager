import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  X, Activity, Flame, Gauge, Zap, Wrench, AlertTriangle, 
  CheckCircle2, Clock, Play, RefreshCw, Cpu, Layers, ShieldAlert, ArrowLeft, Search, PlusCircle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import DemoTelemetryBadge from './DemoTelemetryBadge';
import RootCauseAnalysisModal from '../enterprise/RootCauseAnalysisModal';

export default function MachineDetailsModal({ machineId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [demoAnomalyMsg, setDemoAnomalyMsg] = useState('');
  const [showRCAModal, setShowRCAModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'live_data', 'production', 'maintenance', 'history'

  // Work Order Creation Form State
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [woTitle, setWoTitle] = useState('Corrective Maintenance & Sensor Check');
  const [woPriority, setWoPriority] = useState('medium');
  const [woTech, setWoTech] = useState('Carlos Santana (Senior Tech)');
  const [woHours, setWoHours] = useState('2.5');
  const [woCost, setWoCost] = useState('18500'); // ₹ INR
  const [woSuccessMsg, setWoSuccessMsg] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/smart-factory/machines/${machineId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load machine details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 3000); // 3s polling sync
    return () => clearInterval(interval);
  }, [machineId]);

  const handleTriggerDemoAnomaly = async () => {
    setSimulating(true);
    setDemoAnomalyMsg('');
    try {
      // Inject abnormal telemetry spike (88.5°C temp, 5.2 mm/s vibration, 96% motor load)
      await api.post(`/machines/${machineId}/telemetry?temp=88.5&vibration=5.2&add_hours=0.5`);
      setDemoAnomalyMsg('⚡ DEMO ANOMALY INJECTED: Thermal and vibration surge (88.5°C, 5.2 mm/s). Critical alert generated in database.');
      await fetchDetail();
    } catch (err) {
      console.error('Failed to trigger demo anomaly:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/work-orders', {
        machine_id: machineId,
        title: woTitle,
        description: `Automated work order from Machine Details view for ${data?.overview?.name}. Technician review required.`,
        priority: woPriority,
        assigned_technician: woTech,
        estimated_hours: parseFloat(woHours),
        cost: Math.round(parseFloat(woCost) / 83.5)
      });
      setWoSuccessMsg('✓ Maintenance Work Order successfully created and dispatched!');
      setShowCreateWO(false);
      await fetchDetail();
      setTimeout(() => setWoSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to create work order:', err);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 18, 32, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, color: 'var(--text-muted)' }}>
        Loading Industry 4.0 Digital Twin Telemetry...
      </div>
    );
  }

  const { overview, live_telemetry, telemetry_history, production, health, predictive_maintenance, maintenance, active_alerts } = data;

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 18, 32, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          maxWidth: '1150px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={onClose} 
                className="btn-secondary"
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>{overview.name}</h2>
                  <span className="text-mono" style={{ fontSize: '0.78rem', color: '#38BDF8', background: '#1E293B', border: '1px solid #293548', padding: '2px 8px', borderRadius: '4px' }}>
                    {overview.model_code}
                  </span>
                  <span className={`badge badge-${overview.status}`}>
                    {overview.status.toUpperCase()}
                  </span>
                  <DemoTelemetryBadge />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {overview.machine_type} | Operator: <strong style={{ color: '#F8FAFC' }}>{overview.current_operator}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setShowRCAModal(true)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', border: '1px solid #EF4444', color: '#EF4444' }}
              >
                <Search size={13} />
                <span>RCA 5-Why</span>
              </button>

              <button
                onClick={() => setShowCreateWO(true)}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <PlusCircle size={13} />
                <span>Create Work Order</span>
              </button>

              <button 
                onClick={handleTriggerDemoAnomaly} 
                disabled={simulating}
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#EF4444' }}
              >
                <AlertTriangle size={13} />
                <span>{simulating ? 'Simulating...' : 'Simulate Anomaly'}</span>
              </button>

              <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 8px' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Success / Alert Toast Banner */}
          {woSuccessMsg && (
            <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22C55E', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              {woSuccessMsg}
            </div>
          )}

          {demoAnomalyMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              {demoAnomalyMsg}
            </div>
          )}

          {/* 5-Tab Navigation Bar */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              A. Overview
            </button>
            <button
              onClick={() => setActiveTab('live_data')}
              className={activeTab === 'live_data' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              B. Live Telemetry
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={activeTab === 'production' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              C. Production
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={activeTab === 'maintenance' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              D. Maintenance
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              E. History & Logs
            </button>
          </div>

          {/* TAB A: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operator</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#F8FAFC' }}>{overview.current_operator}</div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>ID: {overview.operator_code}</div>
                </div>

                <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Work Order</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }} className="text-mono">{overview.current_job}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{overview.product_name}</div>
                </div>

                <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Assessment</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '4px', color: health.health_score > 80 ? '#22C55E' : '#EF4444' }}>
                    {health.health_score}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Rating: <strong>{health.status_level}</strong></div>
                </div>

                <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predictive Risk</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '4px', color: predictive_maintenance.risk_level === 'CRITICAL' ? '#EF4444' : predictive_maintenance.risk_level === 'HIGH' ? '#F59E0B' : '#22C55E' }}>
                    {predictive_maintenance.risk_level}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Pattern: {predictive_maintenance.health_classification}</div>
                </div>
              </div>

              {/* Sub-Component Health Status */}
              <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px' }}>
                  Sub-System Diagnostic Health
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#172033', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Temperature</span>
                    <span className={`badge badge-${health.temp_health === 'Healthy' ? 'running' : 'fault'}`}>{health.temp_health}</span>
                  </div>
                  <div style={{ background: '#172033', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vibration</span>
                    <span className={`badge badge-${health.vibration_health === 'Healthy' ? 'running' : 'fault'}`}>{health.vibration_health}</span>
                  </div>
                  <div style={{ background: '#172033', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Motor Load</span>
                    <span className={`badge badge-${health.motor_health === 'Healthy' ? 'running' : 'fault'}`}>{health.motor_health}</span>
                  </div>
                  <div style={{ background: '#172033', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spindle Bearings</span>
                    <span className={`badge badge-${health.spindle_health === 'Healthy' ? 'running' : 'fault'}`}>{health.spindle_health}</span>
                  </div>
                  <div style={{ background: '#172033', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Electrical Inverter</span>
                    <span className={`badge badge-${health.electrical_health === 'Healthy' ? 'running' : 'fault'}`}>{health.electrical_health}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: LIVE TELEMETRY */}
          {activeTab === 'live_data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TEMPERATURE</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: live_telemetry.temperature > 65 ? '#EF4444' : '#F59E0B' }}>
                    {live_telemetry.temperature}°C
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VIBRATION</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: live_telemetry.vibration > 3.0 ? '#EF4444' : '#38BDF8' }}>
                    {live_telemetry.vibration} mm/s
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MOTOR LOAD</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#A855F7' }}>
                    {live_telemetry.motor_load}%
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RPM</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22C55E' }}>
                    {live_telemetry.rpm}
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POWER DRAW</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {live_telemetry.power_consumption} kW
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPINDLE LOAD</div>
                  <div className="text-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {live_telemetry.spindle_load}%
                  </div>
                </div>
              </div>

              {/* Time Series Chart */}
              <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC' }}>Live Telemetry Trend Stream</span>
                  <span style={{ fontSize: '0.7rem', color: '#22C55E' }}>Sampling: 500ms</span>
                </div>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetry_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#293548" />
                      <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid #293548', borderRadius: '6px' }} />
                      <Area type="monotone" dataKey="temp" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.15)" name="Temp (°C)" />
                      <Area type="monotone" dataKey="motor_load" stroke="#A855F7" fill="rgba(168, 85, 247, 0.15)" name="Motor Load (%)" />
                      <Area type="monotone" dataKey="vibration" stroke="#38BDF8" fill="rgba(56, 189, 248, 0.15)" name="Vibration (mm/s)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: PRODUCTION */}
          {activeTab === 'production' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>Batch Completion: <strong>{production.completed_quantity} / {production.target_quantity} units</strong></span>
                  <strong style={{ color: '#22C55E' }}>{production.completion_percentage}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#172033', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${production.completion_percentage}%`, height: '100%', background: '#22C55E', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REMAINING OUTPUT</div>
                  <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#EF4444' }}>
                    {production.remaining_quantity} Units
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRODUCTION PACE</div>
                  <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
                    {production.production_rate_parts_hr} Parts/hr
                  </div>
                </div>
                <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ESTIMATED COMPLETION</div>
                  <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F59E0B' }}>
                    {production.expected_completion}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB D: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LAST MAINTENANCE</div>
                  <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{maintenance.last_maintenance}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEXT SCHEDULED</div>
                  <div style={{ fontWeight: 700, color: '#F59E0B' }}>{maintenance.next_scheduled_maintenance}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RUN HOURS REMAINING</div>
                  <div style={{ fontWeight: 700, color: '#38BDF8' }}>{maintenance.maintenance_hours_remaining} hrs</div>
                </div>
                <button 
                  onClick={() => setShowCreateWO(true)}
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <PlusCircle size={13} />
                  <span>New Work Order</span>
                </button>
              </div>

              {/* Service History Records */}
              <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '10px' }}>Historical Service Records</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {maintenance.logs.map((log, idx) => (
                    <div key={idx} style={{ background: '#172033', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#F8FAFC' }}>{log.type} — <span style={{ color: 'var(--text-muted)' }}>{log.date}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.description} (Tech: {log.performed_by})</div>
                      </div>
                      <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.82rem' }}>
                        ₹{Math.round(log.cost * 83.5).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB E: HISTORY & ALERTS */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '10px' }}>Active Diagnostics & Fault Alarms</h4>
                {active_alerts.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '16px' }}>
                    No active alarm states registered. Telemetry operating within normal tolerance limits.
                  </div>
                ) : (
                  active_alerts.map(a => (
                    <div key={a.id} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#EF4444', fontSize: '0.82rem' }}>
                        <span>{a.message}</span>
                        <span>{a.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Recommended Action: <strong style={{ color: '#F8FAFC' }}>{a.recommended_action}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Modal Work Order Form */}
          {showCreateWO && (
            <div style={{
              background: '#1E293B',
              border: '1px solid #38BDF8',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '10px'
            }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={16} color="#38BDF8" />
                <span>Create Maintenance Work Order for {overview.name}</span>
              </h4>
              <form onSubmit={handleCreateWorkOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TITLE</label>
                  <input 
                    type="text" 
                    value={woTitle} 
                    onChange={e => setWoTitle(e.target.value)} 
                    style={{ width: '100%', background: '#172033', border: '1px solid var(--border-color)', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
                  <select 
                    value={woPriority} 
                    onChange={e => setWoPriority(e.target.value)}
                    style={{ width: '100%', background: '#172033', border: '1px solid var(--border-color)', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ASSIGNED TECHNICIAN</label>
                  <input 
                    type="text" 
                    value={woTech} 
                    onChange={e => setWoTech(e.target.value)} 
                    style={{ width: '100%', background: '#172033', border: '1px solid var(--border-color)', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ESTIMATED COST (₹ INR)</label>
                  <input 
                    type="number" 
                    value={woCost} 
                    onChange={e => setWoCost(e.target.value)} 
                    style={{ width: '100%', background: '#172033', border: '1px solid var(--border-color)', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setShowCreateWO(false)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Root Cause Analysis 5-Why Modal */}
      {showRCAModal && (
        <RootCauseAnalysisModal
          machineId={machineId}
          onClose={() => setShowRCAModal(false)}
        />
      )}
    </>
  );
}
