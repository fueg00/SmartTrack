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
    // You could also log the error to an error reporting service here
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
          padding: '20px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '100px', marginBottom: '20px' }}>📦🛠️</div>
          <h1 style={{ margin: '0 0 10px 0' }}>We're briefly down for maintenance.</h1>
          <p style={{ color: '#666', margin: '0 0 20px 0', maxWidth: '400px' }}>
            We're currently updating SmartTrack to serve you better. We'll be back shortly.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0056b3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Retry
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ textAlign: 'left', marginTop: '40px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', maxWidth: '100%', overflowX: 'auto' }}>
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
