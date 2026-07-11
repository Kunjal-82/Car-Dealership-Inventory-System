import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Search, Filter, ShoppingBag, Edit, Trash2, X, AlertCircle } from 'lucide-react';

export default function Vehicles({ showToast }) {
  const { user, isAdmin, isCustomer } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Modals
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  // Admin Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const [vehiclesData, inventoriesData] = await Promise.all([
        api.get(`/vehicles/search${queryStr}`),
        api.get('/inventory')
      ]);

      setVehicles(vehiclesData);
      setInventories(inventoriesData);
    } catch (err) {
      showToast(err.message || 'Failed to load vehicle data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category]); // reload on category select

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Purchase flow
  const openPurchaseModal = (vehicle) => {
    const vehicleInventory = inventories.filter(inv => inv.vehicleId?._id === vehicle.id || inv.vehicleId === vehicle.id);
    setSelectedVehicle(vehicle);
    
    if (vehicleInventory.length > 0) {
      const firstAvailable = vehicleInventory.find(i => i.quantity > 0) || vehicleInventory[0];
      setSelectedInventory(firstAvailable);
    } else {
      setSelectedInventory(null);
    }
    
    setPurchaseQuantity(1);
    setPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedInventory) return;

    if (purchaseQuantity > selectedInventory.quantity) {
      showToast('Quantity exceeds available stock', 'error');
      return;
    }

    try {
      setSubmittingPurchase(true);
      await api.post(`/vehicles/${selectedVehicle.id}/purchase`, {
        color: selectedInventory.color,
        quantityPurchased: Number(purchaseQuantity)
      });
      showToast('Vehicle purchased successfully!', 'success');
      setPurchaseModalOpen(false);
      fetchData(); // refresh stocks
    } catch (err) {
      showToast(err.message || 'Purchase failed', 'error');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Admin Edit flow
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditMake(vehicle.make);
    setEditModel(vehicle.model);
    setEditCategory(vehicle.category);
    setEditDescription(vehicle.description || '');
    setEditModalOpen(true);
  };

  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEdit(true);
      await api.put(`/vehicles/${selectedVehicle.id}`, {
        make: editMake,
        model: editModel,
        category: editCategory,
        description: editDescription
      });
      showToast('Vehicle updated successfully', 'success');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Edit failed', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Admin Delete flow
  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle model? This will not affect past purchase records but removes it from the catalog.')) {
      try {
        await api.delete(`/vehicles/${vehicleId}`);
        showToast('Vehicle deleted successfully', 'success');
        fetchData();
      } catch (err) {
        showToast(err.message || 'Delete failed', 'error');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Vehicle Showroom</h1>
          <p>Browse our luxury collection and order your dream drive</p>
        </div>
      </div>

      {/* Search and filter controls */}
      <form onSubmit={handleSearchSubmit} className="search-bar-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Search by make or model (e.g. Toyota, Mustang)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Sport', 'Van', 'Off-Road', 'Pickup'].map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          <Search size={18} />
          Search
        </button>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', color: 'var(--accent)' }}>
          Loading vehicles...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <h3>No Vehicles Available</h3>
          <p>We couldn't find any vehicles matching your search criteria. Check back later or try adjusting filters.</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => {
            // Get inventories for this vehicle
            const vehicleInventory = inventories.filter(inv => {
              const invVehicleId = inv.vehicleId?._id || inv.vehicleId?.id || inv.vehicleId;
              return invVehicleId === vehicle.id;
            });

            return (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-image-placeholder">
                  <span className="vehicle-category-badge">{vehicle.category}</span>
                  <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 10px rgba(102,252,241,0.3))' }}>🏎️</div>
                </div>
                
                <div className="vehicle-info">
                  <h3 className="vehicle-title">{vehicle.make} {vehicle.model}</h3>
                  <p className="vehicle-desc">{vehicle.description || 'No description provided.'}</p>
                  
                  <div className="vehicle-meta">
                    <h4 className="inventory-section-title">Available Colors & Pricing</h4>
                    <div className="color-stocks">
                      {vehicleInventory.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--error)', fontStyle: 'italic' }}>
                          Out of stock / No inventory added
                        </div>
                      ) : (
                        vehicleInventory.map(inv => (
                          <div
                            key={inv.id}
                            className={`color-stock-item ${inv.quantity === 0 ? 'out-of-stock' : ''}`}
                          >
                            <span style={{ fontWeight: '500' }}>{inv.color}</span>
                            <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', color: 'var(--accent)' }}>
                                ${inv.price.toLocaleString()}
                              </span>
                              <span className={`stock-tag ${inv.quantity > 0 ? 'in' : 'out'}`}>
                                {inv.quantity > 0 ? `${inv.quantity} left` : 'Sold Out'}
                              </span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="vehicle-actions">
                      {isCustomer && (
                        <button
                          className="btn btn-primary"
                          onClick={() => openPurchaseModal(vehicle)}
                          disabled={!vehicleInventory.some(i => i.quantity > 0)}
                        >
                          <ShoppingBag size={16} />
                          Purchase
                        </button>
                      )}
                      
                      {isAdmin && (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditModal(vehicle)}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
                      )}

                      {!user && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => showToast('Please register or log in to purchase vehicles', 'error')}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Purchase Modal */}
      {purchaseModalOpen && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-icon modal-close" onClick={() => setPurchaseModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">Complete Purchase</h2>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Selected Model</p>
              <h3 style={{ fontSize: '1.4rem' }}>{selectedVehicle.make} {selectedVehicle.model}</h3>
            </div>

            <form onSubmit={handleConfirmPurchase}>
              {/* Color Selection */}
              <div className="form-group">
                <label className="form-label">Select Color Variant</label>
                <select
                  className="form-select"
                  value={selectedInventory ? selectedInventory.id : ''}
                  onChange={(e) => {
                    const inv = inventories.find(i => i.id === e.target.value);
                    setSelectedInventory(inv);
                    setPurchaseQuantity(1);
                  }}
                  required
                >
                  <option value="" disabled>-- Choose a Color --</option>
                  {inventories
                    .filter(inv => {
                      const invVehicleId = inv.vehicleId?._id || inv.vehicleId?.id || inv.vehicleId;
                      return invVehicleId === selectedVehicle.id;
                    })
                    .map(inv => (
                      <option key={inv.id} value={inv.id} disabled={inv.quantity === 0}>
                        {inv.color} (${inv.price.toLocaleString()} - {inv.quantity} in stock) {inv.quantity === 0 ? '[SOLD OUT]' : ''}
                      </option>
                    ))}
                </select>
              </div>

              {selectedInventory && (
                <>
                  {/* Quantity Selection */}
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max={selectedInventory.quantity}
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, Math.min(selectedInventory.quantity, Number(e.target.value))))}
                      required
                    />
                  </div>

                  {/* Summary Box */}
                  <div style={{
                    background: 'rgba(11, 12, 16, 0.4)',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(69, 162, 158, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Unit Price:</span>
                      <span style={{ fontWeight: '600' }}>${selectedInventory.price.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifycontent: 'space-between', borderTop: '1px solid rgba(69, 162, 158, 0.1)', paddingTop: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: '700' }}>Total Cost:</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.2rem' }}>
                        ${(selectedInventory.price * purchaseQuantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submittingPurchase || !selectedInventory}
              >
                {submittingPurchase ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {editModalOpen && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-icon modal-close" onClick={() => setEditModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">Edit Vehicle details</h2>

            <form onSubmit={handleConfirmEdit}>
              <div className="form-group">
                <label className="form-label">Make</label>
                <input
                  type="text"
                  className="form-input"
                  value={editMake}
                  onChange={(e) => setEditMake(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model</label>
                <input
                  type="text"
                  className="form-input"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Category --</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Sport">Sport</option>
                  <option value="Van">Van</option>
                  <option value="Off-Road">Off-Road</option>
                  <option value="Pickup">Pickup</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submittingEdit}
              >
                {submittingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
