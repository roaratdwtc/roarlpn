import React, { useState } from "react";
import { CheckCircle, Check, Send } from "lucide-react";
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

const BRAND = "#c9762a";

const inp = {
  width: "100%", padding: "12px 14px", borderRadius: "10px",
  border: "1.5px solid #dde3ed", background: "rgba(255,255,255,0.95)",
  fontSize: "13.5px", color: "#1e293b", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

export default function CustomerBookingView({ bookings, setBookings, partners = [], packages = [], coupons = [], customers = [], setCustomers, settings = [] }) {
  const activePackages = packages.length > 0 ? packages : safariPackages;
  const showCouponsSetting = settings.find(s => s.setting_key === 'show_coupons')?.setting_value !== '0';

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
    date: "",
    pax: 1, // Default to 1 guest as minimum
    categoryKey: initialCategory,
    subPackageId: initialSubPkg ? initialSubPkg.id : "",
    message: "",
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

  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // Resolve dynamic addons list
  const displayAddons = (selectedPkg?.addons && selectedPkg.addons.length > 0)
    ? selectedPkg.addons.map(a => ({
        key: a.name,
        label: a.name,
        price: parseFloat(a.price) || 0,
        unit: "/person",
        icon: "✨",
        always: true
      }))
    : ADDONS.filter(a => {
        if (a.key === "acSeating" && !showAcSeating) return false;
        return a.always || isVip;
      });

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
      if (c.packageId === 'all_safari' && (isEveningSafari || isMorningPrivate)) return true;
      return false;
    });

    if (!matchesPkg) {
      return { status: 'wrong_package', message: '✗ Coupon code not valid for this package' };
    }

    if (matchesPkg.packageId === 'all_safari' && selectedPkgObj) {
      const offpeakRate = parseFloat(selectedPkgObj.offpeakRate) || parseFloat(selectedPkgObj.rate) || 0;
      return {
        status: 'valid',
        message: `✓ Coupon Applied: AED ${offpeakRate} package price override`,
        coupon: { ...matchesPkg, customPrice: offpeakRate }
      };
    }

    return { status: 'valid', message: `✓ Coupon Applied: AED ${matchesPkg.customPrice} package price override`, coupon: matchesPkg };
  };

  // Get only the first active coupon for the promo unlock wall
  const activeCoupons = coupons.filter(c => parseInt(c.isActive) !== 0);
  const promoCoupon = activeCoupons[0];

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

    let defaultRate = (isEveningSafari || isMorningPrivate)
      ? (parseFloat(selectedPkg.peakRate) || parseFloat(selectedPkg.rate) || 0)
      : (parseFloat(selectedPkg.rate) || 0);

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
    if (!formData.customerName || !formData.date || !formData.whatsapp || !formData.pickupLocation) {
      alert("Please fill in Name, WhatsApp, Date, and Pickup Location.");
      return;
    }
    const lines = displayAddons.filter(a => {
      return (addonQty[a.key] || 0) > 0;
    }).map(a => `${a.label} x${addonQty[a.key]} (+AED ${addonQty[a.key] * a.price})`);

    setSubmitting(true);
    const ref = `book-${Date.now()}`;
    const booking = {
      id: ref,
      customerName: formData.customerName,
      whatsapp: formData.whatsapp,
      email: formData.email,
      date: formData.date,
      packageName: selectedPkg ? selectedPkg.name : "",
      pickupLocation: formData.pickupLocation,
      roomNo: formData.roomNo,
      pickupTime: (selectedPkg?.category === 'Morning Desert Safari' || selectedPkg?.id === 'morning_private') ? "9:00 AM to 9:30 AM" : "3:30 PM to 4:00 PM",
      pax: pax,
      price: totalPrice,
      addonName: lines.join(", "),
      addonPrice: addonsTotal,
      partnerId: "website",
      status: "pending",
      driverId: "",
      couponCode: activeCpn ? activeCpn.code : "",
      pricingType: "offpeak"
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
    const ref = b.id.replace("book-", "").toUpperCase() + "ASD";
    const t = `Hi Roar Adventure Tourism, confirming Ref# ${ref}:\n1. Name: ${b.customerName}\n2. WhatsApp: ${b.whatsapp}\n3. Guests: ${b.pax} pax\n4. Package: ${b.packageName}\n5. Date: ${(b.date||"").split("-").reverse().join("/")}\n6. Pickup: ${b.pickupLocation}${b.roomNo ? ` Rm ${b.roomNo}` : ""}${b.addonName ? `\n7. Addons: ${b.addonName}` : ""}\n${b.addonName ? "8" : "7"}. Total: AED ${b.price} (Pay on Arrival)`;
    return `https://wa.me/971589344077?text=${encodeURIComponent(t)}`;
  };

  /* ── Success Screen ──────────────────────────────────────────────────── */
  if (submitted) {
    const refCode = submitted.id.replace("book-", "").toUpperCase() + "ASD";
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="glass-card" style={{ maxWidth: "520px", width: "100%", padding: "40px 36px", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={44} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#1e293b", marginBottom: "6px" }}>Booking Received! 🎉</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
            Reference: <strong style={{ color: BRAND, fontSize: "16px" }}>{refCode}</strong><br />WhatsApp us to confirm your slot.
          </p>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", textAlign: "left", fontSize: "13px", display: "flex", flexDirection: "column", gap: "9px", marginBottom: "22px" }}>
            {[["👤 Name", submitted.customerName], ["📱 WhatsApp", submitted.whatsapp], ["👥 Guests", `${submitted.pax} Pax`], ["📅 Date", (submitted.date||"").split("-").reverse().join("/")], ["📍 Pickup", `${submitted.pickupLocation}${submitted.roomNo ? ` Rm ${submitted.roomNo}` : ""}`], ...(submitted.addonName ? [["✨ Addons", submitted.addonName]] : []), ["💰 Pay on Arrival", `AED ${submitted.price}`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ color: "#64748b", fontWeight: "700", minWidth: "130px" }}>{l}</span>
                <span style={{ fontWeight: "800", color: "#1e293b", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href={waLink(submitted)} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#25D366", color: "#fff", padding: "14px", borderRadius: "12px", textDecoration: "none", fontWeight: "800", fontSize: "15px" }}>
              <Send size={16} /> Confirm on WhatsApp
            </a>
            <button onClick={() => setSubmitted(null)} style={{ background: "transparent", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "12px", cursor: "pointer", fontWeight: "700", color: "#64748b", fontSize: "14px", fontFamily: "inherit" }}>
              ← Book Another Safari
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      {/* Outer wrapper */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* ══ SECTION 1: Hero Info & Clean Badges Grid ════════════════════════ */}
        <div className="glass-card" style={{ padding: "24px" }}>
          {/* Header Texts */}
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <div style={{ display: "inline-block", background: BRAND, color: "#fff", fontSize: "10px", fontWeight: "800", padding: "3.5px 12px", borderRadius: "20px", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>
              #1 Rated Dubai Desert Safari
            </div>
            <h1 style={{ fontSize: "clamp(22px,3.8vw,32px)", fontWeight: "900", color: "#1e293b", margin: "0 0 6px", lineHeight: 1.2 }}>
              Book Your Dubai Desert Adventure
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "800px", margin: "0 auto", lineHeight: 1.5 }}>
              Experience the magic of the golden dunes with Roar Adventure Tourism. Customize your options, get instant pricing, and secure your booking. Fill the form to lock your vehicle and pay cash directly to the driver upon hotel pickup.
            </p>
          </div>

          {/* Combined Clean grid (Desktop: 6 columns, Mobile: 2 columns) */}
          <div className="hero-badges-grid">
            {[
              ["🏆", "Top Rated", "5-Star reviews on Google Maps"],
              ["🔒", "Secure Payment", "No advance required. Pay on pickup"],
              ["📞", "24/7 Support", "Live updates from WhatsApp agents"],
              ["🎯", "Instant Confirm", "Slot & driver details locked instantly"],
              ["✅", "Free Cancel", "No charges if cancelled before 24h"],
              ["💳", "No Card Needed", "Pay cash directly to our driver"]
            ].map(([icon, title, sub]) => (
              <div key={title} className="glass-card badge-item-card">
                <div style={{ fontSize: "20px", marginBottom: "3px" }}>{icon}</div>
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b", marginBottom: "2px" }}>{title}</div>
                <div style={{ fontSize: "9.5px", color: "#64748b", lineHeight: 1.3 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 2: Interactive 3-Column Booking area ══════════════════ */}
        <div className="booking-section-3col">
          
          {/* COLUMN 1: Booking Form Card */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>1</div>
              <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#1e293b" }}>Tour Details</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <div>
                <input style={inp} placeholder="Full Name *" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
              </div>

              <div>
                <input style={inp} placeholder="WhatsApp Number *" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} required />
              </div>

              <div>
                <input style={inp} type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div>
                <input style={inp} placeholder="Pickup Location / Hotel Name *" value={formData.pickupLocation} onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <input style={inp} type="date" min={getMinDate()} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div>
                  <input style={inp} placeholder="Room No (Optional)" value={formData.roomNo} onChange={e => setFormData({ ...formData, roomNo: e.target.value })} />
                </div>
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
                  <span style={{ fontWeight: "750", color: "#1e293b", fontSize: "13px" }}>Guests: {formData.pax}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, pax: Math.max(1, p.pax - 1) }))}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "900", color: "#ef4444", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, pax: Math.min(50, p.pax + 1) }))}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1px solid ${BRAND}`, background: BRAND, cursor: "pointer", fontWeight: "900", color: "#fff", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
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

          {/* COLUMN 2: Optional Add-ons Card (2-Column cards forced strictly on ALL screens) */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>2</div>
                <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#1e293b" }}>Optional Add-ons</div>
              </div>
              {addonsTotal > 0 && (
                <div style={{ background: BRAND, color: "#fff", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                  +AED {addonsTotal}
                </div>
              )}
            </div>

            <div className="addons-grid-layout">
              {displayAddons.map(addon => {
                const qty = addonQty[addon.key] || 0;
                return (
                  <div key={addon.key} className="booking-addon-row" style={{ background: qty > 0 ? "rgba(201,118,42,0.05)" : "#fff", border: qty > 0 ? `1.2px solid rgba(201,118,42,0.35)` : "1.2px solid #e2e8f0", display: "flex", flexDirection: "column", padding: "8px", borderRadius: "8px", justifyContent: "space-between", minHeight: "85px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{addon.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="addon-label" style={{ fontSize: "10.5px", fontWeight: "800", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {addon.label}
                        </div>
                        <div className="addon-unit" style={{ fontSize: "9px", color: "#94a3b8" }}>
                          AED {addon.price}{addon.unit.split(" ")[0]}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "5px", marginTop: "4px" }}>
                      <span style={{ fontSize: "9.5px", color: qty > 0 ? BRAND : "#94a3b8", fontWeight: "800" }}>
                        {qty > 0 ? `AED ${qty * addon.price}` : "Select"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button type="button" onClick={() => setAddonQty(prev => ({ ...prev, [addon.key]: Math.max(0, (prev[addon.key]||0) - 1) }))}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "900", color: "#ef4444", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ minWidth: "12px", textAlign: "center", fontWeight: "900", fontSize: "11.5px", color: qty > 0 ? BRAND : "#94a3b8" }}>{qty}</span>
                        <button type="button" onClick={() => setAddonQty(prev => ({ ...prev, [addon.key]: (prev[addon.key]||0) + 1 }))}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${BRAND}`, background: BRAND, cursor: "pointer", fontWeight: "900", color: "#fff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isVip && (
              <div style={{ fontSize: "9.5px", color: "#94a3b8", fontStyle: "italic", paddingTop: "6px", textAlign: "center", borderTop: "1px dashed #e2e8f0", marginTop: "6px" }}>
                ❄️ AC seating upgrade active with VIP/Private tours only
              </div>
            )}

            {showCouponsSetting && promoCoupon && (
              <div style={{ marginTop: "14px", borderTop: "1.5px solid #e2e8f0", paddingTop: "14px" }}>
                <div style={{ background: "rgba(201,118,42,0.04)", border: "1px dashed #c9762a", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", textAlign: "center" }}>
                  <span style={{ fontSize: "18px" }}>🎁</span>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>Special Promo Discount Available!</div>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Unlock a custom price override for your desert safari adventure.</p>
                  
                  {isCouponUnlocked ? (
                    <div style={{ background: "#fff", border: "1px solid rgba(22, 163, 74, 0.2)", borderRadius: "6px", padding: "6px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "9px", color: "#16a34a", fontWeight: "800", textTransform: "uppercase" }}>Your Coupon Code</span>
                      <strong style={{ fontFamily: "monospace", fontSize: "15px", color: "#c9762a" }}>{promoCoupon.code}</strong>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsUnlockModalOpen(true)}
                      style={{ background: "#c9762a", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}
                    >
                      Unlock Coupon Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: Price Calculations & Confirm Card */}
          <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", fontSize: "11px" }}>3</div>
              <div style={{ fontSize: "13.5px", fontWeight: "900", color: "#1e293b" }}>Price Breakdown</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              {/* Selected summary display */}
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Package Choice</div>
                <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formData.categoryKey}</div>
                <div style={{ fontSize: "11px", color: BRAND, fontWeight: "700", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedPkg ? (
                    activeCpn 
                      ? `${getCleanPackageName(selectedPkg.name)} (Coupon Applied: ${activeCpn.customPrice} AED)` 
                      : getCleanPackageName(selectedPkg.name)
                  ) : "—"}
                </div>
              </div>

              {showCouponsSetting && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: "800", color: "#64748b" }}>Have a Promo Coupon Code?</label>
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
              )}

              {/* Rate Calculations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", flex: 1, justifyContent: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b" }}>Base Rate:</span>
                  <span style={{ fontWeight: "700", color: "#1e293b", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    {activeCpn && (
                      <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "11px" }}>
                        AED {selectedPkg && (selectedPkg.category === 'Evening Desert Safari' || selectedPkg.id === 'morning_private') ? selectedPkg.peakRate : selectedPkg?.rate}
                      </span>
                    )}
                    <span>
                      AED {activeCpn ? activeCpn.customPrice : (selectedPkg ? ((selectedPkg.category === 'Evening Desert Safari' || selectedPkg.id === 'morning_private') ? selectedPkg.peakRate : selectedPkg.rate) : "—")} {selectedPkg?.type === 'flat' ? '/car' : '/person'}
                    </span>
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Guests:</span>
                  <span style={{ fontWeight: "700", color: "#1e293b" }}>{pax} Pax</span>
                </div>

                {selectedPkg && selectedPkg.type === 'flat' && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Cars Required:</span>
                    <span style={{ fontWeight: "700", color: "#1e293b" }}>{carsNeeded} Car{carsNeeded > 1 ? "s" : ""}</span>
                  </div>
                )}

                <div style={{ height: "1px", background: "#e2e8f0", margin: "2px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "700" }}>Base Cost:</span>
                  <span style={{ fontWeight: "800", color: "#1e293b" }}>AED {basePrice}</span>
                </div>

                {/* Addons detailed list */}
                <div style={{ overflowY: "auto", maxHeight: "100px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {displayAddons.filter(a => {
                    return (addonQty[a.key] || 0) > 0;
                  }).map(a => (
                    <div key={a.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", paddingLeft: "6px", borderLeft: `2.5px solid ${BRAND}` }}>
                      <span style={{ color: "#64748b" }}>{a.icon} {a.label} x{addonQty[a.key]}</span>
                      <span style={{ fontWeight: "700", color: BRAND }}>+AED {addonQty[a.key] * a.price}</span>
                    </div>
                  ))}
                </div>

                {addonsTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
                    <span style={{ color: "#64748b" }}>Add-ons Cost:</span>
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
                    <div style={{ fontSize: "8px", color: "#64748b" }}>Pay Cash on Pickup</div>
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
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: submitting ? "#94a3b8" : BRAND, color: "#fff", border: "none", borderRadius: "10px", padding: "11px 14px", fontSize: "13.5px", fontWeight: "900", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : `0 4px 12px rgba(201,118,42,0.3)`, transition: "all 0.2s", fontFamily: "inherit" }}>
                    {submitting ? "Confirming..." : <><Check size={14} /> Confirm Booking — Pay on Arrival</>}
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/971589344077?text=Hi%20Roar%20Adventure%20Tourism%2C%20I%20need%20help%20booking." target="_blank" rel="noopener noreferrer" className="floating-wa">
        <Send size={14} /> <span className="wa-text">Chat with Us</span>
      </a>

      {/* Coupon Unlock Lead Wall Modal */}
      {isUnlockModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', borderRadius: '16px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Unlock Coupon Code</h3>
              <button type="button" onClick={() => setIsUnlockModalOpen(false)} className="modal-close" style={{ top: '15px', right: '15px' }}>&times;</button>
            </div>
            
            <form onSubmit={handleUnlockCoupon}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Enter your email address below to unlock the promo code and automatically apply the discount rate to your booking!
                </p>

                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px', display: 'block' }}>Email Address *</label>
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
                  <button type="button" onClick={() => setIsUnlockModalOpen(false)} style={{ background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: '750', color: '#64748b', fontSize: '13px', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" style={{ background: BRAND, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', fontFamily: 'inherit', boxShadow: `0 4px 12px rgba(201,118,42,0.2)` }}>Unlock & Apply</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fIn { from { opacity:0; transform:scale(1.02); } to { opacity:1; transform:scale(1); } }
        input:focus, select:focus { border-color: #c9762a !important; box-shadow: 0 0 0 3px rgba(201,118,42,0.15) !important; }
        
        .hero-badges-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .badge-item-card {
          padding: 12px 10px;
          text-align: center;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .booking-section-3col {
          display: grid;
          grid-template-columns: 1fr 1.25fr 1fr;
          gap: 16px;
          align-items: stretch;
        }

        .addons-grid-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-content: start;
          overflow-y: auto;
        }

        @media (max-width: 1024px) {
          .booking-section-3col {
            grid-template-columns: 1fr !important;
          }
          .hero-badges-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .hero-badges-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}