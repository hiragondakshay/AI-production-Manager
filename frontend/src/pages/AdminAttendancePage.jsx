import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Scan, Clock, Cpu, CheckCircle2, 
  AlertTriangle, RefreshCw, UserCheck, Activity, Award
} from 'lucide-react';
import FaceScannerModal from '../components/FaceScannerModal';

export default function AdminAttendancePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [clockStatus, setClockStatus] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/attendance/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employee work tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleStartScan = (emp) => {
    setSelectedEmp(emp);
    setShowScanModal(true);
    setClockStatus(null);
  };

  const handleScanSuccess = (resData) => {
    setShowScanModal(false);
    setClockStatus(resData);
    fetchEmployees();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="var(--accent-cyan)" />
            <span>Admin Biometric Attendance & Employee Machine Work Tracker</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Biometric face-scanning attendance studio and operator machine duration log tracking
          </p>
        </div>

        <button onClick={fetchEmployees} className="btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Operator Logs</span>
        </button>
      </div>

      {/* Biometric Scan Success Notification Banner */}
      {clockStatus && (
        <div className="glass-panel" style={{ padding: '16px 20px', borderColor: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                BIOMETRIC ATTENDANCE VERIFIED — {clockStatus.action}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Employee: <strong>{clockStatus.employee_name} ({clockStatus.employee_code})</strong> | Assigned Machine: <strong>{clockStatus.assigned_machine}</strong>
              </div>
            </div>
          </div>
          <span className="text-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{clockStatus.timestamp}</span>
        </div>
      )}

      {/* Face Scanner Modal */}
      {showScanModal && selectedEmp && (
        <FaceScannerModal
          username={selectedEmp.name}
          onClose={() => setShowScanModal(false)}
          onSuccess={handleScanSuccess}
        />
      )}

      {/* Operator Machine Assignment & Duration Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--accent-amber)" />
          <span>Operator Machine Allocation & Total Work Duration Tracker</span>
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading operator database...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Operator Name & Code</th>
                <th>Department & Title</th>
                <th>Assigned Machine</th>
                <th>Machine Status</th>
                <th>Total Work Hours</th>
                <th>Shift Output</th>
                <th>Attendance</th>
                <th>Admin Biometric Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const isClockedIn = emp.attendance_status === 'clocked_in';
                return (
                  <tr key={emp.employee_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{emp.name}</div>
                      <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{emp.employee_code}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{emp.role_title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={15} color="var(--accent-purple)" />
                        <span>{emp.assigned_machine_name}</span>
                      </div>
                      <div className="text-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.assigned_machine_model}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${emp.machine_status}`}>
                        {emp.machine_status}
                      </span>
                    </td>
                    <td className="text-mono" style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.95rem' }}>
                      {emp.total_hours_worked} hrs
                    </td>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {emp.total_units_produced.toLocaleString()} pcs
                    </td>
                    <td>
                      <span className={`badge badge-${isClockedIn ? 'running' : 'idle'}`}>
                        {isClockedIn ? 'CLOCKED IN' : 'PRESENT'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStartScan(emp)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <Scan size={14} />
                        <span>Scan Face Attendance</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
