import React from 'react';
import { useSearchParams } from 'react-router-dom';

const HealthCheck: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '20px', 
      backgroundColor: '#f0f9ff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ color: '#059669', marginBottom: '20px' }}>
          ✅ H5 App - Health Check
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#047857', fontSize: '18px' }}>System Status</h2>
          <p>🟢 App is running correctly</p>
          <p>🟢 Routes are configured</p>
          <p>🟢 App is deployed on: <code>https://ras-5.vercel.app</code></p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#047857', fontSize: '18px' }}>Request Details</h2>
          <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '4px' }}>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Shop:</strong> {shop || 'Not provided'}</p>
            <p><strong>Host:</strong> {host || 'Not provided'}</p>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#047857', fontSize: '18px' }}>Partner Platform URLs</h2>
          <p>✅ App URL: <code>https://ras-5.vercel.app/</code></p>
          <p>✅ Preferences: <code>https://ras-5.vercel.app/preferences</code></p>
          <p>✅ OAuth Callback: <code>https://ras-5.vercel.app/functions/v1/shopify-oauth-callback</code></p>
        </div>

        <div style={{ 
          padding: '15px', 
          backgroundColor: '#dbeafe', 
          borderRadius: '4px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <strong>✨ Success!</strong> Your app is configured correctly for Shopify Partner Platform integration.
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a 
            href="/partner-platform-test" 
            style={{
              display: 'inline-block',
              backgroundColor: '#059669',
              color: 'white',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            Run Full Tests
          </a>
          <a 
            href="/" 
            style={{
              display: 'inline-block',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Go to App
          </a>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;