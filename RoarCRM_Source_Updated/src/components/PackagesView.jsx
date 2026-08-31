import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Compass, Layers, Percent, BadgeAlert } from 'lucide-react';

export default function PackagesView({ packages = [], setPackages, coupons = [], setCoupons, settings = [], onSaveSetting }) {
  const [activeSubTab, setActiveSubTab] = useState('packages'); // 'packages' or 'coupons'
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isCpnModalOpen, setIsCpnModalOpen] = useState(false);

  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgFormData, setPkgFormData] = useState({
    name: '',
    category: 'Evening Desert Safari',
    rate: 0,
    peakRate: 0,
    offpeakRate: 0,
    type: 'per_person',
    campUse: 0,
    quadbikeExpense: 0,
    addons: []
  });

  const [editingCpn, setEditingCpn] = useState(null);
  const [cpnFormData, setCpnFormData] = useState({
    code: '',
    packageId: '',
    customPrice: 0,
    isActive: 1,
    startDate: '',
    endDate: ''
  });

  // Package categories - initialized dynamically with defaults and database settings
  const [newCatInput, setNewCatInput] = useState('');
  const [categoriesList, setCategoriesList] = useState(() => {
    const defaults = [
      'Morning Desert Safari',
      'Evening Desert Safari',
      'Self Drive Safari',
      'City Tours',
      'Dune Buggy Ride'
    ];
    // Find custom categories from settings
    const savedSetting = settings.find(s => s.setting_key === 'custom_categories')?.setting_value;
    let customs = [];
    if (savedSetting) {
      try {
        customs = JSON.parse(savedSetting);
      } catch (e) {
        console.error("Failed to parse custom categories:", e);
      }
    }
    // Extract unique categories from actual packages
    const pkgCats = packages.map(p => p.category).filter(Boolean);
    // Combine unique
    return [...new Set([...defaults, ...customs, ...pkgCats])];
  });

  const handleAddCategory = () => {
    const cat = newCatInput.trim();
    if (!cat) {
      alert('Please enter a category name.');
      return;
    }
    
    if (categoriesList.includes(cat)) {
      alert(`Category "${cat}" already exists.`);
      return;
    }
    
    const updatedList = [...categoriesList, cat];
    setCategoriesList(updatedList);
    
    // Save to settings so it persists in database
    const savedSetting = settings.find(s => s.setting_key === 'custom_categories')?.setting_value;
    let customs = [];
    if (savedSetting) {
      try {
        customs = JSON.parse(savedSetting);
      } catch (e) {}
    }
    const newCustoms = [...new Set([...customs, cat])];
    
    if (onSaveSetting) {
      onSaveSetting('custom_categories', JSON.stringify(newCustoms));
    }
    
    setNewCatInput('');
    alert(`Category "${cat}" added successfully! You can now assign it to packages.`);
  };

  /* ────────────────────────────────────────────────────────────────────────
     PACKAGES ACTIONS
     ──────────────────────────────────────────────────────────────────────── */

  const handleAddPkgClick = () => {
    setEditingPkg(null);
    setPkgFormData({
      name: '',
      category: 'Evening Desert Safari',
      rate: 0,
      peakRate: 0,
      offpeakRate: 0,
      type: 'per_person',
      campUse: 0,
      quadbikeExpense: 0,
      addons: []
    });
    setIsPkgModalOpen(true);
  };

  const handleEditPkgClick = (pkg) => {
    setEditingPkg(pkg);
    setPkgFormData({
      name: pkg.name || '',
      category: pkg.category || 'Evening Desert Safari',
      rate: parseFloat(pkg.rate) || 0,
      peakRate: parseFloat(pkg.peakRate) || parseFloat(pkg.rate) || 0,
      offpeakRate: parseFloat(pkg.offpeakRate) || parseFloat(pkg.rate) || 0,
      type: pkg.type || 'per_person',
      campUse: parseFloat(pkg.campUse) || 0,
      quadbikeExpense: parseFloat(pkg.quadbikeExpense) || 0,
      addons: Array.isArray(pkg.addons) ? [...pkg.addons] : []
    });
    setIsPkgModalOpen(true);
  };

  const handleSavePkg = (e) => {
    e.preventDefault();
    if (!pkgFormData.name) {
      alert('Please enter a Package Name.');
      return;
    }

    const payload = {
      ...pkgFormData,
      rate: parseFloat(pkgFormData.offpeakRate) || 0, // Fallback base rate is offpeakRate
      peakRate: parseFloat(pkgFormData.peakRate) || 0,
      offpeakRate: parseFloat(pkgFormData.offpeakRate) || 0,
      campUse: parseFloat(pkgFormData.campUse) || 0,
      quadbikeExpense: parseFloat(pkgFormData.quadbikeExpense) || 0
    };

    if (editingPkg) {
      // Update
      setPackages(packages.map(p => p.id === editingPkg.id ? { ...p, ...payload } : p));
    } else {
      // Create
      const newPkg = {
        ...payload,
        id: `pkg-${Date.now()}`
      };
      setPackages([...packages, newPkg]);
    }
    setIsPkgModalOpen(false);
  };

  const handleDeletePkg = (id, name) => {
    if (window.confirm(`Are you sure you want to delete the package "${name}"? This might impact existing bookings linked to this package name.`)) {
      setPackages(packages.filter(p => p.id !== id));
      // Clean up orphaned coupons
      setCoupons(coupons.filter(c => c.packageId !== id));
    }
  };

  const handleAddAddon = () => {
    setPkgFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', price: 0 }]
    }));
  };

  const handleRemoveAddon = (index) => {
    setPkgFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const handleAddonFieldChange = (index, field, value) => {
    setPkgFormData(prev => {
      const updated = [...prev.addons];
      updated[index] = {
        ...updated[index],
        [field]: field === 'price' ? (parseFloat(value) || 0) : value
      };
      return { ...prev, addons: updated };
    });
  };

  /* ────────────────────────────────────────────────────────────────────────
     COUPONS ACTIONS
     ──────────────────────────────────────────────────────────────────────── */

  const handleAddCpnClick = () => {
    if (packages.length === 0) {
      alert('Please create at least one package before setting up coupon codes.');
      return;
    }
    setEditingCpn(null);
    setCpnFormData({
      code: '',
      packageId: packages[0]?.id || '',
      customPrice: 0,
      isActive: 1,
      startDate: '',
      endDate: ''
    });
    setIsCpnModalOpen(true);
  };

  const handleEditCpnClick = (cpn) => {
    setEditingCpn(cpn);
    setCpnFormData({
      code: cpn.code || '',
      packageId: cpn.packageId || '',
      customPrice: parseFloat(cpn.customPrice) || 0,
      isActive: parseInt(cpn.isActive) !== 0 ? 1 : 0,
      startDate: cpn.startDate || '',
      endDate: cpn.endDate || ''
    });
    setIsCpnModalOpen(true);
  };

  const handleSaveCpn = (e) => {
    e.preventDefault();
    if (!cpnFormData.code) {
      alert('Please enter a Coupon Code.');
      return;
    }
    if (!cpnFormData.packageId) {
      alert('Please select a target Package.');
      return;
    }

    const payload = {
      ...cpnFormData,
      customPrice: parseFloat(cpnFormData.customPrice) || 0
    };

    // Check duplicate code
    const isDuplicate = coupons.some(c => c.code.toLowerCase() === payload.code.toLowerCase() && (!editingCpn || c.id !== editingCpn.id));
    if (isDuplicate) {
      alert(`The coupon code "${payload.code}" already exists. Please choose a unique code.`);
      return;
    }

    if (editingCpn) {
      // Update
      setCoupons(coupons.map(c => c.id === editingCpn.id ? { ...c, ...payload } : c));
    } else {
      // Create
      const newCpn = {
        ...payload,
        id: `cpn-${Date.now()}`
      };
      setCoupons([...coupons, newCpn]);
    }
    setIsCpnModalOpen(false);
  };

  const handleDeleteCpn = (id, code) => {
    if (window.confirm(`Are you sure you want to delete the coupon code "${code}"?`)) {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub tabs navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', gap: '24px' }}>
        <button 
          onClick={() => setActiveSubTab('packages')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 6px', 
            fontSize: '14.5px', 
            fontWeight: '700', 
            color: activeSubTab === 'packages' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'packages' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Compass size={18} /> Manage Safari Packages
        </button>
        <button 
          onClick={() => setActiveSubTab('coupons')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '12px 6px', 
            fontSize: '14.5px', 
            fontWeight: '700', 
            color: activeSubTab === 'coupons' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'coupons' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Tag size={18} /> Promo Coupon Codes
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
         TAB 1: PACKAGES
         ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'packages' && (
        <div className="panel-card" style={{ padding: '24px' }}>
          <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>Safari Packages Directory</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Configure package peak/offpeak prices, default camp use costs, quadbike costs, and addons.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Add tour category..." 
                  value={newCatInput} 
                  onChange={e => setNewCatInput(e.target.value)} 
                  style={{ width: '180px', height: '38px', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
                />
                <button 
                  type="button" 
                  onClick={handleAddCategory} 
                  className="btn btn-secondary" 
                  style={{ height: '38px', padding: '0 12px', fontSize: '13px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Add Category
                </button>
              </div>
              <button onClick={handleAddPkgClick} className="btn btn-primary" style={{ gap: '8px', height: '38px', display: 'flex', alignItems: 'center' }}>
                <Plus size={16} /> Add New Package
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Peak Rate</th>
                  <th style={{ textAlign: 'right' }}>Off-Peak Rate</th>
                  <th style={{ textAlign: 'right' }}>Camp Use</th>
                  <th style={{ textAlign: 'right' }}>Quadbike Exp</th>
                  <th style={{ textAlign: 'center' }}>Addons</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No packages found. Create one to begin.
                    </td>
                  </tr>
                ) : (
                  packages.map(pkg => (
                    <tr key={pkg.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{pkg.name}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(140, 91, 48, 0.08)', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>
                          {pkg.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                          {pkg.type === 'per_person' ? 'Per Person' : 'Flat rate'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#b91c1c' }}>
                        AED {pkg.peakRate}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#047857' }}>
                        AED {pkg.offpeakRate}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        AED {pkg.campUse || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        AED {pkg.quadbikeExpense || 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: 'rgba(0,0,0,0.04)', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: '800' 
                        }}>
                          {(pkg.addons || []).length}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleEditPkgClick(pkg)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', minWidth: 'auto' }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeletePkg(pkg.id, pkg.name)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
         TAB 2: COUPONS
         ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'coupons' && (
        <div className="panel-card" style={{ padding: '24px' }}>
          <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>Promo Coupons Manager</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Define coupon codes that apply specific rates when used on bookings.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {(() => {
                const showCouponsVal = settings.find(s => s.setting_key === 'show_coupons')?.setting_value !== '0';
                return (
                  <button 
                    onClick={() => onSaveSetting && onSaveSetting('show_coupons', showCouponsVal ? '0' : '1')} 
                    className="btn"
                    style={{
                      background: showCouponsVal ? '#16a34a' : '#475569',
                      borderColor: showCouponsVal ? '#16a34a' : '#475569',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: '800',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 0.9}
                    onMouseLeave={(e) => e.target.style.opacity = 1}
                  >
                    {showCouponsVal ? '✓ Show Coupons on Booking Form' : '✗ Hide Coupons (Peak Season)'}
                  </button>
                );
              })()}
              <button onClick={handleAddCpnClick} className="btn btn-primary" style={{ gap: '8px' }}>
                <Plus size={16} /> Add Coupon Code
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Package</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px' }}>Discount Price</th>
                  <th style={{ padding: '12px 16px' }}>Validity</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ textAlign: 'right', width: '100px', padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No coupon codes defined. Create one to apply discounts.
                    </td>
                  </tr>
                ) : (
                  coupons.map(cpn => {
                    const linkedPkg = packages.find(p => p.id === cpn.packageId);
                    const linkedPkgName = cpn.packageId === 'all_safari'
                      ? 'All Evening & Morning Private (Universal)'
                      : (linkedPkg ? linkedPkg.name : 'Deleted Package (Orphaned)');
                    const discountPriceStr = cpn.packageId === 'all_safari'
                      ? 'Off-Peak Rates'
                      : `AED ${cpn.customPrice}`;
                    return (
                      <tr key={cpn.id}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '13.5px', 
                            fontWeight: '800', 
                            background: 'rgba(140, 91, 48, 0.06)', 
                            border: '1px dashed var(--primary)', 
                            color: 'var(--primary)', 
                            padding: '3px 8px', 
                            borderRadius: '5px' 
                          }}>
                            {cpn.code}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--text-dark)', padding: '12px 16px' }}>
                          {linkedPkgName}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--success)', fontSize: '13px', padding: '12px 16px' }}>
                          {discountPriceStr}
                        </td>
                        <td style={{ fontSize: '12px', padding: '12px 16px' }}>
                          {cpn.startDate || cpn.endDate ? (
                            <span>
                              {cpn.startDate ? cpn.startDate.split('-').reverse().join('/') : 'Open'}
                              {' - '}
                              {cpn.endDate ? cpn.endDate.split('-').reverse().join('/') : 'Open'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Always Valid</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: parseInt(cpn.isActive) !== 0 ? 'var(--success-glow)' : 'var(--danger-glow)',
                            color: parseInt(cpn.isActive) !== 0 ? 'var(--success)' : 'var(--danger)',
                            border: parseInt(cpn.isActive) !== 0 ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            {parseInt(cpn.isActive) !== 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleEditCpnClick(cpn)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', minWidth: 'auto' }}
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCpn(cpn.id, cpn.code)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
         MODAL: CREATE / EDIT PACKAGE
         ──────────────────────────────────────────────────────────────────────── */}
      {isPkgModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                {editingPkg ? `Modify Package: ${editingPkg.name}` : 'Create New Safari Package'}
              </h3>
              <button onClick={() => setIsPkgModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSavePkg}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                
                <div className="form-group">
                  <label>Package Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. VIP Safari Private Car 799AED"
                    value={pkgFormData.name}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      className="form-control"
                      value={pkgFormData.category}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, category: e.target.value })}
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price Calculation Type</label>
                    <select 
                      className="form-control"
                      value={pkgFormData.type}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, type: e.target.value })}
                    >
                      <option value="per_person">Per Person Rate</option>
                      <option value="flat">Flat Rate (Per Vehicle / Group)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Peak Price (Standard, AED) *</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      value={pkgFormData.peakRate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, peakRate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Off-Peak Price (Discounted, AED) *</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      value={pkgFormData.offpeakRate}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, offpeakRate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div className="form-group">
                    <label>Camp Use Expense (AED / Person)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      value={pkgFormData.campUse}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, campUse: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quadbike Expense (AED / Bike)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      value={pkgFormData.quadbikeExpense}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, quadbikeExpense: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* ADDONS EDITOR */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-dark)' }}>Package Addons List</label>
                    <button 
                      type="button" 
                      onClick={handleAddAddon} 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '11.5px', gap: '4px' }}
                    >
                      <Plus size={12} /> Add Addon
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {pkgFormData.addons.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.01)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                        No addons configured for this package. Click "Add Addon" to define options.
                      </div>
                    ) : (
                      pkgFormData.addons.map((addon, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ flex: 2, padding: '6px 10px', fontSize: '12.5px' }} 
                            placeholder="Addon Name (e.g. Camel Ride)"
                            value={addon.name}
                            onChange={(e) => handleAddonFieldChange(index, 'name', e.target.value)}
                            required
                          />
                          <input 
                            type="number" 
                            min="0"
                            className="form-control" 
                            style={{ flex: 1, padding: '6px 10px', fontSize: '12.5px', textAlign: 'right' }} 
                            placeholder="Price (AED)"
                            value={addon.price}
                            onChange={(e) => handleAddonFieldChange(index, 'price', e.target.value)}
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAddon(index)} 
                            className="btn btn-secondary"
                            style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)', borderColor: 'transparent' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsPkgModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Package</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
         MODAL: CREATE / EDIT COUPON
         ──────────────────────────────────────────────────────────────────────── */}
      {isCpnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                {editingCpn ? `Modify Coupon Code: ${editingCpn.code}` : 'Create New Coupon'}
              </h3>
              <button onClick={() => setIsCpnModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSaveCpn}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. RoarNYOfferDxb"
                    value={cpnFormData.code}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, code: e.target.value.replace(/\s+/g, '') })}
                    required
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Spaces will be removed automatically.</small>
                </div>

                <div className="form-group">
                  <label>Target Package *</label>
                  <select 
                    className="form-control"
                    value={cpnFormData.packageId}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, packageId: e.target.value })}
                    required
                  >
                    <option value="all_safari">All Evening & Morning Private Safaris (Universal)</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Base: AED {p.offpeakRate})
                      </option>
                    ))}
                  </select>
                </div>

                {cpnFormData.packageId !== 'all_safari' ? (
                  <div className="form-group">
                    <label>Custom Coupon Price (AED) *</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Discounted price, e.g. 799"
                      value={cpnFormData.customPrice}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, customPrice: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                ) : (
                  <div style={{ background: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.2)', padding: '10px', borderRadius: '6px' }}>
                    <label style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '2px' }}>✓ Universal Discount Type</label>
                    <div style={{ fontSize: '11px', color: '#475569' }}>This coupon automatically applies the off-peak rate for any evening safari or morning private tour selected.</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Start Date (Optional)</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={cpnFormData.startDate}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date / Expiry (Optional)</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={cpnFormData.endDate}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Coupon Status</label>
                  <select 
                    className="form-control"
                    value={cpnFormData.isActive}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, isActive: parseInt(e.target.value) })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Disabled / Inactive</option>
                  </select>
                </div>

                <div className="modal-footer" style={{ marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsCpnModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Coupon</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
