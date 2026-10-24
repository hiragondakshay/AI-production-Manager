import React, { useState } from 'react';
import api from '../services/api';
import { ScanEye, CheckCircle2, AlertTriangle, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';

export default function QualityControlPage() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'parameter'
  const [batchCode, setBatchCode] = useState('BATCH-2026-X9');
  const [param1, setParam1] = useState(24.5);
  const [param2, setParam2] = useState(0.98);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [inspecting, setInspecting] = useState(false);

  const handleParameterInspect = async (e) => {
    e.preventDefault();
    setInspecting(true);
    try {
      const res = await api.post('/ai/quality-check', {
        machine_id: 1,
        batch_code: batchCode,
        sample_parameter_1: parseFloat(param1),
        sample_parameter_2: parseFloat(param2)
      });
      setResult(res.data);
    } catch (err) {
      console.error('Quality inspection failed:', err);
    } finally {
      setInspecting(false);
    }
  };

  const handleImageInspect = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setInspecting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/ai/quality-check-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error('Image defect inspection failed:', err);
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScanEye size={24} color="var(--accent-purple)" />
            <span>Quality Control & Deep Learning Vision Inspector</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            OpenCV contour & anomaly detection engine scanning uploaded product images for surface flaws
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => { setActiveTab('image'); setResult(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'image' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'image' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Image Upload Mode
          </button>
          <button
            onClick={() => { setActiveTab('parameter'); setResult(null); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'parameter' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'parameter' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Telemetry Sensor Mode
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Inspection Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {activeTab === 'image' ? (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Upload Part Image for OpenCV Inspection</h3>
              <form onSubmit={handleImageInspect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer'
                }}>
                  <Upload size={32} color="var(--accent-purple)" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Select or Drop Manufactured Part Image'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports JPG, PNG, WEBP files</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={inspecting || !selectedFile}
                  className="btn-primary"
                  style={{ marginTop: '10px', justifyContent: 'center' }}
                >
                  <Sparkles size={18} />
                  <span>{inspecting ? 'Processing Image Vision Pipeline...' : 'Run Vision Defect Analysis'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Sensor Parameter Threshold Inspection</h3>
              <form onSubmit={handleParameterInspect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Batch Code ID
                  </label>
                  <input
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Surface Roughness Metric (Ideal: 20 - 30 Ra)</span>
                    <span className="text-mono" style={{ color: 'var(--accent-cyan)' }}>{param1} Ra</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="0.5"
                    value={param1}
                    onChange={(e) => setParam1(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Dimensional Tolerance Scale (Ideal: 0.95 - 1.05)</span>
                    <span className="text-mono" style={{ color: 'var(--accent-purple)' }}>{param2}</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.20"
                    step="0.01"
                    value={param2}
                    onChange={(e) => setParam2(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                  />
                </div>

                <button type="submit" disabled={inspecting} className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                  <span>{inspecting ? 'Analyzing Vision Sensors...' : 'Execute Vision Defect Inspection'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.inspection_id}</span>
                <span className={`badge badge-${result.defect_detected ? 'breakdown' : 'running'}`}>
                  {result.defect_detected ? 'DEFECT DETECTED' : 'QUALITY PASS'}
                </span>
              </div>

              {/* Annotated OpenCV image overlay if present */}
              {result.annotated_image_base64 && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <img src={result.annotated_image_base64} alt="Annotated Defect Inspection" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '4px', background: 'rgba(0,0,0,0.4)' }}>
                    OpenCV Contour Defect Overlay (Red Bounding Boxes)
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                {result.defect_detected ? (
                  <AlertTriangle size={40} color="var(--accent-rose)" style={{ margin: '0 auto 8px auto' }} />
                ) : (
                  <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ margin: '0 auto 8px auto' }} />
                )}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: result.defect_detected ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {result.defect_detected ? 'Batch Inspection Rejected' : 'Batch Quality Approved'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Model Confidence: <strong>{(result.confidence * 100).toFixed(0)}%</strong> {result.anomaly_score && `(Anomaly Score: ${result.anomaly_score})`}
                </div>
              </div>

              {result.defect_type && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#fb7185' }}>
                  <strong>Anomaly Type:</strong> {result.defect_type}
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>Suggested Action:</strong> {result.suggested_action}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <ScanEye size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>Select an image file and click "Run Vision Defect Analysis".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
