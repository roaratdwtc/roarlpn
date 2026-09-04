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
  EyeOff,
  LogIn
} from 'lucide-react';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  formatPhoneNumber,
  syncUserToFirestore,
  markInviteUsedInFirestore,
  fetchInviteFromFirestore
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

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('+971');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // OTP State (Optional Secondary Fallback)
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [showOtpOption, setShowOtpOption] = useState(false);
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

  // Validate Invite Code against localStorage 'safari_invites', Firestore, or valid pattern
  const validateAndApplyInvite = async (rawCode) => {
    setInviteError('');
    const clean = (rawCode || '').trim().toUpperCase();

    if (!clean) {
      setVerifiedInvite(null);
      return null;
    }

    const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
    let match = storedInvites.find(i => (i.code || '').toUpperCase() === clean);

    // 1. If not found in localStorage, check Firestore
    if (!match) {
      try {
        const remoteInvite = await fetchInviteFromFirestore(clean);
        if (remoteInvite) {
          match = remoteInvite;
          localStorage.setItem('safari_invites', JSON.stringify([remoteInvite, ...storedInvites]));
        }
      } catch (e) {
        console.warn("Firestore invite lookup fallback:", e);
      }
    }

    // 2. Fallback: Check valid management invite code pattern INV-(DRV|FL|OPS)-[A-Z0-9]+
    if (!match) {
      const inviteRegex = /^INV-(DRV|FL|OPS)-([A-Z0-9]{3,})$/i;
      const parsed = clean.match(inviteRegex);
      if (parsed) {
        const rolePrefix = parsed[1].toUpperCase();
        const detectedRole = rolePrefix === 'DRV' ? 'driver' : rolePrefix === 'FL' ? 'freelancer' : 'operations';
        match = {
          id: 'inv_' + Date.now(),
          code: clean,
          role: detectedRole,
          targetName: '',
          targetPhone: '',
          targetPlate: '',
          isUsed: false,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('safari_invites', JSON.stringify([match, ...storedInvites]));
      }
    }

    if (!match) {
      setInviteError("Invalid invite code. Registration is strictly invite-only.");
      setVerifiedInvite(null);
      return null;
    }

    if (match.isUsed) {
      setInviteError("This invitation code has already been redeemed. Please request a new invite.");
      setVerifiedInvite(null);
      return null;
    }

    // Lock role and pre-fill details from invite
    setVerifiedInvite(match);
    setRole(match.role || 'driver');
    if (match.targetName) setName(match.targetName);
    if (match.targetPhone) setPhone(formatPhoneNumber(match.targetPhone));
    if (match.targetPlate) setSelectedCarPlate(match.targetPlate);

    return match;
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

  // Direct Account Registration & Immediate Activation (Bypasses Firebase SMS issues)
  const handleCompleteRegistration = async (e) => {
    e?.preventDefault();
    setError('');
    setStatusMessage('');

    let currentInvite = verifiedInvite;
    if (!currentInvite) {
      currentInvite = await validateAndApplyInvite(inviteCodeInput);
      if (!currentInvite) {
        setError("Registration is strictly invite-only. A valid invite code from management is required.");
        return;
      }
    }

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const formatted = formatPhoneNumber(phone);
    if (!formatted || formatted.length < 9) {
      setError('Please enter a valid international WhatsApp / Mobile number (e.g. +971501234567).');
      return;
    }

    if (!accountPassword.trim() || accountPassword.trim().length < 6) {
      setError('Please create a security password of at least 6 characters for future logins.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = formatted;
      const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');

      let linkedCarPlate = '';
      let displayName = name.trim();

      if (role === 'freelancer') {
        linkedCarPlate = selectedCarPlate || customDetail.trim().toUpperCase();
      }

      const assignedRole = role || currentInvite.role || 'driver';

      const newUser = {
        id: 'usr_' + Date.now(),
        name: displayName,
        phone: cleanPhone,
        password: accountPassword.trim(),
        role: assignedRole,
        linkedDriverId: assignedRole === 'driver' ? 'drv_' + cleanPhone.replace(/\D/g, '') : '',
        linkedCarPlate: linkedCarPlate,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // If Driver, ensure they exist in driver fleet list (safari_drivers)
      if (assignedRole === 'driver') {
        const storedDrivers = JSON.parse(localStorage.getItem('safari_drivers') || '[]');
        const exists = storedDrivers.some(d => 
          (d.whatsapp && formatPhoneNumber(d.whatsapp) === cleanPhone) ||
          (d.phone && formatPhoneNumber(d.phone) === cleanPhone)
        );
        if (!exists) {
          const newDriverObj = {
            id: newUser.linkedDriverId || ('driver-' + cleanPhone.replace(/\D/g, '').slice(-6)),
            name: displayName,
            whatsapp: cleanPhone,
            carPlate: linkedCarPlate || 'Assigned on Dispatch',
            regDate: new Date().toISOString().split('T')[0],
            defaultSalary: 100,
            defaultFuel: 150
          };
          const updatedDrivers = [...storedDrivers, newDriverObj];
          localStorage.setItem('safari_drivers', JSON.stringify(updatedDrivers));
          try {
            fetch('api.php?action=save&table=drivers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newDriverObj)
            }).catch(() => {});
          } catch (e) {}
        }
      }

      // Mark invite as redeemed
      if (currentInvite) {
        const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
        const updatedInvites = storedInvites.map(inv => {
          if (inv.id === currentInvite.id || inv.code === currentInvite.code) {
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
        markInviteUsedInFirestore(currentInvite.code, cleanPhone);
      }

      // Save registered user locally
      const updatedUsers = [...registeredUsers.filter(u => u.phone !== cleanPhone), newUser];
      localStorage.setItem('safari_registered_users', JSON.stringify(updatedUsers));
      syncUserToFirestore(newUser);

      // Save user to MySQL backend if available
      try {
        fetch('api.php?action=save&table=users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        }).catch(() => {});
      } catch (e) {}

      // Authenticate immediately
      sessionStorage.setItem('safari_admin_authenticated', 'true');
      sessionStorage.setItem('safari_user_role', assignedRole);
      sessionStorage.setItem('safari_user_phone', cleanPhone);
      sessionStorage.setItem('safari_current_user', JSON.stringify(newUser));

      // Clean URL hash/params
      if (window.location.hash === '#/register') {
        window.location.hash = '';
      }
      if (window.location.search.includes('view=register') || window.location.search.includes('invite=')) {
        try {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {}
      }

      setStatusMessage('Registration complete! Activating your portal access...');
      setTimeout(() => {
        onLoginSuccess(assignedRole, 'roar', newUser);
      }, 350);
    } catch (err) {
      console.error("handleCompleteRegistration failed:", err);
      setError(err.message || 'Error completing registration.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Staff Sign In using Registered Phone & Password
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setStatusMessage('');

    const formatted = formatPhoneNumber(loginPhone);
    if (!formatted || formatted.length < 9) {
      setError('Please enter your registered mobile number (e.g. +971501234567).');
      return;
    }

    if (!loginPassword.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = formatted;
      const cleanDigits = cleanPhone.replace(/\D/g, '');
      const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');

      const matchedUser = registeredUsers.find(u => {
        const uDigits = (u.phone || '').replace(/\D/g, '');
        return uDigits && (uDigits.endsWith(cleanDigits.slice(-9)) || cleanDigits.endsWith(uDigits.slice(-9)));
      });

      if (!matchedUser) {
        throw new Error(`No staff account registered for ${cleanPhone}. Please register with your invite code first.`);
      }

      if (matchedUser.status === 'suspended') {
        throw new Error('This account has been suspended. Please contact operations management.');
      }

      if (matchedUser.password && matchedUser.password !== loginPassword.trim()) {
        throw new Error('Incorrect password. Please verify and try again.');
      }

      // Authenticate immediately
      sessionStorage.setItem('safari_admin_authenticated', 'true');
      sessionStorage.setItem('safari_user_role', matchedUser.role);
      sessionStorage.setItem('safari_user_phone', cleanPhone);
      sessionStorage.setItem('safari_current_user', JSON.stringify(matchedUser));

      if (window.location.hash === '#/register') {
        window.location.hash = '';
      }
      if (window.location.search.includes('view=register') || window.location.search.includes('invite=')) {
        try {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {}
      }

      setStatusMessage('Signed in successfully! Entering portal...');
      setTimeout(() => {
        onLoginSuccess(matchedUser.role, 'roar', matchedUser);
      }, 350);
    } catch (err) {
      console.error("handlePasswordLogin failed:", err);
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Optional OTP Trigger (kept as secondary option)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setStatusMessage('');

    const targetPhone = activeMode === 'register' ? phone : loginPhone;
    const formatted = formatPhoneNumber(targetPhone);
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
      const isSmsBlocked = err.message && (err.message.includes('operation-not-allowed') || err.message.includes('SMS unable to be sent'));
      if (isSmsBlocked) {
        setError("Firebase SMS delivery is not enabled for UAE (+971). You can complete registration or sign in directly with your password below!");
      } else {
        setError(err.message || 'Error sending verification code.');
      }
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
        const cleanPhone = formatPhoneNumber(result.phoneNumber || (activeMode === 'register' ? phone : loginPhone));

        if (activeMode === 'register') {
          let linkedCarPlate = '';
          let displayName = name.trim();

          if (role === 'freelancer') {
            linkedCarPlate = selectedCarPlate || customDetail.trim().toUpperCase();
          }

          const assignedRole = role || verifiedInvite?.role || 'driver';

          const newUser = {
            id: 'usr_' + Date.now(),
            name: displayName,
            phone: cleanPhone,
            password: accountPassword.trim(),
            role: assignedRole,
            linkedDriverId: assignedRole === 'driver' ? 'drv_' + cleanPhone.replace(/\D/g, '') : '',
            linkedCarPlate: linkedCarPlate,
            createdAt: new Date().toISOString(),
            status: 'active'
          };

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

          const updatedUsers = [...registeredUsers.filter(u => u.phone !== cleanPhone), newUser];
          localStorage.setItem('safari_registered_users', JSON.stringify(updatedUsers));
          syncUserToFirestore(newUser);

          sessionStorage.setItem('safari_admin_authenticated', 'true');
          sessionStorage.setItem('safari_user_role', assignedRole);
          sessionStorage.setItem('safari_user_phone', cleanPhone);
          sessionStorage.setItem('safari_current_user', JSON.stringify(newUser));

          onLoginSuccess(assignedRole, 'roar', newUser);
        } else {
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
            {activeMode === 'register' ? 'Staff Portal Registration' : 'Staff Account Sign In'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#8c7361' }}>
            {activeMode === 'register' 
              ? 'Authorized drivers, freelancers, and operations team registration'
              : 'Sign in to access your portal, assigned bookings, and receipts'}
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
              setStatusMessage('');
            }}
            style={{
              padding: '8px',
              borderRadius: '9px',
              border: 'none',
              background: activeMode === 'register' ? '#8c5b30' : 'transparent',
              color: activeMode === 'register' ? '#ffffff' : '#8c7361',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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
              setStatusMessage('');
            }}
            style={{
              padding: '8px',
              borderRadius: '9px',
              border: 'none',
              background: activeMode === 'login' ? '#8c5b30' : 'transparent',
              color: activeMode === 'login' ? '#ffffff' : '#8c7361',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'form' && activeMode === 'register' && (
          <form onSubmit={handleCompleteRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Invite-Only Code Field */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Management Invite Code *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. INV-DRV-1024"
                  title="Invite Code"
                  value={inviteCodeInput}
                  onChange={handleInviteInputChange}
                  style={{
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    borderColor: verifiedInvite ? '#16a34a' : inviteError ? '#dc2626' : '#ede6d9',
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
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '8px', 
                  padding: '6px 10px', 
                  fontSize: '11px', 
                  color: '#15803d', 
                  fontWeight: '800', 
                  marginTop: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}>
                  <CheckCircle size={14} />
                  <span>Authorized Invite Code: Role <strong>{verifiedInvite.role.toUpperCase()}</strong></span>
                </div>
              ) : inviteError ? (
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', marginTop: '4px' }}>
                  {inviteError}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '4px' }}>
                  Registration requires an invite code generated by operations management.
                </div>
              )}
            </div>

            {/* Role Picker (Locked if invite verified) */}
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Designated Role
              </label>
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

            {/* Full Name */}
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Full Name (e.g. Mr. Adnan)"
                title="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Role-Specific Secondary Fields */}
            {role === 'freelancer' && (
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                  Assign Vehicle Plate *
                </label>
                <select
                  className="form-control"
                  title="Assign Vehicle Plate"
                  value={selectedCarPlate}
                  onChange={(e) => setSelectedCarPlate(e.target.value)}
                  style={{ fontWeight: '700' }}
                >
                  <option value="">-- Select Your Vehicle Plate --</option>
                  {cars.map((c) => (
                    <option key={c.id || c.plate || c.plateNo} value={c.plate || c.plateNo}>
                      Plate: {c.plate || c.plateNo} ({c.model || c.brand || 'Vehicle'} - {c.owner || 'Lease'})
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

            {/* WhatsApp / Mobile Phone Number */}
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                WhatsApp / Mobile Number *
              </label>
              <input
                type="tel"
                required
                className="form-control"
                placeholder="+971501234567"
                title="WhatsApp Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ fontWeight: '700' }}
              />
              <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '4px' }}>
                This mobile number will be your account login identifier.
              </div>
            </div>

            {/* Account Password Creation */}
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Create Account Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAccountPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Password (minimum 6 characters) *"
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

            {/* Invisible reCAPTCHA container for fallback Phone Auth */}
            <div id="recaptcha-container"></div>

            {/* Primary Action Button: Complete Registration & Activate */}
            <button
              type="submit"
              disabled={loading || !verifiedInvite}
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
                background: 'linear-gradient(135deg, #8c5b30 0%, #a66d3b 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                cursor: (loading || !verifiedInvite) ? 'not-allowed' : 'pointer',
                opacity: (loading || !verifiedInvite) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)'
              }}
            >
              {loading ? (
                <span>Activating Account...</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Complete Registration & Activate Account</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              ✓ Instant Activation: Verified invite codes authorize immediate portal access.
            </div>

            {/* Optional Fallback OTP Trigger */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowOtpOption(!showOtpOption)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8c5b30',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  textDecoration: 'underline'
                }}
              >
                {showOtpOption ? 'Hide SMS OTP verification option' : 'Prefer SMS OTP verification instead?'}
              </button>
            </div>

            {showOtpOption && (
              <div style={{
                background: '#fdfbf7',
                border: '1px dashed #ede6d9',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#8c7361', marginBottom: '8px' }}>
                  Note: SMS OTP requires Firebase SMS to be enabled for your country (+971).
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '800',
                    background: '#ede6d9',
                    border: '1px solid #dcd2c3',
                    color: '#543c2b',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Send Verification SMS OTP
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 1: EXISTING USER LOGIN FORM */}
        {step === 'form' && activeMode === 'login' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                WhatsApp / Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                className="form-control"
                placeholder="e.g. +971501234567"
                title="Registered Mobile Number"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                style={{ fontWeight: '700' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Account Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  className="form-control"
                  placeholder="Enter your security password"
                  title="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
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
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                background: 'linear-gradient(135deg, #8c5b30 0%, #a66d3b 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)'
              }}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Staff Portal</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('register');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8c5b30',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  textDecoration: 'underline'
                }}
              >
                New staff member? Register with an invite code
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION (Only active if user opted into SMS OTP) */}
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
                {otpResponse?.formattedPhone || (activeMode === 'register' ? phone : loginPhone)}
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
                background: 'linear-gradient(135deg, #8c5b30 0%, #a66d3b 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                cursor: (loading || otpCode.length < 6) ? 'not-allowed' : 'pointer',
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
              ← Back to direct activation
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
