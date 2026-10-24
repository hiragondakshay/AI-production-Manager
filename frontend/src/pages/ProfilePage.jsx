import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Save, ArrowLeft } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useContext(AuthContext); // Need login to update user ctx
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', age: '', height: '', weight: '', gender: 'Male' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/user/data');
        const profile = res.data.profile;
        setFormData({
          name: profile.name || user.name,
          age: profile.age || '',
          height: profile.height || '',
          weight: profile.weight || '',
          gender: profile.gender || 'Male'
        });
      } catch (err) {
        console.log("No profile found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/user/update-profile', formData);
      setMessage(res.data.message);
      
      // Update AuthContext name just visual
      const updatedUser = { ...user, name: formData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Not the cleanest, but works locally
      login(updatedUser, localStorage.getItem('token'));
      
    } catch (err) {
      setMessage("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading Profile...</div>;

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back to Dashboard
        </div>
      </nav>

      <div className="container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <User size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h1 className="heading-gradient" style={{ fontSize: '2rem' }}>My Profile</h1>
          </div>

          {message && <div style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
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
            
            <button disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <Save size={20} /> {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
