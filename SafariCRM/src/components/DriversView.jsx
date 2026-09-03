import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Calendar, Trash2, Shield, Info, DollarSign, Edit, Clipboard, Send } from 'lucide-react';
import { getWhatsAppConfirmationLink, getConfirmationText, getWhatsAppDriverLink, getBookingCampUse, getBookingQuadbike, getDriverDayExpenses, getDriverDayBookings } from './BookingsView';

// Opens an isolated print popup with a styled driver payout statement
function printDriverStatement({ driver, stats, ledgerData, ledgerStartDate, ledgerEndDate }) {
  const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Driver Payout Statement – ${driver.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 32px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #8c5b30; padding-bottom: 18px; margin-bottom: 22px; }
    .company { font-size: 22px; font-weight: 900; color: #8c5b30; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 17px; font-weight: 800; color: #1a1a2e; }
    .doc-title p { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .driver-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f9f7f4; border: 1px solid #e5e0d8; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .info-row { display: flex; flex-direction: column; }
    .info-label { font-size: 9px; font-weight: 800; color: #8c5b30; text-transform: uppercase; letter-spacing: 0.6px; }
    .info-value { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-top: 1px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .summary-card { border: 1px solid #e5e0d8; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card .s-label { font-size: 9px; font-weight: 800; color: #8c5b30; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    .summary-card .s-value { font-size: 16px; font-weight: 900; color: #1a1a2e; margin-top: 4px; display: block; }
    .summary-card.highlight { background: #8c5b30; border-color: #8c5b30; }
    .summary-card.highlight .s-label { color: rgba(255,255,255,0.8); }
    .summary-card.highlight .s-value { color: #fff; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1a1a2e; color: #fff; }
    th { padding: 9px 10px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
    th:not(:first-child) { text-align: right; }
    tbody tr:nth-child(even) { background: #f9f7f4; }
    tbody tr:last-child td { border-top: 2px solid #8c5b30; font-weight: 800; }
    td { padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #ede8e0; }
    td:not(:first-child) { text-align: right; }
    .earnings-col { color: #8c5b30; font-weight: 800; }
    .expense-col { color: #dc2626; }
    .footer { border-top: 1px solid #e5e0d8; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-note { font-size: 10px; color: #9ca3af; max-width: 55%; line-height: 1.5; }
    .signature { text-align: right; }
    .signature-line { border-top: 1px solid #1a1a2e; width: 180px; margin-left: auto; padding-top: 5px; font-size: 10px; color: #6b7280; }
    @page { margin: 15mm; size: A4; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">ROAR ADVENTURE TOURISM</div>
      <div class="company-sub">Desert Safari &amp; Tour Operations — Dubai, UAE</div>
    </div>
    <div class="doc-title">
      <h1>Driver Payout Statement</h1>
      <p>Period: ${ledgerStartDate} to ${ledgerEndDate}</p>
      <p>Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    </div>
  </div>

  <div class="driver-info">
    <div class="info-row"><span class="info-label">Driver Name</span><span class="info-value">${driver.name}</span></div>
    <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${driver.whatsapp || 'N/A'}</span></div>
    <div class="info-row"><span class="info-label">Vehicle / Plate</span><span class="info-value">${driver.carPlate || 'N/A'}</span></div>
    <div class="info-row"><span class="info-label">Trip Pay Rate</span><span class="info-value">AED 250 (Fixed)</span></div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <span class="s-label">Total Trips</span>
      <span class="s-value">${stats.totalTrips}</span>
    </div>
    <div class="summary-card">
      <span class="s-label">Trip Payout (S+F)</span>
      <span class="s-value">AED ${((stats.salarySum || 0) + (stats.petrolSum || 0)).toFixed(0)}</span>
    </div>
    <div class="summary-card">
      <span class="s-label">Camp Use &amp; Quadbike</span>
      <span class="s-value">AED ${((stats.campUseSum || 0) + (stats.quadbikeSum || 0)).toFixed(0)}</span>
    </div>
    <div class="summary-card highlight">
      <span class="s-label">Net Profit</span>
      <span class="s-value">AED ${(stats.totalCollected - stats.totalPayout).toFixed(0)}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Trips</th>
        <th>Total Payment on Arrival</th>
        <th>Camp Use</th>
        <th>S+F</th>
        <th>Expenses</th>
        <th>Net Profit</th>
      </tr>
    </thead>
    <tbody>
      ${ledgerData.map(row => `
        <tr>
          <td>${(row.date || '').split('-').reverse().join('/')}</td>
          <td style="text-align:right">${row.trips}</td>
          <td>${row.collections > 0 ? 'AED ' + row.collections.toLocaleString() : '—'}</td>
          <td>AED ${row.campUse.toLocaleString()}</td>
          <td>AED ${row.salary.toLocaleString()}</td>
          <td class="expense-col">AED ${row.expenses.toLocaleString()}</td>
          <td class="earnings-col">AED ${row.earnings.toLocaleString()}</td>
        </tr>
      `).join('')}
      ${ledgerData.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:16px">No performance records in this period.</td></tr>' : ''}
    </tbody>
  </table>

  <div class="footer">
    <p class="footer-note">This statement is generated by RoarCRM. All amounts are in UAE Dirhams (AED). For queries, contact info@roaradventuretourism.com</p>
    <div class="signature">
      <div class="signature-line">Authorised Signature &amp; Stamp</div>
    </div>
  </div>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=850,height=1100');
  if (!popup) { alert('Please allow pop-ups to print the driver statement.'); return; }
  popup.document.write(printHtml);
  popup.document.close();
  popup.focus();
  setTimeout(() => { popup.print(); }, 400);
}


export default function DriversView({ drivers, setDrivers, bookings, expenses, packages = [], setActiveTab, viewingDriverFromDashboard, setViewingDriverFromDashboard }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDriver, setViewingDriver] = useState(null); // Click popup driver state
  const [driverModalTab, setDriverModalTab] = useState('ledger'); // 'ledger' or 'trips'
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    carPlate: '',
    regDate: '',
    defaultSalary: 100,
    defaultFuel: 150
  });

  // Date range filters for Daily Performance Ledger
  const [ledgerStartDate, setLedgerStartDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [ledgerEndDate, setLedgerEndDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    const mStr = String(m).padStart(2, '0');
    return `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`;
  });

  // Sub-modal states
  const [viewingLedgerDate, setViewingLedgerDate] = useState(null);
  const [selectedBookingForPopup, setSelectedBookingForPopup] = useState(null);

  useEffect(() => {
    if (viewingDriverFromDashboard) {
      const { id, startDate, endDate } = viewingDriverFromDashboard;
      const d = drivers.find(drv => drv.id === id);
      if (d) {
        setViewingDriver(d);
        setLedgerStartDate(startDate);
        setLedgerEndDate(endDate);
      }
      if (typeof setViewingDriverFromDashboard === 'function') {
        setViewingDriverFromDashboard(null);
      }
    }
  }, [viewingDriverFromDashboard, drivers, setViewingDriverFromDashboard]);

  // Calculate Driver Metrics
  const getDriverStats = (driverId, startDate = null, endDate = null) => {
    let driverBookings = getDriverDayBookings(driverId, bookings);
    let driverExpenses = (expenses || []).filter(e => e.driverId === driverId);

    if (startDate) {
      driverBookings = driverBookings.filter(b => b.date >= startDate);
      driverExpenses = driverExpenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      driverBookings = driverBookings.filter(b => b.date <= endDate);
      driverExpenses = driverExpenses.filter(e => e.date <= endDate);
    }

    const totalTrips = driverBookings.length;

    // Calculate collections (booking price driver collects from customer - only if tour date is passed/today and payment option is 'Payment on Arrival' / 'Collection')
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const totalCollected = driverBookings.reduce((sum, b) => {
      const isArrival = (b.paymentOption === 'Payment on Arrival' || b.paymentOption === 'Collection' || !b.paymentOption);
      if (b.date <= todayStr && isArrival) {
        return sum + (parseFloat(b.price) || 0);
      }
      return sum;
    }, 0);

    const driverObj = drivers.find(d => d.id === driverId);
    const defaultSalary = driverObj ? (parseFloat(driverObj.defaultSalary) || 100) : 100;
    const defaultFuel = driverObj ? (parseFloat(driverObj.defaultFuel) || 150) : 150;

    const allDates = Array.from(new Set([
      ...driverBookings.map(b => b.date),
      ...driverExpenses.map(e => e.date)
    ]));

    let salarySum = 0;
    let petrolSum = 0;
    let campUseSum = 0;
    let quadbikeSum = 0;
    let miscSum = 0;

    allDates.forEach(date => {
      const dayExpenses = driverExpenses.filter(e => e.date === date);
      const dayBookings = driverBookings.filter(b => b.date === date && b.status !== 'cancelled');

      if (dayExpenses.length > 0) {
        // Logged expense overrides defaults for this date
        salarySum  += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.salary)    || 0), 0);
        petrolSum  += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.carPetrol) || 0), 0);
        campUseSum += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.campUse)   || 0), 0);
        miscSum    += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.misc)      || 0), 0);
      } else {
        if (dayBookings.length > 0) {
          const allocations = getDriverDayExpenses(driverId, date, bookings, drivers, packages);
          Object.values(allocations).forEach(alloc => {
            salarySum += alloc.salary;
            petrolSum += alloc.fuel;
          });
          dayBookings.forEach(b => {
            campUseSum += getBookingCampUse(b, packages);
            quadbikeSum += getBookingQuadbike(b, packages);
          });
        }
      }
    });

    const totalPayout = salarySum + petrolSum + campUseSum + quadbikeSum + miscSum;

    return { 
      totalTrips, 
      totalCollected,
      totalPayout, 
      salarySum, 
      petrolSum, 
      campUseSum, 
      quadbikeSum,
      miscSum, 
      driverBookings, 
      driverExpenses: driverExpenses 
    };
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.carPlate) {
      alert('Please fill out Driver Name and Car Plate.');
      return;
    }

    const payload = {
      ...formData,
      defaultSalary: parseFloat(formData.defaultSalary) || 100,
      defaultFuel: parseFloat(formData.defaultFuel) || 150
    };

    if (editingDriver) {
      setDrivers(drivers.map(d => d.id === editingDriver.id ? { ...d, ...payload } : d));
      setViewingDriver({ ...viewingDriver, ...payload });
      setEditingDriver(null);
    } else {
      const newDriver = {
        ...payload,
        id: `driver-${Date.now()}`
      };
      setDrivers([...drivers, newDriver]);
    }
    setIsModalOpen(false);
    setFormData({ name: '', whatsapp: '', carPlate: '', regDate: new Date().toISOString().split('T')[0], defaultSalary: 100, defaultFuel: 150 });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete driver ${name}? This will unassign them from any associated bookings.`)) {
      setDrivers(drivers.filter(d => d.id !== id));
    }
  };

  return (
    <div>
      {/* Top Bar Actions */}
      <div className="controls-bar" style={{ justifyContent: 'flex-end' }}>
        <button 
          onClick={() => {
            setEditingDriver(null);
            setFormData({
              name: '',
              whatsapp: '',
              carPlate: '',
              regDate: new Date().toISOString().split('T')[0],
              defaultSalary: 100,
              defaultFuel: 150
            });
            setIsModalOpen(true);
          }} 
          className="btn btn-primary"
        >
          <Plus size={16} /> Add New Driver
        </button>
      </div>

      {/* Grid of Driver Cards */}
      <div className="stats-grid driver-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {drivers.map(driver => {
          const stats = getDriverStats(driver.id);
          return (
            <div 
              key={driver.id} 
              className="stat-card clickable-row" 
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer' }}
              onClick={() => setViewingDriver(driver)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'var(--primary-glow)', 
                    border: '1px solid var(--border)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{driver.name}</h3>
                    <span className="badge badge-driver" style={{ marginTop: '4px' }}>{driver.carPlate}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDriver(driver);
                      setFormData({
                        name: driver.name,
                        whatsapp: driver.whatsapp,
                        carPlate: driver.carPlate,
                        regDate: driver.regDate,
                        defaultSalary: driver.defaultSalary || 150
                      });
                      setIsModalOpen(true);
                    }} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px', minHeight: 'auto', border: 'none', background: 'rgba(140, 91, 48, 0.05)', color: 'var(--primary)' }}
                    title="Edit Driver"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleDelete(driver.id, driver.name);
                    }} 
                    className="btn btn-danger" 
                    style={{ padding: '6px', minHeight: 'auto', border: 'none' }}
                    title="Remove Driver"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>WhatsApp Contact:</span>
                  <a 
                    href={`https://wa.me/${driver.whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="badge badge-whatsapp"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <Phone size={10} /> {driver.whatsapp}
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registration Date:</span>
                  <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} style={{ color: 'var(--primary)' }} /> {driver.regDate}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Assigned Trips:</span>
                  <span style={{ fontWeight: '600' }}>{stats.totalTrips} safari trips</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                  <span style={{ color: '#059669', fontWeight: '600' }}>Cash Collected on Arrival:</span>
                  <span style={{ fontWeight: '700', color: '#059669' }}>{stats.totalCollected.toLocaleString()} AED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--primary-dark)', fontWeight: '600' }}>Total Driver Payout:</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{stats.totalPayout.toLocaleString()} AED</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Detail Profile Popup Modal */}
      {viewingDriver && (() => {
        const stats = getDriverStats(viewingDriver.id, ledgerStartDate, ledgerEndDate);
        const latestExpense = stats.driverExpenses[0];
        const commRate = latestExpense ? latestExpense.commissionPct : 10;

        // Build Daily Performance Ledger Data
        const ledgerData = (() => {
          const driverBookings = getDriverDayBookings(viewingDriver.id, bookings);
          const driverExpenses = (expenses || []).filter(e => e.driverId === viewingDriver.id);
          
          const allDates = Array.from(new Set([
            ...driverBookings.map(b => b.date),
            ...driverExpenses.map(e => e.date)
          ]));

          return allDates
            .filter(d => d >= ledgerStartDate && d <= ledgerEndDate) // Date Filter
            .map(d => {
              const dayBookings = driverBookings.filter(b => b.date === d);

              const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
              const dayCollections = dayBookings.reduce((sum, b) => {
                const isArrival = (b.paymentOption === 'Payment on Arrival' || b.paymentOption === 'Collection' || !b.paymentOption);
                if (b.date <= todayStr && isArrival) {
                  return sum + (parseFloat(b.price) || 0);
                }
                return sum;
              }, 0);

              const dayExpenses = driverExpenses.filter(e => e.date === d);
              let daySalary = 0;
              let dayPetrol = 0;
              let dayCampUse = 0;
              let dayMisc = 0;

              if (dayExpenses.length > 0) {
                daySalary = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0);
                dayPetrol = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.carPetrol) || 0), 0);
                dayCampUse = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.campUse) || 0), 0);
                dayMisc = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.misc) || 0), 0);
              } else {
                if (dayBookings.length > 0) {
                  const allocations = getDriverDayExpenses(viewingDriver.id, d, bookings, drivers, packages);
                  Object.values(allocations).forEach(alloc => {
                    daySalary += alloc.salary;
                    dayPetrol += alloc.fuel;
                  });
                  dayCampUse = dayBookings.reduce((sum, b) => sum + getBookingCampUse(b, packages) + getBookingQuadbike(b, packages), 0);
                }
              }

              const totalDayExp = daySalary + dayPetrol + dayCampUse + dayMisc;

              return {
                date: d,
                trips: dayBookings.length,
                collections: dayCollections,
                campUse: dayCampUse,
                salary: daySalary + dayPetrol,
                expenses: totalDayExp,
                earnings: dayCollections - totalDayExp
              };
            }).sort((a, b) => new Date(b.date) - new Date(a.date));
        })();
        
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '820px' }}>
              <div className="modal-header" style={{ borderBottom: 'none', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {viewingDriver.name}
                </h3>
                <button onClick={() => setViewingDriver(null)} className="modal-close">&times;</button>
              </div>

              {/* Stats metric bar at top */}
              <div className="modal-profile-header">
                <div className="modal-stat-box">
                  <span>TRIPS</span>
                  <strong>{stats.totalTrips}</strong>
                </div>

                <div className="modal-stat-box">
                  <span>REVENUE</span>
                  <strong>AED {stats.totalCollected.toLocaleString()}</strong>
                </div>

                <div className="modal-stat-box highlight">
                  <span>OPERATIONAL COSTS</span>
                  <strong style={{ color: 'var(--success)' }}>AED {stats.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                </div>

                <div className="modal-stat-box highlight">
                  <span>NET PROFIT</span>
                  <strong style={{ color: 'var(--success)' }}>AED {(stats.totalCollected - stats.totalPayout).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                </div>
              </div>

              {/* Split layout: Profile (Left) and Payout Summary (Right) */}
              <div className="modal-details-grid">
                {/* Left Card: Profile */}
                <div className="modal-profile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4>PROFILE</h4>
                    <Edit 
                      size={14} 
                      style={{ color: 'var(--primary)', cursor: 'pointer' }} 
                      onClick={() => {
                        setEditingDriver(viewingDriver);
                        setFormData({
                          name: viewingDriver.name,
                          whatsapp: viewingDriver.whatsapp,
                          carPlate: viewingDriver.carPlate,
                          regDate: viewingDriver.regDate,
                          defaultSalary: viewingDriver.defaultSalary || 100,
                          defaultFuel: viewingDriver.defaultFuel || 150
                        });
                        setIsModalOpen(true);
                      }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>WHATSAPP</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700' }}>{viewingDriver.whatsapp}</span>
                        <a 
                          href={`https://wa.me/${viewingDriver.whatsapp.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="badge" 
                          style={{ background: '#fff', border: '1px solid #d1d5db', color: '#374151', padding: '2px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> chat
                        </a>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>CAR PLATE</span>
                      <span style={{ fontWeight: '700' }}>{viewingDriver.carPlate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>REGISTERED</span>
                      <span style={{ fontWeight: '600' }}>{(viewingDriver.regDate || '').split('-').reverse().join('/')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>TRIP PAYOUT RATE</span>
                      <span style={{ fontWeight: '700' }}>AED 250 (Fixed)</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Payout Summary */}
                <div className="modal-profile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4>PAYOUTS SUMMARY</h4>
                    <button 
                      className="badge badge-partner" 
                      style={{ background: '#fff', cursor: 'pointer', padding: '2px 8px' }}
                      onClick={() => {
                        if (setActiveTab) {
                          setActiveTab('expenses');
                          setViewingDriver(null);
                        }
                      }}
                    >
                      + Add entry
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>TRIP PAYOUTS (S+F)</span>
                      <strong>AED {(stats.salarySum + stats.petrolSum).toFixed(0)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>CAMP USE & QUADBIKE</span>
                      <strong>AED {(stats.campUseSum + stats.quadbikeSum).toFixed(0)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>MISC CREDITS</span>
                      <strong>AED {stats.miscSum.toFixed(0)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>TOTAL PAYOUT DUE</span>
                      <strong style={{ color: 'var(--primary)' }}>AED {stats.totalPayout.toFixed(0)}</strong>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', fontWeight: 'bold' }}>RECENT LEDGER</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No entries yet.</span>
                  </div>
                </div>
              </div>

              {/* Ledger Tab system */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setDriverModalTab('ledger')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      paddingBottom: '8px', 
                      borderBottom: driverModalTab === 'ledger' ? '2px solid var(--primary)' : 'none',
                      fontWeight: '700',
                      color: driverModalTab === 'ledger' ? 'var(--text-dark)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    Daily Performance Ledger
                  </button>
                  <button 
                    onClick={() => setDriverModalTab('trips')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      paddingBottom: '8px', 
                      borderBottom: driverModalTab === 'trips' ? '2px solid var(--primary)' : 'none',
                      fontWeight: '700',
                      color: driverModalTab === 'trips' ? 'var(--text-dark)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    Assigned Tours ({stats.totalTrips})
                  </button>
                </div>

                {/* Ledger Date Range Filters */}
                {driverModalTab === 'ledger' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-deep)', padding: '10px 16px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Filter:</span>
                      <input 
                        type="date" 
                        className="form-control" 
                        style={{ width: '135px', padding: '6px' }}
                        value={ledgerStartDate}
                        onChange={(e) => setLedgerStartDate(e.target.value)}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                      <input 
                        type="date" 
                        className="form-control" 
                        style={{ width: '135px', padding: '6px' }}
                        value={ledgerEndDate}
                        onChange={(e) => setLedgerEndDate(e.target.value)}
                      />
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 14px', fontSize: '11px' }}
                      onClick={() => printDriverStatement({ driver: viewingDriver, stats, ledgerData, ledgerStartDate, ledgerEndDate })}
                    >
                      Print Statement
                    </button>
                  </div>
                )}
                
                {driverModalTab === 'ledger' ? (
                  <div className="modal-table-container">
                    <table className="modal-table">
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th style={{ textAlign: 'center' }}>TRIPS</th>
                          <th style={{ textAlign: 'right' }}>TOTAL COLLECTION</th>
                          <th style={{ textAlign: 'right' }}>CAMP USE</th>
                          <th style={{ textAlign: 'right' }}>S+F</th>
                          <th style={{ textAlign: 'right' }}>EXPENSES</th>
                          <th style={{ textAlign: 'right' }}>NET PROFIT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerData.map((row, idx) => (
                          <tr key={idx} onClick={() => setViewingLedgerDate(row.date)} className="clickable-row">
                            <td>{(row.date || '').split('-').reverse().join('/')}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-driver" style={{ minWidth: '70px', justifyContent: 'center', cursor: 'pointer' }}>
                                {row.trips} Trips
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: row.collections > 0 ? '#059669' : '#6b7280' }}>
                              {row.collections > 0 ? `AED ${row.collections.toLocaleString()}` : '0.00 AED'}
                            </td>
                            <td style={{ textAlign: 'right', color: '#4b5563' }}>
                              AED {row.campUse.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', color: '#4b5563' }}>
                              AED {row.salary.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', color: '#ef4444' }}>
                              AED {row.expenses.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                              AED {row.earnings.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {ledgerData.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No performance history logged.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="modal-table-container">
                    <table className="modal-table">
                      <thead>
                        <tr>
                          <th>TOUR DATE</th>
                          <th>CUSTOMER</th>
                          <th>PACKAGE</th>
                          <th>PICKUP</th>
                          <th>PAX</th>
                          <th>PRICE</th>
                          <th>ADD-ONS</th>
                          <th>STATUS</th>
                          <th>PAY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.driverBookings.map((b, idx) => {
                          const isUnpaid = parseFloat(b.price) > 0;
                          return (
                            <tr key={idx} onClick={() => setSelectedBookingForPopup(b)} className="clickable-row">
                              <td style={{ whiteSpace: 'nowrap' }}>{(b.date || '').split('-').reverse().join('/')}</td>
                              <td style={{ fontWeight: '700', color: '#4b5563' }}>{b.customerName}</td>
                              <td>{b.packageName}</td>
                              <td title={b.pickupLocation} style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {b.pickupLocation || '—'}
                              </td>
                              <td style={{ fontWeight: 'bold' }}>{b.pax}</td>
                              <td style={{ fontWeight: '700' }}>AED {b.price}</td>
                              <td>—</td>
                              <td>
                                <span className="badge" style={{ 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px', 
                                  border: 'none',
                                  textTransform: 'capitalize',
                                  fontWeight: '700',
                                  ...(b.status === 'completed' ? { background: 'rgba(16, 185, 129, 0.12)', color: '#047857' } : {}),
                                  ...(b.status === 'cancelled' ? { background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' } : {}),
                                  ...(b.status === 'confirmed' ? { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' } : {})
                                }}>
                                  {b.status || 'Confirmed'}
                                </span>
                              </td>
                              <td>
                                {(b.paymentOption && b.paymentOption !== 'Payment on Arrival' && b.paymentOption !== 'Collection') ? (
                                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontWeight: '700', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                                    Prepaid
                                  </span>
                                ) : b.date < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] ? (
                                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontWeight: '700', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                                    Collected
                                  </span>
                                ) : (
                                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: '700', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                                    Payment on Arrival
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {stats.driverBookings.length === 0 && (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No assigned tours.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', marginTop: '20px', paddingTop: '16px' }}>
                <button onClick={() => setViewingDriver(null)} className="btn btn-secondary">
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ledger Date Summary Sub-Modal popup (when row clicked in performance ledger) */}
      {viewingLedgerDate && (() => {
        const dayBookings = getDriverDayBookings(viewingDriver.id, bookings).filter(b => b.date === viewingLedgerDate);
        return (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} style={{ color: 'var(--primary)' }} /> Operations Summary: {(viewingLedgerDate || '').split('-').reverse().join('/')}
                </h3>
                <button onClick={() => setViewingLedgerDate(null)} className="modal-close">&times;</button>
              </div>
              
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Tours assigned to {viewingDriver.name} on this date. Click on any row to open full booking popup details.
              </div>

              <div className="modal-table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Safari Package</th>
                      <th style={{ textAlign: 'center' }}>Guests</th>
                      <th style={{ textAlign: 'right' }}>Payment on Arrival</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBookings.map((b, idx) => (
                      <tr key={idx} onClick={() => {
                        setViewingLedgerDate(null);
                        setSelectedBookingForPopup(b);
                      }} className="clickable-row">
                        <td style={{ fontWeight: '700' }}>{b.customerName}</td>
                        <td>{b.packageName}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{b.pax} Pax</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>AED {b.price}</td>
                        <td>
                          <span className="badge badge-confirmed">confirmed</span>
                        </td>
                      </tr>
                    ))}
                    {dayBookings.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No tours assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button onClick={() => setViewingLedgerDate(null)} className="btn btn-secondary">
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upgraded Booking Details Summary Modal Popup matching BookingsView.jsx layout */}
      {selectedBookingForPopup && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                Booking Details Reference
              </h3>
              <button onClick={() => setSelectedBookingForPopup(null)} className="modal-close">&times;</button>
            </div>

            {/* Top stats metrics row */}
            <div className="modal-profile-header">
              <div className="modal-stat-box">
                <span>GUESTS (PAX)</span>
                <strong>{selectedBookingForPopup.pax} Pax</strong>
              </div>

              <div className="modal-stat-box highlight">
                <span>TOTAL AMOUNT</span>
                <strong>
                  {parseFloat(selectedBookingForPopup.price) === 0 ? 'Online Paid' : `${selectedBookingForPopup.price} AED`}
                </strong>
              </div>

              <div className="modal-stat-box">
                <span>TOUR DATE</span>
                <strong>{(selectedBookingForPopup.date || '').split('-').reverse().join('/')}</strong>
              </div>

              <div className="modal-stat-box" style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9' }}>
                <span>TOUR STATUS</span>
                <strong style={{ 
                  textTransform: 'capitalize', 
                  color: selectedBookingForPopup.status === 'completed' ? '#059669' : (selectedBookingForPopup.status === 'cancelled' ? '#ef4444' : '#1d4ed8') 
                }}>
                  {selectedBookingForPopup.status || 'Confirmed'}
                </strong>
              </div>
            </div>

            {/* Split cards grid layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              
              {/* Left Card: Client & Tour Information */}
              <div className="modal-profile-card">
                <h4>CLIENT & TRIP DETAILS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>BOOKING ID</span>
                    <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{selectedBookingForPopup.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>CLIENT NAME</span>
                    <span style={{ fontWeight: '700' }}>{selectedBookingForPopup.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>WHATSAPP</span>
                    <span style={{ fontWeight: '700' }}>{selectedBookingForPopup.whatsapp}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>SAFARI PACKAGE</span>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{selectedBookingForPopup.packageName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PICKUP HOTEL</span>
                    <span style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedBookingForPopup.pickupLocation || 'Hotel Lobby'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ROOM NUMBER</span>
                    <span style={{ fontWeight: '600' }}>{selectedBookingForPopup.roomNo || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PICKUP TIME</span>
                    <span style={{ fontWeight: '600' }}>{selectedBookingForPopup.pickupTime || '3:30 PM to 4:00 PM'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ASSIGNED DRIVER</span>
                    <span style={{ fontWeight: '700' }}>
                      {viewingDriver.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>SAFARI STATUS</span>
                    <span className="badge badge-confirmed">confirmed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PAYMENT OPTION</span>
                    <span className="badge badge-partner" style={{ textTransform: 'capitalize' }}>
                      {selectedBookingForPopup.paymentOption === 'Collection' ? 'Payment on Arrival' : (selectedBookingForPopup.paymentOption || 'Payment on Arrival')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PENDING PAYMENT ON ARRIVAL</span>
                    <span style={{ fontWeight: '700', color: (selectedBookingForPopup.paymentOption === 'Payment on Arrival' || selectedBookingForPopup.paymentOption === 'Collection' || !selectedBookingForPopup.paymentOption) ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {(selectedBookingForPopup.paymentOption === 'Payment on Arrival' || selectedBookingForPopup.paymentOption === 'Collection' || !selectedBookingForPopup.paymentOption) ? `${selectedBookingForPopup.price} AED` : '0 AED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: WhatsApp Confirmation Preview & Actions */}
              <div className="modal-profile-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4>WHATSAPP CONFIRMATION PREVIEW</h4>
                <textarea 
                  className="form-control whatsapp-preview-textarea" 
                  style={{ fontSize: '11px', flex: 1, resize: 'none', background: 'var(--bg-deep)', border: '1px solid var(--border)', marginBottom: '12px' }} 
                  readOnly 
                  value={getConfirmationText(selectedBookingForPopup)} 
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getConfirmationText(selectedBookingForPopup));
                      alert('Confirmation message copied to clipboard!');
                    }} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '12px', padding: '8px 12px', flex: 1, justifyContent: 'center' }}
                  >
                    <Clipboard size={12} /> Copy Message
                  </button>
                  <a 
                    href={getWhatsAppConfirmationLink(selectedBookingForPopup)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn" 
                    style={{ fontSize: '12px', padding: '8px 12px', textDecoration: 'none', background: '#16a34a', color: '#ffffff', border: 'none', flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', borderRadius: '8px' }}
                  >
                    <Send size={12} /> Send Confirm
                  </a>
                </div>
              </div>

            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', marginTop: '20px', paddingTop: '16px' }}>
              <button onClick={() => setSelectedBookingForPopup(null)} className="btn btn-secondary">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDriver ? 'Edit Driver Details' : 'Register New Driver'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-grid col-span-2">
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    placeholder="Driver Full Name *"
                    title="Driver Full Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="WhatsApp Number (+971...)"
                    title="WhatsApp Number"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    placeholder="Car Plate Number * (e.g. DXB-30291)"
                    title="Car Plate Number *"
                    value={formData.carPlate}
                    onChange={(e) => setFormData({ ...formData, carPlate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input 
                    type="date" 
                    className="form-control"
                    title="Registration Date"
                    value={formData.regDate}
                    onChange={(e) => setFormData({ ...formData, regDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDriver ? 'Save Changes' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
