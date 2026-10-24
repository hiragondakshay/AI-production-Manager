import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, Clock, User, Activity, Filter, RefreshCw, FileText } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/enterprise/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--accent-cyan)" />
            <span>Enterprise Security & Action Audit Trail</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tamper-evident system event logging of user authentication, work orders, inventory changes, and schedule modifications
          </p>
        </div>

        <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: '400px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by user, action, module, or keyword..."
          style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        />
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events match your search query.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Timestamp</th>
                  <th style={{ padding: '10px 8px' }}>User</th>
                  <th style={{ padding: '10px 8px' }}>Role</th>
                  <th style={{ padding: '10px 8px' }}>Module</th>
                  <th style={{ padding: '10px 8px' }}>Action Executed</th>
                  <th style={{ padding: '10px 8px' }}>Details</th>
                  <th style={{ padding: '10px 8px' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 8px', fontSize: '0.78rem', color: 'var(--text-muted)' }} className="text-mono">{l.timestamp}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--accent-cyan)" />
                        <span>{l.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--accent-cyan)'
                      }}>
                        {l.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--accent-amber)' }}>{l.module}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>{l.action}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{l.details}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }} className="text-mono">{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
