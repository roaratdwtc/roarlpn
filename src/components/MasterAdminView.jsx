import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  CalendarRange, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Globe, 
  Key, 
  LogOut, 
  Check, 
  X, 
  Edit3,
  TrendingUp,
  AlertCircle,
  Plus,
  Sliders,
  LogIn,
  Sparkles
} from 'lucide-react';
import AdminAssistantView from './AdminAssistantView';

export default function MasterAdminView({ onSignOut, onImpersonate }) {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminTab, setAdminTab] = useState('registry'); // 'registry' or 'assistant'
  
  // Modals state
  const [editingCompany, setEditingCompany] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFeaturesCompany, setEditingFeaturesCompany] = useState(null);
  const [featuresState, setFeaturesState] = useState({
    ai_assistant: true,
    whatsapp_agent: true,
    finance_ledger: true,
    partners_portal: true,
    coupons: true
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    whatsapp: '',
    address: '',
    contactPerson: '',
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    bankIban: '',
    logo: ''
  });
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const openFeaturesModal = (company) => {
    setEditingFeaturesCompany(company);
    let parsed = { ai_assistant: true, whatsapp_agent: true, finance_ledger: true, partners_portal: true, coupons: true };
    if (company.features) {
      try {
        parsed = typeof company.features === 'string' ? JSON.parse(company.features) : company.features;
      } catch (e) {
        console.error(e);
      }
    }
    setFeaturesState(parsed);
  };

  const handleSaveFeatures = async (e) => {
    e.preventDefault();
    if (!editingFeaturesCompany) return;

    const featuresJson = JSON.stringify(featuresState);

    try {
      const res = await fetch('api.php?action=update_company_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: editingFeaturesCompany.id,
          features: featuresJson
        })
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        alert('Features updated successfully.');
        setCompanies(prev => prev.map(c => c.id === editingFeaturesCompany.id ? { ...c, features: featuresJson } : c));
        setEditingFeaturesCompany(null);
      } else {
        throw new Error(result.message || 'API error');
      }
    } catch (err) {
      console.warn('Features update API failed, falling back to local storage:', err);
      setCompanies(prev => prev.map(c => c.id === editingFeaturesCompany.id ? { ...c, features: featuresJson } : c));
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const updated = cached.map(c => c.id === editingFeaturesCompany.id ? { ...c, features: featuresJson } : c);
      localStorage.setItem('safari_companies', JSON.stringify(updated));
      setEditingFeaturesCompany(null);
      alert('Offline Mode: Features configuration updated locally in your browser.');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setCreateError("Logo file must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCreateForm(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      const mockCompId = 'comp_' + Math.random().toString(36).substr(2, 9);
      const mockCompany = {
        id: mockCompId,
        name: createForm.name,
        slug: createForm.slug.toLowerCase().replace(/[^a-z0-9\-]/g, ''),
        email: createForm.email,
        password: createForm.password,
        whatsapp: createForm.whatsapp,
        address: createForm.address,
        contactPerson: createForm.contactPerson,
        bankAccountName: createForm.bankAccountName,
        bankName: createForm.bankName,
        bankAccountNumber: createForm.bankAccountNumber,
        bankIban: createForm.bankIban,
        logo: createForm.logo,
        status: 'active',
        features: '{"ai_assistant":true,"whatsapp_agent":true,"finance_ledger":true,"partners_portal":true,"coupons":true}',
        booking_count: 0,
        createdAt: new Date().toISOString().replace('T', ' ').substr(0, 19)
      };

      const existing = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const isDuplicate = existing.some(c => c.slug === mockCompany.slug || c.email === mockCompany.email);
      if (isDuplicate) {
        setCreateError('A company with this email or subdomain slug already exists locally.');
        setCreateSubmitting(false);
        return;
      }

      existing.push(mockCompany);
      localStorage.setItem('safari_companies', JSON.stringify(existing));
      setCompanies(existing);
      alert('Offline Mode: Company onboarded successfully inside browser local storage.');
      setShowCreateModal(false);
      setCreateForm({
        name: '', slug: '', email: '', password: '', whatsapp: '', address: '',
        contactPerson: '', bankAccountName: '', bankName: '', bankAccountNumber: '', bankIban: '', logo: ''
      });
      setCreateSubmitting(false);
      return;
    }

    try {
      const res = await fetch('api.php?action=onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        alert('Company onboarded successfully.');
        fetchCompanies();
        setShowCreateModal(false);
        setCreateForm({
          name: '', slug: '', email: '', password: '', whatsapp: '', address: '',
          contactPerson: '', bankAccountName: '', bankName: '', bankAccountNumber: '', bankIban: '', logo: ''
        });
      } else {
        setCreateError(result.message || 'Onboarding failed.');
      }
    } catch (err) {
      console.error(err);
      setCreateError('Network error connecting to database API.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('api.php?action=load_companies');
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        setCompanies(result.data || []);
        localStorage.setItem('safari_companies', JSON.stringify(result.data || []));
      } else {
        throw new Error(result.message || 'Failed to retrieve companies.');
      }
    } catch (e) {
      console.warn('Failed to fetch from API, loading local offline companies:', e);
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      
      // Seed default company offline if the list is empty
      if (cached.length === 0) {
        cached.push({
          id: 'roar',
          name: 'Roar Adventure Tourism LLC',
          slug: 'roar',
          email: 'info@roaradventuretourism.com',
          password: 'R4roar!786*',
          whatsapp: '+971589344077',
          address: 'Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE',
          contactPerson: 'Mr. Abid Ali',
          status: 'active',
          booking_count: 5,
          createdAt: '2016-01-01 00:00:00'
        });
        localStorage.setItem('safari_companies', JSON.stringify(cached));
      }
      
      setCompanies(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggleStatus = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this company account? Suspended companies cannot log in.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('api.php?action=toggle_company_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, status: nextStatus })
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: nextStatus } : c));
      } else {
        throw new Error(result.message || 'Failed to update status.');
      }
    } catch (e) {
      console.warn('Status toggle API failed, updating local storage:', e);
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: nextStatus } : c));
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const updated = cached.map(c => c.id === companyId ? { ...c, status: nextStatus } : c);
      localStorage.setItem('safari_companies', JSON.stringify(updated));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;

    try {
      const payload = {
        company_id: editingCompany.id,
        domain: newDomain,
        password: newPassword || undefined
      };

      const res = await fetch('api.php?action=update_company_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        alert('Company settings updated successfully.');
        setCompanies(prev => prev.map(c => {
          if (c.id === editingCompany.id) {
            return { 
              ...c, 
              domain: newDomain, 
              password: newPassword ? newPassword : c.password 
            };
          }
          return c;
        }));
        setEditingCompany(null);
      } else {
        throw new Error(result.message || 'Failed to update company settings.');
      }
    } catch (e) {
      console.warn('Profile update API failed, updating local storage:', e);
      setCompanies(prev => prev.map(c => {
        if (c.id === editingCompany.id) {
          return { 
            ...c, 
            domain: newDomain, 
            password: newPassword ? newPassword : c.password 
          };
        }
        return c;
      }));
      const cached = JSON.parse(localStorage.getItem('safari_companies') || '[]');
      const updated = cached.map(c => {
        if (c.id === editingCompany.id) {
          return { 
            ...c, 
            domain: newDomain, 
            password: newPassword ? newPassword : c.password 
          };
        }
        return c;
      });
      localStorage.setItem('safari_companies', JSON.stringify(updated));
      setEditingCompany(null);
      alert('Offline Mode: Company settings updated locally in your browser.');
    }
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setNewDomain(company.domain || '');
    setNewPassword('');
  };

  // KPI Calculations
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const suspendedCompanies = companies.filter(c => c.status === 'suspended').length;
  const totalBookings = companies.reduce((sum, c) => sum + (c.booking_count || 0), 0);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>CRM Platform Control Panel</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Logged in as Platform Master Administrator</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={16} /> Onboard New Safari
          </button>
          <button
            onClick={onSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#ef4444',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        <button
          onClick={() => setAdminTab('registry')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            background: adminTab === 'registry' ? '#ffffff' : 'transparent',
            color: adminTab === 'registry' ? '#0f172a' : '#64748b',
            boxShadow: adminTab === 'registry' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Building size={16} /> Safaris Directory
        </button>
        <button
          onClick={() => setAdminTab('assistant')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            background: adminTab === 'assistant' ? '#ffffff' : 'transparent',
            color: adminTab === 'assistant' ? '#0f172a' : '#64748b',
            boxShadow: adminTab === 'assistant' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} style={{ color: '#8b5cf6' }} /> AI System Assistant
        </button>
      </div>

      {adminTab === 'assistant' ? (
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px', height: '600px', display: 'flex', flexDirection: 'column' }}>
          <AdminAssistantView />
        </div>
      ) : (
        <>

      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#ef4444',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} /> {errorMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        
        {/* Total Companies */}
        <div style={cardStyle('#3b82f6')}>
          <div style={iconContainerStyle('#eff6ff', '#3b82f6')}>
            <Building size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>TOTAL SAfaris REGISTERED</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>{totalCompanies}</h3>
          </div>
        </div>

        {/* Active Companies */}
        <div style={cardStyle('#10b981')}>
          <div style={iconContainerStyle('#ecfdf5', '#10b981')}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>ACTIVE TENANTS</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>{activeCompanies}</h3>
          </div>
        </div>

        {/* Suspended Companies */}
        <div style={cardStyle('#f59e0b')}>
          <div style={iconContainerStyle('#fffbeb', '#f59e0b')}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>SUSPENDED TENANTS</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>{suspendedCompanies}</h3>
          </div>
        </div>

        {/* Total Bookings */}
        <div style={cardStyle('#8b5cf6')}>
          <div style={iconContainerStyle('#f5f3ff', '#8b5cf6')}>
            <CalendarRange size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>CUMULATIVE BOOKINGS</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>{totalBookings}</h3>
          </div>
        </div>

      </div>

      {/* Main Companies Panel */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        padding: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Onboarded Safaris Directory</h2>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by company, subdomain or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px 11px 40px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={thStyle}>COMPANY DETAILS</th>
                <th style={thStyle}>SUBDOMAIN URL</th>
                <th style={thStyle}>MAPPED CUSTOM DOMAIN</th>
                <th style={thStyle}>CONTACT PERSON</th>
                <th style={thStyle}>TOTAL BOOKINGS</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '600' }}>
                    Loading tenants repository...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '600' }}>
                    No companies registered.
                  </td>
                </tr>
              ) : filteredCompanies.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        overflow: 'hidden'
                      }}>
                        {c.logo ? (
                          <img src={c.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Building size={20} style={{ color: '#94a3b8' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px' }}>
                      {c.slug}.safaricrm.dxbaiseo.com
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {c.domain ? (
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={14} style={{ color: '#10b981' }} /> {c.domain}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>None configured</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155' }}>{c.contactPerson}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>WhatsApp: {c.whatsapp}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0f172a' }}>
                      <TrendingUp size={14} style={{ color: '#8b5cf6' }} /> {c.booking_count || 0}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      borderRadius: '30px',
                      padding: '4px 12px',
                      background: c.status === 'active' ? '#ecfdf5' : '#fef2f2',
                      color: c.status === 'active' ? '#10b981' : '#ef4444',
                      border: c.status === 'active' ? '1px solid #a7f3d0' : '1px solid #fca5a5'
                    }}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Impersonation switch */}
                      <button
                        onClick={() => onImpersonate(c.id, c)}
                        title="Impersonate (Login as Company)"
                        style={{ ...actionButtonStyle, color: '#f59e0b' }}
                      >
                        <LogIn size={15} />
                      </button>

                      {/* Feature Gates */}
                      <button
                        onClick={() => openFeaturesModal(c)}
                        title="Manage Feature Permissions"
                        style={{ ...actionButtonStyle, color: '#8b5cf6' }}
                      >
                        <Sliders size={15} />
                      </button>

                      {/* Configuration Edit */}
                      <button
                        onClick={() => openEditModal(c)}
                        title="Configure Domain / Credentials"
                        style={actionButtonStyle}
                      >
                        <Edit3 size={15} />
                      </button>
 
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        title={c.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                        style={{
                          ...actionButtonStyle,
                          color: c.status === 'active' ? '#ef4444' : '#10b981'
                        }}
                      >
                        {c.status === 'active' ? <X size={15} /> : <Check size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Edit Mappings Modal */}
      {editingCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Configure {editingCompany.name}</h3>
              <button 
                onClick={() => setEditingCompany(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>MAPPED CUSTOM DOMAIN</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. www.toursonline.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>RESET ADMIN PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Company Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Onboard New Safari Company</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            {createError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>COMPANY NAME</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Desert Dunes Safari"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>SUBDOMAIN SLUG</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. desert-dunes"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '') }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>ADMIN EMAIL</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="info@company.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>SECURE PASSWORD</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>WHATSAPP NUMBER</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +971501234567"
                    value={createForm.whatsapp}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>CONTACT PERSON</label>
                  <input 
                    type="text" 
                    placeholder="Owner or Manager Name"
                    value={createForm.contactPerson}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    style={{ ...modalInputStyle, paddingLeft: '16px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>BUSINESS ADDRESS</label>
                <input 
                  type="text" 
                  placeholder="Dubai office address..."
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  style={{ ...modalInputStyle, paddingLeft: '16px' }}
                />
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '14px', margin: '6px 0' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0' }}>Corporate Bank Account Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>BANK NAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Emirates NBD"
                      value={createForm.bankName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bankName: e.target.value }))}
                      style={{ ...modalInputStyle, paddingLeft: '16px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>ACCOUNT TITLE / BENEFICIARY</label>
                    <input 
                      type="text" 
                      placeholder="Corporate Name"
                      value={createForm.bankAccountName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
                      style={{ ...modalInputStyle, paddingLeft: '16px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>ACCOUNT NUMBER</label>
                    <input 
                      type="text" 
                      placeholder="101xxxxxxxx"
                      value={createForm.bankAccountNumber}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      style={{ ...modalInputStyle, paddingLeft: '16px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>IBAN NUMBER</label>
                    <input 
                      type="text" 
                      placeholder="AE83xxxxxxxxxxxxxxxx"
                      value={createForm.bankIban}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, bankIban: e.target.value }))}
                      style={{ ...modalInputStyle, paddingLeft: '16px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>COMPANY LOGO</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ fontSize: '13px', color: '#64748b' }}
                />
                {createForm.logo && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={createForm.logo} alt="Preview" style={{ maxHeight: '60px', objectFit: 'contain', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  style={{
                    flex: 1,
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {createSubmitting ? 'Registering...' : 'Onboard Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Feature Permissions Modal */}
      {editingFeaturesCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Features: {editingFeaturesCompany.name}</h3>
              <button 
                onClick={() => setEditingFeaturesCompany(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFeatures} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={featuresState.ai_assistant}
                    onChange={(e) => setFeaturesState(prev => ({ ...prev, ai_assistant: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  AI Admin Assistant Tab
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={featuresState.whatsapp_agent}
                    onChange={(e) => setFeaturesState(prev => ({ ...prev, whatsapp_agent: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  WhatsApp Support Agent
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={featuresState.finance_ledger}
                    onChange={(e) => setFeaturesState(prev => ({ ...prev, finance_ledger: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Car Finance Ledger Tab
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={featuresState.partners_portal}
                    onChange={(e) => setFeaturesState(prev => ({ ...prev, partners_portal: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Partners & Invoices Tab
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={featuresState.coupons}
                    onChange={(e) => setFeaturesState(prev => ({ ...prev, coupons: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Coupons & Packages Settings
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingFeaturesCompany(null)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#8b5cf6',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  Save Features
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyle = (color) => ({
  background: '#ffffff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
  borderLeft: `5px solid ${color}`
});

const iconContainerStyle = (bg, color) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const thStyle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#64748b',
  textTransform: 'uppercase',
  padding: '16px 20px',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px 20px',
  verticalAlign: 'middle',
  color: '#334155'
};

const actionButtonStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#64748b',
  transition: 'all 0.2s'
};

const modalInputStyle = {
  width: '100%',
  padding: '12px 16px 12px 36px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box'
};
