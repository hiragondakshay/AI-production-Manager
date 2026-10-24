import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import RootCauseAnalysisModal from '../components/enterprise/RootCauseAnalysisModal';
import DemoTelemetryBadge from '../components/smart_factory/DemoTelemetryBadge';
import { 
  Activity, Flame, Gauge, Zap, Wrench, AlertTriangle, 
  CheckCircle2, Clock, Play, RefreshCw, Cpu, Layers, ShieldAlert, ArrowLeft, Search, PlusCircle, FileText, Check, AlertOctagon 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function MachineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const machineId = id || '1';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncToast, setSyncToast] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [anomalyMsg, setAnomalyMsg] = useState('');
  const [showRCAModal, setShowRCAModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'live_data', 'production', 'maintenance', 'history', 'specs'

  // Work Order Form State
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [woTitle, setWoTitle] = useState('Corrective Sensor & Tooling Calibration');
  const [woPriority, setWoPriority] = useState('medium');
  const [woTech, setWoTech] = useState('Carlos Santana (Senior Tech)');
  const [woHours, setWoHours] = useState('2.5');
  const [woCost, setWoCost] = useState('18500'); // ₹ INR
  const [woToast, setWoToast] = useState('');

  const fetchDetail = async (isManual = false) => {
    if (isManual) setSyncing(true);
    try {
      const res = await api.get(`/smart-factory/machines/${machineId}`);
      setData(res.data);
      setLastSyncedAt(new Date());
      if (isManual) {
        setSyncToast('✓ Telemetry and workstation state refreshed from database.');
        setTimeout(() => setSyncToast(''), 3500);
      }
    } catch (err) {
      console.error('Failed to load machine details:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(() => fetchDetail(false), 3000);
    return () => clearInterval(interval);
  }, [machineId]);

  const handleSimulateAnomaly = async () => {
    setSimulating(true);
    setAnomalyMsg('');
    try {
      await api.post(`/machines/${machineId}/telemetry?temp=88.5&vibration=5.2&add_hours=0.5`);
      setAnomalyMsg('⚡ DEMO ANOMALY INJECTED: Thermal (88.5°C) & Vibration (5.2 mm/s) surge. Alert generated.');
      await fetchDetail();
      setTimeout(() => setAnomalyMsg(''), 5000);
    } catch (err) {
      console.error('Failed to trigger anomaly:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/work-orders', {
        machine_id: parseInt(machineId),
        title: woTitle,
        description: `Work order dispatched from Machine Detail page for ${data?.overview?.name}.`,
        priority: woPriority,
        assigned_technician: woTech,
        estimated_hours: parseFloat(woHours),
        cost: Math.round(parseFloat(woCost) / 83.5)
      });
      setWoToast('✓ Maintenance Work Order created and dispatched successfully!');
      setShowCreateWO(false);
      await fetchDetail();
      setTimeout(() => setWoToast(''), 4000);
    } catch (err) {
      console.error('Failed to create work order:', err);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '40px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <RefreshCw size={18} className="spin-icon" />
        <span>Loading Machine {machineId} Digital Twin Telemetry...</span>
      </div>
    );
  }

  const { overview, live_telemetry, telemetry_history, production, health, predictive_maintenance, maintenance, active_alerts } = data;

  const crumbs = [
    { label: 'Machines', path: '/machines' },
    { label: 'Fleet & Telemetry', path: '/machines' },
    { label: `${overview.name} (${overview.model_code})`, path: `/machines/${machineId}` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Breadcrumb Navigation & Back Button */}
      <Breadcrumbs customCrumbs={crumbs} fallbackBackPath="/machines" />

      {/* Top Header Card */}
      <div style={{
        background: '#101F33',
        border: '1px solid #22344B',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: '#00B8FF15',
            border: '1px solid #00B8FF40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={24} color="#00B8FF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F1F5F9' }}>{overview.name}</h2>
              <span className="text-mono" style={{ fontSize: '0.75rem', background: '#182A44', color: '#00B8FF', border: '1px solid #22344B', padding: '2px 8px', borderRadius: '4px' }}>
                {overview.model_code}
              </span>
              <span className={`badge badge-${overview.status}`}>
                {overview.status.toUpperCase()}
              </span>
              <DemoTelemetryBadge />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              {overview.machine_type} | Operator: <strong style={{ color: '#F1F5F9' }}>{overview.current_operator} ({overview.operator_code})</strong>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowRCAModal(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#EF4444', borderColor: '#EF4444' }}
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
            onClick={handleSimulateAnomaly}
            disabled={simulating}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#F59E0B' }}
          >
            <AlertTriangle size={13} />
            <span>{simulating ? 'Simulating...' : 'Simulate Anomaly'}</span>
          </button>

          <button
            onClick={() => fetchDetail(true)}
            disabled={syncing}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title={`Last synced: ${lastSyncedAt.toLocaleTimeString()}`}
          >
            <RefreshCw size={13} className={syncing ? "spin-icon" : ""} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync / Anomaly Toasts */}
      {syncToast && (
        <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22C55E', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
          {syncToast}
        </div>
      )}

      {anomalyMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
          {anomalyMsg}
        </div>
      )}

      {woToast && (
        <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22C55E', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
          {woToast}
        </div>
      )}

      {/* 6 Tabs Navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #22344B', paddingBottom: '8px' }}>
        {[
          { id: 'overview', label: '1. Overview' },
          { id: 'live_data', label: '2. Live Telemetry' },
          { id: 'production', label: '3. Production' },
          { id: 'maintenance', label: '4. Maintenance' },
          { id: 'history', label: '5. History & Faults' },
          { id: 'specs', label: '6. Technical Specs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Current Operator</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px', color: '#F1F5F9' }}>{overview.current_operator}</div>
              <div style={{ fontSize: '0.72rem', color: '#00B8FF' }}>ID: {overview.operator_code} | {overview.shift}</div>
            </div>

            <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Active Work Order</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }} className="text-mono">{overview.current_job}</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{overview.product_name}</div>
            </div>

            <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Health Assessment</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, marginTop: '4px', color: health.health_score > 80 ? '#22C55E' : '#EF4444' }}>
                {health.health_score}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Rating: <strong style={{ color: '#F1F5F9' }}>{health.status_level}</strong></div>
            </div>

            <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '14px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Predictive Risk</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '4px', color: predictive_maintenance.risk_level === 'CRITICAL' ? '#EF4444' : predictive_maintenance.risk_level === 'HIGH' ? '#F59E0B' : '#22C55E' }}>
                {predictive_maintenance.risk_level}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Pattern: {predictive_maintenance.health_classification}</div>
            </div>
          </div>

          {/* Sub-System Diagnostics */}
          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '12px' }}>
              Sub-Component Diagnostic Health
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              <div style={{ background: '#07111F', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Temperature</span>
                <span className={`badge badge-${health.temp_health === 'Healthy' ? 'running' : 'fault'}`}>{health.temp_health}</span>
              </div>
              <div style={{ background: '#07111F', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Vibration</span>
                <span className={`badge badge-${health.vibration_health === 'Healthy' ? 'running' : 'fault'}`}>{health.vibration_health}</span>
              </div>
              <div style={{ background: '#07111F', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Motor Load</span>
                <span className={`badge badge-${health.motor_health === 'Healthy' ? 'running' : 'fault'}`}>{health.motor_health}</span>
              </div>
              <div style={{ background: '#07111F', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Spindle Bearings</span>
                <span className={`badge badge-${health.spindle_health === 'Healthy' ? 'running' : 'fault'}`}>{health.spindle_health}</span>
              </div>
              <div style={{ background: '#07111F', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Electrical Inverter</span>
                <span className={`badge badge-${health.electrical_health === 'Healthy' ? 'running' : 'fault'}`}>{health.electrical_health}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TELEMETRY */}
      {activeTab === 'live_data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>TEMPERATURE</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: live_telemetry.temperature > 65 ? '#EF4444' : '#F59E0B' }}>
                {live_telemetry.temperature}°C
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Limit: 75°C</div>
            </div>

            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>VIBRATION</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: live_telemetry.vibration > 3.0 ? '#EF4444' : '#00B8FF' }}>
                {live_telemetry.vibration} mm/s
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Limit: 4.5 mm/s</div>
            </div>

            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>MOTOR LOAD</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#A855F7' }}>
                {live_telemetry.motor_load}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Rated: 100%</div>
            </div>

            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>RPM SPEED</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22C55E' }}>
                {live_telemetry.rpm}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Max: 12,000 RPM</div>
            </div>

            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>POWER DRAW</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F1F5F9' }}>
                {live_telemetry.power_consumption} kW
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Tariff: ₹8.5/kWh</div>
            </div>

            <div style={{ background: '#101F33', padding: '12px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>SPINDLE LOAD</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F1F5F9' }}>
                {live_telemetry.spindle_load}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>Dynamic Cut</div>
            </div>
          </div>

          {/* Time Series Telemetry Chart */}
          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9' }}>Real-Time Sensor Telemetry Time-Series</span>
              <span style={{ fontSize: '0.72rem', color: '#22C55E' }}>Sampling: 500ms Stream Active</span>
            </div>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22344B" />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0B1626', border: '1px solid #22344B', borderRadius: '6px' }} />
                  <Area type="monotone" dataKey="temp" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.15)" name="Temp (°C)" />
                  <Area type="monotone" dataKey="motor_load" stroke="#A855F7" fill="rgba(168, 85, 247, 0.15)" name="Motor Load (%)" />
                  <Area type="monotone" dataKey="vibration" stroke="#00B8FF" fill="rgba(0, 184, 255, 0.15)" name="Vibration (mm/s)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION */}
      {activeTab === 'production' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>Job Progress: <strong>{production.completed_quantity} / {production.target_quantity} units</strong></span>
              <strong style={{ color: '#22C55E' }}>{production.completion_percentage}%</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#07111F', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${production.completion_percentage}%`, height: '100%', background: '#22C55E', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: '#101F33', padding: '14px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>REMAINING OUTPUT</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EF4444' }}>
                {production.remaining_quantity} Units
              </div>
            </div>
            <div style={{ background: '#101F33', padding: '14px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>PRODUCTION PACE</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00B8FF' }}>
                {production.production_rate_parts_hr} Parts/hr
              </div>
            </div>
            <div style={{ background: '#101F33', padding: '14px', borderRadius: '8px', border: '1px solid #22344B' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ESTIMATED COMPLETION</div>
              <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B' }}>
                {production.expected_completion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '14px 18px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>LAST SERVICE</div>
              <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{maintenance.last_maintenance}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>NEXT SCHEDULED</div>
              <div style={{ fontWeight: 700, color: '#F59E0B' }}>{maintenance.next_scheduled_maintenance}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>RUN HOURS REMAINING</div>
              <div style={{ fontWeight: 700, color: '#00B8FF' }}>{maintenance.maintenance_hours_remaining} hrs</div>
            </div>
            <button 
              onClick={() => setShowCreateWO(true)}
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <PlusCircle size={13} />
              <span>Create Work Order</span>
            </button>
          </div>

          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '12px' }}>Historical Maintenance Logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maintenance.logs.map((log, idx) => (
                <div key={idx} style={{ background: '#07111F', padding: '10px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #22344B' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F1F5F9' }}>{log.type} — <span style={{ color: '#94A3B8' }}>{log.date}</span></div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{log.description} (Tech: {log.performed_by})</div>
                  </div>
                  <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.85rem' }}>
                    ₹{Math.round(log.cost * 83.5).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HISTORY & FAULTS */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9' }}>Active Machine Alarms & Diagnostic Logs</h4>
              <button onClick={() => setShowRCAModal(true)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#EF4444', borderColor: '#EF4444' }}>
                Run 5-Why RCA
              </button>
            </div>
            {active_alerts.length === 0 ? (
              <div style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                No active alarm states registered. Telemetry operating within nominal parameters.
              </div>
            ) : (
              active_alerts.map(a => (
                <div key={a.id} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#EF4444', fontSize: '0.82rem' }}>
                    <span>{a.message}</span>
                    <span>{a.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#F1F5F9', marginTop: '4px' }}>
                    Recommended Action: {a.recommended_action}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TECHNICAL SPECS & DOCUMENTS */}
      {activeTab === 'specs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '12px' }}>Industrial Hardware Specifications & Firmware</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>Manufacturer:</span>
                <div style={{ fontWeight: 700, color: '#F1F5F9' }}>NexusProd Industrial Systems Inc.</div>
              </div>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>Spindle Max Rating:</span>
                <div style={{ fontWeight: 700, color: '#00B8FF' }}>12,000 RPM (Liquid Cooled)</div>
              </div>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>Max Power Draw:</span>
                <div style={{ fontWeight: 700, color: '#F59E0B' }}>25.0 kW (3-Phase 400V)</div>
              </div>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>Firmware Version:</span>
                <div style={{ fontWeight: 700, color: '#22C55E' }}>v4.18.2-PROD-RTOS</div>
              </div>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>IoT Gateway Sync:</span>
                <div style={{ fontWeight: 700, color: '#00B8FF' }}>MQTT + WebSocket 500ms Pulse</div>
              </div>
              <div style={{ background: '#07111F', padding: '10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                <span style={{ color: '#94A3B8' }}>Safety Compliance:</span>
                <div style={{ fontWeight: 700, color: '#22C55E' }}>ISO 13849-1 Cat 4 / PL e</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Work Order Form */}
      {showCreateWO && (
        <div style={{
          background: '#101F33',
          border: '1px solid #00B8FF',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={16} color="#00B8FF" />
            <span>Create Maintenance Work Order for {overview.name}</span>
          </h4>
          <form onSubmit={handleCreateWorkOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>TITLE</label>
              <input 
                type="text" 
                value={woTitle} 
                onChange={e => setWoTitle(e.target.value)} 
                style={{ width: '100%', background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
              <select 
                value={woPriority} 
                onChange={e => setWoPriority(e.target.value)}
                style={{ width: '100%', background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>ASSIGNED TECHNICIAN</label>
              <input 
                type="text" 
                value={woTech} 
                onChange={e => setWoTech(e.target.value)} 
                style={{ width: '100%', background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>ESTIMATED COST (₹ INR)</label>
              <input 
                type="number" 
                value={woCost} 
                onChange={e => setWoCost(e.target.value)} 
                style={{ width: '100%', background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
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

      {/* Root Cause Analysis 5-Why Modal */}
      {showRCAModal && (
        <RootCauseAnalysisModal
          machineId={parseInt(machineId)}
          onClose={() => setShowRCAModal(false)}
        />
      )}
    </div>
  );
}
