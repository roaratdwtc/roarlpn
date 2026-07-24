import React, { useState, useEffect } from 'react';
import { Award, FileText, Calendar, Percent, Printer, Plus, Trash2, Edit2, Copy, Users, Mail, MapPin, Phone, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { safariPackages } from '../mockData';

export default function PartnersView({ partners, setPartners, bookings, packages = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('profiles'); // profiles, invoices
  const activePackages = packages.length > 0 ? packages : safariPackages;

  // Commission editing states
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState(0);

  // Modal State for Add/Edit Partner
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerFormData, setPartnerFormData] = useState({
    id: '',
    name: '',
    address: '',
    contactPerson: '',
    whatsapp: '',
    email: '',
    commissionRate: 0
  });

  // Package Overrides editing state
  const [selectedPartnerForOverrides, setSelectedPartnerForOverrides] = useState(null);

  // Invoicing states
  const [invoicePartnerId, setInvoicePartnerId] = useState(partners[0]?.id || 'website');
  const [invoicePeriod, setInvoicePeriod] = useState('monthly'); // weekly, monthly, custom
  const [invoiceStartDate, setInvoiceStartDate] = useState('2026-06-01');
  const [invoiceEndDate, setInvoiceEndDate] = useState('2026-06-30');
  const [invoiceData, setInvoiceData] = useState(null);
  const [includeVat, setIncludeVat] = useState(true);

  // Pre-populate date ranges based on invoicePeriod select
  useEffect(() => {
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const today = new Date(todayStr);

    if (invoicePeriod === 'weekly') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      setInvoiceStartDate(sevenDaysAgo.toISOString().split('T')[0]);
      setInvoiceEndDate(todayStr);
    } else if (invoicePeriod === 'monthly') {
      setInvoiceStartDate('2026-06-01');
      setInvoiceEndDate('2026-06-30');
    }
  }, [invoicePeriod]);

  // Auto-generate invoice reactively
  useEffect(() => {
    const partner = partners.find(p => p.id === invoicePartnerId);
    if (!partner) return;

    const filteredBookings = bookings.filter(b => {
      return b.partnerId === invoicePartnerId && b.date >= invoiceStartDate && b.date <= invoiceEndDate;
    });

    const totalGross = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
    const vatAmount = totalGross * 0.05;
    const grossWithVat = totalGross + vatAmount;
    
    const commRate = parseFloat(partner.commissionRate) || 0;
    
    // Sum commission item-by-item based on custom package overrides
    const totalCommission = filteredBookings.reduce((sum, b) => {
      const pkgObj = activePackages.find(p => p.name === b.packageName);
      let rate = commRate;
      if (pkgObj && partner.packages && partner.packages[pkgObj.id] !== undefined) {
        rate = parseFloat(partner.packages[pkgObj.id]);
      }
      return sum + ((parseFloat(b.price) || 0) * rate / 100);
    }, 0);

    const netPayout = grossWithVat - totalCommission;

    setInvoiceData({
      partner,
      startDate: invoiceStartDate,
      endDate: invoiceEndDate,
      bookings: filteredBookings,
      totalGross,
      vatAmount,
      grossWithVat,
      commissionRate: commRate,
      totalCommission,
      netPayout,
      invoiceNumber: `INV-${partner.id.toUpperCase().slice(0, 3)}-8034`,
      issueDate: new Date().toISOString().split('T')[0]
    });
  }, [invoicePartnerId, invoiceStartDate, invoiceEndDate, bookings, partners]);

  // Save Commission Rate directly
  const handleSaveCommission = (id) => {
    setPartners(partners.map(p => p.id === id ? { ...p, commissionRate: parseFloat(editRate) || 0 } : p));
    setEditingId(null);
  };

  const handlePrintInvoice = () => {
    if (!invoiceData) return;
    const originalTitle = document.title;
    
    // Clean partner name to letters and numbers only
    const partnerNameClean = (invoiceData.partner.name || 'Partner')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    // Get month name from billing period end date
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    let monthStr = "Invoice";
    if (invoiceData.endDate) {
      const dateParts = invoiceData.endDate.split('-'); // YYYY-MM-DD
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      monthStr = monthNames[monthIndex] || "Invoice";
    }
    
    // Set document title temporarily so browser saves PDF with this exact filename
    document.title = `${partnerNameClean}${monthStr}Invoice`;
    
    window.print();
    
    // Restore original document title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Add/Edit Partner
  const handleOpenAddModal = () => {
    setEditingPartner(null);
    setPartnerFormData({
      id: '',
      name: '',
      address: '',
      contactPerson: '',
      whatsapp: '',
      email: '',
      commissionRate: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner) => {
    setEditingPartner(partner);
    setPartnerFormData({
      id: partner.id,
      name: partner.name,
      address: partner.address || '',
      contactPerson: partner.contactPerson || '',
      whatsapp: partner.whatsapp || '',
      email: partner.email || '',
      commissionRate: partner.commissionRate || 0
    });
    setIsModalOpen(true);
  };

  const handleSavePartner = (e) => {
    e.preventDefault();
    if (!partnerFormData.name) {
      alert('Company Name is required.');
      return;
    }

    const finalId = partnerFormData.id ? partnerFormData.id.toLowerCase().trim().replace(/\s+/g, '-') : `partner-${Date.now()}`;

    if (editingPartner) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { 
        ...p, 
        ...partnerFormData, 
        id: finalId,
        packages: p.packages || {}
      } : p));
    } else {
      const newPartner = {
        ...partnerFormData,
        id: finalId,
        packages: {}
      };
      setPartners([...partners, newPartner]);
    }
    setIsModalOpen(false);
  };

  const handleDeletePartner = (id) => {
    if (id === 'website') {
      alert('The default Website channel cannot be deleted.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this partner? Associated booking commission calculations will fallback to default values.')) {
      setPartners(partners.filter(p => p.id !== id));
      if (selectedPartnerForOverrides?.id === id) {
        setSelectedPartnerForOverrides(null);
      }
    }
  };

  const handleClonePartner = (partner) => {
    const suffix = Math.floor(Math.random() * 1000);
    const cloned = {
      ...partner,
      id: `partner-cloned-${Date.now()}`,
      name: `${partner.name} (Copy ${suffix})`,
      packages: partner.packages ? { ...partner.packages } : {}
    };
    setPartners([...partners, cloned]);
  };

  const handleUpdateOverride = (packageId, rate) => {
    if (!selectedPartnerForOverrides) return;
    const currentPackages = selectedPartnerForOverrides.packages || {};
    const updatedPackages = { ...currentPackages };

    if (rate === '') {
      delete updatedPackages[packageId];
    } else {
      updatedPackages[packageId] = parseFloat(rate) || 0;
    }

    const updatedPartner = {
      ...selectedPartnerForOverrides,
      packages: updatedPackages
    };

    setPartners(partners.map(p => p.id === selectedPartnerForOverrides.id ? updatedPartner : p));
    setSelectedPartnerForOverrides(updatedPartner);
  };

  return (
    <div>
      {/* Sub Tabs Toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveSubTab('profiles')} 
          className={`btn ${activeSubTab === 'profiles' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px', gap: '6px' }}
        >
          <Users size={14} /> Partner Profiles & Packages Setup
        </button>
        <button 
          onClick={() => setActiveSubTab('invoices')} 
          className={`btn ${activeSubTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px', gap: '6px' }}
        >
          <FileText size={14} /> Invoices & Statement Manager
        </button>
      </div>

      {activeSubTab === 'profiles' && (
        <div className={selectedPartnerForOverrides ? "responsive-grid-split has-sidebar" : "responsive-grid-split"}>
          {/* Left Panel: Partners List */}
          <div className="panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="panel-title" style={{ margin: 0 }}>
                <span>Partner Channels Profiles</span>
                <Users size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ fontSize: '12.5px', padding: '6px 14px', gap: '4px' }}>
                <Plus size={14} /> Add Partner
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {partners.map(p => {
                const isSelected = selectedPartnerForOverrides?.id === p.id;
                const overridesCount = Object.keys(p.packages || {}).length;

                return (
                  <div key={p.id} style={{ 
                    padding: '16px',
                    background: isSelected ? 'rgba(140,91,48,0.04)' : 'var(--bg-input)',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>{p.name}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} /> {p.email || 'No email'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {p.whatsapp || 'No WhatsApp'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} /> Contact: {p.contactPerson || 'N/A'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {p.address || 'No address registered'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>DEFAULT COMMISSION</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', margin: '2px 0' }}>{p.commissionRate}%</div>
                        {overridesCount > 0 && (
                          <span className="badge badge-partner" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                            {overridesCount} package overrides
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Channel Key: <code>{p.id}</code></span>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedPartnerForOverrides(isSelected ? null : p)}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                        >
                          <Settings size={12} /> Packages ({overridesCount})
                        </button>
                        <button 
                          onClick={() => handleClonePartner(p)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                          title="Clone Partner configuration"
                        >
                          <Copy size={12} /> Clone
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(p)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeletePartner(p.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Packages Override Section */}
          {selectedPartnerForOverrides && (
            <div className="panel-card" style={{ alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div className="panel-title" style={{ margin: 0 }}>
                  <span style={{ fontSize: '15px' }}>Custom Package Commissions: {selectedPartnerForOverrides.name}</span>
                </div>
                <button onClick={() => setSelectedPartnerForOverrides(null)} className="modal-close" style={{ position: 'static' }}>&times;</button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                Specify partner-specific commission rates for individual packages here. If left blank, calculations will fallback to the partner's default rate of <strong>{selectedPartnerForOverrides.commissionRate}%</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                {activePackages.map(pkg => {
                  const hasOverride = selectedPartnerForOverrides.packages && selectedPartnerForOverrides.packages[pkg.id] !== undefined;
                  const overrideVal = hasOverride ? selectedPartnerForOverrides.packages[pkg.id] : '';

                  return (
                    <div key={pkg.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 12px', 
                      background: 'var(--bg-input)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>{pkg.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default Rate: {pkg.rate} AED &bull; {pkg.category}</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="number"
                            placeholder={selectedPartnerForOverrides.commissionRate}
                            className="form-control"
                            style={{ width: '80px', padding: '6px 20px 6px 8px', fontSize: '12.5px', textAlign: 'right' }}
                            value={overrideVal}
                            onChange={(e) => handleUpdateOverride(pkg.id, e.target.value)}
                          />
                          <span style={{ position: 'absolute', right: '8px', fontSize: '12.5px', color: 'var(--text-muted)', pointerEvents: 'none' }}>%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'invoices' && (
        <div className="dashboard-split-grid">
          {/* Left Settings Panel */}
          <div>
            <div className="panel-card">
              <div className="panel-title">
                <span>Statement Period Selector</span>
                <Percent size={18} style={{ color: 'var(--primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Select Partner Channel</label>
                  <select 
                    className="form-control"
                    value={invoicePartnerId}
                    onChange={(e) => setInvoicePartnerId(e.target.value)}
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Invoice Type / Period</label>
                  <select 
                    className="form-control"
                    value={invoicePeriod}
                    onChange={(e) => setInvoicePeriod(e.target.value)}
                  >
                    <option value="weekly">Weekly Invoice (7 Days)</option>
                    <option value="monthly">Monthly Invoice (Calendar)</option>
                    <option value="custom">Choose Custom Dates</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={invoiceStartDate} 
                    onChange={(e) => setInvoiceStartDate(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={invoiceEndDate} 
                    onChange={(e) => setInvoiceEndDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Statement Invoice Preview Panel */}
          <div>
            <div className="panel-card">
              <div className="panel-title">
                <span>Invoice Statement Preview</span>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
              </div>

              {invoiceData ? (
                <div id="printable-area-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginBottom: '16px' }} className="no-print">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                      <input 
                        type="checkbox" 
                        checked={includeVat} 
                        onChange={(e) => setIncludeVat(e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      Include VAT (5%)
                    </label>
                    <button onClick={handlePrintInvoice} className="btn btn-secondary" style={{ gap: '6px' }}>
                      <Printer size={14} /> Print Invoice / Save PDF
                    </button>
                  </div>

                  <div className="premium-invoice-container" id="printable-area">
                    <div className="premium-invoice-header">
                      <div className="premium-logo-block">
                        <img src="/logo.jpg" alt="Roar Adventure Tourism" style={{ maxHeight: '55px', display: 'block', marginBottom: '8px' }} />
                        <p style={{ fontWeight: 'bold', margin: '2px 0', color: '#2c2520' }}>Roar Adventure Tourism LLC</p>
                        <p style={{ margin: '1px 0', fontSize: '11.5px', color: '#6b5c50' }}>Dubai World Trade Centre 2, Dubai, UAE</p>
                        <p style={{ margin: '1px 0', fontSize: '11.5px', color: '#6b5c50' }}>TRN: 104650317100003</p>
                        <p style={{ margin: '1px 0', fontSize: '11.5px', color: '#6b5c50' }}>info@roaradventuretourism.com | +971 55 605 4570</p>
                      </div>
                      
                      <div className="premium-invoice-title-block">
                        <h2>TAX INVOICE</h2>
                        <div className="premium-invoice-ref">Invoice No: <strong>{invoiceData.invoiceNumber}</strong></div>
                        
                        <div className="premium-balance-due-card">
                          <span className="label">BALANCE DUE</span>
                          <span className="value">AED {(includeVat ? invoiceData.grossWithVat : invoiceData.totalGross).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="premium-invoice-details">
                      <div className="premium-bill-to">
                        <h4>Billed To:</h4>
                        <strong>{invoiceData.partner.name}</strong>
                        {invoiceData.partner.contactPerson && <p>Attn: {invoiceData.partner.contactPerson}</p>}
                        {invoiceData.partner.email && <p>Email: {invoiceData.partner.email}</p>}
                        {invoiceData.partner.address && <p>Address: {invoiceData.partner.address}</p>}
                      </div>
                      
                      <div className="premium-meta-table">
                        <div>
                          <span className="label">Invoice Date:</span>
                          <span className="val">{invoiceData.issueDate ? invoiceData.issueDate.split('-').reverse().join('/') : ''}</span>
                        </div>
                        <div>
                          <span className="label">Due Date:</span>
                          <span className="val">{invoiceData.endDate ? invoiceData.endDate.split('-').reverse().join('/') : ''}</span>
                        </div>
                        <div>
                          <span className="label">Terms:</span>
                          <span className="val">Due on Receipt</span>
                        </div>
                        <div>
                          <span className="label">Billing Period:</span>
                          <span className="val">{invoiceData.startDate ? invoiceData.startDate.split('-').reverse().join('/') : ''} - {invoiceData.endDate ? invoiceData.endDate.split('-').reverse().join('/') : ''}</span>
                        </div>
                      </div>
                    </div>

                    <table className="premium-invoice-table">
                      <thead>
                        <tr>
                          <th>Service Description</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Pax</th>
                          <th style={{ width: '130px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.bookings.map((b) => {
                          const cost = parseFloat(b.price) || 0;
                          const paxVal = parseInt(b.pax) || 1;

                          const formattedRowDate = b.date ? b.date.split('-').reverse().join('/') : '';
                          const roomInfo = b.roomNo && b.roomNo !== 'N/A' ? ` Rm ${b.roomNo}` : '';
                          const descLine = `${b.customerName} (${formattedRowDate}) - ${b.packageName} - ${b.pickupLocation}${roomInfo}`;

                          return (
                            <tr key={b.id}>
                              <td className="desc-cell">{descLine}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{paxVal}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{cost.toLocaleString()} AED</td>
                            </tr>
                          );
                        })}
                        {invoiceData.bookings.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#a89485' }}>
                              No bookings found in this billing period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="premium-summary-card">
                      <div className="premium-summary-row">
                        <span>Sub Total (Net):</span>
                        <strong>{invoiceData.totalGross.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                      </div>
                      {includeVat && (
                        <div className="premium-summary-row">
                          <span>VAT (5%):</span>
                          <strong>{invoiceData.vatAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })} AED</strong>
                        </div>
                      )}
                      <div className="premium-summary-row total">
                        <span>{includeVat ? 'Total Invoice Amount (Incl. VAT):' : 'Total Invoice Amount (Excl. VAT):'}</span>
                        <strong>AED {(includeVat ? invoiceData.grossWithVat : invoiceData.totalGross).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>

                    <div className="premium-footer-grid">
                      <div className="bank-details-card">
                        <h5>Bank Transfer Details</h5>
                        <div className="bank-row"><span>Account Name:</span><strong>Roar Adventure Tourism LLC</strong></div>
                        <div className="bank-row"><span>Bank Name:</span><strong>RAK BANK (Currency: AED)</strong></div>
                        <div className="bank-row"><span>Account Number:</span><strong>0373211257001</strong></div>
                        <div className="bank-row"><span>IBAN Number:</span><strong>AE170400000373211257001</strong></div>
                      </div>
                      
                      <div className="invoice-notes-card">
                        <h5>Payment Terms</h5>
                        <p>We appreciate your business! Please make bank transfers payable to the details on the left. Payment is due upon receipt of this statement.</p>
                        <div className="signature-area">
                          <p>Authorized Signature</p>
                          <div className="sig-line"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  Select a partner and range to compile invoice statements.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CRUD Partner Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                {editingPartner ? 'Modify Partner Profile' : 'Register New Partner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSavePartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div className="form-group">
                <label>Company / Channel Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  placeholder="e.g. Desert Safari Deals LLC"
                  value={partnerFormData.name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Channel Code / Unique ID</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. desert-safari-deals (auto-generated if empty)"
                  disabled={editingPartner ? true : false}
                  value={partnerFormData.id}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, id: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Representative name"
                    value={partnerFormData.contactPerson}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Contact</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. +97150..."
                    value={partnerFormData.whatsapp}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="finance@partner.com"
                    value={partnerFormData.email}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Default Commission %</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="10"
                      style={{ paddingRight: '20px' }}
                      value={partnerFormData.commissionRate}
                      onChange={(e) => setPartnerFormData({ ...partnerFormData, commissionRate: parseFloat(e.target.value) || 0 })}
                    />
                    <span style={{ position: 'absolute', right: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Physical Address / Office</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Street address office location"
                  style={{ resize: 'none' }}
                  value={partnerFormData.address}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, address: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPartner ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
