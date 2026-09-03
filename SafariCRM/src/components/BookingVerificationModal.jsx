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
  Phone 
} from 'lucide-react';

export default function BookingVerificationModal({ 
  booking, 
  onClose, 
  onUpdateBookingStatus, 
  drivers = [],
  partners = [] 
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrFormat, setQrFormat] = useState('url'); // 'url' (smart camera link) or 'text' (raw scanner payload)
  const printableRef = useRef(null);

  if (!booking) return null;

  const refCode = (booking.id || '').replace(/^book-/, '').toUpperCase();
  const assignedDriverNames = (booking.driverId || '')
    .split(',')
    .map(id => (drivers || []).find(d => d.id === id)?.name || id)
    .filter(Boolean)
    .join(' / ') || 'Unassigned';

  const partnerName = (partners || []).find(p => p.id === booking.partnerId)?.name || booking.partnerId || 'Direct';

  // Format the URL for camera scanners (opens the verification screen with full payload embedded)
  const verifyUrl = `${window.location.origin}${window.location.pathname}?verifyBooking=${encodeURIComponent(booking.id)}&ref=${encodeURIComponent(refCode)}&name=${encodeURIComponent(booking.customerName || '')}&phone=${encodeURIComponent(booking.whatsapp || '')}&pax=${booking.pax || 1}&pkg=${encodeURIComponent(booking.packageName || '')}&date=${encodeURIComponent(booking.date || '')}&price=${encodeURIComponent(booking.price || 0)}&status=${encodeURIComponent(booking.status || 'confirmed')}&loc=${encodeURIComponent(booking.pickupLocation || '')}&time=${encodeURIComponent(booking.pickupTime || '')}&driver=${encodeURIComponent(assignedDriverNames)}`;

  // Format raw text for barcode/text scanners
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
    `Pickup Time: ${booking.pickupTime || 'N/A'}`,
    booking.addonName ? `Addons: ${booking.addonName} (+AED ${booking.addonPrice || 0})` : null,
    `Driver: ${assignedDriverNames}`,
    `Total: AED ${booking.price || 0} (${booking.paymentOption || 'Payment on Arrival'})`,
    `Status: ${(booking.status || 'confirmed').toUpperCase()}`,
    `Security Code: ROAR-${refCode}-${(booking.date || '').replace(/-/g, '')}`
  ].filter(Boolean).join('\n');

  // Generate QR Code data URL whenever booking or format changes
  useEffect(() => {
    const payload = qrFormat === 'url' ? verifyUrl : textSummary;
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#543c2b', // luxury warm deep brown
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
    a.download = `Roar_Booking_QR_${refCode}.png`;
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
    const text = `*ROAR ADVENTURE TOURISM - BOOKING PASS*\n\n` +
      `*Reference:* #${refCode}\n` +
      `*Guest:* ${booking.customerName}\n` +
      `*Tour Date:* ${(booking.date || '').split('-').reverse().join('/')}\n` +
      `*Package:* ${booking.packageName}\n` +
      `*Guests:* ${booking.pax} Pax\n` +
      `*Pickup:* ${booking.pickupLocation || 'Hotel Lobby'} at ${booking.pickupTime || '3:30 PM'}\n` +
      `*Total Price:* AED ${booking.price} (${booking.paymentOption || 'Pay on Arrival'})\n` +
      `*Status:* ${(booking.status || 'confirmed').toUpperCase()}\n\n` +
      `*Verify Online Pass:* ${verifyUrl}`;

    const url = `https://wa.me/${(booking.whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isConfirmed = (booking.status || 'confirmed').toLowerCase() === 'confirmed';
  const isCompleted = (booking.status || '').toLowerCase() === 'completed';

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="modal-content" 
        ref={printableRef}
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          background: '#ffffff', 
          border: '1.5px solid #ede6d9', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 20px 40px rgba(84, 60, 43, 0.12)',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ede6d9', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(140, 91, 48, 0.1)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#543c2b', fontFamily: 'var(--font-heading)' }}>
                Booking QR Verification Pass
              </h3>
              <span style={{ fontSize: '11.5px', color: '#8c7361' }}>
                Ref #{refCode} • For Operations & Camp Verification
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="modal-close no-print" 
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8c7361' }}
          >
            &times;
          </button>
        </div>

        {/* Security Verified Banner */}
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
                {isCompleted ? 'VERIFIED & CHECKED-IN' : 'OFFICIAL VERIFIED BOOKING PASS'}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Roar Adventure Tourism LLC • Dubai, UAE
              </div>
            </div>
          </div>
          <span style={{ 
            background: isCompleted ? '#059669' : '#8c5b30', 
            color: '#ffffff', 
            padding: '3px 9px', 
            borderRadius: '20px', 
            fontSize: '11px', 
            fontWeight: '800',
            textTransform: 'uppercase'
          }}>
            {booking.status || 'Confirmed'}
          </span>
        </div>

        {/* QR Code Center Showcase */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#fdfbf7', 
          border: '1.5px dashed #ede6d9', 
          borderRadius: '14px', 
          padding: '20px 16px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {qrDataUrl ? (
            <div style={{ 
              background: '#ffffff', 
              padding: '12px', 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(84, 60, 43, 0.08)',
              border: '1px solid #ede6d9',
              display: 'inline-block'
            }}>
              <img 
                src={qrDataUrl} 
                alt={`QR Code for Booking #${refCode}`} 
                style={{ width: '190px', height: '190px', display: 'block', objectFit: 'contain' }} 
              />
            </div>
          ) : (
            <div style={{ padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Generating secure QR Code...
            </div>
          )}

          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#543c2b', letterSpacing: '0.5px' }}>
              SCAN TO VERIFY DETAILS
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8c7361' }}>
              Operations team can scan with any phone camera to verify and acknowledge this booking.
            </p>
          </div>

          {/* Toggle Format (URL vs Text) */}
          <div className="no-print" style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button 
              type="button"
              onClick={() => setQrFormat('url')}
              style={{
                background: qrFormat === 'url' ? '#8c5b30' : '#ffffff',
                color: qrFormat === 'url' ? '#ffffff' : '#8c5b30',
                border: '1px solid #8c5b30',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '10.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📱 Smart Camera Link
            </button>
            <button 
              type="button"
              onClick={() => setQrFormat('text')}
              style={{
                background: qrFormat === 'text' ? '#8c5b30' : '#ffffff',
                color: qrFormat === 'text' ? '#ffffff' : '#8c5b30',
                border: '1px solid #8c5b30',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '10.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📄 Raw Data Text
            </button>
          </div>
        </div>

        {/* Structured Booking Details Grid */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #ede6d9', 
          borderRadius: '12px', 
          padding: '14px',
          marginBottom: '16px',
          fontSize: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px'
        }}>
          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>GUEST NAME</span>
            <strong style={{ color: '#543c2b', fontSize: '13px' }}>{booking.customerName || 'N/A'}</strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>WHATSAPP / PHONE</span>
            <strong style={{ color: '#543c2b', fontSize: '13px', fontFamily: 'monospace' }}>{booking.whatsapp || 'N/A'}</strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>TOUR PACKAGE</span>
            <strong style={{ color: '#8c5b30', fontSize: '12.5px' }}>{booking.packageName}</strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>TOUR DATE</span>
            <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>
              {(booking.date || '').split('-').reverse().join('/')}
            </strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>GUESTS (PAX)</span>
            <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>{booking.pax} Pax</strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>PICKUP TIME</span>
            <strong style={{ color: '#543c2b', fontSize: '12.5px' }}>{booking.pickupTime || '3:30 PM'}</strong>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>PICKUP LOCATION / MEETING POINT</span>
            <strong style={{ color: '#543c2b', fontSize: '12px' }}>
              {booking.pickupLocation || 'Hotel Lobby'} {booking.roomNo ? `(Room: ${booking.roomNo})` : ''}
            </strong>
          </div>

          {booking.addonName && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>OPTIONAL ADD-ONS</span>
              <strong style={{ color: '#8c5b30', fontSize: '12px' }}>
                {booking.addonName} (+AED {booking.addonPrice || 0})
              </strong>
            </div>
          )}

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>ASSIGNED DRIVER(S)</span>
            <strong style={{ color: '#543c2b', fontSize: '12px' }}>{assignedDriverNames}</strong>
          </div>

          <div>
            <span style={{ color: '#8c7361', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>TOTAL AMOUNT</span>
            <strong style={{ color: '#047857', fontSize: '14px' }}>
              AED {booking.price}
            </strong>
            <span style={{ fontSize: '10.5px', color: '#8c7361', marginLeft: '4px' }}>
              ({booking.paymentOption === 'Collection' ? 'Pay on Arrival' : (booking.paymentOption || 'Pay on Arrival')})
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', borderTop: '1px solid #ede6d9', paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={handleDownloadQR}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Download QR Image"
            >
              <Download size={13} /> Save QR
            </button>
            <button 
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Print Voucher"
            >
              <Printer size={13} /> Print
            </button>
            <button 
              type="button"
              onClick={handleCopyDetails}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Copy Summary Text"
            >
              {copied ? <Check size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button 
              type="button"
              onClick={handleWhatsAppShare}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#047857' }}
              title="Share Pass via WhatsApp"
            >
              <Share2 size={13} /> WhatsApp
            </button>
          </div>

          {onUpdateBookingStatus && !isCompleted && (
            <button 
              type="button"
              onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
              className="btn btn-primary"
              style={{ fontSize: '11.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#059669', borderColor: '#059669', color: '#ffffff' }}
              title="Mark booking as verified and checked-in"
            >
              <CheckCircle size={14} /> Verify & Check-In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
