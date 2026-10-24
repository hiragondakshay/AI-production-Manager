import React from 'react';
import { Radio, Cpu } from 'lucide-react';

export default function DemoTelemetryBadge({ live = true }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(56, 189, 248, 0.1)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '20px',
      padding: '4px 12px',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'var(--accent-cyan)'
    }}>
      <Radio size={14} className="pulse" color="var(--accent-cyan)" />
      <span>DEMO TELEMETRY ACTIVE</span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        (Simulated IoT Sensor Stream)
      </span>
    </div>
  );
}
