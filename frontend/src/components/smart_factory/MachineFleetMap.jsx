import React from 'react';
import { Cpu, Activity, Flame, Zap, Wrench, ShieldAlert, UserCheck } from 'lucide-react';

export default function MachineFleetMap({ fleet, onSelectMachine }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'var(--accent-emerald)';
      case 'warning': return 'var(--accent-amber)';
      case 'idle': return 'var(--accent-cyan)';
      case 'fault':
      case 'breakdown': return 'var(--accent-rose)';
      case 'maintenance': return 'var(--accent-purple)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="var(--accent-cyan)" />
            <span>FACTORY FLOOR DIGITAL FLEET MAP</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time status view. Click any machine card to open complete 6-section Digital Twin & Telemetry overview.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span>🟢 RUNNING</span>
          <span>🟡 WARNING</span>
          <span>🔵 IDLE</span>
          <span>🔴 FAULT</span>
          <span>🟣 MAINT</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {fleet.map((m) => {
          const statusColor = getStatusColor(m.status);
          return (
            <div
              key={m.id}
              onClick={() => onSelectMachine(m.id)}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '18px',
                cursor: 'pointer',
                borderLeft: `4px solid ${statusColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{m.name}</div>
                  <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.model_code} | {m.machine_type}</div>
                </div>
                <span className={`badge badge-${m.status}`}>{m.status.toUpperCase()}</span>
              </div>

              {/* Operator & Job */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Operator:</span> <strong>{m.current_operator}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Current Job:</span> <strong className="text-mono" style={{ color: 'var(--accent-amber)' }}>{m.current_job}</strong></div>
              </div>

              {/* Live Telemetry Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.72rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Health</div>
                  <div style={{ fontWeight: 800, color: m.health_score > 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{m.health_score}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Temp</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>{m.temperature}°C</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Vibration</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{m.vibration}mm/s</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, textAlign: 'right' }}>
                Click for Full CNC Alpha Monitoring →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
