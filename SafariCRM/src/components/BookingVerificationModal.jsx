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
  MessageSquare
} from 'lucide-react';

export default function BookingVerificationModal({ 
  booking, 
  onClose, 
  onUpdateBookingStatus, 
  drivers = [],
  partners = [],
  isAuthenticated: isAuthenticatedProp = false,
  userRole = '',
  onLoginSuccess = null
}) {
  const isSessionAuth = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('safari_admin_authenticated') === 'true';
  const isStaffAuthenticated = isAuthenticatedProp || isSessionAuth;

  // Dropdown / Role state: 'customer' (default) | 'driver' | 'opteam'
  const [viewerRole, setViewerRole] = useState('customer');

  // Driver action state
  const [pickedUp, setPickedUp] = useState(
    Boolean(booking?.status === 'completed' || booking?.status === 'verified' || booking?.status === 'picked_up')
  );
  const [pickedUpSuccess, setPickedUpSuccess] = useState(false);

  // OpTeam embedded login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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

  const isCompleted = pickedUp || booking.status === 'completed' || booking.status === 'verified' || booking.status === 'picked_up';

  const verifyUrl = `${window.location.origin}${window.location.pathname}?verifyBooking=${encodeURIComponent(booking.id)}&ref=${encodeURIComponent(refCode)}&name=${encodeURIComponent(booking.customerName || '')}&phone=${encodeURIComponent(booking.whatsapp || '')}&pax=${booking.pax || 1}&pkg=${encodeURIComponent(booking.packageName || '')}&date=${encodeURIComponent(booking.date || '')}&price=${encodeURIComponent(booking.price || 0)}&status=${encodeURIComponent(booking.status || 'confirmed')}&loc=${encodeURIComponent(booking.pickupLocation || '')}&time=${encodeURIComponent(booking.pickupTime || '')}&driver=${encodeURIComponent(assignedDriverNames)}`;

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
    assignedDriverNames !== 'Unassigned' ? `Driver: ${assignedDriverNames}` : null,
    `Total: AED ${booking.price || 0} (${booking.paymentOption || 'Payment on Arrival'})`,
    `Status: ${isCompleted ? 'VERIFIED' : (booking.status || 'confirmed').toUpperCase()}`,
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
  }, [booking, qrFormat, verifyUrl, textSummary]);

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
    const msg = encodeURIComponent(
      `Hello ${booking.customerName || 'Guest'}, this is your safari driver from Roar Adventure Tourism! I will be picking you up at ${booking.pickupTime || '3:00 PM – 3:30 PM'} from ${booking.pickupLocation || 'your hotel lobby'}. Please let me know when you are ready!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleDriverMarkPickedUp = async () => {
    setPickedUp(true);
    setPickedUpSuccess(true);
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, 'picked_up');
    }
    try {
      await fetch('api.php?action=save&table=bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          id: booking.id,
          status: 'picked_up'
        })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    setTimeout(() => setPickedUpSuccess(false), 4000);
  };

  const handleOpLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      const email_lower = loginEmail.toLowerCase();
      if (email_lower === 'abid@dxbaiseo.com' && loginPassword === 'D4dangerous3636!') {
        if (onLoginSuccess) onLoginSuccess('master_admin');
        setLoginLoading(false);
        return;
      }
      if (email_lower === 'info@roaradventuretourism.com' && loginPassword === 'R4roar!786*') {
        if (onLoginSuccess) onLoginSuccess('company_admin', 'roar', {
          id: 'roar',
          name: 'Roar Adventure Tourism LLC',
          slug: 'roar',
          email: 'info@roaradventuretourism.com',
          whatsapp: '+97145578679',
          address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
          contactPerson: 'Mr. Abid Ali'
        });
        setLoginLoading(false);
        return;
      }
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const match = cached.find(c => c.email.toLowerCase() === email_lower && c.password === loginPassword);
      if (match) {
        if (onLoginSuccess) onLoginSuccess('company_admin', match.id, match);
      } else {
        setLoginError('Invalid credentials. Please check your email and password.');
      }
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (onLoginSuccess) onLoginSuccess(data.role, data.company_id, data.company);
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
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
        {/* Top Role Selector & Header Bar */}
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

        {/* ROLE SELECTION DROPDOWN (Customer by default, Driver, OpTeam) */}
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
            {viewerRole === 'driver' && '🚗 Driver Pickup & Verification'}
            {viewerRole === 'opteam' && (isStaffAuthenticated ? '🛠️ Operations Management' : '🔒 Staff Login Required')}
          </div>
        </div>

        {/* ROLE VIEW 1: CUSTOMER VIEW (DEFAULT - NO LOGIN REQUIRED) */}
        {viewerRole === 'customer' && (
          <div>
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
                    {isCompleted ? 'VERIFIED & CONFIRMED' : 'OFFICIAL CONFIRMED BOOKING'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#8c7361' }}>
                    Dubai World Trade Centre (DWTC) • Licensed Tour Operator
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
                {isCompleted ? 'Checked-In' : (booking.status || 'Confirmed')}
              </span>
            </div>

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
            </div>

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

        {/* ROLE VIEW 2: DRIVER VIEW (NO LOGIN REQUIRED) */}
        {viewerRole === 'driver' && (
          <div>
            <div style={{ 
              background: '#fdfbf7', 
              border: '1.5px solid #ede6d9', 
              borderRadius: '12px', 
              padding: '12px 14px', 
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#8c7361', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Driver Dispatch Ticket
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '15px', color: '#543c2b', fontWeight: '900' }}>
                  Pickup & Guest Verification
                </h4>
              </div>

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
            </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#8c7361', fontWeight: '700' }}>GUEST NAME</span>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#543c2b' }}>
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
                  <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>
                    📍 {booking.pickupLocation || 'Hotel Lobby'} {booking.roomNo ? `(Room: ${booking.roomNo})` : ''}
                  </strong>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PACKAGE BOOKED</span>
                  <strong style={{ color: '#8c5b30' }}>{booking.packageName}</strong>
                </div>
              </div>
            </div>

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

            {pickedUpSuccess && (
              <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid #059669', color: '#059669', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Guest verified and marked as Picked Up! Status synced with operations.
              </div>
            )}

            {!isCompleted ? (
              <button 
                type="button"
                onClick={handleDriverMarkPickedUp}
                style={{
                  width: '100%',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
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
                <UserCheck size={18} /> Mark Guest as Picked Up
              </button>
            ) : (
              <div style={{ 
                background: 'rgba(5, 150, 105, 0.08)', 
                border: '1.5px solid #059669', 
                borderRadius: '10px', 
                padding: '12px', 
                textAlign: 'center',
                color: '#059669',
                fontWeight: '800',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <CheckCircle size={18} /> Guest Is Picked Up & On Tour
              </div>
            )}
          </div>
        )}

        {/* ROLE VIEW 3: OPERATIONS TEAM (LOGIN REQUIRED IF NOT AUTH) */}
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

                {loginError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> {loginError}
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
                        placeholder="e.g. info@roaradventuretourism.com" 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        placeholder="••••••••••••" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)}
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
                    disabled={loginLoading}
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
                    {loginLoading ? 'Authenticating...' : 'Sign In to Operations'}
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
                    <strong style={{ color: '#543c2b' }}>{assignedDriverNames}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#8c7361', display: 'block', fontSize: '10px', fontWeight: '700' }}>PARTNER / SOURCE</span>
                    <strong style={{ color: '#543c2b' }}>{booking.partnerId || 'Direct Website / WhatsApp'}</strong>
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
