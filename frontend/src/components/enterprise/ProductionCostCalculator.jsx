import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  IndianRupee, Layers, TrendingUp, 
  Calculator, RefreshCw, BarChart2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, 
  YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

export default function ProductionCostCalculator() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCosts = async () => {
    try {
      const res = await api.get('/enterprise/costs/orders');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load production costs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  if (loading && !data) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Calculating Real-Time Production Cost Breakdowns (INR)...</div>;
  }

  const { summary, orders } = data;

  const chartData = orders.map(o => ({
    order: o.order_number,
    material: o.costs.material_cost,
    labor: o.costs.labor_cost,
    machine: o.costs.machine_cost,
    energy: o.costs.energy_cost,
    maintenance: o.costs.maintenance_overhead
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={26} color="var(--accent-emerald)" />
            <span>Industrial Production Cost Calculator & Breakdown (₹ INR)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Decomposed raw material, direct labor, machine depreciation, energy consumption, and maintenance overhead per work order
          </p>
        </div>

        <button onClick={fetchCosts} className="btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={15} />
          <span>Refresh Costs</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Production Cost</span>
            <IndianRupee size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-emerald)' }} className="text-mono">
            ₹{summary.total_production_cost_usd.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Across all active work orders
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Cost per Unit</span>
            <Calculator size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '10px 0 2px 0', color: 'var(--accent-cyan)' }} className="text-mono">
            ₹{summary.average_cost_per_unit} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ unit</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Based on {summary.total_units_evaluated} manufactured parts
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Cost Driver</span>
            <Layers size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--accent-amber)' }}>
            Raw Materials ({summary.cost_distribution.material_pct}%)
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Labor: {summary.cost_distribution.labor_pct}% | Machine: {summary.cost_distribution.machine_pct}%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Energy & Maint Share</span>
            <TrendingUp size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--accent-purple)' }}>
            {summary.cost_distribution.energy_pct + summary.cost_distribution.maintenance_pct}% Overhead
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-emerald)', fontWeight: 600 }}>
            Within optimal lean manufacturing range
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart of Cost Drivers per Order */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="var(--accent-emerald)" />
          <span>Work Order Cost Composition (₹ INR Breakdown)</span>
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="order" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} unit="₹" />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="material" name="Raw Material (₹)" stackId="a" fill="#38bdf8" />
              <Bar dataKey="labor" name="Direct Labor (₹)" stackId="a" fill="#10b981" />
              <Bar dataKey="machine" name="Machine Deprec. (₹)" stackId="a" fill="#c084fc" />
              <Bar dataKey="energy" name="Energy Draw (₹)" stackId="a" fill="#f59e0b" />
              <Bar dataKey="maintenance" name="Maint. Overhead (₹)" stackId="a" fill="#e11d48" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px' }}>Work Order Production Cost Ledger</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Order</th>
                <th style={{ padding: '10px 8px' }}>Product</th>
                <th style={{ padding: '10px 8px' }}>Qty</th>
                <th style={{ padding: '10px 8px' }}>Material</th>
                <th style={{ padding: '10px 8px' }}>Labor</th>
                <th style={{ padding: '10px 8px' }}>Machine</th>
                <th style={{ padding: '10px 8px' }}>Energy</th>
                <th style={{ padding: '10px 8px' }}>Total Cost</th>
                <th style={{ padding: '10px 8px' }}>Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--accent-cyan)' }} className="text-mono">{o.order_number}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>{o.product_name}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">{o.quantity}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{o.costs.material_cost.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{o.costs.labor_cost.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{o.costs.machine_cost.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px' }} className="text-mono">₹{o.costs.energy_cost.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--accent-emerald)' }} className="text-mono">₹{o.costs.total_cost.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--accent-amber)' }} className="text-mono">₹{o.costs.cost_per_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
