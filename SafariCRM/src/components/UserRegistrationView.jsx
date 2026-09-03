import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  User, 
  Car, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  Copy, 
  Key, 
  QrCode, 
  AlertCircle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  isFirebaseConfigured, 
  getFirebaseConfig, 
  saveFirebaseConfig 
} from '../utils/firebaseAuth';

export default function UserRegistrationView({ 
  onLoginSuccess, 
  drivers = [], 
  cars = [], 
  onCancel 
}) {
  const [activeMode, setActiveMode] = useState('register'); // 'register' | 'login'
  
  // Registration Form State
  const [role, setRole] = useState('driver'); // 'driver' | 'freelancer' | 'operations'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+971');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedCarPlate, setSelectedCarPlate] = useState('');
  const [customDetail, setCustomDetail] = useState(''); // Driver license # or new car plate or operation station
  
  // OTP State
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpResponse, setOtpResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Firebase Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [fbConfig, setFbConfig] = useState(getFirebaseConfig());

  // Registration link for copying
  const registrationLink = window.location.origin + window.location.pathname + '#/register';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setStatusMessage('');

    if (activeMode === 'register' && !name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!phone.trim() || phone.trim() === '+971') {
      setError('Please enter a valid WhatsApp / Phone number with country code (e.g. +971501234567).');
      return;
    }

    if (activeMode === 'register' && role === 'driver' && !selectedDriverId && !name.trim()) {
      setError('Please select or specify your driver profile.');
      return;
    }

    if (activeMode === 'register' && role === 'freelancer' && !selectedCarPlate && !customDetail.trim()) {
      setError('Please choose or enter your car plate number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPhoneOtp(phone, 'recaptcha-container');
      if (res.success) {
        setOtpResponse(res);
        setStep('otp');
        setStatusMessage(res.message);
      } else {
        throw new Error(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error("sendPhoneOtp failed:", err);
      setError(err.message || 'Error triggering phone authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyPhoneOtp(otpResponse, otpCode);
      if (result.success) {
        // Read existing registered users
        const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');
        const cleanPhone = (result.phoneNumber || phone).replace(/[\s-]/g, '');

        if (activeMode === 'register') {
          // Resolve linked profile name / ID
          let linkedId = '';
          let linkedCarPlate = '';
          let displayName = name.trim();

          if (role === 'driver') {
            const matchedDriver = drivers.find(d => d.id === selectedDriverId);
            linkedId = matchedDriver ? matchedDriver.id : ('drv_' + Date.now());
            if (matchedDriver && !displayName) displayName = matchedDriver.name;
          } else if (role === 'freelancer') {
            linkedCarPlate = selectedCarPlate || customDetail.trim().toUpperCase();
          }

          const newUser = {
            id: 'usr_' + Date.now(),
            name: displayName,
            phone: cleanPhone,
            role,
            linkedDriverId: linkedId,
            linkedCarPlate: linkedCarPlate,
            createdAt: new Date().toISOString(),
            status: 'active'
          };

          // Update or add
          const updatedUsers = [...registeredUsers.filter(u => u.phone !== cleanPhone), newUser];
          localStorage.setItem('safari_registered_users', JSON.stringify(updatedUsers));

          // Authenticate immediately
          sessionStorage.setItem('safari_admin_authenticated', 'true');
          sessionStorage.setItem('safari_user_role', role);
          sessionStorage.setItem('safari_user_phone', cleanPhone);
          sessionStorage.setItem('safari_current_user', JSON.stringify(newUser));

          onLoginSuccess(role, 'roar', newUser);
        } else {
          // Login Mode: find matching user by phone
          const matchedUser = registeredUsers.find(u => u.phone === cleanPhone || cleanPhone.endsWith(u.phone.replace('+971', '')));
          
          if (!matchedUser) {
            throw new Error(`No registered account found for ${cleanPhone}. Please switch to "New Registration" tab first.`);
          }

          sessionStorage.setItem('safari_admin_authenticated', 'true');
          sessionStorage.setItem('safari_user_role', matchedUser.role);
          sessionStorage.setItem('safari_user_phone', cleanPhone);
          sessionStorage.setItem('safari_current_user', JSON.stringify(matchedUser));

          onLoginSuccess(matchedUser.role, 'roar', matchedUser);
        }
      }
    } catch (err) {
      console.error("verifyOtp error:", err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFirebaseKeys = (e) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setShowConfigModal(false);
    alert("Firebase Auth configuration saved successfully!");
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(circle at 10% 10%, #fdfbf7 0%, #ede6d9 100%)',
      fontFamily: 'var(--font-body, system-ui, sans-serif)'
    }}>
      {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        border: '1.5px solid #ede6d9',
        borderRadius: '20px',
        boxShadow: '0 12px 36px rgba(84, 60, 43, 0.08)',
        padding: '32px',
        boxSizing: 'border-box'
      }}>
        {/* Top Header & Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(140, 91, 48, 0.08)',
            border: '1px solid rgba(140, 91, 48, 0.2)',
            color: 'var(--primary, #8c5b30)',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '900',
            color: '#543c2b',
            fontFamily: 'var(--font-heading)'
          }}>
            Portal Access & Registration
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#8c7361' }}>
            WhatsApp & Phone Authentication with Firebase
          </p>
        </div>

        {/* Mode Selector: Register vs Login */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: '#fdfbf7',
          border: '1.5px solid #ede6d9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveMode('register'); setStep('form'); setError(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              background: activeMode === 'register' ? '#8c5b30' : 'transparent',
              color: activeMode === 'register' ? '#ffffff' : '#8c7361',
              transition: 'all 0.2s'
            }}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('login'); setStep('form'); setError(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              background: activeMode === 'login' ? '#8c5b30' : 'transparent',
              color: activeMode === 'login' ? '#ffffff' : '#8c7361',
              transition: 'all 0.2s'
            }}
          >
            Phone Login
          </button>
        </div>

        {/* Status / Alert Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: '#b91c1c',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div style={{
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#15803d',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            {statusMessage}
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeMode === 'register' && (
              <>
                {/* Role Picker */}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#543c2b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Select Your Role
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div 
                      onClick={() => setRole('driver')}
                      style={{
                        padding: '12px 6px',
                        border: role === 'driver' ? '2px solid #8c5b30' : '1.5px solid #ede6d9',
                        borderRadius: '10px',
                        background: role === 'driver' ? 'rgba(140, 91, 48, 0.06)' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <User size={20} style={{ color: role === 'driver' ? '#8c5b30' : '#8c7361', margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: role === 'driver' ? '#543c2b' : '#8c7361' }}>Driver</div>
                      <div style={{ fontSize: '10px', color: '#a08875' }}>My Bookings</div>
                    </div>

                    <div 
                      onClick={() => setRole('freelancer')}
                      style={{
                        padding: '12px 6px',
                        border: role === 'freelancer' ? '2px solid #8c5b30' : '1.5px solid #ede6d9',
                        borderRadius: '10px',
                        background: role === 'freelancer' ? 'rgba(140, 91, 48, 0.06)' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Car size={20} style={{ color: role === 'freelancer' ? '#8c5b30' : '#8c7361', margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: role === 'freelancer' ? '#543c2b' : '#8c7361' }}>Freelancer</div>
                      <div style={{ fontSize: '10px', color: '#a08875' }}>Car & Ledger</div>
                    </div>

                    <div 
                      onClick={() => setRole('operations')}
                      style={{
                        padding: '12px 6px',
                        border: role === 'operations' ? '2px solid #8c5b30' : '1.5px solid #ede6d9',
                        borderRadius: '10px',
                        background: role === 'operations' ? 'rgba(140, 91, 48, 0.06)' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <QrCode size={20} style={{ color: role === 'operations' ? '#8c5b30' : '#8c7361', margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: role === 'operations' ? '#543c2b' : '#8c7361' }}>Operations</div>
                      <div style={{ fontSize: '10px', color: '#a08875' }}>QR Scanner</div>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="form-group">
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Full Name *"
                    title="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Role Specific Assignment Fields */}
                {role === 'driver' && (
                  <div className="form-group">
                    <select
                      className="form-control"
                      title="Link to Fleet Driver Profile"
                      value={selectedDriverId}
                      onChange={(e) => {
                        setSelectedDriverId(e.target.value);
                        const match = drivers.find(d => d.id === e.target.value);
                        if (match && !name) setName(match.name);
                      }}
                    >
                      <option value="">Link Existing Driver Profile (or enter name above)</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>Driver: {d.name} ({d.phone || 'No phone'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {role === 'freelancer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <select
                        className="form-control"
                        title="Choose Registered Vehicle Plate"
                        value={selectedCarPlate}
                        onChange={(e) => setSelectedCarPlate(e.target.value)}
                      >
                        <option value="">Choose Car Plate</option>
                        {cars.map(c => (
                          <option key={c.id || c.plate} value={c.plate}>
                            {c.plate} - {c.model || c.brand}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Or Type Plate (e.g. BB23370)"
                        title="Plate Number"
                        value={customDetail}
                        onChange={(e) => setCustomDetail(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {role === 'operations' && (
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Station / Terminal Location (e.g. Desert Camp Gate 1)"
                      title="Terminal Location"
                      value={customDetail}
                      onChange={(e) => setCustomDetail(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Phone / WhatsApp Input */}
            <div className="form-group">
              <input
                type="tel"
                required
                className="form-control"
                placeholder="WhatsApp / Phone Number * (+97150...)"
                title="WhatsApp / Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              {loading ? (
                'Sending OTP...'
              ) : (
                <>
                  <span>Send WhatsApp / SMS Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: '#fdfbf7',
              border: '1.5px solid #ede6d9',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12.5px', color: '#8c7361', marginBottom: '6px' }}>
                Verification code sent to
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b' }}>
                {otpResponse?.formattedPhone || phone}
              </div>
              {otpResponse?.demoCode && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(140, 91, 48, 0.08)', borderRadius: '6px', fontSize: '11px', color: '#8c5b30', fontWeight: '700' }}>
                  Demo Code: {otpResponse.demoCode}
                </div>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                className="form-control"
                placeholder="Enter 6-digit Code (e.g. 123456)"
                title="6-digit Verification Code"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: '900' }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setStep('form'); setOtpCode(''); setError(''); }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Actions: Share link & Firebase Config */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #ede6d9',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: copiedLink ? '#15803d' : '#8c5b30',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <Copy size={13} />
              {copiedLink ? 'Copied Registration Link!' : 'Share Registration Link'}
            </button>

            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: '#8c7361',
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <Settings size={12} />
              Firebase Config
            </button>
          </div>

          {onCancel && (
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8c7361',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Return to Admin Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Config Modal */}
      {showConfigModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1.5px solid #ede6d9', paddingBottom: '10px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b', margin: 0 }}>
                Firebase Phone Auth Keys
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="modal-close">&times;</button>
            </div>

            <p style={{ fontSize: '12px', color: '#8c7361', marginBottom: '14px', lineHeight: '1.5' }}>
              Enter your Firebase Web App credentials from the Firebase Console (with Phone Auth enabled). If left empty, the system operates in built-in Demo OTP sandbox mode.
            </p>

            <form onSubmit={handleSaveFirebaseKeys} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Firebase API Key (apiKey)"
                  title="Firebase API Key"
                  value={fbConfig.apiKey || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Auth Domain (projectId.firebaseapp.com)"
                  title="Auth Domain"
                  value={fbConfig.authDomain || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Project ID (projectId)"
                  title="Project ID"
                  value={fbConfig.projectId || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="App ID (1:xxx:web:xxx)"
                  title="App ID"
                  value={fbConfig.appId || ''}
                  onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowConfigModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
