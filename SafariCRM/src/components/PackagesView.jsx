import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Compass, Layers, Percent, BadgeAlert, Check, Save, Image, Sparkles, Zap } from 'lucide-react';

export default function PackagesView({ packages = [], setPackages, coupons = [], setCoupons, settings = [], onSaveSetting }) {
  const [activeSubTab, setActiveSubTab] = useState('packages'); // 'packages' or 'coupons'
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isCpnModalOpen, setIsCpnModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState({});


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

  // Category image settings
  const categoryImagesSetting = settings.find(s => s.setting_key === 'category_images')?.setting_value;
  let categoryImages = {};
  if (categoryImagesSetting) {
    try {
      categoryImages = JSON.parse(categoryImagesSetting);
    } catch (e) {
      console.error("Failed to parse category images:", e);
    }
  }

  const handleSaveCategoryImage = async (category, imageUrl) => {
    const updatedImages = { ...categoryImages, [category]: imageUrl };
    if (onSaveSetting) {
      await onSaveSetting('category_images', JSON.stringify(updatedImages));
    }
  };

  const handleUploadCustomImage = (category, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        handleSaveCategoryImage(category, compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetAllCategoryImages = async () => {
    const defaultImages = {
      'Evening Desert Safari': '/evening_safari.jpg',
      'Morning Desert Safari': '/morning_safari.jpg',
      'Self Drive Safari': '/self_drive_safari.jpg',
      'City Tours': '/city_tours.jpg',
      'Dune Buggy Ride': '/morning_safari.jpg'
    };
    if (onSaveSetting) {
      await onSaveSetting('category_images', JSON.stringify(defaultImages));
    }
  };

  const handleUpdateCategory = async (oldName, newName, imageUrl) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName) {
      alert('Category name cannot be empty.');
      return;
    }

    // 1. Update the category name in the custom_categories setting list
    const savedSetting = settings.find(s => s.setting_key === 'custom_categories')?.setting_value;
    let customs = [];
    if (savedSetting) {
      try {
        customs = JSON.parse(savedSetting);
      } catch (e) {}
    }
    
    // Update name in customs
    const updatedCustoms = customs.map(c => c === oldName ? cleanNewName : c);
    if (onSaveSetting) {
      await onSaveSetting('custom_categories', JSON.stringify(updatedCustoms));
    }

    // 2. Update category image mapping
    const updatedImages = { ...categoryImages };
    if (imageUrl) {
      updatedImages[cleanNewName] = imageUrl;
      if (oldName !== cleanNewName) {
        delete updatedImages[oldName];
      }
    } else {
      if (oldName !== cleanNewName && updatedImages[oldName]) {
        updatedImages[cleanNewName] = updatedImages[oldName];
        delete updatedImages[oldName];
      }
    }
    if (onSaveSetting) {
      await onSaveSetting('category_images', JSON.stringify(updatedImages));
    }

    // 3. Update packages that were using the old category name!
    if (oldName !== cleanNewName) {
      const updatedPkgs = packages.map(p => {
        if (p.category === oldName) {
          return { ...p, category: cleanNewName };
        }
        return p;
      });
      if (setPackages) {
        setPackages(updatedPkgs);
      }
    }
    
    // Update local category list state
    setCategoriesList(prev => prev.map(c => c === oldName ? cleanNewName : c));
    alert('Category updated successfully.');
  };

  const handleDeleteCategory = async (catName) => {
    const assignedPkgs = packages.filter(p => p.category === catName);
    if (assignedPkgs.length > 0) {
      alert(`Cannot delete category "${catName}" because it is currently assigned to ${assignedPkgs.length} packages. Please reassign those packages first.`);
      return;
    }
    
    // Remove from custom_categories
    const savedSetting = settings.find(s => s.setting_key === 'custom_categories')?.setting_value;
    let customs = [];
    if (savedSetting) {
      try {
        customs = JSON.parse(savedSetting);
      } catch (e) {}
    }
    const updatedCustoms = customs.filter(c => c !== catName);
    if (onSaveSetting) {
      await onSaveSetting('custom_categories', JSON.stringify(updatedCustoms));
    }

    // Remove from category images
    const updatedImages = { ...categoryImages };
    delete updatedImages[catName];
    if (onSaveSetting) {
      await onSaveSetting('category_images', JSON.stringify(updatedImages));
    }

    // Update state
    setCategoriesList(prev => prev.filter(c => c !== catName));
    alert(`Category "${catName}" deleted successfully.`);
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
         SEASONAL AUTO-APPLY COUPON DISCOUNT CONTROL (ALL PACKAGES)
         ──────────────────────────────────────────────────────────────────────── */}
      {(() => {
        const autoApplyOffpeak = settings.find(s => s.setting_key === 'auto_apply_offpeak_coupon')?.setting_value === '1';
        const selectedOffpeakCode = settings.find(s => s.setting_key === 'offpeak_coupon_code')?.setting_value || (coupons.find(c => c.code.toLowerCase().includes('summer') || c.packageId === 'all_safari')?.code || coupons[0]?.code || 'RoarSummerOffer26');

        return (
          <div 
            className="card"
            style={{
              background: autoApplyOffpeak ? 'rgba(5, 150, 105, 0.05)' : '#ffffff',
              border: autoApplyOffpeak ? '1.5px solid #059669' : '1.5px solid #ede6d9',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(140, 91, 48, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: autoApplyOffpeak ? 'rgba(5, 150, 105, 0.15)' : 'rgba(140, 91, 48, 0.1)',
                color: autoApplyOffpeak ? '#047857' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Percent size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    Auto-Apply Summer End Sale Discount (All Packages)
                  </h4>
                  <span className="badge" style={{
                    background: autoApplyOffpeak ? 'rgba(5, 150, 105, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: autoApplyOffpeak ? '#047857' : '#4b5563',
                    fontWeight: '800',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    {autoApplyOffpeak ? '✓ SUMMER SALE ACTIVE' : '○ DISABLED'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Automatically applies the Summer End Sale discounted coupon code to all packages in Bookings and for online customers.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Coupon:</span>
                <select
                  value={selectedOffpeakCode}
                  onChange={(e) => onSaveSetting && onSaveSetting('offpeak_coupon_code', e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '12.5px', padding: '6px 10px', fontWeight: '800', color: 'var(--primary)', height: '36px' }}
                >
                  {coupons.filter(c => parseInt(c.isActive) !== 0).map(c => (
                    <option key={c.id} value={c.code}>
                      {c.code} ({c.packageId === 'all_safari' ? 'All Packages' : 'Package'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onSaveSetting && onSaveSetting('auto_apply_offpeak_coupon', autoApplyOffpeak ? '0' : '1')}
                className="btn"
                style={{
                  background: autoApplyOffpeak ? '#059669' : '#8c5b30',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  height: '36px',
                  boxShadow: autoApplyOffpeak ? '0 2px 10px rgba(5, 150, 105, 0.3)' : '0 2px 10px rgba(140, 91, 48, 0.2)'
                }}
              >
                {autoApplyOffpeak ? (
                  <>
                    <Check size={16} /> Summer End Sale Discount Applied (All Packages)
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Enable Summer End Sale Discount on All Packages
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })()}

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
              <button 
                onClick={() => setIsCategoryModalOpen(true)} 
                className="btn btn-secondary" 
                style={{ gap: '8px', height: '38px', display: 'flex', alignItems: 'center', fontWeight: '800' }}
              >
                <Compass size={16} /> Manage Categories
              </button>
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
                      ? 'All Packages (Universal Off-Peak Rate)'
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
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Package Name * (e.g. VIP Safari Private Car)"
                    title="Package Name *"
                    value={pkgFormData.name}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <select 
                      className="form-control"
                      title="Package Category *"
                      value={pkgFormData.category}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, category: e.target.value })}
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>Category: {cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select 
                      className="form-control"
                      title="Price Calculation Type"
                      value={pkgFormData.type}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, type: e.target.value })}
                    >
                      <option value="per_person">Rate: Per Person Rate</option>
                      <option value="flat">Rate: Flat Rate (Per Vehicle / Group)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Peak Price Standard (AED) *"
                      title="Peak Price (Standard, AED) *"
                      value={pkgFormData.peakRate || ''}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, peakRate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Off-Peak Price Discounted (AED) *"
                      title="Off-Peak Price (Discounted, AED) *"
                      value={pkgFormData.offpeakRate || ''}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, offpeakRate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div className="form-group">
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Camp Use Expense (AED / Pax)"
                      title="Camp Use Expense (AED / Person)"
                      value={pkgFormData.campUse || ''}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, campUse: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Quadbike Expense (AED / Bike)"
                      title="Quadbike Expense (AED / Bike)"
                      value={pkgFormData.quadbikeExpense || ''}
                      onChange={(e) => setPkgFormData({ ...pkgFormData, quadbikeExpense: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* ADDONS EDITOR */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Package Addons List</span>
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
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Coupon Code * (e.g. RoarSummerOffer26)"
                    title="Coupon Code *"
                    value={cpnFormData.code}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, code: e.target.value.replace(/\s+/g, '') })}
                    required
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Spaces will be removed automatically.</small>
                </div>

                <div className="form-group">
                  <select 
                    className="form-control"
                    title="Target Package *"
                    value={cpnFormData.packageId}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, packageId: e.target.value })}
                    required
                  >
                    <option value="all_safari">Target: All Packages (Universal Off-Peak Rate on Every Package)</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>
                        Target: {p.name} (Base: AED {p.offpeakRate})
                      </option>
                    ))}
                  </select>
                </div>

                {cpnFormData.packageId !== 'all_safari' ? (
                  <div className="form-group">
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      placeholder="Custom Coupon Price (AED) *"
                      title="Custom Coupon Price (AED) *"
                      value={cpnFormData.customPrice || ''}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, customPrice: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                ) : (
                  <div style={{ background: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.2)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>✓ Universal Discount Type</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>This coupon automatically applies the off-peak rate for any evening safari or morning private tour selected.</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <input 
                      type="date" 
                      className="form-control" 
                      title="Start Date (Optional)"
                      value={cpnFormData.startDate}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <input 
                      type="date" 
                      className="form-control" 
                      title="End Date / Expiry (Optional)"
                      value={cpnFormData.endDate}
                      onChange={(e) => setCpnFormData({ ...cpnFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <select 
                    className="form-control"
                    title="Coupon Status"
                    value={cpnFormData.isActive}
                    onChange={(e) => setCpnFormData({ ...cpnFormData, isActive: parseInt(e.target.value) })}
                  >
                    <option value="1">Status: Active</option>
                    <option value="0">Status: Disabled / Inactive</option>
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
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                📁 Manage Package Categories & Flyers
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              
              {/* Creator Section */}
              <div style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: 'var(--primary-dark)' }}>
                  Add New Category
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Category Name * (e.g. Quad & Buggy Safari)" 
                      title="Category Name *"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                      onClick={() => {
                        setNewCatName('');
                      }}
                    >
                      Clear
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ fontSize: '13px', padding: '6px 16px' }}
                      onClick={async () => {
                        const name = newCatName.trim();
                        if (!name) {
                          alert('Please enter a category name.');
                          return;
                        }
                        if (categoriesList.includes(name)) {
                          alert(`Category "${name}" already exists.`);
                          return;
                        }
                        
                        // Add category to list
                        const updatedList = [...categoriesList, name];
                        setCategoriesList(updatedList);
                        
                        // Save in custom_categories setting
                        const savedSetting = settings.find(s => s.setting_key === 'custom_categories')?.setting_value;
                        let customs = [];
                        if (savedSetting) {
                          try {
                            customs = JSON.parse(savedSetting);
                          } catch (e) {}
                        }
                        const newCustoms = [...new Set([...customs, name])];
                        if (onSaveSetting) {
                          await onSaveSetting('custom_categories', JSON.stringify(newCustoms));
                        }
                        
                        setNewCatName('');
                        alert(`Category "${name}" added successfully!`);
                      }}
                    >
                      + Create Category
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Categories Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 0' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-dark)' }}>
                    Active Categories & Flyers Directory
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetAllCategoryImages}
                    style={{
                      padding: '5px 10px',
                      background: '#fcf8f2',
                      border: '1px solid var(--accent-gold, #8c5b30)',
                      borderRadius: '6px',
                      color: 'var(--accent-gold, #8c5b30)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Reset to Default Clean Flyers
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {categoriesList.map(cat => {
                    const standardFlyers = [
                      { label: 'Evening Safari Flyer', path: '/evening_safari.jpg' },
                      { label: 'Morning Safari Flyer', path: '/morning_safari.jpg' },
                      { label: 'Self Drive Safari Flyer', path: '/self_drive_safari.jpg' },
                      { label: 'City Tours Flyer', path: '/city_tours.jpg' }
                    ];

                    const currentImg = categoryImages[cat] || (
                      cat === 'City Tours' ? '/city_tours.jpg' :
                      cat === 'Morning Desert Safari' ? '/morning_safari.jpg' :
                      cat === 'Dune Buggy Ride' ? '/morning_safari.jpg' :
                      cat === 'Self Drive Safari' ? '/self_drive_safari.jpg' :
                      '/evening_safari.jpg'
                    );

                    const isCustom = !standardFlyers.some(f => f.path === currentImg);
                    const isSeeded = [
                      'Morning Desert Safari',
                      'Evening Desert Safari',
                      'Self Drive Safari',
                      'City Tours',
                      'Dune Buggy Ride'
                    ].includes(cat);

                    const localEditName = editingCategoryName[cat] !== undefined ? editingCategoryName[cat] : cat;

                    return (
                      <div key={cat} style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        
                        {/* Thumbnail Preview */}
                        <div style={{ width: '80px', height: '80px', borderRadius: '6px', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfbf7', flexShrink: 0 }}>
                          <img src={currentImg} alt={cat} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>

                        {/* Details and Inputs */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {isSeeded ? (
                              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-dark)' }}>
                                {cat} <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'normal' }}>(Default System)</span>
                              </span>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }}>
                                <input 
                                  type="text" 
                                  className="form-control"
                                  style={{ fontSize: '12px', padding: '4px 8px', height: '28px', flex: 1 }}
                                  value={localEditName}
                                  onChange={(e) => setEditingCategoryName({ ...editingCategoryName, [cat]: e.target.value })}
                                />
                                {localEditName !== cat && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '4px 6px', minWidth: 'auto', background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                                    title="Save Category Name"
                                    onClick={() => handleUpdateCategory(cat, localEditName)}
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <select 
                                className="form-control"
                                style={{ fontSize: '11px', padding: '2px 6px', height: '26px', borderRadius: '6px' }}
                                value={isCustom ? 'custom' : currentImg}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== 'custom') {
                                    handleSaveCategoryImage(cat, val);
                                  }
                                }}
                              >
                                {standardFlyers.map(f => (
                                  <option key={f.path} value={f.path}>{f.label}</option>
                                ))}
                                <option value="custom">-- Custom Flyer --</option>
                              </select>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="form-control"
                                style={{ fontSize: '10px', padding: '2px', height: '26px', borderRadius: '6px' }}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadCustomImage(cat, e.target.files[0]);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Delete button (only for custom categories) */}
                        {!isSeeded && (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)', background: 'transparent', borderColor: 'transparent' }}
                            title="Delete Category"
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '10px', padding: 0 }}>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>Done</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
