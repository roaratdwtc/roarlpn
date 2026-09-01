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
  Sparkles,
  Phone,
  MessageSquare,
  UserCheck
} from 'lucide-react';

// The 7 Official Roar Company Fleet Vehicles & Assigned Drivers
export const ROAR_FLEET_VEHICLES = [
  { id: 'driver-adnan', name: 'Mr Adnan', whatsapp: '+971586860301', carPlate: 'FF79157', model: 'Toyota Land Cruiser V8' },
  { id: 'driver-afzal', name: 'Mr Afzal', whatsapp: '+971563936028', carPlate: 'DD21596', model: 'Toyota Land Cruiser V8' },
  { id: 'driver-abbasi', name: 'Mr Abbasi', whatsapp: '+971556054570', carPlate: 'G25801', model: 'Nissan Patrol Safari' },
  { id: 'driver-shahid', name: 'Mr Shahid', whatsapp: '+971567576977', carPlate: 'D16197', model: 'Toyota Land Cruiser V8' },
  { id: 'driver-ibadat', name: 'Mr Ibadat', whatsapp: '+971545278478', carPlate: 'I49209', model: 'Toyota Land Cruiser V8' },
  { id: 'driver-shahmir', name: 'Mr Shahmir', whatsapp: '+971559210545', carPlate: 'BB23370', model: 'Nissan Patrol Safari' },
  { id: 'driver-bangash', name: 'Mr Bangash', whatsapp: '+971547042682', carPlate: 'DD50781', model: 'Toyota Land Cruiser V8' }
];

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
  drivers = [],
  companyId = 'roar'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPlateFilter, setSelectedPlateFilter] = useState('all'); // 'all' or plate string
  const [dateFilter, setDateFilter] = useState('all'); // all, this_month, last_month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Default to first Roar vehicle
  const defaultFleet = ROAR_FLEET_VEHICLES[0];
  const [formData, setFormData] = useState({
    plateNo: defaultFleet.carPlate,
    carId: `car-${defaultFleet.carPlate.toLowerCase()}`,
    category: 'Oil Change',
    amount: '',
    date: todayStr,
    driverName: defaultFleet.name,
    workshopName: '',
    invoiceNo: '',
    odometer: '',
    paymentMethod: 'Cash',
    status: 'paid',
    notes: ''
  });

  const handleOpenAddModal = (initialPlate = null) => {
    setEditingExpense(null);
    const targetFleet = ROAR_FLEET_VEHICLES.find(v => v.carPlate === initialPlate) || ROAR_FLEET_VEHICLES[0];
    setFormData({
      plateNo: targetFleet.carPlate,
      carId: `car-${targetFleet.carPlate.toLowerCase()}`,
      category: 'Oil Change',
      amount: '',
      date: todayStr,
      driverName: targetFleet.name,
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
    const matchedFleet = ROAR_FLEET_VEHICLES.find(v => v.carPlate === expense.plateNo);
    setFormData({
      plateNo: expense.plateNo || ROAR_FLEET_VEHICLES[0].carPlate,
      carId: expense.carId || `car-${(expense.plateNo || '').toLowerCase()}`,
      category: expense.category || 'Oil Change',
      amount: expense.amount || '',
      date: expense.date || todayStr,
      driverName: expense.driverName || matchedFleet?.name || '',
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
    const matchedFleet = ROAR_FLEET_VEHICLES.find(v => v.carPlate === plateNo);
    setFormData(prev => ({
      ...prev,
      plateNo,
      carId: `car-${plateNo.toLowerCase()}`,
      driverName: matchedFleet?.name || prev.driverName
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
  const currentMonthPrefix = todayStr.substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = new Date(lastMonthDate.getTime() - lastMonthDate.getTimezoneOffset() * 60000).toISOString().substring(0, 7);

  // Filtered Expenses strictly for the 7 Roar cars
  const filteredExpenses = useMemo(() => {
    return carExpenses.filter(item => {
      // Must match search
      const searchMatch = !searchTerm || 
        (item.plateNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.workshopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

      // Plate filter
      const plateMatch = selectedPlateFilter === 'all' || item.plateNo === selectedPlateFilter;

      // Date filter
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

  // Per-car expenditure summary across the 7 Roar vehicles
  const carExpensesMap = useMemo(() => {
    const map = {};
    ROAR_FLEET_VEHICLES.forEach(v => { map[v.carPlate] = 0; });
    carExpenses.forEach(exp => {
      if (map[exp.plateNo] !== undefined) {
        map[exp.plateNo] += parseFloat(exp.amount) || 0;
      }
    });
    return map;
  }, [carExpenses]);

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

    // 6. Top Expensed Vehicle among the 7 Roar cars
    let topCarPlate = 'N/A';
    let topCarAmount = 0;
    let topCarDriver = '';
    ROAR_FLEET_VEHICLES.forEach(v => {
      const amt = carExpensesMap[v.carPlate] || 0;
      if (amt > topCarAmount) {
        topCarAmount = amt;
        topCarPlate = v.carPlate;
        topCarDriver = v.name;
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
      topCarDriver,
      thisMonthTotal
    };
  }, [filteredExpenses, carExpenses, carExpensesMap, currentMonthPrefix]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
              Roar Company Fleet (7 Cars & Drivers)
            </h2>
            <span 
              className="badge" 
              style={{ background: 'rgba(140, 91, 48, 0.12)', color: 'var(--primary)', fontWeight: '800', fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
            >
              7 Company Cars
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage RTA passing, tyres, oil changes, detailing, accidents, insurance, and Mulkiya renewals for Roar's 7 drivers.
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
            onClick={() => handleOpenAddModal()}
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(140, 91, 48, 0.25)' }}
          >
            <Plus size={16} /> Log Car Expense
          </button>
        </div>
      </div>

      {/* 7 Roar Drivers & Fleet Cars Selector Strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ROAR 7 FLEET VEHICLES & DRIVERS
          </span>
          {selectedPlateFilter !== 'all' && (
            <button 
              onClick={() => setSelectedPlateFilter('all')} 
              className="btn btn-secondary" 
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              View All 7 Cars
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {ROAR_FLEET_VEHICLES.map(vehicle => {
            const isSelected = selectedPlateFilter === vehicle.carPlate;
            const totalCarSpent = carExpensesMap[vehicle.carPlate] || 0;
            const cleanPhone = vehicle.whatsapp.replace(/[^0-9]/g, '');

            return (
              <div 
                key={vehicle.carPlate}
                onClick={() => setSelectedPlateFilter(isSelected ? 'all' : vehicle.carPlate)}
                style={{
                  background: isSelected ? 'rgba(140, 91, 48, 0.08)' : '#ffffff',
                  border: isSelected ? '2px solid var(--primary)' : '1.5px solid #ede6d9',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: isSelected ? '0 4px 12px rgba(140, 91, 48, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '13px', background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>
                    #{vehicle.carPlate}
                  </span>
                  <a 
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#128c7e', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    title={`WhatsApp ${vehicle.name}`}
                  >
                    <MessageSquare size={14} />
                  </a>
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-dark)' }}>
                  {vehicle.name}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Maintenance:</span>
                  <strong style={{ color: totalCarSpent > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {totalCarSpent.toLocaleString()} AED
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8 KPI & Report Cards Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        {/* 1. Total Fleet Expenses */}
        <div className="stat-card" style={{ background: '#ffffff', border: '1.5px solid #ede6d9', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              7 CARS TOTAL SPEND
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
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '8px' }}>
            #{stats.topCarPlate} ({stats.topCarDriver || 'Driver'})
          </div>
          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', marginTop: '4px' }}>
            {stats.topCarAmount.toLocaleString()} AED total spent
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
            placeholder="Search by plate, driver, garage, invoice..."
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
            value={selectedPlateFilter}
            onChange={(e) => setSelectedPlateFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="all">All 7 Roar Vehicles</option>
            {ROAR_FLEET_VEHICLES.map(v => (
              <option key={v.carPlate} value={v.carPlate}>Plate #{v.carPlate} - {v.name}</option>
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

          {(searchTerm || categoryFilter !== 'all' || selectedPlateFilter !== 'all' || dateFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setSelectedPlateFilter('all');
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
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>ASSIGNED DRIVER</th>
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
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>No car expenses found for the selected filter.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Log Car Expense" above to record a new maintenance record.</p>
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

                  {/* Assigned Driver */}
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                    {exp.driverName || 'Roar Driver'}
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
                {editingExpense ? 'Edit Roar Car Expense' : 'Log Roar Car Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                {/* 7 Roar Fleet Car Selection */}
                <div className="form-group">
                  <label>Roar Fleet Vehicle & Driver *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.plateNo}
                    onChange={(e) => handleCarSelectChange(e.target.value)}
                  >
                    {ROAR_FLEET_VEHICLES.map(v => (
                      <option key={v.carPlate} value={v.carPlate}>
                        Plate #{v.carPlate} — {v.name}
                      </option>
                    ))}
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

                {/* Assigned Driver (Auto-filled) */}
                <div className="form-group">
                  <label>Assigned Driver</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    readOnly
                    value={formData.driverName}
                    style={{ background: '#fdfbf7', fontWeight: '700', color: 'var(--text-dark)' }}
                  />
                </div>

                {/* Workshop / Garage Name */}
                <div className="form-group">
                  <label>Workshop / Vendor Name</label>
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
                    placeholder="e.g. TSJ-88219"
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
