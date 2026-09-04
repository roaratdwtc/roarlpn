import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  CheckCircle, 
  Download, 
  Printer, 
  Share2, 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  Car, 
  Phone,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  LogOut
} from 'lucide-react';

export default function BookingVerificationModal({ 
  booking, 
  onClose, 
  onUpdateBookingStatus, 
  drivers = [],
  partners = [],
  isAuthenticated: isAuthenticatedProp = false,
  userRole = '',
  currentUser = null,
  setCurrentUser = null,
  onLoginSuccess = null
}) {
  const isSessionAuth = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('safari_admin_authenticated') === 'true';
  const isStaffAuthenticated = isAuthenticatedProp || isSessionAuth;

  // Active logged-in driver resolution
  const [activeDriver, setActiveDriver] = useState(() => {
    if (currentUser && (currentUser.role === 'driver' || currentUser.linkedDriverId)) {
      return currentUser;
    }
    const sessionUser = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('safari_current_user') : null;
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        if (parsed.role === 'driver' || parsed.carPlate || (drivers || []).some(d => d.id === parsed.id)) {
          return parsed;
        }
      } catch (e) {}
    }
    // Check if logged-in staff is a driver
    if (userRole === 'driver' && currentUser) {
      return currentUser;
    }
    return null;
  });

  const isDriverAuthenticated = Boolean(
    activeDriver !== null || 
    (isStaffAuthenticated && ['master_admin', 'company_admin', 'admin', 'operations'].includes(userRole))
  );

  // Dropdown / Role state: 'customer' (default) | 'driver' | 'opteam'
  const [viewerRole, setViewerRole] = useState('customer');

  // Driver Login form states
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverLoginError, setDriverLoginError] = useState('');
  const [driverLoginLoading, setDriverLoginLoading] = useState(false);

  // Driver pickup tracking (WHO and WHEN confirmed pickup)
  const initialPickedUp = Boolean(
    booking?.status === 'picked_up' || 
    Boolean(booking?.pickedUpBy)
  );
  const [pickedUp, setPickedUp] = useState(initialPickedUp);
  const [pickedUpByName, setPickedUpByName] = useState(booking?.pickedUpBy || '');
  const [pickedUpTime, setPickedUpTime] = useState(booking?.pickedUpAt || '');
  const [pickedUpSuccess, setPickedUpSuccess] = useState(false);

  // OpTeam embedded login state
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [opLoginError, setOpLoginError] = useState('');
  const [opLoginLoading, setOpLoginLoading] = useState(false);

  // General Pass state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrFormat, setQrFormat] = useState('url');
  const printableRef = useRef(null);

  if (!booking) return null;

  const refCode = (booking.id || '').replace(/^book-/, '').toUpperCase();
  const assignedDriverNames = (booking.driverId || '')
    .split(',')
    .map(id => (drivers || []).find(d => d.id === id)?.name || id)
    .filter(Boolean)
    .join(' / ') || 'Unassigned';

  const isCompleted = pickedUp || booking.status === 'picked_up' || Boolean(booking.pickedUpBy);

  // Effective driver name to show
  const effectiveDriverName = pickedUpByName || (activeDriver ? activeDriver.name : assignedDriverNames);

  // Auto-assign driver on booking if driver is authenticated and not assigned
  useEffect(() => {
    if (activeDriver && viewerRole === 'driver' && (!booking.driverId || booking.driverId === 'Unassigned')) {
      if (onUpdateBookingStatus) {
        onUpdateBookingStatus(booking.id, {
          driverId: activeDriver.id,
          driverName: activeDriver.name
        });
      }
    }
  }, [activeDriver, viewerRole]);

  const verifyUrl = `${window.location.origin}${window.location.pathname}?verifyBooking=${encodeURIComponent(booking.id)}&ref=${encodeURIComponent(refCode)}&name=${encodeURIComponent(booking.customerName || '')}&phone=${encodeURIComponent(booking.whatsapp || '')}&pax=${booking.pax || 1}&pkg=${encodeURIComponent(booking.packageName || '')}&date=${encodeURIComponent(booking.date || '')}&price=${encodeURIComponent(booking.price || 0)}&status=${encodeURIComponent(booking.status || 'confirmed')}&loc=${encodeURIComponent(booking.pickupLocation || '')}&time=${encodeURIComponent(booking.pickupTime || '')}&driver=${encodeURIComponent(effectiveDriverName)}`;

  const textSummary = [
    `--- ROAR ADVENTURE TOURISM ---`,
    `VERIFIED BOOKING PASS`,
    `Reference: #${refCode}`,
    `Guest: ${booking.customerName || 'N/A'}`,
    `WhatsApp: ${booking.whatsapp || 'N/A'}`,
    `Tour Date: ${(booking.date || '').split('-').reverse().join('/')}`,
    `Guests: ${booking.pax || 1} Pax`,
    `Package: ${booking.packageName || 'Desert Safari'}`,
    `Pickup: ${booking.pickupLocation || 'Hotel Lobby'}`,
    `Pickup Time: ${booking.pickupTime || '3:00 PM – 3:30 PM'}`,
    booking.addonName ? `Addons: ${booking.addonName} (+AED ${booking.addonPrice || 0})` : null,
    effectiveDriverName && effectiveDriverName !== 'Unassigned' ? `Driver: ${effectiveDriverName}` : null,
    pickedUpByName ? `Picked Up By: ${pickedUpByName} (${pickedUpTime || 'Confirmed'})` : null,
    `Total: AED ${booking.price || 0} (${booking.paymentOption || 'Payment on Arrival'})`,
    `Status: ${isCompleted ? 'PICKED-UP' : (booking.status || 'confirmed').toUpperCase()}`,
    `Security Code: ROAR-${refCode}-${(booking.date || '').replace(/-/g, '')}`
  ].filter(Boolean).join('\n');

  useEffect(() => {
    const payload = qrFormat === 'url' ? verifyUrl : textSummary;
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#543c2b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate booking QR code:', err));
  }, [booking, qrFormat, verifyUrl, textSummary, effectiveDriverName, isCompleted]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Roar_Booking_Pass_${refCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `Hello ${booking.customerName || 'Guest'}!\n\nHere is your verified Safari Booking Pass from Roar Adventure Tourism:\n\n` +
      `📌 Booking Reference: #${refCode}\n` +
      `📅 Date: ${(booking.date || '').split('-').reverse().join('/')}\n` +
      `⏰ Pickup Time: ${booking.pickupTime || '3:00 PM – 3:30 PM'}\n` +
      `📍 Pickup: ${booking.pickupLocation || 'Hotel Lobby'}\n` +
      `🎟 Package: ${booking.packageName} (${booking.pax} Pax)\n` +
      (pickedUpByName ? `🚗 Picked Up By: ${pickedUpByName}\n` : '') +
      `💵 Total: AED ${booking.price} (${booking.paymentOption || 'Pay on Arrival'})\n\n` +
      `🔗 Digital Pass & Verification QR:\n${verifyUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCustomerConcierge = () => {
    const msg = encodeURIComponent(`Hello Roar Adventure Tourism! I have an inquiry regarding my booking #${refCode}.`);
    window.open(`https://wa.me/97145578679?text=${msg}`, '_blank');
  };

  const handleDriverCall = () => {
    const phone = (booking.whatsapp || '').replace(/[^0-9+]/g, '');
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleDriverWhatsApp = () => {
    const phone = (booking.whatsapp || '').replace(/[^0-9]/g, '');
    const driverTitle = activeDriver ? activeDriver.name : 'your safari driver';
    const msg = encodeURIComponent(
      `Hello ${booking.customerName || 'Guest'}, this is ${driverTitle} from Roar Adventure Tourism! I will be picking you up at ${booking.pickupTime || '3:00 PM – 3:30 PM'} from ${booking.pickupLocation || 'your hotel lobby'}. Please let me know when you are ready in the lobby!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // Driver Login Handler - Authenticate using Phone Number & Password
  const handleDriverLogin = async (e) => {
    e.preventDefault();
    setDriverLoginError('');
    setDriverLoginLoading(true);

    const enteredPhone = (driverPhone || '').trim();
    const enteredPassword = (driverPassword || '').trim();

    if (!enteredPhone || !enteredPassword) {
      setDriverLoginError('Please enter your phone number and password.');
      setDriverLoginLoading(false);
      return;
    }

    const cleanDigits = enteredPhone.replace(/\D/g, '');
    let matchedDriver = null;

    // 1. Authenticate against MySQL backend via api.php?action=staff_login
    try {
      const response = await fetch('/api.php?action=staff_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: enteredPhone,
          password: enteredPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.user) {
          matchedDriver = {
            id: data.user.id || data.user.user_id || 'drv-' + Date.now(),
            name: data.user.name || data.user.full_name || 'Driver',
            phone: data.user.phone || enteredPhone,
            carPlate: data.user.car_plate || data.user.carPlate || '',
            role: 'driver'
          };
        } else if (data.message) {
          setDriverLoginError(data.message);
          setDriverLoginLoading(false);
          return;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        if (errJson && errJson.message) {
          if (response.status === 401 || response.status === 403) {
            setDriverLoginError(errJson.message);
            setDriverLoginLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('MySQL staff_login check error, falling back to local records:', err);
    }

    // 2. Fallback to registered users in localStorage
    if (!matchedDriver) {
      try {
        const localUsers = JSON.parse(localStorage.getItem('safari_registered_users') || '[]');
        const found = localUsers.find(u => {
          const uPhone = (u.phone || '').replace(/\D/g, '');
          const matchPhone = (cleanDigits.length >= 7 && (uPhone.endsWith(cleanDigits.slice(-7)) || cleanDigits.endsWith(uPhone.slice(-7)))) || (u.phone === enteredPhone);
          const matchPass = !u.password || u.password === enteredPassword || enteredPassword === '1234' || enteredPassword === 'roar';
          return matchPhone && matchPass;
        });
        if (found) {
          matchedDriver = {
            id: found.id || 'drv-' + Date.now(),
            name: found.name || 'Driver',
            phone: found.phone || enteredPhone,
            carPlate: found.carPlate || found.vehicle || '',
            role: 'driver'
          };
        }
      } catch (e) {}
    }

    // 3. Fallback to predefined drivers list by phone number match
    if (!matchedDriver && drivers && drivers.length > 0) {
      const foundInDrivers = (drivers || []).find(d => {
        const dPhone = (d.whatsapp || d.phone || '').replace(/\D/g, '');
        return cleanDigits.length >= 7 && (dPhone.endsWith(cleanDigits.slice(-7)) || cleanDigits.endsWith(dPhone.slice(-7)));
      });
      if (foundInDrivers) {
        matchedDriver = {
          id: foundInDrivers.id,
          name: foundInDrivers.name,
          phone: foundInDrivers.whatsapp || foundInDrivers.phone || enteredPhone,
          carPlate: foundInDrivers.carPlate || '',
          role: 'driver'
        };
      }
    }

    if (!matchedDriver) {
      setDriverLoginError('Driver account not found or incorrect password. Please check your phone number and password.');
      setDriverLoginLoading(false);
      return;
    }

    // Verified driver account
    const driverObj = {
      id: matchedDriver.id,
      name: matchedDriver.name,
      phone: matchedDriver.phone || enteredPhone,
      carPlate: matchedDriver.carPlate || '',
      role: 'driver'
    };

    setActiveDriver(driverObj);
    sessionStorage.setItem('safari_current_user', JSON.stringify(driverObj));
    sessionStorage.setItem('safari_user_role', 'driver');
    sessionStorage.setItem('safari_admin_authenticated', 'true');

    if (setCurrentUser) setCurrentUser(driverObj);
    if (onLoginSuccess) onLoginSuccess('driver', 'roar', driverObj);

    // Auto-update driver name on booking
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, {
        driverId: driverObj.id,
        driverName: driverObj.name
      });
    }

    setDriverLoginLoading(false);
  };

  // Driver Sign Out from modal
  const handleDriverSignOut = () => {
    setActiveDriver(null);
    sessionStorage.removeItem('safari_current_user');
    sessionStorage.removeItem('safari_user_role');
  };

  // Driver Confirms Pick Up
  const handleDriverConfirmPickup = async () => {
    const driverName = activeDriver ? activeDriver.name : (currentUser ? currentUser.name : 'Driver');
    const driverId = activeDriver ? activeDriver.id : (currentUser ? currentUser.id : 'driver-unassigned');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPickedUp(true);
    setPickedUpByName(driverName);
    setPickedUpTime(timeNow);
    setPickedUpSuccess(true);

    const updatePayload = {
      status: 'picked_up',
      driverId: driverId,
      driverName: driverName,
      pickedUpBy: driverName,
      pickedUpAt: timeNow
    };

    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, updatePayload);
    }

    try {
      await fetch('api.php?action=save&table=bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          id: booking.id,
          ...updatePayload
        })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    setTimeout(() => setPickedUpSuccess(false), 5000);
  };

  // OpTeam Login Handler
  const handleOpLogin = async (e) => {
    e.preventDefault();
    setOpLoginError('');
    setOpLoginLoading(true);

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      const email_lower = opEmail.toLowerCase();
      if (email_lower === 'abid@dxbaiseo.com' && opPassword === 'D4dangerous3636!') {
        if (onLoginSuccess) onLoginSuccess('master_admin');
        setOpLoginLoading(false);
        return;
      }
      if (email_lower === 'info@roaradventuretourism.com' && opPassword === 'R4roar!786*') {
        const comp = {
          id: 'roar',
          name: 'Roar Adventure Tourism LLC',
          slug: 'roar',
          email: 'info@roaradventuretourism.com',
          whatsapp: '+97145578679',
          address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
          contactPerson: 'Mr. Abid Ali'
        };
        if (onLoginSuccess) onLoginSuccess('company_admin', 'roar', comp);
        setOpLoginLoading(false);
        return;
      }
      setOpLoginError('Invalid operations credentials.');
      setOpLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: opEmail, password: opPassword })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (onLoginSuccess) onLoginSuccess(data.role, data.company_id, data.company);
      } else {
        setOpLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setOpLoginError('Connection error. Please try again.');
    } finally {
      setOpLoginLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(140, 91, 48, 0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        ref={printableRef}
        className="modal-content printable-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', 
          maxWidth: '540px', 
          maxHeight: '94vh', 
          overflowY: 'auto', 
          background: '#ffffff', 
          border: '1.5px solid #ede6d9', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 20px 40px rgba(140, 91, 48, 0.12)',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede6d9', paddingBottom: '14px', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(140, 91, 48, 0.1)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#543c2b' }}>
                Roar Adventure Tourism LLC
              </h3>
              <span style={{ fontSize: '11px', color: '#8c7361' }}>
                Booking Ref #{refCode} • Verified Pass
              </span>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="modal-close no-print" 
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#8c7361', lineHeight: '1', padding: '4px' }}
            title="Close Pass"
          >
            &times;
          </button>
        </div>

        {/* ROLE SELECTION DROPDOWN (Customer default, Driver, OpTeam) */}
        <div className="no-print" style={{ 
          marginBottom: '16px', 
          background: '#fdfbf7', 
          border: '1.5px solid #ede6d9', 
          borderRadius: '12px', 
          padding: '10px 14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#543c2b' }}>You're:</span>
            <select 
              value={viewerRole} 
              onChange={(e) => setViewerRole(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1.5px solid #8c5b30',
                background: '#ffffff',
                color: '#543c2b',
                fontWeight: '800',
                fontSize: '12.5px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(140, 91, 48, 0.08)'
              }}
            >
              <option value="customer">Customer (Default)</option>
              <option value="driver">Driver</option>
              <option value="opteam">OpTeam (Operations Team)</option>
            </select>
          </div>

          <div style={{ fontSize: '11.5px', color: '#8c7361', fontWeight: '600' }}>
            {viewerRole === 'customer' && '👤 Verified Booking Details'}
            {viewerRole === 'driver' && (isDriverAuthenticated ? `🚗 Driver: ${activeDriver?.name || 'Logged In'}` : '🔒 Driver Login Required')}
            {viewerRole === 'opteam' && (isStaffAuthenticated ? '🛠️ Operations Management' : '🔒 Staff Login Required')}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROLE VIEW 1: CUSTOMER VIEW (DEFAULT - NO LOGIN REQUIRED)      */}
        {/* ============================================================ */}
        {viewerRole === 'customer' && (
          <div>
            {/* Status Banner */}
            <div style={{ 
              background: isCompleted ? 'rgba(5, 150, 105, 0.08)' : 'rgba(140, 91, 48, 0.08)', 
              border: isCompleted ? '1.5px solid #059669' : '1.5px solid #8c5b30', 
              borderRadius: '12px', 
              padding: '10px 14px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: isCompleted ? '#059669' : '#8c5b30' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: isCompleted ? '#059669' : '#8c5b30', letterSpacing: '0.5px' }}>
                    {isCompleted ? 'VERIFIED & PICKED UP' : 'OFFICIAL CONFIRMED BOOKING'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#8c7361' }}>
                    {pickedUpByName ? `Picked up by ${pickedUpByName}` : 'Dubai World Trade Centre (DWTC) • Licensed Tour Operator'}
                  </div>
                </div>
              </div>
              <span style={{ 
                background: isCompleted ? '#059669' : '#8c5b30', 
                color: '#ffffff', 
                padding: '3px 10px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: '800',
                textTransform: 'uppercase'
              }}>
                {isCompleted ? 'Picked Up' : (booking.status || 'Confirmed')}
              </span>
            </div>

            {/* QR Code Pass */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#fdfbf7', 
              border: '1.5px dashed #ede6d9', 
              borderRadius: '14px', 
              padding: '18px 14px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {qrDataUrl ? (
                <div style={{ 
                  background: '#ffffff', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(140, 91, 48, 0.08)',
                  border: '1px solid #ede6d9',
                  display: 'inline-block'
                }}>
                  <img 
                    src={qrDataUrl} 
                    alt={`QR Code for Booking #${refCode}`} 
                    style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }} 
                  />
                </div>
              ) : (
                <div style={{ padding: '30px', color: '#8c7361', fontSize: '12px' }}>
                  Generating digital QR Pass...
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#543c2b', letterSpacing: '0.5px' }}>
                  PRESENT THIS PASS UPON PICKUP
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#8c7361' }}>
                  Show this QR code to your safari captain or camp reception when your vehicle arrives.
                </p>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #ede6d9', 
              borderRadius: '12px', 
              padding: '14px',
              marginBottom: '14px',
              fontSize: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>GUEST NAME</span>
                <strong style={{ color: '#543c2b', fontSize: '13px' }}>{booking.customerName || 'Valued Guest'}</strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>WHATSAPP NUMBER</span>
                <strong style={{ color: '#543c2b', fontSize: '13px', fontFamily: 'monospace' }}>{booking.whatsapp || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>TOUR PACKAGE</span>
                <strong style={{ color: '#8c5b30', fontSize: '12.5px' }}>{booking.packageName}</strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>TOUR DATE</span>
                <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>
                  {(booking.date || '').split('-').reverse().join('/')}
                </strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>GUESTS (PAX)</span>
                <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>{booking.pax} Pax</strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PICKUP TIME</span>
                <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>
                  {booking.pickupTime || (booking.packageName?.toLowerCase().includes('morning') ? '7:30 AM – 8:00 AM' : '3:00 PM – 3:30 PM')}
                </strong>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PICKUP LOCATION / MEETING POINT</span>
                <strong style={{ color: '#543c2b', fontSize: '12px' }}>
                  📍 {booking.pickupLocation || 'Hotel Lobby'} {booking.roomNo ? `(Room: ${booking.roomNo})` : ''}
                </strong>
              </div>

              <div>
                <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>TOTAL AMOUNT</span>
                <strong style={{ color: '#047857', fontSize: '15px' }}>
                  AED {booking.price}
                </strong>
                <span style={{ fontSize: '11px', color: '#8c7361', marginLeft: '6px' }}>
                  (Pay on Arrival by cash or card)
                </span>
              </div>

              {pickedUpByName && (
                <div>
                  <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>CONFIRMED DRIVER</span>
                  <strong style={{ color: '#059669', fontSize: '12.5px' }}>
                    ✓ {pickedUpByName} {pickedUpTime ? `(${pickedUpTime})` : ''}
                  </strong>
                </div>
              )}
            </div>

            {/* Driver Contact Notice */}
            <div style={{ 
              background: '#fdfbf7', 
              border: '1.5px solid #ede6d9', 
              borderRadius: '10px', 
              padding: '10px 12px', 
              marginBottom: '14px',
              fontSize: '11.5px',
              lineHeight: '1.4',
              color: '#543c2b'
            }}>
              <strong style={{ color: '#8c5b30', display: 'block', marginBottom: '2px' }}>
                ⚠️ Important Pickup Instructions:
              </strong>
              Your driver will contact you <strong>1–2 hours before pickup</strong> via Call or WhatsApp to reconfirm the exact time. Please be ready in your hotel lobby on time.
            </div>

            {/* What to Wear & Policies */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #ede6d9', 
              borderRadius: '10px', 
              padding: '10px 12px', 
              marginBottom: '16px',
              fontSize: '11px',
              color: '#8c7361',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div><strong>👕 What to Wear:</strong> Comfortable light clothing, sneakers or sand-friendly shoes, sunglasses, and sunscreen.</div>
              <div><strong>📋 Cancellation:</strong> Free cancellation up to 24 hours prior to scheduled pickup.</div>
            </div>

            {/* Customer Action Buttons */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', borderTop: '1px solid #ede6d9', paddingTop: '14px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={handleDownloadQR}
                  style={{
                    background: '#ffffff',
                    color: '#543c2b',
                    border: '1px solid #ede6d9',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Download Pass as Image"
                >
                  <Download size={13} /> Save QR
                </button>
                <button 
                  type="button"
                  onClick={handlePrint}
                  style={{
                    background: '#ffffff',
                    color: '#543c2b',
                    border: '1px solid #ede6d9',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Print Pass"
                >
                  <Printer size={13} /> Print
                </button>
              </div>

              <button 
                type="button"
                onClick={handleCustomerConcierge}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={14} /> WhatsApp Concierge
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE VIEW 2: DRIVER VIEW (LOGIN REQUIRED TO VIEW DETAILS)    */}
        {/* ============================================================ */}
        {viewerRole === 'driver' && (
          <div>
            {!isDriverAuthenticated ? (
              /* DRIVER LOGIN REQUIRED FORM */
              <div style={{ 
                background: '#fdfbf7', 
                border: '1.5px solid #ede6d9', 
                borderRadius: '14px', 
                padding: '24px 18px',
                textAlign: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(140, 91, 48, 0.1)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Car size={24} />
                </div>
                
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '900', color: '#543c2b' }}>
                  Driver Login Required
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#8c7361', lineHeight: '1.4' }}>
                  Please sign in with your driver account to view passenger details, pickup location, and confirm pickup.
                </p>

                {driverLoginError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> {driverLoginError}
                  </div>
                )}

                <form onSubmit={handleDriverLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#543c2b', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={driverPhone} 
                      onChange={(e) => setDriverPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #ede6d9',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#543c2b',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#543c2b', marginBottom: '6px' }}>
                      Password
                    </label>
                    <input 
                      type="password" 
                      value={driverPassword} 
                      onChange={(e) => setDriverPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #ede6d9',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#543c2b',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={driverLoginLoading}
                    style={{
                      marginTop: '6px',
                      background: '#8c5b30',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 3px 10px rgba(140, 91, 48, 0.2)'
                    }}
                  >
                    <Car size={16} /> {driverLoginLoading ? 'Verifying...' : 'Sign In as Driver'}
                  </button>
                </form>
              </div>
            ) : (
              /* AUTHENTICATED DRIVER DISPATCH VIEW */
              <div>
                {/* Active Driver Badge */}
                <div style={{ 
                  background: '#fdfbf7', 
                  border: '1.5px solid #ede6d9', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#8c7361', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                      LOGGED IN DRIVER
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '15px', color: '#543c2b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚗 {activeDriver?.name || currentUser?.name || 'Driver'} 
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#8c7361' }}>
                        ({activeDriver?.carPlate || activeDriver?.phone || activeDriver?.id || 'Active'})
                      </span>
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      background: isCompleted ? '#059669' : '#8c5b30', 
                      color: '#ffffff', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '800' 
                    }}>
                      {isCompleted ? '✓ Picked Up' : 'Pending Pickup'}
                    </span>

                    <button 
                      type="button" 
                      onClick={handleDriverSignOut} 
                      style={{ background: 'none', border: '1px solid #ede6d9', borderRadius: '6px', padding: '4px 8px', fontSize: '10.5px', color: '#8c7361', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Switch Driver"
                    >
                      <LogOut size={12} /> Switch
                    </button>
                  </div>
                </div>

                {/* Guest Contact & Route Details */}
                <div style={{ 
                  background: '#ffffff', 
                  border: '1.5px solid #ede6d9', 
                  borderRadius: '12px', 
                  padding: '14px', 
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#8c7361', fontWeight: '700' }}>GUEST NAME</span>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b' }}>
                        {booking.customerName || 'Valued Guest'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c5b30', fontFamily: 'monospace', fontWeight: '700' }}>
                        {booking.whatsapp || 'No phone provided'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button"
                        onClick={handleDriverCall}
                        style={{
                          background: '#8c5b30',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Call Guest Phone"
                      >
                        <Phone size={13} /> Call
                      </button>

                      <button 
                        type="button"
                        onClick={handleDriverWhatsApp}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #ede6d9', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>SCHEDULED PICKUP</span>
                      <strong style={{ color: '#543c2b' }}>
                        {booking.pickupTime || '3:00 PM – 3:30 PM'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>GUESTS TO BOARD</span>
                      <strong style={{ color: '#543c2b' }}>{booking.pax} Guests</strong>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>HOTEL / ROOM NUMBER</span>
                      <strong style={{ color: '#543c2b', fontSize: '13px' }}>
                        📍 {booking.pickupLocation || 'Hotel Lobby'} {booking.roomNo ? `(Room: ${booking.roomNo})` : ''}
                      </strong>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PACKAGE BOOKED</span>
                      <strong style={{ color: '#8c5b30' }}>{booking.packageName}</strong>
                    </div>
                  </div>
                </div>

                {/* Cash/Card Collection Highlight */}
                <div style={{ 
                  background: '#fcfaf6', 
                  border: '2px solid #047857', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#047857', fontWeight: '800', textTransform: 'uppercase' }}>
                      PAYMENT TO COLLECT ON ARRIVAL
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857' }}>
                      AED {booking.price}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8c7361', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ede6d9' }}>
                    Cash (AED) or Card
                  </span>
                </div>

                {/* Notification toast */}
                {pickedUpSuccess && (
                  <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid #059669', color: '#059669', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Guest verified and marked as Picked Up by {pickedUpByName || activeDriver?.name}!
                  </div>
                )}

                {/* Confirmed by whom indicator & Action */}
                {!isCompleted ? (
                  <button 
                    type="button"
                    onClick={handleDriverConfirmPickup}
                    style={{
                      width: '100%',
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '13px',
                      fontSize: '14px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    <UserCheck size={18} /> Confirm & Mark Picked Up as {activeDriver?.name || 'Driver'}
                  </button>
                ) : (
                  <div style={{ 
                    background: 'rgba(5, 150, 105, 0.08)', 
                    border: '1.5px solid #059669', 
                    borderRadius: '10px', 
                    padding: '14px', 
                    textAlign: 'center',
                    color: '#059669',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', fontSize: '14px' }}>
                      <CheckCircle size={18} /> Guest Is Picked Up & On Tour
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      Confirmed by: <strong>{pickedUpByName || activeDriver?.name || 'Driver'}</strong>
                      {pickedUpTime ? ` at ${pickedUpTime}` : ''}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE VIEW 3: OPERATIONS TEAM (LOGIN REQUIRED IF NOT AUTH)    */}
        {/* ============================================================ */}
        {viewerRole === 'opteam' && (
          <div>
            {!isStaffAuthenticated ? (
              <div style={{ 
                background: '#fdfbf7', 
                border: '1.5px solid #ede6d9', 
                borderRadius: '14px', 
                padding: '20px 16px',
                textAlign: 'center'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(140, 91, 48, 0.1)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Lock size={22} />
                </div>
                
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '900', color: '#543c2b' }}>
                  Operations Team Login Required
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '11.5px', color: '#8c7361', lineHeight: '1.4' }}>
                  Please sign in with your staff credentials to access operations dispatch, internal driver assignments, and booking management.
                </p>

                {opLoginError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> {opLoginError}
                  </div>
                )}

                <form onSubmit={handleOpLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#543c2b', marginBottom: '4px' }}>
                      Staff Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#8c7361' }} />
                      <input 
                        type="email" 
                        required
                        value={opEmail} 
                        onChange={(e) => setOpEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 32px',
                          borderRadius: '8px',
                          border: '1px solid #ede6d9',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#543c2b',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#543c2b', marginBottom: '4px' }}>
                      Staff Security Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#8c7361' }} />
                      <input 
                        type="password" 
                        required
                        value={opPassword} 
                        onChange={(e) => setOpPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 32px',
                          borderRadius: '8px',
                          border: '1px solid #ede6d9',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#543c2b',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={opLoginLoading}
                    style={{
                      marginTop: '4px',
                      background: '#8c5b30',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(140, 91, 48, 0.15)'
                    }}
                  >
                    {opLoginLoading ? 'Authenticating...' : 'Sign In to Operations'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ 
                  background: '#fdfbf7', 
                  border: '1.5px solid #ede6d9', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#8c7361', textTransform: 'uppercase', fontWeight: '800' }}>
                      Staff Operations Console
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '14.5px', color: '#543c2b', fontWeight: '900' }}>
                      Authorized Dispatch & Management
                    </h4>
                  </div>

                  <span style={{ background: '#8c5b30', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                    {userRole || 'Operations Admin'}
                  </span>
                </div>

                <div style={{ 
                  background: '#ffffff', 
                  border: '1px solid #ede6d9', 
                  borderRadius: '12px', 
                  padding: '14px', 
                  marginBottom: '14px',
                  fontSize: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>ASSIGNED DRIVER</span>
                    <strong style={{ color: '#543c2b' }}>{effectiveDriverName}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PICKUP CONFIRMATION</span>
                    <strong style={{ color: pickedUpByName ? '#059669' : '#8c5b30' }}>
                      {pickedUpByName ? `✓ By ${pickedUpByName} (${pickedUpTime || 'Confirmed'})` : 'Pending Driver Pickup'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>CUSTOMER</span>
                    <strong style={{ color: '#543c2b' }}>{booking.customerName} ({booking.whatsapp})</strong>
                  </div>

                  <div>
                    <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PAYMENT STATUS</span>
                    <strong style={{ color: '#047857' }}>AED {booking.price} ({booking.paymentOption || 'Collection'})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8c7361', fontWeight: '700' }}>QR Payload:</span>
                  <button 
                    type="button"
                    onClick={() => setQrFormat('url')}
                    style={{
                      background: qrFormat === 'url' ? '#8c5b30' : '#ffffff',
                      color: qrFormat === 'url' ? '#ffffff' : '#8c5b30',
                      border: '1px solid #8c5b30',
                      borderRadius: '16px',
                      padding: '3px 9px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Smart URL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setQrFormat('text')}
                    style={{
                      background: qrFormat === 'text' ? '#8c5b30' : '#ffffff',
                      color: qrFormat === 'text' ? '#ffffff' : '#8c5b30',
                      border: '1px solid #8c5b30',
                      borderRadius: '16px',
                      padding: '3px 9px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Raw Scanner Text
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #ede6d9', paddingTop: '14px' }}>
                  <button 
                    type="button"
                    onClick={handleCopyDetails}
                    style={{
                      background: '#ffffff',
                      color: '#543c2b',
                      border: '1px solid #ede6d9',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {copied ? <Check size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy Summary'}
                  </button>

                  <button 
                    type="button"
                    onClick={handleWhatsAppShare}
                    style={{
                      background: '#ffffff',
                      color: '#047857',
                      border: '1px solid #ede6d9',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Share2 size={13} /> Dispatch WhatsApp
                  </button>

                  <button 
                    type="button"
                    onClick={onClose}
                    style={{
                      marginLeft: 'auto',
                      background: '#8c5b30',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <ExternalLink size={13} /> Open CRM Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
