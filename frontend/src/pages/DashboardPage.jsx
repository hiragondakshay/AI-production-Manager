import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL, getWebSocketUrl } from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import { 
  Activity, Zap, AlertTriangle, CheckCircle2, 
  RefreshCw, Flame, Gauge, Layers, Play, Check, Download, FileText, Wrench, Search, ArrowRight, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncToast, setSyncToast] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async (isManual = false) => {
    if (isManual) setSyncing(true);
    try {
      const [kpiRes, macRes, alertRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/machines'),
        api.get('/alerts')
      ]);
      setKpis(kpiRes.data);
      setMachines(macRes.data);
      setAlerts(alertRes.data);
      setLastSyncedAt(new Date());
      if (isManual) {
        setSyncToast('✓ Machine fleet telemetry synchronized.');
        setTimeout(() => setSyncToast(''), 3000);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Establish WebSocket Connection for Real-Time IoT Telemetry Stream
    const socket = new WebSocket(getWebSocketUrl('/ws/telemetry'));


    socket.onopen = () => {
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TELEMETRY_PULSE' && data.machines) {
          setMachines((prevMachines) =>
            prevMachines.map((m) => {
              const updated = data.machines.find((item) => item.id === m.id);
              return updated ? { ...m, ...updated } : m;
            })
          );
        }
      } catch (e) {
        console.error('Failed to parse WebSocket telemetry pulse:', e);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleSimulateTelemetry = async (e, machineId) => {
    e.stopPropagation();
    setUpdatingId(machineId);
    try {
      const temp = (45 + Math.random() * 32).toFixed(1);
      const vib = (1.0 + Math.random() * 4.0).toFixed(1);
      
      const res = await api.post(`/machines/${machineId}/telemetry?temp=${temp}&vibration=${vib}&add_hours=1.5`);
      const updatedMachine = res.data;

      setMachines((prev) =>
        prev.map((m) => (m.id === machineId ? { ...m, ...updatedMachine } : m))
      );

      fetchData();
    } catch (err) {
      console.error('Failed to trigger telemetry:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetHealth = async (e, machineId) => {
    e.stopPropagation();
    setUpdatingId(machineId);
    try {
      const res = await api.post(`/machines/${machineId}/reset-health`);
      const updatedMachine = res.data;

      setMachines((prev) =>
        prev.map((m) => (m.id === machineId ? { ...m, ...updatedMachine } : m))
      );
      fetchData();
    } catch (err) {
      console.error('Failed to reset machine health:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/resolve`);
      fetchData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${API_BASE_URL}/reports/shift-pdf`, '_blank');
  };

  const handleDownloadCSV = () => {
    window.open(`${API_BASE_URL}/reports/export-csv`, '_blank');
  };


  if (loading && !kpis) {
    return (
      <div style={{ padding: '40px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RefreshCw size={18} className="spin-icon" />
        <span>Loading manufacturing telemetry...</span>
      </div>
    );
  }

  const oeeBreakdownData = [
    { name: 'Availability', value: kpis?.availability_rate || 0, fill: '#00B8FF' },
    { name: 'Performance', value: kpis?.performance_rate || 0, fill: '#A855F7' },
    { name: 'Quality', value: kpis?.quality_rate || 0, fill: '#22C55E' },
  ];

  const filteredMachines = machines.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        m.model_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const crumbs = [
    { label: 'Machines', path: '/machines' },
    { label: 'Fleet & Telemetry', path: '/machines' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Breadcrumb Navigator */}
      <Breadcrumbs customCrumbs={crumbs} fallbackBackPath="/command-center" />

      {/* Top Banner & Export Controls */}
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
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#F1F5F9' }}>
            <span>Machine Fleet & IoT Telemetry</span>
            {wsConnected && (
              <span className="badge badge-running" style={{ fontSize: '0.68rem' }}>
                LIVE WS STREAM ACTIVE
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
            Real-time telemetry streams, component health scores, and individual machine digital twins
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={handleDownloadPDF} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.78rem', color: '#00B8FF', borderColor: '#00B8FF40' }}>
            <FileText size={14} color="#00B8FF" />
            <span>PDF Report</span>
          </button>

          <button onClick={handleDownloadCSV} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.78rem', color: '#22C55E', borderColor: '#22C55E40' }}>
            <Download size={14} color="#22C55E" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => fetchData(true)} 
            disabled={syncing}
            className="btn-primary" 
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            title={`Last synced: ${lastSyncedAt.toLocaleTimeString()}`}
          >
            <RefreshCw size={14} className={syncing ? 'spin-icon' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {syncToast && (
        <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22C55E', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
          {syncToast}
        </div>
      )}

      {/* KPI Cards (4 metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {/* KPI 1: Production Output */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Total Output</span>
            <Layers size={18} color="#00B8FF" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: '#F1F5F9' }} className="text-mono">
            {kpis?.total_output.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>pcs</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>
            +8.4% vs previous shift
          </div>
        </div>

        {/* KPI 2: Overall OEE */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Overall OEE Score</span>
            <Gauge size={18} color="#A855F7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: '#F1F5F9' }} className="text-mono">
            {kpis?.overall_oee}%
          </div>
          <div style={{ fontSize: '0.72rem', color: kpis?.overall_oee > 80 ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>
            {kpis?.overall_oee > 85 ? 'World Class Target (>85%)' : 'Good Operational Range'}
          </div>
        </div>

        {/* KPI 3: Fleet Uptime */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Fleet Uptime</span>
            <Zap size={18} color="#22C55E" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: '#F1F5F9' }} className="text-mono">
            {kpis?.uptime_percentage}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {kpis?.active_machines_count} of {kpis?.total_machines_count} machines running
          </div>
        </div>

        {/* KPI 4: Active Alerts */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Active Alerts</span>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: '#F1F5F9' }} className="text-mono">
            {kpis?.critical_alerts_count}
          </div>
          <div style={{ fontSize: '0.72rem', color: kpis?.critical_alerts_count > 0 ? '#EF4444' : '#94A3B8', fontWeight: 600 }}>
            {kpis?.critical_alerts_count > 0 ? 'Requires attention' : 'All systems clear'}
          </div>
        </div>
      </div>

      {/* Middle Row: OEE Component Breakdown & Live Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Chart: OEE Component Factors */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '18px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '2px' }}>OEE Performance Components</h3>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '12px' }}>Availability x Performance x Quality factors</p>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={oeeBreakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22344B" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#F1F5F9" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value) => [`${value}%`, 'Factor']} contentStyle={{ background: '#0B1626', border: '1px solid #22344B', borderRadius: '6px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Alerts Panel */}
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F1F5F9' }}>Real-Time Anomaly Alerts</h3>
            <span className="badge badge-info">{alerts.length} Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
            {alerts.length === 0 ? (
              <div style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                No active anomalies detected.
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} style={{
                  background: a.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${a.severity === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={15} color={a.severity === 'critical' ? '#EF4444' : '#F59E0B'} />
                    <span style={{ fontSize: '0.75rem', color: '#F1F5F9' }}>{a.message}</span>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(a.id)}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                  >
                    <Check size={12} />
                    <span>Resolve</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        background: '#101F33',
        border: '1px solid #22344B',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: '#07111F', border: '1px solid #22344B', padding: '6px 12px', borderRadius: '6px' }}>
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search machines by name, model code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#F1F5F9', outline: 'none', width: '100%', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94A3B8" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="warning">Warning</option>
            <option value="fault">Fault / Critical</option>
          </select>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
          Showing {filteredMachines.length} of {machines.length} machines
        </span>
      </div>

      {/* Machine Fleet Grid */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {filteredMachines.map((m) => {
            const statusClass = `badge-${m.status}`;
            return (
              <div 
                key={m.id} 
                style={{ 
                  background: '#101F33', 
                  border: '1px solid #22344B', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, transform 0.15s ease'
                }}
                onClick={() => navigate(`/machines/${m.id}`)}
                className="glass-panel-interactive"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>{m.name}</h4>
                    <div style={{ fontSize: '0.72rem', color: '#00B8FF' }} className="text-mono">{m.model_code}</div>
                  </div>
                  <span className={`badge ${statusClass}`}>{m.status}</span>
                </div>

                {/* Health Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94A3B8' }}>Health Score:</span>
                    <span style={{ fontWeight: 700, color: m.health_score > 80 ? '#22C55E' : m.health_score > 50 ? '#F59E0B' : '#EF4444' }}>
                      {m.health_score}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#07111F', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${m.health_score}%`,
                      height: '100%',
                      background: m.health_score > 80 ? '#22C55E' : m.health_score > 50 ? '#F59E0B' : '#EF4444',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#07111F', padding: '8px 10px', borderRadius: '6px', border: '1px solid #22344B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Flame size={13} color="#F59E0B" />
                    <span style={{ color: '#94A3B8' }}>Temp:</span>
                    <span className="text-mono" style={{ fontWeight: 600, color: '#F1F5F9' }}>{m.temperature}°C</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Activity size={13} color="#00B8FF" />
                    <span style={{ color: '#94A3B8' }}>Vib:</span>
                    <span className="text-mono" style={{ fontWeight: 600, color: '#F1F5F9' }}>{m.vibration}mm/s</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  <button
                    onClick={(e) => handleSimulateTelemetry(e, m.id)}
                    disabled={updatingId === m.id}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '6px' }}
                  >
                    <Play size={12} color="#00B8FF" />
                    <span>{updatingId === m.id ? 'Pulsing...' : 'Simulate Pulse'}</span>
                  </button>

                  <button
                    onClick={(e) => handleResetHealth(e, m.id)}
                    disabled={updatingId === m.id}
                    className="btn-secondary"
                    style={{ justifyContent: 'center', padding: '6px 8px', color: '#22C55E' }}
                    title="Reset Status & Health to 98%"
                  >
                    <Wrench size={13} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/machines/${m.id}`);
                    }}
                    className="btn-primary"
                    style={{ justifyContent: 'center', padding: '6px 10px', fontSize: '0.72rem' }}
                    title="Open Full Machine Workspace"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
