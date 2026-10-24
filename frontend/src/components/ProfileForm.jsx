import React, { useState } from 'react';
import api from '../services/api';

const ProfileForm = ({ onNext }) => {
  const [formData, setFormData] = useState({ age: '', height: '', weight: '', gender: 'Male' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/user/profile', formData);
      onNext();
    } catch (err) {
      console.error(err);
      alert("Error saving profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Basic Profile</h2>
      <div className="input-group">
        <label>Age</label>
        <input type="number" required className="input-field" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
      </div>
      <div className="input-group">
        <label>Height (cm)</label>
        <input type="number" required className="input-field" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
      </div>
      <div className="input-group">
        <label>Weight (kg)</label>
        <input type="number" required className="input-field" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
      </div>
      <div className="input-group">
        <label>Gender</label>
        <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
        {loading ? 'Saving...' : 'Next Step'}
      </button>
    </form>
  );
};

export default ProfileForm;
