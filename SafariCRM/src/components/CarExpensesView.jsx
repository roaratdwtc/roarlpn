import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  Layers,
  X
} from 'lucide-react';

// The 7 Official Roar Company Fleet Vehicles (Plates only, no driver details)
export const DEFAULT_ROAR_PLATES = [
  'FF79157',
  'DD21596',
  'G25801',
  'D16197',
  'I49209',
  'BB23370',
  'DD50781'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
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
  companyId = 'roar'
}) {
  // Category management (dynamic - allow adding more types later)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_car_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_EXPENSE_CATEGORIES;
  });

  // Fleet plates management (dynamic - allow adding more plates later)
  const [fleetPlates, setFleetPlates] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_car_fleet_plates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ROAR_PLATES;
  });

  useEffect(() => {
    localStorage.setItem('safari_car_expense_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('safari_car_fleet_plates', JSON.stringify(fleetPlates));
  }, [fleetPlates]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPlateFilter, setSelectedPlateFilter] = useState('all'); // 'all' or plate string
  const [dateFilter, setDateFilter] = useState('all'); // all, this_month, last_month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Add Category Modal / Inline State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add Custom Plate Modal / Inline State
  const [isAddPlateOpen, setIsAddPlateOpen] = useState(false);
  const [newPlateNumber, setNewPlateNumber] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    plateNo: fleetPlates[0] || 'FF79157',
    carId: `car-${(fleetPlates[0] || 'FF79157').toLowerCase()}`,
    category: 'Oil Change',
    amount: '',
    date: todayStr,
    workshopName: '',
    invoiceNo: '',
    odometer: '',
    paymentMethod: 'Cash',
    status: 'paid',
    notes: ''
  });

  const handleOpenAddModal = (initialPlate = null) => {
    setEditingExpense(null);
    const targetPlate = initialPlate || (selectedPlateFilter !== 'all' ? selectedPlateFilter : fleetPlates[0] || 'FF79157');
    setFormData({
      plateNo: targetPlate,
      carId: `car-${targetPlate.toLowerCase()}`,
      category: categories[0] || 'Oil Change',
      amount: '',
      date: todayStr,
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
      plateNo: expense.plateNo || fleetPlates[0] || 'FF79157',
      carId: expense.carId || `car-${(expense.plateNo || '').toLowerCase()}`,
      category: expense.category || 'Oil Change',
      amount: expense.amount || '',
      date: expense.date || todayStr,
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
    if (plateNo === '__add_new__') {
      setIsAddPlateOpen(true);
      return;
    }
    setFormData(prev => ({
      ...prev,
      plateNo,
      carId: `car-${plateNo.toLowerCase()}`
    }));
  };

  const handleCategorySelectChange = (category) => {
    if (category === '__add_new__') {
      setIsAddCategoryOpen(true);
      return;
    }
    setFormData(prev => ({
      ...prev,
      category
    }));
  };

  const handleAddNewCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      setFormData(prev => ({ ...prev, category: trimmed }));
    }
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
  };

  const handleAddNewPlate = (e) => {
    e.preventDefault();
    const trimmed = newPlateNumber.trim().toUpperCase().replace(/\s+/g, '');
    if (!trimmed) return;
    if (!fleetPlates.includes(trimmed)) {
      const updated = [...fleetPlates, trimmed];
      setFleetPlates(updated);
      setFormData(prev => ({ ...prev, plateNo: trimmed, carId: `car-${trimmed.toLowerCase()}` }));
    }
    setNewPlateNumber('');
    setIsAddPlateOpen(false);
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
  const currentMonthPrefix = todayStr.substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = new Date(lastMonthDate.getTime() - lastMonthDate.getTimezoneOffset() * 60000).toISOString().substring(0, 7);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return carExpenses.filter(item => {
      const searchMatch = !searchTerm || 
        (item.plateNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.workshopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      const plateMatch = selectedPlateFilter === 'all' || item.plateNo === selectedPlateFilter;

      let dateMatch = true;
      if (dateFilter === 'this_month') {
        dateMatch = (item.date || '').startsWith(currentMonthPrefix);
      } else if (dateFilter === 'last_month') {
        dateMatch = (item.date || '').startsWith(lastMonthPrefix);
      } else if (dateFilter === 'custom') {
        if (customStartDate) dateMatch = dateMatch && item.date >= customStartDate;
        if (customEndDate) dateMatch = dateMatch && item.date <= customEndDate;
      }

      return searchMatch && categoryMatch && plateMatch && dateMatch;
    });
  }, [carExpenses, searchTerm, categoryFilter, selectedPlateFilter, dateFilter, customStartDate, customEndDate, currentMonthPrefix, lastMonthPrefix]);

  // Per-car expenditure summary across fleet plates
  const carExpensesMap = useMemo(() => {
    const map = {};
    fleetPlates.forEach(plate => { map[plate] = 0; });
    carExpenses.forEach(exp => {
      if (map[exp.plateNo] !== undefined) {
        map[exp.plateNo] += parseFloat(exp.amount) || 0;
      } else {
        map[exp.plateNo] = parseFloat(exp.amount) || 0;
      }
    });
    return map;
  }, [carExpenses, fleetPlates]);

  // 8 KPI Report Calculations with short, crisp titles
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

    // 6. Top Expensed Vehicle (Plate only, no driver name)
    let topCarPlate = 'N/A';
    let topCarAmount = 0;
    Object.entries(carExpensesMap).forEach(([plate, amt]) => {
      if (amt > topCarAmount) {
        topCarAmount = amt;
        topCarPlate = plate;
      }
    });

    // 7. This Month's Fleet Maintenance
    const thisMonthTotal = carExpenses
      .filter(item => (item.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

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
      thisMonthTotal
    };
  }, [filteredExpenses, carExpenses, carExpensesMap, currentMonthPrefix]);

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Plate", "Category", "Amount AED", "Workshop", "Invoice No", "Odometer", "Payment Method", "Status", "Notes"];
    const rows = filteredExpenses.map(e => [
      e.date || '',
      e.plateNo || '',
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.workshopName || '').replace(/"/g, '""')}"`,
      e.invoiceNo || '',
      e.odometer || '',
      e.paymentMethod || '',
      e.status || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Car_Expenses_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
              Fleet Car Expenses
            </h2>
            <span 
              className="badge" 
              style={{ background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', fontWeight: '800', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
            >
              {fleetPlates.length} Cars
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Vehicle maintenance records by number plate.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleOpenReport}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <Printer size={14} /> Print Report
          </button>

          <button 
            onClick={() => setIsAddCategoryOpen(true)}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px' }}
          >
            <Plus size={14} /> Add Type
          </button>

          <button 
            onClick={() => handleOpenAddModal()}
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
          >
            <Plus size={14} /> Log Expense
          </button>
        </div>
      </div>

      {/* Fleet Cars Selector Strip (Plate numbers only, clean mobile cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            FLEET VEHICLES ({fleetPlates.length})
          </span>
          {selectedPlateFilter !== 'all' && (
            <button 
              onClick={() => setSelectedPlateFilter('all')} 
              className="btn btn-secondary" 
              style={{ fontSize: '10.5px', padding: '2px 8px' }}
            >
              Show All
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
          {fleetPlates.map(plate => {
            const isSelected = selectedPlateFilter === plate;
            const totalCarSpent = carExpensesMap[plate] || 0;

            return (
              <div 
                key={plate}
                onClick={() => setSelectedPlateFilter(isSelected ? 'all' : plate)}
                style={{
                  background: isSelected ? 'rgba(140, 91, 48, 0.1)' : '#ffffff',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid #ede6d9',
                  borderRadius: '10px',
                  padding: '10px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: isSelected ? '0 2px 8px rgba(140, 91, 48, 0.15)' : 'none'
                }}
              >
                <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '12px' }}>
                  #{plate}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: totalCarSpent > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {totalCarSpent.toLocaleString()} AED
                </div>
              </div>
            );
          })}

          <div 
            onClick={() => setIsAddPlateOpen(true)}
            style={{
              background: '#fdfbf7',
              border: '1px dashed #d1c7b7',
              borderRadius: '10px',
              padding: '10px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: 'var(--primary)',
              fontSize: '11.5px',
              fontWeight: '700'
            }}
            title="Add another plate to fleet"
          >
            <Plus size={13} /> Add Car
          </div>
        </div>
      </div>

      {/* 8 KPI & Report Cards Grid (Short, crisp labels for mobile) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '8px' }}>
        
        {/* 1. Total Fleet Expenses */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TOTAL SPEND
            </span>
            <Wrench size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
            {stats.totalFleetExpense.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {filteredExpenses.length} records
          </div>
        </div>

        {/* 2. Routine Oil & Service */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              OIL CHANGE
            </span>
            <Droplet size={14} style={{ color: '#c9762a' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {stats.oilServiceTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {stats.oilCount} services
          </div>
        </div>

        {/* 3. Tyres & Detailing */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TYRES & MATS
            </span>
            <Disc size={14} style={{ color: '#b45309' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {stats.tyreDetailingTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tyres & floor mats
          </div>
        </div>

        {/* 4. RTA Passing & Mulkiya */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              PASSING / REG
            </span>
            <ShieldCheck size={14} style={{ color: '#047857' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {stats.rtaMulkiyaTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            RTA test & cards
          </div>
        </div>

        {/* 5. Insurance Total */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              INSURANCE
            </span>
            <FileText size={14} style={{ color: '#1d4ed8' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
            {stats.insuranceTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Motor policies
          </div>
        </div>

        {/* 6. Accidents & Repairs */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              REPAIRS / BRAKES
            </span>
            <AlertCircle size={14} style={{ color: '#b91c1c' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
            {stats.accidentRepairsTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Repairs & brakes
          </div>
        </div>

        {/* 7. Top Expensed Vehicle (Plate only) */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              HIGHEST SPEND
            </span>
            <Car size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px', fontFamily: 'monospace' }}>
            #{stats.topCarPlate}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
            {stats.topCarAmount.toLocaleString()} AED total
          </div>
        </div>

        {/* 8. This Month's Fleet Maintenance */}
        <div className="stat-card" style={{ background: '#fdfbf7', border: '1px solid #ede6d9', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              THIS MONTH
            </span>
            <Clock size={14} style={{ color: '#047857' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {stats.thisMonthTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Current month
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px' }}>
        
        {/* Left: Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search plate, workshop, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '12.5px' }}
          />
        </div>

        {/* Middle & Right: Category, Car & Date Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          
          {/* Category Filter */}
          <select 
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px', fontSize: '12px' }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Car Plate Filter */}
          <select 
            className="form-control"
            value={selectedPlateFilter}
            onChange={(e) => setSelectedPlateFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '130px', fontSize: '12px' }}
          >
            <option value="all">All Plates</option>
            {fleetPlates.map(plate => (
              <option key={plate} value={plate}>Plate #{plate}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select 
            className="form-control"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '110px', fontSize: '12px' }}
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
                style={{ width: 'auto', fontSize: '11.5px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ width: 'auto', fontSize: '11.5px' }}
              />
            </div>
          )}

          {(searchTerm || categoryFilter !== 'all' || selectedPlateFilter !== 'all' || dateFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setSelectedPlateFilter('all');
                setDateFilter('all');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '5px 8px' }}
            >
              Reset
            </button>
          )}

        </div>
      </div>

      {/* Expenses Table (Completely removed driver name column) */}
      <div className="table-responsive card" style={{ background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px', padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fdfbf7', borderBottom: '1px solid #ede6d9', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DATE</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>PLATE</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>CATEGORY</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>WORKSHOP</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>INV / ODO</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <Wrench size={28} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontWeight: '600', fontSize: '13.5px' }}>No car expenses found.</p>
                  <p style={{ fontSize: '11.5px', marginTop: '3px' }}>Click "Log Expense" above to record a new entry.</p>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="clickable-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  
                  {/* Date */}
                  <td style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12.5px' }}>
                    {(exp.date || '').split('-').reverse().join('/')}
                  </td>

                  {/* Plate */}
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '12.5px', background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>
                      #{exp.plateNo}
                    </span>
                  </td>

                  {/* Expense Category */}
                  <td style={{ padding: '10px 14px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        ...getCategoryBadgeStyle(exp.category), 
                        fontWeight: '700', 
                        fontSize: '10.5px', 
                        padding: '3px 7px', 
                        borderRadius: '5px' 
                      }}
                    >
                      {exp.category}
                    </span>
                    {exp.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.notes}
                      </div>
                    )}
                  </td>

                  {/* Amount (AED) */}
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', fontSize: '13.5px' }}>
                    {parseFloat(exp.amount || 0).toLocaleString()} AED
                  </td>

                  {/* Workshop / Vendor */}
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-main)' }}>
                    {exp.workshopName || 'General Garage'}
                    {exp.paymentMethod && (
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                        via {exp.paymentMethod}
                      </span>
                    )}
                  </td>

                  {/* Invoice / Odometer */}
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div>Inv: <strong style={{ color: 'var(--text-dark)' }}>{exp.invoiceNo || 'N/A'}</strong></div>
                    {exp.odometer > 0 && <div>Odo: {exp.odometer.toLocaleString()} KM</div>}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: exp.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                        color: exp.status === 'paid' ? '#047857' : '#b45309',
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

                  {/* Actions */}
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                      <button 
                        onClick={() => handleOpenEditModal(exp)}
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

      {/* Add / Edit Expense Modal (No driver fields, purely vehicle & maintenance) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                {editingExpense ? 'Edit Car Expense' : 'Log Car Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                
                {/* Vehicle Plate Selection */}
                <div className="form-group">
                  <label>Vehicle Plate No *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.plateNo}
                    onChange={(e) => handleCarSelectChange(e.target.value)}
                  >
                    {fleetPlates.map(plate => (
                      <option key={plate} value={plate}>Plate #{plate}</option>
                    ))}
                    <option value="__add_new__">+ Add New Plate...</option>
                  </select>
                </div>

                {/* Expense Category Selection */}
                <div className="form-group">
                  <label>Expense Category / Type *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.category}
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">+ Add New Category / Type...</option>
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

                {/* Workshop / Garage Name */}
                <div className="form-group">
                  <label>Workshop / Garage Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Tasjeel, QuickFit Auto..."
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
                    placeholder="Provide details about replaced parts, warranty, or inspection outcome..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Add New Category / Type Modal */}
      {isAddCategoryOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                Add New Expense Type / Category
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
                  placeholder="e.g. AC Gas Refill, Suspension Overhaul..."
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

      {/* Add New Plate Modal */}
      {isAddPlateOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                Add New Fleet Number Plate
              </h3>
              <button onClick={() => setIsAddPlateOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleAddNewPlate}>
              <div className="form-group">
                <label>Number Plate *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="e.g. AA12345 or 48590"
                  value={newPlateNumber}
                  onChange={(e) => setNewPlateNumber(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsAddPlateOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Vehicle Plate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated View & Print Report Modal (Ensures "Print report" shows the actual report on screen and on print) */}
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
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #ede6d9', paddingBottom: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                  Fleet Maintenance & Expense Report
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Filtered by: {selectedPlateFilter === 'all' ? 'All Fleet Cars' : `Plate #${selectedPlateFilter}`} | {dateFilter === 'this_month' ? 'This Month' : (dateFilter === 'last_month' ? 'Last Month' : 'All Time')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={handleExportCSV}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Export CSV
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} /> Print Statement
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="modal-close"
                  style={{ marginLeft: '6px' }}
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
                    DWTC Complex, Sheikh Zayed Road, Dubai, UAE | DET/DTCM Licensed Tour Operator
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#8c5b30', marginTop: '6px' }}>
                    OFFICIAL FLEET CAR EXPENSES STATEMENT
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  <div>Date Generated: <strong style={{ color: '#111827' }}>{todayStr.split('-').reverse().join('/')}</strong></div>
                  <div>Report Scope: <strong style={{ color: '#8c5b30' }}>{selectedPlateFilter === 'all' ? 'Entire Fleet (7 Cars)' : `Plate #${selectedPlateFilter}`}</strong></div>
                  <div>Total Invoices: <strong style={{ color: '#111827' }}>{filteredExpenses.length}</strong></div>
                </div>
              </div>

              {/* Summary Scorecards in Report */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>TOTAL EXPENSES</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#8c5b30', marginTop: '4px' }}>
                    {stats.totalFleetExpense.toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>OIL & SERVICE</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#374151', marginTop: '4px' }}>
                    {stats.oilServiceTotal.toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>TYRES & PASSING</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#374151', marginTop: '4px' }}>
                    {(stats.tyreDetailingTotal + stats.rtaMulkiyaTotal).toLocaleString()} AED
                  </div>
                </div>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>HIGHEST EXPENSED</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', marginTop: '4px', fontFamily: 'monospace' }}>
                    #{stats.topCarPlate}
                  </div>
                </div>
              </div>

              {/* Breakdown by Vehicle Plate Table */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#543c2b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Fleet Vehicle Breakdown
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #ede6d9' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>VEHICLE PLATE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'center' }}>SERVICES COUNT</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>TOTAL SPENT (AED)</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>SHARE OF FLEET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetPlates.map(plate => {
                      const carItems = filteredExpenses.filter(e => e.plateNo === plate);
                      const carTotal = carItems.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                      const sharePct = stats.totalFleetExpense > 0 ? ((carTotal / stats.totalFleetExpense) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={plate} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '800', fontFamily: 'monospace' }}>#{plate}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{carItems.length}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: carTotal > 0 ? '#8c5b30' : '#9ca3af' }}>
                            {carTotal.toLocaleString()} AED
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

              {/* Itemized Maintenance Records */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#543c2b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Itemized Expenses Ledger ({filteredExpenses.length} Records)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', border: '1px solid #ede6d9' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>DATE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>PLATE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>CATEGORY</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800', textAlign: 'right' }}>AMOUNT (AED)</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>WORKSHOP</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>INVOICE</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 10px' }}>{(item.date || '').split('-').reverse().join('/')}</td>
                        <td style={{ padding: '7px 10px', fontWeight: '800', fontFamily: 'monospace' }}>#{item.plateNo}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontWeight: '700' }}>{item.category}</span>
                          {item.notes && <span style={{ display: 'block', fontSize: '10px', color: '#6b7280' }}>{item.notes}</span>}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '800', color: '#8c5b30' }}>
                          {parseFloat(item.amount || 0).toLocaleString()} AED
                        </td>
                        <td style={{ padding: '7px 10px', color: '#4b5563' }}>{item.workshopName || 'N/A'}</td>
                        <td style={{ padding: '7px 10px', color: '#6b7280' }}>{item.invoiceNo || 'N/A'}</td>
                        <td style={{ padding: '7px 10px', textTransform: 'capitalize', fontWeight: '700', color: item.status === 'paid' ? '#047857' : '#b45309' }}>
                          {item.status || 'Paid'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fdfbf7', borderTop: '2px solid #8c5b30', fontWeight: '800' }}>
                      <td colSpan="3" style={{ padding: '10px', textAlign: 'right' }}>TOTAL FLEET EXPENSE:</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#8c5b30', fontSize: '13px' }}>
                        {stats.totalFleetExpense.toLocaleString()} AED
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Report Footer / Signature Line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #ede6d9', fontSize: '11px', color: '#6b7280' }}>
                <div>Roar Adventure Tourism ERP • System Generated Report</div>
                <div style={{ textAlign: 'right' }}>
                  <div>Authorized Operations Approval</div>
                  <div style={{ marginTop: '20px', borderBottom: '1px solid #9ca3af', width: '180px' }}></div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
