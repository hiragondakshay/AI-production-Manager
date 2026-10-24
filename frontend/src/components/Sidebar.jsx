import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, CalendarRange, TrendingUp, 
  Wrench, PackageCheck, ScanEye, Users, Cpu,
  Gauge, AlertOctagon, Sliders, Zap, Calculator, ShieldCheck,
  ChevronDown, ChevronRight, Settings, FileText, Activity
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role || 'plant_manager';

  // Group definitions matching the 11 industrial categories
  const navigationGroups = [
    {
      title: '1. Command Center',
      id: 'group_command',
      items: [
        { id: 'smart_factory', path: '/command-center', label: 'Command Center', icon: Cpu, roles: ['plant_manager', 'production_manager', 'maintenance_manager', 'quality_manager', 'operator'] }
      ]
    },
    {
      title: '2. Machines',
      id: 'group_machines',
      items: [
        { id: 'dashboard', path: '/machines', label: 'Fleet & Telemetry', icon: Activity, roles: ['plant_manager', 'production_manager', 'maintenance_manager', 'operator'] },
        { id: 'oee', path: '/oee', label: 'Advanced OEE', icon: Gauge, roles: ['plant_manager', 'production_manager', 'maintenance_manager'] }
      ]
    },
    {
      title: '3. Production',
      id: 'group_production',
      items: [
        { id: 'scheduler', path: '/scheduler', label: 'AI Auto-Scheduler', icon: CalendarRange, roles: ['plant_manager', 'production_manager'] },
        { id: 'costs', path: '/costs', label: 'Production Cost Calc', icon: Calculator, roles: ['plant_manager', 'production_manager'] },
        { id: 'simulation', path: '/simulation', label: 'What-If Simulation', icon: Sliders, roles: ['plant_manager', 'production_manager'] }
      ]
    },
    {
      title: '4. Maintenance',
      id: 'group_maintenance',
      items: [
        { id: 'maintenance', path: '/maintenance', label: 'Predictive Maint & RUL', icon: Wrench, roles: ['plant_manager', 'maintenance_manager'] },
        { id: 'work_orders', path: '/work-orders', label: 'Maintenance Orders', icon: FileText, roles: ['plant_manager', 'maintenance_manager'] },
        { id: 'downtime', path: '/downtime', label: 'Downtime Analytics', icon: AlertOctagon, roles: ['plant_manager', 'production_manager', 'maintenance_manager'] }
      ]
    },
    {
      title: '5. Inventory & Energy',
      id: 'group_inventory_energy',
      items: [
        { id: 'inventory', path: '/inventory', label: 'Smart Inventory', icon: PackageCheck, roles: ['plant_manager', 'production_manager'] },
        { id: 'energy', path: '/energy', label: 'Energy Monitoring', icon: Zap, roles: ['plant_manager', 'production_manager', 'maintenance_manager'] }
      ]
    },
    {
      title: '6. Quality',
      id: 'group_quality',
      items: [
        { id: 'quality', path: '/quality', label: 'Vision Inspection', icon: ScanEye, roles: ['plant_manager', 'quality_manager'] }
      ]
    },
    {
      title: '7. Workforce',
      id: 'group_workforce',
      items: [
        { id: 'operators', path: '/operators', label: 'Operator Matrix', icon: Users, roles: ['plant_manager', 'production_manager', 'operator'] },
        { id: 'attendance', path: '/attendance', label: 'Workstation Check-In', icon: Users, roles: ['plant_manager', 'production_manager', 'operator'] }
      ]
    },
    {
      title: '8. AI Insights',
      id: 'group_ai_insights',
      items: [
        { id: 'forecasting', path: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp, roles: ['plant_manager', 'production_manager'] }
      ]
    },
    {
      title: '9. Reports',
      id: 'group_reports',
      items: [
        { id: 'reports', path: '/reports', label: 'Shift Logs & Reports', icon: FileText, roles: ['plant_manager', 'production_manager', 'quality_manager'] }
      ]
    },
    {
      title: '10. Security',
      id: 'group_security',
      items: [
        { id: 'audit_logs', path: '/audit-logs', label: 'Security Audit Trail', icon: ShieldCheck, roles: ['plant_manager', 'maintenance_manager'] }
      ]
    },
    {
      title: '11. Settings',
      id: 'group_settings',
      items: [
        { id: 'settings', path: '/command-center', label: 'Factory Settings', icon: Settings, roles: ['plant_manager'] }
      ]
    }
  ];

  // Track expanded groups (all open by default for rapid plant navigation)
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleNavClick = (item) => {
    if (setActiveTab) setActiveTab(item.id);
    navigate(item.path);
  };

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      padding: '16px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: 'calc(100vh - 70px)',
      position: 'sticky',
      top: '70px',
      overflowY: 'auto'
    }}>
      <div style={{ padding: '0 8px 6px 8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Factory Operations Navigation
      </div>

      {navigationGroups.map((group) => {
        // Filter visible items by role
        const visibleItems = group.items.filter(item => 
          role === 'plant_manager' || (item.roles && item.roles.includes(role))
        );

        if (visibleItems.length === 0) return null;

        const isCollapsed = collapsedGroups[group.id];

        return (
          <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '5px 8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '6px',
                textAlign: 'left'
              }}
            >
              <span>{group.title}</span>
              {isCollapsed ? <ChevronRight size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
            </button>

            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '4px' }}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = 
                    location.pathname === item.path || 
                    (item.path === '/machines' && location.pathname.startsWith('/machines')) ||
                    (location.pathname === '/' && item.path === '/command-center') || 
                    activeTab === item.id;


                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
                        background: isActive ? '#172033' : 'transparent',
                        color: isActive ? '#38BDF8' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease, border-color 0.12s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={15} color={isActive ? '#38BDF8' : 'var(--text-muted)'} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
