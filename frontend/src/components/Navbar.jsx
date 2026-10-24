import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { Cpu, UserCircle, LogOut, Clock, Bell, Bot, Sparkles, Timer, RefreshCw } from 'lucide-react';
import AICopilotDrawer from './enterprise/AICopilotDrawer';
import NotificationCenter from './enterprise/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { activeShift, nextShift, countdownFormatted, isTransitioning } = useShift();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [showCopilot, setShowCopilot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roleColor = {
    plant_manager: 'badge-running',
    production_manager: 'badge-info',
    maintenance_manager: 'badge-warning',
    quality_manager: 'badge-purple',
    operator: 'badge-idle'
  }[user?.role] || 'badge-info';

  const roleLabel = {
    plant_manager: 'Plant Manager',
    production_manager: 'Production Manager',
    maintenance_manager: 'Maintenance Manager',
    quality_manager: 'Quality Manager',
    operator: 'Machine Operator'
  }[user?.role] || (user?.role ? user.role.replace('_', ' ') : 'Manager');

  return (
    <>
      <header style={{
        height: '70px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Brand & Site Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#0284C7',
            border: '1px solid #0EA5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                NEXUS<span style={{ color: '#38BDF8' }}>PROD AI</span>
              </span>
              <span style={{ fontSize: '0.68rem', background: '#1E293B', border: '1px solid #293548', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                v3.5 MES
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Apex Industrial — Plant Alpha (Bengaluru)
            </div>
          </div>
        </div>

        {/* Center Live Active Shift, Countdown, Clock & Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active Factory Shift with Live Countdown */}
          <div style={{
            background: isTransitioning ? 'rgba(245, 158, 11, 0.15)' : '#172033',
            border: isTransitioning ? '1px solid #F59E0B' : '1px solid var(--border-color)',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: activeShift.color || '#38BDF8' }}></div>
            <div>
              <span style={{ color: activeShift.color || '#38BDF8', fontWeight: 700 }}>{activeShift.name}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({activeShift.start_time} - {activeShift.end_time})</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Timer size={12} color="#94A3B8" />
              <span className="text-mono" style={{ color: '#F8FAFC', fontWeight: 600 }}>{countdownFormatted}</span>
            </div>
          </div>

          <div style={{ background: '#172033', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="pulse-dot pulse-running" style={{ width: '6px', height: '6px' }}></div>
            <span style={{ color: 'var(--text-muted)' }}>Telemetry:</span>
            <span className="text-mono" style={{ color: '#22C55E', fontWeight: 700 }}>LIVE (3s)</span>
          </div>

          <div style={{ background: '#172033', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} color="#38BDF8" />
            <span className="text-mono" style={{ color: '#F8FAFC', fontWeight: 600 }}>{time}</span>
          </div>
        </div>

        {/* Right Tools: Copilot, Notifications & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* AI Copilot Trigger */}
          <button
            onClick={() => setShowCopilot(true)}
            className="btn-primary"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
            title="Open AI Factory Copilot"
          >
            <Bot size={15} />
            <span>AI Copilot</span>
            <Sparkles size={12} color="#38BDF8" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="btn-secondary"
            style={{ padding: '7px 10px', position: 'relative' }}
            title="Notifications & Alarms"
          >
            <Bell size={15} />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--accent-rose)'
            }} />
          </button>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F8FAFC' }}>{user?.username}</div>
              <span className={`badge ${roleColor}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{roleLabel}</span>
            </div>
            <UserCircle size={30} color="#38BDF8" />
          </div>

          <button 
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '7px 10px' }}
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Slide-Out Drawers */}
      <AICopilotDrawer isOpen={showCopilot} onClose={() => setShowCopilot(false)} />
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
