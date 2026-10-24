import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  AlertTriangle, X, Search, CheckCircle2, ArrowRight, 
  HelpCircle, ShieldAlert, Wrench, RefreshCw 
} from 'lucide-react';

export default function RootCauseAnalysisModal({ machineId = 1, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRCA = async () => {
      try {
        const res = await api.get(`/enterprise/rca/${machineId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load RCA:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRCA();
  }, [machineId]);

  if (!machineId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1600, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '750px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid rgba(244, 63, 94, 0.4)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
              padding: '8px',
              borderRadius: '10px',
              color: '#fff',
              display: 'flex'
            }}>
              <Search size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Automated Root Cause Analysis (RCA)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Target: <strong style={{ color: 'var(--accent-cyan)' }}>{data?.machine.name} ({data?.machine.model_code})</strong> — 5-Why Failure Mode & Effect Diagnostics
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {loading || !data ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Correlating telemetry harmonics and building 5-Why fault tree...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live Telemetry Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Temperature:</span> <strong style={{ color: data.telemetry_snapshot.temperature > 65 ? 'var(--accent-rose)' : '#fff' }}>{data.telemetry_snapshot.temperature}°C</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Vibration:</span> <strong style={{ color: data.telemetry_snapshot.vibration > 2.5 ? 'var(--accent-rose)' : '#fff' }}>{data.telemetry_snapshot.vibration} mm/s</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Motor Load:</span> <strong style={{ color: data.telemetry_snapshot.motor_load > 85 ? 'var(--accent-amber)' : '#fff' }}>{data.telemetry_snapshot.motor_load}%</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Power:</span> <strong>{data.telemetry_snapshot.power_consumption} kW</strong></div>
            </div>

            {/* Probable Cause Box */}
            {data.probable_causes.map((c, i) => (
              <div key={i} style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} color="var(--accent-rose)" />
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>Primary Subsystem: {c.subsystem}</span>
                  </div>
                  <span style={{
                    background: 'rgba(244, 63, 94, 0.2)',
                    color: 'var(--accent-rose)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {c.confidence}% CONFIDENCE
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--accent-amber)' }}>Symptom:</strong> {c.symptom}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                  <strong style={{ color: 'var(--accent-rose)' }}>Root Cause:</strong> {c.root_cause}
                </div>
              </div>
            ))}

            {/* 5-Why Fault Tree */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} />
                <span>5-Why Sequential Root Cause Investigation</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.five_whys_analysis.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>
                      Why #{idx + 1}: {item.why}
                    </div>
                    <div style={{ color: '#fff', paddingLeft: '12px', borderLeft: '2px solid var(--accent-cyan)' }}>
                      → {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corrective Action Plan */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>Recommended Corrective Action Plan</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.corrective_actions.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#fff' }}>
                    <Wrench size={14} color="var(--accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              <span>Close RCA Diagnostic</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
