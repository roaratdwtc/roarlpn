import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, Award, Calendar, ChevronRight, Compass, MapPin, Map, Filter } from 'lucide-react';
import { safariPackages } from '../mockData';
import { getBookingCampUse, getBookingQuadbike, getDriverDayExpenses, getDriverDayBookings } from './BookingsView';

export default function DashboardView({ 
  bookings, 
  drivers, 
  expenses, 
  partners, 
  packages = [], 
  setActiveTab,
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  setFilterPartner,
  setFilterDriver,
  setViewingBookingFromDashboard,
  setViewingDriverFromDashboard,
  setActiveCardFilter,
  settings = [],
  onSaveSetting
}) {

  const [isAdSpendOpen, setIsAdSpendOpen] = useState(false);
  const [adSpendMonth, setAdSpendMonth] = useState(() => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    return todayStr.substring(0, 7); // 'YYYY-MM'
  });
  const [metaBudget, setMetaBudget] = useState('');
  const [googleBudget, setGoogleBudget] = useState('');

  // Parse monthly ad spends settings
  const monthlyAdSpends = (() => {
    try {
      const setting = settings.find(s => s.setting_key === 'monthly_ad_spends')?.setting_value;
      return setting ? JSON.parse(setting) : {};
    } catch (e) {
      console.error("Failed to parse monthly_ad_spends:", e);
      return {};
    }
  })();

  // Keep input fields synced when selected month or settings change
  React.useEffect(() => {
    const budget = monthlyAdSpends[adSpendMonth] || { meta: '', google: '' };
    setMetaBudget(budget.meta === 0 ? '0' : String(budget.meta || ''));
    setGoogleBudget(budget.google === 0 ? '0' : String(budget.google || ''));
  }, [adSpendMonth, settings]);

  const handleSaveAdSpend = async () => {
    const meta = parseFloat(metaBudget) || 0;
    const google = parseFloat(googleBudget) || 0;
    
    const updatedSpends = {
      ...monthlyAdSpends,
      [adSpendMonth]: { meta, google }
    };
    
    if (onSaveSetting) {
      await onSaveSetting('monthly_ad_spends', JSON.stringify(updatedSpends));
      alert(`Ad Spend budget for ${adSpendMonth} saved successfully!`);
    }
  };

  // Resolve daily ad spends
  const getDailyAdSpendBreakdown = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length < 2) return { meta: 0, google: 0 };
    const year = parts[0];
    const month = parts[1];
    const monthKey = `${year}-${month}`;
    const budget = monthlyAdSpends[monthKey];
    if (!budget) return { meta: 0, google: 0 };
    
    const meta = parseFloat(budget.meta) || 0;
    const google = parseFloat(budget.google) || 0;
    
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    return {
      meta: meta / daysInMonth,
      google: google / daysInMonth
    };
  };

  // Determine date range for ad spends
  const getAdSpendsForRange = () => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    let start = todayStr;
    let end = todayStr;

    if (dateFilter === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (dateFilter === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      start = sevenDaysAgo.toISOString().split('T')[0];
      end = todayStr;
    } else if (dateFilter === 'monthly') {
      const today = new Date(todayStr);
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      start = firstDayStr;
      end = lastDayStr;
    } else if (dateFilter === 'custom') {
      start = startDate || todayStr;
      end = endDate || todayStr;
    } else {
      // 'all' range: search min date of bookings
      const bookingDates = bookings.map(b => b.date).filter(Boolean);
      if (bookingDates.length > 0) {
        bookingDates.sort();
        start = bookingDates[0];
      } else {
        start = todayStr;
      }
      end = todayStr;
    }

    let totalAdSpend = 0;
    let metaSpend = 0;
    let googleSpend = 0;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dailyBreakdown = getDailyAdSpendBreakdown(dateStr);
      metaSpend += dailyBreakdown.meta;
      googleSpend += dailyBreakdown.google;
      totalAdSpend += (dailyBreakdown.meta + dailyBreakdown.google);
    }

    return { total: totalAdSpend, meta: metaSpend, google: googleSpend };
  };

  const adSpends = getAdSpendsForRange();

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
      const today = new Date(todayStr);
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      return bDateStr >= firstDayStr && bDateStr <= lastDayStr;
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
    
    if (dateFilter === 'today') return eDateStr === todayStr;
    if (dateFilter === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitStr = sevenDaysAgo.toISOString().split('T')[0];
      return eDateStr >= limitStr && eDateStr <= todayStr;
    }
    if (dateFilter === 'monthly') {
      const today = new Date(todayStr);
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      return eDateStr >= firstDayStr && eDateStr <= lastDayStr;
    }
    if (dateFilter === 'custom') {
      let matches = true;
      if (startDate) matches = matches && eDateStr >= startDate;
      if (endDate) matches = matches && eDateStr <= endDate;
      return matches;
    }
    return true;
  });

  // Calculations on filtered list
  const totalBookings = filteredBookings.length;
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

  // Calculate driver costs using the new unified expense calculation logic
  const expenseBreakdown = drivers.reduce((acc, d) => {
    const driverBookings = getDriverDayBookings(d.id, filteredBookings);
    const driverExp = filteredExpenses.filter(e => e.driverId === d.id);

    if (driverBookings.length === 0 && driverExp.length === 0) return acc;

    const allDates = Array.from(new Set([
      ...driverBookings.map(b => b.date),
      ...driverExp.map(e => e.date)
    ]));

    const activePackages = packages.length > 0 ? packages : safariPackages;

    allDates.forEach(date => {
      const dayBookings = driverBookings.filter(b => b.date === date);
      const dayExpenses = driverExp.filter(e => e.date === date);

      if (dayExpenses.length > 0) {
        acc.salary    += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.salary)    || 0), 0);
        acc.carPetrol += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.carPetrol) || 0), 0);
        acc.campUse   += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.campUse)   || 0), 0);
        acc.misc      += dayExpenses.reduce((sum, e) => sum + (parseFloat(e.misc)      || 0), 0);
      } else if (dayBookings.length > 0) {
        const allocations = getDriverDayExpenses(d.id, date, filteredBookings, drivers, activePackages);
        Object.values(allocations).forEach(alloc => {
          acc.salary += alloc.salary;
          acc.carPetrol += alloc.fuel;
        });

        // Camp use + quadbike
        dayBookings.forEach(b => {
          acc.campUse += getBookingCampUse(b, activePackages) + getBookingQuadbike(b, activePackages);
        });
      }
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

  const todayStrDash = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const completedToursCount = filteredBookings.filter(b => b.status === 'completed').length;
  const upcomingToursCount = filteredBookings.filter(b => b.status === 'confirmed' && b.date >= todayStrDash).length;

  // Chart data: Bookings by source/partner
  const revenueByPartner = partners.map(p => {
    const partnerBookings = filteredBookings.filter(b => b.partnerId === p.id);
    const revenue = partnerBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
    return { id: p.id, name: p.name, revenue, count: partnerBookings.length };
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

  const allExpensesBreakdown = {
    ...expenseBreakdown,
    metaAds: adSpends.meta,
    googleAds: adSpends.google
  };

  const totalExpSum = Object.values(allExpensesBreakdown).reduce((a, b) => a + b, 0) || 1;

  // Top Drivers Performance & Profitability
  const driverPerformance = drivers.map(d => {
    const driverB = getDriverDayBookings(d.id, filteredBookings);
    const revenue = driverB.reduce((sum, b) => {
      if (b.date <= todayStr) return sum + (parseFloat(b.price) || 0);
      return sum;
    }, 0);
    const expense = (() => {
      const activeBookingsForPL = driverB.filter(b => b.date <= todayStr);
      const activeExpensesForPL = filteredExpenses.filter(e => e.driverId === d.id && e.date <= todayStr);

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
          const allocations = getDriverDayExpenses(d.id, date, activeBookingsForPL, drivers, activePackages);
          Object.values(allocations).forEach(alloc => {
            driverExpenseSum += alloc.salary + alloc.fuel;
          });

          // Camp use + quadbike
          dayBookings.forEach(b => {
            driverExpenseSum += getBookingCampUse(b, activePackages) + getBookingQuadbike(b, activePackages);
          });
        }
      });

      return driverExpenseSum;
    })();
    const profit = revenue - expense;

    const completedCount = driverB.filter(b => b.status === 'completed').length;
    const confirmedCount = driverB.filter(b => b.status === 'confirmed').length;
    const pendingCount = driverB.filter(b => b.status === 'pending').length;
    const cancelledCount = driverB.filter(b => b.status === 'cancelled').length;

    return { 
      id: d.id, 
      name: d.name, 
      count: driverB.length, 
      completedCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      revenue, 
      expense, 
      profit 
    };
  }).sort((a, b) => b.revenue - a.revenue);


  const getActiveDateRange = () => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    if (dateFilter === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (dateFilter === 'weekly') {
      const today = new Date(todayStr);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return { start: sevenDaysAgo.toISOString().split('T')[0], end: todayStr };
    }
    if (dateFilter === 'monthly') {
      const today = new Date(todayStr);
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      return { start: firstDayStr, end: lastDayStr };
    }
    if (dateFilter === 'custom') {
      return { start: startDate || todayStr, end: endDate || todayStr };
    }
    return { start: '2016-01-01', end: todayStr };
  };

  return (
    <div>
      {/* Dynamic Date Filter Bar */}
      <div className="controls-bar" style={{ marginBottom: '20px', padding: '12px 20px', justifyContent: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} /> Filter Analytics:
        </div>
        <div className="filters-group" style={{ gap: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '6px 12px', fontSize: '13px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="weekly">Weekly (Last 7d)</option>
            <option value="monthly">This Month (1st to Last Day)</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
        <button
          onClick={() => setIsAdSpendOpen(!isAdSpendOpen)}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: 'auto', border: '1.5px solid #ede6d9', background: '#fff' }}
        >
          📢 Manage Ad Spend
        </button>
      </div>

      {isAdSpendOpen && (
        <div className="panel-card" style={{ marginBottom: '20px', padding: '16px', border: '1.5px solid #ede6d9', background: '#fdfbf7', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>
              📢 Configure Monthly Ad Spend Budget
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Meta & Google Ads Budget Reporting</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '4px' }}>Select Month</label>
              <input 
                type="month" 
                className="form-control" 
                style={{ height: '36px', fontSize: '13px', border: '1.5px solid #ede6d9', borderRadius: '8px', background: '#fff' }}
                value={adSpendMonth}
                onChange={(e) => setAdSpendMonth(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '4px' }}>Meta Ads (AED)</label>
              <input 
                type="number" 
                min="0"
                className="form-control" 
                placeholder="0"
                style={{ height: '36px', fontSize: '13px', border: '1.5px solid #ede6d9', borderRadius: '8px', background: '#fff' }}
                value={metaBudget}
                onChange={(e) => setMetaBudget(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '4px' }}>Google Ads (AED)</label>
              <input 
                type="number" 
                min="0"
                className="form-control" 
                placeholder="0"
                style={{ height: '36px', fontSize: '13px', border: '1.5px solid #ede6d9', borderRadius: '8px', background: '#fff' }}
                value={googleBudget}
                onChange={(e) => setGoogleBudget(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSaveAdSpend} 
              className="btn btn-primary"
              style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              Save Budget
            </button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="stats-grid">
        <div 
          className="stat-card revenue dashboard-clickable-card"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setFilterPartner('');
            setFilterDriver('');
            setActiveCardFilter('all');
            setActiveTab('bookings');
          }}
        >
          <div className="stat-header">
            <span>GROSS SALES</span>
            <TrendingUp />
          </div>
          <div className="stat-value">{totalRevenue.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}</div>
          <div className="stat-footer">Total bookings volume</div>
        </div>

        <div 
          className="stat-card bookings dashboard-clickable-card"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setFilterPartner('');
            setFilterDriver('');
            setActiveCardFilter('all');
            setActiveTab('bookings');
          }}
        >
          <div className="stat-header">
            <span>TOTAL SAFARIS</span>
            <Users />
          </div>
          <div className="stat-value">{totalBookings}</div>
          <div className="stat-footer">Active booked tours</div>
        </div>

        <div 
          className="stat-card completed-tours dashboard-clickable-card" 
          style={{ background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
          onClick={() => {
            setFilterPartner('');
            setFilterDriver('');
            setActiveCardFilter('completed');
            setActiveTab('bookings');
          }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>COMPLETED TOURS</span>
            <Award size={18} style={{ color: '#047857' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>{completedToursCount}</div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Finished tours</div>
        </div>

        <div 
          className="stat-card upcoming-tours dashboard-clickable-card" 
          style={{ background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
          onClick={() => {
            setFilterPartner('');
            setFilterDriver('');
            setActiveCardFilter('confirmed');
            setActiveTab('bookings');
          }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPCOMING TOURS</span>
            <Calendar size={18} style={{ color: '#1d4ed8' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '6px' }}>{upcomingToursCount}</div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tours scheduled ahead</div>
        </div>

        <div className="stat-card expenses" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OPERATIONAL COSTS</span>
            <DollarSign size={18} style={{ color: '#dc2626' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626', marginTop: '6px' }}>{(totalDriverCost + totalPartnerCost).toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}</div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Drivers & Partners payouts</div>
        </div>

        <div className="stat-card profit" style={{ background: '#fff', border: '1px solid var(--border)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OPERATIONAL PROFIT</span>
            <TrendingUp size={18} style={{ color: '#059669' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '6px' }}>
            {netProfit.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}
          </div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Revenue minus operations</div>
        </div>

        <div className="stat-card ad-spend" style={{ background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AD SPEND</span>
            <TrendingUp size={18} style={{ color: '#4f46e5' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: '#4f46e5', marginTop: '6px' }}>
            {adSpends.total.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}
          </div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Meta: AED {Math.round(adSpends.meta).toLocaleString()} | Google: AED {Math.round(adSpends.google).toLocaleString()}
          </div>
        </div>

        <div className="stat-card total-profit" style={{ background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL PROFIT</span>
            <TrendingUp size={18} style={{ color: (netProfit - adSpends.total) >= 0 ? '#059669' : '#dc2626' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: (netProfit - adSpends.total) >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '6px' }}>
            {(netProfit - adSpends.total).toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })}
          </div>
          <div className="stat-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Net Profit minus Ad Spend</div>
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
                  <div 
                    key={item.name} 
                    className="chart-bar-wrapper dashboard-clickable-card" 
                    onClick={() => {
                      setFilterPartner(item.id || '');
                      setActiveTab('bookings');
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
                  >
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
                  <tr 
                    key={driver.name}
                    className="clickable-row"
                    onClick={() => {
                      const { start, end } = getActiveDateRange();
                      setViewingDriverFromDashboard({
                        id: driver.id,
                        startDate: start,
                        endDate: end
                      });
                      setActiveTab('drivers');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{driver.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className="badge badge-driver" 
                        style={{ cursor: 'pointer', background: 'rgba(197, 160, 89, 0.15)', color: 'var(--primary-dark)', fontWeight: 'bold' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterDriver(driver.id);
                          setActiveTab('bookings');
                        }}
                        title="Click to view all bookings for this driver"
                      >
                        {driver.count} trips ({driver.completedCount} Comp, {driver.confirmedCount} Conf)
                      </span>
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
            {Object.entries(allExpensesBreakdown).map(([key, value]) => {
              const pct = ((value / totalExpSum) * 100).toFixed(1);
              let displayName = key;
              if (key === 'carPetrol') displayName = 'Car Petrol / Fuel';
              if (key === 'campUse') displayName = 'Camp Use Cost';
              if (key === 'salary') displayName = 'Daily Salary';
              if (key === 'misc') displayName = 'Miscellaneous';
              if (key === 'metaAds') displayName = 'Meta Ads Budget';
              if (key === 'googleAds') displayName = 'Google Ads Budget';
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
              <div 
                key={b.id} 
                className="dashboard-clickable-card"
                onClick={() => {
                  setViewingBookingFromDashboard(b);
                  setActiveTab('bookings');
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  background: 'rgba(0,0,0,0.02)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--primary)' }}>{b.customerName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.packageName} &bull; {b.pax} pax</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary-dark)', fontSize: '13.5px' }}>{b.price} AED</div>
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
