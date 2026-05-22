import React, { useState, useEffect } from 'react';
import './App.css';
import * as api from './api';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import StockAdjustmentForm from './components/StockAdjustmentForm';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
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
    const publicPaths = ['privacy', 'terms', 'contact'];
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
      <div className="App">
        {authView === 'login' ? (
          <Login onLogin={setUser} onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onRegister={setUser} onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      {!isOnline && (
        <div className="offline-banner">
          Working Offline - Changes will sync when you are back online.
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
      
      <nav>
        <div className="nav-brand">SmartTrack</div>
        <button 
          className={view === 'dashboard' ? 'active' : ''} 
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={view === 'products' ? 'active' : ''} 
          onClick={() => setView('products')}
        >
          Products
        </button>
        <button 
          className={view === 'billing' ? 'active' : ''} 
          onClick={() => setView('billing')}
        >
          Billing
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => setShowModal('feedback')}
          style={{ marginLeft: '10px', background: '#6c757d', fontSize: '0.8em' }}
        >
          Give Feedback
        </button>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick} 
            style={{ background: 'var(--success)', borderRadius: '4px', marginLeft: '10px' }}
          >
            Install App
          </button>
        )}
        <div className="user-info">
          <span>{user.email}</span>
          <button className="btn-link" style={{ color: 'white' }} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main>
        {view === 'dashboard' ? (
          <Dashboard onAdjustStock={(p) => { setSelectedProduct(p); setShowModal('adjust'); }} />
        ) : view === 'products' ? (
          <ProductList 
            categories={categories}
            onAdd={() => setShowModal('add')}
            onEdit={(p) => { setSelectedProduct(p); setShowModal('edit'); }}
            onAdjustStock={(p) => { setSelectedProduct(p); setShowModal('adjust'); }}
          />
        ) : view === 'billing' ? (
          <Billing />

       // ) : view === 'privacy' ? (
          <PrivacyPolicy onBack={() => setView('dashboard')} />
        ) : view === 'terms' ? (
          <TermsOfService onBack={() => setView('dashboard')} />
        ) : view === 'contact' ? (
          <Contact onBack={() => setView('dashboard')} />
        ) : (
          <div className="container mt-2">
            <h2>Page Not Found</h2>
            <button className="btn-primary" onClick={() => setView('dashboard')}>Go to Dashboard</button>
          </div>
        )}
      </main>

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
              // Simple way to refresh: toggle view or state. For now, reload.
              window.location.reload();
            } catch (err) {
              showToast(err.response?.data?.error || 'Failed to add product');
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
              showToast(err.response?.data?.error || 'Failed to update product');
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
              showToast(err.response?.data?.error || 'Failed to adjust stock');
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
