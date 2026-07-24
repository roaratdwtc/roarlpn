import React, { useState } from 'react';
import { Search, Calendar, Phone, User, Info, Clipboard, Send, Award } from 'lucide-react';
import { getWhatsAppConfirmationLink, getConfirmationText, getBookingCampUse, getBookingQuadbike } from './BookingsView';

export default function CustomersView({ bookings, drivers, packages = [], registeredCustomers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingCustomer, setViewingCustomer] = useState(null);

  // Group bookings by customer contact (whatsapp)
  const customerMap = bookings.reduce((acc, b) => {
    const key = b.whatsapp.trim();
    if (!acc[key]) {
      acc[key] = {
        name: b.customerName,
        whatsapp: b.whatsapp,
        email: b.email || '',
        bookingsCount: 0,
        totalSpent: 0,
        trips: [],
        latestBooking: b
      };
    }
    acc[key].bookingsCount += 1;
    acc[key].totalSpent += parseFloat(b.price) || 0;
    acc[key].trips.push(b);
    
    // Track latest booking by date
    if (new Date(b.date) > new Date(acc[key].latestBooking.date)) {
      acc[key].latestBooking = b;
    }
    return acc;
  }, {});

  // Merge registered customers (leads from coupon unlocking)
  registeredCustomers.forEach(rc => {
    const key = rc.whatsapp.trim();
    if (!customerMap[key]) {
      customerMap[key] = {
        name: rc.name,
        whatsapp: rc.whatsapp,
        email: rc.email || '',
        bookingsCount: 0,
        totalSpent: 0,
        trips: [],
        latestBooking: null,
        isLead: true
      };
    } else {
      customerMap[key].email = rc.email || customerMap[key].email || '';
    }
  });

  const customersList = Object.values(customerMap);

  const filteredCustomers = customersList.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) || 
           c.whatsapp.includes(searchLower) || 
           (c.email && c.email.toLowerCase().includes(searchLower));
  });

  return (
    <div>
      {/* Search bar */}
      <div className="controls-bar">
        <div className="search-input-wrapper">
          <Search />
          <input 
            type="text" 
            placeholder="Search customers by name or phone..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Total unique clients: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{customersList.length}</span>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>WhatsApp Number</th>
              <th style={{ textAlign: 'center' }}>Total Tours Booked</th>
              <th>Tour Details (Latest)</th>
              <th>Assigned Driver</th>
              <th style={{ textAlign: 'right' }}>Total Lifetime Spend</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, i) => {
              const latestTrip = c.trips && c.trips.length > 0 
                ? [...c.trips].sort((a,b) => new Date(b.date) - new Date(a.date))[0] 
                : null;
              
              return (
                <tr key={i} onClick={() => setViewingCustomer(c)} className="clickable-row">
                  <td className="customer-col" style={{ fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: 'var(--primary-glow)', 
                        color: 'var(--primary)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        <User size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{c.name}</span>
                        {c.email && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            {c.email}
                          </span>
                        )}
                        {c.isLead && (
                          <span style={{ fontSize: '9px', background: 'rgba(201,118,42,0.1)', color: 'var(--primary)', padding: '1px 5px', borderRadius: '4px', alignSelf: 'flex-start', marginTop: '2.5px', fontWeight: 'bold' }}>
                            Lead (Coupon Unlocked)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.latestBooking ? (
                      <a 
                        href={getWhatsAppConfirmationLink(c.latestBooking)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="badge badge-whatsapp"
                        onClick={(e) => e.stopPropagation()} 
                        title="Send WhatsApp Confirmation for Latest Booking"
                      >
                        <Phone size={10} /> Send Confirmation
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500' }}>
                        {c.whatsapp}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-partner">
                      {c.bookingsCount} trips
                    </span>
                  </td>
                  <td className="package-col" style={{ fontSize: '13px' }}>
                    {latestTrip ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{latestTrip.packageName} ({latestTrip.pax} pax)</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Calendar size={10} /> {latestTrip.date}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {(() => {
                      const driverObj = latestTrip ? drivers.find(d => d.id === latestTrip.driverId) : null;
                      return driverObj ? driverObj.name : '—';
                    })()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                    {c.totalSpent.toLocaleString()} AED
                  </td>
                </tr>
              );
            })}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No customer records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Bookings Profile Popup Modal */}
      {viewingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                {viewingCustomer.name}
              </h3>
              <button onClick={() => setViewingCustomer(null)} className="modal-close">&times;</button>
            </div>

            {/* Profile info cards layout matching user screenshot */}
            <div className="modal-profile-header">
              <div className="modal-profile-card">
                <h4>PROFILE</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PHONE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{viewingCustomer.whatsapp}</span>
                      {viewingCustomer.latestBooking && (
                        <a 
                          href={getWhatsAppConfirmationLink(viewingCustomer.latestBooking)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="badge" 
                          style={{ background: '#fff', border: '1px solid #d1d5db', color: '#374151', padding: '2px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af' }}></span> Send
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>EMAIL</span>
                    <span style={{ fontWeight: '600' }}>{viewingCustomer.email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ADDED</span>
                    <span style={{ fontWeight: '600' }}>{(viewingCustomer.latestBooking?.date || '').split('-').reverse().join('/')}</span>
                  </div>
                </div>
              </div>

              {/* Metrics cards */}
              <div className="modal-stat-box">
                <span>TRIPS</span>
                <strong>{viewingCustomer.bookingsCount}</strong>
              </div>

              <div className="modal-stat-box">
                <span>TOTAL SPEND</span>
                <strong>AED {viewingCustomer.totalSpent.toLocaleString()}</strong>
              </div>

              <div className="modal-stat-box">
                <span>LAST TOUR</span>
                <strong>{(viewingCustomer.latestBooking?.date || '').split('-').reverse().join('/') || '—'}</strong>
              </div>
            </div>

            {/* Booking history table matching screenshot */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '12px' }}>
                Booking history ({viewingCustomer.bookingsCount})
              </h4>
              <div className="modal-table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>TOUR DATE</th>
                      <th>PACKAGE</th>
                      <th>DRIVER</th>
                      <th>PARTNER</th>
                      <th>PICKUP</th>
                      <th>PAX</th>
                      <th>PRICE</th>
                      <th>ADD-ONS</th>
                      <th>STATUS</th>
                      <th>PAY</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingCustomer.trips.map((t, idx) => {
                      const driverObj = drivers.find(d => d.id === t.driverId);
                      const isUnpaid = parseFloat(t.price) > 0;
                      const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                      const isPassed = t.date <= todayStr;
                      const isPaid = !isUnpaid || isPassed;

                      return (
                        <tr key={idx}>
                          <td style={{ whiteSpace: 'nowrap' }}>{(t.date || '').split('-').reverse().join('/')}</td>
                          <td style={{ fontWeight: '700', color: '#4b5563' }}>{t.packageName}</td>
                          <td style={{ fontWeight: '600' }}>{driverObj?.name || '—'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{t.partnerId}</td>
                          <td title={t.pickupLocation} style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.pickupLocation || '—'}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{t.pax}</td>
                          <td style={{ fontWeight: '700' }}>AED {t.price}</td>
                          <td>—</td>
                          <td>
                            <span className="badge badge-confirmed">confirmed</span>
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}`}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <a 
                              href={getWhatsAppConfirmationLink(t)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '11px', border: '1px solid #d1d5db', padding: '2px 8px', borderRadius: '8px', background: '#fff', fontWeight: 'bold' }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Send
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dynamic Latest Booking Trip Audit Details card card layout */}
            {viewingCustomer.latestBooking && (() => {
              const b = viewingCustomer.latestBooking;
              const driverObj = drivers.find(d => d.id === b.driverId);
              
              let computedSalary = 0;
              let computedPetrol = 0;
              let computedCampUse = 0;
              if (b.driverId) {
                computedSalary = driverObj ? (parseFloat(driverObj.defaultSalary) || 100) : 100;
                computedPetrol = driverObj ? (parseFloat(driverObj.defaultFuel) || 150) : 150;
                
                computedCampUse = getBookingCampUse(b, packages) + getBookingQuadbike(b, packages);
              }
              const totalCost = computedSalary + computedPetrol + computedCampUse;
              const netProfit = (parseFloat(b.price) || 0) - totalCost;

              return (
                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '12px' }}>
                    Latest Booking Trip Audit Details
                  </h4>
                  <div className="modal-profile-header" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="modal-stat-box" style={{ minHeight: 'auto', padding: '10px' }}>
                      <span style={{ fontSize: '9px' }}>ASSIGNED DRIVER</span>
                      <strong style={{ fontSize: '14px' }}>{driverObj ? driverObj.name : 'Unassigned'}</strong>
                    </div>
                    <div className="modal-stat-box highlight" style={{ minHeight: 'auto', padding: '10px' }}>
                      <span style={{ fontSize: '9px' }}>CASH COLLECTION</span>
                      <strong style={{ fontSize: '14px' }}>AED {parseFloat(b.price) || 0}</strong>
                    </div>
                    <div className="modal-stat-box" style={{ minHeight: 'auto', padding: '10px' }}>
                      <span style={{ fontSize: '9px' }}>CAMP USE COST</span>
                      <strong style={{ fontSize: '14px' }}>AED {computedCampUse}</strong>
                    </div>
                    <div className="modal-stat-box highlight" style={{ minHeight: 'auto', padding: '10px' }}>
                      <span style={{ fontSize: '9px' }}>NET TRIP PROFIT</span>
                      <strong style={{ fontSize: '14px', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>AED {netProfit}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', marginTop: '20px', paddingTop: '16px' }}>
              <button onClick={() => setViewingCustomer(null)} className="btn btn-secondary">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
