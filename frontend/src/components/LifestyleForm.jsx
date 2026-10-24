import React, { useState } from 'react';
import api from '../services/api';

const LifestyleForm = ({ onNext }) => {
  const [formData, setFormData] = useState({
    sleep: 'Good',
    diet: 'Balanced',
    stress: 'Low',
    habits: '',
    exercise: 'Active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/user/reasons', formData);
      onNext();
    } catch (err) {
      alert("Error saving lifestyle reasons");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Lifestyle & Habits</h2>
      
      <div className="input-group">
        <label>Sleep Quality</label>
        <select className="input-field" value={formData.sleep} onChange={e => setFormData({...formData, sleep: e.target.value})}>
          <option value="Good">Good (7-8 hours)</option>
          <option value="Poor">Poor (Insomnia, &lt;5 hours)</option>
          <option value="Average">Average (5-6 hours)</option>
        </select>
      </div>

      <div className="input-group">
        <label>Diet Type</label>
        <select className="input-field" value={formData.diet} onChange={e => setFormData({...formData, diet: e.target.value})}>
          <option value="Balanced">Balanced</option>
          <option value="High Sugar">High Sugar / Processed</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Keto">Keto / High Protein</option>
        </select>
      </div>

      <div className="input-group">
        <label>Stress Level</label>
        <select className="input-field" value={formData.stress} onChange={e => setFormData({...formData, stress: e.target.value})}>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="input-group">
        <label>Exercise Habits</label>
        <select className="input-field" value={formData.exercise} onChange={e => setFormData({...formData, exercise: e.target.value})}>
          <option value="Active">Active (3+ times/week)</option>
          <option value="Light">Light (1-2 times/week)</option>
          <option value="None">None (Sedentary)</option>
        </select>
      </div>

      <div className="input-group">
        <label>Habits (Separate by comma)</label>
        <input type="text" className="input-field" placeholder="e.g., smoking, alcohol" value={formData.habits} onChange={e => setFormData({...formData, habits: e.target.value})} />
      </div>

      <button disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
        {loading ? 'Saving...' : 'Complete Assessment'}
      </button>
    </form>
  );
};

export default LifestyleForm;
