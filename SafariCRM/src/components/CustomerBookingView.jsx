import React, { useState, useEffect } from "react";
import { CheckCircle, Check, Send, Percent, Sparkles } from "lucide-react";
import { safariPackages } from "../mockData";

// Addons definition
const ADDONS = [
  { key: "camelRide",          label: "Long Camel Ride",    price: 30, unit: "/person",               icon: "🐫", always: true  },
  { key: "falconPhoto",        label: "Falcon Photography", price: 20, unit: "/person",               icon: "🦅", always: true  },
  { key: "acSeating",          label: "AC Seating Upgrade", price: 25, unit: "/person",               icon: "❄️", always: false, vipOnly: true },
  { key: "sheesha",            label: "Sheesha on Table",   price: 50, unit: "/table (1 per 3 pax)",  icon: "💨", always: true  },
  { key: "professionalPhotos", label: "Professional Photos",price: 20, unit: "/photo (print+digital)",icon: "📸", always: true  },
];

// Lock same-day booking after 3pm UAE (UTC+4)
function getMinDate() {
  const now = new Date();
  const uaeOffset = 4 * 60;
  const uaeMs = now.getTime() + (uaeOffset - now.getTimezoneOffset()) * 60000;
  const uae = new Date(uaeMs);
  if (uae.getUTCHours() >= 15) {
    uae.setUTCDate(uae.getUTCDate() + 1);
  }
  return uae.toISOString().split("T")[0];
}
function getSeasonalIsSummer(dateStr) {
  let month = new Date().getMonth() + 1;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
    }
  }
  return month >= 5 && month <= 10;
}

function getSeasonalPickupTime(dateStr, isMorning) {
  let month = new Date().getMonth() + 1;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      month = parseInt(parts[1], 10);
    }
  }
  const isSummer = month >= 5 && month <= 10;
  if (isMorning) {
    return isSummer ? '7:00 AM' : '8:00 AM';
  } else {
    return isSummer ? '3:30 PM to 4:00 PM' : '2:00 PM to 2:30 PM';
  }
}

const BRAND = "#c9762a";

const inp = {
  width: "100%", padding: "12px 14px", borderRadius: "10px",
  border: "1.5px solid #ede6d9", background: "rgba(255,255,255,0.95)",
  fontSize: "13.5px", color: "#543c2b", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

export default function CustomerBookingView({ bookings, setBookings, partners = [], packages = [], coupons = [], customers = [], setCustomers, settings = [] }) {
  const activePackages = packages.length > 0 ? packages : safariPackages;
  const showCouponsSetting = (settings || []).find(s => s.setting_key === 'show_coupons')?.setting_value !== '0';
  const autoApplyOffpeakSetting = (settings || []).find(s => s.setting_key === 'auto_apply_offpeak_coupon')?.setting_value === '1';
  const offpeakCouponCodeSetting = (settings || []).find(s => s.setting_key === 'offpeak_coupon_code')?.setting_value || 'RoarSummerOffer26';

  // Extract categories dynamically from packages and sort them
  const categoryOrder = {
    "Self Drive Safari": 1,
    "Evening Desert Safari": 2,
    "Morning Desert Safari": 3,
    "Dune Buggy Ride": 4,
    "City Tours": 5
  };

  const categoriesList = [...new Set(activePackages.map(p => p.category))].sort((a, b) => {
    const orderA = categoryOrder[a] || 999;
    const orderB = categoryOrder[b] || 999;
    return orderA - orderB;
  });

  const initialCategory = categoriesList[0] || "Evening Desert Safari";
  const initialSubPackages = activePackages
    .filter(p => p.category === initialCategory)
    .sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0));
  const initialSubPkg = initialSubPackages[0] || null;

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    whatsapp: "",
    pickupLocation: "",
    roomNo: "",
    date: getMinDate(),
    pax: 1, // Default to 1 guest as minimum
    categoryKey: initialCategory,
    subPackageId: initialSubPkg ? initialSubPkg.id : "",
    message: "",
    tourType: "pick_drop"
  });

  const [addonQty, setAddonQty] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [tempCouponCode, setTempCouponCode] = useState("");
  const [isCouponUnlocked, setIsCouponUnlocked] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  const getCleanPackageName = (name) => {
    if (!name) return "";
    return name.replace(/\s?\d+\s?AED/gi, "").trim();
  };

  const getFeaturedImage = (categoryKey) => {
    // Parse custom category images from settings
    const categoryImagesSetting = settings.find(s => s.setting_key === 'category_images')?.setting_value;
    let categoryImages = {};
    if (categoryImagesSetting) {
      try {
        categoryImages = JSON.parse(categoryImagesSetting);
      } catch (e) {
        console.error("Failed to parse category images in customer booking view:", e);
      }
    }

    if (categoryImages[categoryKey]) {
      return categoryImages[categoryKey];
    }

    switch (categoryKey) {
      case 'City Tours':
        return '/city_tours.jpg';
      case 'Morning Desert Safari':
        return '/morning_safari.jpg';
      case 'Dune Buggy Ride':
        return '/morning_safari.jpg';
      case 'Self Drive Safari':
        return '/self_drive_safari.jpg';
      case 'Evening Desert Safari':
      default:
        return '/evening_safari.jpg';
    }
  };

  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});


  // Sync sub-package list and active sub-package dynamically, sorted by price ascending
  const subPackagesList = activePackages
    .filter(p => p.category === formData.categoryKey)
    .sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0));
  const selectedPkg = activePackages.find(p => p.id === formData.subPackageId) || subPackagesList[0];

  // AC Seating availability condition: Only available in Evening Desert Safari and Self Drive Safari
  const showAcSeating = formData.categoryKey === "Evening Desert Safari" || formData.categoryKey === "Self Drive Safari";

  const isVip = selectedPkg && (
    selectedPkg.name.toLowerCase().includes("vip") ||
    selectedPkg.name.toLowerCase().includes("private") ||
    selectedPkg.name.toLowerCase().includes("premium")
  );

  const pax = Math.max(1, parseInt(formData.pax) || 1); // Enforce minimum of 1 guest

  const getAddonIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("camel")) return "🐫";
    if (n.includes("falcon")) return "🦅";
    if (n.includes("ac ") || n.includes("air condition")) return "❄️";
    if (n.includes("sheesha") || n.includes("shisha")) return "💨";
    if (n.includes("photo") || n.includes("camera")) return "📸";
    return "✨";
  };

  // Resolve dynamic addons list
  const displayAddons = (selectedPkg && Array.isArray(selectedPkg.addons))
    ? selectedPkg.addons.map(a => ({
        key: a.name,
        label: a.name,
        price: parseFloat(a.price) || 0,
        unit: "/person",
        icon: getAddonIcon(a.name),
        always: true
      }))
    : [];

  const getCouponValidationStatus = (codeVal, pkgId) => {
    if (!codeVal) return { status: 'none', message: '' };
    if (coupons.length === 0) return { status: 'invalid', message: '✗ Invalid coupon code' };

    const cleanCode = codeVal.trim().toLowerCase();
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // Find all coupons with this code
    const matchingCodes = coupons.filter(c => c.code.trim().toLowerCase() === cleanCode);
    if (matchingCodes.length === 0) {
      return { status: 'invalid', message: '✗ Invalid coupon code' };
    }

    // Check if any matching coupon is not expired and is active
    const activeAndNotExpired = matchingCodes.filter(c => {
      if (parseInt(c.isActive) === 0) return false;
      if (c.endDate && todayStr > c.endDate) return false;
      return true;
    });

    if (activeAndNotExpired.length === 0) {
      // Check if it is expired specifically
      const isExpired = matchingCodes.some(c => c.endDate && todayStr > c.endDate);
      if (isExpired) {
        return { status: 'expired', message: '✗ Coupon code expired' };
      }
      return { status: 'inactive', message: '✗ Coupon code is currently inactive' };
    }

    // Check if any matching active coupon matches the selected packageId or is universal
    const selectedPkgObj = activePackages.find(p => p.id === pkgId);
    const isEveningSafari = selectedPkgObj && selectedPkgObj.category === 'Evening Desert Safari';
    const isMorningPrivate = pkgId === 'morning_private';

    const matchesPkg = activeAndNotExpired.find(c => {
      if (c.packageId === pkgId) return true;
      if (c.packageId === 'all_safari' || c.packageId === 'all_packages') return true;
      const isUniversal = c.code.toLowerCase() === 'roarnyofferdxb' || 
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

  // Get only the first active coupon for the promo unlock wall
  const activeCoupons = coupons.filter(c => parseInt(c.isActive) !== 0);
  const promoCoupon = activeCoupons[0];

  // Auto-apply off-peak season coupon if enabled
  useEffect(() => {
    if (autoApplyOffpeakSetting) {
      const targetCoupon = (coupons || []).find(c => 
        parseInt(c.isActive) !== 0 && 
        (c.code.toLowerCase() === offpeakCouponCodeSetting.toLowerCase() || c.packageId === 'all_safari' || c.packageId === 'all_packages')
      ) || promoCoupon;

      if (targetCoupon) {
        setCouponCode(targetCoupon.code);
        setTempCouponCode(targetCoupon.code);
        setIsCouponUnlocked(true);
      }
    }
  }, [autoApplyOffpeakSetting, offpeakCouponCodeSetting, coupons, promoCoupon]);

  const handleUnlockCoupon = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.whatsapp.trim()) {
      alert("Please fill in your Name and WhatsApp number under 'Tour Details' (Column 1) first before unlocking the coupon.");
      return;
    }

    if (!formData.whatsapp.trim().startsWith("+")) {
      alert("WhatsApp number under 'Tour Details' (Column 1) must include a country code starting with '+' (e.g. +971569468126).");
      return;
    }

    if (!leadEmail.trim()) {
      alert("Email address is mandatory.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadEmail.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    const customerLead = {
      id: `cust-${Date.now()}`,
      name: formData.customerName.trim(),
      whatsapp: formData.whatsapp.trim(),
      email: leadEmail.trim()
    };

    try {
      const res = await fetch("api.php?action=save&table=customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerLead)
      });
      const r = await res.json();
      if (r.status !== "success") {
        throw new Error(r.message);
      }

      if (setCustomers && typeof setCustomers === 'function') {
        setCustomers(prev => [customerLead, ...prev]);
      }

      setIsCouponUnlocked(true);
      setCouponCode(promoCoupon.code);
      setTempCouponCode(promoCoupon.code);

      // Autofill customer booking form email!
      setFormData(prev => ({
        ...prev,
        email: leadEmail.trim()
      }));

      alert(`🎉 Coupon "${promoCoupon.code}" unlocked and applied successfully!`);
      setIsUnlockModalOpen(false);
    } catch (err) {
      alert("Failed to unlock coupon: " + (err.message || err));
    }
  };

  const cpnStatus = showCouponsSetting ? getCouponValidationStatus(couponCode, selectedPkg?.id) : { status: 'none', message: '' };
  const activeCpn = cpnStatus.status === 'valid' ? cpnStatus.coupon : null;

  // Price calculations
  let basePrice = 0;
  let carsNeeded = 1;
  if (selectedPkg) {
    const isEveningSafari = selectedPkg.category === 'Evening Desert Safari';
    const isMorningPrivate = selectedPkg.id === 'morning_private';

    let defaultRate = autoApplyOffpeakSetting
      ? (parseFloat(selectedPkg.offpeakRate) || parseFloat(selectedPkg.rate) || 0)
      : ((isEveningSafari || isMorningPrivate)
        ? (parseFloat(selectedPkg.peakRate) || parseFloat(selectedPkg.rate) || 0)
        : (parseFloat(selectedPkg.rate) || 0));

    let rate = defaultRate;
    if (activeCpn) {
      rate = parseFloat(activeCpn.customPrice) || 0;
    }

    if (selectedPkg.type === "flat") {
      carsNeeded = Math.ceil(pax / 6) || 1;
      basePrice = rate * carsNeeded;
    } else {
      basePrice = rate * pax;
    }
  }

  const addonsTotal = displayAddons.reduce((s, a) => {
    return s + (addonQty[a.key] || 0) * a.price;
  }, 0);

  const totalPrice = basePrice + addonsTotal;

  const handleCategoryChange = e => {
    const catVal = e.target.value;
    const list = activePackages
      .filter(p => p.category === catVal)
      .sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0));
    const defaultSubId = list[0] ? list[0].id : "";
    setFormData(prev => ({
      ...prev,
      categoryKey: catVal,
      subPackageId: defaultSubId
    }));
    setAddonQty({});
  };

  const handleSave = async e => {
    e.preventDefault();
    const errors = {};
    if (!formData.customerName || formData.customerName.trim().length < 3) {
      errors.customerName = "Please enter your full name (minimum 3 characters).";
    }
    if (!formData.whatsapp || formData.whatsapp.trim().replace(/[^0-9]/g, '').length < 7) {
      errors.whatsapp = "Please enter a valid WhatsApp number (minimum 7 digits).";
    }
    if (formData.tourType !== 'self_drive' && (!formData.pickupLocation || formData.pickupLocation.trim().length < 4)) {
      errors.pickupLocation = "Please enter a valid pickup hotel or location name.";
    }
    if (!formData.date) {
      errors.date = "Please select a tour date.";
    } else {
      const minD = getMinDate();
      if (formData.date < minD) {
        errors.date = `Tour date cannot be in the past. Please select ${minD.split("-").reverse().join("/")} or later.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const errorMsg = Object.values(errors).join("\n");
      alert("Please fix the following validation errors:\n\n" + errorMsg);
      return;
    }

    setFormErrors({});
    const lines = displayAddons.filter(a => {
      return (addonQty[a.key] || 0) > 0;
    }).map(a => `${a.label} x${addonQty[a.key]} (+AED ${addonQty[a.key] * a.price})`);

    setSubmitting(true);
    
    const refSetting = (settings || []).find(s => s.setting_key === 'last_booking_ref');
    let nextId = refSetting ? parseInt(refSetting.setting_value) + 1 : 1000001;
    
    const numericIds = (bookings || [])
      .map(b => parseInt(b.id))
      .filter(id => !isNaN(id) && id >= 1000000 && id <= 9999999);
    if (numericIds.length > 0) {
      nextId = Math.max(nextId, Math.max(...numericIds) + 1);
    }
    
    fetch(`api.php?action=save_setting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'last_booking_ref', value: String(nextId) })
    }).catch(err => console.error("Failed to update last_booking_ref:", err));

    const ref = String(nextId);
    const booking = {
      id: ref,
      customerName: formData.customerName,
      whatsapp: formData.whatsapp,
      email: formData.email,
      date: formData.date,
      packageName: selectedPkg ? selectedPkg.name : "",
      pickupLocation: formData.tourType === 'self_drive' ? 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' : formData.pickupLocation,
      roomNo: formData.tourType === 'self_drive' ? '' : formData.roomNo,
      pickupTime: formData.tourType === 'self_drive'
        ? (getSeasonalIsSummer(formData.date) ? '4:40 PM' : '3:30 PM')
        : getSeasonalPickupTime(formData.date, selectedPkg?.category === 'Morning Desert Safari' || selectedPkg?.id === 'morning_private'),
      pax: pax,
      price: totalPrice,
      addonName: lines.join(", "),
      addonPrice: addonsTotal,
      partnerId: "website",
      status: "confirmed",
      driverId: "",
      couponCode: activeCpn ? activeCpn.code : (autoApplyOffpeakSetting ? offpeakCouponCodeSetting : ""),
      pricingType: "offpeak",
      tourType: formData.tourType || 'pick_drop',
      paymentOption: "Collection"
    };
    try {
      const res = await fetch("api.php?action=save&table=bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      const r = await res.json();
      if (r.status === "success") {
        setBookings([booking, ...bookings]);
        setSubmitted(booking);
      } else {
        throw new Error(r.message);
      }
    } catch (err) {
      alert("Booking failed: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const waLink = b => {
    if (!b) return "";
    const ref = b.id.replace("book-", "").toUpperCase();
    const isSelfDrive = b.tourType === 'self_drive' || 
                        (b.pickupLocation || '').toLowerCase().trim() === 'self drive' ||
                        (b.pickupLocation || '').toLowerCase().includes('maps.app.goo.gl');
                        
    const pickupOrArrivalLabel = isSelfDrive ? 'Arrival' : 'Pickup';
    const locationLabel = isSelfDrive ? 'Meeting Point' : 'Pickup';
    const locValue = isSelfDrive ? 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' : b.pickupLocation;
    const timeValue = isSelfDrive 
      ? (getSeasonalIsSummer(b.date) ? '4:40 PM' : '3:30 PM')
      : b.pickupTime;
      
    const t = `Hi Roar Adventure Tourism, confirming Ref# ${ref}:\n1. Name: ${b.customerName}\n2. WhatsApp: ${b.whatsapp}\n3. Guests: ${b.pax} pax\n4. Package: ${b.packageName}\n5. Date: ${(b.date||"").split("-").reverse().join("/")}\n6. ${locationLabel}: ${locValue}\n7. ${pickupOrArrivalLabel} Time: ${timeValue}${b.addonName ? `\n8. Addons: ${b.addonName}` : ""}\n${b.addonName ? "9" : "8"}. Total: AED ${b.price} (Pay on Arrival)`;
    return `https://wa.me/971589344077?text=${encodeURIComponent(t)}`;
  };

  /* ── Success Screen ──────────────────────────────────────────────────── */
  if (submitted) {
    const refCode = submitted.id.replace("book-", "").toUpperCase();
    return (
      <div style={{ minHeight: "100vh", background: "#faf6f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#543c2b" }}>
        <div className="glass-card" style={{ maxWidth: "520px", width: "100%", padding: "40px 36px", textAlign: "center", background: "#ffffff", border: "1.5px solid #ede6d9", borderRadius: "16px", boxShadow: "0 10px 30px rgba(84, 60, 43, 0.05)" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={44} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "955", color: "#543c2b", marginBottom: "6px" }}>Booking Received! 🎉</h2>
          <p style={{ color: "#8c7361", fontSize: "14px", marginBottom: "24px" }}>
            Reference: <strong style={{ color: BRAND, fontSize: "16px" }}>{refCode}</strong><br />WhatsApp us to confirm your slot.
          </p>
          <div style={{ background: "#fdfbf7", border: "1px solid #ede6d9", borderRadius: "12px", padding: "18px", textAlign: "left", fontSize: "13px", display: "flex", flexDirection: "column", gap: "9px", marginBottom: "22px" }}>
            {(() => {
              const isSelf = submitted.tourType === 'self_drive' || 
                             (submitted.pickupLocation || '').toLowerCase().trim() === 'self drive' ||
                             (submitted.pickupLocation || '').toLowerCase().includes('maps.app.goo.gl');
                             
              const locationLabel = isSelf ? "📍 Meeting Point" : "📍 Pickup Location";
              const timeLabel = isSelf ? "⏳ Arrival Time" : "⏳ Pickup Time";
              const locValue = isSelf ? 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' : submitted.pickupLocation;
              const timeValue = isSelf 
                ? (getSeasonalIsSummer(submitted.date) ? '4:40 PM' : '3:30 PM')
                : submitted.pickupTime;
              const rows = [
                ["👤 Name", submitted.customerName],
                ["📱 WhatsApp", submitted.whatsapp],
                ["👥 Guests", `${submitted.pax} Pax`],
                ["📅 Date", (submitted.date||"").split("-").reverse().join("/")],
                [locationLabel, locValue],
                [timeLabel, timeValue],
                ...(submitted.addonName ? [["✨ Addons", submitted.addonName]] : []),
                ["💰 Pay on Arrival", `AED ${submitted.price}`]
              ];
              return rows.map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ color: "#8c7361", fontWeight: "700", minWidth: "130px" }}>{l}</span>
                  <span style={{ fontWeight: "800", color: "#543c2b", textAlign: "right" }}>{v}</span>
                </div>
              ));
            })()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href={waLink(submitted)} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#c9762a", color: "#fff", padding: "14px", borderRadius: "12px", textDecoration: "none", fontWeight: "800", fontSize: "15px" }}>
              <Send size={16} /> Confirm on WhatsApp
            </a>
            <button onClick={() => setSubmitted(null)} style={{ background: "transparent", border: "1.5px solid #ede6d9", borderRadius: "12px", padding: "12px", cursor: "pointer", fontWeight: "700", color: "#8c7361", fontSize: "14px", fontFamily: "inherit" }}>
              ← Book Another Safari
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf6f0", color: "#543c2b" }}>
      {/* Outer wrapper */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Simple elegant header */}
        <div style={{ textAlign: "center", marginBottom: "10px", padding: "10px 0" }}>
          <img 
            src="/logo.jpg" 
            alt="Roar Adventure Tourism" 
            style={{ 
              maxHeight: "64px", 
              objectFit: "contain", 
              marginBottom: "8px", 
              borderRadius: "5px", 
              backgroundColor: "#ffffff", 
              padding: "4px",
              boxShadow: "0 2px 8px rgba(84, 60, 43, 0.05)"
            }} 
          />
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#543c2b", margin: "0 0 4px" }}>
            Dubai Desert Safari Booking
          </h1>
          <p style={{ color: "#8c7361", fontSize: "14px", margin: 0 }}>
            Fill out the booking details below to lock your slot. Pay cash directly on pickup.
          </p>
        </div>

        {/* ══ 3-Column Booking area ══════════════════ */}
        <div className="booking-section-3col">
          
          {/* COLUMN 1: Featured Image Showcase */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px", background: "#ffffff", border: "1.5px solid #ede6d9", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1.5px solid #ede6d9", paddingBottom: "6px" }}>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#543c2b" }}>Featured Tour Package</div>
            </div>
            <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #ede6d9" }}>
              <img 
                src={getFeaturedImage(formData.categoryKey)} 
                alt={formData.categoryKey} 
                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} 
              />
            </div>
            <div style={{ fontSize: "12px", color: "#8c7361", lineHeight: "1.4" }}>
              <p style={{ margin: "0 0 8px 0" }}>
                Review the tour highlights and rates directly on our official flyer.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#d4af37" }}>★</span>
                  <span style={{ fontWeight: "700", color: "#543c2b" }}>Top Rated Red Dunes Safari</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#d4af37" }}>★</span>
                  <span style={{ fontWeight: "700", color: "#543c2b" }}>Free Cancellation Up to 24 Hours</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#d4af37" }}>★</span>
                  <span style={{ fontWeight: "700", color: "#543c2b" }}>No Credit Card Required</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Booking Book (Form) */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column", background: "#ffffff", border: "1.5px solid #ede6d9", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", borderBottom: "1.5px solid #ede6d9", paddingBottom: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>1</div>
              <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#543c2b" }}>Tour Details</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              {autoApplyOffpeakSetting && (
                <div style={{
                  background: "rgba(5, 150, 105, 0.08)",
                  border: "1.2px solid rgba(5, 150, 105, 0.25)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#047857",
                  marginBottom: "4px"
                }}>
                  <Percent size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "800" }}>
                      🎉 Off-Peak Season Discount Automatically Applied on All Packages!
                    </div>
                    <div style={{ fontSize: "10.5px", opacity: 0.9 }}>
                      Summer promotion code <strong>{couponCode || offpeakCouponCodeSetting}</strong> applied.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <input style={{ ...inp, borderColor: formErrors.customerName ? "#ef4444" : "#ede6d9" }} placeholder="Full Name *" value={formData.customerName} onChange={e => { setFormData({ ...formData, customerName: e.target.value }); setFormErrors(prev => ({ ...prev, customerName: null })); }} required />
                {formErrors.customerName && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", fontWeight: "bold" }}>{formErrors.customerName}</div>}
              </div>

              <div>
                <input style={{ ...inp, borderColor: formErrors.whatsapp ? "#ef4444" : "#ede6d9" }} placeholder="WhatsApp Number *" value={formData.whatsapp} onChange={e => { setFormData({ ...formData, whatsapp: e.target.value }); setFormErrors(prev => ({ ...prev, whatsapp: null })); }} required />
                {formErrors.whatsapp && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", fontWeight: "bold" }}>{formErrors.whatsapp}</div>}
              </div>

              <div>
                <input style={inp} type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div style={{ marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#8c7361", display: "block", marginBottom: "4px" }}>Type of Tour</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        tourType: 'pick_drop', 
                        pickupLocation: prev.pickupLocation === 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6' ? '' : prev.pickupLocation 
                      }));
                    }}
                    style={{ 
                      flex: 1, 
                      padding: "10px", 
                      borderRadius: "8px", 
                      border: `1.5px solid ${formData.tourType !== 'self_drive' ? BRAND : '#ede6d9'}`, 
                      background: formData.tourType !== 'self_drive' ? '#fdf8f4' : '#fff', 
                      color: formData.tourType !== 'self_drive' ? BRAND : '#543c2b', 
                      fontWeight: "850", 
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    🚗 With Pick/Drop
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        tourType: 'self_drive', 
                        pickupLocation: 'https://maps.app.goo.gl/jcACpe96sKRcmbVe6',
                        roomNo: ''
                      }));
                    }}
                    style={{ 
                      flex: 1, 
                      padding: "10px", 
                      borderRadius: "8px", 
                      border: `1.5px solid ${formData.tourType === 'self_drive' ? BRAND : '#ede6d9'}`, 
                      background: formData.tourType === 'self_drive' ? '#fdf8f4' : '#fff', 
                      color: formData.tourType === 'self_drive' ? BRAND : '#543c2b', 
                      fontWeight: "850", 
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    🏁 Self Drive
                  </button>
                </div>
              </div>

              <div>
                {formData.tourType === 'self_drive' ? (
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "800", color: "#8c7361", display: "block", marginBottom: "4px" }}>Meeting Point</label>
                    <input 
                      style={{ ...inp, background: "#f8f9fa", cursor: "not-allowed", color: "#543c2b", fontWeight: "750" }} 
                      value="https://maps.app.goo.gl/jcACpe96sKRcmbVe6" 
                      readOnly 
                    />
                  </div>
                ) : (
                  <div>
                    <input 
                      style={{ ...inp, borderColor: formErrors.pickupLocation ? "#ef4444" : "#ede6d9" }} 
                      placeholder="Area/Hotel Name & Room Number *" 
                      value={formData.pickupLocation} 
                      onChange={e => { 
                        setFormData({ ...formData, pickupLocation: e.target.value }); 
                        setFormErrors(prev => ({ ...prev, pickupLocation: null })); 
                      }} 
                      required 
                    />
                    {formErrors.pickupLocation && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", fontWeight: "bold" }}>{formErrors.pickupLocation}</div>}
                  </div>
                )}
              </div>

              <div>
                <input 
                  style={{ ...inp, borderColor: formErrors.date ? "#ef4444" : "#ede6d9" }} 
                  type="date" 
                  min={getMinDate()} 
                  value={formData.date} 
                  onChange={e => { setFormData({ ...formData, date: e.target.value }); setFormErrors(prev => ({ ...prev, date: null })); }} 
                  required 
                />
                {formErrors.date && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", fontWeight: "bold" }}>{formErrors.date}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "8px" }}>
                <div>
                  <select style={inp} value={formData.categoryKey} onChange={handleCategoryChange}>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {/* 2-Buttons Guests selector (starts at 2, no input box) */}
                <div style={{ ...inp, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px" }}>
                  <span style={{ fontWeight: "750", color: "#543c2b", fontSize: "13px" }}>Guests: {formData.pax}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, pax: Math.max(1, p.pax - 1) }))}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid #ede6d9", background: "#fff", cursor: "pointer", fontWeight: "900", color: "#ef4444", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, pax: Math.min(50, p.pax + 1) }))}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1.5px solid ${BRAND}`, background: BRAND, cursor: "pointer", fontWeight: "900", color: "#fff", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>
              </div>

              {subPackagesList.length > 0 && (
                <div>
                  <select style={inp} value={formData.subPackageId} onChange={e => setFormData({ ...formData, subPackageId: e.target.value })}>
                    {subPackagesList.map(sp => (
                      <option key={sp.id} value={sp.id}>{getCleanPackageName(sp.name)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <input style={inp} placeholder="Message / Notes (Optional)" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
              </div>
            </div>
          </div>

          {/* COLUMN 3: Add-ons, Coupons, and Price Calculator */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column", background: "#ffffff", border: "1.5px solid #ede6d9", borderRadius: "16px" }}>
            {/* Add-ons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1.5px solid #ede6d9", paddingBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>2</div>
                <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#543c2b" }}>Optional Add-ons</div>
              </div>
              {addonsTotal > 0 && (
                <div style={{ background: BRAND, color: "#fff", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                  +AED {addonsTotal}
                </div>
              )}
            </div>

            <div className="addons-grid-layout" style={{ marginBottom: "14px" }}>
              {displayAddons.map(addon => {
                const qty = addonQty[addon.key] || 0;
                return (
                  <div key={addon.key} className="booking-addon-row" style={{ background: qty > 0 ? "rgba(201,118,42,0.05)" : "#fff", border: qty > 0 ? `1.2px solid rgba(201,118,42,0.35)` : "1.2px solid #ede6d9", display: "flex", flexDirection: "column", padding: "8px", borderRadius: "8px", justifyContent: "space-between", minHeight: "85px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{addon.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="addon-label" style={{ fontSize: "10.5px", fontWeight: "800", color: "#543c2b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {addon.label}
                        </div>
                        <div className="addon-unit" style={{ fontSize: "9px", color: "#8c7361" }}>
                          AED {addon.price}{addon.unit.split(" ")[0]}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #fcf9f2", paddingTop: "5px", marginTop: "4px" }}>
                      <span style={{ fontSize: "9.5px", color: qty > 0 ? BRAND : "#8c7361", fontWeight: "800" }}>
                        {qty > 0 ? `AED ${qty * addon.price}` : "Select"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button type="button" onClick={() => setAddonQty(prev => ({ ...prev, [addon.key]: Math.max(0, (prev[addon.key]||0) - 1) }))}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1px solid #ede6d9", background: "#fff", cursor: "pointer", fontWeight: "900", color: "#ef4444", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ minWidth: "12px", textAlign: "center", fontWeight: "900", fontSize: "11.5px", color: qty > 0 ? BRAND : "#8c7361" }}>{qty}</span>
                        <button type="button" onClick={() => setAddonQty(prev => ({ ...prev, [addon.key]: (prev[addon.key]||0) + 1 }))}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${BRAND}`, background: BRAND, cursor: "pointer", fontWeight: "900", color: "#fff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupons Section */}
            {showCouponsSetting && (
              <div style={{ borderTop: "1.5px solid #ede6d9", paddingTop: "12px", marginBottom: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: "800", color: "#8c7361" }}>Have a Promo Coupon Code?</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      style={{ ...inp, padding: "8px 12px", fontSize: "12.5px", flex: 1 }} 
                      placeholder="Enter promo code" 
                      value={tempCouponCode}
                      onChange={(e) => setTempCouponCode(e.target.value.replace(/\s+/g, ""))}
                    />
                    <button 
                      type="button"
                      onClick={() => setCouponCode(tempCouponCode)}
                      style={{ 
                        background: BRAND, 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: "8px", 
                        padding: "0 16px", 
                        fontSize: "12px", 
                        fontWeight: "800", 
                        cursor: "pointer", 
                        fontFamily: "inherit",
                        transition: "opacity 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 0.9}
                      onMouseLeave={(e) => e.target.style.opacity = 1}
                    >
                      Apply
                    </button>
                  </div>
                  {couponCode && (
                    <div style={{ fontSize: "10.5px", fontWeight: "800", marginTop: "2px", color: cpnStatus.status === 'valid' ? '#16a34a' : '#ef4444' }}>
                      {cpnStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Calculations */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", borderBottom: "1.5px solid #ede6d9", paddingBottom: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>3</div>
              <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#543c2b" }}>Price Breakdown</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              {/* Selected summary display */}
              <div style={{ background: "#fdfbf7", border: "1.5px solid #ede6d9", borderRadius: "10px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "800", color: "#8c7361", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Package Choice</div>
                <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#543c2b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formData.categoryKey}</div>
                <div style={{ fontSize: "11px", color: BRAND, fontWeight: "700", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedPkg ? (
                    activeCpn 
                      ? `${getCleanPackageName(selectedPkg.name)} (Coupon Applied: ${activeCpn.customPrice} AED)` 
                      : getCleanPackageName(selectedPkg.name)
                  ) : "—"}
                </div>
              </div>

              {/* Rate Calculations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", flex: 1, justifyContent: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8c7361" }}>Base Rate:</span>
                  <span style={{ fontWeight: "700", color: "#543c2b", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    {(activeCpn || autoApplyOffpeakSetting) && selectedPkg && (
                      <span style={{ textDecoration: "line-through", color: "#8c7361", fontSize: "11px" }}>
                        AED {selectedPkg.peakRate || selectedPkg.rate}
                      </span>
                    )}
                    <span style={{ color: (activeCpn || autoApplyOffpeakSetting) ? '#047857' : '#543c2b', fontWeight: '800' }}>
                      AED {rate} {selectedPkg?.type === 'flat' ? '/car' : '/person'}
                    </span>
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8c7361" }}>Total Guests:</span>
                  <span style={{ fontWeight: "700", color: "#543c2b" }}>{pax} Pax</span>
                </div>

                {selectedPkg && selectedPkg.type === 'flat' && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8c7361" }}>Cars Required:</span>
                    <span style={{ fontWeight: "700", color: "#543c2b" }}>{carsNeeded} Car{carsNeeded > 1 ? "s" : ""}</span>
                  </div>
                )}

                <div style={{ height: "1px", background: "#ede6d9", margin: "2px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#543c2b", fontWeight: "700" }}>Base Cost:</span>
                  <span style={{ fontWeight: "800", color: "#543c2b" }}>AED {basePrice}</span>
                </div>

                {/* Addons detailed list */}
                <div style={{ overflowY: "auto", maxHeight: "100px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {displayAddons.filter(a => {
                    return (addonQty[a.key] || 0) > 0;
                  }).map(a => (
                    <div key={a.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", paddingLeft: "6px", borderLeft: `2.5px solid ${BRAND}` }}>
                      <span style={{ color: "#8c7361" }}>{a.icon} {a.label} x{addonQty[a.key]}</span>
                      <span style={{ fontWeight: "700", color: BRAND }}>+AED {addonQty[a.key] * a.price}</span>
                    </div>
                  ))}
                </div>

                {addonsTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
                    <span style={{ color: "#8c7361" }}>Add-ons Cost:</span>
                    <span style={{ fontWeight: "700", color: BRAND }}>+AED {addonsTotal}</span>
                  </div>
                )}
              </div>

              {/* Bottom calculations & submit block */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Dynamic Gold/Cream highlighted Total Price Card */}
                <div style={{ background: "rgba(201,118,42,0.08)", border: "1.5px solid rgba(201,118,42,0.25)", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "9px", fontWeight: "800", color: BRAND, textTransform: "uppercase" }}>Total Price</span>
                    <div style={{ fontSize: "8px", color: "#8c7361" }}>Pay Cash on Pickup</div>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: BRAND }}>
                    AED {totalPrice}
                  </div>
                </div>

                {/* Pay on arrival card */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px" }}>💳</span>
                  <div style={{ fontSize: "9.5px", color: "#15803d", fontWeight: "700" }}>
                    Pay directly to driver (Cash in UAE Dirhams)
                  </div>
                </div>

                {/* Confirm button */}
                <form onSubmit={handleSave}>
                  <button type="submit" disabled={submitting}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: submitting ? "#ede6d9" : BRAND, color: "#fff", border: "none", borderRadius: "10px", padding: "11px 14px", fontSize: "13.5px", fontWeight: "900", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : `0 4px 12px rgba(201,118,42,0.3)`, transition: "all 0.2s", fontFamily: "inherit" }}>
                    {submitting ? "Confirming..." : <><Check size={14} /> Confirm Booking — Pay on Arrival</>}
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Coupon Unlock Lead Wall Modal */}
      {isUnlockModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#543c2b' }}>Unlock Coupon Code</h3>
              <button type="button" onClick={() => setIsUnlockModalOpen(false)} className="modal-close" style={{ top: '15px', right: '15px', color: '#8c7361' }}>&times;</button>
            </div>
            
            <form onSubmit={handleUnlockCoupon}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <p style={{ fontSize: '12.5px', color: '#8c7361', margin: 0, lineHeight: 1.4 }}>
                  Enter your email address below to unlock the promo code and automatically apply the discount rate to your booking!
                </p>

                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#543c2b', marginBottom: '4px', display: 'block' }}>Email Address *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    style={inp}
                    placeholder="e.g. john@example.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsUnlockModalOpen(false)} style={{ background: 'transparent', border: '1.5px solid #ede6d9', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: '750', color: '#8c7361', fontSize: '13px', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', fontFamily: 'inherit', boxShadow: `0 4px 12px rgba(201,118,42,0.2)` }}>Unlock & Apply</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="floating-actions-bar">
        <a href="tel:+971589344077" className="floating-action-btn check-avail-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>Check Availability</span>
        </a>
        <a href="https://wa.me/971589344077?text=I%20want%20to%20Book%20Desert%20Safari%20at%20RoarAdventures%2C%20please%20assist%2C%20Thanks" target="_blank" rel="noopener noreferrer" className="floating-action-btn whatsapp-chat-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.468 3.42 1.284 4.884L2 22l5.244-1.26c1.416.768 3.012 1.212 4.768 1.212 5.532 0 10.012-4.48 10.012-10.012C22.024 6.48 17.544 2 12.012 2zm.006 17.172c-1.572 0-3.12-.42-4.488-1.224l-.324-.192-3.324.804.816-3.216-.216-.336c-.888-1.428-1.356-3.096-1.356-4.8 0-4.944 4.02-8.964 8.964-8.964 4.944 0 8.964 4.02 8.964 8.964 0 4.956-4.008 8.964-8.964 8.964zm4.908-6.72c-.276-.132-1.608-.792-1.86-.888-.252-.096-.432-.144-.612.132-.18.276-.696.888-.852 1.068-.156.18-.312.204-.588.072-.276-.132-1.164-.432-2.22-1.368-.816-.732-1.368-1.632-1.524-1.908-.156-.276-.012-.42.12-.552.12-.12.276-.324.408-.48.132-.156.18-.276.264-.456.096-.18.048-.336-.024-.48-.072-.144-.612-1.476-.84-2.016-.216-.528-.444-.456-.612-.456-.156 0-.336-.024-.516-.024-.18 0-.48.072-.732.348-.252.276-.96.936-.96 2.28 0 1.344.984 2.64 1.104 2.808.12.168 1.932 2.952 4.692 4.14 1.548.66 2.196.756 2.988.648.516-.072 1.608-.66 1.836-1.296.228-.636.228-1.188.156-1.296-.072-.108-.264-.168-.54-.3z"/>
          </svg>
          <span>WhatsApp Live Chat</span>
        </a>
      </div>

      <style>{`
        @keyframes fIn { from { opacity:0; transform:scale(1.02); } to { opacity:1; transform:scale(1); } }
        input:focus, select:focus { border-color: #c9762a !important; box-shadow: 0 0 0 3px rgba(201,118,42,0.15) !important; }
        
        .booking-section-3col {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1.15fr;
          gap: 16px;
          align-items: start;
        }

        .addons-grid-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-content: start;
          overflow-y: auto;
        }

        .floating-actions-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 1000;
          width: calc(100% - 40px);
          max-width: 500px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 8px;
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(84, 60, 43, 0.12);
          border: 1.5px solid #ede6d9;
          justify-content: center;
          box-sizing: border-box;
        }

        .floating-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 11px 14px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .check-avail-btn {
          background: #ef4444;
          color: #ffffff;
        }

        .check-avail-btn:hover {
          background: #dc2626;
        }

        .whatsapp-chat-btn {
          background: #25D366;
          color: #ffffff;
        }

        .whatsapp-chat-btn:hover {
          background: #128C7E;
        }

        @media (max-width: 1024px) {
          .booking-section-3col {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .floating-actions-bar {
            bottom: 12px;
          }
          .floating-action-btn {
            font-size: 12px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}