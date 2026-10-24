import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, Plus, FileText, Download, User, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [report, setReport] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, dataRes, historyRes] = await Promise.all([
          api.get('/analysis/report').catch(() => ({ data: null })),
          api.get('/user/data').catch(() => ({ data: null })),
          api.get('/user/history').catch(() => ({ data: [] }))
        ]);
        
        setReport(reportRes.data);
        setProfile(dataRes.data?.profile);
        
        // Format history for Recharts
        const formattedHistory = historyRes.data.map((item, idx) => ({
          name: `Asmnt ${idx + 1}`,
          HeartRate: item.heartRate,
          SpO2: item.spo2,
          SystolicBP: item.systolic,
        }));
        setHistory(formattedHistory);

      } catch (err) {
        console.log("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartAssessment = () => navigate('/assessment');
  const handleProfile = () => navigate('/profile');

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

  const getRiskLevel = () => {
    if (!report || !report.predictedDiseases) return "Unknown";
    if (report.predictedDiseases.some(d => d.riskLevel === 'High')) return "High";
    if (report.predictedDiseases.some(d => d.riskLevel === 'Moderate')) return "Moderate";
    return "Low";
  };

  const riskLevel = getRiskLevel();

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
          <Activity /> HealthGuard
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: '500' }}>Hello, {user?.name}</span>
          <button onClick={handleProfile} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}><User size={16} /> Profile</button>
          <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Logout</button>
        </div>
      </nav>

      <div className="container animate-fade-in" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="heading-gradient">Dashboard Overview</h1>
          <button onClick={handleStartAssessment} className="btn btn-primary">
            <Plus size={20} /> New Assessment
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}><Activity className="animate-fade-in" size={48} color="var(--primary)" /></div>
        ) : (
          <>
            {/* Top Cards Mini-Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current BMI</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  {profile?.bmi || '--'} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{profile?.bmiCategory || ''}</span>
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${riskLevel === 'High' ? 'var(--danger)' : riskLevel === 'Moderate' ? '#F59E0B' : 'var(--secondary)'}` }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Overall Risk Level</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: riskLevel === 'High' ? 'var(--danger)' : 'inherit' }}>
                  {riskLevel}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #8B5CF6' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Latest Health Score</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: report?.score > 70 ? 'var(--secondary)' : 'inherit' }}>
                  {report?.score ? `${report.score}/100` : '--/100'}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Vital History Chart */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} /> Vital History</h3>
                {history.length > 0 ? (
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                        <Legend />
                        <Line type="monotone" dataKey="HeartRate" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="SpO2" stroke="var(--secondary)" strokeWidth={3} />
                        <Line type="monotone" dataKey="SystolicBP" stroke="#F59E0B" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No vital history available yet.
                  </div>
                )}
              </div>

              {/* Recent Report Summary */}
              {report ? (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Recent Report</h3>
                   <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                   
                   <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Top Focus Area:</div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {report.recommendations?.nutrition[0] || "Maintain a healthy lifestyle."}
                    </div>
                   </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/report')} style={{ width: '100%' }}>
                      <FileText size={20} /> View Full Report
                    </button>
                    <button className="btn btn-secondary" onClick={handleDownloadPDF} style={{ width: '100%' }}>
                      <Download size={20} /> Download PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <Activity size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
                  <h3 style={{ marginBottom: '1rem' }}>No Assessment Found</h3>
                  <button onClick={handleStartAssessment} className="btn btn-primary" style={{ width: '100%' }}>
                    Start Assessment Now
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
