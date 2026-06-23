import React, { useState, useEffect } from 'react';
import './App.css';
import * as api from './api';
import { getErrorMessage } from './utils/errorHandler';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import StockAdjustmentForm from './components/StockAdjustmentForm';
import RunwayPlanner from './components/RunwayPlanner';
import SupplierManager from './components/SupplierManager';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import FeedbackModal from './components/FeedbackModal';
import Billing from './components/Billing';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

const ENABLE_REFERRALS = import.meta.env.VITE_ENABLE_REFERRALS === 'true';
import Contact from './components/Contact';

function App() {
  const [authView, setAuthView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    if (path === '/contact') return 'contact';
    if (path === '/register') return 'register';
    if (path === '/login') return 'login';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/reset-password') return 'reset-password';

    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('inviteCode')) {
      return 'register';
    }
    return 'landing';
  });

  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    if (path === '/contact') return 'contact';
    return 'dashboard';
  });

  const [showModal, setShowModal] = useState(null); // 'add', 'edit', 'adjust', 'feedback'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Check for existing session
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      api.getCategories()
        .then(res => setCategories(res.data))
        .catch(err => {
          console.error(err);
          showToast('Failed to load categories');
        });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setSelectedProduct(null);
  };

  const navigateTo = (target) => {
    if (user) {
      setView(target);
    } else {
      setAuthView(target);
    }
    const publicPaths = ['privacy', 'terms', 'contact', 'register', 'login', 'forgot-password', 'reset-password'];
    const newPath = publicPaths.includes(target) ? `/${target}` : '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Inventory', icon: '📦' },
    { id: 'runway', label: 'Runway', icon: '📡' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  // Public / auth pages (no user)
  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage 
          onLogin={() => setAuthView('login')} 
          onRegister={() => setAuthView('register')} 
          onNavigate={navigateTo}
        />
      );
    }
    if (authView === 'privacy') {
      return <PrivacyPolicy onBack={() => navigateTo('landing')} />;
    }
    if (authView === 'terms') {
      return <TermsOfService onBack={() => navigateTo('landing')} />;
    }
    if (authView === 'contact') {
      return <Contact onBack={() => navigateTo('landing')} />;
    }
    return (
      <div className="auth-container">
        {authView === 'login' ? (
          <Login onLogin={setUser} onSwitchToRegister={() => setAuthView('register')} onSwitchToForgotPassword={() => setAuthView('forgot-password')} />
        ) : authView === 'forgot-password' ? (
          <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />
        ) : authView === 'reset-password' ? (
          <ResetPassword onSwitchToLogin={() => setAuthView('login')} />
        ) : (
          <Register onRegister={setUser} onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  // Authenticated app layout
  return (
    <div className="app-layout">
      {!isOnline && (
        <div className="offline-banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
          Working Offline — Changes will sync when you are back online.
        </div>
      )}
      {toast && <div className="apple-toast">{toast}</div>}

      {/* Desktop Sidebar */}
      <aside className="app-sidebar" style={!isOnline ? { marginTop: '36px', height: 'calc(100vh - 36px)' } : {}}>
        <div className="app-sidebar-brand">SmartTrack</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.email ? user.email.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{user.email}</div>
              <div className="sidebar-user-plan">
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="apple-btn apple-btn-ghost apple-btn-sm"
                    style={{ padding: '2px 0', fontSize: '11px', color: 'var(--apple-blue)', minHeight: 'auto' }}
                  >
                    Install App
                  </button>
                )}
              </div>
            </div>
          </div>
          <button 
            className="sidebar-nav-item" 
            onClick={handleLogout}
            style={{ marginTop: '4px', color: 'var(--apple-system-gray)' }}
          >
            <span className="nav-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav" style={!isOnline ? { bottom: '36px' } : {}}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          className={`mobile-nav-item ${showModal === 'feedback' ? 'active' : ''}`}
          onClick={() => setShowModal('feedback')}
        >
          <span className="nav-icon">💬</span>
          Feedback
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-area" style={!isOnline ? { paddingTop: '56px' } : {}}>
        {/* Header actions */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="h1">
              {view === 'dashboard' ? 'Dashboard' : view === 'products' ? 'Inventory' : view === 'runway' ? 'Runway & Restock' : view === 'suppliers' ? 'Suppliers' : 'Billing'}
            </div>
            <div className="subhead">
              {view === 'dashboard' && 'Overview of your inventory'}
              {view === 'products' && 'Manage your products and stock levels'}
              {view === 'runway' && 'Inventory runway, risk analysis, and restock planning'}
              {view === 'suppliers' && 'Manage your vendors and their lead times'}
              {view === 'billing' && 'Manage your subscription'}
            </div>
          </div>
          <div className="page-header-actions">
            <button 
              className="apple-btn apple-btn-ghost" 
              onClick={() => setShowModal('feedback')}
            >
              💬 Feedback
            </button>
            {deferredPrompt && (
              <button 
                className="apple-btn apple-btn-primary apple-btn-sm"
                onClick={handleInstallClick}
              >
                Install App
              </button>
            )}
          </div>
        </div>

        {/* Views */}
        {view === 'dashboard' ? (
          <Dashboard user={user} onAdjustStock={(p) => { setSelectedProduct(p); setShowModal('adjust'); }} />
        ) : view === 'products' ? (
          <ProductList 
            categories={categories}
            onAdd={() => setShowModal('add')}
            onEdit={(p) => { setSelectedProduct(p); setShowModal('edit'); }}
            onAdjustStock={(p) => { setSelectedProduct(p); setShowModal('adjust'); }}
          />
        ) : view === 'runway' ? (
          <RunwayPlanner user={user} />
        ) : view === 'suppliers' ? (
          <SupplierManager />
        ) : view === 'billing' ? (
          <Billing />
        ) : view === 'privacy' ? (
          <PrivacyPolicy onBack={() => setView('dashboard')} />
        ) : view === 'terms' ? (
          <TermsOfService onBack={() => setView('dashboard')} />
        ) : view === 'contact' ? (
          <Contact onBack={() => setView('dashboard')} />
        ) : (
          <div className="error-container">
            <div className="h3" style={{ marginBottom: '12px' }}>Page Not Found</div>
            <button className="apple-btn apple-btn-primary" onClick={() => setView('dashboard')}>
              Go to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal === 'add' && (
        <ProductForm 
          title="Add Product"
          categories={categories}
          onClose={handleCloseModal}
          onSubmit={async (data) => {
            try {
              await api.createProduct(data);
              handleCloseModal();
              showToast('Product added successfully');
              window.location.reload();
            } catch (err) {
              showToast(getErrorMessage(err, 'Failed to add product'));
            }
          }}
        />
      )}

      {showModal === 'edit' && (
        <ProductForm 
          title="Edit Product"
          product={selectedProduct}
          categories={categories}
          onClose={handleCloseModal}
          onSubmit={async (data) => {
            try {
              await api.updateProduct(selectedProduct.id, data);
              handleCloseModal();
              showToast('Product updated successfully');
              window.location.reload();
            } catch (err) {
              showToast(getErrorMessage(err, 'Failed to update product'));
            }
          }}
        />
      )}

      {showModal === 'adjust' && (
        <StockAdjustmentForm 
          product={selectedProduct}
          onClose={handleCloseModal}
          onSubmit={async (data) => {
            try {
              await api.adjustStock({ ...data, product_id: selectedProduct.id });
              handleCloseModal();
              showToast('Stock adjusted successfully');
              window.location.reload();
            } catch (err) {
              showToast(getErrorMessage(err, 'Failed to adjust stock'));
            }
          }}
        />
      )}

      {showModal === 'feedback' && (
        <FeedbackModal 
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default App;