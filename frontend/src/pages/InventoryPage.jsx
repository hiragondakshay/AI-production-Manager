import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  PackageCheck, AlertTriangle, RefreshCw, ShoppingCart, 
  CheckCircle2, IndianRupee, Layers, AlertCircle 
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInventory = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
      setSuccessMsg('');
      setErrorMsg('');
    }
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
      if (isManualRefresh) {
        setSuccessMsg('Inventory stock levels refetched and updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      if (isManualRefresh) {
        setErrorMsg('Failed to refresh inventory stock. Please verify backend connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReorder = async (itemId) => {
    setReorderingId(itemId);
    setErrorMsg('');
    try {
      await api.post(`/inventory/${itemId}/reorder?add_quantity=400`);
      setSuccessMsg('Material reorder placed successfully (+400 units added to stock).');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to reorder material:', err);
      setErrorMsg('Failed to process reorder request.');
    } finally {
      setReorderingId(null);
    }
  };

  // Calculated Metrics
  const totalMaterials = items.length;
  const lowStockItems = items.filter(i => i.stock_level > 0 && i.stock_level <= i.min_threshold);
  const outOfStockItems = items.filter(i => i.stock_level === 0);
  const totalInventoryValue = items.reduce((sum, item) => sum + (item.stock_level * item.unit_cost * 83.5), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PackageCheck size={26} color="var(--accent-cyan)" />
            <span>Raw Materials Inventory & Reorder Management (₹ INR)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time stock tracking, safety threshold alerts, unit cost evaluation & automated replenishment
          </p>
        </div>

        <button 
          onClick={() => fetchInventory(true)} 
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Stock'}</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Summary Cards (4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Materials</span>
            <Layers size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0' }} className="text-mono">
            {totalMaterials} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cataloged Raw & Spare Materials</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Items</span>
            <AlertTriangle size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: lowStockItems.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }} className="text-mono">
            {lowStockItems.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>At or below safety threshold</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Out of Stock</span>
            <AlertCircle size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: outOfStockItems.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }} className="text-mono">
            {outOfStockItems.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Items</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600 }}>Requires immediate replenishment</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Valuation</span>
            <IndianRupee size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--accent-emerald)' }} className="text-mono">
            ₹{Math.round(totalInventoryValue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluated INR stock value</div>
        </div>
      </div>

      {/* Active Low Stock Alerts Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>Active Low Stock Reorder Notifications ({lowStockItems.length + outOfStockItems.length})</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[...outOfStockItems, ...lowStockItems].map(item => (
              <div key={item.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px', borderLeft: `4px solid ${item.stock_level === 0 ? 'var(--accent-rose)' : 'var(--accent-amber)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.material_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Current: <strong style={{ color: item.stock_level === 0 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{item.stock_level} {item.unit}</strong> | Min Threshold: <strong>{item.min_threshold} {item.unit}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    Recommended Action: Reorder {item.material_name}.
                  </div>
                </div>

                <button
                  onClick={() => handleReorder(item.id)}
                  disabled={reorderingId === item.id}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <ShoppingCart size={14} />
                  <span>Reorder</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Inventory Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading raw material inventory records...
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Min Threshold</th>
                <th>Unit Cost</th>
                <th>Stock Value (₹)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isOutOfStock = item.stock_level === 0;
                const isLow = item.stock_level <= item.min_threshold && !isOutOfStock;
                const inrUnitCost = Math.round(item.unit_cost * 83.5);
                const itemValue = item.stock_level * inrUnitCost;

                let statusBadgeClass = 'badge-running';
                let statusLabel = 'IN STOCK';

                if (isOutOfStock) {
                  statusBadgeClass = 'badge-breakdown';
                  statusLabel = 'OUT OF STOCK';
                } else if (isLow) {
                  statusBadgeClass = 'badge-warning';
                  statusLabel = 'LOW STOCK';
                }

                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{item.material_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.category}</td>
                    <td className="text-mono" style={{ fontWeight: 700, color: isOutOfStock ? 'var(--accent-rose)' : isLow ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {item.stock_level.toLocaleString()} {item.unit}
                    </td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                      {item.min_threshold.toLocaleString()} {item.unit}
                    </td>
                    <td className="text-mono">₹{inrUnitCost.toLocaleString('en-IN')}</td>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      ₹{Math.round(itemValue).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleReorder(item.id)}
                        disabled={reorderingId === item.id}
                        className={isLow || isOutOfStock ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <ShoppingCart size={14} />
                        <span>{reorderingId === item.id ? 'Ordering...' : 'Order +400 Units'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
