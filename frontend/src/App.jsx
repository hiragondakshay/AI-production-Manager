import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Existing Module Pages
import DashboardPage from './pages/DashboardPage';
import SchedulerPage from './pages/SchedulerPage';
import ForecastingPage from './pages/ForecastingPage';
import MaintenancePage from './pages/MaintenancePage';
import InventoryPage from './pages/InventoryPage';
import QualityControlPage from './pages/QualityControlPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import ManagerCommandCenter from './components/smart_factory/ManagerCommandCenter';

import MachineDetailPage from './pages/MachineDetailPage';
import ReportsPage from './pages/ReportsPage';

// New Enterprise Module Pages & Components
import AdvancedOEEDashboard from './components/enterprise/AdvancedOEEDashboard';
import DowntimeParetoAnalytics from './components/enterprise/DowntimeParetoAnalytics';
import MaintenanceWorkOrders from './components/enterprise/MaintenanceWorkOrders';
import WhatIfSimulator from './components/enterprise/WhatIfSimulator';
import EnergyMonitoring from './components/enterprise/EnergyMonitoring';
import ProductionCostCalculator from './components/enterprise/ProductionCostCalculator';
import OperatorPerformancePage from './components/enterprise/OperatorPerformancePage';
import AuditLogPage from './components/enterprise/AuditLogPage';

function RootRedirect() {
  const { user, loading } = useAuth();

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

  return user ? <Navigate to="/command-center" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('smart_factory');

  return (
    <AuthProvider>
      <ShiftProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes Container */}
          <Route element={<ProtectedRoute activeTab={activeTab} setActiveTab={setActiveTab} />}>
            <Route path="/command-center" element={<ManagerCommandCenter />} />
            <Route path="/machines" element={<DashboardPage />} />
            <Route path="/machines/:id" element={<MachineDetailPage />} />
            <Route path="/oee" element={<AdvancedOEEDashboard />} />
            <Route path="/downtime" element={<DowntimeParetoAnalytics />} />
            <Route path="/work-orders" element={<MaintenanceWorkOrders />} />
            <Route path="/simulation" element={<WhatIfSimulator />} />
            <Route path="/energy" element={<EnergyMonitoring />} />
            <Route path="/costs" element={<ProductionCostCalculator />} />
            <Route path="/operators" element={<OperatorPerformancePage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/forecasting" element={<ForecastingPage />} />
            <Route path="/quality" element={<QualityControlPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<AdminAttendancePage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
      </ShiftProvider>
    </AuthProvider>
  );
}

