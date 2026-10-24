import React, { useState } from 'react';
import api from '../services/api';

const ALL_SYMPTOMS = [
  'Fever', 'Cough', 'Fatigue', 'Chest Pain', 'Shortness of Breath', 
  'Headache', 'Nausea', 'Frequent Urination', 'Excessive Thirst'
];

const SymptomsForm = ({ onNext }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (sym) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/user/symptoms', { symptoms: selectedSymptoms });
      onNext();
    } catch (err) {
      alert("Error saving symptoms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Symptoms</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select any symptoms you have experienced recently.</p>
      
      <div className="checkbox-grid" style={{ marginBottom: '2rem' }}>
        {ALL_SYMPTOMS.map(sym => (
          <label key={sym} className="checkbox-label">
            <input 
              type="checkbox" 
              checked={selectedSymptoms.includes(sym)}
              onChange={() => toggleSymptom(sym)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>{sym}</span>
          </label>
        ))}
      </div>

      <button disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
        {loading ? 'Saving...' : 'Next Step'}
      </button>
    </form>
  );
};

export default SymptomsForm;
