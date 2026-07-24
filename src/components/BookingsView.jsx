import React, { useState } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, Phone, CheckCircle, Clock, Info, User, Clipboard, Send, Award, DollarSign, Copy, Database } from 'lucide-react';
import { safariPackages } from '../mockData';

export function cleanPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  // UAE local numbers starting with 05 or 5
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    cleaned = '971' + cleaned.slice(1);
  } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
    cleaned = '971' + cleaned;
  }
  return cleaned;
}

export function getWhatsAppConfirmationLink(booking) {
  if (!booking) return '';
  const refCode = booking.id ? booking.id.replace('book-', '') : '199600';
  
  const msg = `Thank you for choosing Roar Adventure Tourism LLC, Your booking regarding Dubai Desert Safari with Booking Reference# ${refCode} is confirmed with following details.   
1. Name: ${booking.customerName} 
2. WhatsApp: ${booking.whatsapp} 
3. No of Guests: ${booking.pax} 
4. Package: ${booking.packageName || 'Dubai Desert Safari'} 
5. Pickup time: ${booking.pickupTime || '3:30 PM to 4:00 PM'} 
6. Payment: ${booking.price} AED 
7. ${parseFloat(booking.price) === 0 ? 'Online Paid' : 'Payment on arrival (5% VAT apply on card payment) .'}   
8. Date: ${(booking.date || '').split('-').reverse().join('/')}  
9. ROOM no : ${booking.roomNo || 'N/A'} 
10. Pickup location: ${booking.pickupLocation || 'Hotel Lobby'} 
Terms:   
1. Free Cancellation before 24 hours  
2. 50% refund before 12 hours.   
3. 0 refund for no showup or same day cancellation.   
For Cancellation Reschedule or Modifications please Call/WhatsApp +97145578679.`;
  const phoneClean = cleanPhone(booking.whatsapp);
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
}

export function getWhatsAppDriverLink(booking, driver) {
  if (!booking || !driver) return '';
  const refCode = booking.id ? booking.id.replace('book-', '') : '199600';
  let msg = `Hi ${driver.name}, here is your assigned tour detail:
Reference: #${refCode}
Customer: ${booking.customerName}
WhatsApp: ${booking.whatsapp}
Pax: ${booking.pax}
Package: ${booking.packageName}
Date: ${(booking.date || '').split('-').reverse().join('/')}
Pickup Time: ${booking.pickupTime}
Location: ${booking.pickupLocation} ${booking.roomNo ? `(Room: ${booking.roomNo})` : ''}`;

  if (booking.addonName && parseFloat(booking.addonPrice) > 0) {
    msg += `\nAddon: ${booking.addonName} (+${booking.addonPrice} AED)`;
  }
  msg += `\nCollection on Arrival: ${parseFloat(booking.price) === 0 ? 'Online Paid / Nil' : `${booking.price} AED`}`;

  const phoneClean = driver.whatsapp.replace(/[^0-9]/g, '');
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
}

export function getConfirmationText(booking) {
  if (!booking) return '';
  const refCode = booking.id ? booking.id.replace('book-', '') : '199600';
  
  let addonStr = '';
  if (booking.addonName && parseFloat(booking.addonPrice) > 0) {
    addonStr = `\nAddon Service: ${booking.addonName} (+${booking.addonPrice} AED)`;
  }

  return `Thank you for choosing Roar Adventure Tourism LLC, Your booking regarding Dubai Desert Safari with Booking Reference# ${refCode} is confirmed with following details.   
1. Name: ${booking.customerName} 
2. WhatsApp: ${booking.whatsapp} 
3. No of Guests: ${booking.pax} 
4. Package: ${booking.packageName || 'Dubai Desert Safari'} 
5. Pickup time: ${booking.pickupTime || '3:30 PM to 4:00 PM'} ${addonStr}
6. Payment: ${booking.price} AED 
7. ${parseFloat(booking.price) === 0 ? 'Online Paid' : 'Payment on arrival (5% VAT apply on card payment) .'}   
8. Date: ${(booking.date || '').split('-').reverse().join('/')}  
9. ROOM no : ${booking.roomNo || 'N/A'} 
10. Pickup location: ${booking.pickupLocation || 'Hotel Lobby'}   
Terms:   
1. Free Cancellation before 24 hours  
2. 50% refund before 12 hours.   
3. 0 refund for no showup or same day cancellation.   
For Cancellation Reschedule or Modifications please Call/WhatsApp +97145578679.`;
}

// Helper: detect if a package is a morning / city / Hatta daytime tour (no camp use)
export function isMorningTour(packageName) {
  const n = (packageName || '').toLowerCase();
  return n.includes('morning') || n.includes('city') || n.includes('hatta');
}

// Helper: detect if a package is VIP or Private (affects camp use rate)
function isVipOrPrivate(packageName) {
  const n = (packageName || '').toLowerCase();
  return n.includes('vip') || n.includes('premium') || n.includes('private') || n.includes('priavte');
}

// Helper: get camp use cost for a single booking.
export function getBookingCampUse(booking, packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;
  const pkg = (packages || []).find(p => p.name === booking.packageName);
  if (pkg) {
    return (parseFloat(pkg.campUse) || 0) * (parseInt(booking.pax) || 0);
  }
  // Fallback to legacy calculation
  if (isMorningTour(booking.packageName)) return 0;
  const rate = isVipOrPrivate(booking.packageName) ? 40 : 20;
  return (parseInt(booking.pax) || 0) * rate;
}

// Helper: get quadbike expense for a single booking
export function getBookingQuadbike(booking, packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;
  const pkg = (packages || []).find(p => p.name === booking.packageName);
  if (pkg) {
    return (parseFloat(pkg.quadbikeExpense) || 0) * (parseInt(booking.pax) || 0);
  }
  // Fallback to legacy calculation
  const nameLower = (booking.packageName || '').toLowerCase();
  const isMorningOrEvening = nameLower.includes('morning') || nameLower.includes('evening') || nameLower.includes('safari');
  const isQuadOrPremium = nameLower.includes('quad') || nameLower.includes('premium');
  if (isMorningOrEvening && isQuadOrPremium) {
    return (parseInt(booking.pax) || 0) * 50;
  }
  return 0;
}

// Helper: driver addon commission = 10% of camp addon collection
export function getAddonCommission(campAddonCollection) {
  return (parseFloat(campAddonCollection) || 0) * 0.10;
}

export function getBookingExpense(booking, drivers, bookings = [], expenses = [], packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;

  let bookingSalary = 0;
  let bookingFuel   = 0;
  let bookingCampUse = 0;
  let bookingMisc   = 0;

  if (booking.driverId) {
    const driver = (drivers || []).find(d => d.id === booking.driverId);
    const thisMorning = isMorningTour(booking.packageName);

    // Check if there's a logged expense for this driver on this date (overrides defaults)
    const loggedExp = (expenses || []).find(
      e => e.driverId === booking.driverId && e.date === booking.date
    );

    if (loggedExp) {
      // Logged expense covers the full day — split proportionally across ALL active bookings that day
      const dayBookings = (bookings || []).filter(
        b => b.driverId === booking.driverId && b.date === booking.date && b.status !== 'cancelled'
      );
      const count = dayBookings.length || 1;
      bookingSalary  = (parseFloat(loggedExp.salary)    || 0) / count;
      bookingFuel    = (parseFloat(loggedExp.carPetrol) || 0) / count;
      bookingCampUse = (parseFloat(loggedExp.campUse)   || 0) / count;
      bookingMisc    = (parseFloat(loggedExp.misc)      || 0) / count;
    } else {
      // No logged expense — calculate defaults per SHIFT.
      const sameShiftBookings = (bookings || []).filter(b =>
        b.driverId === booking.driverId &&
        b.date === booking.date &&
        b.status !== 'cancelled' &&
        isMorningTour(b.packageName) === thisMorning
      );
      const shiftCount = sameShiftBookings.length || 1;

      const defaultSalary = driver ? (parseFloat(driver.defaultSalary) || 100) : 100;
      const defaultFuel = 150;

      bookingSalary = defaultSalary / shiftCount;
      bookingFuel   = defaultFuel   / shiftCount;

      // Camp use per booking
      bookingCampUse = getBookingCampUse(booking, packages);
    }
  }

  // Add quadbike expense if applicable
  const bookingQuadbike = getBookingQuadbike(booking, packages);

  return bookingSalary + bookingFuel + bookingCampUse + bookingQuadbike + bookingMisc;
}

export default function BookingsView({ bookings, setBookings, drivers, partners, expenses = [], packages = [], coupons = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all'); // all, today, upcoming, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeCardFilter, setActiveCardFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null); // Row click details popup
  
  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    whatsapp: '',
    partnerId: 'website',
    date: '',
    packageName: '',
    pickupLocation: '',
    roomNo: '',
    pickupTime: '3:30 PM to 4:00 PM',
    pax: 1,
    price: 0,
    driverId: '',
    status: 'pending',
    addonName: '',
    addonPrice: 0,
    couponCode: '',
    pricingType: 'peak'
  });

  const activePackages = packages.length > 0 ? packages : safariPackages;

  const getCouponValidationStatus = (codeVal, pkgId) => {
    if (!codeVal) return { status: 'none', message: '' };
    if (coupons.length === 0) return { status: 'invalid', message: '✗ Invalid coupon code' };

    const cleanCode = codeVal.trim().toLowerCase();
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const matchingCodes = coupons.filter(c => c.code.trim().toLowerCase() === cleanCode);
    if (matchingCodes.length === 0) {
      return { status: 'invalid', message: '✗ Invalid coupon code' };
    }

    const activeAndNotExpired = matchingCodes.filter(c => {
      if (parseInt(c.isActive) === 0) return false;
      if (c.endDate && todayStr > c.endDate) return false;
      return true;
    });

    if (activeAndNotExpired.length === 0) {
      const isExpired = matchingCodes.some(c => c.endDate && todayStr > c.endDate);
      if (isExpired) {
        return { status: 'expired', message: '✗ Coupon code expired' };
      }
      return { status: 'inactive', message: '✗ Coupon code is currently inactive' };
    }

    const selectedPkgObj = activePackages.find(p => p.id === pkgId);
    const isEveningSafari = selectedPkgObj && selectedPkgObj.category === 'Evening Desert Safari';
    const isMorningPrivate = pkgId === 'morning_private';

    const matchesPkg = activeAndNotExpired.find(c => {
      if (c.packageId === pkgId) return true;
      const isUniversal = c.packageId === 'all_safari' || 
                          c.code.toLowerCase() === 'roarnyofferdxb' || 
                          c.code.toLowerCase() === 'roarsummeroffer26';
      if (isUniversal && (isEveningSafari || isMorningPrivate)) return true;
      return false;
    });

    if (!matchesPkg) {
      return { status: 'wrong_package', message: '✗ Coupon code not valid for this package' };
    }

    const isUniversalMatch = matchesPkg.packageId === 'all_safari' || 
                             matchesPkg.code.toLowerCase() === 'roarnyofferdxb' || 
                             matchesPkg.code.toLowerCase() === 'roarsummeroffer26';

    if (isUniversalMatch && selectedPkgObj) {
      const offpeakRate = parseFloat(selectedPkgObj.offpeakRate) || parseFloat(selectedPkgObj.rate) || 0;
      return {
        status: 'valid',
        message: `✓ Coupon Applied: AED ${offpeakRate} package price override`,
        coupon: { ...matchesPkg, customPrice: offpeakRate }
      };
    }

    return { status: 'valid', message: `✓ Coupon Applied: AED ${matchesPkg.customPrice} package price override`, coupon: matchesPkg };
  };

  // Centralized helper to compute base rate and booking price
  const calculateBookingPrice = (packageName, paxVal, pricingTypeVal, couponCodeVal, addonPriceVal) => {
    const pkg = activePackages.find(p => p.name === packageName);
    if (!pkg) return 0;

    // 1. Determine the base package rate (Peak vs Off-Peak)
    let rate = parseFloat(pricingTypeVal === 'offpeak' ? (pkg.offpeakRate || pkg.rate) : (pkg.peakRate || pkg.rate)) || 0;

    // 2. Check for coupon code override
    if (couponCodeVal && coupons.length > 0) {
      const cpnStatus = getCouponValidationStatus(couponCodeVal, pkg.id);
      if (cpnStatus.status === 'valid' && cpnStatus.coupon) {
        rate = parseFloat(cpnStatus.coupon.customPrice) || 0;
      }
    }

    // 3. Compute final price based on type
    let basePrice = 0;
    if (pkg.type === 'per_person') {
      basePrice = rate * (parseInt(paxVal) || 0);
    } else {
      const cars = Math.ceil((parseInt(paxVal) || 0) / 6) || 1;
      basePrice = rate * cars;
    }

    return basePrice + (parseFloat(addonPriceVal) || 0);
  };

  // Open modal for add
  const handleAddClick = () => {
    setEditingBooking(null);
    const initialPkg = activePackages[0];
    setFormData({
      customerName: '',
      whatsapp: '',
      partnerId: (partners || [])[0]?.id || 'website',
      date: new Date().toISOString().split('T')[0],
      packageName: initialPkg?.name || '',
      pickupLocation: '',
      roomNo: '',
      pickupTime: '3:30 PM to 4:00 PM',
      pax: 2,
      price: initialPkg ? (initialPkg.type === 'per_person' ? initialPkg.rate * 2 : initialPkg.rate) : 0,
      driverId: '',
      status: 'confirmed',
      addonName: '',
      addonPrice: 0,
      couponCode: '',
      pricingType: 'peak'
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEditClick = (booking) => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    let initialStatus = booking.status || 'confirmed';
    if (booking.date < todayStr) {
      if (initialStatus !== 'completed' && initialStatus !== 'cancelled') {
        initialStatus = 'completed';
      }
    }

    setEditingBooking(booking);
    setFormData({ 
      roomNo: '',
      pickupTime: '3:30 PM to 4:00 PM',
      addonName: '',
      addonPrice: 0,
      couponCode: '',
      pricingType: 'peak',
      ...booking,
      status: initialStatus
    });
    setIsModalOpen(true);
  };

  // Auto pricing calculations
  const handlePackageChange = (packageName, currentPax) => {
    const nextPrice = calculateBookingPrice(packageName, currentPax, formData.pricingType, formData.couponCode, formData.addonPrice);
    setFormData(prev => ({ 
      ...prev, 
      packageName,
      price: nextPrice
    }));
  };

  const handlePaxChange = (paxValue) => {
    const nextPrice = calculateBookingPrice(formData.packageName, paxValue, formData.pricingType, formData.couponCode, formData.addonPrice);
    setFormData(prev => ({ 
      ...prev, 
      pax: paxValue,
      price: nextPrice
    }));
  };

  const handleAddonPriceChange = (addonPriceVal) => {
    const nextPrice = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, formData.couponCode, addonPriceVal);
    setFormData(prev => ({
      ...prev,
      addonPrice: addonPriceVal,
      price: nextPrice
    }));
  };

  const handlePricingTypeChange = (pricingTypeVal) => {
    const nextPrice = calculateBookingPrice(formData.packageName, formData.pax, pricingTypeVal, formData.couponCode, formData.addonPrice);
    setFormData(prev => ({
      ...prev,
      pricingType: pricingTypeVal,
      price: nextPrice
    }));
  };

  const handleCouponCodeChange = (couponCodeVal) => {
    const nextPrice = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, couponCodeVal, formData.addonPrice);
    setFormData(prev => ({
      ...prev,
      couponCode: couponCodeVal,
      price: nextPrice
    }));
  };

  // Save Booking (Create/Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.date) {
      alert('Please fill out Customer Name and Date.');
      return;
    }

    if (editingBooking) {
      // Update
      setBookings((bookings || []).map(b => b.id === editingBooking.id ? { ...b, ...formData } : b));
    } else {
      // Create
      const numericIds = (bookings || [])
        .map(b => parseInt(b.id))
        .filter(id => !isNaN(id));
      const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 199600;
      const newBooking = {
        ...formData,
        id: String(nextId)
      };
      setBookings([newBooking, ...(bookings || [])]);
    }
    setIsModalOpen(false);
  };

  // Delete Booking
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      setBookings((bookings || []).filter(b => b.id !== id));
    }
  };

  // Quick Driver Assignment
  const handleQuickDriverAssign = (bookingId, driverId) => {
    setBookings((bookings || []).map(b => b.id === bookingId ? { ...b, driverId } : b));
  };

  // Quick Status Switcher
  const handleQuickStatusChange = (bookingId, status) => {
    setBookings((bookings || []).map(b => b.id === bookingId ? { ...b, status } : b));
  };

  // Row Click details handler
  const handleRowClick = (e, booking) => {
    if (e.target.closest('select') || e.target.closest('button') || e.target.closest('a') || e.target.closest('svg')) {
      return; // Ignore controls
    }
    setViewingBooking(booking);
  };

  // Filtering Logic
  const filteredBookings = (bookings || []).filter(b => {
    // Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (b.customerName || '').toLowerCase().includes(searchLower) ||
      (b.whatsapp || '').toLowerCase().includes(searchLower) ||
      (b.packageName || '').toLowerCase().includes(searchLower) ||
      (b.pickupLocation || '').toLowerCase().includes(searchLower);

    // Partner
    const matchesPartner = filterPartner ? b.partnerId === filterPartner : true;

    // Driver
    const matchesDriver = filterDriver ? b.driverId === filterDriver : true;

    // Date Filters
    const bDate = new Date(b.date);
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const today = new Date(todayStr);

    let matchesDate = true;
    if (filterDateRange === 'all') {
      matchesDate = b.date >= todayStr;
    } else if (filterDateRange === 'today') {
      matchesDate = b.date === todayStr;
    } else if (filterDateRange === 'upcoming') {
      matchesDate = bDate >= today;
    } else if (filterDateRange === 'past') {
      matchesDate = bDate < today;
    } else if (filterDateRange === 'custom') {
      if (customStartDate) {
        matchesDate = matchesDate && b.date >= customStartDate;
      }
      if (customEndDate) {
        matchesDate = matchesDate && b.date <= customEndDate;
      }
    }

    return matchesSearch && matchesPartner && matchesDriver && matchesDate;
  });

  // Bookings Dashboard stats calculations based on filteredBookings
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const countToday = filteredBookings.filter(b => b.date === todayStr).length;
  const countConfirmed = filteredBookings.filter(b => b.status === 'confirmed').length;
  const countCompleted = filteredBookings.filter(b => b.status === 'completed').length;
  const countUpcoming = filteredBookings.filter(b => b.date > todayStr && b.status !== 'cancelled').length;
  const countCancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
  
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  
  const completedRevRaw = filteredBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  const completedExpRaw = filteredBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + getBookingExpense(b, drivers, bookings, expenses, packages), 0);
  const completedRevenue = completedRevRaw - completedExpRaw;
  
  const totalExpense = filteredBookings.reduce((sum, b) => {
    if (b.status !== 'cancelled') {
      return sum + getBookingExpense(b, drivers, bookings, expenses, packages);
    }
    return sum;
  }, 0);

  // Apply card filter to table view list
  const displayBookings = filteredBookings.filter(b => {
    if (activeCardFilter === 'today') return b.date === todayStr;
    if (activeCardFilter === 'confirmed') return b.status === 'confirmed';
    if (activeCardFilter === 'completed') return b.status === 'completed';
    if (activeCardFilter === 'upcoming') return b.date > todayStr && b.status !== 'cancelled';
    if (activeCardFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const isCardActive = (filterVal) => activeCardFilter === filterVal;

  return (
    <div>
      {/* Bookings Dashboard Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        {/* Today's Bookings */}
        <div 
          onClick={() => setActiveCardFilter(isCardActive('today') ? 'all' : 'today')}
          style={{ 
            background: isCardActive('today') ? '#eff6ff' : '#fff', 
            padding: '14px', 
            borderRadius: '12px', 
            border: isCardActive('today') ? '2px solid #3b82f6' : '1px solid var(--border)', 
            cursor: 'pointer',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease',
            transform: isCardActive('today') ? 'scale(1.02)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Bookings</span>
          <strong style={{ fontSize: '18px', color: 'var(--text-dark)' }}>{countToday} Tours</strong>
        </div>

        {/* Confirmed Bookings */}
        <div 
          onClick={() => setActiveCardFilter(isCardActive('confirmed') ? 'all' : 'confirmed')}
          style={{ 
            background: isCardActive('confirmed') ? '#eff6ff' : '#fff', 
            padding: '14px', 
            borderRadius: '12px', 
            border: isCardActive('confirmed') ? '2px solid #1d4ed8' : '1px solid var(--border)', 
            cursor: 'pointer',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease',
            transform: isCardActive('confirmed') ? 'scale(1.02)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirmed Bookings</span>
          <strong style={{ fontSize: '18px', color: '#1d4ed8' }}>{countConfirmed} Tours</strong>
        </div>

        {/* Completed Tours */}
        <div 
          onClick={() => setActiveCardFilter(isCardActive('completed') ? 'all' : 'completed')}
          style={{ 
            background: isCardActive('completed') ? '#ecfdf5' : '#fff', 
            padding: '14px', 
            borderRadius: '12px', 
            border: isCardActive('completed') ? '2px solid #047857' : '1px solid var(--border)', 
            cursor: 'pointer',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease',
            transform: isCardActive('completed') ? 'scale(1.02)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Tours</span>
          <strong style={{ fontSize: '18px', color: '#047857' }}>{countCompleted} Tours</strong>
        </div>

        {/* Upcoming Bookings */}
        <div 
          onClick={() => setActiveCardFilter(isCardActive('upcoming') ? 'all' : 'upcoming')}
          style={{ 
            background: isCardActive('upcoming') ? '#f9fafb' : '#fff', 
            padding: '14px', 
            borderRadius: '12px', 
            border: isCardActive('upcoming') ? '2px solid #6b7280' : '1px solid var(--border)', 
            cursor: 'pointer',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease',
            transform: isCardActive('upcoming') ? 'scale(1.02)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Bookings</span>
          <strong style={{ fontSize: '18px', color: 'var(--text-dark)' }}>{countUpcoming} Tours</strong>
        </div>

        {/* Cancelled Bookings */}
        <div 
          onClick={() => setActiveCardFilter(isCardActive('cancelled') ? 'all' : 'cancelled')}
          style={{ 
            background: isCardActive('cancelled') ? '#fef2f2' : '#fff', 
            padding: '14px', 
            borderRadius: '12px', 
            border: isCardActive('cancelled') ? '2px solid #ef4444' : '1px solid var(--border)', 
            cursor: 'pointer',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
            transition: 'all 0.2s ease',
            transform: isCardActive('cancelled') ? 'scale(1.02)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancelled Bookings</span>
          <strong style={{ fontSize: '18px', color: '#ef4444' }}>{countCancelled} Tours</strong>
        </div>

        {/* Total Revenue */}
        <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
          <strong style={{ fontSize: '17px', color: 'var(--text-dark)' }}>AED {totalRevenue.toLocaleString()}</strong>
        </div>

        {/* Completed Bookings Revenue */}
        <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
          <span style={{ fontSize: '10px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Net Profit</span>
          <strong style={{ fontSize: '17px', color: '#047857' }}>AED {completedRevenue.toLocaleString()}</strong>
        </div>

        {/* Total Expense */}
        <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
          <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expense</span>
          <strong style={{ fontSize: '17px', color: '#b91c1c' }}>AED {totalExpense.toLocaleString()}</strong>
        </div>
      </div>

      {/* Controls / Filter Bar */}
      <div className="controls-bar">
        <div className="filters-group">
          {/* Search */}
          <div className="search-input-wrapper">
            <Search />
            <input 
              type="text" 
              placeholder="Search customer, package, hotel..." 
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Partner Source */}
          <select 
            className="form-control"
            style={{ width: '160px' }}
            value={filterPartner}
            onChange={(e) => setFilterPartner(e.target.value)}
          >
            <option value="">All Partners</option>
            {(partners || []).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Driver */}
          <select 
            className="form-control"
            style={{ width: '160px' }}
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
          >
            <option value="">All Drivers</option>
            {(drivers || []).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select 
            className="form-control"
            style={{ width: '160px' }}
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Trips</option>
            <option value="custom">Custom Range</option>
          </select>

          {filterDateRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: '140px' }} 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: '140px' }} 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              const bookingLink = window.location.origin + window.location.pathname + '#/book';
              navigator.clipboard.writeText(bookingLink);
              alert(`Guest booking portal link copied to clipboard:\n${bookingLink}`);
            }} 
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} /> Copy Guest Booking Link
          </button>
          <button onClick={handleAddClick} className="btn btn-primary">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>WhatsApp</th>
              <th>Source</th>
              <th>Safari Package</th>
              <th>Pickup Location</th>
              <th style={{ textAlign: 'center' }}>Pax</th>
              <th>Price</th>
              <th>Assigned Driver</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayBookings.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map(b => {
               const partner = (partners || []).find(p => p.id === b.partnerId);
              const driver = (drivers || []).find(d => d.id === b.driverId);
              
              return (
                <tr key={b.id} onClick={(e) => handleRowClick(e, b)} className="clickable-row">
                  {/* Show Date in DD/MM/YYYY Format */}
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--primary)' }} />
                      {(b.date || '').split('-').reverse().join('/')}
                    </div>
                  </td>
                  
                  {/* Split Customer Details into Name and Phone Columns */}
                  <td className="customer-col" style={{ fontWeight: '600' }}>
                    {b.customerName}
                  </td>
                  
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>{b.whatsapp}</span>
                      <a 
                        href={getWhatsAppConfirmationLink(b)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ display: 'inline-flex', alignItems: 'center', color: '#128c7e' }}
                        title="Send Confirmation via WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.028L2 22l5.13-1.346a9.924 9.924 0 004.881 1.279h.005c5.505 0 9.99-4.478 9.99-9.984A9.972 9.972 0 0012.012 2zm5.72 13.916c-.244.686-1.42 1.262-1.94 1.32-.478.054-.93.268-3.03-.556-2.673-1.05-4.382-3.77-4.516-3.95-.133-.178-1.077-1.432-1.077-2.732 0-1.3.687-1.943.93-2.203.245-.26.543-.325.723-.325.18 0 .36 0 .518.008.167.008.39-.062.61.472.223.543.766 1.868.832 2 .067.133.111.288.022.464-.088.178-.133.288-.266.443-.133.155-.28.344-.4.488-.133.155-.277.324-.12.59.155.267.69 1.13 1.484 1.834.996.883 1.832 1.156 2.09 1.284.26.13.41.11.564-.067.155-.177.664-.775.843-1.038.178-.265.355-.222.597-.133.245.088 1.55.73 1.816.863.267.13.443.197.51.31.066.11.066.64-.178 1.326z"/>
                        </svg>
                      </a>
                    </div>
                  </td>
                  
                  <td>
                    <span className="badge badge-partner">{partner?.name || b.partnerId}</span>
                  </td>
                  <td className="package-col" style={{ fontWeight: '600' }}>{b.packageName}</td>
                  <td className="pickup-col" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {b.pickupLocation} {b.roomNo ? `(Rm ${b.roomNo})` : ''}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{b.pax}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    {parseFloat(b.price) === 0 ? 'Online Paid' : `${b.price} AED`}
                  </td>
                  
                  {/* Quick Driver Assign Select with WhatsApp sharing link */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="form-control"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '13px', 
                          width: '120px',
                          background: b.driverId ? 'rgba(140, 91, 48, 0.05)' : 'var(--bg-input)',
                          borderColor: b.driverId ? 'var(--primary)' : 'var(--border)'
                        }}
                        value={b.driverId}
                        onChange={(e) => handleQuickDriverAssign(b.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {(drivers || []).map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {b.driverId && (() => {
                        const selectedDriverObj = (drivers || []).find(d => d.id === b.driverId);
                        if (selectedDriverObj) {
                          return (
                            <a 
                              href={getWhatsAppDriverLink(b, selectedDriverObj)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', color: '#128c7e' }}
                              title={`Send Tour Details to Driver ${selectedDriverObj.name}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: '#25D366' }}>
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.028L2 22l5.13-1.346a9.924 9.924 0 004.881 1.279h.005c5.505 0 9.99-4.478 9.99-9.984A9.972 9.972 0 0012.012 2zm5.72 13.916c-.244.686-1.42 1.262-1.94 1.32-.478.054-.93.268-3.03-.556-2.673-1.05-4.382-3.77-4.516-3.95-.133-.178-1.077-1.432-1.077-2.732 0-1.3.687-1.943.93-2.203.245-.26.543-.325.723-.325.18 0 .36 0 .518.008.167.008.39-.062.61.472.223.543.766 1.868.832 2 .067.133.111.288.022.464-.088.178-.133.288-.266.443-.133.155-.28.344-.4.488-.133.155-.277.324-.12.59.155.267.69 1.13 1.484 1.834.996.883 1.832 1.156 2.09 1.284.26.13.41.11.564-.067.155-.177.664-.775.843-1.038.178-.265.355-.222.597-.133.245.088 1.55.73 1.816.863.267.13.443.197.51.31.066.11.066.64-.178 1.326z"/>
                              </svg>
                            </a>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  
                  <td>
                    <select 
                      className="form-control"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px', 
                        width: '120px',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        borderRadius: '4px',
                        border: '1px solid',
                        ...(b.status === 'completed' ? { background: 'rgba(16, 185, 129, 0.05)', borderColor: '#10b981', color: '#047857' } : {}),
                        ...(b.status === 'cancelled' ? { background: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444', color: '#b91c1c' } : {}),
                        ...(b.status === 'confirmed' || !b.status ? { background: 'rgba(59, 130, 246, 0.05)', borderColor: '#3b82f6', color: '#1d4ed8' } : {})
                      }}
                      value={b.status || 'confirmed'}
                      onChange={(e) => handleQuickStatusChange(b.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="confirmed" style={{ color: '#1d4ed8', background: '#fff' }}>Confirmed</option>
                      <option value="completed" style={{ color: '#047857', background: '#fff' }}>Completed</option>
                      <option value="cancelled" style={{ color: '#b91c1c', background: '#fff' }}>Cancelled</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEditClick(b)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px' }}
                        title="Edit Booking"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px' }}
                        title="Delete Booking"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No bookings found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Details Viewer Modal (Upgraded layout in luxury split card style) */}
      {viewingBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                Booking Reference Summary
              </h3>
              <button onClick={() => setViewingBooking(null)} className="modal-close">&times;</button>
            </div>

            {/* Top stats metrics row */}
            <div className="modal-profile-header" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="modal-stat-box">
                <span>GUESTS (PAX)</span>
                <strong>{viewingBooking.pax} Pax</strong>
              </div>

              <div className="modal-stat-box highlight">
                <span>TOTAL AMOUNT</span>
                <strong>
                  {parseFloat(viewingBooking.price) === 0 ? 'Online Paid' : `${viewingBooking.price} AED`}
                </strong>
              </div>

              <div className="modal-stat-box">
                <span>TOUR DATE</span>
                <strong>{(viewingBooking.date || '').split('-').reverse().join('/')}</strong>
              </div>
            </div>

            {/* Split cards grid layout */}
            <div className="modal-details-grid">
              
              {/* Left Card: Client & Tour Information */}
              <div className="modal-profile-card">
                <h4>CLIENT & TRIP DETAILS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>BOOKING ID</span>
                    <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{viewingBooking.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>CLIENT NAME</span>
                    <span style={{ fontWeight: '700' }}>{viewingBooking.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>WHATSAPP</span>
                    <span style={{ fontWeight: '700' }}>{viewingBooking.whatsapp}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>SAFARI PACKAGE</span>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{viewingBooking.packageName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>BOOKING SOURCE</span>
                    <span className="badge badge-partner">{(partners || []).find(p => p.id === viewingBooking.partnerId)?.name || viewingBooking.partnerId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PICKUP HOTEL</span>
                    <span style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {viewingBooking.pickupLocation || 'Hotel Lobby'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ROOM NUMBER</span>
                    <span style={{ fontWeight: '600' }}>{viewingBooking.roomNo || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PICKUP TIME</span>
                    <span style={{ fontWeight: '600' }}>{viewingBooking.pickupTime}</span>
                  </div>
                  {viewingBooking.addonName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ADDON SERVICE</span>
                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                        {viewingBooking.addonName} (+{viewingBooking.addonPrice} AED)
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>ASSIGNED DRIVER</span>
                    <span style={{ fontWeight: '700' }}>
                      {(drivers || []).find(d => d.id === viewingBooking.driverId)?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>SAFARI STATUS</span>
                    <span className="badge" style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      textTransform: 'capitalize',
                      fontWeight: '700',
                      ...(viewingBooking.status === 'completed' ? { background: 'rgba(16, 185, 129, 0.12)', color: '#047857' } : {}),
                      ...(viewingBooking.status === 'cancelled' ? { background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' } : {}),
                      ...(viewingBooking.status === 'confirmed' ? { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' } : {})
                    }}>
                      {viewingBooking.status || 'Confirmed'}
                    </span>
                  </div>

                  {viewingBooking.date < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] && (
                    <div style={{ borderTop: '1px dashed var(--border-light)', marginTop: '12px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Trip Calculated Expenses</span>
                      
                      {/* Camp Cost */}
                      {/* Camp Use Cost */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Camp Use Cost:</span>
                        <span style={{ fontWeight: '600' }}>
                          {(() => {
                            const loggedExp = (expenses || []).find(e => e.driverId === viewingBooking.driverId && e.date === viewingBooking.date);
                            const dayBookings = (bookings || []).filter(b => b.driverId === viewingBooking.driverId && b.date === viewingBooking.date && b.status !== 'cancelled');
                            const count = dayBookings.length || 1;

                            if (loggedExp) {
                              const dailyCampUse = parseFloat(loggedExp.campUse) || 0;
                              const propCampUse = dailyCampUse / count;
                              return `${propCampUse.toFixed(1)} AED (logged proportional, daily ${dailyCampUse.toFixed(0)} AED / ${count})`;
                            } else {
                              let campRate = 20;
                              const nameLower = (viewingBooking.packageName || '').toLowerCase();
                              const isMorning = nameLower.includes('morning') || nameLower.includes('tour') || nameLower.includes('hatta') || nameLower.includes('city');
                              if (isMorning) {
                                return `Exempt (Morning/City Tour)`;
                              }
                              const isVip = nameLower.includes('vip') || nameLower.includes('premium');
                              const isPrivate = nameLower.includes('private') || nameLower.includes('priavte') || nameLower.includes('tour') || nameLower.includes('hatta');
                              if (isVip || isPrivate) campRate = 40;
                              return `${viewingBooking.pax} pax × ${campRate} AED = ${(parseInt(viewingBooking.pax) || 0) * campRate} AED`;
                            }
                          })()}
                        </span>
                      </div>
                      
                      {/* Driver Salary & Fuel */}
                      {viewingBooking.driverId && (() => {
                        const driver = (drivers || []).find(d => d.id === viewingBooking.driverId);
                        const dayBookings = (bookings || []).filter(b => b.driverId === viewingBooking.driverId && b.date === viewingBooking.date && b.status !== 'cancelled');
                        const count = dayBookings.length || 1;
                        const loggedExp = (expenses || []).find(e => e.driverId === viewingBooking.driverId && e.date === viewingBooking.date);

                        let dailySalary = 0;
                        let dailyFuel = 0;
                        let dailyMisc = 0;

                        if (loggedExp) {
                          dailySalary = parseFloat(loggedExp.salary) || 0;
                          dailyFuel = parseFloat(loggedExp.carPetrol) || 0;
                          dailyMisc = parseFloat(loggedExp.misc) || 0;
                        } else {
                          dailySalary = driver ? (parseFloat(driver.defaultSalary) || 100) : 100;
                          
                          const hasMorningTour = dayBookings.some(b => {
                            const nameL = (b.packageName || '').toLowerCase();
                            return nameL.includes('morning') || nameL.includes('tour') || nameL.includes('hatta') || nameL.includes('city');
                          });
                          dailyFuel = hasMorningTour ? 150 : 50;
                        }

                        const propSalary = dailySalary / count;
                        const propFuel = dailyFuel / count;
                        const propMisc = dailyMisc / count;

                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Driver Salary:</span>
                              <span style={{ fontWeight: '600' }}>
                                {propSalary.toFixed(1)} AED 
                                {count > 1 && ` (proportional, daily ${dailySalary.toFixed(0)} AED / ${count})`}
                                {loggedExp && " (logged)"}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Fuel Cost:</span>
                              <span style={{ fontWeight: '600' }}>
                                {propFuel.toFixed(1)} AED 
                                {count > 1 && ` (proportional, daily ${dailyFuel.toFixed(0)} AED / ${count})`}
                                {loggedExp && " (logged)"}
                              </span>
                            </div>
                            {(loggedExp && dailyMisc !== 0) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Misc Credits/Costs:</span>
                                <span style={{ fontWeight: '600' }}>
                                  {propMisc.toFixed(1)} AED 
                                  {count > 1 && ` (proportional, daily ${dailyMisc.toFixed(0)} AED / ${count})`}
                                  {" (logged)"}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border-light)', paddingTop: '6px', fontWeight: '800' }}>
                        <span style={{ color: 'var(--text-dark)' }}>Total Booking Expense:</span>
                        <span style={{ color: '#b91c1c' }}>{getBookingExpense(viewingBooking, drivers, bookings, expenses, packages)} AED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Card: WhatsApp Confirmation Preview & Actions */}
              <div className="modal-profile-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4>WHATSAPP CONFIRMATION PREVIEW</h4>
                <textarea 
                  className="form-control" 
                  style={{ fontSize: '11px', flex: 1, minHeight: '140px', resize: 'none', background: 'var(--bg-deep)', border: '1px solid var(--border)', marginBottom: '12px' }} 
                  readOnly 
                  value={getConfirmationText(viewingBooking)} 
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getConfirmationText(viewingBooking));
                      alert('Confirmation message copied to clipboard!');
                    }} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '12px', padding: '8px 12px', flex: 1, justifyContent: 'center' }}
                  >
                    <Clipboard size={12} /> Copy Message
                  </button>
                  <a 
                    href={getWhatsAppConfirmationLink(viewingBooking)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-success" 
                    style={{ fontSize: '12px', padding: '8px 12px', textDecoration: 'none', color: '#fff', flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={12} /> Send Confirm
                  </a>
                </div>
              </div>

            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', marginTop: '20px', paddingTop: '16px' }}>
              <button onClick={() => setViewingBooking(null)} className="btn btn-secondary">
                Close View
              </button>
              <button 
                onClick={() => {
                  setViewingBooking(null);
                  handleEditClick(viewingBooking);
                }} 
                className="btn btn-primary"
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Dialog Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBooking ? 'Edit Booking' : 'New Desert Safari Booking'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    placeholder="e.g. Mr. Rohit jain"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp / Phone</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. +971569468126"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Booking Source (Partner)</label>
                  <select 
                    className="form-control"
                    value={formData.partnerId}
                    onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  >
                    {(partners || []).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Safari Package / Tour *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.packageName}
                    onChange={(e) => handlePackageChange(e.target.value, formData.pax)}
                  >
                    <option value="">Select Package</option>
                    {activePackages.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.type === 'per_person' ? `${p.peakRate || p.rate}/${p.offpeakRate || p.rate} AED` : `${p.peakRate || p.rate}/${p.offpeakRate || p.rate} AED`})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pricing Tier *</label>
                  <select 
                    className="form-control"
                    value={formData.pricingType}
                    onChange={(e) => handlePricingTypeChange(e.target.value)}
                  >
                    <option value="peak">Peak Time (Standard)</option>
                    <option value="offpeak">Off-Peak (Discounted)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Coupon Code</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enter promo code"
                    value={formData.couponCode}
                    onChange={(e) => handleCouponCodeChange(e.target.value.replace(/\s+/g, ''))}
                  />
                  {formData.couponCode && (() => {
                    const status = getCouponValidationStatus(formData.couponCode, activePackages.find(p => p.name === formData.packageName)?.id);
                    return (
                      <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: 'bold', color: status.status === 'valid' ? '#16a34a' : '#ef4444' }}>
                        {status.message}
                      </span>
                    );
                  })()}
                </div>

                <div className="form-group col-span-2">
                  <label>Hotel Pickup Location</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Atlantis The Palm, Lobby West"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hotel Room Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. 3196"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Pickup Time Slot</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. 3:30 PM to 4:00 PM"
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Addon Service / Ride (Manual)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Quad Bike 30m"
                    value={formData.addonName}
                    onChange={(e) => setFormData({ ...formData, addonName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Addon Price (Manual, AED)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={formData.addonPrice}
                    onChange={(e) => handleAddonPriceChange(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {(() => {
                  const selectedPkg = activePackages.find(p => p.name === formData.packageName);
                  const pkgAddons = selectedPkg?.addons || [];
                  if (pkgAddons.length === 0) return null;

                  return (
                    <div className="form-group col-span-2" style={{ background: 'rgba(140, 91, 48, 0.03)', border: '1px solid rgba(140, 91, 48, 0.1)', borderRadius: '8px', padding: '12px' }}>
                      <label style={{ fontWeight: '700', fontSize: '12.5px', marginBottom: '8px', display: 'block', color: 'var(--primary)' }}>Quick Package Addons Checklist</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                        {pkgAddons.map((a, i) => {
                          const addonChecked = formData.addonName.includes(a.name);
                          
                          const handleToggleAddon = (checked) => {
                            let names = formData.addonName ? formData.addonName.split(',').map(n => n.trim()).filter(Boolean) : [];
                            let currentAddonPrice = parseFloat(formData.addonPrice) || 0;
                            
                            if (checked) {
                              if (!names.includes(a.name)) {
                                names.push(a.name);
                                currentAddonPrice += parseFloat(a.price) || 0;
                              }
                            } else {
                              names = names.filter(n => n !== a.name);
                              currentAddonPrice = Math.max(0, currentAddonPrice - (parseFloat(a.price) || 0));
                            }
                            
                            const nextAddonName = names.join(', ');
                            const nextPrice = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, formData.couponCode, currentAddonPrice);
                            
                            setFormData(prev => ({
                              ...prev,
                              addonName: nextAddonName,
                              addonPrice: currentAddonPrice,
                              price: nextPrice
                            }));
                          };

                          return (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', userSelect: 'none' }}>
                              <input 
                                type="checkbox" 
                                checked={addonChecked}
                                onChange={(e) => handleToggleAddon(e.target.checked)}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                              <span>{a.name} (+AED {a.price})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label>Pax (Number of guests)</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-control"
                    value={formData.pax}
                    onChange={(e) => handlePaxChange(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="form-group">
                  <label>Price (AED) - Auto calculated</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label>Assign Driver</label>
                  <select 
                    className="form-control"
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {(drivers || []).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  {formData.date < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] ? (
                    <select 
                      className="form-control"
                      value={formData.status === 'confirmed' || formData.status === 'pending' ? 'completed' : formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <select 
                      className="form-control"
                      value="confirmed"
                      disabled
                      style={{ background: '#f3f4f6', cursor: 'not-allowed', color: '#1d4ed8', fontWeight: 'bold' }}
                    >
                      <option value="confirmed">Confirmed (Upcoming/Today)</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                {editingBooking && (
                  <button 
                    type="button"
                    onClick={() => onForceSyncBooking({ ...editingBooking, ...formData })} 
                    className="btn btn-secondary"
                    style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Database size={14} /> Force Save to Database
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  {editingBooking ? 'Save Changes' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
