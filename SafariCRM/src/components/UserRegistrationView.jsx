import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  User, 
  Car, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  formatPhoneNumber,
  syncUserToFirestore,
  markInviteUsedInFirestore
} from '../utils/firebaseAuth';

export default function UserRegistrationView({ 
  onLoginSuccess, 
  drivers = [], 
  cars = [], 
  onCancel 
}) {
  const [activeMode, setActiveMode] = useState('register'); // 'register' | 'login'
  
  // Invite-Only State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [verifiedInvite, setVerifiedInvite] = useState(null);
  const [inviteError, setInviteError] = useState('');

  // Registration Form State
  const [role, setRole] = useState('driver'); // 'driver' | 'freelancer' | 'operations'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+971');
  const [accountPassword, setAccountPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [selectedCarPlate, setSelectedCarPlate] = useState('');
  const [customDetail, setCustomDetail] = useState('');
  
  // OTP State
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpResponse, setOtpResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Check URL query parameters for invite code on mount
  useEffect(() => {
    try {
      const fullUrl = window.location.href;
      let urlInvite = '';

      if (fullUrl.includes('invite=')) {
        const afterInvite = fullUrl.split('invite=')[1];
        urlInvite = (afterInvite.split('&')[0] || '').trim();
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        urlInvite = (searchParams.get('invite') || '').trim();
      }

      if (urlInvite) {
        setInviteCodeInput(urlInvite);
        validateAndApplyInvite(urlInvite);
      }
    } catch (e) {
      console.warn("Failed to parse invite parameter:", e);
    }
  }, []);

  // Validate Invite Code against localStorage 'safari_invites'
  const validateAndApplyInvite = (rawCode) => {
    setInviteError('');
    const clean = (rawCode || '').trim().toUpperCase();

    if (!clean) {
      setVerifiedInvite(null);
      return false;
    }

    const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
    const match = storedInvites.find(i => (i.code || '').toUpperCase() === clean);

    if (!match) {
      setInviteError("Invalid invite code. Registration is strictly invite-only.");
      setVerifiedInvite(null);
      return false;
    }

    if (match.isUsed) {
      setInviteError("This invitation code has already been redeemed. Please request a new invite.");
      setVerifiedInvite(null);
      return false;
    }

    // Lock role and pre-fill details from invite
    setVerifiedInvite(match);
    setRole(match.role || 'driver');
    if (match.targetName) setName(match.targetName);
    if (match.targetPhone) setPhone(formatPhoneNumber(match.targetPhone));
    if (match.targetPlate) setSelectedCarPlate(match.targetPlate);

    return true;
  };

  const handleInviteInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setInviteCodeInput(val);
    if (val.length >= 8) {
      validateAndApplyInvite(val);
    } else {
      setVerifiedInvite(null);
      setInviteError('');
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setStatusMessage('');

    if (activeMode === 'register') {
      // Strict Invite-Only check
      if (!verifiedInvite) {
        const isValid = validateAndApplyInvite(inviteCodeInput);
        if (!isValid) {
          setError("Registration is strictly invite-only. A valid invite code from management is required.");
          return;
        }
      }

      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }

      if (!accountPassword.trim() || accountPassword.trim().length < 6) {
        setError('Please create a security password of at least 6 characters for future logins.');
        return;
      }
    }

    const formatted = formatPhoneNumber(phone);
    if (!formatted || formatted.length < 9) {
      setError('Please enter a valid international WhatsApp / Mobile number (e.g. +971501234567).');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPhoneOtp(formatted, 'recaptcha-container');
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
        const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');
        const cleanPhone = formatPhoneNumber(result.phoneNumber || phone);

        if (activeMode === 'register') {
          // Resolve linked profile
          let linkedCarPlate = '';
          let displayName = name.trim();

          if (role === 'freelancer') {
            linkedCarPlate = selectedCarPlate || customDetail.trim().toUpperCase();
          }

          const newUser = {
            id: 'usr_' + Date.now(),
            name: displayName,
            phone: cleanPhone,
            password: accountPassword.trim(),
            role,
            linkedDriverId: role === 'driver' ? 'drv_' + cleanPhone.replace(/\D/g, '') : '',
            linkedCarPlate: linkedCarPlate,
            createdAt: new Date().toISOString(),
            status: 'active'
          };

          // Mark invite as redeemed
          if (verifiedInvite) {
            const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
            const updatedInvites = storedInvites.map(inv => {
              if (inv.id === verifiedInvite.id || inv.code === verifiedInvite.code) {
                return {
                  ...inv,
                  isUsed: true,
                  usedAt: new Date().toISOString(),
                  usedByPhone: cleanPhone
                };
              }
              return inv;
            });
            localStorage.setItem('safari_invites', JSON.stringify(updatedInvites));
            markInviteUsedInFirestore(verifiedInvite.code, cleanPhone);
          }

          // Save registered user
          const updatedUsers = [...registeredUsers.filter(u => u.phone !== cleanPhone), newUser];
          localStorage.setItem('safari_registered_users', JSON.stringify(updatedUsers));
          syncUserToFirestore(newUser);

          // Authenticate immediately
          sessionStorage.setItem('safari_admin_authenticated', 'true');
          sessionStorage.setItem('safari_user_role', role);
          sessionStorage.setItem('safari_user_phone', cleanPhone);
          sessionStorage.setItem('safari_current_user', JSON.stringify(newUser));

          onLoginSuccess(role, 'roar', newUser);
        } else {
          // Login Mode: find matching user by phone
          const matchedUser = registeredUsers.find(u => 
            formatPhoneNumber(u.phone) === cleanPhone || 
            cleanPhone.endsWith((u.phone || '').replace(/\D/g, '').slice(-9))
          );
          
          if (!matchedUser) {
            throw new Error(`No registered staff account found for ${cleanPhone}. Please register using your invite link first.`);
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdfbf7 0%, #f7f2ea 50%, #ede6d9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
      color: '#543c2b'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        border: '1.5px solid #ede6d9',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 12px 40px rgba(84, 60, 43, 0.08)'
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(140, 91, 48, 0.1)',
            border: '1.5px solid rgba(140, 91, 48, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8c5b30',
            marginBottom: '10px'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: '#543c2b' }}>
            {activeMode === 'register' ? 'Invite-Only Staff Registration' : 'WhatsApp Phone Sign In'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#8c7361' }}>
            {activeMode === 'register' 
              ? 'Authorized drivers, freelancers, and operations team registration'
              : 'Sign in directly using your verified WhatsApp phone number'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#fdfbf7',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #ede6d9',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveMode('register');
              setStep('form');
              setError('');
            }}
            style={{
              padding: '8px',
              borderRadius: '9px',
              border: 'none',
              background: activeMode === 'register' ? '#8c5b30' : 'transparent',
              color: activeMode === 'register' ? '#ffffff' : '#8c7361',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setStep('form');
              setError('');
            }}
            style={{
              padding: '8px',
              borderRadius: '9px',
              border: 'none',
              background: activeMode === 'login' ? '#8c5b30' : 'transparent',
              color: activeMode === 'login' ? '#ffffff' : '#8c7361',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Existing User Sign In
          </button>
        </div>

        {/* Error / Status alerts */}
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
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
            border: '1px solid rgba(22, 163, 74, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#15803d',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* STEP 1: FORM INPUT */}
        {step === 'form' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Invite-Only Code Field (Only in Register Mode) */}
            {activeMode === 'register' && (
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Enter Invite Code (e.g. INV-DRV-1024) *"
                    title="Invite Code"
                    value={inviteCodeInput}
                    onChange={handleInviteInputChange}
                    style={{
                      textTransform: 'uppercase',
                      fontWeight: '800',
                      borderColor: verifiedInvite ? '#16a34a' : inviteError ? '#dc2626' : undefined,
                      paddingRight: '36px'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    {verifiedInvite ? (
                      <CheckCircle size={18} style={{ color: '#16a34a' }} />
                    ) : (
                      <Lock size={16} style={{ color: '#8c7361' }} />
                    )}
                  </div>
                </div>

                {verifiedInvite ? (
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    <span>Invite Verified: Role <strong>{verifiedInvite.role.toUpperCase()}</strong></span>
                  </div>
                ) : inviteError ? (
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', marginTop: '4px' }}>
                    {inviteError}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '4px' }}>
                    Registration requires an invitation code issued by operations management.
                  </div>
                )}
              </div>
            )}

            {/* Role Picker (Locked if invite verified) */}
            {activeMode === 'register' && (
              <div className="form-group">
                <select
                  disabled={Boolean(verifiedInvite)}
                  className="form-control"
                  title="Designated Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    background: verifiedInvite ? '#f5eee6' : '#ffffff',
                    fontWeight: '800',
                    cursor: verifiedInvite ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="driver">Driver (Assigned Bookings, Earnings & QR Scanner)</option>
                  <option value="freelancer">Freelancer (Car Details, Fines, Installments & Receipts)</option>
                  <option value="operations">Operations Team (Scanner-Only Guest Verification)</option>
                </select>
              </div>
            )}

            {/* Full Name (Only for Registration) */}
            {activeMode === 'register' && (
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
            )}

            {/* Role-Specific Secondary Fields */}
            {activeMode === 'register' && role === 'freelancer' && (
              <div className="form-group">
                <select
                  className="form-control"
                  title="Assign Vehicle Plate"
                  value={selectedCarPlate}
                  onChange={(e) => setSelectedCarPlate(e.target.value)}
                  style={{ fontWeight: '700' }}
                >
                  <option value="">-- Select Your Vehicle Plate --</option>
                  {cars.map((c) => (
                    <option key={c.id || c.plate} value={c.plate}>
                      Plate: {c.plate} ({c.model || c.brand} - {c.owner || 'Lease'})
                    </option>
                  ))}
                  <option value="OTHER">Other / New Vehicle Plate...</option>
                </select>
                {selectedCarPlate === 'OTHER' && (
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Enter Vehicle Plate Number (e.g. BB23370)"
                    title="Vehicle Plate"
                    style={{ marginTop: '8px' }}
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Account Password Creation */}
            {activeMode === 'register' && (
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAccountPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="form-control"
                    placeholder="Create Account Password (min 6 chars) *"
                    title="Create Account Password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    style={{ paddingRight: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountPassword(!showAccountPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#8c7361',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '4px' }}>
                  You will use your phone number and this password to sign in to the portal in the future.
                </div>
              </div>
            )}

            {/* WhatsApp / Mobile Phone Number */}
            <div className="form-group">
              <input
                type="tel"
                required
                className="form-control"
                placeholder="WhatsApp Mobile Number (e.g. +971501234567) *"
                title="WhatsApp Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ fontWeight: '700' }}
              />
              <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '4px' }}>
                A 6-digit verification code will be sent to this number via Firebase SMS/WhatsApp.
              </div>
            </div>

            {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
            <div id="recaptcha-container"></div>

            <button
              type="submit"
              disabled={loading || (activeMode === 'register' && !verifiedInvite)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                opacity: (loading || (activeMode === 'register' && !verifiedInvite)) ? 0.6 : 1
              }}
            >
              {loading ? (
                <span>Sending Secure OTP...</span>
              ) : (
                <>
                  <span>Send WhatsApp / Phone OTP</span>
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
              border: '1px solid #ede6d9',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#8c7361' }}>OTP sent to:</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b', marginTop: '2px' }}>
                {otpResponse?.formattedPhone || phone}
              </div>
            </div>

            <div className="form-group">
              <input
                type="text"
                required
                maxLength={6}
                className="form-control"
                placeholder="Enter 6-Digit Code"
                title="6-Digit OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  padding: '12px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (loading || otpCode.length < 6) ? 0.6 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtpCode('');
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#8c7361',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline'
              }}
            >
              Change Phone Number or Resend OTP
            </button>
          </form>
        )}

        {/* Footer Action */}
        <div style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid #ede6d9',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#8c7361',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            ← Back to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
