import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Car, 
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
  Disc, 
  Droplet, 
  ShieldCheck, 
  FileText, 
  Clock,
  Sparkles
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Car Passing',
  'Tyre Change',
  'Oil Change',
  'Floor Mats & Detailing',
  'Accidents & Body Repair',
  'Insurance Renewal',
  'Mulkiya Renewals',
  'Battery & Brake Pads',
  'Miscellaneous Car Expenses'
];

const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'Petty Cash',
  'Company Cheque'
];

export default function CarExpensesView({ 
  carExpenses = [], 
  setCarExpenses, 
  cars = [], 
  drivers = [],
  companyId = 'roar'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [carFilter, setCarFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, this_month, last_month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    plateNo: cars[0]?.plateNo || '48590',
    carId: cars[0]?.id || 'car-48590',
    category: 'Oil Change',
    amount: '',
    date: todayStr,
    driverName: drivers[0]?.name || '',
    workshopName: '',
    invoiceNo: '',
    odometer: '',
    paymentMethod: 'Cash',
    status: 'paid',
    notes: ''
  });

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      plateNo: cars[0]?.plateNo || '48590',
      carId: cars[0]?.id || 'car-48590',
      category: 'Oil Change',
      amount: '',
      date: todayStr,
      driverName: drivers[0]?.name || '',
      workshopName: '',
      invoiceNo: '',
      odometer: '',
      paymentMethod: 'Cash',
      status: 'paid',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      plateNo: expense.plateNo || '',
      carId: expense.carId || '',
      category: expense.category || 'Oil Change',
      amount: expense.amount || '',
      date: expense.date || todayStr,
      driverName: expense.driverName || '',
      workshopName: expense.workshopName || '',
      invoiceNo: expense.invoiceNo || '',
      odometer: expense.odometer || '',
      paymentMethod: expense.paymentMethod || 'Cash',
      status: expense.status || 'paid',
      notes: expense.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleCarSelectChange = (plateNo) => {
    const matchedCar = cars.find(c => c.plateNo === plateNo);
    setFormData(prev => ({
      ...prev,
      plateNo,
      carId: matchedCar?.id || `car-${plateNo}`,
      driverName: matchedCar?.owner || prev.driverName
    }));
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      odometer: parseInt(formData.odometer) || 0,
      id: editingExpense ? editingExpense.id : `carexp-${Date.now()}`
    };

    let updatedList;
    if (editingExpense) {
      updatedList = carExpenses.map(item => item.id === editingExpense.id ? payload : item);
    } else {
      updatedList = [payload, ...carExpenses];
    }

    setCarExpenses(updatedList);
    setIsModalOpen(false);

    // Sync with backend API
    try {
      fetch(`api.php?action=save&table=car_expenses&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Failed to sync car expense to MySQL:', err));
    } catch (err) {
      console.warn('Network error saving car expense:', err);
    }
  };

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Are you sure you want to delete this car expense record?')) return;
    const updatedList = carExpenses.filter(item => item.id !== id);
    setCarExpenses(updatedList);

    try {
      fetch(`api.php?action=delete&table=car_expenses&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.warn('Failed to delete car expense from MySQL:', err));
    } catch (err) {
      console.warn('Network error deleting car expense:', err);
    }
  };

  // Date helpers for filtering
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = new Date(lastMonthDate.getTime() - lastMonthDate.getTimezoneOffset() * 60000).toISOString().substring(0, 7);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return carExpenses.filter(item => {
      // Search
      const searchMatch = !searchTerm || 
        (item.plateNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.workshopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Category
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

      // Car
      const carMatch = carFilter === 'all' || item.plateNo === carFilter;

      // Date
      let dateMatch = true;
      if (dateFilter === 'this_month') {
        dateMatch = (item.date || '').startsWith(currentMonthPrefix);
      } else if (dateFilter === 'last_month') {
        dateMatch = (item.date || '').startsWith(lastMonthPrefix);
      } else if (dateFilter === 'custom') {
        if (customStartDate) dateMatch = dateMatch && item.date >= customStartDate;
        if (customEndDate) dateMatch = dateMatch && item.date <= customEndDate;
      }

      return searchMatch && categoryMatch && carMatch && dateMatch;
    });
  }, [carExpenses, searchTerm, categoryFilter, carFilter, dateFilter, customStartDate, customEndDate, currentMonthPrefix, lastMonthPrefix]);

  // 8 KPI Report Calculations
  const stats = useMemo(() => {
    const totalFleetExpense = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 1. Routine Service & Oil
    const oilServiceTotal = filteredExpenses
      .filter(item => item.category === 'Oil Change')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const oilCount = filteredExpenses.filter(item => item.category === 'Oil Change').length;

    // 2. Tyres & Detailing
    const tyreDetailingTotal = filteredExpenses
      .filter(item => item.category === 'Tyre Change' || item.category === 'Floor Mats & Detailing')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 3. RTA Passing & Mulkiya
    const rtaMulkiyaTotal = filteredExpenses
      .filter(item => item.category === 'Car Passing' || item.category === 'Mulkiya Renewals')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 4. Insurance Total
    const insuranceTotal = filteredExpenses
      .filter(item => item.category === 'Insurance Renewal')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 5. Accidents & Repairs
    const accidentRepairsTotal = filteredExpenses
      .filter(item => item.category === 'Accidents & Body Repair' || item.category === 'Battery & Brake Pads')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 6. Top Expensed Vehicle
    const carTotalsMap = {};
    filteredExpenses.forEach(item => {
      const plate = item.plateNo || 'Unknown';
      carTotalsMap[plate] = (carTotalsMap[plate] || 0) + (parseFloat(item.amount) || 0);
    });
    let topCarPlate = 'N/A';
    let topCarAmount = 0;
    Object.entries(carTotalsMap).forEach(([plate, amount]) => {
      if (amount > topCarAmount) {
        topCarAmount = amount;
        topCarPlate = plate;
      }
    });

    // 7. This Month's Fleet Maintenance
    const thisMonthTotal = carExpenses
      .filter(item => (item.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // 8. Pending / Unpaid Maintenance
    const pendingInvoices = filteredExpenses.filter(item => item.status === 'pending');
    const pendingAmount = pendingInvoices.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return {
      totalFleetExpense,
      oilServiceTotal,
      oilCount,
      tyreDetailingTotal,
      rtaMulkiyaTotal,
      insuranceTotal,
      accidentRepairsTotal,
      topCarPlate,
      topCarAmount,
      thisMonthTotal,
      pendingCount: pendingInvoices.length,
      pendingAmount
    };
  }, [filteredExpenses, carExpenses, currentMonthPrefix]);

  const handlePrint = () => {
    window.print();
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'Car Passing':
      case 'Mulkiya Renewals':
        return { background: 'rgba(5, 150, 105, 0.12)', color: '#047857', border: '1px solid rgba(5, 150, 105, 0.25)' };
      case 'Oil Change':
        return { background: 'rgba(201, 118, 42, 0.12)', color: '#8c5b30', border: '1px solid rgba(201, 118, 42, 0.25)' };
      case 'Tyre Change':
      case 'Floor Mats & Detailing':
        return { background: 'rgba(217, 119, 6, 0.12)', color: '#b45309', border: '1px solid rgba(217, 119, 6, 0.25)' };
      case 'Accidents & Body Repair':
        return { background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'Insurance Renewal':
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.25)' };
      default:
        return { background: 'rgba(140, 91, 48, 0.08)', color: '#5c3d20', border: '1px solid rgba(140, 91, 48, 0.15)' };
    }
  };

  return (
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
            Car Expenses & Fleet Maintenance
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage RTA passing, tyre replacements, oil changes, detailing, accidents, insurance, and Mulkiya renewals.
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

          <button 
            onClick={handleOpenAddModal}
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)' }}
          >
            <Plus size={16} /> Log Car Expense
          </button>
        </div>
      </div>

      {/* 8 KPI & Report Cards Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        {/* 1. Total Fleet Expenses */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL FLEET SPEND
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>
            {stats.totalFleetExpense.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filteredExpenses.length} maintenance records
          </div>
        </div>

        {/* 2. Routine Oil & Service */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OIL & LUBE SERVICE
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(201, 118, 42, 0.1)', color: '#c9762a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            {stats.oilServiceTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.oilCount} scheduled oil services
          </div>
        </div>

        {/* 3. Tyres & Detailing */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TYRES & DETAILING
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.1)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Disc size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            {stats.tyreDetailingTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tyre replacements & mats
          </div>
        </div>

        {/* 4. RTA Passing & Mulkiya */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              RTA PASSING & MULKIYA
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.1)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '8px' }}>
            {stats.rtaMulkiyaTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Passing & registration cards
          </div>
        </div>

        {/* 5. Insurance Total */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MOTOR INSURANCE
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '8px' }}>
            {stats.insuranceTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Commercial policy premiums
          </div>
        </div>

        {/* 6. Accidents & Repairs */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACCIDENTS & BRAKES
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '8px' }}>
            {stats.accidentRepairsTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Body repairs & brake pads
          </div>
        </div>

        {/* 7. Top Expensed Vehicle */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOP EXPENSED CAR
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            Plate #{stats.topCarPlate}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', marginTop: '4px' }}>
            {stats.topCarAmount.toLocaleString()} AED total cost
          </div>
        </div>

        {/* 8. This Month's Fleet Maintenance */}
        <div className="stat-card" style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              THIS MONTH (AUG)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '8px' }}>
            {stats.thisMonthTotal.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current month maintenance
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px' }}>
        
        {/* Left: Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search by plate, workshop, invoice, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Middle & Right: Category, Car & Date Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          
          {/* Category Filter */}
          <select 
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Car Plate Filter */}
          <select 
            className="form-control"
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="all">All Vehicles</option>
            {Array.from(new Set(cars.map(c => c.plateNo).filter(Boolean))).map(plate => (
              <option key={plate} value={plate}>Plate #{plate}</option>
            ))}
          </select>

          {/* Date Filter */}
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

          {(searchTerm || categoryFilter !== 'all' || carFilter !== 'all' || dateFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setCarFilter('all');
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
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>VEHICLE / PLATE</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>EXPENSE CATEGORY</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT (AED)</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DRIVER / ASSIGNED</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>WORKSHOP / VENDOR</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>INVOICE / ODO</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  <Wrench size={32} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>No car expenses found matching criteria.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Log Car Expense" above to add a new maintenance entry.</p>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="clickable-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  
                  {/* Date */}
                  <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px' }}>
                    {(exp.date || '').split('-').reverse().join('/')}
                  </td>

                  {/* Vehicle / Plate */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '13px', background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>
                        #{exp.plateNo}
                      </span>
                    </div>
                  </td>

                  {/* Expense Category */}
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
                    {exp.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.notes}
                      </div>
                    )}
                  </td>

                  {/* Amount (AED) */}
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                    {parseFloat(exp.amount || 0).toLocaleString()} AED
                  </td>

                  {/* Driver / Assigned */}
                  <td style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600' }}>
                    {exp.driverName || 'N/A'}
                  </td>

                  {/* Workshop / Vendor */}
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-main)' }}>
                    {exp.workshopName || 'General Garage'}
                    {exp.paymentMethod && (
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                        via {exp.paymentMethod}
                      </span>
                    )}
                  </td>

                  {/* Invoice / Odometer */}
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div>Inv: <strong style={{ color: 'var(--text-dark)' }}>{exp.invoiceNo || 'N/A'}</strong></div>
                    {exp.odometer > 0 && <div>Odo: {exp.odometer.toLocaleString()} KM</div>}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: exp.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                        color: exp.status === 'paid' ? '#047857' : '#b45309',
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
                        onClick={() => handleOpenEditModal(exp)}
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '16px', padding: '24px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingExpense ? 'Edit Car Expense Record' : 'Log New Car Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                {/* Car Plate Selection */}
                <div className="form-group">
                  <label>Vehicle Plate No *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.plateNo}
                    onChange={(e) => handleCarSelectChange(e.target.value)}
                  >
                    {cars.map(c => (
                      <option key={c.id} value={c.plateNo}>
                        Plate #{c.plateNo} - {c.brand} ({c.owner || 'Fleet'})
                      </option>
                    ))}
                    {!cars.some(c => c.plateNo === formData.plateNo) && (
                      <option value={formData.plateNo}>Plate #{formData.plateNo}</option>
                    )}
                  </select>
                </div>

                {/* Expense Category */}
                <div className="form-group">
                  <label>Expense Category *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount (AED) */}
                <div className="form-group">
                  <label>Amount (AED) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-control" 
                    required
                    placeholder="e.g. 350"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                {/* Date */}
                <div className="form-group">
                  <label>Expense Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                {/* Driver / Requester */}
                <div className="form-group">
                  <label>Driver / Requester</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Jaspreen"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </div>

                {/* Workshop / Garage Name */}
                <div className="form-group">
                  <label>Workshop / Vendor Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. QuickFit Auto Services"
                    value={formData.workshopName}
                    onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                  />
                </div>

                {/* Invoice / Receipt No */}
                <div className="form-group">
                  <label>Invoice / Receipt No</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. INV-88219"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  />
                </div>

                {/* Odometer (KM) */}
                <div className="form-group">
                  <label>Odometer Reading (KM)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-control" 
                    placeholder="e.g. 142500"
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  />
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    className="form-control"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div className="form-group">
                  <label>Payment Status</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes & Service Description</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Provide details about replaced parts, guarantee, or inspection status..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '18px', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
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

    </div>
  );
}
