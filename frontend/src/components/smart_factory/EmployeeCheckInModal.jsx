import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import { X, Camera, Scan, CheckCircle2, UserCheck, Cpu, Play, Clock, Timer } from 'lucide-react';

export default function EmployeeCheckInModal({ machine, onClose, onSuccess }) {
  const { activeShift, countdownFormatted } = useShift();
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('1');
  const [selectedOrderId, setSelectedOrderId] = useState('1');
  const [operation, setOperation] = useState('CNC Milling & High Precision Contouring');
  const [simulated, setSimulated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [error, setError] = useState('');

  const targetMachine = machine || { id: 1, name: 'CNC Alpha', model_code: 'CNC-001' };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, ordRes] = await Promise.all([
          api.get('/attendance/employees'),
          api.get('/orders')
        ]);
        setEmployees(empRes.data);
        if (empRes.data.length > 0) {
          setSelectedEmpId(String(empRes.data[0].employee_id || empRes.data[0].id || 1));
        }
        setOrders(ordRes.data);
        if (ordRes.data.length > 0) {
          setSelectedOrderId(String(ordRes.data[0].id || 1));
        }
      } catch (err) {
        console.error('Failed to load checkin dropdown options:', err);
      }
    };
    loadData();
  }, []);

  const selectedEmployeeObj = employees.find(e => String(e.employee_id || e.id) === selectedEmpId) || employees[0];

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('employee_id', selectedEmpId || '1');
      params.append('machine_id', String(targetMachine.id || '1'));
      if (selectedOrderId) params.append('order_id', selectedOrderId);
      params.append('operation', operation);
      params.append('shift', activeShift.name);
      params.append('simulated', String(simulated));

      const res = await api.post('/smart-factory/check-in', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setCheckInResult(res.data.checkin_details);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Check-In error:', err);
      setError(err.response?.data?.detail || 'Workstation Check-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 18, 32, 0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        maxWidth: '580px',
        width: '100%',
        padding: '24px',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scan size={20} color="#38BDF8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>Workstation Check-In & Identity Verification</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Active Shift Context Banner */}
        <div style={{
          background: 'linear-gradient(90deg, #172033 0%, #1E293B 100%)',
          border: '1px solid #293548',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              <Clock size={12} color="#38BDF8" />
              <span>LIVE FACTORY SHIFT</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: activeShift.color || '#38BDF8' }}>
              {activeShift.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>({activeShift.formatted_range})</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>NEXT SHIFT IN</div>
            <div className="text-mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC' }}>
              {countdownFormatted}
            </div>
          </div>
        </div>

        {checkInResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} color="#22C55E" />
              <div>
                <div style={{ fontWeight: 800, color: '#22C55E', fontSize: '0.88rem' }}>CHECK-IN VERIFIED SUCCESSFUL</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator successfully registered to workstation session.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#1E293B', padding: '14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Employee:</span> <strong style={{ color: '#F8FAFC' }}>{checkInResult.employee_name} ({checkInResult.employee_id})</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Machine:</span> <strong style={{ color: '#38BDF8' }}>{checkInResult.machine_name} ({checkInResult.machine_id})</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Current Job:</span> <strong className="text-mono" style={{ color: '#F59E0B' }}>{checkInResult.current_work_order}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Assigned Operation:</span> <strong style={{ color: '#F8FAFC' }}>{checkInResult.assigned_operation}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Target Quantity:</span> <strong className="text-mono">{checkInResult.target_quantity} units</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Completed Quantity:</span> <strong className="text-mono" style={{ color: '#22C55E' }}>{checkInResult.completed_quantity} units</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Remaining Quantity:</span> <strong className="text-mono" style={{ color: '#EF4444' }}>{checkInResult.remaining_quantity} units</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Session Shift:</span> <strong style={{ color: activeShift.color || '#38BDF8' }}>{checkInResult.shift}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Start Time:</span> <strong className="text-mono">{checkInResult.start_time}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Expected Completion:</span> <strong className="text-mono" style={{ color: '#A855F7' }}>{checkInResult.expected_completion}</strong></div>
            </div>

            <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
              <span>Done & Return to Fleet Map</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 12px', background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.78rem' }}>
              Target Machine: <strong style={{ color: '#38BDF8' }}>{targetMachine.name} ({targetMachine.model_code})</strong>
            </div>

            {/* Simulated vs Camera Toggle */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={simulated ? "btn-primary" : "btn-secondary"}
                onClick={() => setSimulated(true)}
                style={{ flex: 1, padding: '7px', fontSize: '0.78rem' }}
              >
                Simulated Face ID Check-In
              </button>
              <button
                type="button"
                className={!simulated ? "btn-primary" : "btn-secondary"}
                onClick={() => setSimulated(false)}
                style={{ flex: 1, padding: '7px', fontSize: '0.78rem' }}
              >
                WebCam Biometric Scan
              </button>
            </div>

            {/* Select Employee */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>SELECT EMPLOYEE OPERATOR</label>
                {selectedEmployeeObj && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Assigned: <strong style={{ color: '#38BDF8' }}>{selectedEmployeeObj.assigned_shift || 'Morning Shift'}</strong>
                  </span>
                )}
              </div>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem' }}
              >
                {employees.map(e => (
                  <option key={e.employee_id || e.id} value={e.employee_id || e.id}>
                    {e.name} ({e.employee_code}) - {e.role_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Production Order */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>ASSIGN PRODUCTION ORDER</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem' }}
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} - {o.product_name} ({o.quantity} units)
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Operation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>ASSIGNED OPERATION</label>
              <input
                type="text"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: '#1E293B', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#F8FAFC', fontSize: '0.8rem' }}
              />
            </div>

            {error && (
              <div style={{ color: '#EF4444', fontSize: '0.78rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '0.85rem' }}>
              <Scan size={15} />
              <span>{loading ? 'Verifying Identity & Clocking In...' : `Check In to ${activeShift.name}`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
