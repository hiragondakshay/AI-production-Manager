import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

export default function Breadcrumbs({ customCrumbs, fallbackBackPath }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Route map for human-readable labels
  const routeMap = {
    'command-center': 'Command Center',
    'machines': 'Machines',
    'dashboard': 'Fleet & Telemetry',
    'oee': 'Advanced OEE',
    'scheduler': 'AI Auto-Scheduler',
    'costs': 'Production Cost Calculator',
    'simulation': 'What-If Simulator',
    'maintenance': 'Predictive Maintenance & RUL',
    'work-orders': 'Maintenance Work Orders',
    'downtime': 'Downtime Analytics',
    'inventory': 'Smart Inventory',
    'energy': 'Industrial Energy Monitoring',
    'quality': 'Vision Quality Inspection',
    'operators': 'Operator Performance Matrix',
    'attendance': 'Workstation Check-In',
    'forecasting': 'Demand Forecasting',
    'reports': 'Shift Logs & Reports',
    'audit-logs': 'Security Audit Trail',
    'profile': 'User Profile'
  };

  const handleBack = () => {
    if (fallbackBackPath) {
      navigate(fallbackBackPath);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/command-center');
    }
  };

  // Build crumbs from path segments if customCrumbs not provided
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const crumbs = customCrumbs || pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = routeMap[segment] || segment.replace(/-/g, ' ').replace(/^./, str => str.toUpperCase());
    return { label, path };
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'transparent',
      padding: '4px 0 12px 0',
      borderBottom: '1px solid #22344B',
      marginBottom: '16px',
      fontSize: '0.78rem'
    }}>
      {/* Breadcrumb Path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
        <Link to="/command-center" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Home">
          <Home size={14} />
        </Link>
        <ChevronRight size={13} color="#64748B" />

        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {isLast ? (
                <span style={{ color: '#00B8FF', fontWeight: 700 }}>{crumb.label}</span>
              ) : (
                <Link to={crumb.path} style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  {crumb.label}
                </Link>
              )}
              {!isLast && <ChevronRight size={13} color="#64748B" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Functional Back Button */}
      <button
        onClick={handleBack}
        className="btn-secondary"
        style={{
          padding: '4px 10px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
        title="Go to previous page"
      >
        <ArrowLeft size={13} />
        <span>Back</span>
      </button>
    </div>
  );
}
