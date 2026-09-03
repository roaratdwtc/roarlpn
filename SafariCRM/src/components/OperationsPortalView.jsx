import React, { useState, useMemo } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  MapPin, 
  Phone, 
  DollarSign, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import ScanVerifyModal from './ScanVerifyModal';

export default function OperationsPortalView({ 
  currentUser, 
  bookings = [], 
  setBookings, 
  drivers = [], 
  onSignOut 
}) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedBooking, setScannedBooking] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState('');
  const [notFoundMessage, setNotFoundMessage] = useState('');

  // Handle Finding Booking by Scanned Text or Reference
  const handleLookupBooking = (rawQuery) => {
    setNotFoundMessage('');
    setVerifySuccess('');

    const clean = (rawQuery || '').trim();
    if (!clean) return;

    // Search booking in central bookings database
    const found = (bookings || []).find(b => {
      const bId = (b.id || '').toLowerCase();
      const q = clean.toLowerCase();
      const numOnlyB = bId.replace(/\D/g, '');
      const numOnlyQ = q.replace(/\D/g, '');

      return (
        bId === q ||
        bId.replace(/^book-/, '') === q.replace(/^book-/, '') ||
        (numOnlyB && numOnlyB === numOnlyQ) ||
        (b.customerName && b.customerName.toLowerCase() === q) ||
        (b.whatsapp && b.whatsapp.replace(/\D/g, '').endsWith(numOnlyQ))
      );
    });

    if (found) {
      setScannedBooking(found);
      setSearchQuery('');
    } else {
      setNotFoundMessage(`No booking found matching reference "${clean}". Please verify QR code or check reference number.`);
    }
  };

  // Check-In / Verify Guest
  const handleConfirmCheckIn = () => {
    if (!scannedBooking || !setBookings) return;

    const operatorName = currentUser?.name || 'Operations Officer';
    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setBookings(prev => (prev || []).map(b => {
      if (b.id === scannedBooking.id) {
        return {
          ...b,
          status: 'confirmed',
          checkedInAt: checkInTime,
          verifiedByOperations: operatorName
        };
      }
      return b;
    }));

    setScannedBooking(prev => ({
      ...prev,
      status: 'confirmed',
      checkedInAt: checkInTime,
      verifiedByOperations: operatorName
    }));

    setVerifySuccess(`Guest ${scannedBooking.customerName} verified and checked-in successfully at ${checkInTime}!`);
    setTimeout(() => setVerifySuccess(''), 4000);
  };

  // Resolve Driver Name
  const assignedDriverNames = useMemo(() => {
    if (!scannedBooking?.driverId) return 'Not Assigned';
    const ids = String(scannedBooking.driverId).split(',').map(s => s.trim());
    const names = ids.map(id => {
      const match = drivers.find(d => d.id === id);
      return match ? match.name : id;
    });
    return names.join(', ');
  }, [scannedBooking, drivers]);

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', color: '#543c2b', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Top Navbar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1.5px solid #ede6d9',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(140, 91, 48, 0.1)',
            border: '1px solid rgba(140, 91, 48, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8c5b30'
          }}>
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b', lineHeight: '1.2' }}>
              Operations Verification Portal
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361' }}>
              Field Officer: <strong>{currentUser?.name || 'Operations Staff'}</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="btn btn-secondary"
          title="Sign Out"
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '8px',
            border: '1px solid #ede6d9'
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 40px' }}>
        {/* Verification Success Toast */}
        {verifySuccess && (
          <div style={{
            background: 'rgba(22, 163, 74, 0.1)',
            border: '1.5px solid rgba(22, 163, 74, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#15803d',
            fontWeight: '800',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} />
            <span>{verifySuccess}</span>
          </div>
        )}

        {/* Not Found Alert */}
        {notFoundMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: '#b91c1c',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{notFoundMessage}</span>
          </div>
        )}

        {/* Action Panel: Scan QR or Search */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #ede6d9',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(84,60,43,0.05)',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#543c2b' }}>
            Scan Guest Booking Pass
          </h3>
          <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#8c7361' }}>
            Use the camera to scan guest QR code, or type booking reference number
          </p>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(140, 91, 48, 0.2)'
            }}
          >
            <QrCode size={20} />
            <span>Launch Live Camera Scanner</span>
          </button>

          {/* Manual Reference Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupBooking(searchQuery);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Or enter booking reference (e.g. 1024 or customer name)"
              title="Booking Reference"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '800' }}
            >
              <Search size={14} style={{ marginRight: '4px' }} />
              Verify
            </button>
          </form>
        </div>

        {/* SCANNED BOOKING DETAILS CARD (ONLY SHOWS THE SCANNED BOOKING) */}
        {scannedBooking ? (
          <div style={{
            background: '#ffffff',
            border: '2px solid #8c5b30',
            borderRadius: '18px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(140, 91, 48, 0.08)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1.5px solid #ede6d9', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#8c5b30', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Booking Ref: #{scannedBooking.id}
                </span>
                <h2 style={{ margin: '4px 0 2px 0', fontSize: '20px', fontWeight: '900', color: '#543c2b' }}>
                  {scannedBooking.customerName || 'Valued Guest'}
                </h2>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#8c5b30' }}>
                  {scannedBooking.packageName}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: '900',
                  background: scannedBooking.checkedInAt ? 'rgba(22,163,74,0.1)' : 'rgba(140,91,48,0.1)',
                  color: scannedBooking.checkedInAt ? '#16a34a' : '#8c5b30'
                }}>
                  {scannedBooking.checkedInAt ? `CHECKED-IN (${scannedBooking.checkedInAt})` : (scannedBooking.status || 'CONFIRMED').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Scanned Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase' }}>Booking Date</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#543c2b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} style={{ color: '#8c5b30' }} />
                  <span>{scannedBooking.date}</span>
                </div>
              </div>

              <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase' }}>Pickup Time</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#543c2b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} style={{ color: '#8c5b30' }} />
                  <span>{scannedBooking.pickupTime || '14:30 - 15:00'}</span>
                </div>
              </div>

              <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase' }}>Number of Guests</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#543c2b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} style={{ color: '#8c5b30' }} />
                  <span>{scannedBooking.pax} Guests</span>
                </div>
              </div>

              <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase' }}>Payment Condition</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#543c2b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} style={{ color: '#8c5b30' }} />
                  <span>{scannedBooking.paymentOption || 'Payment on Arrival'} (AED {scannedBooking.price})</span>
                </div>
              </div>
            </div>

            {/* Additional Scoped Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ color: '#8c5b30', flexShrink: 0 }} />
                <span><strong>Pickup Location:</strong> {scannedBooking.pickupLocation || 'Standard Camp Meeting Point'}</span>
              </div>

              {scannedBooking.whatsapp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span><strong>Guest Phone:</strong> {scannedBooking.whatsapp}</span>
                  <a
                    href={`https://wa.me/${scannedBooking.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '800', textDecoration: 'none', marginLeft: '6px' }}
                  >
                    (Open WhatsApp)
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={16} style={{ color: '#8c5b30', flexShrink: 0 }} />
                <span><strong>Assigned Driver:</strong> {assignedDriverNames}</span>
              </div>

              {scannedBooking.notes && (
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#8c7361' }}>
                  <strong>Special Requests:</strong> {scannedBooking.notes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setScannedBooking(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '800' }}
              >
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Clear & Scan Next
              </button>

              <button
                type="button"
                onClick={handleConfirmCheckIn}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: '14px', fontWeight: '900' }}
              >
                <CheckCircle2 size={16} style={{ marginRight: '6px' }} />
                {scannedBooking.checkedInAt ? 'Re-Confirm Guest Check-In' : 'Confirm Guest Check-In'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1.5px dashed #ede6d9',
            borderRadius: '16px',
            padding: '50px 20px',
            textAlign: 'center',
            color: '#8c7361'
          }}>
            <ShieldCheck size={42} style={{ color: '#8c5b30', opacity: 0.5, marginBottom: '10px' }} />
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#543c2b' }}>
              Awaiting Booking Scan
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0' }}>
              Operations team can only view guest details by scanning their verification QR code or searching by reference number.
            </div>
          </div>
        )}
      </main>

      {/* QR Code Camera Scanner Modal */}
      {isScannerOpen && (
        <ScanVerifyModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(decodedText) => {
            setIsScannerOpen(false);
            handleLookupBooking(decodedText);
          }}
        />
      )}
    </div>
  );
}
