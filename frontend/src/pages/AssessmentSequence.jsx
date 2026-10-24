import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfileForm from '../components/ProfileForm';
import VitalsForm from '../components/VitalsForm';
import SymptomsForm from '../components/SymptomsForm';
import LifestyleForm from '../components/LifestyleForm';
import { Activity } from 'lucide-react';

const steps = ['Profile', 'Vitals', 'Symptoms', 'Lifestyle', 'Analysis'];

const AssessmentSequence = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const nextStep = () => setCurrentStep(prev => prev + 1);

  const handleAnalysis = async () => {
    try {
      await api.post('/analysis/generate');
      navigate('/report');
    } catch (err) {
      alert("Error generating report");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
          <Activity /> HealthGuard
        </div>
      </nav>

      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Stepper Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border)', zIndex: 0 }}></div>
            {steps.map((step, index) => (
              <div key={index} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface)', padding: '0 0.5rem' }}>
                <div style={{ 
                  width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentStep >= index ? 'var(--primary)' : 'var(--border)',
                  color: currentStep >= index ? 'white' : 'var(--text-muted)',
                  fontWeight: 'bold', marginBottom: '0.5rem', transition: 'all 0.3s'
                }}>
                  {index + 1}
                </div>
                <span style={{ fontSize: '0.8rem', color: currentStep >= index ? 'var(--primary)' : 'var(--text-muted)' }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div>
            {currentStep === 0 && <ProfileForm onNext={nextStep} />}
            {currentStep === 1 && <VitalsForm onNext={nextStep} />}
            {currentStep === 2 && <SymptomsForm onNext={nextStep} />}
            {currentStep === 3 && <LifestyleForm onNext={nextStep} />}
            {currentStep === 4 && (
              <div style={{ textAlign: 'center' }} className="animate-fade-in">
                <Activity size={64} className="animate-fade-in" color="var(--primary)" style={{ margin: '0 auto 1.5rem', animation: 'fadeIn 1s infinite alternate' }} />
                <h2 style={{ marginBottom: '1rem' }}>Ready for Analysis</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>All data compiled. Click below to generate your smart health report.</p>
                <button onClick={handleAnalysis} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
                  Generate Final Report
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
};

export default AssessmentSequence;
