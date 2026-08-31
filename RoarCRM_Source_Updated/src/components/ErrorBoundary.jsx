import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'radial-gradient(at 0% 0%, rgba(140, 91, 48, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(140, 91, 48, 0.1) 0px, transparent 50%), #f5f3f0',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '550px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', marginBottom: '12px' }}>
              Oops! Something went wrong
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              The application encountered an unexpected runtime error. This might be due to corrupted local cache or outdated database configurations.
            </p>
            
            {this.state.error && (
              <pre style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                color: '#374151',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: '150px',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }}>
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#8c5b30',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '12px 24px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(140, 91, 48, 0.2)'
                }}
              >
                Reload Dashboard
              </button>
              <button 
                onClick={this.handleReset}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '30px',
                  padding: '12px 24px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reset Cache & Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
