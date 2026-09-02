import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, Phone, CheckCircle, Clock, Info, User, Clipboard, Send, Award, DollarSign, Copy, Database, Printer, Sparkles, Percent } from 'lucide-react';
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
export function getSeasonalIsSummer(dateStr) {
  let month = new Date().getMonth() + 1;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
    } else {
      const slashParts = dateStr.split('/');
      if (slashParts.length === 3) {
        month = parseInt(slashParts[1], 10);
      }
    }
  }
  return month >= 5 && month <= 10;
}

export function getSeasonalPickupTime(dateStr, categoryOrIsMorning) {
  let month = new Date().getMonth() + 1;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
    } else {
      const slashParts = dateStr.split('/');
      if (slashParts.length === 3) {
        month = parseInt(slashParts[1], 10);
      }
    }
  }
  const isSummer = month >= 5 && month <= 10;
  const isMorning = typeof categoryOrIsMorning === 'boolean' 
    ? categoryOrIsMorning 
    : (categoryOrIsMorning || '').toLowerCase().includes('morning');

  if (isMorning) {
    return isSummer ? '7:00 AM' : '8:00 AM';
  } else {
    return isSummer ? '3:30 PM to 4:00 PM' : '2:00 PM to 2:30 PM';
  }
}

export function getWhatsAppConfirmationLink(booking) {
  if (!booking) return '';
  const msg = getConfirmationText(booking);
  const phoneClean = cleanPhone(booking.whatsapp);
  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
}

export function getWhatsAppDriverLink(booking, driver) {
  if (!booking || !driver) return '';
  const refCode = booking.id ? booking.id.replace('book-', '') : '199600';
  const isMorning = (booking.packageName || '').toLowerCase().includes('morning');
  const resolvedPickupTime = booking.pickupTime && 
    booking.pickupTime !== '3:30 PM to 4:00 PM' && 
    booking.pickupTime !== '9:00 AM to 9:30 AM' &&
    booking.pickupTime !== '2:00 PM to 2:30 PM'
      ? booking.pickupTime
      : getSeasonalPickupTime(booking.date, isMorning);

  // Calculate pax for this specific driver if it's a split booking
  let paxStr = booking.pax;
  if (booking.driverId && booking.driverId.includes(',')) {
    const ids = booking.driverId.split(',');
    const idx = ids.indexOf(driver.id);
    if (idx !== -1) {
      const totalPax = parseInt(booking.pax) || 1;
      let paxForThisDriver = Math.min(6, totalPax - idx * 6);
      if (booking.carPax) {
        const splits = booking.carPax.split(',').map(s => parseInt(s) || 0);
        if (splits[idx] !== undefined) {
          paxForThisDriver = splits[idx];
        }
      }
      paxStr = `${paxForThisDriver} pax (Car ${idx + 1} of ${ids.length})`;
    }
  }

  let msg = `Hi ${driver.name}, here is your assigned tour detail:
Reference: #${refCode}
Customer: ${booking.customerName}
WhatsApp: ${booking.whatsapp}
Pax: ${paxStr}
Package: ${booking.packageName}
Date: ${(booking.date || '').split('-').reverse().join('/')}
Pickup Time: ${resolvedPickupTime}
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
  const refCode = booking.id ? booking.id.replace('book-', '') : '1000001';
  const isMorning = (booking.packageName || '').toLowerCase().includes('morning');
  const isSelfDrive = booking.tourType === 'self_drive' || 
                      (booking.pickupLocation || '').toLowerCase().trim() === 'self drive' ||
                      (booking.pickupLocation || '').toLowerCase().includes('maps.app.goo.gl');

  const resolvedPickupTime = isSelfDrive 
    ? (getSeasonalIsSummer(booking.date) ? '4:40 PM' : '3:30 PM')
    : (booking.pickupTime && 
       booking.pickupTime !== '3:30 PM to 4:00 PM' && 
       booking.pickupTime !== '9:00 AM to 9:30 AM' &&
       booking.pickupTime !== '2:00 PM to 2:30 PM'
         ? booking.pickupTime
         : getSeasonalPickupTime(booking.date, isMorning));

  const resolvedLocation = isSelfDrive ? 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' : (booking.pickupLocation || 'Hotel Lobby');

  let lines = [
    `Thank you for choosing Roar Adventure Tourism LLC, Your booking regarding Dubai Desert Safari with Booking Reference# ${refCode} is confirmed with following details.`,
    `1. Name: ${booking.customerName}`,
    `2. WhatsApp: ${booking.whatsapp}`,
    `3. No of Guests: ${booking.pax}`,
    `4. Package: ${booking.packageName || 'Dubai Desert Safari'}`,
    isSelfDrive ? `5. Meeting point: ${resolvedLocation}` : `5. Pickup location: ${resolvedLocation}`,
    isSelfDrive ? `6. Arrival time: ${resolvedPickupTime}` : `6. Pickup time: ${resolvedPickupTime}`,
    booking.addonName ? `7. Addon Service: ${booking.addonName} ${parseFloat(booking.addonPrice) > 0 ? `(+${booking.addonPrice} AED)` : ''}` : null,
    `8. Payment: ${booking.price} AED`,
    `9. ${(booking.paymentOption || 'Collection') !== 'Collection' ? `${booking.paymentOption} (Paid)` : 'Payment on arrival (5% VAT apply on card payment) .'}`,
    `10. Date: ${(booking.date || '').split('-').reverse().join('/')}`
  ].filter(Boolean);

  let itemIndex = 1;
  const numberedLines = lines.map((line, idx) => {
    if (idx === 0) return line;
    return line.replace(/^\d+\.\s*/, () => `${itemIndex++}. `);
  });

  return numberedLines.join('\n') + `\nTerms:\n1. Free Cancellation before 24 hours\n2. 50% refund before 12 hours.\n3. 0 refund for no showup or same day cancellation.\nFor Cancellation Reschedule or Modifications please Call/WhatsApp +97145578679.`;
}

// Helper: detect if a booking is a City Tour
export function isCityTour(booking, packages = []) {
  if (!booking) return false;
  const pkg = (packages || []).find(p => p.name === booking.packageName) || safariPackages.find(p => p.name === booking.packageName);
  if (pkg && pkg.category === 'City Tours') return true;
  const nameLower = (booking.packageName || '').toLowerCase();
  return nameLower.includes('city') || nameLower.includes('tour') || nameLower.includes('hatta') || nameLower.includes('dubai') || nameLower.includes('abu dhabi');
}

export function getDriverDayBookings(driverId, bookings = []) {
  const result = [];
  (bookings || []).forEach(b => {
    if (b.status === 'cancelled') return;
    if (!b.driverId) return;
    const ids = b.driverId.split(',');
    const idx = ids.indexOf(driverId);
    if (idx !== -1) {
      const paxTotal = parseInt(b.pax) || 1;
      let paxForThisDriver = Math.min(6, paxTotal - idx * 6);
      if (b.carPax) {
        const splits = b.carPax.split(',').map(s => parseInt(s) || 0);
        if (splits[idx] !== undefined) {
          paxForThisDriver = splits[idx];
        }
      }
      if (paxForThisDriver > 0) {
        const share = paxForThisDriver / paxTotal;
        result.push({
          ...b,
          pax: paxForThisDriver,
          originalPax: paxTotal,
          price: (parseFloat(b.price) || 0) * share,
          originalPrice: parseFloat(b.price) || 0,
          driverIndex: idx,
          isSplitBooking: true
        });
      }
    }
  });
  return result;
}

// Helper: detect if a package is a morning safari (no camp use)
export function isMorningTour(packageName) {
  const n = (packageName || '').toLowerCase();
  if (n.includes('evening')) return false;
  return n.includes('morning');
}

// Helper: detect if a package is VIP or Private (affects camp use rate)
function isVipOrPrivate(packageName) {
  const n = (packageName || '').toLowerCase();
  return n.includes('vip') || n.includes('premium') || n.includes('private') || n.includes('priavte');
}

// Helper: get camp use cost for a single booking.
export function getBookingCampUse(booking, packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;

  // City tours or morning tours have 0 camp use
  if (isCityTour(booking, packages) || isMorningTour(booking.packageName)) {
    return 0;
  }

  const pkg = (packages || []).find(p => p.name === booking.packageName) || safariPackages.find(p => p.name === booking.packageName);
  if (pkg) {
    if (pkg.campUse !== undefined) {
      return (parseFloat(pkg.campUse) || 0) * (parseInt(booking.pax) || 0);
    }
  }

  // Fallback: VIP/Private evening packages are 40aed, standard is 20aed
  const isVip = isVipOrPrivate(booking.packageName);
  const rate = isVip ? 40 : 20;
  return rate * (parseInt(booking.pax) || 0);
}

// Helper: get quadbike expense for a single booking
export function getBookingQuadbike(booking, packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;

  const paxCount = parseInt(booking.pax) || 0;
  let quadExpense = 0;

  const pkg = (packages || []).find(p => p.name === booking.packageName) || safariPackages.find(p => p.name === booking.packageName);
  if (pkg && pkg.quadbikeExpense !== undefined) {
    quadExpense = (parseFloat(pkg.quadbikeExpense) || 0) * paxCount;
  } else {
    // Fallback name-based check
    const nameLower = (booking.packageName || '').toLowerCase();
    if (nameLower.includes('quad') || nameLower.includes('premium')) {
      quadExpense = paxCount * 50;
    }
  }

  // Also check if quadbike/bike is added as an addon
  const addonLower = (booking.addonName || '').toLowerCase();
  if (addonLower.includes('quad') || addonLower.includes('bike')) {
    quadExpense += paxCount * 50;
  }

  return quadExpense;
}

// Helper: driver addon commission = 10% of camp addon collection
export function getAddonCommission(campAddonCollection) {
  return (parseFloat(campAddonCollection) || 0) * 0.10;
}

// Helper to group daily bookings of a driver into cars and allocate S+F (Salary + Fuel = 250 AED per car)
export function getDriverDayExpenses(driverId, date, bookings = [], drivers = [], packages = []) {
  const dayBookings = getDriverDayBookings(driverId, bookings).filter(b => b.date === date);

  if (dayBookings.length === 0) return {};

  const activePackages = packages.length > 0 ? packages : safariPackages;

  // Group bookings into three categories: City Tours, Morning Safaris, Evening Safaris
  const cityBookings = dayBookings.filter(b => isCityTour(b, activePackages));
  const safariBookings = dayBookings.filter(b => !isCityTour(b, activePackages));
  const morningBookings = safariBookings.filter(b => isMorningTour(b.packageName));
  const eveningBookings = safariBookings.filter(b => !isMorningTour(b.packageName));

  const allocation = {}; // bookingId -> { sF: number, salary: number, fuel: number }
  dayBookings.forEach(b => {
    allocation[b.id] = { sF: 0, salary: 0, fuel: 0 };
  });

  const isPrivateBooking = (b) => {
    const pkg = activePackages.find(p => p.name === b.packageName);
    return (pkg && pkg.type === 'flat') || (b.packageName || '').toLowerCase().includes('private') || (b.packageName || '').toLowerCase().includes('priavte');
  };

  const allocateCategory = (catBookings, isCity = false) => {
    if (catBookings.length === 0) return;

    if (isCity) {
      // City tours: each booking is private and gets its own car(s)
      catBookings.forEach(b => {
        let paxCount = parseInt(b.pax) || 1;
        let cars = Math.ceil(paxCount / 6) || 1;
        const totalSF = cars * 250;
        allocation[b.id].sF += totalSF;
        allocation[b.id].salary += cars * 100;
        allocation[b.id].fuel += cars * 150;
      });
      return;
    }

    // Safaris: check private vs shared
    const privateB = catBookings.filter(b => isPrivateBooking(b));
    const sharedB = catBookings.filter(b => !isPrivateBooking(b));

    const cars = []; // array of { isPrivate, totalPax, bookings: [{ booking, pax }] }

    // Private safari bookings
    privateB.forEach(b => {
      let remaining = parseInt(b.pax) || 1;
      while (remaining > 0) {
        const paxInCar = Math.min(remaining, 6);
        cars.push({
          isPrivate: true,
          totalPax: paxInCar,
          bookings: [{ booking: b, pax: paxInCar }]
        });
        remaining -= paxInCar;
      }
    });

    // Shared safari bookings
    const sortedShared = [...sharedB].sort((a, b) => (parseInt(b.pax) || 0) - (parseInt(a.pax) || 0));
    sortedShared.forEach(b => {
      let remaining = parseInt(b.pax) || 1;
      while (remaining > 0) {
        let foundCar = null;
        for (const car of cars) {
          if (!car.isPrivate && car.totalPax < 6) {
            foundCar = car;
            break;
          }
        }

        if (foundCar) {
          const space = 6 - foundCar.totalPax;
          const paxToPut = Math.min(remaining, space);
          foundCar.bookings.push({ booking: b, pax: paxToPut });
          foundCar.totalPax += paxToPut;
          remaining -= paxToPut;
        } else {
          const paxToPut = Math.min(remaining, 6);
          cars.push({
            isPrivate: false,
            totalPax: paxToPut,
            bookings: [{ booking: b, pax: paxToPut }]
          });
          remaining -= paxToPut;
        }
      }
    });

    // Allocate 250 S+F per car (100 salary + 150 fuel)
    cars.forEach(car => {
      const totalPaxInCar = car.totalPax || 1;
      car.bookings.forEach(alloc => {
        const share = alloc.pax / totalPaxInCar;
        const allocatedSF = share * 250;
        allocation[alloc.booking.id].sF += allocatedSF;
        allocation[alloc.booking.id].salary += share * 100;
        allocation[alloc.booking.id].fuel += share * 150;
      });
    });
  };

  allocateCategory(cityBookings, true);
  allocateCategory(morningBookings, false);
  allocateCategory(eveningBookings, false);

  return allocation;
}

export function getBookingExpense(booking, drivers, bookings = [], expenses = [], packages = []) {
  if (!booking || booking.status === 'cancelled') return 0;

  let bookingSalary = 0;
  let bookingFuel   = 0;
  let bookingCampUse = 0;
  let bookingMisc   = 0;

  if (booking.driverId) {
    const driverIds = booking.driverId.split(',').filter(Boolean);
    driverIds.forEach(drvId => {
      // Check if there's a logged expense for this driver on this date (overrides defaults)
      const loggedExp = (expenses || []).find(
        e => e.driverId === drvId && e.date === booking.date
      );

      if (loggedExp) {
        const dayBookings = getDriverDayBookings(drvId, bookings).filter(b => b.date === booking.date);
        const count = dayBookings.length || 1;
        bookingSalary  += (parseFloat(loggedExp.salary)    || 0) / count;
        bookingFuel    += (parseFloat(loggedExp.carPetrol) || 0) / count;
        bookingCampUse += (parseFloat(loggedExp.campUse)   || 0) / count;
        bookingMisc    += (parseFloat(loggedExp.misc)      || 0) / count;
      } else {
        // No logged expense — calculate defaults using the new day-based car-grouping logic.
        const allocations = getDriverDayExpenses(drvId, booking.date, bookings, drivers, packages);
        const alloc = allocations[booking.id];
        if (alloc) {
          bookingSalary += alloc.salary;
          bookingFuel   += alloc.fuel;
        } else {
          bookingSalary += 100;
          bookingFuel   += 150;
        }
      }
    });

    if (driverIds.length === 0 || !driverIds.some(drvId => (expenses || []).some(e => e.driverId === drvId && e.date === booking.date))) {
      bookingCampUse = getBookingCampUse(booking, packages);
    }
  } else {
    bookingCampUse = getBookingCampUse(booking, packages);
  }

  // Add quadbike expense if applicable
  const bookingQuadbike = getBookingQuadbike(booking, packages);

  return bookingSalary + bookingFuel + bookingCampUse + bookingQuadbike + bookingMisc;
}

function printBookingsReport(displayBookings, filters, partners, drivers) {
  const { dateRange, startDate, endDate, partner, driver, status } = filters;
  
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const dateFormatted = todayStr.split('-').reverse().join('/');
  
  const totalB = displayBookings.length;
  const totalPax = displayBookings.reduce((sum, b) => sum + (parseInt(b.pax) || 0), 0);
  const totalRev = displayBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  
  const confirmedCount = displayBookings.filter(b => b.status === 'confirmed' || !b.status).length;
  const completedCount = displayBookings.filter(b => b.status === 'completed').length;
  const cancelledCount = displayBookings.filter(b => b.status === 'cancelled').length;

  let filterSummary = '';
  if (dateRange === 'today') filterSummary += `Date: Today (${dateFormatted})`;
  else if (dateRange === 'upcoming') filterSummary += `Date: Upcoming`;
  else if (dateRange === 'custom') {
    const s = startDate ? startDate.split('-').reverse().join('/') : 'Start';
    const e = endDate ? endDate.split('-').reverse().join('/') : 'End';
    filterSummary += `Date Range: ${s} to ${e}`;
  } else filterSummary += `Date: All Dates`;

  if (partner) {
    const pName = (partners || []).find(p => p.id === partner)?.name || partner;
    filterSummary += ` | Partner: ${pName}`;
  }
  if (driver) {
    const dName = (drivers || []).find(d => d.id === driver)?.name || driver;
    filterSummary += ` | Driver: ${dName}`;
  }
  if (status && status !== 'all') {
    filterSummary += ` | Status: ${status}`;
  }

  const rowsHtml = displayBookings.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map((b, idx) => {
    const pName = (partners || []).find(p => p.id === b.partnerId)?.name || b.partnerId || 'Website';
    const dName = (b.driverId || '').split(',').map(id => (drivers || []).find(d => d.id === id)?.name).filter(Boolean).join(' / ') || 'Unassigned';
    return `
      <tr>
        <td style="text-align: center; white-space: nowrap;">${(b.date || '').split('-').reverse().join('/')}</td>
        <td style="text-align: center; font-weight: bold;">${b.id ? b.id.replace('book-', '') : ''}</td>
        <td style="font-weight: 600;">${b.customerName}</td>
        <td>${b.whatsapp}</td>
        <td>${pName}</td>
        <td>${b.packageName}</td>
        <td style="text-align: center; font-weight: bold;">${b.pax}</td>
        <td style="text-align: right; font-weight: 700;">${parseFloat(b.price).toLocaleString()} AED</td>
        <td>${dName}</td>
        <td style="text-align: center;"><span class="badge badge-${b.status || 'confirmed'}">${b.status || 'confirmed'}</span></td>
      </tr>
    `;
  }).join('');

  const printHtml = `
    <html>
      <head>
        <title>Safari Bookings Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #fffdfb;
            color: #543d2b;
            margin: 30px;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #efe9df;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .header h1 {
            margin: 0 0 6px 0;
            font-size: 24px;
            color: #c9762a;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 0;
            font-size: 12px;
            color: #8c5b30;
            font-weight: 500;
          }
          .filter-bar {
            background: #faf6f0;
            border: 1px solid #efe9df;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 25px;
            font-size: 12px;
            font-weight: 600;
            color: #8c5b30;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-box {
            background: #fff;
            border: 1px solid #efe9df;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(140, 91, 48, 0.02);
          }
          .stat-box span {
            display: block;
            font-size: 10px;
            font-weight: 800;
            color: #8c5b30;
            text-transform: uppercase;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }
          .stat-box strong {
            font-size: 20px;
            font-weight: 800;
            color: #c5a059;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: #fff;
            border: 1px solid #efe9df;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #faf6f0;
            color: #543d2b;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 10px;
            border-bottom: 1.5px solid #efe9df;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #efe9df;
            font-size: 12px;
          }
          tr:nth-child(even) td {
            background: #fffdfb;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .badge-confirmed { background: rgba(59, 130, 246, 0.08); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.15); }
          .badge-completed { background: rgba(16, 185, 129, 0.08); color: #047857; border: 1px solid rgba(16, 185, 129, 0.15); }
          .badge-cancelled { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.15); }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #8c5b30;
            border-top: 1px solid #efe9df;
            padding-top: 15px;
          }
          @media print {
            body { margin: 15px; background: #fff; color: #000; }
            .stat-box { border: 1px solid #ddd; }
            table { border: 1px solid #ddd; }
            th { background: #f5f5f5 !important; border-bottom: 2px solid #ddd !important; }
            td { border-bottom: 1px solid #ddd !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Roar Adventure Tourism LLC</h1>
          <p>Safari Bookings Report | Generated on ${dateFormatted}</p>
        </div>
        
        <div class="filter-bar">
          ${filterSummary}
        </div>
        
        <div class="stats-grid">
          <div class="stat-box">
            <span>Total Bookings</span>
            <strong>${totalB} Tours</strong>
          </div>
          <div class="stat-box">
            <span>Total Guests</span>
            <strong>${totalPax} Pax</strong>
          </div>
          <div class="stat-box">
            <span>Total Revenue</span>
            <strong>${totalRev.toLocaleString()} AED</strong>
          </div>
          <div class="stat-box">
            <span>Status Share</span>
            <strong style="font-size: 12px; display: flex; flex-direction: column; justify-content: center; gap: 2px;">
              <span style="color:#1d4ed8; text-transform:none; font-size:12px; margin:0;">Confirmed: ${confirmedCount}</span>
              <span style="color:#047857; text-transform:none; font-size:12px; margin:0;">Completed: ${completedCount}</span>
              <span style="color:#b91c1c; text-transform:none; font-size:12px; margin:0;">Cancelled: ${cancelledCount}</span>
            </strong>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 85px; text-align: center;">Date</th>
              <th style="width: 70px; text-align: center;">Ref#</th>
              <th>Customer</th>
              <th>WhatsApp</th>
              <th>Partner</th>
              <th>Package</th>
              <th style="width: 40px; text-align: center;">Pax</th>
              <th style="width: 90px; text-align: right;">Price</th>
              <th>Driver</th>
              <th style="width: 80px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align: center; color: #8c5b30; padding: 20px;">No bookings match the selected filters.</td></tr>'}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Roar Adventure Tourism LLC &copy; ${new Date().getFullYear()} - Internal Operations Report</p>
        </div>
      </body>
    </html>
  `;

  const popup = window.open('', '_blank');
  if (!popup) {
    alert('Please allow popups to generate the report PDF.');
    return;
  }
  popup.document.write(printHtml);
  popup.document.close();
  setTimeout(() => {
    popup.print();
  }, 400);
}

export default function BookingsView({ 
  bookings, 
  setBookings, 
  drivers, 
  partners, 
  expenses = [], 
  packages = [], 
  coupons = [], 
  settings = [], 
  onSaveSetting,
  filterPartner,
  setFilterPartner,
  filterDriver,
  setFilterDriver,
  filterDateRange,
  setFilterDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  viewingBookingFromDashboard,
  setViewingBookingFromDashboard,
  activeCardFilter,
  setActiveCardFilter
}) {
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null); // Row click details popup
  const [discountInput, setDiscountInput] = useState(0);

  useEffect(() => {
    if (viewingBookingFromDashboard) {
      setViewingBooking(viewingBookingFromDashboard);
      if (typeof setViewingBookingFromDashboard === 'function') {
        setViewingBookingFromDashboard(null);
      }
    }
  }, [viewingBookingFromDashboard, setViewingBookingFromDashboard]);

  // Reset card filter when dropdown filters or search changes
  useEffect(() => {
    if (typeof setActiveCardFilter === 'function') {
      setActiveCardFilter('all');
    }
  }, [filterPartner, filterDriver, filterDateRange, searchTerm, setActiveCardFilter]);
  
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);
  
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
    pricingType: 'peak',
    paymentOption: 'Collection'
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
                          c.packageId === 'all_packages' ||
                          c.code.toLowerCase() === 'roarnyofferdxb' || 
                          c.code.toLowerCase() === 'roarsummeroffer26';
      if (isUniversal) return true;
      return false;
    });

    if (!matchesPkg) {
      return { status: 'wrong_package', message: '✗ Coupon code not valid for this package' };
    }

    const isUniversalMatch = matchesPkg.packageId === 'all_safari' || 
                             matchesPkg.packageId === 'all_packages' ||
                             matchesPkg.code.toLowerCase() === 'roarnyofferdxb' || 
                             matchesPkg.code.toLowerCase() === 'roarsummeroffer26';

    if (isUniversalMatch && selectedPkgObj) {
      const offpeakRate = parseFloat(selectedPkgObj.offpeakRate) || parseFloat(selectedPkgObj.rate) || 0;
      return {
        status: 'valid',
        message: `✓ Off-Peak Rate Applied: AED ${offpeakRate} package price override`,
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
  const autoPrice = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, formData.couponCode, formData.addonPrice);

  const autoApplyOffpeakSetting = (settings || []).find(s => s.setting_key === 'auto_apply_offpeak_coupon')?.setting_value === '1';
  const offpeakCouponCodeSetting = (settings || []).find(s => s.setting_key === 'offpeak_coupon_code')?.setting_value || 'RoarSummerOffer26';

  // Open modal for add
  const handleAddClick = () => {
    setEditingBooking(null);
    setDiscountInput(0);
    const initialPkg = activePackages[0];
    const isMorning = (initialPkg?.name || '').toLowerCase().includes('morning');
    const todayDateStr = new Date().toISOString().split('T')[0];

    const activeOffpeakCpn = (coupons || []).find(c => 
      parseInt(c.isActive) !== 0 && 
      (c.code.toLowerCase() === offpeakCouponCodeSetting.toLowerCase() || c.packageId === 'all_safari' || c.packageId === 'all_packages')
    );
    const defaultCouponCode = autoApplyOffpeakSetting && activeOffpeakCpn ? activeOffpeakCpn.code : '';
    const defaultPricingType = autoApplyOffpeakSetting ? 'offpeak' : 'peak';
    const computedPrice = calculateBookingPrice(initialPkg?.name || '', 2, defaultPricingType, defaultCouponCode, 0);

    setFormData({
      customerName: '',
      whatsapp: '',
      partnerId: (partners || [])[0]?.id || 'website',
      date: todayDateStr,
      packageName: initialPkg?.name || '',
      pickupLocation: '',
      roomNo: '',
      pickupTime: getSeasonalPickupTime(todayDateStr, isMorning),
      pax: 2,
      price: computedPrice,
      driverId: '',
      status: 'confirmed',
      addonName: '',
      addonPrice: 0,
      couponCode: defaultCouponCode,
      pricingType: defaultPricingType,
      tourType: 'pick_drop',
      paymentOption: 'Collection'
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

    const autoPriceVal = calculateBookingPrice(booking.packageName, booking.pax, booking.pricingType || 'peak', booking.couponCode || '', booking.addonPrice || 0);
    const initialDiscount = Math.max(0, autoPriceVal - booking.price);
    setDiscountInput(initialDiscount);

    setEditingBooking(booking);
    setFormData({ 
      roomNo: '',
      pickupTime: '3:30 PM to 4:00 PM',
      addonName: '',
      addonPrice: 0,
      couponCode: '',
      pricingType: 'peak',
      tourType: 'pick_drop',
      ...booking,
      status: initialStatus,
      paymentOption: booking.paymentOption || (parseFloat(booking.price) === 0 ? 'Paid via stripe' : 'Collection')
    });
    setIsModalOpen(true);
  };

  const handleDuplicateClick = async (booking) => {
    // Generate a new 7-digit ID
    const highWaterMarkStr = settings.find(s => s.setting_key === 'last_booking_ref')?.setting_value;
    let nextIdVal = highWaterMarkStr ? parseInt(highWaterMarkStr) : 0;
    
    // Fallback if settings high water mark is missing
    if (!nextIdVal || isNaN(nextIdVal)) {
      const allIds = bookings.map(b => parseInt(b.id)).filter(id => !isNaN(id) && id >= 1000000 && id <= 9999999);
      nextIdVal = allIds.length > 0 ? Math.max(...allIds) : 1000000;
    }
    
    const newId = String(nextIdVal + 1);
    
    // Save settings high water mark
    if (onSaveSetting) {
      await onSaveSetting('last_booking_ref', newId);
    }
    
    const duplicatedBooking = {
      ...booking,
      id: newId,
      customerName: `${booking.customerName} (Copy)`,
      status: 'confirmed', // default status
      calendar_event_id: '' // reset calendar event id
    };
    
    // Add to bookings list
    setBookings([duplicatedBooking, ...bookings]);
    
    alert(`Booking duplicated successfully! New Reference ID: ${newId}`);
  };

  // Auto pricing calculations
  const handlePackageChange = (packageName, currentPax) => {
    const nextAuto = calculateBookingPrice(packageName, currentPax, formData.pricingType, formData.couponCode, formData.addonPrice);
    const isMorning = (packageName || '').toLowerCase().includes('morning');
    const seasonalTime = getSeasonalPickupTime(formData.date, isMorning);
    setFormData(prev => ({ 
      ...prev, 
      packageName,
      pickupTime: seasonalTime,
      price: Math.max(0, nextAuto - discountInput)
    }));
  };

  const handlePaxChange = (paxValue) => {
    const nextAuto = calculateBookingPrice(formData.packageName, paxValue, formData.pricingType, formData.couponCode, formData.addonPrice);
    setFormData(prev => ({ 
      ...prev, 
      pax: paxValue,
      price: Math.max(0, nextAuto - discountInput)
    }));
  };

  const handleAddonPriceChange = (addonPriceVal) => {
    const nextAuto = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, formData.couponCode, addonPriceVal);
    setFormData(prev => ({
      ...prev,
      addonPrice: addonPriceVal,
      price: Math.max(0, nextAuto - discountInput)
    }));
  };

  const handlePricingTypeChange = (pricingTypeVal) => {
    const nextAuto = calculateBookingPrice(formData.packageName, formData.pax, pricingTypeVal, formData.couponCode, formData.addonPrice);
    setFormData(prev => ({
      ...prev,
      pricingType: pricingTypeVal,
      price: Math.max(0, nextAuto - discountInput)
    }));
  };

  const handleCouponCodeChange = (couponCodeVal) => {
    const nextAuto = calculateBookingPrice(formData.packageName, formData.pax, formData.pricingType, couponCodeVal, formData.addonPrice);
    setFormData(prev => ({
      ...prev,
      couponCode: couponCodeVal,
      price: Math.max(0, nextAuto - discountInput)
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
      const refSetting = (settings || []).find(s => s.setting_key === 'last_booking_ref');
      let nextId = refSetting ? parseInt(refSetting.setting_value) + 1 : 1000001;
      
      const numericIds = (bookings || [])
        .map(b => parseInt(b.id))
        .filter(id => !isNaN(id) && id >= 1000000 && id <= 9999999);
      if (numericIds.length > 0) {
        nextId = Math.max(nextId, Math.max(...numericIds) + 1);
      }
      
      if (typeof onSaveSetting === 'function') {
        onSaveSetting('last_booking_ref', String(nextId));
      } else {
        fetch(`api.php?action=save_setting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'last_booking_ref', value: String(nextId) })
        });
      }

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
    const today = new Date(todayStr);

    let matchesDate = true;
    if (filterDateRange === 'all') {
      matchesDate = true;
    } else if (filterDateRange === 'today') {
      matchesDate = b.date === todayStr;
    } else if (filterDateRange === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const lastDayStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      matchesDate = b.date >= firstDayStr && b.date <= lastDayStr;
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
        <div className="filters-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto', width: '100%', maxWidth: '100%' }}>
          {/* Search */}
          <div className="search-input-wrapper" style={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '100%' }}>
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
            style={{ flex: '1 1 130px', minWidth: '120px', maxWidth: '100%' }}
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
            style={{ flex: '1 1 130px', minWidth: '120px', maxWidth: '100%' }}
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
            style={{ flex: '1 1 130px', minWidth: '120px', maxWidth: '100%' }}
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="monthly">This Month (1st to Last Day)</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Trips</option>
            <option value="custom">Custom Range</option>
          </select>

          {filterDateRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto' }}>
              <input 
                type="date" 
                className="form-control" 
                style={{ flex: '1 1 110px', minWidth: '100px', maxWidth: '100%' }} 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ flex: '1 1 110px', minWidth: '100px', maxWidth: '100%' }} 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}
        </div>

        <div className="bookings-actions-container" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              const bookingLink = window.location.origin + window.location.pathname + '#/book';
              navigator.clipboard.writeText(bookingLink);
              alert(`Guest booking portal link copied to clipboard:\n${bookingLink}`);
            }} 
            className="btn btn-secondary copy-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} /> Copy Guest Booking Link
          </button>
          <button onClick={handleAddClick} className="btn btn-primary">
            <Plus size={16} /> New Booking
          </button>
          <button 
            onClick={() => printBookingsReport(displayBookings, { dateRange: filterDateRange, startDate: customStartDate, endDate: customEndDate, partner: filterPartner, driver: filterDriver, status: activeCardFilter }, partners, drivers)} 
            className="btn btn-secondary" 
            style={{ color: 'var(--primary)', borderColor: 'rgba(140, 91, 48, 0.2)', background: 'rgba(140, 91, 48, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Generate Report PDF
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
                    {(() => {
                      const carsCount = Math.ceil((parseInt(b.pax) || 1) / 6) || 1;
                      const currentDrivers = (b.driverId || '').split(',');
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Array.from({ length: carsCount }).map((_, idx) => {
                            const val = currentDrivers[idx] || '';
                            const selectedDriverObj = (drivers || []).find(d => d.id === val);
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {carsCount > 1 && (
                                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>C{idx + 1}:</span>
                                )}
                                <select
                                  className="form-control"
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '12px', 
                                    width: '110px',
                                    background: val ? 'rgba(140, 91, 48, 0.05)' : 'var(--bg-input)',
                                    borderColor: val ? 'var(--primary)' : 'var(--border)'
                                  }}
                                  value={val}
                                  onChange={(e) => {
                                    const newDrivers = [...currentDrivers];
                                    while (newDrivers.length <= idx) newDrivers.push('');
                                    newDrivers[idx] = e.target.value;
                                    handleQuickDriverAssign(b.id, newDrivers.join(','));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Unassigned</option>
                                  {(drivers || []).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                                {selectedDriverObj && (
                                  <a 
                                    href={getWhatsAppDriverLink(b, selectedDriverObj)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ display: 'inline-flex', alignItems: 'center', color: '#128c7e' }}
                                    title={`Send Tour Details (Car ${idx+1}) to Driver ${selectedDriverObj.name}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ color: '#25D366' }}>
                                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.028L2 22l5.13-1.346a9.924 9.924 0 004.881 1.279h.005c5.505 0 9.99-4.478 9.99-9.984A9.972 9.972 0 0012.012 2zm5.72 13.916c-.244.686-1.42 1.262-1.94 1.32-.478.054-.93.268-3.03-.556-2.673-1.05-4.382-3.77-4.516-3.95-.133-.178-1.077-1.432-1.077-2.732 0-1.3.687-1.943.93-2.203.245-.26.543-.325.723-.325.18 0 .36 0 .518.008.167.008.39-.062.61.472.223.543.766 1.868.832 2 .067.133.111.288.022.464-.088.178-.133.288-.266.443-.133.155-.28.344-.4.488-.133.155-.277.324-.12.59.155.267.69 1.13 1.484 1.834.996.883 1.832 1.156 2.09 1.284.26.13.41.11.564-.067.155-.177.664-.775.843-1.038.178-.265.355-.222.597-.133.245.088 1.55.73 1.816.863.267.13.443.197.51.31.066.11.066.64-.178 1.326z"/>
                                    </svg>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                        onClick={() => handleDuplicateClick(b)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', color: 'var(--primary)' }}
                        title="Duplicate Booking"
                      >
                        <Copy size={14} />
                      </button>
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
            <div className="modal-profile-header">
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

              <div className="modal-stat-box" style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9' }}>
                <span>TOUR STATUS</span>
                <strong style={{ 
                  textTransform: 'capitalize', 
                  color: viewingBooking.status === 'completed' ? '#059669' : (viewingBooking.status === 'cancelled' ? '#ef4444' : '#1d4ed8') 
                }}>
                  {viewingBooking.status || 'Confirmed'}
                </strong>
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
                      {(viewingBooking.driverId || '').split(',').map(id => (drivers || []).find(d => d.id === id)?.name).filter(Boolean).join(' / ') || 'Unassigned'}
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

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PAYMENT OPTION</span>
                    <span className="badge badge-partner" style={{ textTransform: 'capitalize' }}>
                      {viewingBooking.paymentOption || 'Collection'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '11px' }}>PENDING COLLECTION</span>
                    <span style={{ fontWeight: '700', color: (viewingBooking.paymentOption || 'Collection') === 'Collection' ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {(viewingBooking.paymentOption || 'Collection') === 'Collection' ? `${viewingBooking.price} AED` : '0 AED'}
                    </span>
                  </div>

                  {viewingBooking.date < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] && (
                    <div style={{ borderTop: '1px dashed var(--border-light)', marginTop: '12px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Trip Calculated Expenses</span>
                      
                      {/* Camp Cost */}
                      {/* Camp Cost */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Camp Use Cost:</span>
                        <span style={{ fontWeight: '600' }}>
                          {(() => {
                            const campUseVal = getBookingCampUse(viewingBooking, packages);
                            return `${campUseVal} AED`;
                          })()}
                        </span>
                      </div>
                      
                      {/* Drivers Salary & Fuel */}
                      {viewingBooking.driverId && (() => {
                        const driverIds = viewingBooking.driverId.split(',').filter(Boolean);
                        return driverIds.map((drvId, dIdx) => {
                          const driver = (drivers || []).find(d => d.id === drvId);
                          const driverName = driver ? driver.name : 'Unknown Driver';

                          let propSalary = 0;
                          let propFuel = 0;
                          let propMisc = 0;
                          let detailText = '';

                          const loggedExp = (expenses || []).find(e => e.driverId === drvId && e.date === viewingBooking.date);
                          if (loggedExp) {
                            const dayBookings = (bookings || []).filter(b => b.driverId && b.driverId.split(',').includes(drvId) && b.date === viewingBooking.date && b.status !== 'cancelled');
                            const count = dayBookings.length || 1;
                            propSalary = (parseFloat(loggedExp.salary) || 0) / count;
                            propFuel = (parseFloat(loggedExp.carPetrol) || 0) / count;
                            propMisc = (parseFloat(loggedExp.misc) || 0) / count;
                            detailText = `(logged proportional, daily / ${count})`;
                          } else {
                            const allocations = getDriverDayExpenses(drvId, viewingBooking.date, bookings, drivers, packages);
                            const alloc = allocations[viewingBooking.id];
                            if (alloc) {
                              propSalary = alloc.salary;
                              propFuel = alloc.fuel;
                            } else {
                              propSalary = 100;
                              propFuel = 150;
                            }
                            detailText = `(day-based car grouping)`;
                          }

                          return (
                            <div key={drvId} style={{ marginTop: '8px', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', marginBottom: '4px' }}>
                                🚗 Car {dIdx + 1}: {driverName} {detailText}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Driver Salary:</span>
                                <span style={{ fontWeight: '600' }}>{propSalary.toFixed(1)} AED</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Fuel Cost:</span>
                                <span style={{ fontWeight: '600' }}>{propFuel.toFixed(1)} AED</span>
                              </div>
                              {propMisc !== 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Misc Credits/Costs:</span>
                                  <span style={{ fontWeight: '600' }}>{propMisc.toFixed(1)} AED</span>
                                </div>
                              )}
                            </div>
                          );
                        });
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
                  className="form-control whatsapp-preview-textarea" 
                  style={{ fontSize: '11px', flex: 1, resize: 'none', background: 'var(--bg-deep)', border: '1px solid var(--border)', marginBottom: '12px' }} 
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
                    className="btn" 
                    style={{ fontSize: '12px', padding: '8px 12px', textDecoration: 'none', background: '#16a34a', color: '#ffffff', border: 'none', flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', borderRadius: '8px' }}
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
              <div className="form-grid-two-col">
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
                    onChange={(e) => {
                      const newDate = e.target.value;
                      if (formData.tourType === 'self_drive') {
                        const isSummer = getSeasonalIsSummer(newDate);
                        setFormData(prev => ({ 
                          ...prev, 
                          date: newDate,
                          pickupTime: isSummer ? '4:40 PM' : '3:30 PM'
                        }));
                      } else {
                        const isMorning = (formData.packageName || '').toLowerCase().includes('morning');
                        const seasonalTime = getSeasonalPickupTime(newDate, isMorning);
                        setFormData(prev => ({ 
                          ...prev, 
                          date: newDate,
                          pickupTime: seasonalTime
                        }));
                      }
                    }}
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

                {/* Seasonal Off-Peak Rate Indicator & 1-Click Toggle */}
                <div style={{
                  gridColumn: 'span 2',
                  background: (formData.pricingType === 'offpeak' || (formData.couponCode && formData.couponCode.toLowerCase().includes('summer'))) ? 'rgba(5, 150, 105, 0.08)' : '#fdfbf7',
                  border: (formData.pricingType === 'offpeak' || (formData.couponCode && formData.couponCode.toLowerCase().includes('summer'))) ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid #ede6d9',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: (formData.pricingType === 'offpeak') ? '#047857' : 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: (formData.pricingType === 'offpeak') ? '#047857' : 'var(--text-dark)' }}>
                        {formData.pricingType === 'offpeak' 
                          ? `⚡ Off-Peak Season Discount Active (All Packages)` 
                          : `Peak Standard Pricing Active`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {autoApplyOffpeakSetting 
                          ? `Auto-apply coupon is globally active (${offpeakCouponCodeSetting})`
                          : `Toggle to apply seasonal off-peak discounted rate overrides on this booking`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.pricingType === 'offpeak') {
                        handlePricingTypeChange('peak');
                        handleCouponCodeChange('');
                      } else {
                        handlePricingTypeChange('offpeak');
                        handleCouponCodeChange(offpeakCouponCodeSetting);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      background: formData.pricingType === 'offpeak' ? '#ffffff' : '#059669',
                      color: formData.pricingType === 'offpeak' ? 'var(--text-dark)' : '#ffffff',
                      border: formData.pricingType === 'offpeak' ? '1px solid #d1d5db' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {formData.pricingType === 'offpeak' ? 'Switch to Peak (Standard)' : '⚡ Apply Off-Peak Discount'}
                  </button>
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
                  <label>Type of Tour</label>
                  <select 
                    className="form-control"
                    value={formData.tourType || 'pick_drop'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'self_drive') {
                        const isSummer = getSeasonalIsSummer(formData.date);
                        setFormData(prev => ({
                          ...prev,
                          tourType: val,
                          pickupLocation: 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6',
                          roomNo: '',
                          pickupTime: isSummer ? '4:40 PM' : '3:30 PM'
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          tourType: val,
                          pickupLocation: prev.pickupLocation === 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' ? '' : prev.pickupLocation,
                          pickupTime: getSeasonalPickupTime(prev.date, (prev.packageName || '').toLowerCase().includes('morning'))
                        }));
                      }
                    }}
                  >
                    <option value="pick_drop">With Pick/Drop</option>
                    <option value="self_drive">Self Drive</option>
                  </select>
                </div>

                {formData.tourType === 'self_drive' ? (
                  <div className="form-group">
                    <label>Meeting Point</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ background: '#f8f9fa', cursor: 'not-allowed', fontWeight: 'bold' }}
                      value="https://maps.app.goo.gl/jcACpe96sKRcmbVe6"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Area/Hotel Name & Room Number *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Atlantis The Palm, Room 1204"
                      value={formData.pickupLocation}
                      onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>{formData.tourType === 'self_drive' ? 'Arrival Time' : 'Pickup Time Slot'}</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder={formData.tourType === 'self_drive' ? 'e.g. 4:40 PM' : 'e.g. 3:30 PM to 4:00 PM'}
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
                  <label>Total Price (Auto-calculated, AED)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={autoPrice}
                    disabled
                    style={{ background: '#f3f4f6', color: '#543d2b', fontWeight: 'bold', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Discount (AED)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-control"
                    placeholder="0"
                    value={discountInput}
                    onChange={(e) => {
                      const discVal = parseFloat(e.target.value) || 0;
                      setDiscountInput(discVal);
                      setFormData(prev => ({
                        ...prev,
                        price: Math.max(0, autoPrice - discVal)
                      }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Final Price (AED)</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, price: priceVal }));
                      setDiscountInput(Math.max(0, autoPrice - priceVal));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Option</label>
                  <select 
                    className="form-control"
                    value={formData.paymentOption || 'Collection'}
                    onChange={(e) => setFormData({ ...formData, paymentOption: e.target.value })}
                  >
                    <option value="Paid on Viator">Paid on Viator</option>
                    <option value="Paid via stripe">Paid via stripe</option>
                    <option value="Paid to Partner">Paid to Partner</option>
                    <option value="Paid via Payment Link">Paid via Payment Link</option>
                    <option value="Paid via RAK Bank">Paid via RAK Bank</option>
                    <option value="Collection">Collection</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pending Collection (AED)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={(formData.paymentOption || 'Collection') === 'Collection' ? formData.price : 0}
                    disabled
                    style={{ background: '#f3f4f6', color: '#543d2b', fontWeight: 'bold', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Assign Drivers</label>
                  {(() => {
                    const carsCount = Math.ceil((parseInt(formData.pax) || 1) / 6) || 1;
                    const currentDrivers = (formData.driverId || '').split(',');
                    const currentCarPaxStr = (formData.carPax || '').split(',');
                    const totalPax = parseInt(formData.pax) || 1;

                    // Build active car pax counts
                    const activeCarPax = [];
                    let tempRemaining = totalPax;
                    for (let i = 0; i < carsCount; i++) {
                      if (currentCarPaxStr[i] !== undefined && currentCarPaxStr[i] !== '' && !isNaN(parseInt(currentCarPaxStr[i]))) {
                        activeCarPax.push(parseInt(currentCarPaxStr[i]));
                      } else {
                        // Standard sequential allocation
                        const alloc = Math.min(6, tempRemaining);
                        activeCarPax.push(alloc);
                        tempRemaining -= alloc;
                      }
                    }

                    const sumCarPax = activeCarPax.reduce((sum, current) => sum + current, 0);
                    const hasMismatch = sumCarPax !== totalPax;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.from({ length: carsCount }).map((_, idx) => {
                          const val = currentDrivers[idx] || '';
                          const carPaxVal = activeCarPax[idx] || 0;
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', minWidth: '45px' }}>Car {idx + 1}:</span>
                              <select
                                className="form-control"
                                style={{ flex: 1 }}
                                value={val}
                                onChange={(e) => {
                                  const newDrivers = [...currentDrivers];
                                  while (newDrivers.length <= idx) newDrivers.push('');
                                  newDrivers[idx] = e.target.value;
                                  setFormData({ ...formData, driverId: newDrivers.join(',') });
                                }}
                              >
                                <option value="">Unassigned</option>
                                {(drivers || []).map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              {carsCount > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Pax:</span>
                                  <input 
                                    type="number"
                                    min="0"
                                    max={totalPax}
                                    className="form-control"
                                    style={{ width: '60px', padding: '4px', textAlign: 'center' }}
                                    value={carPaxVal}
                                    onChange={(e) => {
                                      const newVal = parseInt(e.target.value) || 0;
                                      const newCarPaxList = [...activeCarPax];
                                      newCarPaxList[idx] = newVal;
                                      setFormData({ ...formData, carPax: newCarPaxList.join(',') });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {carsCount > 1 && hasMismatch && (
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', marginTop: '2px' }}>
                            ⚠️ Sum of car pax ({sumCarPax}) does not match total guests ({totalPax})
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
