import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Phone, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Printer, 
  Download, 
  ShieldCheck, 
  FileText, 
  Wifi, 
  Smartphone, 
  Users, 
  Coffee, 
  CreditCard,
  Send,
  Clock,
  Sparkles,
  Layers,
  MessageSquare
} from 'lucide-react';

const COMPANY_CATEGORIES = [
  'Trade License Renewal',
  'Establishment Card Renewal',
  'Office Rent & Ejari',
  'Company Main Phone Bill',
  'Office Internet & Telephony Bill',
  'Office Expenses & Supplies',
  'Petty Cash Disbursements',
  'Miscellaneous & Legal'
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Card',
  'Bank Cheque',
  'Auto Debit',
  'Cash',
  'Petty Cash'
];

const SIM_PROVIDERS = ['Du', 'Etisalat', 'Virgin'];
const AGENT_ROLES = [
  'Inbound Sales & VIP Bookings',
  'Outbound Leads & Partner Relations',
  'Operations & Driver Dispatch',
  'Sales & Customer Support',
  'Inbound Leads & WhatsApp Agent',
  'Driver Dispatch Support',
  'Management',
  'Spare / Standby Line'
];

export default function CompanyExpensesView({
  companyExpenses = [],
  setCompanyExpenses,
  companySims = [],
  setCompanySims,
  companyDetails = {},
  companyId = 'roar'
}) {
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'expenses' | 'sims'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // SIM specific filters
  const [simProviderFilter, setSimProviderFilter] = useState('all');
  const [simStatusFilter, setSimStatusFilter] = useState('all');

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    category: 'Trade License Renewal',
    title: '',
    amount: '',
    date: todayStr,
    dueDate: '',
    paymentMethod: 'Bank Transfer',
    vendor: '',
    invoiceNo: '',
    status: 'paid',
    notes: ''
  });

  // SIM Modal State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState(null);
  const [simFormData, setSimFormData] = useState({
    phoneNumber: '+971 ',
    provider: 'Du',
    planName: 'Business Smart 150',
    monthlyCost: '150',
    assignedAgent: '',
    agentRole: 'Inbound Sales & VIP Bookings',
    simCardNumber: '',
    status: 'active',
    assignedDate: todayStr,
    notes: ''
  });

  // Open Add/Edit Expense Modal
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormData({
      category: 'Trade License Renewal',
      title: '',
      amount: '',
      date: todayStr,
      dueDate: '',
      paymentMethod: 'Bank Transfer',
      vendor: 'Department of Economy & Tourism (DET)',
      invoiceNo: '',
      status: 'paid',
      notes: ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      category: expense.category || 'Trade License Renewal',
      title: expense.title || '',
      amount: expense.amount || '',
      date: expense.date || todayStr,
      dueDate: expense.dueDate || '',
      paymentMethod: expense.paymentMethod || 'Bank Transfer',
      vendor: expense.vendor || '',
      invoiceNo: expense.invoiceNo || '',
      status: expense.status || 'paid',
      notes: expense.notes || ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const payload = {
      ...expenseFormData,
      amount: parseFloat(expenseFormData.amount) || 0,
      id: editingExpense ? editingExpense.id : `compexp-${Date.now()}`
    };

    let updatedList;
    if (editingExpense) {
      updatedList = companyExpenses.map(item => item.id === editingExpense.id ? payload : item);
    } else {
      updatedList = [payload, ...companyExpenses];
    }

    setCompanyExpenses(updatedList);
    setIsExpenseModalOpen(false);

    try {
      fetch(`api.php?action=save&table=company_expenses&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Failed to sync company expense to MySQL:', err));
    } catch (err) {
      console.warn('Network error saving company expense:', err);
    }
  };

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Are you sure you want to delete this company expense record?')) return;
    const updatedList = companyExpenses.filter(item => item.id !== id);
    setCompanyExpenses(updatedList);

    try {
      fetch(`api.php?action=delete&table=company_expenses&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.warn('Failed to delete company expense from MySQL:', err));
    } catch (err) {
      console.warn('Network error deleting company expense:', err);
    }
  };

  // Open Add/Edit SIM Modal
  const handleOpenAddSim = () => {
    setEditingSim(null);
    setSimFormData({
      phoneNumber: '+971 ',
      provider: 'Du',
      planName: 'Business Smart 150',
      monthlyCost: '150',
      assignedAgent: '',
      agentRole: 'Inbound Sales & VIP Bookings',
      simCardNumber: '',
      status: 'active',
      assignedDate: todayStr,
      notes: ''
    });
    setIsSimModalOpen(true);
  };

  const handleOpenEditSim = (sim) => {
    setEditingSim(sim);
    setSimFormData({
      phoneNumber: sim.phoneNumber || '',
      provider: sim.provider || 'Du',
      planName: sim.planName || '',
      monthlyCost: sim.monthlyCost || '',
      assignedAgent: sim.assignedAgent || '',
      agentRole: sim.agentRole || 'Inbound Sales & VIP Bookings',
      simCardNumber: sim.simCardNumber || '',
      status: sim.status || 'active',
      assignedDate: sim.assignedDate || todayStr,
      notes: sim.notes || ''
    });
    setIsSimModalOpen(true);
  };

  const handleSaveSim = (e) => {
    e.preventDefault();
    const payload = {
      ...simFormData,
      monthlyCost: parseFloat(simFormData.monthlyCost) || 0,
      id: editingSim ? editingSim.id : `sim-${Date.now()}`
    };

    let updatedList;
    if (editingSim) {
      updatedList = companySims.map(item => item.id === editingSim.id ? payload : item);
    } else {
      updatedList = [payload, ...companySims];
    }

    setCompanySims(updatedList);
    setIsSimModalOpen(false);

    try {
      fetch(`api.php?action=save&table=company_sims&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Failed to sync company SIM to MySQL:', err));
    } catch (err) {
      console.warn('Network error saving company SIM:', err);
    }
  };

  const handleDeleteSim = (id) => {
    if (!window.confirm('Are you sure you want to remove this company SIM assignment?')) return;
    const updatedList = companySims.filter(item => item.id !== id);
    setCompanySims(updatedList);

    try {
      fetch(`api.php?action=delete&table=company_sims&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.warn('Failed to delete company SIM from MySQL:', err));
    } catch (err) {
      console.warn('Network error deleting company SIM:', err);
    }
  };

  // Date helpers for filtering
  const currentMonthPrefix = todayStr.substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = new Date(lastMonthDate.getTime() - lastMonthDate.getTimezoneOffset() * 60000).toISOString().substring(0, 7);

  // Filtered Company Expenses
  const filteredExpenses = useMemo(() => {
    return companyExpenses.filter(item => {
      const searchMatch = !searchTerm || 
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;

      let dateMatch = true;
      if (dateFilter === 'this_month') {
        dateMatch = (item.date || '').startsWith(currentMonthPrefix);
      } else if (dateFilter === 'last_month') {
        dateMatch = (item.date || '').startsWith(lastMonthPrefix);
      } else if (dateFilter === 'custom') {
        if (customStartDate) dateMatch = dateMatch && item.date >= customStartDate;
        if (customEndDate) dateMatch = dateMatch && item.date <= customEndDate;
      }

      return searchMatch && categoryMatch && statusMatch && dateMatch;
    });
  }, [companyExpenses, searchTerm, categoryFilter, statusFilter, dateFilter, customStartDate, customEndDate, currentMonthPrefix, lastMonthPrefix]);

  // Filtered Company SIMs
  const filteredSims = useMemo(() => {
    return companySims.filter(sim => {
      const searchMatch = !searchTerm ||
        (sim.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.assignedAgent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.agentRole || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const providerMatch = simProviderFilter === 'all' || sim.provider === simProviderFilter;
      const statusMatch = simStatusFilter === 'all' || sim.status === simStatusFilter;

      return searchMatch && providerMatch && statusMatch;
    });
  }, [companySims, searchTerm, simProviderFilter, simStatusFilter]);

  // 8 KPI Report Calculations
  const stats = useMemo(() => {
    const totalCompanyOverheads = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 1. Government & Licensing (Trade License + Establishment Card)
    const licensingTotal = filteredExpenses
      .filter(item => item.category === 'Trade License Renewal' || item.category === 'Establishment Card Renewal')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 2. Office Rent & Ejari
    const rentEjariTotal = filteredExpenses
      .filter(item => item.category === 'Office Rent & Ejari')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 3. Internet & Main Phone Bills
    const telecomBillsTotal = filteredExpenses
      .filter(item => item.category === 'Company Main Phone Bill' || item.category === 'Office Internet & Telephony Bill')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 4. Sales SIMs Monthly Cost & Count
    const activeSims = companySims.filter(s => s.status === 'active');
    const totalSimMonthlyCost = activeSims.reduce((sum, s) => sum + (parseFloat(s.monthlyCost) || 0), 0);

    // 5. Office Supplies & Consumables
    const officeSuppliesTotal = filteredExpenses
      .filter(item => item.category === 'Office Expenses & Supplies')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 6. Petty Cash Disbursements
    const pettyCashTotal = filteredExpenses
      .filter(item => item.category === 'Petty Cash Disbursements')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 7. This Month's Overheads
    const thisMonthOverheads = companyExpenses
      .filter(item => (item.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 8. Upcoming Critical Renewals (Check items with due dates within 90 days)
    const upcomingRenewals = companyExpenses
      .filter(item => item.dueDate && item.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nextRenewal = upcomingRenewals[0] || null;

    return {
      totalCompanyOverheads,
      licensingTotal,
      rentEjariTotal,
      telecomBillsTotal,
      activeSimCount: activeSims.length,
      totalSimMonthlyCost,
      officeSuppliesTotal,
      pettyCashTotal,
      thisMonthOverheads,
      nextRenewal
    };
  }, [filteredExpenses, companyExpenses, companySims, currentMonthPrefix, todayStr]);

  const handlePrint = () => {
    window.print();
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'Trade License Renewal':
      case 'Establishment Card Renewal':
        return { background: 'rgba(5, 150, 105, 0.12)', color: '#047857', border: '1px solid rgba(5, 150, 105, 0.25)' };
      case 'Office Rent & Ejari':
        return { background: 'rgba(140, 91, 48, 0.12)', color: '#8c5b30', border: '1px solid rgba(140, 91, 48, 0.25)' };
      case 'Company Main Phone Bill':
      case 'Office Internet & Telephony Bill':
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'Office Expenses & Supplies':
        return { background: 'rgba(217, 119, 6, 0.12)', color: '#b45309', border: '1px solid rgba(217, 119, 6, 0.25)' };
      case 'Petty Cash Disbursements':
        return { background: 'rgba(201, 118, 42, 0.12)', color: '#c9762a', border: '1px solid rgba(201, 118, 42, 0.25)' };
      default:
        return { background: 'rgba(107, 114, 128, 0.12)', color: '#374151', border: '1px solid rgba(107, 114, 128, 0.25)' };
    }
  };

  return (
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & Sub-Tabs Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
            Company Expenses & Sales SIMs
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track trade license renewals, office rent, internet/phone bills, petty cash disbursements, and sales agent mobile SIMs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handlePrint}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Report
          </button>

          {activeSubTab === 'expenses' ? (
            <button 
              onClick={handleOpenAddExpense}
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)' }}
            >
              <Plus size={16} /> Log Company Expense
            </button>
          ) : (
            <button 
              onClick={handleOpenAddSim}
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)' }}
            >
              <Plus size={16} /> Assign Sales SIM
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Header */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #ede6d9', paddingBottom: '2px' }}>
        <button
          onClick={() => { setActiveSubTab('expenses'); setSearchTerm(''); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeSubTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'expenses' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Building2 size={16} /> Company Overheads ({companyExpenses.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('sims'); setSearchTerm(''); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeSubTab === 'sims' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'sims' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Smartphone size={16} /> Sales Agent SIMs & Numbers ({companySims.length})
        </button>
      </div>

      {/* 8 KPI & Report Cards Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        {/* 1. Total Corporate Overheads */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL OVERHEADS
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>
            {stats.totalCompanyOverheads.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filteredExpenses.length} expense items recorded
          </div>
        </div>

        {/* 2. Government & Licensing */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TRADE LICENSE & GDRFA
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.1)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '8px' }}>
            {stats.licensingTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            DET, DTCM & MoHRE renewals
          </div>
        </div>

        {/* 3. Office Rent & Ejari */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OFFICE RENT & EJARI
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(201, 118, 42, 0.1)', color: '#c9762a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            {stats.rentEjariTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Commercial office lease
          </div>
        </div>

        {/* 4. Internet & Main Phone Bills */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              INTERNET & MAIN LINE
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wifi size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '8px' }}>
            {stats.telecomBillsTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hotline + Fiber internet
          </div>
        </div>

        {/* 5. Active Sales SIMs */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SALES AGENT SIMS
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.1)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            {stats.activeSimCount} <span style={{ fontSize: '13px', fontWeight: '600' }}>Lines Active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', marginTop: '4px' }}>
            {stats.totalSimMonthlyCost.toLocaleString()} AED / month plan spend
          </div>
        </div>

        {/* 6. Office Supplies & Consumables */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OFFICE SUPPLIES
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(201, 118, 42, 0.1)', color: '#c9762a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            {stats.officeSuppliesTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pantry, water & stationery
          </div>
        </div>

        {/* 7. Petty Cash Disbursements */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PETTY CASH SPENT
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>
            {stats.pettyCashTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Small daily cash disbursements
          </div>
        </div>

        {/* 8. Upcoming Critical Renewals */}
        <div className="stat-card" style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              NEXT RENEWAL
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#b91c1c', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.nextRenewal ? stats.nextRenewal.title : 'All Licenses Active'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.nextRenewal ? `Due on: ${(stats.nextRenewal.dueDate || '').split('-').reverse().join('/')}` : 'No renewals due within 90 days'}
          </div>
        </div>

      </div>

      {/* SUB-TAB 1: COMPANY EXPENSES LEDGER */}
      {activeSubTab === 'expenses' && (
        <>
          {/* Filters & Search */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px' }}>
            
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Search by title, category, vendor, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              
              <select 
                className="form-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '170px' }}
              >
                <option value="all">All Categories</option>
                {COMPANY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '120px' }}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>

              <select 
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '130px' }}
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                </div>
              )}

              {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  Reset Filters
                </button>
              )}

            </div>
          </div>

          {/* Expenses Table */}
          <div className="table-responsive card" style={{ background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fdfbf7', borderBottom: '1px solid #ede6d9', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DATE</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>EXPENSE TITLE / DESCRIPTION</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>CATEGORY</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT (AED)</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>VENDOR / AUTHORITY</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DUE / RENEWAL</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                      <Building2 size={32} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontWeight: '600', fontSize: '14px' }}>No company expenses found matching criteria.</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Log Company Expense" above to record a new overhead item.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="clickable-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                      
                      {/* Date */}
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px' }}>
                        {(exp.date || '').split('-').reverse().join('/')}
                      </td>

                      {/* Title & Notes */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '13.5px' }}>
                          {exp.title}
                        </div>
                        {exp.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            ...getCategoryBadgeStyle(exp.category), 
                            fontWeight: '700', 
                            fontSize: '11px', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                        {parseFloat(exp.amount || 0).toLocaleString()} AED
                      </td>

                      {/* Vendor / Authority */}
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', color: 'var(--text-main)' }}>
                        <div>{exp.vendor || 'N/A'}</div>
                        {exp.paymentMethod && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            via {exp.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Due / Renewal Date */}
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {exp.dueDate ? (exp.dueDate.split('-').reverse().join('/')) : 'N/A'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: exp.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : (exp.status === 'overdue' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'), 
                            color: exp.status === 'paid' ? '#047857' : (exp.status === 'overdue' ? '#b91c1c' : '#b45309'),
                            fontWeight: '700',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {exp.status || 'Paid'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleOpenEditExpense(exp)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Edit Record"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px' }}
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SUB-TAB 2: SALES AGENT SIMS & NUMBERS DIRECTORY */}
      {activeSubTab === 'sims' && (
        <>
          {/* Filters & Search */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px' }}>
            
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Search by phone, sales agent name, role, plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              
              <select 
                className="form-control"
                value={simProviderFilter}
                onChange={(e) => setSimProviderFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '130px' }}
              >
                <option value="all">All Providers</option>
                {SIM_PROVIDERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select 
                className="form-control"
                value={simStatusFilter}
                onChange={(e) => setSimStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '120px' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="spare">Spare</option>
                <option value="suspended">Suspended</option>
              </select>

              {(searchTerm || simProviderFilter !== 'all' || simStatusFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSimProviderFilter('all');
                    setSimStatusFilter('all');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  Reset Filters
                </button>
              )}

            </div>
          </div>

          {/* SIMs Directory Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredSims.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 16px', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px', color: 'var(--text-muted)' }}>
                <Smartphone size={36} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: '700', fontSize: '15px' }}>No company SIM cards found.</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Assign Sales SIM" above to record a new phone line.</p>
              </div>
            ) : (
              filteredSims.map((sim) => {
                const cleanPhone = (sim.phoneNumber || '').replace(/[^0-9]/g, '');
                const waLink = `https://wa.me/${cleanPhone}`;
                return (
                  <div 
                    key={sim.id}
                    className="card"
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #ede6d9',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(140, 91, 48, 0.04)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    {/* Card Top: Number & Provider */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                            {sim.phoneNumber}
                          </span>
                          <span 
                            className="badge" 
                            style={{ 
                              background: sim.provider === 'Du' ? 'rgba(59, 130, 246, 0.12)' : (sim.provider === 'Etisalat' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                              color: sim.provider === 'Du' ? '#1d4ed8' : (sim.provider === 'Etisalat' ? '#047857' : '#b91c1c'),
                              fontWeight: '700',
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {sim.provider}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Plan: <strong style={{ color: 'var(--text-dark)' }}>{sim.planName || 'Standard Business'}</strong> ({sim.monthlyCost} AED/mo)
                        </div>
                      </div>

                      <span 
                        className="badge" 
                        style={{ 
                          background: sim.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : (sim.status === 'spare' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(107, 114, 128, 0.12)'),
                          color: sim.status === 'active' ? '#047857' : (sim.status === 'spare' ? '#b45309' : '#374151'),
                          fontWeight: '700',
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {sim.status}
                      </span>
                    </div>

                    {/* Middle: Assigned Sales Agent & Role */}
                    <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            ASSIGNED SALES AGENT
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
                            {sim.assignedAgent || 'Unassigned / Company Spare'}
                          </div>
                        </div>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(140, 91, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Users size={15} />
                        </div>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-main)', marginTop: '6px', fontWeight: '600' }}>
                        Role: <span style={{ color: 'var(--text-dark)' }}>{sim.agentRole}</span>
                      </div>
                    </div>

                    {/* Bottom: SIM Details & WhatsApp Quick Chat */}
                    {sim.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {sim.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                      {cleanPhone && (
                        <a 
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            background: '#128c7e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            flex: 1,
                            justifyContent: 'center',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageSquare size={13} /> Chat on WhatsApp
                        </a>
                      )}

                      <button 
                        onClick={() => handleOpenEditSim(sim)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Edit SIM Details"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button 
                        onClick={() => handleDeleteSim(sim.id)}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px' }}
                        title="Remove SIM"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '16px', padding: '24px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingExpense ? 'Edit Company Expense' : 'Log Company Expense'}
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Expense Title / Description *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="e.g. DET / DTCM Commercial Tourism License"
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    className="form-control"
                    required
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                  >
                    {COMPANY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (AED) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-control" 
                    required
                    placeholder="e.g. 14500"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Renewal / Due Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={expenseFormData.dueDate}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Vendor / Authority Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Department of Economy & Tourism (DET)"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Invoice / Receipt No</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. DET-2026-8819"
                    value={expenseFormData.invoiceNo}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, invoiceNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    className="form-control"
                    value={expenseFormData.paymentMethod}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Status</label>
                  <select 
                    className="form-control"
                    value={expenseFormData.status}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, status: e.target.value })}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes & Additional Context</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Reference numbers, policy details, or cheque numbers..."
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '18px', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense Record'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Add / Edit SIM Modal */}
      {isSimModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '16px', padding: '24px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingSim ? 'Edit Sales SIM Assignment' : 'Assign New Company SIM'}
              </h3>
              <button onClick={() => setIsSimModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveSim}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="e.g. +971 58 934 4077"
                    value={simFormData.phoneNumber}
                    onChange={(e) => setSimFormData({ ...simFormData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Telecom Provider *</label>
                  <select 
                    className="form-control"
                    required
                    value={simFormData.provider}
                    onChange={(e) => setSimFormData({ ...simFormData, provider: e.target.value })}
                  >
                    {SIM_PROVIDERS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Sales Agent / Staff *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="e.g. Asad (Sales Lead)"
                    value={simFormData.assignedAgent}
                    onChange={(e) => setSimFormData({ ...simFormData, assignedAgent: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Agent Role & Department *</label>
                  <select 
                    className="form-control"
                    required
                    value={simFormData.agentRole}
                    onChange={(e) => setSimFormData({ ...simFormData, agentRole: e.target.value })}
                  >
                    {AGENT_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plan Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Business Unlimited 300"
                    value={simFormData.planName}
                    onChange={(e) => setSimFormData({ ...simFormData, planName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Plan Cost (AED)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-control" 
                    placeholder="e.g. 300"
                    value={simFormData.monthlyCost}
                    onChange={(e) => setSimFormData({ ...simFormData, monthlyCost: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>SIM Card No (ICCID)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 89971032194019283"
                    value={simFormData.simCardNumber}
                    onChange={(e) => setSimFormData({ ...simFormData, simCardNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    className="form-control"
                    value={simFormData.status}
                    onChange={(e) => setSimFormData({ ...simFormData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="spare">Spare / Unallocated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes & SIM Allocation Details</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="WhatsApp marketing target, international calling bundle, handset IMEI..."
                    value={simFormData.notes}
                    onChange={(e) => setSimFormData({ ...simFormData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '18px', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsSimModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
                >
                  {editingSim ? 'Update SIM Details' : 'Save SIM Assignment'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
