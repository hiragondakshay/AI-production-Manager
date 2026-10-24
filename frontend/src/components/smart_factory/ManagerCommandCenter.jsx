import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import { 
  Activity, Cpu, Zap, AlertTriangle, Users, 
  Layers, CheckCircle2, RefreshCw, Wrench, ShieldAlert, 
  Scan, Gauge, TrendingUp, Clock, AlertOctagon, FileText, Check, Filter, ChevronRight, Timer
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import DemoTelemetryBadge from './DemoTelemetryBadge';
import MachineFleetMap from './MachineFleetMap';
import MachineDetailsModal from './MachineDetailsModal';
import MachineDigitalTwin from './MachineDigitalTwin';
import MachineComparison from './MachineComparison';
import EmployeeCheckInModal from './EmployeeCheckInModal';
import RootCauseAnalysisModal from '../enterprise/RootCauseAnalysisModal';

export default function ManagerCommandCenter() {
  const { activeShift, nextShift, countdownFormatted, isTransitioning, refreshShiftStatus } = useShift();
  const [data, setData] = useState(null);
  const [oeeData, setOeeData] = useState(null);
  const [downtimeData, setDowntimeData] = useState(null);
  const [workOrdersData, setWorkOrdersData] = useState([]);
  const [energyData, setEnergyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [selectedRcaMachineId, setSelectedRcaMachineId] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeView, setActiveView] = useState('fleet'); // 'fleet', 'twin', 'compare'

  // Top Filter States
  const [selectedSite, setSelectedSite] = useState('Plant Alpha (Bengaluru)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAllData = async (isManualSync = false) => {
    if (isManualSync) {
      setSyncing(true);
      setSyncMsg('');
    }
    try {
      const [ccRes, oeeRes, dtRes, woRes, energyRes] = await Promise.all([
        api.get('/smart-factory/command-center'),
        api.get('/enterprise/oee/analytics').catch(() => ({ data: null })),
        api.get('/enterprise/downtime/analytics').catch(() => ({ data: null })),
        api.get('/enterprise/work-orders').catch(() => ({ data: [] })),
        api.get('/enterprise/energy/monitoring').catch(() => ({ data: null }))
      ]);

      setData(ccRes.data);
      if (oeeRes.data) setOeeData(oeeRes.data);
      if (dtRes.data) setDowntimeData(dtRes.data);
      if (woRes.data) setWorkOrdersData(woRes.data);
      if (energyRes.data) setEnergyData(energyRes.data);

      if (isManualSync) {
        setSyncMsg('✓ Fleet Telemetry & Workstation Sync Complete (Database State Refreshed)');
        setTimeout(() => setSyncMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to load Manager Command Center:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(false), 3000); // 3s live polling
    return () => clearInterval(interval);
  }, []);

  // When shift transition occurs, automatically refresh backend data
  useEffect(() => {
    if (isTransitioning) {
      fetchAllData(false);
    }
  }, [isTransitioning]);

  if (loading && !data) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <RefreshCw size={18} className="spin-icon" />
        <span>Initializing NEXUSPROD AI Manager Command Center...</span>
      </div>
    );
  }

  const { kpis, fleet, active_alerts_count } = data;
  const selectedMachineObj = fleet.find(m => m.id === selectedMachineId) || fleet[0];

  // Calculated High-Level Totals
  const totalTargetQty = fleet.reduce((acc, m) => acc + (m.target_quantity || 500), 0);
  const totalCompletedQty = fleet.reduce((acc, m) => acc + (m.completed_quantity || 320), 0);
  const completionPct = Math.round((totalCompletedQty / Math.max(1, totalTargetQty)) * 100);
  const plantOEE = oeeData?.plant_kpis?.overall_oee || 84.8;
  const openWorkOrdersCount = workOrdersData.filter(w => w.status === 'pending' || w.status === 'in_progress').length;
  const shiftDowntimeHours = downtimeData?.summary?.total_downtime_hours || 1.8;
  const shiftCostLoss = downtimeData?.summary?.total_cost_loss_usd ? Math.round(downtimeData.summary.total_cost_loss_usd * 83.5) : 14200;
  const shiftEnergyKwh = energyData?.factory_energy_kpis?.total_shift_consumption_kwh || 124.5;
  const shiftEnergyCost = Math.round(shiftEnergyKwh * 8.5); // ₹8.50 per kWh tariff

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner with Site & Automatic Shift Information */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
              Command Center Dashboard
            </h2>
            <span style={{ fontSize: '0.72rem', background: '#1E293B', border: '1px solid #293548', color: '#38BDF8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {selectedSite}
            </span>
            <DemoTelemetryBadge />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Live shop-floor telemetry, machine states, active work orders, and automatic shift management
          </p>
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Site Selector */}
          <select 
            value={selectedSite} 
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="Plant Alpha (Bengaluru)">Plant Alpha (Bengaluru)</option>
            <option value="Plant Beta (Chennai)">Plant Beta (Chennai)</option>
            <option value="Plant Gamma (Pune)">Plant Gamma (Pune)</option>
          </select>

          {/* Workstation Check-in Button */}
          <button
            onClick={() => setShowCheckInModal(true)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Scan size={14} />
            <span>Workstation Check-In</span>
          </button>

          {/* Sync Button */}
          <button 
            onClick={() => fetchAllData(true)} 
            disabled={syncing}
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} className={syncing ? "spin-icon" : ""} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Live Shift Transition Alert Banner */}
      {isTransitioning && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #F59E0B',
          color: '#F59E0B',
          padding: '10px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          <Timer size={18} className="spin-icon" />
          <span>⚡ Shift boundary reached: Transitioning to {activeShift.name}. Auto-refreshing production metrics.</span>
        </div>
      )}

      {/* Sync Success Notification Toast */}
      {syncMsg && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22C55E',
          padding: '10px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* DEDICATED CURRENT SHIFT CARD BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, #172033 0%, #1E293B 100%)',
        border: '1px solid #293548',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr',
        gap: '16px',
        alignItems: 'center'
      }}>
        {/* Active Shift Column */}
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENT ACTIVE SHIFT
            </span>
            <div className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: activeShift.color || '#38BDF8' }}></div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: activeShift.color || '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeShift.name}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Schedule: <strong>{activeShift.formatted_range}</strong>
          </div>
        </div>

        {/* Live Countdown Column */}
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Timer size={12} color="#F59E0B" />
            <span>COUNTDOWN TO NEXT SHIFT</span>
          </div>
          <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
            {countdownFormatted}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '2px' }}>
            Next: <strong>{nextShift.name}</strong> ({nextShift.start_time})
          </div>
        </div>

        {/* Shift Progress Column */}
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            <span>Shift Elapsed</span>
            <span style={{ color: '#F8FAFC' }}>{activeShift.progress_percentage || 50}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#0B1220', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${activeShift.progress_percentage || 50}%`, height: '100%', background: activeShift.color || '#38BDF8', borderRadius: '3px', transition: 'width 1s linear' }}></div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Automatic switch at {activeShift.end_time}
          </div>
        </div>

        {/* Factory Timezone & Status */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            FACTORY TIMEZONE
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>
            Asia/Kolkata (IST +05:30)
          </div>
          <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600, marginTop: '2px' }}>
            ✓ Auto-Scheduler Synchronized
          </div>
        </div>
      </div>

      {/* Compact 8-Metric Production KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {/* KPI 1: Fleet Running Status */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fleet Active</span>
            <Activity size={16} color="#22C55E" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#F8FAFC' }} className="text-mono">
            {kpis.running_machines} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {kpis.total_machines} Online</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>
            {kpis.idle_machines} Idle | {kpis.maintenance_machines} Maintenance
          </div>
        </div>

        {/* KPI 2: At-Risk / Faults */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Machines At Risk</span>
            <AlertTriangle size={16} color={kpis.fault_machines > 0 ? '#EF4444' : '#F59E0B'} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: kpis.fault_machines > 0 ? '#EF4444' : '#F59E0B' }} className="text-mono">
            {kpis.at_risk_machines} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>At Risk</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {kpis.fault_machines} Critical breakdown alerts
          </div>
        </div>

        {/* KPI 3: Target vs Actual Output */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Output</span>
            <TrendingUp size={16} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#38BDF8' }} className="text-mono">
            {totalCompletedQty.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {totalTargetQty.toLocaleString()} ({completionPct}%)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {activeShift.name} output pace nominal
          </div>
        </div>

        {/* KPI 4: Plant OEE */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall OEE</span>
            <Gauge size={16} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: plantOEE >= 85 ? '#22C55E' : '#38BDF8' }} className="text-mono">
            {plantOEE}% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Target: 85%)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>
            Avail: {oeeData?.plant_kpis?.availability || 94.2}% | Perf: {oeeData?.plant_kpis?.performance || 91.5}%
          </div>
        </div>

        {/* KPI 5: Open Work Orders */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Work Orders</span>
            <Wrench size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#F8FAFC' }} className="text-mono">
            {openWorkOrdersCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Tasks</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {workOrdersData.length} Total maintenance records
          </div>
        </div>

        {/* KPI 6: Quality / Defect Rate */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Rate</span>
            <CheckCircle2 size={16} color="#22C55E" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#22C55E' }} className="text-mono">
            98.4% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>First Pass</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            1.6% Defect rate across CNC lines
          </div>
        </div>

        {/* KPI 7: Shift Downtime & Financial Loss */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Downtime</span>
            <AlertOctagon size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#EF4444' }} className="text-mono">
            {shiftDowntimeHours} hrs <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(₹{shiftCostLoss.toLocaleString('en-IN')})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            MTTR: {downtimeData?.summary?.mttr_minutes || 42} min | MTBF: 124 hrs
          </div>
        </div>

        {/* KPI 8: Shift Energy Draw */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Energy Draw</span>
            <Zap size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: '#F8FAFC' }} className="text-mono">
            {shiftEnergyKwh} kWh <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(₹{shiftEnergyCost.toLocaleString('en-IN')})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>
            Tariff: ₹8.50/kWh | Class A Efficiency
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          className={activeView === 'fleet' ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveView('fleet')}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          Factory Floor Map & Fleet Grid
        </button>
        <button
          className={activeView === 'twin' ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveView('twin')}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          Digital Twin Real-Time Gauges
        </button>
        <button
          className={activeView === 'compare' ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveView('compare')}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          Multi-Machine Analytics Compare
        </button>
      </div>

      {/* Main Dynamic View Area */}
      {activeView === 'fleet' && (
        <MachineFleetMap
          fleet={fleet}
          onSelectMachine={(id) => setSelectedMachineId(id)}
        />
      )}

      {activeView === 'twin' && (
        <MachineDigitalTwin machineId={selectedMachineId || 1} />
      )}

      {activeView === 'compare' && (
        <MachineComparison />
      )}

      {/* Lower Dashboard Section: Priority Alerts, Production Trends & Recent Work Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Priority Alerts Feed */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="#EF4444" />
              <span>Priority Alerts & Diagnostic Actions</span>
            </h3>
            <span className="badge badge-critical">{active_alerts_count} Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {fleet.filter(m => m.status === 'warning' || m.status === 'breakdown' || m.health_score < 75).map(m => (
              <div key={m.id} style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F8FAFC' }}>
                    {m.name} ({m.model_code})
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                    <button
                      onClick={() => setSelectedRcaMachineId(m.id)}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.7rem', color: '#EF4444', borderColor: '#EF4444' }}
                    >
                      RCA 5-Why
                    </button>
                    <button
                      onClick={() => setSelectedMachineId(m.id)}
                      className="btn-primary"
                      style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                    >
                      View
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Sensor Telemetry: Temp <strong>{m.temperature}°C</strong> | Vibration <strong>{m.vibration} mm/s</strong> | Health: <strong>{m.health_score}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Maintenance Work Orders */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={16} color="#38BDF8" />
              <span>Recent Maintenance Dispatches ({activeShift.name})</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Shift Overview</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {workOrdersData.slice(0, 4).map(wo => (
              <div key={wo.id} style={{ background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#F8FAFC' }}>
                    {wo.work_order_code}: {wo.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {wo.machine_name} | Assigned: <strong>{wo.assigned_technician}</strong> | Est: {wo.estimated_hours}h
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${wo.status === 'completed' ? 'running' : wo.status === 'in_progress' ? 'idle' : 'warning'}`}>
                    {wo.status}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600, marginTop: '2px' }}>
                    ₹{Math.round(wo.cost * 83.5).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Machine Details Modal for CNC Alpha / Selected Machine */}
      {selectedMachineId && (
        <MachineDetailsModal
          machineId={selectedMachineId}
          onClose={() => setSelectedMachineId(null)}
        />
      )}

      {/* Workstation Employee Check-In Modal */}
      {showCheckInModal && (
        <EmployeeCheckInModal
          machine={selectedMachineObj}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => fetchAllData(true)}
        />
      )}

      {/* Root Cause Analysis 5-Why Modal */}
      {selectedRcaMachineId && (
        <RootCauseAnalysisModal
          machineId={selectedRcaMachineId}
          onClose={() => setSelectedRcaMachineId(null)}
        />
      )}
    </div>
  );
}
