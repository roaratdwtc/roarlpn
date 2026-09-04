import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      const email_lower = email.toLowerCase();
      
      // 1. Check Master Admin Credentials
      if (email_lower === 'abid@dxbaiseo.com' && password === 'D4dangerous3636!') {
        onLoginSuccess('master_admin');
        return;
      }
      
      // 2. Check Default Roar Company
      if (email_lower === 'info@roaradventuretourism.com' && password === 'R4roar!786*') {
        onLoginSuccess('company_admin', 'roar', {
          id: 'roar',
          name: 'Roar Adventure Tourism LLC',
          slug: 'roar',
          email: 'info@roaradventuretourism.com',
          whatsapp: '+97145578679',
          address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
          contactPerson: 'Mr. Abid Ali'
        });
        return;
      }

      // 3. Check Local Onboarded Companies
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const match = cached.find(c => c.email.toLowerCase() === email_lower && c.password === password);
      
      if (match) {
        if (match.status !== 'active') {
          setError('This company account has been suspended. Please contact platform support.');
          setLoading(false);
          return;
        }
        onLoginSuccess('company_admin', match.id, match);
      } else {
        setError('Invalid email address or security password. Please try again.');
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await res.json();

      if (res.ok && result.status === 'success') {
        const targetRole = result.role || (result.user?.role) || 'company_admin';
        const targetCompId = result.company_id || result.companyId || 'roar';
        const targetProfile = result.user || result.company;
        onLoginSuccess(targetRole, targetCompId, targetProfile);
      } else {
        throw new Error(result.message || 'Login failed.');
      }
    } catch (err) {
      console.warn("MySQL login request failed, falling back to local credentials...", err);
      
      const email_lower = email.toLowerCase();
      
      // 1. Check Master Admin Credentials
      if (email_lower === 'abid@dxbaiseo.com' && password === 'D4dangerous3636!') {
        onLoginSuccess('master_admin');
        return;
      }

      // 2. Check Registered System Users / Staff (Drivers, Freelancers, Operations) by Phone or Email
      const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');
      const cleanInput = email.trim();
      const inputDigits = cleanInput.replace(/\D/g, '');

      const matchedStaff = registeredUsers.find(u => {
        const uDigits = (u.phone || '').replace(/\D/g, '');
        const phoneMatch = inputDigits.length >= 7 && (uDigits.endsWith(inputDigits) || inputDigits.endsWith(uDigits));
        const emailMatch = u.email && u.email.toLowerCase() === email_lower;
        return phoneMatch || emailMatch;
      });

      if (matchedStaff) {
        if (matchedStaff.status === 'suspended') {
          setError('This account has been suspended. Please contact operations management.');
          setLoading(false);
          return;
        }
        if (matchedStaff.password && matchedStaff.password !== password) {
          setError('Incorrect security password for this phone number / account.');
          setLoading(false);
          return;
        }
        onLoginSuccess(matchedStaff.role, 'roar', matchedStaff);
        return;
      }
      
      // 3. Check Default Roar Company
      if (email_lower === 'info@roaradventuretourism.com' && password === 'R4roar!786*') {
        onLoginSuccess('company_admin', 'roar', {
          id: 'roar',
          name: 'Roar Adventure Tourism LLC',
          slug: 'roar',
          email: 'info@roaradventuretourism.com',
          whatsapp: '+97145578679',
          address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
          contactPerson: 'Mr. Abid Ali'
        });
        return;
      }

      // 4. Check Local Onboarded Companies
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const match = cached.find(c => c.email.toLowerCase() === email_lower && c.password === password);
      
      if (match) {
        if (match.status !== 'active') {
          setError('This company account has been suspended. Please contact platform support.');
          setLoading(false);
          return;
        }
        onLoginSuccess('company_admin', match.id, match);
      } else {
        setError('Invalid email / phone number or security password. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px', 
      background: 'radial-gradient(at 0% 0%, rgba(140, 91, 48, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(140, 91, 48, 0.1) 0px, transparent 50%), #f5f3f0' 
    }}>
      <div className="login-card">
        {/* Brand Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 24px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '16px' }}>
            <img src="/logo.jpg" alt="Roar Adventure Tourism" style={{ maxHeight: '48px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)' }}>
            Admin & Staff Portal Access
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Authenticate with your email or verified phone and security password
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid rgba(239, 68, 68, 0.15)', 
            color: '#ef4444', 
            padding: '12px', 
            borderRadius: '10px', 
            fontSize: '12.5px', 
            textAlign: 'left', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                className="form-control"
                placeholder="Email Address or Mobile Phone Number *"
                title="Email Address or Mobile Phone Number"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-control"
                placeholder="Security Password *"
                title="Security Password"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '14px', 
              justifyContent: 'center', 
              marginTop: '10px',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Secured ERP Node Connection &bull; Dubai, UAE
        </div>
      </div>
    </div>
  );
}
