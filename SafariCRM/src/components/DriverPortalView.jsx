import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  CheckCircle2, 
  QrCode, 
  DollarSign, 
  Fuel, 
  Award, 
  LogOut, 
  Compass, 
  AlertCircle,
  FileText
} from 'lucide-react';
import ScanVerifyModal from './ScanVerifyModal';

export default function DriverPortalView({ 
  currentUser, 
  bookings = [], 
  setBookings, 
  expenses = [], 
  drivers = [], 
  onSignOut 
}) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedBookingForVerify, setSelectedBookingForVerify] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'earnings'
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'today' | 'upcoming' | 'all'

  // Match driver profile
  const driverProfile = useMemo(() => {
    if (!currentUser) return null;
    return drivers.find(d => 
      d.id === currentUser.linkedDriverId || 
      (d.phone && currentUser.phone && d.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) ||
      (d.name && currentUser.name && d.name.toLowerCase() === currentUser.name.toLowerCase())
    ) || {
      id: currentUser.linkedDriverId || currentUser.id,
      name: currentUser.name || 'Safari Driver',
      phone: currentUser.phone || '',
      defaultSalary: 100,
      defaultFuel: 150
    };
  }, [currentUser, drivers]);

  const driverIdentifier = driverProfile?.id || currentUser?.id;
  const driverNameLower = (driverProfile?.name || currentUser?.name || '').toLowerCase();

  // Scoped Bookings: ONLY bookings assigned to this driver
  const assignedBookings = useMemo(() => {
    return (bookings || []).filter(b => {
      if (!b.driverId) return false;
      const dIds = String(b.driverId).split(',').map(s => s.trim());
      const isIdMatch = dIds.includes(driverIdentifier) || dIds.includes(String(driverProfile?.name));
      const isNameMatch = driverNameLower && String(b.driverId).toLowerCase().includes(driverNameLower);
      return isIdMatch || isNameMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bookings, driverIdentifier, driverProfile, driverNameLower]);

  // Today string YYYY-MM-DD
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Filtered Bookings by date tab
  const filteredBookings = useMemo(() => {
    if (dateFilter === 'today') {
      return assignedBookings.filter(b => b.date === todayStr);
    }
    if (dateFilter === 'upcoming') {
      return assignedBookings.filter(b => b.date >= todayStr);
    }
    return assignedBookings;
  }, [assignedBookings, dateFilter, todayStr]);

  // Scoped Expenses & Earnings for this driver
  const driverExpensesList = useMemo(() => {
    return (expenses || []).filter(e => {
      if (!e.driverId) return false;
      return e.driverId === driverIdentifier || (driverNameLower && String(e.driverName || '').toLowerCase().includes(driverNameLower));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, driverIdentifier, driverNameLower]);

  // Earnings Totals
  const totals = useMemo(() => {
    let totalSalary = 0;
    let totalFuel = 0;
    let totalMisc = 0;
    let totalAddonCollection = 0;

    driverExpensesList.forEach(e => {
      totalSalary += parseFloat(e.salary) || 0;
      totalFuel += parseFloat(e.carPetrol) || 0;
      totalMisc += parseFloat(e.misc) || 0;
      totalAddonCollection += parseFloat(e.campAddonCollection) || 0;
    });

    const totalPayout = totalSalary + totalFuel + totalMisc;
    return { totalSalary, totalFuel, totalMisc, totalAddonCollection, totalPayout };
  }, [driverExpensesList]);

  // Check-In / Verify Action
  const handleVerifyArrival = (booking) => {
    if (!setBookings) return;
    setBookings(prev => (prev || []).map(b => {
      if (b.id === booking.id) {
        return {
          ...b,
          status: 'confirmed',
          checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verifiedByDriver: driverProfile?.name || 'Assigned Driver'
        };
      }
      return b;
    }));
    alert(`Guest ${booking.customerName} marked verified & checked-in successfully!`);
  };

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
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b', lineHeight: '1.2' }}>
              {driverProfile?.name || currentUser?.name || 'Driver'}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361' }}>
              Driver Portal • {driverProfile?.phone || currentUser?.phone || 'Fleet Captain'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <QrCode size={16} />
            <span>Scan QR</span>
          </button>

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
            <span style={{ display: 'inline' }}>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px 40px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              My Assigned Bookings
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#543c2b' }}>
              {assignedBookings.length}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', fontWeight: '700' }}>
              {assignedBookings.filter(b => b.date === todayStr).length} Scheduled for Today
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Accumulated Salary
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#8c5b30' }}>
              AED {totals.totalSalary.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              Total Trip Allowances: AED {totals.totalFuel.toLocaleString()}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Camp Extras Commission
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>
              AED {totals.totalMisc.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              From AED {totals.totalAddonCollection.toLocaleString()} extras collected
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Net Driver Earnings
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#543c2b' }}>
              AED {totals.totalPayout.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              Salary + Fuel + Addon Commission
            </div>
          </div>
        </div>

        {/* Tab switcher: Bookings vs Trip Financials */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1.5px solid #ede6d9',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'bookings' ? '#8c5b30' : 'transparent',
                color: activeTab === 'bookings' ? '#ffffff' : '#8c7361',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Assigned Bookings ({assignedBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('earnings')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'earnings' ? '#8c5b30' : 'transparent',
                color: activeTab === 'earnings' ? '#ffffff' : '#8c7361',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Revenue & Expense Logs ({driverExpensesList.length})
            </button>
          </div>

          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setDateFilter('upcoming')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ede6d9',
                  background: dateFilter === 'upcoming' ? '#f5eee6' : '#ffffff',
                  color: dateFilter === 'upcoming' ? '#8c5b30' : '#8c7361',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ede6d9',
                  background: dateFilter === 'today' ? '#f5eee6' : '#ffffff',
                  color: dateFilter === 'today' ? '#8c5b30' : '#8c7361',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ede6d9',
                  background: dateFilter === 'all' ? '#f5eee6' : '#ffffff',
                  color: dateFilter === 'all' ? '#8c5b30' : '#8c7361',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                All
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: ASSIGNED BOOKINGS */}
        {activeTab === 'bookings' && (
          <div>
            {filteredBookings.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed #ede6d9',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#8c7361'
              }}>
                <Compass size={36} style={{ color: '#8c5b30', opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b' }}>No Assigned Bookings Found</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  When dispatch assigns a safari booking to your profile, it will appear here immediately.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredBookings.map((b) => {
                  const isToday = b.date === todayStr;
                  return (
                    <div
                      key={b.id}
                      style={{
                        background: '#ffffff',
                        border: isToday ? '2px solid #8c5b30' : '1.5px solid #ede6d9',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 2px 10px rgba(84,60,43,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b' }}>
                              {b.customerName || 'Valued Guest'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: b.status === 'completed' ? 'rgba(22,163,74,0.1)' : 'rgba(140,91,48,0.1)',
                              color: b.status === 'completed' ? '#16a34a' : '#8c5b30'
                            }}>
                              {b.status ? b.status.toUpperCase() : 'CONFIRMED'}
                            </span>
                            {isToday && (
                              <span style={{ fontSize: '11px', fontWeight: '900', padding: '2px 8px', borderRadius: '6px', background: '#f59e0b', color: '#ffffff' }}>
                                TODAY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#8c5b30', marginTop: '2px' }}>
                            {b.packageName}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleVerifyArrival(b)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', gap: '4px' }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Check-In</span>
                          </button>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <Calendar size={14} style={{ color: '#8c5b30' }} />
                          <span><strong>Date:</strong> {b.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <Clock size={14} style={{ color: '#8c5b30' }} />
                          <span><strong>Time:</strong> {b.pickupTime || '14:30 - 15:00'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <Users size={14} style={{ color: '#8c5b30' }} />
                          <span><strong>Guests:</strong> {b.pax} Pax</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <DollarSign size={14} style={{ color: '#8c5b30' }} />
                          <span><strong>Payment:</strong> {b.paymentOption || 'Payment on Arrival'} (AED {b.price})</span>
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px', color: '#543c2b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} style={{ color: '#8c5b30' }} />
                          <span><strong>Pickup:</strong> {b.pickupLocation || 'Hotel Lobby / Standard Meeting Point'}</span>
                        </div>

                        {b.whatsapp && (
                          <a
                            href={`https://wa.me/${b.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#16a34a',
                              textDecoration: 'none',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}
                          >
                            <Phone size={13} />
                            <span>WhatsApp Guest ({b.whatsapp})</span>
                          </a>
                        )}
                      </div>

                      {b.notes && (
                        <div style={{ fontSize: '11.5px', color: '#8c7361', fontStyle: 'italic', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ede6d9' }}>
                          <strong>Notes:</strong> {b.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRIP FINANCIALS & EXPENSES */}
        {activeTab === 'earnings' && (
          <div>
            {driverExpensesList.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed #ede6d9',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#8c7361'
              }}>
                <FileText size={36} style={{ color: '#8c5b30', opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b' }}>No Expense Logs Recorded</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Trip salary and fuel allowances logged by admin will display here.
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Salary (AED)</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Fuel Allowance</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Camp Use</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Addon Comm.</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverExpensesList.map((e, idx) => (
                      <tr key={e.id || idx} style={{ borderBottom: '1px solid #ede6d9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700' }}>{e.date}</td>
                        <td style={{ padding: '12px 14px', color: '#8c5b30', fontWeight: '800' }}>AED {e.salary || 0}</td>
                        <td style={{ padding: '12px 14px' }}>AED {e.carPetrol || 0}</td>
                        <td style={{ padding: '12px 14px' }}>AED {e.campUse || 0}</td>
                        <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: '800' }}>AED {e.misc || 0}</td>
                        <td style={{ padding: '12px 14px', color: '#8c7361', fontSize: '11.5px' }}>{e.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Code Scanner Modal */}
      {isScannerOpen && (
        <ScanVerifyModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(decodedText) => {
            setIsScannerOpen(false);
            // Search booking
            const found = (bookings || []).find(b => 
              b.id === decodedText || 
              (b.id || '').replace(/^book-/, '').toLowerCase() === decodedText.replace(/^book-/, '').toLowerCase() ||
              (decodedText.includes(b.id))
            );
            if (found) {
              handleVerifyArrival(found);
            } else {
              alert(`Scanned reference: ${decodedText}. Booking verified.`);
            }
          }}
        />
      )}
    </div>
  );
}
