import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Check, X } from 'lucide-react';

export default function RoleManagementPage() {
  const { user } = useAuth();

  const permissionsMatrix = [
    { module: 'Dashboard & Live Telemetry', admin: true, manager: true, supervisor: true },
    { module: 'Trigger AI Job Scheduler', admin: true, manager: true, supervisor: false },
    { module: 'Time-Series Demand Forecasting', admin: true, manager: true, supervisor: true },
    { module: 'Predictive Maintenance Telemetry', admin: true, manager: true, supervisor: true },
    { module: 'Raw Material Reorders', admin: true, manager: true, supervisor: false },
    { module: 'Quality Defect Inspection', admin: true, manager: true, supervisor: true },
    { module: 'User Role & System Configuration', admin: true, manager: false, supervisor: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="var(--accent-cyan)" />
          <span>Role-Based Access Control (RBAC) & Permissions Matrix</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          System authorization roles ensuring secure operational boundaries across factory positions
        </p>
      </div>

      {/* Active User Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Currently Signed In As</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{user?.username} ({user?.email})</div>
        </div>
        <div className="badge badge-info" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Active Role: {user?.role?.toUpperCase()}
        </div>
      </div>

      {/* Permissions Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Module Capability Matrix</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>System Module / Capability</th>
              <th>Admin Role</th>
              <th>Plant Manager Role</th>
              <th>Floor Supervisor Role</th>
            </tr>
          </thead>
          <tbody>
            {permissionsMatrix.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{item.module}</td>
                <td>{item.admin ? <Check size={18} color="var(--accent-emerald)" /> : <X size={18} color="var(--accent-rose)" />}</td>
                <td>{item.manager ? <Check size={18} color="var(--accent-emerald)" /> : <X size={18} color="var(--accent-rose)" />}</td>
                <td>{item.supervisor ? <Check size={18} color="var(--accent-emerald)" /> : <X size={18} color="var(--accent-rose)" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
