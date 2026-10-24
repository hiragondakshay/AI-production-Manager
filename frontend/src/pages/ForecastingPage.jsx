import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, Calendar, Layers, Activity, Sparkles } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState(14);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async (days) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/forecast', { days });
      setForecastData(res.data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(horizon);
  }, [horizon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={24} color="var(--accent-cyan)" />
            <span>Time-Series Demand Forecasting (ML)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Scikit-Learn Machine Learning model predicting order volume based on sales history and trend dynamics
          </p>
        </div>

        {/* Horizon selector buttons */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setHorizon(d)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: horizon === d ? 'var(--accent-cyan)' : 'transparent',
                color: horizon === d ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Forecast Horizon</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }} className="text-mono">
            {forecastData?.horizon_days || horizon} Days
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Demand Trend Trajectory</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>
            {forecastData?.trend || 'Analyzing...'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Projected Demand</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }} className="text-mono">
            {forecastData?.total_predicted_units?.toLocaleString() || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>units</span>
          </div>
        </div>
      </div>

      {/* Demand Forecast Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Order Volume Prediction & Confidence Interval</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Shaded band represents 88% - 112% confidence interval range</p>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating ML time-series predictions...</div>
        ) : (
          <div style={{ width: '100%', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData?.forecast || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="upper_bound" stroke="none" fill="url(#colorConfidence)" name="Upper Bound" />
                <Area type="monotone" dataKey="predicted_demand" stroke="#38bdf8" strokeWidth={3} fill="url(#colorDemand)" name="Predicted Units" />
                <Area type="monotone" dataKey="lower_bound" stroke="none" fill="transparent" name="Lower Bound" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
