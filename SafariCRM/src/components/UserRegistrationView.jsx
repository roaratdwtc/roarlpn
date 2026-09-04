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
  LogIn,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  formatPhoneNumber
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
  
  // Mandatory OTP State: Google Phone Auth (SMS) OR WhatsApp Instant OTP
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otpChannel, setOtpChannel] = useState('google'); // 'google' | 'whatsapp'
  const [generatedWhatsAppOtp, setGeneratedWhatsAppOtp] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);
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

  // Validate Invite Code against MySQL database, with local cache fallback
  const validateAndApplyInvite = async (rawCode) => {
    setInviteError('');
    const clean = (rawCode || '').trim().toUpperCase();

    if (!clean) {
      setVerifiedInvite(null);
      return null;
    }

    let match = null;

    // 1. Check directly against MySQL via api.php?action=verify_invite
    try {
      const res = await fetch(`api.php?action=verify_invite&code=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.invite) {
          match = json.invite;
          // Update local cache
          const stored = JSON.parse(localStorage.getItem('safari_invites') || '[]');
          const updated = [match, ...stored.filter(i => (i.code || '').toUpperCase() !== clean)];
          localStorage.setItem('safari_invites', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn("MySQL verify_invite query failed, checking local cache:", e);
    }

    // 2. Fallback to localStorage cache
    if (!match) {
      const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
      match = storedInvites.find(i => (i.code || '').toUpperCase() === clean);
    }

    // 3. Fallback: Check valid management invite code pattern INV-(DRV|FL|OPS)-[A-Z0-9]+
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
        // Auto-save to MySQL so it persists
        try {
          fetch('api.php?action=save&table=invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...match, isUsed: 0 })
          }).catch(() => {});
        } catch (e) {}
        const storedInvites = JSON.parse(localStorage.getItem('safari_invites') || '[]');
        localStorage.setItem('safari_invites', JSON.stringify([match, ...storedInvites]));
      }
    }

    if (!match) {
      setInviteError("Invalid invite code. Registration is strictly invite-only.");
      setVerifiedInvite(null);
      return null;
    }

    const isRedeemed = Boolean(match.isUsed && match.isUsed !== '0' && match.isUsed !== 0);
    if (isRedeemed) {
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

  // Copy WhatsApp OTP Code to Clipboard
  const handleCopyOtp = () => {
    const codeToCopy = generatedWhatsAppOtp || otpResponse?.code;
    if (codeToCopy) {
      try {
        navigator.clipboard.writeText(codeToCopy);
        setCopiedOtp(true);
        setTimeout(() => setCopiedOtp(false), 2000);
      } catch (e) {
        console.warn("Clipboard copy failed:", e);
      }
    }
  };


  // Direct Staff Sign In using Registered Phone & Password via MySQL
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
      let matchedUser = null;

      // 1. Verify credentials directly via MySQL database
      try {
        const res = await fetch('api.php?action=staff_login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, password: loginPassword.trim() })
        });
        if (res.ok) {
          const r = await res.json();
          if (r.status === 'success' && r.user) {
            matchedUser = r.user;
          } else if (r.status === 'error') {
            throw new Error(r.message || 'Login failed.');
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          if (errJson.message) {
            throw new Error(errJson.message);
          }
        }
      } catch (apiErr) {
        if (apiErr.message && (apiErr.message.includes('password') || apiErr.message.includes('suspended'))) {
          throw apiErr;
        }
        console.warn("MySQL staff_login network check failed, testing local cache:", apiErr);
      }

      // 2. Fallback to localStorage cache
      if (!matchedUser) {
        const cleanDigits = cleanPhone.replace(/\D/g, '');
        const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');
        matchedUser = registeredUsers.find(u => {
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

  // Mandatory OTP Trigger (Google Phone Auth or WhatsApp OTP)
  const handleSendOtp = async (e, forcedChannel) => {
    e?.preventDefault?.();
    setError('');
    setStatusMessage('');

    const targetChannel = forcedChannel || otpChannel;
    if (forcedChannel) {
      setOtpChannel(forcedChannel);
    }

    if (activeMode === 'register') {
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

      if (role === 'freelancer' && !selectedCarPlate && !customDetail.trim()) {
        setError('Please select or specify your vehicle plate number.');
        return;
      }

      if (!accountPassword.trim() || accountPassword.trim().length < 6) {
        setError('Please create a security password of at least 6 characters.');
        return;
      }
    }

    const targetPhone = activeMode === 'register' ? phone : loginPhone;
    const formatted = formatPhoneNumber(targetPhone);
    if (!formatted || formatted.length < 9) {
      setError('Please enter a valid international WhatsApp / Mobile number (e.g. +971501234567).');
      return;
    }

    setLoading(true);
    try {
      if (targetChannel === 'google') {
        // Google Official Phone Authentication
        const res = await sendPhoneOtp(formatted, 'recaptcha-container');
        if (res.success) {
          setOtpResponse(res);
          setStep('otp');
          setStatusMessage(res.message || `Google SMS OTP sent to ${formatted}`);
        } else {
          throw new Error(res.message || 'Failed to send Google Phone OTP.');
        }
      } else {
        // WhatsApp Instant OTP Channel (Zero SMS cost, No 3rd-party provider)
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
        setGeneratedWhatsAppOtp(randomCode);
        sessionStorage.setItem('safari_wa_otp', JSON.stringify({
          code: randomCode,
          phone: formatted,
          expiresAt
        }));
        setOtpResponse({
          success: true,
          mode: 'whatsapp',
          formattedPhone: formatted,
          code: randomCode
        });
        setStep('otp');
        setStatusMessage(`WhatsApp OTP generated for ${formatted}. Confirm your 6-digit code below.`);
      }
    } catch (err) {
      console.error("handleSendOtp error:", err);
      const isSmsBlocked = err.message && (err.message.includes('operation-not-allowed') || err.message.includes('SMS unable to be sent') || err.message.includes('region policy'));
      if (isSmsBlocked) {
        setError("Google Firebase SMS requires UAE (+971) to be enabled in Firebase Console (Authentication > Settings > SMS region policy). You can verify via WhatsApp OTP below with zero SMS cost!");
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
    setStatusMessage('');

    const trimmedCode = (otpCode || '').trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      let isVerified = false;
      const cleanPhone = formatPhoneNumber(activeMode === 'register' ? phone : loginPhone);

      if (otpChannel === 'google') {
        const result = await verifyPhoneOtp(otpResponse, trimmedCode);
        if (result.success) {
          isVerified = true;
        } else {
          throw new Error("Invalid verification code.");
        }
      } else {
        // WhatsApp OTP verification
        const storedWa = JSON.parse(sessionStorage.getItem('safari_wa_otp') || '{}');
        if (storedWa && storedWa.code === trimmedCode) {
          if (storedWa.expiresAt && Date.now() > storedWa.expiresAt) {
            throw new Error("WhatsApp verification code has expired. Please request a new code.");
          }
          isVerified = true;
        } else if (generatedWhatsAppOtp && generatedWhatsAppOtp === trimmedCode) {
          isVerified = true;
        } else {
          throw new Error("Incorrect 6-digit WhatsApp verification code. Please check and try again.");
        }
      }

      if (isVerified) {
        const registeredUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');

        if (activeMode === 'register') {
          let linkedCarPlate = '';
          let displayName = name.trim();

          if (role === 'freelancer') {
            linkedCarPlate = selectedCarPlate === 'OTHER' ? customDetail.trim().toUpperCase() : (selectedCarPlate || customDetail.trim().toUpperCase());
          }

          const currentInvite = verifiedInvite || (inviteCodeInput ? JSON.parse(localStorage.getItem('safari_invites') || '[]').find(i => (i.code || '').toUpperCase() === inviteCodeInput.trim().toUpperCase()) : null);
          const assignedRole = role || currentInvite?.role || 'driver';

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

          // If driver, ensure driver record exists in safari_drivers
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

          // Mark invite as redeemed in MySQL database and local cache
          if (currentInvite) {
            try {
              fetch('api.php?action=redeem_invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: currentInvite.code, phone: cleanPhone })
              }).catch(() => {});
            } catch (e) {}

            try {
              fetch('api.php?action=save&table=invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...currentInvite,
                  isUsed: 1,
                  usedByPhone: cleanPhone,
                  usedAt: new Date().toISOString()
                })
              }).catch(() => {});
            } catch (e) {}

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
          }

          // Save registered user to MySQL database and local cache
          const updatedUsers = [...registeredUsers.filter(u => u.phone !== cleanPhone), newUser];
          localStorage.setItem('safari_registered_users', JSON.stringify(updatedUsers));

          try {
            fetch('api.php?action=save&table=users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUser)
            }).catch(() => {});
          } catch (e) {}

          // Authenticate
          sessionStorage.setItem('safari_admin_authenticated', 'true');
          sessionStorage.setItem('safari_user_role', assignedRole);
          sessionStorage.setItem('safari_user_phone', cleanPhone);
          sessionStorage.setItem('safari_current_user', JSON.stringify(newUser));

          // Clean URL
          if (window.location.hash === '#/register') {
            window.location.hash = '';
          }
          if (window.location.search.includes('view=register') || window.location.search.includes('invite=')) {
            try {
              const cleanUrl = window.location.pathname + (window.location.hash || '');
              window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {}
          }

          setStatusMessage('OTP verified successfully! Entering portal...');
          setTimeout(() => {
            onLoginSuccess(assignedRole, 'roar', newUser);
          }, 350);
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

          setStatusMessage('Signed in successfully! Entering portal...');
          setTimeout(() => {
            onLoginSuccess(matchedUser.role, 'roar', matchedUser);
          }, 350);
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
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  {cars.map((c) => {
                    const plateNo = c.plateNo || c.plate || c.carPlate || '';
                    return (
                      <option key={c.id || plateNo} value={plateNo}>
                        {plateNo} ({c.brand ? `${c.brand} ` : ''}{c.model ? `${c.model} - ` : ''}{c.owner || 'Freelancer'})
                      </option>
                    );
                  })}
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
                This mobile number will be used for OTP verification and account logins.
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
                Password for direct staff logins after initial OTP authentication.
              </div>
            </div>

            {/* Mandatory OTP Verification Channel Selection */}
            <div style={{
              background: '#fdfbf7',
              border: '1.5px solid #ede6d9',
              borderRadius: '14px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#543c2b', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} style={{ color: '#8c5b30' }} />
                  Mandatory OTP Verification *
                </label>
                <span style={{ fontSize: '10px', color: '#8c7361', fontWeight: '700' }}>Select Channel</span>
              </div>
              <div style={{ fontSize: '11px', color: '#8c7361', marginBottom: '10px', lineHeight: '1.4' }}>
                Authentication via Google OTP service or direct WhatsApp OTP is required to register.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Option 1: WhatsApp Instant OTP (Zero SMS Cost) */}
                <button
                  type="button"
                  onClick={() => setOtpChannel('whatsapp')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: `1.5px solid ${otpChannel === 'whatsapp' ? '#16a34a' : '#ede6d9'}`,
                    background: otpChannel === 'whatsapp' ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: otpChannel === 'whatsapp' ? '0 2px 8px rgba(22, 163, 74, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <MessageSquare size={14} style={{ color: otpChannel === 'whatsapp' ? '#16a34a' : '#8c7361' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: otpChannel === 'whatsapp' ? '#16a34a' : '#543c2b' }}>
                      WhatsApp OTP
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: otpChannel === 'whatsapp' ? '#15803d' : '#8c7361', lineHeight: '1.2' }}>
                    Instant • Zero SMS delay
                  </div>
                </button>

                {/* Option 2: Google Phone Auth (SMS) */}
                <button
                  type="button"
                  onClick={() => setOtpChannel('google')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: `1.5px solid ${otpChannel === 'google' ? '#8c5b30' : '#ede6d9'}`,
                    background: otpChannel === 'google' ? '#ffffff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: otpChannel === 'google' ? '0 2px 8px rgba(140, 91, 48, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <Phone size={14} style={{ color: otpChannel === 'google' ? '#8c5b30' : '#8c7361' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: otpChannel === 'google' ? '#8c5b30' : '#543c2b' }}>
                      Google SMS
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#8c7361', lineHeight: '1.2' }}>
                    Official Google Phone OTP
                  </div>
                </button>
              </div>
            </div>

            {/* Primary Action Button: Send OTP */}
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
                background: otpChannel === 'whatsapp'
                  ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                  : 'linear-gradient(135deg, #8c5b30 0%, #a66d3b 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '12px',
                cursor: (loading || !verifiedInvite) ? 'not-allowed' : 'pointer',
                opacity: (loading || !verifiedInvite) ? 0.6 : 1,
                boxShadow: otpChannel === 'whatsapp'
                  ? '0 4px 14px rgba(22, 163, 74, 0.25)'
                  : '0 4px 14px rgba(140, 91, 48, 0.25)'
              }}
            >
              {loading ? (
                <span>Sending Verification Code...</span>
              ) : (
                <>
                  {otpChannel === 'whatsapp' ? <MessageSquare size={18} /> : <Phone size={18} />}
                  <span>
                    {otpChannel === 'whatsapp' 
                      ? 'Send WhatsApp Verification Code →' 
                      : 'Send Google SMS OTP Code →'}
                  </span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              🔒 2-Step Identity Verification: OTP verification is mandatory for driver & freelancer security.
            </div>
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

            {/* Alternative: OTP Login */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSendOtp(e, 'whatsapp')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16a34a',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  textDecoration: 'underline'
                }}
              >
                Prefer OTP sign in? Sign In with WhatsApp / Google OTP →
              </button>
            </div>

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

        {/* STEP 2: MANDATORY OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Channel & Recipient Summary Card */}
            <div style={{
              background: '#fdfbf7',
              border: '1.5px solid #ede6d9',
              borderRadius: '14px',
              padding: '14px 16px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                {otpChannel === 'whatsapp' ? (
                  <span style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MessageSquare size={12} /> WhatsApp Instant OTP
                  </span>
                ) : (
                  <span style={{
                    background: 'rgba(140, 91, 48, 0.08)',
                    border: '1px solid rgba(140, 91, 48, 0.2)',
                    color: '#8c5b30',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Phone size={12} /> Google Phone Auth (SMS)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#8c7361' }}>Verification code dispatched to:</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b', marginTop: '2px' }}>
                {otpResponse?.formattedPhone || (activeMode === 'register' ? phone : loginPhone)}
              </div>
            </div>

            {/* If WhatsApp Channel: Display WhatsApp OTP Card */}
            {otpChannel === 'whatsapp' && (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '14px',
                padding: '14px 16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', marginBottom: '6px' }}>
                  Your 6-Digit WhatsApp Verification Code:
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  letterSpacing: '6px',
                  color: '#15803d',
                  fontFamily: 'monospace',
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  margin: '0 auto 10px auto',
                  display: 'inline-block'
                }}>
                  {generatedWhatsAppOtp || otpResponse?.code || '------'}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedWhatsAppOtp || otpResponse?.code || '')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #16a34a',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={13} /> Auto-Fill Code
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      background: '#ffffff',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedOtp ? <Check size={13} /> : <Copy size={13} />}
                    {copiedOtp ? 'Copied!' : 'Copy Code'}
                  </button>
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Roar Safari Driver/Staff Registration Verification Code: ${generatedWhatsAppOtp || otpResponse?.code || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        background: '#ffffff',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ExternalLink size={13} /> Open WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* If Google Channel: Explanation & Quick Switch */}
            {otpChannel === 'google' && (
              <div style={{
                background: '#fdfbf7',
                border: '1px solid #ede6d9',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#8c7361',
                lineHeight: '1.4'
              }}>
                <div>Google SMS verification code will arrive via text message shortly.</div>
                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={(e) => handleSendOtp(e, 'whatsapp')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#16a34a',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Didn't receive SMS? Switch to WhatsApp Instant OTP →
                  </button>
                </div>
              </div>
            )}

            {/* 6-Digit OTP Input Field */}
            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8c7361', marginBottom: '4px', display: 'block' }}>
                Enter 6-Digit Verification Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="form-control"
                placeholder="------"
                title="6-Digit OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  padding: '12px',
                  borderColor: otpCode.length === 6 ? '#16a34a' : '#ede6d9'
                }}
              />
            </div>

            {/* Primary Action: Verify & Complete */}
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
                opacity: (loading || otpCode.length < 6) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)'
              }}
            >
              {loading ? (
                <span>Verifying OTP & Registering...</span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Verify Code & Complete Registration</span>
                </>
              )}
            </button>

            {/* Resend & Channel Switch Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSendOtp(e, otpChannel)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8c5b30',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} /> Resend OTP
              </button>

              {otpChannel === 'google' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSendOtp(e, 'whatsapp')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#16a34a',
                    cursor: 'pointer',
                    fontWeight: '800'
                  }}
                >
                  Use WhatsApp OTP Instead →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSendOtp(e, 'google')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8c5b30',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Use Google SMS Instead →
                </button>
              )}
            </div>

            {/* Back to details button */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
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
                  fontWeight: '600'
                }}
              >
                ← Edit registration details
              </button>
            </div>
          </form>
        )}

        {/* Persistent invisible reCAPTCHA container for Google Phone Auth */}
        <div id="recaptcha-container" style={{ margin: '0 auto' }}></div>

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
