import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clipboard, User, DollarSign } from 'lucide-react';
import { safariPackages } from '../mockData';

export default function DriverExpensesView({ expenses, setExpenses, bookings, drivers }) {
  // Form State
  const [formData, setFormData] = useState({
    driverId: '',
    bookingId: '',
    date: new Date().toISOString().split('T')[0],
    salary: 0,
    carPetrol: 0,
    campUse: 0,
    campAddonCollection: 0, // Total AED driver collected for camp addons (quad, extras, etc.)
    misc: 0,               // 10% of campAddonCollection auto-adds here as commission
    notes: ''
  });

  const [filterDriver, setFilterDriver] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // When driver changes, filter bookings that are assigned to this driver to make selection easy
  const availableBookings = formData.driverId
    ? bookings.filter(b => b.driverId && b.driverId.split(',').includes(formData.driverId))
    : bookings;

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.driverId) {
      alert('Please select a driver.');
      return;
    }

    const addonCommission = (parseFloat(formData.campAddonCollection) || 0) * 0.10;
    const newExpense = {
      ...formData,
      id: `exp-${Date.now()}`,
      salary: parseFloat(formData.salary) || 0,
      carPetrol: parseFloat(formData.carPetrol) || 0,
      campUse: parseFloat(formData.campUse) || 0,
      campAddonCollection: parseFloat(formData.campAddonCollection) || 0,
      // misc = manual misc + 10% auto-commission from camp addon sales
      misc: (parseFloat(formData.misc) || 0) + addonCommission
    };

    setExpenses([newExpense, ...expenses]);
    
    // Reset form while keeping driver selection
    setFormData({
      ...formData,
      bookingId: '',
      date: new Date().toISOString().split('T')[0],
      campUse: 0,
      campAddonCollection: 0,
      misc: 0,
      notes: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  // Filtered expense list using date range and driver selector
  const filteredExpenses = expenses.filter(e => {
    if (filterDriver && e.driverId !== filterDriver) return false;
    if (filterStartDate && e.date < filterStartDate) return false;
    if (filterEndDate && e.date > filterEndDate) return false;
    return true;
  });

  // Total sums
  const totals = filteredExpenses.reduce((acc, e) => {
    acc.salary += (parseFloat(e.salary) || 0);
    acc.misc += (parseFloat(e.misc) || 0);
    acc.carPetrol += (parseFloat(e.carPetrol) || 0);
    acc.campUse += (parseFloat(e.campUse) || 0);
    acc.total += (parseFloat(e.salary) || 0) + (parseFloat(e.carPetrol) || 0) + (parseFloat(e.campUse) || 0) + (parseFloat(e.misc) || 0);
    return acc;
  }, { salary: 0, misc: 0, carPetrol: 0, campUse: 0, total: 0 });

  return (
    <div>
      {/* Log Expense Form Combined into 1 clean unified section card */}
      <div className="panel-card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <DollarSign size={20} style={{ color: 'var(--primary)' }} /> Log Driver Expenses & Credits
        </h3>
        
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <select
                className="form-control"
                required
                title="Select Driver *"
                value={formData.driverId}
                onChange={(e) => {
                  const drv = drivers.find(d => d.id === e.target.value);
                  const defaultSal = drv ? (drv.defaultSalary || 100) : 0;
                  const defaultFuel = drv ? (drv.defaultFuel || 150) : 0;
                  setFormData({ 
                    ...formData, 
                    driverId: e.target.value,
                    salary: defaultSal,
                    carPetrol: defaultFuel
                  });
                }}
              >
                <option value="">Select Driver *</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <select
                className="form-control"
                title="Associate Safari Booking"
                value={formData.bookingId}
                onChange={(e) => {
                  const booking = bookings.find(b => b.id === e.target.value);
                  let computedCampUse = 0;
                  const drv = drivers.find(d => d.id === formData.driverId);
                  const defaultSal = drv ? (drv.defaultSalary || 100) : 0;
                  const defaultFuel = drv ? (drv.defaultFuel || 150) : 0;
                  if (booking) {
                    const nameLower = booking.packageName.toLowerCase();
                    const isVip = nameLower.includes('vip') || nameLower.includes('premium');
                    const isPrivate = nameLower.includes('private') || nameLower.includes('tour') || nameLower.includes('hatta');
                    
                    const campRate = (isVip || isPrivate) ? 40 : 20;
                    computedCampUse = (parseInt(booking.pax) || 0) * campRate;
                  }
                  setFormData({ 
                    ...formData, 
                    bookingId: e.target.value,
                    date: booking ? booking.date : formData.date,
                    campUse: computedCampUse,
                    salary: defaultSal,
                    carPetrol: defaultFuel
                  });
                }}
              >
                <option value="">Associate Safari Booking (Optional)</option>
                {availableBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.date} - {b.customerName} ({b.packageName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <input
                type="date"
                className="form-control"
                title="Expense Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Driver Salary (AED)"
                title="Driver Salary (AED)"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Fuel Allowance (AED)"
                title="Fuel Allowance (AED)"
                value={formData.carPetrol || ''}
                onChange={(e) => setFormData({ ...formData, carPetrol: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Camp Use Cost (AED)"
                title="Camp Use Cost (AED)"
                value={formData.campUse || ''}
                onChange={(e) => setFormData({ ...formData, campUse: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Camp Addon Collection — driver commission auto-calculates */}
            <div className="form-group" style={{ background: 'rgba(140,91,48,0.04)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(140,91,48,0.15)' }}>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Camp Addon Collection AED (e.g. 200 for quad bikes)"
                title="Camp Addon Collection (AED)"
                value={formData.campAddonCollection || ''}
                onChange={(e) => {
                  const collected = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, campAddonCollection: collected });
                }}
              />
              {(parseFloat(formData.campAddonCollection) || 0) > 0 && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>
                  ✓ Driver earns 10% commission = AED {((parseFloat(formData.campAddonCollection) || 0) * 0.10).toFixed(0)} (auto-added to Misc)
                </div>
              )}
            </div>

            <div className="form-group">
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="Misc Credits (AED)"
                title="Misc Credits (AED)"
                value={formData.misc || ''}
                onChange={(e) => setFormData({ ...formData, misc: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Notes / Explanations (VIP upgrades, quad rides details...)"
                title="Notes / Explanations"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              <Plus size={16} /> Log Trip Record
            </button>
          </div>
        </form>
      </div>

      {/* Filter controls and Overview summary panel */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Driver</label>
            <select
              className="form-control"
              style={{ width: '200px', height: '38px', fontWeight: '700' }}
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
            >
              <option value="">All Drivers Expenses</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Date</label>
            <input 
              type="date" 
              className="form-control"
              style={{ width: '150px', height: '38px' }}
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>End Date</label>
            <input 
              type="date" 
              className="form-control"
              style={{ width: '150px', height: '38px' }}
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          {(filterDriver || filterStartDate || filterEndDate) && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '12.5px', alignSelf: 'flex-end', height: '38px' }}
              onClick={() => {
                setFilterDriver('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap', background: 'rgba(0,0,0,0.02)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div>Salary: <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>{totals.salary.toLocaleString()} AED</span></div>
          <div>Petrol: <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>{totals.carPetrol.toLocaleString()} AED</span></div>
          <div>Camp Use: <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>{totals.campUse.toLocaleString()} AED</span></div>
          <div>Misc: <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>{totals.misc.toLocaleString()} AED</span></div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>Total Owed: <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '14.5px' }}>{totals.total.toLocaleString()} AED</span></div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="table-wrapper" style={{ marginTop: '16px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '150px' }}>Driver</th>
              <th>Customer Trip</th>
              <th style={{ textAlign: 'right', width: '100px' }}>Salary</th>
              <th style={{ textAlign: 'right', width: '100px' }}>Petrol</th>
              <th style={{ textAlign: 'right', width: '100px' }}>Camp Use</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Misc Credits</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Total</th>
              <th style={{ textAlign: 'center', width: '60px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => {
              const driver = drivers.find(d => d.id === e.driverId);
              const booking = bookings.find(b => b.id === e.bookingId);
              const salaryVal = parseFloat(e.salary) || 0;
              const petrolVal = parseFloat(e.carPetrol) || 0;
              const campVal = parseFloat(e.campUse) || 0;
              const miscVal = parseFloat(e.misc) || 0;
              const totalPayout = salaryVal + petrolVal + campVal + miscVal;

              return (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: 'var(--primary)' }} />
                      {(e.date || '').split('-').reverse().join('/')}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{driver?.name || 'Unknown'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {booking ? (
                      <span>{booking.customerName} ({booking.packageName})</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>General Expense / No Booking</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{salaryVal.toLocaleString()} AED</td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{petrolVal.toLocaleString()} AED</td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{campVal.toLocaleString()} AED</td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{miscVal.toLocaleString()} AED</td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                    {totalPayout.toLocaleString()} AED
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(e.id)} 
                      className="btn btn-danger" 
                      style={{ padding: '6px' }}
                      title="Delete Record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No expense records logged for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
