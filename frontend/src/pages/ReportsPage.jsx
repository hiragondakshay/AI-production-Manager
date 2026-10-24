import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';

import Breadcrumbs from '../components/Breadcrumbs';
import { 
  FileText, Download, RefreshCw, Search, 
  Calendar, Layers, AlertOctagon, CheckCircle2, Filter
} from 'lucide-react';

export default function ReportsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [syncToast, setSyncToast] = useState('');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState('ALL');

  const fetchReports = async (isManual = false) => {
    if (isManual) setSyncing(true);
    try {
      const res = await api.get('/reports/logs');
      setLogs(res.data || []);
      setLastSyncedAt(new Date());
      if (isManual) {
        setSyncToast('✓ Shift logs successfully refreshed from plant database.');
        setTimeout(() => setSyncToast(''), 3000);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadPDF = () => {
    window.open(`${API_BASE_URL}/reports/shift-pdf`, '_blank');
  };

  const handleDownloadCSV = () => {
    window.open(`${API_BASE_URL}/reports/export-csv`, '_blank');
  };


  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.downtime_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.machine_id?.toString().includes(searchTerm) ||
      log.order_id?.toString().includes(searchTerm);
    const matchShift = selectedShift === 'ALL' || log.shift?.toLowerCase() === selectedShift.toLowerCase();
    return matchSearch && matchShift;
  });

  // Calculate Metrics
  const totalProduced = filteredLogs.reduce((sum, l) => sum + (l.units_produced || 0), 0);
  const totalDefects = filteredLogs.reduce((sum, l) => sum + (l.defective_units || 0), 0);
  const totalDowntime = filteredLogs.reduce((sum, l) => sum + (l.downtime_minutes || 0), 0);
  const yieldPct = totalProduced > 0 ? (((totalProduced - totalDefects) / totalProduced) * 100).toFixed(1) : '100.0';

  const crumbs = [
    { label: 'Reports', path: '/reports' },
    { label: 'Shift Logs & Reports', path: '/reports' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs customCrumbs={crumbs} fallbackBackPath="/command-center" />

      {/* Header Banner */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'rgba(0, 184, 255, 0.12)',
            border: '1px solid rgba(0, 184, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={22} color="#00B8FF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9' }}>
              Shift Logs & Executive Reporting
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Export formal PDF shift audits, CSV raw logs, and historical work station telemetry
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadPDF}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.78rem', color: '#00B8FF', borderColor: '#00B8FF40' }}
          >
            <FileText size={15} color="#00B8FF" />
            <span>PDF Executive Report</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.78rem', color: '#22C55E', borderColor: '#22C55E40' }}
          >
            <Download size={15} color="#22C55E" />
            <span>Export CSV Logs</span>
          </button>

          <button
            onClick={() => fetchReports(true)}
            disabled={syncing}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.78rem' }}
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

      {/* Metric Cards (4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Filtered Output</span>
            <Layers size={18} color="#00B8FF" />
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F1F5F9', marginTop: '6px' }}>
            {totalProduced.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>pcs</span>
          </div>
        </div>

        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Quality Yield</span>
            <CheckCircle2 size={18} color="#22C55E" />
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22C55E', marginTop: '6px' }}>
            {yieldPct}%
          </div>
        </div>

        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Defective Units</span>
            <AlertOctagon size={18} color="#EF4444" />
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: totalDefects > 0 ? '#EF4444' : '#22C55E', marginTop: '6px' }}>
            {totalDefects.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>pcs</span>
          </div>
        </div>

        <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Total Downtime</span>
            <AlertOctagon size={18} color="#F59E0B" />
          </div>
          <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            {totalDowntime.toFixed(0)} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>mins</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search by reason, machine ID, order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#F1F5F9', outline: 'none', width: '100%', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94A3B8" />
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            style={{ background: '#07111F', border: '1px solid #22344B', color: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Shifts</option>
            <option value="Morning">Morning Shift (06:00 - 14:00)</option>
            <option value="Evening">Evening Shift (14:00 - 22:00)</option>
            <option value="Night">Night Shift (22:00 - 06:00)</option>
          </select>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
          Showing {filteredLogs.length} of {logs.length} records
        </span>
      </div>

      {/* Shift Logs Table */}
      <div style={{ background: '#101F33', border: '1px solid #22344B', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0B1626', borderBottom: '1px solid #22344B', color: '#94A3B8', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              <th style={{ padding: '12px 16px' }}>Log ID</th>
              <th style={{ padding: '12px 16px' }}>Machine</th>
              <th style={{ padding: '12px 16px' }}>Order ID</th>
              <th style={{ padding: '12px 16px' }}>Shift</th>
              <th style={{ padding: '12px 16px' }}>Produced</th>
              <th style={{ padding: '12px 16px' }}>Defects</th>
              <th style={{ padding: '12px 16px' }}>Downtime</th>
              <th style={{ padding: '12px 16px' }}>Reason / Notes</th>
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  <RefreshCw size={18} className="spin-icon" style={{ display: 'inline', marginRight: '8px' }} />
                  Loading shift production audit records...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  No shift records match the specified filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #182A44', transition: 'background 0.1s' }} className="table-row-hover">
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#00B8FF' }} className="text-mono">
                    #{log.id}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#F1F5F9' }}>
                    Machine #{log.machine_id}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94A3B8' }} className="text-mono">
                    {log.order_id ? `#ORD-${log.order_id}` : 'Manual Run'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      {log.shift}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#22C55E' }} className="text-mono">
                    {log.units_produced} pcs
                  </td>
                  <td style={{ padding: '12px 16px', color: log.defective_units > 0 ? '#EF4444' : '#94A3B8' }} className="text-mono">
                    {log.defective_units}
                  </td>
                  <td style={{ padding: '12px 16px', color: log.downtime_minutes > 0 ? '#F59E0B' : '#94A3B8' }} className="text-mono">
                    {log.downtime_minutes}m
                  </td>
                  <td style={{ padding: '12px 16px', color: '#F1F5F9' }}>
                    {log.downtime_reason}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.75rem' }} className="text-mono">
                    {log.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
