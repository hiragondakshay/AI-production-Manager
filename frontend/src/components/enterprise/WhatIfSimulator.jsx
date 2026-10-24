import React, { useState } from 'react';
import api from '../../services/api';
import { 
  Sliders, Play, AlertTriangle, ArrowRight, ShieldCheck, 
  TrendingDown, Layers, DollarSign, Clock, CheckCircle2 
} from 'lucide-react';

export default function WhatIfSimulator() {
  const [scenarioType, setScenarioType] = useState('machine_failure');
  const [machineId, setMachineId] = useState(1);
  const [downtimeHours, setDowntimeHours] = useState(4.0);
  const [demandSurgePct, setDemandSurgePct] = useState(25.0);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/enterprise/simulation/run', {
        scenario_type: scenarioType,
        machine_id: machineId,
        downtime_hours: downtimeHours,
        demand_surge_pct: demandSurgePct
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={26} color="var(--accent-purple)" />
          <span>Factory Digital Twin "What-If" Scenario Simulator</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Model machine outage impacts, demand surges, production loss forecasting, and dynamic alternative routing
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
        {/* Controls Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Simulation Parameters</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>SCENARIO TYPE</label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="machine_failure">Machine Unplanned Breakdown / Outage</option>
              <option value="demand_surge">Customer Demand / Order Surge (+%)</option>
              <option value="combined_stress">Combined Bottleneck & Surge Stress Test</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>TARGET SIMULATION MACHINE</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
            >
              <option value={1}>CNC Alpha (CNC-001) - 4,500 RPM</option>
              <option value={2}>CNC Beta (CNC-002) - 5-Axis Center</option>
              <option value={3}>CNC Gamma (CNC-003) - High-Speed Lathe</option>
              <option value={4}>Lathe Alpha (LTH-001) - Precision Lathe</option>
              <option value={5}>Press Alpha (PRS-001) - Heavy Hydraulic</option>
              <option value={6}>Laser Alpha (LSR-001) - Fiber Laser 4KW</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SIMULATED DOWNTIME DURATION</label>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-rose)' }} className="text-mono">{downtimeHours} Hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.5"
              value={downtimeHours}
              onChange={(e) => setDowntimeHours(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>DEMAND SURGE PERCENTAGE</label>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)' }} className="text-mono">+{demandSurgePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={demandSurgePct}
              onChange={(e) => setDemandSurgePct(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px', justifyContent: 'center' }}
          >
            <Play size={18} />
            <span>{loading ? 'Executing Monte Carlo Model...' : 'Run What-If Simulation'}</span>
          </button>
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Simulation Impact & Mitigation Assessment</h3>

          {!simulationResult ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sliders size={48} color="var(--border-color)" style={{ margin: '0 auto 12px auto' }} />
              <div>Configure parameters and click "Run What-If Simulation" to compute predictive production impact.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Impact Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>LOST OUTPUT</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', margin: '4px 0' }} className="text-mono">
                    -{simulationResult.impact_analysis.production_loss_units} units
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Due to {downtimeHours}h outage</span>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>FINANCIAL LOSS</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }} className="text-mono">
                    ${simulationResult.impact_analysis.estimated_financial_loss_usd}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Labor & idle overhead</span>
                </div>

                <div style={{ background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>SCHEDULE DELAY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple)', margin: '4px 0' }} className="text-mono">
                    +{simulationResult.impact_analysis.schedule_delay_hours} hrs
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Order deadline slip</span>
                </div>
              </div>

              {/* Reroute Recommendation Card */}
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle2 size={18} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>AI Dynamic Reroute Optimization</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4 }}>
                  Optimal Alternative: <strong style={{ color: 'var(--accent-emerald)' }}>{simulationResult.mitigation_plan.recommended_backup_machine.name} ({simulationResult.mitigation_plan.recommended_backup_machine.model_code})</strong> with {simulationResult.mitigation_plan.recommended_backup_machine.health_score}% health and feasibility rating: <strong style={{ color: 'var(--accent-cyan)' }}>{simulationResult.mitigation_plan.reroute_feasibility}</strong>.
                </p>
              </div>

              {/* Action Recommendations */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>RECOMMENDED MITIGATION ACTIONS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {simulationResult.mitigation_plan.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <ArrowRight size={14} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
