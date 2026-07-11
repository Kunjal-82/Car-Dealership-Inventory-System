import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Tag, CreditCard, ShoppingCart } from 'lucide-react';

export default function PurchaseHistory({ showToast }) {
  const { user } = useContext(AuthContext);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await api.get('/purchases');
      setPurchases(data);
    } catch (err) {
      showToast(err.message || 'Failed to load purchase history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Purchase History</h1>
          <p>
            {user?.role === 'admin' 
              ? 'Comprehensive log of all vehicle acquisitions across the dealership' 
              : 'Review your vehicle acquisitions and transaction details'}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', color: 'var(--accent)' }}>
          Loading purchase records...
        </div>
      ) : purchases.length === 0 ? (
        <div className="empty-state">
          <h3>No Purchases Yet</h3>
          <p>
            {user?.role === 'admin' 
              ? 'No sales records have been recorded yet.' 
              : 'You have not purchased any vehicles yet. Head to the showroom to make your first deal!'}
          </p>
        </div>
      ) : (
        <div className="purchase-list">
          {purchases.map(purchase => {
            const inventory = purchase.inventoryId || {};
            const vehicle = inventory.vehicleId || {};
            const buyer = purchase.userId || {};

            return (
              <div key={purchase.id} className="purchase-card">
                <div className="purchase-vehicle-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <ShoppingCart size={18} className="text-accent" style={{ color: 'var(--accent)' }} />
                    <h4>
                      {vehicle.make ? `${vehicle.make} ${vehicle.model}` : 'Deleted Vehicle Model'}
                    </h4>
                  </div>
                  <p>Color: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{inventory.color || 'N/A'}</span></p>
                  
                  {user?.role === 'admin' && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
                      Customer: {buyer.name || 'Unknown'} ({buyer.email || 'N/A'})
                    </p>
                  )}
                </div>

                <div className="purchase-price-details">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Unit Price</p>
                  <p style={{ fontWeight: '600' }}>${purchase.unitPrice.toLocaleString()}</p>
                </div>

                <div className="purchase-price-details">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quantity / Total</p>
                  <p style={{ fontWeight: '700' }}>
                    {purchase.quantityPurchased}x {` `}
                    <span style={{ color: 'var(--accent)' }}>
                      (${purchase.totalPrice.toLocaleString()})
                    </span>
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="purchase-date" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} />
                    {new Date(purchase.purchaseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <span className={`status-badge ${purchase.status}`}>
                    {purchase.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
