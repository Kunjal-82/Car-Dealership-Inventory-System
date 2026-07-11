import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PlusCircle, RefreshCw, Car } from 'lucide-react';

export default function AdminDashboard({ showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Vehicle Form State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  // Restock Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState('new');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [submittingInventory, setSubmittingInventory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, inventoriesData] = await Promise.all([
        api.get('/vehicles'),
        api.get('/inventory')
      ]);
      setVehicles(vehiclesData);
      setInventories(inventoriesData);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update form fields when restocking vehicle or inventory changes
  useEffect(() => {
    if (selectedInventoryId === 'new') {
      setColor('');
      setQuantity('');
      setPrice('');
    } else {
      const inv = inventories.find(i => i.id === selectedInventoryId);
      if (inv) {
        setColor(inv.color);
        setQuantity(inv.quantity);
        setPrice(inv.price);
      }
    }
  }, [selectedInventoryId]);

  // Reset variant dropdown when vehicle selection changes
  useEffect(() => {
    setSelectedInventoryId('new');
    setColor('');
    setQuantity('');
    setPrice('');
  }, [selectedVehicleId]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!make || !model || !category) {
      showToast('Make, model, and category are required', 'error');
      return;
    }

    try {
      setSubmittingVehicle(true);
      await api.post('/vehicles', { make, model, category, description });
      showToast(`${make} ${model} added to catalog!`, 'success');
      setMake('');
      setModel('');
      setCategory('');
      setDescription('');
      fetchData(); // reload dropdowns
    } catch (err) {
      showToast(err.message || 'Failed to add vehicle', 'error');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleRestockInventory = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      showToast('Please select a vehicle', 'error');
      return;
    }

    if (selectedInventoryId === 'new' && !color) {
      showToast('Color is required for new variants', 'error');
      return;
    }

    if (quantity === '' || price === '') {
      showToast('Quantity and Price are required', 'error');
      return;
    }

    try {
      setSubmittingInventory(true);
      if (selectedInventoryId === 'new') {
        // Create new variant
        await api.post('/inventory', {
          vehicleId: selectedVehicleId,
          color,
          quantity: Number(quantity),
          price: Number(price)
        });
        showToast('New color variant inventory added!', 'success');
      } else {
        // Restock existing variant
        await api.put(`/inventory/${selectedInventoryId}`, {
          quantity: Number(quantity),
          price: Number(price),
          color // support renaming color if needed
        });
        showToast('Inventory restocked successfully!', 'success');
      }
      
      // Reset inventory form
      setSelectedVehicleId('');
      setSelectedInventoryId('new');
      setColor('');
      setQuantity('');
      setPrice('');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to manage inventory', 'error');
    } finally {
      setSubmittingInventory(false);
    }
  };

  // Filter inventories to show only selected vehicle variants
  const activeVehicleInventories = inventories.filter(inv => {
    const invVehicleId = inv.vehicleId?._id || inv.vehicleId?.id || inv.vehicleId;
    return invVehicleId === selectedVehicleId;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
          <p>Register vehicle models and control dealer inventory stocks</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', color: 'var(--accent)' }}>
          Loading dashboard controls...
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Add Vehicle Panel */}
          <div className="admin-panel">
            <h3>
              <Car size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Add New Vehicle Model
            </h3>
            
            <form onSubmit={handleAddVehicle}>
              <div className="form-group">
                <label className="form-label">Brand / Make</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ford, Tesla, Porsche"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mustang, Model S, 911 GT3"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sedan, SUV, Coupe, Electric"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide vehicle specifications, features, and engine details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={submittingVehicle}
              >
                <PlusCircle size={16} />
                {submittingVehicle ? 'Adding Vehicle...' : 'Register Vehicle'}
              </button>
            </form>
          </div>

          {/* Restock Inventory Panel */}
          <div className="admin-panel">
            <h3>
              <RefreshCw size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Restock & Manage Inventory
            </h3>

            <form onSubmit={handleRestockInventory}>
              {/* Select Vehicle */}
              <div className="form-group">
                <label className="form-label">Select Vehicle Model</label>
                <select
                  className="form-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.category})</option>
                  ))}
                </select>
              </div>

              {selectedVehicleId && (
                <>
                  {/* Select Variant */}
                  <div className="form-group">
                    <label className="form-label">Inventory Variant</label>
                    <select
                      className="form-select"
                      value={selectedInventoryId}
                      onChange={(e) => setSelectedInventoryId(e.target.value)}
                      required
                    >
                      <option value="new">[+] Add New Color Variant</option>
                      {activeVehicleInventories.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.color} (Current Stock: {inv.quantity} - Price: ${inv.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color Input */}
                  <div className="form-group">
                    <label className="form-label">Color Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Midnight Black, Pearl White"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                      disabled={selectedInventoryId !== 'new'} // lock color for editing (can write if we want but best is to lock it or let them edit)
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div className="form-group">
                    <label className="form-label">
                      {selectedInventoryId === 'new' ? 'Initial Stock Quantity' : 'Update Stock Quantity'}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label className="form-label">Price per Unit ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 45000"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={submittingInventory || !selectedVehicleId}
              >
                <RefreshCw size={16} />
                {submittingInventory 
                  ? 'Saving inventory...' 
                  : selectedInventoryId === 'new' ? 'Add Inventory Variant' : 'Restock / Update Variant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
