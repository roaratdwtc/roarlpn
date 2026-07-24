import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, Award, Calendar, ChevronRight, Compass, MapPin, Map, Filter } from 'lucide-react';
import { safariPackages } from '../mockData';
import { getBookingCampUse, getBookingQuadbike } from './BookingsView';

export default function DashboardView({ bookings, drivers, expenses, partners, packages = [], setActiveTab }) {
  const [dateFilter, setDateFilter] = useState('all'); // all, today, weekly, monthly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter bookings based on selected range
  const filteredBookings = bookings.filter(b => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const bDateStr = b.date;
    
    if (dateFilter === 'today') {
      return bDateStr === todayStr;
    }
    
    if (dateFilter === 'weekly') {
      // Last 7 days
      const bTime = new Date(bDateStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = (todayTime - bTime) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    
    if (dateFilter === 'monthly') {
      // Last 30 days
      const bTime = new Date(bDateStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = (todayTime - bTime) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    
    if (dateFilter === 'custom') {
      let matches = true;
      if (startDate) {
        matches = matches && bDateStr >= startDate;
      }
      if (endDate) {
        matches = matches && bDateStr <= endDate;
      }
      return matches;
    }
    
    return true; // 'all'
  });

  // Filter expenses based on selected range
  const filteredExpenses = (expenses || []).filter(e => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const eDateStr = e.date;
    
    if (dateFilter === 'today') {
      return eDateStr === todayStr;
    }
    
    if (dateFilter === 'weekly') {
      const eTime = new Date(eDateStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = (todayTime - eTime) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    
    if (dateFilter === 'monthly') {
      const eTime = new Date(eDateStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = (todayTime - eTime) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    
    if (dateFilter === 'custom') {
      let matches = true;
      if (startDate) {
        matches = matches && eDateStr >= startDate;
      }
      if (endDate) {
        matches = matches && eDateStr <= endDate;
      }
      return matches;
    }
    
    return true; // 'all'
  });

  // Calculations on filtered list
  const totalBookings = filteredBookings.length;
  
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  
  // Calculate driver costs using the new unified expense calculation logic
  const expenseBreakdown = drivers.reduce((acc, d) => {
    const driverBookings = filteredBookings.filter(b => b.driverId === d.id && b.status !== 'cancelled');
    const driverExp = filteredExpenses.filter(e => e.driverId === d.id);

    if (driverBookings.length === 0 && driverExp.length === 0) return acc;

    const allDates = Array.from(new Set([
      ...driverBookings.map(b => b.date),
      ...driverExp.map(e => e.date)
    ]));

    const activePackages = packages.length > 0 ? packages : safariPackages;
    const isMorningPkg = (pkg) => { const n = (pkg||'').toLowerCase(); return n.includes('morning')||n.includes('city')||n.includes('hatta'); };

    allDates.forEach(date => {
      const dayBookings = driverBookings.filter(b => b.date === date);
      const dayExpenses = driverExp.filter(e => e.date === date);

      if (dayExpenses.length > 0) {
        acc.salary    += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.salary)    || 0), 0);
        acc.carPetrol += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.carPetrol) || 0), 0);
        acc.campUse   += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.campUse)   || 0), 0);
        acc.misc      += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.misc)      || 0), 0);
      } else if (dayBookings.length > 0) {
        // Shift-based defaults: morning shift and evening shift counted independently
        const hasMorningShift = dayBookings.some(b => isMorningPkg(b.packageName));
        const hasEveningShift = dayBookings.some(b => !isMorningPkg(b.packageName));
        const defaultSalary = parseFloat(d.defaultSalary) || 100;

        // Each shift = 100 AED salary + 150 AED fuel (always 150 regardless of tour type)
        if (hasMorningShift) { acc.salary += defaultSalary; acc.carPetrol += 150; }
        if (hasEveningShift) { acc.salary += defaultSalary; acc.carPetrol += 150; }

        // Camp use: calculated dynamically from packages
        dayBookings.forEach(b => {
          acc.campUse += getBookingCampUse(b, activePackages);
        });
      }

      // Add quadbike expense always if configured (direct per bike/guest)
      dayBookings.forEach(b => {
        acc.campUse += getBookingQuadbike(b, activePackages);
      });
    });

    return acc;
  }, { salary: 0, carPetrol: 0, campUse: 0, misc: 0 });


  const totalDriverCost = expenseBreakdown.salary + expenseBreakdown.carPetrol + expenseBreakdown.campUse + expenseBreakdown.misc;

  // Calculate partner commissions
  const activePackages = packages.length > 0 ? packages : safariPackages;
  const totalPartnerCost = filteredBookings.reduce((sum, b) => {
    const partner = partners.find(p => p.id === b.partnerId);
    if (!partner) return sum;
    // Find matching package to check override
    const pkgObj = activePackages.find(p => p.name === b.packageName);
    let rate = parseFloat(partner.commissionRate) || 0;
    if (pkgObj && partner.packages && partner.packages[pkgObj.id] !== undefined) {
      rate = parseFloat(partner.packages[pkgObj.id]);
    }
    return sum + ((parseFloat(b.price) || 0) * rate / 100);
  }, 0);

  const netProfit = totalRevenue - totalDriverCost - totalPartnerCost;

  // Chart data: Bookings by source/partner
  const revenueByPartner = partners.map(p => {
    const partnerBookings = filteredBookings.filter(b => b.partnerId === p.id);
    const revenue = partnerBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
    return { name: p.name, revenue, count: partnerBookings.length };
  });

  const maxPartnerRevenue = Math.max(...revenueByPartner.map(r => r.revenue), 1);

  // Most Selling Packages calculation
  const packageStats = filteredBookings.reduce((acc, b) => {
    const pkg = b.packageName || 'Unknown';
    if (!acc[pkg]) {
      acc[pkg] = { name: pkg, count: 0, revenue: 0 };
    }
    acc[pkg].count += 1;
    acc[pkg].revenue += (parseFloat(b.price) || 0);
    return acc;
  }, {});

  const sortedPackages = Object.values(packageStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top Pickup Locations calculation
  const pickupStats = filteredBookings.reduce((acc, b) => {
    const loc = b.pickupLocation || 'Hotel Lobby';
    if (!acc[loc]) {
      acc[loc] = { name: loc, paxCount: 0 };
    }
    acc[loc].paxCount += parseInt(b.pax) || 1;
    return acc;
  }, {});

  const sortedPickups = Object.values(pickupStats)
    .sort((a, b) => b.paxCount - a.paxCount)
    .slice(0, 5);

  // Expense breakdown has already been calculated above

  const totalExpSum = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0) || 1;

  // Top Drivers Performance & Profitability
  const driverPerformance = drivers.map(d => {
    const driverB = filteredBookings.filter(b => b.driverId === d.id && b.status !== 'cancelled');
    const revenue = driverB.reduce((sum, b) => {
      if (b.date <= todayStr) return sum + (parseFloat(b.price) || 0);
      return sum;
    }, 0);
    const expense = (() => {
      const activeBookingsForPL = driverB.filter(b => b.date <= todayStr);
      const activeExpensesForPL = filteredExpenses.filter(e => e.driverId === d.id && e.date <= todayStr);

      const isMorningPkg = (pkg) => { const n = (pkg||'').toLowerCase(); return n.includes('morning')||n.includes('city')||n.includes('hatta'); };

      const uniqueDates = Array.from(new Set([
        ...activeBookingsForPL.map(b => b.date),
        ...activeExpensesForPL.map(e => e.date)
      ]));
      let driverExpenseSum = 0;

      uniqueDates.forEach(date => {
        const dayBookings = activeBookingsForPL.filter(b => b.date === date);
        const dayExpenses = activeExpensesForPL.filter(e => e.date === date);

        if (dayExpenses.length > 0) {
          driverExpenseSum += dayExpenses.reduce((sum, e) =>
            sum + (parseFloat(e.salary)||0) + (parseFloat(e.carPetrol)||0) + (parseFloat(e.campUse)||0) + (parseFloat(e.misc)||0), 0);
        } else {
          // Shift-based defaults: morning and evening each earn 100 salary + 150 fuel
          const hasMorningShift = dayBookings.some(b => isMorningPkg(b.packageName));
          const hasEveningShift = dayBookings.some(b => !isMorningPkg(b.packageName));
          const defaultSalary = parseFloat(d.defaultSalary) || 100;

          if (hasMorningShift) driverExpenseSum += defaultSalary + 150;
          if (hasEveningShift) driverExpenseSum += defaultSalary + 150;

          // Camp use: calculated dynamically from packages
          dayBookings.forEach(b => {
            driverExpenseSum += getBookingCampUse(b, activePackages);
          });
        }
        
        // Add quadbike expense always if configured (direct per bike/guest)
        dayBookings.forEach(b => {
          driverExpenseSum += getBookingQuadbike(b, activePackages);
        });
      });

      return driverExpenseSum;
    })();
    const profit = revenue - expense;
    return { name: d.name, count: driverB.length, revenue, expense, profit };
  }).sort((a, b) => b.revenue - a.revenue);


  return (
    <div>
      {/* Dynamic Date Filter Bar */}
      <div className="controls-bar" style={{ marginBottom: '20px', padding: '12px 20px', justifyContent: 'flex-start', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} /> Filter Analytics:
        </div>
        <div className="filters-group" style={{ gap: '8px' }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '6px 12px', fontSize: '13px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="weekly">Weekly (Last 7d)</option>
            <option value="monthly">Monthly (Last 30d)</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: '135px', padding: '6px', fontSize: '12.5px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: '135px', padding: '6px', fontSize: '12.5px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-header">
            <span>GROSS SALES</span>
            <TrendingUp />
          </div>
          <div className="stat-value">{totalRevenue.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}</div>
          <div className="stat-footer">Total bookings volume</div>
        </div>

        <div className="stat-card bookings">
          <div className="stat-header">
            <span>TOTAL SAFARIS</span>
            <Users />
          </div>
          <div className="stat-value">{totalBookings}</div>
          <div className="stat-footer">Active booked tours</div>
        </div>

        <div className="stat-card expenses">
          <div className="stat-header">
            <span>OPERATIONAL COSTS</span>
            <DollarSign />
          </div>
          <div className="stat-value">{(totalDriverCost + totalPartnerCost).toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}</div>
          <div className="stat-footer">Drivers & Partners payouts</div>
        </div>

        <div className="stat-card profit">
          <div className="stat-header">
            <span>NET PROFIT</span>
            <TrendingUp />
          </div>
          <div className="stat-value" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {netProfit.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}
          </div>
          <div className="stat-footer">Revenue minus all expenses</div>
        </div>
      </div>

      {/* BI Grid Panels Row 1: Channels, Packages, & Pickup Locations */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '24px' }}>
        {/* Left: Booking Channel Performance */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Booking Channels BI Reporting</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Revenue in AED</span>
          </div>
          <div className="custom-chart-container" style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height: '240px', paddingLeft: '40px' }}>
            <div className="chart-y-axis" style={{ position: 'absolute', left: 0, top: 0, bottom: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>
              <span>{Math.round(maxPartnerRevenue).toLocaleString()}</span>
              <span>{Math.round(maxPartnerRevenue * 0.5).toLocaleString()}</span>
              <span>0</span>
            </div>
            
            <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '6px' }}>
              {revenueByPartner.map(item => {
                const heightPct = (item.revenue / maxPartnerRevenue) * 85 + 5;
                return (
                  <div key={item.name} className="chart-bar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', height: '100%', justifyContent: 'flex-end' }}>
                    <div className="chart-bar-tooltip">
                      {item.name}: {item.count} bookings ({item.revenue.toLocaleString()} AED)
                    </div>
                    <div className="chart-bar" style={{ height: `${heightPct}%`, width: '18px', borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, var(--primary-light), var(--primary))' }}></div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '48px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle: Most Selling Packages */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Most Selling Packages</span>
            <Compass size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {sortedPackages.map(pkg => {
              const maxCount = Math.max(...sortedPackages.map(p => p.count), 1);
              const pct = ((pkg.count / maxCount) * 100).toFixed(0);
              return (
                <div key={pkg.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pkg.name}>
                      {pkg.name}
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{pkg.count} bookings</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${pct}%`, 
                      background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', 
                      borderRadius: '4px' 
                    }}></div>
                  </div>
                </div>
              );
            })}
            {sortedPackages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No bookings logged yet</div>
            )}
          </div>
        </div>

        {/* Right: Top Pickup Locations/Hotels (Added in place of Expenses Share) */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Top Pickup Locations</span>
            <MapPin size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {sortedPickups.map(loc => {
              const maxPax = Math.max(...sortedPickups.map(p => p.paxCount), 1);
              const pct = ((loc.paxCount / maxPax) * 100).toFixed(0);
              return (
                <div key={loc.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loc.name}>
                      {loc.name}
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{loc.paxCount} Pax</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${pct}%`, 
                      background: 'linear-gradient(90deg, #b28258, #8c5b30)', 
                      borderRadius: '4px' 
                    }}></div>
                  </div>
                </div>
              );
            })}
            {sortedPickups.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No pickup records logged yet</div>
            )}
          </div>
        </div>
      </div>

      {/* BI Grid Panels Row 2: Top Drivers, Expenses Share, and Recent Bookings */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Left: Drivers BI Performance & Profitability Report */}
        <div className="panel-card" style={{ flex: '1.5' }}>
          <div className="panel-title">
            <span>Drivers P&L Performance Report</span>
            <Award style={{ color: 'var(--primary)' }} />
          </div>
          <div className="table-wrapper" style={{ margin: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th style={{ textAlign: 'center' }}>Trips</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Expense</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformance.map(driver => (
                  <tr key={driver.name}>
                    <td style={{ fontWeight: '600' }}>{driver.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-driver">{driver.count} trips</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {driver.revenue.toLocaleString()} AED
                    </td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>
                      {driver.expense.toLocaleString()} AED
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: driver.profit >= 0 ? 'var(--success)' : '#dc2626' }}>
                      {driver.profit.toLocaleString()} AED
                    </td>
                  </tr>
                ))}
                {driverPerformance.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No driver records logged yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Middle: Driver Expense Share */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Operational Expenses Share</span>
            <DollarSign size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {Object.entries(expenseBreakdown).map(([key, value]) => {
              const pct = ((value / totalExpSum) * 100).toFixed(1);
              let displayName = key;
              if (key === 'carPetrol') displayName = 'Car Petrol / Fuel';
              if (key === 'campUse') displayName = 'Camp Use Cost';
              if (key === 'salary') displayName = 'Daily Salary';
              if (key === 'misc') displayName = 'Miscellaneous';
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                      {displayName}
                    </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{value.toLocaleString()} AED ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                       height: '100%', 
                       width: `${pct}%`, 
                       background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', 
                       borderRadius: '4px' 
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Bookings list */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Recent Bookings</span>
            <Calendar style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBookings.slice(0, 4).map(b => (
              <div key={b.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 14px', 
                background: 'rgba(0,0,0,0.02)', 
                borderRadius: '8px',
                border: '1px solid var(--border-light)'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{b.customerName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.packageName} &bull; {b.pax} pax</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13.5px' }}>{b.price} AED</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(b.date || '').split('-').reverse().join('/')}</div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setActiveTab('bookings')} 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px', fontSize: '12px', padding: '8px' }}
            >
              View All Bookings <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
