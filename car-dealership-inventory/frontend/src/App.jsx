import React, { useState, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Vehicles from './pages/Vehicles';
import PurchaseHistory from './pages/PurchaseHistory';
import AdminDashboard from './pages/AdminDashboard';
import { Car, ShoppingBag, History, Lock, LogOut, User, Menu } from 'lucide-react';

function Navigation({ showToast }) {
  const { user, logout, isAdmin, isCustomer } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">
        <Car size={24} style={{ color: 'var(--accent)' }} />
        <span>AutoVault</span>
      </NavLink>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          Showroom
        </NavLink>

        {user && (
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {isAdmin ? 'Sales Ledger' : 'Purchase History'}
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Admin Dashboard
          </NavLink>
        )}

        {user ? (
          <div className="nav-user">
            <div className="user-tag">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <>
            <NavLink to="/login" className="btn btn-secondary">
              Log In
            </NavLink>
            <NavLink to="/register" className="btn btn-primary">
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <div className="app-container">
      <Navigation showToast={showToast} />
      
      <main className="container">
        <Routes>
          <Route path="/" element={<Vehicles showToast={showToast} />} />
          <Route path="/login" element={<Login showToast={showToast} />} />
          <Route path="/register" element={<Register showToast={showToast} />} />
          
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <PurchaseHistory showToast={showToast} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard showToast={showToast} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
