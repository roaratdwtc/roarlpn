import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle, 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function ScanVerifyModal({ 
  isOpen, 
  onClose, 
  bookings = [], 
  onUpdateBookingStatus, 
  onOpenBookingQrPass,
  drivers = [] 
}) {
  const [scanInput, setScanInput] = useState('');
  const [matchedBooking, setMatchedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedInSuccess, setCheckedInSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScanInput('');
      setMatchedBooking(null);
      setErrorMsg('');
      setCheckedInSuccess(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process scanner / text input
  const handleVerify = (rawInput) => {
    const input = (rawInput || scanInput).trim();
    if (!input) return;

    setErrorMsg('');
    setCheckedInSuccess(false);

    // Check if input is a verification URL (e.g. from camera scanner)
    let searchRef = input;
    if (input.includes('verifyBooking=')) {
      try {
        const urlObj = new URL(input);
        searchRef = urlObj.searchParams.get('verifyBooking') || searchRef;
      } catch (e) {
        const match = input.match(/verifyBooking=([^&]+)/);
        if (match) searchRef = decodeURIComponent(match[1]);
      }
    }

    const cleanRef = searchRef.replace(/^book-/, '').replace(/^#/, '').toLowerCase();

    // Find in bookings array
    const found = bookings.find(b => {
      const bId = (b.id || '').replace(/^book-/, '').toLowerCase();
      if (bId === cleanRef || (b.id || '').toLowerCase() === searchRef.toLowerCase()) return true;
      if ((b.customerName || '').toLowerCase().includes(cleanRef) && cleanRef.length > 3) return true;
      if ((b.whatsapp || '').replace(/[^0-9]/g, '').includes(cleanRef.replace(/[^0-9]/g, '')) && cleanRef.length > 5) return true;
      return false;
    });

    if (found) {
      setMatchedBooking(found);
      setErrorMsg('');
    } else {
      setMatchedBooking(null);
      setErrorMsg(`No booking record found matching "${input}". Please check the ID or search by guest name/phone.`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify(scanInput);
    }
  };

  const handleCheckIn = () => {
    if (!matchedBooking || !onUpdateBookingStatus) return;
    onUpdateBookingStatus(matchedBooking.id, 'completed');
    setCheckedInSuccess(true);
    // Update local state to reflect completed
    setMatchedBooking(prev => ({ ...prev, status: 'completed' }));
  };

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled').slice(0, 5);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="modal-content"
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          background: '#ffffff', 
          border: '1.5px solid #ede6d9', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 20px 40px rgba(84, 60, 43, 0.12)',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede6d9', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(140, 91, 48, 0.1)', color: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#543c2b', fontFamily: 'var(--font-heading)' }}>
                Scan & Verify Booking Pass
              </h3>
              <span style={{ fontSize: '11px', color: '#8c7361' }}>
                Operations Team Check-In & Gate Verification
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="modal-close" 
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8c7361' }}
          >
            &times;
          </button>
        </div>

        {/* Scan Input Box */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#543c2b', marginBottom: '6px' }}>
            SCAN QR BARCODE OR ENTER BOOKING REFERENCE:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                ref={inputRef}
                type="text" 
                className="form-control"
                placeholder="Scan QR or type Ref# (e.g. 1000123) or phone..."
                value={scanInput}
                onChange={(e) => {
                  setScanInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: '34px', fontSize: '13px', height: '40px', borderRadius: '8px' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#8c7361' }} />
            </div>
            <button 
              type="button" 
              onClick={() => handleVerify(scanInput)}
              className="btn btn-primary"
              style={{ padding: '0 18px', height: '40px', fontSize: '12.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Verify <ArrowRight size={14} />
            </button>
          </div>
          <span style={{ fontSize: '10.5px', color: '#8c7361', marginTop: '4px', display: 'block' }}>
            Compatible with barcode scanners, phone cameras, or manual reference number typing.
          </span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Check-In Success Notice */}
        {checkedInSuccess && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={18} style={{ color: '#059669' }} />
            <span>Booking verified and guest successfully checked in!</span>
          </div>
        )}

        {/* Matched Booking Verified Card */}
        {matchedBooking ? (
          <div style={{ 
            background: '#ffffff', 
            border: matchedBooking.status === 'completed' ? '2px solid #059669' : '2px solid #8c5b30', 
            borderRadius: '14px', 
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 14px rgba(84, 60, 43, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: matchedBooking.status === 'completed' ? '#059669' : '#8c5b30' }} />
                <div>
                  <span style={{ fontSize: '11px', color: '#8c7361', fontWeight: '700' }}>VERIFIED BOOKING REFERENCE</span>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b', fontFamily: 'monospace' }}>
                    #{matchedBooking.id.replace(/^book-/, '').toUpperCase()}
                  </div>
                </div>
              </div>
              <span style={{ 
                background: matchedBooking.status === 'completed' ? '#059669' : (matchedBooking.status === 'cancelled' ? '#ef4444' : '#8c5b30'), 
                color: '#ffffff', 
                padding: '3px 10px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: '800',
                textTransform: 'uppercase'
              }}>
                {matchedBooking.status || 'Confirmed'}
              </span>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>GUEST NAME</span>
                <strong style={{ color: '#543c2b', display: 'block', fontSize: '13px' }}>{matchedBooking.customerName}</strong>
              </div>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>WHATSAPP</span>
                <strong style={{ color: '#543c2b', display: 'block', fontSize: '12.5px', fontFamily: 'monospace' }}>{matchedBooking.whatsapp}</strong>
              </div>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>TOUR PACKAGE</span>
                <strong style={{ color: '#8c5b30', display: 'block', fontSize: '12.5px' }}>{matchedBooking.packageName}</strong>
              </div>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>TOUR DATE & GUESTS</span>
                <strong style={{ color: '#543c2b', display: 'block', fontSize: '12.5px' }}>
                  {(matchedBooking.date || '').split('-').reverse().join('/')} • {matchedBooking.pax} Pax
                </strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>PICKUP LOCATION</span>
                <strong style={{ color: '#543c2b', display: 'block', fontSize: '12px' }}>
                  {matchedBooking.pickupLocation || 'Hotel Lobby'} {matchedBooking.roomNo ? `(Room: ${matchedBooking.roomNo})` : ''} at {matchedBooking.pickupTime || '3:30 PM'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>PAYMENT TO COLLECT</span>
                <strong style={{ color: '#047857', display: 'block', fontSize: '14px' }}>
                  AED {matchedBooking.price} <span style={{ fontSize: '11px', color: '#8c7361', fontWeight: 'normal' }}>({matchedBooking.paymentOption || 'Pay on Arrival'})</span>
                </strong>
              </div>
              <div>
                <span style={{ color: '#8c7361', fontSize: '10.5px', fontWeight: '700' }}>ASSIGNED DRIVER</span>
                <strong style={{ color: '#543c2b', display: 'block', fontSize: '12px' }}>
                  {(matchedBooking.driverId || '').split(',').map(id => (drivers || []).find(d => d.id === id)?.name || id).filter(Boolean).join(' / ') || 'Unassigned'}
                </strong>
              </div>
            </div>

            {/* Check-in & Pass buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #ede6d9', paddingTop: '12px' }}>
              {matchedBooking.status !== 'completed' && (
                <button 
                  type="button" 
                  onClick={handleCheckIn}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px 14px', fontSize: '12.5px', fontWeight: '800', background: '#059669', borderColor: '#059669', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircle size={15} /> Check-In Guest Now
                </button>
              )}
              {onOpenBookingQrPass && (
                <button 
                  type="button" 
                  onClick={() => {
                    onClose();
                    onOpenBookingQrPass(matchedBooking);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <QrCode size={14} /> View Full QR Pass
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Today's Quick Check-In List */
          todayBookings.length > 0 && (
            <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#543c2b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} style={{ color: '#8c5b30' }} /> TODAY'S BOOKINGS ({todayBookings.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {todayBookings.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => {
                      setScanInput(b.id);
                      handleVerify(b.id);
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '8px 10px', 
                      background: '#ffffff', 
                      border: '1px solid #ede6d9', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#543c2b' }}>{b.customerName}</strong>
                      <span style={{ color: '#8c7361', marginLeft: '6px' }}>#{b.id.replace(/^book-/, '')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#8c5b30' }}>{b.pax} Pax</span>
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: b.status === 'completed' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(140, 91, 48, 0.1)',
                        color: b.status === 'completed' ? '#059669' : '#8c5b30',
                        fontWeight: '700'
                      }}>
                        {b.status || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
