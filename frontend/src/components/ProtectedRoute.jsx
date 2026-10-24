import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ROUTE_PERMISSIONS = {
  '/command-center': ['plant_manager', 'production_manager', 'maintenance_manager', 'quality_manager', 'operator'],
  '/machines': ['plant_manager', 'production_manager', 'maintenance_manager', 'operator'],
  '/oee': ['plant_manager', 'production_manager', 'maintenance_manager'],
  '/scheduler': ['plant_manager', 'production_manager'],
  '/costs': ['plant_manager', 'production_manager'],
  '/simulation': ['plant_manager', 'production_manager'],
  '/maintenance': ['plant_manager', 'maintenance_manager'],
  '/work-orders': ['plant_manager', 'maintenance_manager'],
  '/downtime': ['plant_manager', 'production_manager', 'maintenance_manager'],
  '/inventory': ['plant_manager', 'production_manager'],
  '/energy': ['plant_manager', 'production_manager', 'maintenance_manager'],
  '/quality': ['plant_manager', 'quality_manager'],
  '/operators': ['plant_manager', 'production_manager', 'operator'],
  '/attendance': ['plant_manager', 'production_manager', 'operator'],
  '/forecasting': ['plant_manager', 'production_manager'],
  '/reports': ['plant_manager', 'production_manager', 'quality_manager'],
  '/audit-logs': ['plant_manager', 'maintenance_manager'],
};

export default function ProtectedRoute({ activeTab, setActiveTab }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Initializing NexusProd AI Systems...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization against requested route
  const currentPath = location.pathname.split('?')[0];
  // Check exact route or machine detail route
  let allowedRoles = ROUTE_PERMISSIONS[currentPath];
  if (!allowedRoles && currentPath.startsWith('/machines/')) {
    allowedRoles = ROUTE_PERMISSIONS['/machines'];
  }

  const isAuthorized = !allowedRoles || user.role === 'plant_manager' || allowedRoles.includes(user.role);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {isAuthorized ? (
            <Outlet />
          ) : (
            <div style={{
              background: '#101F33',
              border: '1px solid #EF4444',
              borderRadius: '10px',
              padding: '36px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginTop: '40px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={32} color="#EF4444" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                ACCESS RESTRICTED — 403
              </h2>
              <p style={{ color: '#94A3B8', maxWidth: '540px', fontSize: '0.88rem', margin: 0 }}>
                Your current account role (<strong style={{ color: '#00B8FF' }}>{user.role}</strong>) does not have authorization to view this operations module.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Required clearance roles: {allowedRoles ? allowedRoles.join(', ') : 'Restricted'}
              </div>
              <button
                onClick={() => navigate('/command-center')}
                className="btn-primary"
                style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} />
                <span>Return to Factory Command Center</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

