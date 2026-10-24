import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Wrench, ShieldAlert, AlertTriangle, CheckCircle2, Flame, 
  Activity, Clock, ArrowLeft, RefreshCw, Cpu, Layers, PlusCircle, ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, 
  YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar 
} from 'recharts';

export default function MaintenancePage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [creatingWO, setCreatingWO] = useState(false);
  const [woSuccessMsg, setWoSuccessMsg] = useState('');

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/ai/predictive-maintenance');
      setPredictions(res.data);
    } catch (err) {
      console.error('Failed to load predictive maintenance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const selectedPrediction = predictions.find(p => p.machine_id === selectedMachineId);

  const handleCreateWorkOrderFromRisk = async (pred) => {
    setCreatingWO(true);
    setWoSuccessMsg('');
    try {
      await api.post('/enterprise/work-orders', {
        machine_id: pred.machine_id,
        title: `Predictive Alert: ${pred.primary_risk_factor}`,
        description: pred.maintenance_procedure || pred.recommended_action,
        priority: pred.predicted_status === 'critical' ? 'urgent' : pred.predicted_status === 'warning' ? 'high' : 'medium',
        assigned_technician: 'Carlos Santana',
        estimated_hours: pred.predicted_status === 'critical' ? 4.0 : 2.0,
        cost: pred.predicted_status === 'critical' ? 12500.0 : 4500.0
      });
      setWoSuccessMsg(`✓ Work Order successfully dispatched for ${pred.machine_name} (${pred.model_code})!`);
      setTimeout(() => setWoSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to create work order from risk:', err);
    } finally {
      setCreatingWO(false);
    }
  };

  if (loading && !predictions.length) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Analyzing fleet telemetry and predictive risk models...</div>;
  }

  // -------------------------------------------------------------
  // DETAILED PREDICTIVE MAINTENANCE VIEW FOR SELECTED MACHINE
  // -------------------------------------------------------------
  if (selectedMachineId && selectedPrediction) {
    const p = selectedPrediction;
    const riskColor = p.predicted_status === 'critical' ? 'var(--accent-rose)' 
      : p.predicted_status === 'warning' ? 'var(--accent-amber)' 
      : 'var(--accent-emerald)';

    const componentRiskData = [
      { name: 'Bearings', risk: p.component_risks?.bearings || 20 },
      { name: 'Thermal', risk: p.component_risks?.thermal || 25 },
      { name: 'Spindle', risk: p.component_risks?.spindle || 15 },
      { name: 'Motor', risk: p.component_risks?.motor || 30 },
      { name: 'Lubrication', risk: p.component_risks?.lubrication || 18 }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Back Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setSelectedMachineId(null)} 
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>← Back to All Machines</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleCreateWorkOrderFromRisk(p)}
              disabled={creatingWO}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusCircle size={16} />
              <span>{creatingWO ? 'Dispatching...' : 'Create Maintenance Work Order'}</span>
            </button>
            <button onClick={fetchPredictions} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {woSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
            <CheckCircle2 size={18} />
            <span>{woSuccessMsg}</span>
          </div>
        )}

        {/* Machine Header Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{p.machine_name}</h2>
              <span className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                {p.model_code}
              </span>
              <span className={`badge badge-${p.predicted_status === 'critical' ? 'breakdown' : p.predicted_status === 'warning' ? 'warning' : 'running'}`}>
                {p.predicted_status.toUpperCase()} RISK
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Primary Diagnostic: <strong style={{ color: '#fff' }}>{p.primary_risk_factor}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>HEALTH SCORE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: p.health_score > 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {p.health_score}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>FAILURE RISK SCORE</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: riskColor }}>
                {p.failure_risk_percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Analysis Card */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: `6px solid ${riskColor}` }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: riskColor, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} />
            <span>AI Predictive Failure Diagnostics & Action Protocol</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, marginBottom: '14px' }}>
            {p.recommended_action}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Remaining Useful Life (RUL):</span>
              <div className="text-mono" style={{ color: 'var(--accent-cyan)', fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
                {p.rul?.hours || 120} hrs ({p.rul?.days || 7.5} days)
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Urgency Window:</span>
              <div style={{ color: riskColor, fontWeight: 700, marginTop: '2px' }}>
                {p.urgency}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Operating Hours:</span>
              <div className="text-mono" style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
                {p.telemetry.operating_hours} hrs
              </div>
            </div>
          </div>
        </div>

        {/* 2 Visualizations: Component Risk Breakdown & Degradation Curves */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
          {/* Component Risk Bar Chart */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>Sub-Component Failure Probability (%)</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={componentRiskData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="risk" name="Failure Risk %" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Degradation Forecast Line Chart */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>7-Day Projected Health Degradation</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={p.degradation_curve || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="without_service" name="Without Maintenance" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="with_service" name="With Planned Service" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Maintenance Procedure Steps */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>Recommended Maintenance Procedure</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px' }}>
            {p.maintenance_procedure}
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN MACHINE FLEET SELECTION GRID VIEW
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={26} color="var(--accent-amber)" />
            <span>Predictive Maintenance & Machine Fleet Risk Analysis</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ML-driven failure risk scores, Remaining Useful Life (RUL), sub-component telemetry harmonics, and automated work order dispatch
          </p>
        </div>

        <button onClick={fetchPredictions} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Fleet Risk</span>
        </button>
      </div>

      {/* Fleet Machine Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {predictions.map((p) => {
          const riskColor = p.predicted_status === 'critical' ? 'var(--accent-rose)' 
            : p.predicted_status === 'warning' ? 'var(--accent-amber)' 
            : 'var(--accent-emerald)';

          return (
            <div 
              key={p.machine_id} 
              className="glass-panel glass-panel-interactive" 
              style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.machine_name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{p.model_code}</div>
                </div>
                <span className={`badge badge-${p.predicted_status === 'critical' ? 'breakdown' : p.predicted_status === 'warning' ? 'warning' : 'running'}`}>
                  {p.predicted_status.toUpperCase()} RISK
                </span>
              </div>

              {/* Failure Probability Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Failure Risk Score:</span>
                  <span style={{ fontWeight: 900, color: riskColor }} className="text-mono">
                    {p.failure_risk_percentage}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${p.failure_risk_percentage}%`,
                    height: '100%',
                    background: riskColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
              </div>

              {/* RUL & Primary Factor */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Est. RUL:</span>
                  <strong style={{ color: 'var(--accent-cyan)', marginLeft: '6px' }}>{p.rul?.hours || 120}h ({p.rul?.days || 7}d)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Health:</span>
                  <strong style={{ color: p.health_score > 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginLeft: '6px' }}>{p.health_score}%</strong>
                </div>
              </div>

              {/* Telemetry Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temp</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }} className="text-mono">{p.telemetry.temperature}°C</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vibration</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }} className="text-mono">{p.telemetry.vibration} mm/s</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Run Hours</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }} className="text-mono">{p.telemetry.operating_hours}h</div>
                </div>
              </div>

              {/* Primary Factor snippet */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <strong>Factor:</strong> {p.primary_risk_factor}
              </div>

              {/* Selection Trigger Button */}
              <button
                onClick={() => setSelectedMachineId(p.machine_id)}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                Inspect {p.machine_name} Maintenance Details →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
