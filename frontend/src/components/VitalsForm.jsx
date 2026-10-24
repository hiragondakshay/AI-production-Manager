import React, { useState } from 'react';
import api from '../services/api';

const VitalsForm = ({ onNext }) => {
  const [formData, setFormData] = useState({ bp: '120/80', temperature: 37.0, spo2: 98, heartRate: 75 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/user/vitals', formData);
      onNext();
    } catch (err) {
      alert("Error saving vitals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Health Vitals</h2>
      <div className="input-group">
        <label>Blood Pressure (e.g., 120/80)</label>
        <input type="text" required className="input-field" placeholder="120/80" value={formData.bp} onChange={e => setFormData({...formData, bp: e.target.value})} />
      </div>
      <div className="input-group">
        <label>Body Temperature (°C)</label>
        <input type="number" step="0.1" required className="input-field" value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} />
      </div>
      <div className="input-group">
        <label>SpO2 (%)</label>
        <input type="number" required className="input-field" min="0" max="100" value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} />
      </div>
      <div className="input-group">
        <label>Heart Rate (BPM)</label>
        <input type="number" required className="input-field" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} />
      </div>
      <button disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
        {loading ? 'Saving...' : 'Next Step'}
      </button>
    </form>
  );
};

export default VitalsForm;
