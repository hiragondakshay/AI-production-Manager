import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, X, AlertTriangle, AlertCircle, Info, CheckCircle2, Wrench, Package, ExternalLink } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const [data, setData] = useState({ unread_count: 0, notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/enterprise/notifications');
          setData(res.data);
        } catch (err) {
          console.error('Failed to load notifications:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '390px',
      maxWidth: '90vw',
      height: '100vh',
      background: 'rgba(10, 15, 29, 0.96)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid rgba(244, 63, 94, 0.25)',
      boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
            padding: '8px',
            borderRadius: '10px',
            color: '#fff',
            display: 'flex'
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Notification Center</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {data.unread_count} Factory Events Flagged
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
          <X size={18} />
        </button>
      </div>

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading notification stream...
          </div>
        ) : data.notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontWeight: 700, color: '#fff' }}>All Systems Nominal</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No active alarms or low stock warnings.</div>
          </div>
        ) : (
          data.notifications.map((n) => {
            const isCrit = n.severity === 'critical';
            const isWarn = n.severity === 'warning';
            const borderColor = isCrit ? 'rgba(244, 63, 94, 0.4)' : isWarn ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.3)';
            const bgGradient = isCrit ? 'rgba(244, 63, 94, 0.08)' : isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(56, 189, 248, 0.05)';
            const iconColor = isCrit ? 'var(--accent-rose)' : isWarn ? 'var(--accent-amber)' : 'var(--accent-cyan)';

            return (
              <div key={n.id} className="glass-panel" style={{
                padding: '14px',
                border: `1px solid ${borderColor}`,
                background: bgGradient,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCrit ? <AlertTriangle size={16} color={iconColor} /> : isWarn ? <AlertCircle size={16} color={iconColor} /> : <Info size={16} color={iconColor} />}
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{n.title}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{n.timestamp}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {n.message}
                </p>

                {n.recommended_action && (
                  <div style={{
                    fontSize: '0.74rem',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600
                  }}>
                    💡 Action: {n.recommended_action}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
