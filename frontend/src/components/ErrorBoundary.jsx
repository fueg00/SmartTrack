import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          padding: '40px', 
          textAlign: 'center',
          background: 'var(--apple-system-gray-6)',
          fontFamily: 'var(--font-family)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>📦🛠️</div>
          <h1 style={{ font: 'var(--font-h2)', margin: '0 0 12px 0', color: 'var(--apple-black)' }}>We're briefly down for maintenance.</h1>
          <p style={{ font: 'var(--font-body)', color: 'var(--apple-system-gray)', maxWidth: '400px', margin: '0 0 28px 0', lineHeight: 1.6 }}>
            We're currently updating SmartTrack to serve you better. We'll be back shortly.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="apple-btn apple-btn-primary"
            style={{ padding: '12px 32px', fontSize: '16px' }}
          >
            Retry
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ 
              textAlign: 'left', 
              marginTop: '40px', 
              background: 'rgba(0,0,0,0.05)', 
              padding: '16px', 
              borderRadius: '10px', 
              maxWidth: '100%', 
              overflowX: 'auto',
              font: '13px/1.5 ui-monospace, monospace',
              color: 'var(--apple-red)'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;