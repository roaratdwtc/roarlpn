import React, { useState, useMemo, useEffect } from 'react';
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
  MessageSquare,
  X
} from 'lucide-react';

export const DEFAULT_COMPANY_CATEGORIES = [
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

  // Report date range state (Per Image 2 user request: allow option to select dates)
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Customizable 8 KPI Card Titles
  const DEFAULT_COMPANY_CARD_LABELS = {
    total: 'TOTAL OVERHEADS',
    license: 'TRADE LICENSE',
    rent: 'OFFICE RENT',
    telecom: 'INTERNET / PHONE',
    sims: 'SALES SIMS',
    supplies: 'OFFICE SUPPLIES',
    pettyCash: 'PETTY CASH',
    renewal: 'NEXT RENEWAL'
  };

  const [cardLabels, setCardLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_company_card_labels');
      if (saved) return { ...DEFAULT_COMPANY_CARD_LABELS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_COMPANY_CARD_LABELS;
  });

  useEffect(() => {
    localStorage.setItem('safari_company_card_labels', JSON.stringify(cardLabels));
  }, [cardLabels]);

  const [isEditCardLabelsOpen, setIsEditCardLabelsOpen] = useState(false);

  // Dynamic Category management (allows adding more types later)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_company_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_COMPANY_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('safari_company_expense_categories', JSON.stringify(categories));
  }, [categories]);

  // Add Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // SIM specific filters
  const [simProviderFilter, setSimProviderFilter] = useState('all');
  const [simStatusFilter, setSimStatusFilter] = useState('all');

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Expense Modal State (Removed Title and Vendor fields per Image 1 user request)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    category: categories[0] || 'Trade License Renewal',
    amount: '',
    date: todayStr,
    dueDate: '',
    paymentMethod: 'Bank Transfer',
    invoiceNo: '',
    status: 'paid',
    notes: ''
  });

  // SIM Modal State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState(null);
  const [simFormData, setSimFormData] = useState({
    cardLabel: '',
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
      category: categories[0] || 'Trade License Renewal',
      amount: '',
      date: todayStr,
      dueDate: '',
      paymentMethod: 'Bank Transfer',
      invoiceNo: '',
      status: 'paid',
      notes: ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      category: expense.category || categories[0] || 'Trade License Renewal',
      amount: expense.amount || '',
      date: expense.date || todayStr,
      dueDate: expense.dueDate || '',
      paymentMethod: expense.paymentMethod || 'Bank Transfer',
      invoiceNo: expense.invoiceNo || '',
      status: expense.status || 'paid',
      notes: expense.notes || ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleCategorySelectChange = (val) => {
    if (val === '__add_new__') {
      setIsAddCategoryOpen(true);
      return;
    }
    setExpenseFormData(prev => ({ ...prev, category: val }));
  };

  const handleAddNewCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      setExpenseFormData(prev => ({ ...prev, category: trimmed }));
    }
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
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
      cardLabel: '',
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
      cardLabel: sim.cardLabel || '',
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
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // 8 KPI Report Calculations with short, crisp titles
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

    // 8. Upcoming Critical Renewals
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

  // Dynamic report-specific dataset responding to report modal date and category selections
  const reportExpenses = useMemo(() => {
    return companyExpenses.filter(item => {
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      let matchDate = true;
      if (reportStartDate) matchDate = matchDate && (item.date || '') >= reportStartDate;
      if (reportEndDate) matchDate = matchDate && (item.date || '') <= reportEndDate;
      return matchCat && matchDate;
    });
  }, [companyExpenses, categoryFilter, reportStartDate, reportEndDate]);

  const reportTotal = useMemo(() => {
    return reportExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [reportExpenses]);

  const reportLicensingTotal = useMemo(() => {
    return reportExpenses
      .filter(item => item.category === 'Trade License Renewal' || item.category === 'Establishment Card Renewal')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [reportExpenses]);

  const reportRentTotal = useMemo(() => {
    return reportExpenses
      .filter(item => item.category === 'Office Rent & Ejari')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [reportExpenses]);

  const reportTelecomTotal = useMemo(() => {
    return reportExpenses
      .filter(item => item.category === 'Company Main Phone Bill' || item.category === 'Office Internet & Telephony Bill')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [reportExpenses]);

  const handleOpenReport = () => {
    if (dateFilter === 'this_month') {
      setReportStartDate(`${currentMonthPrefix}-01`);
      setReportEndDate(todayStr);
    } else if (dateFilter === 'last_month') {
      setReportStartDate(`${lastMonthPrefix}-01`);
      setReportEndDate(`${lastMonthPrefix}-28`);
    } else if (dateFilter === 'custom') {
      setReportStartDate(customStartDate);
      setReportEndDate(customEndDate);
    } else {
      setReportStartDate('');
      setReportEndDate('');
    }
    setIsReportModalOpen(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const listToExport = isReportModalOpen ? reportExpenses : filteredExpenses;
    const headers = ["Date", "Category", "Amount AED", "Due Date", "Payment Method", "Invoice No", "Status", "Notes"];
    const rows = listToExport.map(e => [
      e.date || '',
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      e.dueDate || '',
      e.paymentMethod || '',
      e.invoiceNo || '',
      e.status || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_Expenses_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
            Company Expenses & Sales SIMs
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Corporate overheads, renewals, office bills & sales mobile directory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsEditCardLabelsOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '8px 12px' }}
            title="Customize the 8 card header labels"
          >
            <Layers size={14} /> Edit Card Labels
          </button>

          <button 
            onClick={handleOpenReport}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <Printer size={14} /> Print Report
          </button>

          {activeSubTab === 'expenses' ? (
            <>
              <button 
                onClick={() => setIsAddCategoryOpen(true)}
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
              >
                <Plus size={14} /> Add Type
              </button>

              <button 
                onClick={handleOpenAddExpense}
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
              >
                <Plus size={14} /> Log Expense
              </button>
            </>
          ) : (
            <button 
              onClick={handleOpenAddSim}
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
            >
              <Plus size={14} /> Assign SIM
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Header */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid #ede6d9', paddingBottom: '2px' }}>
        <button
          onClick={() => { setActiveSubTab('expenses'); setSearchTerm(''); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeSubTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'expenses' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <Building2 size={15} /> Overheads ({companyExpenses.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('sims'); setSearchTerm(''); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeSubTab === 'sims' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'sims' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <Smartphone size={15} /> Sales SIMs ({companySims.length})
        </button>
      </div>

      {/* 1-Row Unified Search & Filters (Per Image 2 user annotation: "move the filter here in 1 row") */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        background: '#ffffff',
        border: '1.5px solid #ede6d9',
        borderRadius: '10px',
        padding: '8px 12px',
        marginBottom: '2px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder={activeSubTab === 'expenses' ? "Search category, notes..." : "Search sales agent, number, role..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '12px', height: '34px' }}
          />
        </div>

        {activeSubTab === 'expenses' ? (
          <>
            {/* Category Dropdown */}
            <select 
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', fontSize: '12px', height: '34px', fontWeight: categoryFilter !== 'all' ? '800' : 'normal', color: categoryFilter !== 'all' ? '#8c5b30' : 'inherit' }}
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '105px', fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Date Range Dropdown */}
            <select 
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '110px', fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="date" 
                  className="form-control" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ width: 'auto', fontSize: '11px', height: '34px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
                <input 
                  type="date" 
                  className="form-control" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ width: 'auto', fontSize: '11px', height: '34px' }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Provider Filter */}
            <select 
              className="form-control"
              value={simProviderFilter}
              onChange={(e) => setSimProviderFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '110px', fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Providers</option>
              {SIM_PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* SIM Status */}
            <select 
              className="form-control"
              value={simStatusFilter}
              onChange={(e) => setSimStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '110px', fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="spare">Spare</option>
              <option value="suspended">Suspended</option>
            </select>
          </>
        )}

        {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || simProviderFilter !== 'all' || simStatusFilter !== 'all') && (
          <button 
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
              setSimProviderFilter('all');
              setSimStatusFilter('all');
            }}
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px', height: '34px' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* 8 KPI & Report Cards Grid (Clickable Category Filters, 2 cards per row on mobile) */}
      <div className="stats-grid" style={{ marginBottom: '8px' }}>
        
        {/* 1. Total Corporate Overheads */}
        <div 
          onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'all' && statusFilter === 'all' ? 'rgba(140, 91, 48, 0.08)' : '#ffffff', 
            border: categoryFilter === 'all' && statusFilter === 'all' ? '2px solid var(--primary)' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'all' && statusFilter === 'all' ? '0 2px 8px rgba(140, 91, 48, 0.15)' : 'none'
          }}
          title="Click to show all overheads"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.total}
            </span>
            <Building2 size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
            {stats.totalCompanyOverheads.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {filteredExpenses.length} items
          </div>
        </div>

        {/* 2. Government & Licensing */}
        <div 
          onClick={() => { setCategoryFilter('Trade License Renewal'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'Trade License Renewal' ? 'rgba(4, 120, 87, 0.08)' : '#ffffff', 
            border: categoryFilter === 'Trade License Renewal' ? '2px solid #047857' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'Trade License Renewal' ? '0 2px 8px rgba(4, 120, 87, 0.15)' : 'none'
          }}
          title="Click to filter by Trade License"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.license}
            </span>
            <ShieldCheck size={14} style={{ color: '#047857' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {stats.licensingTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            DET & GDRFA
          </div>
        </div>

        {/* 3. Office Rent & Ejari */}
        <div 
          onClick={() => { setCategoryFilter('Office Rent & Ejari'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'Office Rent & Ejari' ? 'rgba(201, 118, 42, 0.08)' : '#ffffff', 
            border: categoryFilter === 'Office Rent & Ejari' ? '2px solid #c9762a' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'Office Rent & Ejari' ? '0 2px 8px rgba(201, 118, 42, 0.15)' : 'none'
          }}
          title="Click to filter by Office Rent"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.rent}
            </span>
            <Layers size={14} style={{ color: '#c9762a' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {stats.rentEjariTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            DWTC lease & Ejari
          </div>
        </div>

        {/* 4. Internet & Main Phone Bills */}
        <div 
          onClick={() => { setCategoryFilter('Company Main Phone Bill'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'Company Main Phone Bill' ? 'rgba(29, 78, 216, 0.08)' : '#ffffff', 
            border: categoryFilter === 'Company Main Phone Bill' ? '2px solid #1d4ed8' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'Company Main Phone Bill' ? '0 2px 8px rgba(29, 78, 216, 0.15)' : 'none'
          }}
          title="Click to filter by Internet & Phone Bills"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.telecom}
            </span>
            <Wifi size={14} style={{ color: '#1d4ed8' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
            {stats.telecomBillsTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hotline + Fiber
          </div>
        </div>

        {/* 5. Active Sales SIMs */}
        <div 
          onClick={() => setActiveSubTab('sims')}
          className="stat-card" 
          style={{ 
            background: activeSubTab === 'sims' ? 'rgba(180, 83, 9, 0.08)' : '#ffffff', 
            border: activeSubTab === 'sims' ? '2px solid #b45309' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeSubTab === 'sims' ? '0 2px 8px rgba(180, 83, 9, 0.15)' : 'none'
          }}
          title="Click to switch to Sales SIMs view"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.sims}
            </span>
            <Smartphone size={14} style={{ color: '#b45309' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {stats.activeSimCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Active Lines</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
            {stats.totalSimMonthlyCost.toLocaleString()} AED / mo
          </div>
        </div>

        {/* 6. Office Supplies & Consumables */}
        <div 
          onClick={() => { setCategoryFilter('Office Expenses & Supplies'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'Office Expenses & Supplies' ? 'rgba(201, 118, 42, 0.08)' : '#ffffff', 
            border: categoryFilter === 'Office Expenses & Supplies' ? '2px solid #c9762a' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'Office Expenses & Supplies' ? '0 2px 8px rgba(201, 118, 42, 0.15)' : 'none'
          }}
          title="Click to filter by Office Supplies"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.supplies}
            </span>
            <Coffee size={14} style={{ color: '#c9762a' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {stats.officeSuppliesTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Stationery & pantry
          </div>
        </div>

        {/* 7. Petty Cash Disbursements */}
        <div 
          onClick={() => { setCategoryFilter('Petty Cash Disbursements'); setStatusFilter('all'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'Petty Cash Disbursements' ? 'rgba(140, 91, 48, 0.08)' : '#ffffff', 
            border: categoryFilter === 'Petty Cash Disbursements' ? '2px solid var(--primary)' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: categoryFilter === 'Petty Cash Disbursements' ? '0 2px 8px rgba(140, 91, 48, 0.15)' : 'none'
          }}
          title="Click to filter by Petty Cash"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.pettyCash}
            </span>
            <CreditCard size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
            {stats.pettyCashTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Daily cash spent
          </div>
        </div>

        {/* 8. Upcoming Critical Renewals */}
        <div 
          onClick={() => { setStatusFilter('pending'); setActiveSubTab('expenses'); }}
          className="stat-card" 
          style={{ 
            background: statusFilter === 'pending' ? 'rgba(185, 28, 28, 0.08)' : '#fdfbf7', 
            border: statusFilter === 'pending' ? '2px solid #b91c1c' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: statusFilter === 'pending' ? '0 2px 8px rgba(185, 28, 28, 0.15)' : 'none'
          }}
          title="Click to show pending renewals"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.renewal}
            </span>
            <Clock size={14} style={{ color: '#b91c1c' }} />
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#b91c1c', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.nextRenewal ? stats.nextRenewal.category : 'Up to date'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {stats.nextRenewal ? `Due: ${(stats.nextRenewal.dueDate || '').split('-').reverse().join('/')}` : 'No renewals due'}
          </div>
        </div>

      </div>

      {/* SUB-TAB 1: COMPANY EXPENSES LEDGER */}
      {activeSubTab === 'expenses' && (
        <>

          {/* Expenses Table (Scrollable on mobile to show all details) */}
          <div className="table-responsive card" style={{ background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px', padding: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: '#fdfbf7', borderBottom: '1px solid #ede6d9', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DATE</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>CATEGORY</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>PAYMENT VIA</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DUE / RENEWAL</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>NOTES / DETAILS</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      <Building2 size={28} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontWeight: '600', fontSize: '13.5px' }}>No company expenses found matching criteria.</p>
                      <p style={{ fontSize: '11.5px', marginTop: '3px' }}>Click "Log Expense" above to record a new overhead item.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="clickable-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                      
                      {/* Date */}
                      <td style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12.5px' }}>
                        {(exp.date || '').split('-').reverse().join('/')}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '10px 14px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            ...getCategoryBadgeStyle(exp.category), 
                            fontWeight: '700', 
                            fontSize: '11px', 
                            padding: '3px 8px', 
                            borderRadius: '5px' 
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', fontSize: '13.5px' }}>
                        {parseFloat(exp.amount || 0).toLocaleString()} AED
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-main)' }}>
                        {exp.paymentMethod || 'Bank Transfer'}
                      </td>

                      {/* Due / Renewal Date */}
                      <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {exp.dueDate ? (exp.dueDate.split('-').reverse().join('/')) : 'N/A'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: exp.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : (exp.status === 'overdue' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'), 
                            color: exp.status === 'paid' ? '#047857' : (exp.status === 'overdue' ? '#b91c1c' : '#b45309'),
                            fontWeight: '700',
                            fontSize: '10.5px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {exp.status || 'Paid'}
                        </span>
                      </td>

                      {/* Notes / Details */}
                      <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-main)', maxWidth: '280px' }}>
                        {exp.notes ? (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.notes}>
                            {exp.notes}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                          <button 
                            onClick={() => handleOpenEditExpense(exp)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            title="Edit Record"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="btn"
                            style={{ padding: '3px 7px', fontSize: '11px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '5px' }}
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
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
          <div className="card" style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px' }}>
            
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Search phone, agent, role, plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              
              <select 
                className="form-control"
                value={simProviderFilter}
                onChange={(e) => setSimProviderFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '120px', fontSize: '12px' }}
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
                style={{ width: 'auto', minWidth: '110px', fontSize: '12px' }}
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
                  style={{ fontSize: '11px', padding: '5px 8px' }}
                >
                  Reset
                </button>
              )}

            </div>
          </div>

          {/* SIMs Directory Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {filteredSims.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px 16px', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px', color: 'var(--text-muted)' }}>
                <Smartphone size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: '700', fontSize: '14px' }}>No company SIM cards found.</p>
                <p style={{ fontSize: '11.5px', marginTop: '3px' }}>Click "Assign SIM" above to record a new phone line.</p>
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
                      borderRadius: '12px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 6px rgba(140, 91, 48, 0.04)'
                    }}
                  >
                    {/* SIM Card Header: Custom Card Label / Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede6d9', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {sim.cardLabel || 'SALES SIM LINE'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleOpenEditSim(sim)}
                        className="btn btn-secondary"
                        style={{ padding: '2px 7px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        title="Change SIM Card Label / Title"
                      >
                        <Edit2 size={10} /> Edit Label
                      </button>
                    </div>

                    {/* Card Top: Number & Provider */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                            {sim.phoneNumber}
                          </span>
                          <span 
                            className="badge" 
                            style={{ 
                              background: sim.provider === 'Du' ? 'rgba(59, 130, 246, 0.12)' : (sim.provider === 'Etisalat' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                              color: sim.provider === 'Du' ? '#1d4ed8' : (sim.provider === 'Etisalat' ? '#047857' : '#b91c1c'),
                              fontWeight: '700',
                              fontSize: '10px',
                              padding: '2px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            {sim.provider}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Plan: <strong style={{ color: 'var(--text-dark)' }}>{sim.planName || 'Business'}</strong> ({sim.monthlyCost} AED/mo)
                        </div>
                      </div>

                      <span 
                        className="badge" 
                        style={{ 
                          background: sim.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : (sim.status === 'spare' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(107, 114, 128, 0.12)'),
                          color: sim.status === 'active' ? '#047857' : (sim.status === 'spare' ? '#b45309' : '#374151'),
                          fontWeight: '700',
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {sim.status}
                      </span>
                    </div>

                    {/* Middle: Assigned Sales Agent & Role */}
                    <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            ASSIGNED SALES AGENT
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
                            {sim.assignedAgent || 'Unassigned / Company Spare'}
                          </div>
                        </div>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(140, 91, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Users size={14} />
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '4px', fontWeight: '600' }}>
                        Role: <span style={{ color: 'var(--text-dark)' }}>{sim.agentRole}</span>
                      </div>
                    </div>

                    {/* Bottom: Notes & Quick WhatsApp */}
                    {sim.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {sim.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
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
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
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
                        style={{ padding: '5px 8px', fontSize: '11px' }}
                        title="Edit SIM Details"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button 
                        onClick={() => handleDeleteSim(sim.id)}
                        className="btn"
                        style={{ padding: '5px 8px', fontSize: '11px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px' }}
                        title="Remove SIM"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add / Edit Expense Modal (Simplified per Image 1: Category, Amount, Date, Due, Method, Status, and Notes at the end) */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingExpense ? 'Edit Company Expense' : 'Log Company Expense'}
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                
                {/* Category Selection */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Expense Category / Type *</label>
                  <select 
                    className="form-control"
                    required
                    value={expenseFormData.category}
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">+ Add New Category / Type...</option>
                  </select>
                </div>

                {/* Amount */}
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

                {/* Date */}
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

                {/* Due Date */}
                <div className="form-group">
                  <label>Renewal / Due Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={expenseFormData.dueDate}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, dueDate: e.target.value })}
                  />
                </div>

                {/* Invoice No */}
                <div className="form-group">
                  <label>Invoice / Receipt No</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. INV-2026-8819"
                    value={expenseFormData.invoiceNo}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, invoiceNo: e.target.value })}
                  />
                </div>

                {/* Payment Method */}
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

                {/* Status */}
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

                {/* Note at the end of expense form for details (Exact user requirement from Image 1) */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Note / Description (Details)</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Add details, policy numbers, or extra notes for this expense..."
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {isAddCategoryOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                Add Company Expense Category
              </h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleAddNewCategory}>
              <div className="form-group">
                <label>Category Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="e.g. Software Subscriptions, Legal Consultant..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit SIM Modal */}
      {isSimModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingSim ? 'Edit Sales SIM Assignment' : 'Assign New Sales SIM'}
              </h3>
              <button onClick={() => setIsSimModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveSim}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Card Label / Line Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. VIP Inbound Hotline, Desert Safari Dispatch, Online Leads"
                    value={simFormData.cardLabel}
                    onChange={(e) => setSimFormData({ ...simFormData, cardLabel: e.target.value })}
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Title displayed at the top of this sales SIM card.
                  </span>
                </div>

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
                  <label>Assigned Sales Agent *</label>
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
                  <label>Agent Role / Department *</label>
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
                  <label>Monthly Cost (AED)</label>
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
                    <option value="spare">Spare</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes & Allocation Details</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Handset model, WhatsApp campaign target, or notes..."
                    value={simFormData.notes}
                    onChange={(e) => setSimFormData({ ...simFormData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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

      {/* Dedicated View & Print Report Modal */}
      {isReportModalOpen && (
        <div className="modal-overlay report-modal-overlay" style={{ zIndex: 2200, padding: '20px' }}>
          <div 
            className="modal-content report-print-container" 
            style={{ 
              maxWidth: '820px', 
              width: '100%', 
              borderRadius: '16px', 
              padding: '28px', 
              background: '#ffffff', 
              border: '1.5px solid #ede6d9',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header / Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #ede6d9', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                  {categoryFilter !== 'all' ? `${categoryFilter} Statement` : 'Company Overheads & Operating Expenses Report'}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Scope: {categoryFilter === 'all' ? 'All Operating Categories' : categoryFilter} | {reportStartDate || reportEndDate ? `${(reportStartDate || 'Start').split('-').reverse().join('/')} to ${(reportEndDate || 'Present').split('-').reverse().join('/')}` : 'All Recorded Dates'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Interactive Date Range Selector for Report (Per Image 2) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fdfbf7', padding: '4px 8px', borderRadius: '8px', border: '1px solid #ede6d9' }}>
                  <Calendar size={13} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Dates:</span>
                  <input 
                    type="date" 
                    value={reportStartDate} 
                    onChange={(e) => setReportStartDate(e.target.value)} 
                    className="form-control"
                    style={{ width: 'auto', fontSize: '11px', height: '28px', padding: '2px 6px' }}
                    title="Report start date"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
                  <input 
                    type="date" 
                    value={reportEndDate} 
                    onChange={(e) => setReportEndDate(e.target.value)} 
                    className="form-control"
                    style={{ width: 'auto', fontSize: '11px', height: '28px', padding: '2px 6px' }}
                    title="Report end date"
                  />
                  <button 
                    type="button"
                    onClick={() => { setReportStartDate(`${currentMonthPrefix}-01`); setReportEndDate(todayStr); }}
                    className="btn btn-secondary"
                    style={{ fontSize: '10px', padding: '2px 6px', height: '28px' }}
                  >
                    This Month
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setReportStartDate(''); setReportEndDate(''); }}
                    className="btn btn-secondary"
                    style={{ fontSize: '10px', padding: '2px 6px', height: '28px' }}
                  >
                    All
                  </button>
                </div>

                {/* Category Scope Selector inside Report */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '11.5px', height: '32px', fontWeight: '700', color: 'var(--primary)' }}
                >
                  <option value="all">All Overheads</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button 
                  onClick={handleExportCSV}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px' }}
                >
                  <Download size={14} /> Export CSV
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px' }}
                >
                  <Printer size={14} /> Print Statement
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="modal-close"
                  style={{ marginLeft: '4px' }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Report Content */}
            <div className="printable-report-body" style={{ color: '#374151' }}>
              
              {/* Report Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #8c5b30', paddingBottom: '14px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#543c2b', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                    ROAR ADVENTURE TOURISM LLC
                  </h1>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                    DWTC Complex, Sheikh Zayed Road, Dubai, UAE | Commercial License No: DET-2016-01
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#8c5b30', marginTop: '6px' }}>
                    {categoryFilter !== 'all' ? `OFFICIAL OVERHEADS STATEMENT - ${categoryFilter.toUpperCase()}` : 'OFFICIAL COMPANY OVERHEADS STATEMENT'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  <div>Date Generated: <strong style={{ color: '#111827' }}>{todayStr.split('-').reverse().join('/')}</strong></div>
                  <div>Report Scope: <strong style={{ color: '#8c5b30' }}>{categoryFilter === 'all' ? 'All Operating Categories' : categoryFilter}</strong></div>
                  <div>Selected Dates: <strong style={{ color: '#111827' }}>{reportStartDate || reportEndDate ? `${(reportStartDate || 'Start').split('-').reverse().join('/')} - ${(reportEndDate || 'Present').split('-').reverse().join('/')}` : 'All Time'}</strong></div>
                  <div>Expense Items: <strong style={{ color: '#111827' }}>{reportExpenses.length}</strong></div>
                </div>
              </div>

              {/* Summary Scorecards in Report */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                    {categoryFilter !== 'all' ? `TOTAL (${categoryFilter.substring(0, 14)}...)` : 'TOTAL OVERHEADS'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#8c5b30', marginTop: '4px' }}>
                    {reportTotal.toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>TRADE & GDRFA</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                    {reportLicensingTotal.toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>OFFICE RENT</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#374151', marginTop: '4px' }}>
                    {reportRentTotal.toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>TELECOM & PHONE</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1d4ed8', marginTop: '4px' }}>
                    {reportTelecomTotal.toLocaleString()} AED
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table - ONLY SHOWN IF ALL CATEGORIES SELECTED OR MULTIPLE FOUND */}
              {categoryFilter === 'all' && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#543c2b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Overheads Breakdown by Category ({reportStartDate || reportEndDate ? `${(reportStartDate || 'Start').split('-').reverse().join('/')} to ${(reportEndDate || 'Present').split('-').reverse().join('/')}` : 'All Dates'})
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #ede6d9' }}>
                    <thead>
                      <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', fontWeight: '800' }}>CATEGORY</th>
                        <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'center' }}>ITEMS</th>
                        <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>TOTAL AMOUNT (AED)</th>
                        <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>% SHARE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => {
                        const catItems = reportExpenses.filter(e => e.category === cat);
                        const catTotal = catItems.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                        const sharePct = reportTotal > 0 ? ((catTotal / reportTotal) * 100).toFixed(1) : '0.0';

                        if (catItems.length === 0) return null;

                        return (
                          <tr key={cat} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', fontWeight: '700' }}>{cat}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>{catItems.length}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: catTotal > 0 ? '#8c5b30' : '#9ca3af' }}>
                              {catTotal.toLocaleString()} AED
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#6b7280' }}>
                              {sharePct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Itemized Expenses Table */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#543c2b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Itemized Expenses Ledger ({reportExpenses.length} Records)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', border: '1px solid #ede6d9' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>DATE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>CATEGORY</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>AMOUNT (AED)</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>PAYMENT VIA</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>DUE DATE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>STATUS</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>NOTES / DETAILS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                          No expenses recorded in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      reportExpenses.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '7px 10px' }}>{(item.date || '').split('-').reverse().join('/')}</td>
                          <td style={{ padding: '7px 10px', fontWeight: '700' }}>{item.category}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '800', color: '#8c5b30' }}>
                            {parseFloat(item.amount || 0).toLocaleString()} AED
                          </td>
                          <td style={{ padding: '7px 10px', color: '#4b5563' }}>{item.paymentMethod || 'Bank Transfer'}</td>
                          <td style={{ padding: '7px 10px', color: '#6b7280' }}>
                            {item.dueDate ? (item.dueDate.split('-').reverse().join('/')) : '—'}
                          </td>
                          <td style={{ padding: '7px 10px', textTransform: 'capitalize', fontWeight: '700', color: item.status === 'paid' ? '#047857' : '#b45309' }}>
                            {item.status || 'Paid'}
                          </td>
                          <td style={{ padding: '7px 10px', color: '#6b7280' }}>{item.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fdfbf7', borderTop: '2px solid #8c5b30', fontWeight: '800' }}>
                      <td colSpan="2" style={{ padding: '10px', textAlign: 'right' }}>
                        TOTAL ({categoryFilter !== 'all' ? categoryFilter.toUpperCase() : 'CORPORATE OVERHEADS'}):
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#8c5b30', fontSize: '13px' }}>
                        {reportTotal.toLocaleString()} AED
                      </td>
                      <td colSpan="4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Report Footer / Signature Line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #ede6d9', fontSize: '11px', color: '#6b7280' }}>
                <div>Roar Adventure Tourism ERP • Corporate Accounting Ledger</div>
                <div style={{ textAlign: 'right' }}>
                  <div>Executive Management Approval</div>
                  <div style={{ marginTop: '20px', borderBottom: '1px solid #9ca3af', width: '180px' }}></div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Edit Card Labels Modal */}
      {isEditCardLabelsOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', borderRadius: '14px', padding: '22px', background: '#ffffff', border: '1.5px solid #ede6d9', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                  Customize 8 Overheads Card Header Labels
                </h3>
              </div>
              <button onClick={() => setIsEditCardLabelsOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsEditCardLabelsOpen(false); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Card 1 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.total} 
                    onChange={(e) => setCardLabels({ ...cardLabels, total: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 2 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.license} 
                    onChange={(e) => setCardLabels({ ...cardLabels, license: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 3 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.rent} 
                    onChange={(e) => setCardLabels({ ...cardLabels, rent: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 4 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.telecom} 
                    onChange={(e) => setCardLabels({ ...cardLabels, telecom: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 5 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.sims} 
                    onChange={(e) => setCardLabels({ ...cardLabels, sims: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 6 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.supplies} 
                    onChange={(e) => setCardLabels({ ...cardLabels, supplies: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 7 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.pettyCash} 
                    onChange={(e) => setCardLabels({ ...cardLabels, pettyCash: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 8 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.renewal} 
                    onChange={(e) => setCardLabels({ ...cardLabels, renewal: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setCardLabels(DEFAULT_COMPANY_CARD_LABELS)} 
                  className="btn btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  Reset Defaults
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setIsEditCardLabelsOpen(false)} className="btn btn-secondary">
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Labels
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
