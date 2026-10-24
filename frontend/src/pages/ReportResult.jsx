import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Activity, Download, ArrowLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ReportResult = () => {
  const [report, setReport] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, profileRes] = await Promise.all([
          api.get('/analysis/report'),
          api.get('/user/data')
        ]);
        setReport(reportRes.data);
        setProfile(profileRes.data.profile);
      } catch (err) {
        alert("Error loading report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get('/analysis/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'health_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to download PDF");
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}><Activity className="animate-fade-in" size={48} color="var(--primary)" /></div>;
  if (!report) return <div className="container">No report found.</div>;

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back to Dashboard
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadPDF}>
          <Download size={20} /> Download PDF
        </button>
      </nav>

      <div className="container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '900px' }}>
        <h1 className="heading-gradient" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.5rem' }}>Your Health Report</h1>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{profile?.name || 'User Profile'}</h2>
            <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
              <span>Age: {profile?.age}</span>
              <span>Gender: {profile?.gender}</span>
              <span>BMI: {profile?.bmi} ({profile?.bmiCategory})</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: report.score > 70 ? 'var(--secondary)' : 'var(--danger)' }}>
              {report.score}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Health Score</div>
          </div>
        </div>

        {report.predictedDiseases && report.predictedDiseases.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertTriangle size={24} /> Predicted Risks
            </h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {report.predictedDiseases.map((p, idx) => (
                <li key={idx} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {p.disease} — <span style={{ color: 'var(--danger)' }}>Risk Level: {p.riskLevel}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
              <CheckCircle size={24} /> Nutrition Plan
            </h3>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
              {report.recommendations.nutrition.map((item, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              <Activity size={24} /> Exercise Plan
            </h3>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
              {report.recommendations.exercise.map((item, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', marginBottom: '1rem' }}>
            <Info size={24} /> Prevention & Advice
          </h3>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
            {report.recommendations.prevention.map((item, idx) => <li key={`p-${idx}`} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
            {report.recommendations.advice.map((item, idx) => <li key={`a-${idx}`} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ReportResult;
