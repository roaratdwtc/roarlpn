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
  X,
  Share2,
  Clipboard,
  Check,
  Eye,
  UploadCloud,
  FileCheck,
  Folder,
  Shield,
  Radio,
  FileUp,
  FileSpreadsheet
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

export const CAR_DOCUMENT_CATEGORIES = [
  'Mulkiya',
  'Insurance Policy',
  'RTA Passing',
  'Tracker Passing',
  'Accident Report',
  'Other Document'
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
  companyId = 'roar',
  carDocuments = [],
  setCarDocuments
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

  // Custom Car Labels (e.g. Car 1 - Land Cruiser, Driver Ali)
  const [carLabels, setCarLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_car_custom_labels');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'FF79157': 'Toyota Land Cruiser (Car 1)',
      'DD21596': 'Nissan Patrol (Car 2)',
      'G25801': 'Toyota Fortuner (Car 3)',
      'D16197': 'Toyota Land Cruiser (Car 4)',
      'I49209': 'Nissan Patrol (Car 5)',
      'BB23370': 'Toyota Land Cruiser (Car 6)',
      'DD50781': 'Toyota Fortuner (Car 7)'
    };
  });

  // Customizable 8 KPI card titles
  const DEFAULT_CAR_CARD_LABELS = {
    total: 'TOTAL SPEND',
    oil: 'OIL CHANGE',
    tyres: 'TYRES & MATS',
    passing: 'PASSING / REG',
    insurance: 'INSURANCE',
    repairs: 'REPAIRS / BRAKES',
    highest: 'HIGHEST SPEND',
    thisMonth: 'THIS MONTH'
  };

  const [cardLabels, setCardLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('safari_car_card_labels');
      if (saved) return { ...DEFAULT_CAR_CARD_LABELS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_CAR_CARD_LABELS;
  });

  useEffect(() => {
    localStorage.setItem('safari_car_expense_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('safari_car_fleet_plates', JSON.stringify(fleetPlates));
  }, [fleetPlates]);

  useEffect(() => {
    localStorage.setItem('safari_car_custom_labels', JSON.stringify(carLabels));
  }, [carLabels]);

  useEffect(() => {
    localStorage.setItem('safari_car_card_labels', JSON.stringify(cardLabels));
  }, [cardLabels]);

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
  const [newPlateLabel, setNewPlateLabel] = useState('');

  // Edit Car Label Modal State
  const [isEditCarLabelOpen, setIsEditCarLabelOpen] = useState(false);
  const [editingPlateForLabel, setEditingPlateForLabel] = useState('');
  const [customPlateLabelInput, setCustomPlateLabelInput] = useState('');

  // Edit Card Labels Modal State
  const [isEditCardLabelsOpen, setIsEditCardLabelsOpen] = useState(false);

  // Sub-Tab State: 'expenses' or 'documents'
  const [activeSubTab, setActiveSubTab] = useState('expenses');

  // Documents State & Filters
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');
  const [docStatusFilter, setDocStatusFilter] = useState('all'); // all, valid, expiring, expired
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [copiedDocId, setCopiedDocId] = useState(null);

  const [docFormData, setDocFormData] = useState({
    carPlate: fleetPlates[0] || 'FF79157',
    title: '',
    category: 'Mulkiya',
    issueDate: '',
    expiryDate: '',
    fileName: '',
    fileType: '',
    fileSize: '',
    fileData: '',
    notes: ''
  });

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
      if (newPlateLabel.trim()) {
        setCarLabels(prev => ({ ...prev, [trimmed]: newPlateLabel.trim() }));
      }
      setSelectedPlateFilter(trimmed);
      setFormData(prev => ({ ...prev, plateNo: trimmed, carId: `car-${trimmed.toLowerCase()}` }));
    }
    setNewPlateNumber('');
    setNewPlateLabel('');
    setIsAddPlateOpen(false);
  };

  const handleSaveCarLabel = (e) => {
    e.preventDefault();
    if (!editingPlateForLabel) return;
    setCarLabels(prev => ({
      ...prev,
      [editingPlateForLabel]: customPlateLabelInput.trim()
    }));
    setIsEditCarLabelOpen(false);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
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
        (item.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // 7. This Month's Maintenance (for selected car or entire fleet)
    const thisMonthTotal = carExpenses
      .filter(item => (item.date || '').startsWith(currentMonthPrefix) && (selectedPlateFilter === 'all' || item.plateNo === selectedPlateFilter))
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
    const headers = ["Date", "Plate", "Category", "Amount AED", "Payment Method", "Status", "Notes"];
    const rows = filteredExpenses.map(e => [
      e.date || '',
      e.plateNo || '',
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount || 0,
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

  const getDocExpiryInfo = (expiryDate) => {
    if (!expiryDate) {
      return { status: 'valid', label: 'Permanent / No Expiry', daysRemaining: null, color: '#047857', bg: 'rgba(4, 120, 87, 0.12)', border: 'rgba(4, 120, 87, 0.25)' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'expired', 
        label: `Expired (${Math.abs(diffDays)}d ago)`, 
        daysRemaining: diffDays, 
        color: '#b91c1c', 
        bg: 'rgba(185, 28, 28, 0.12)', 
        border: 'rgba(185, 28, 28, 0.25)' 
      };
    } else if (diffDays <= 30) {
      return { 
        status: 'expiring', 
        label: `Expiring in ${diffDays}d`, 
        daysRemaining: diffDays, 
        color: '#b45309', 
        bg: 'rgba(217, 119, 6, 0.12)', 
        border: 'rgba(217, 119, 6, 0.25)' 
      };
    } else {
      return { 
        status: 'valid', 
        label: `Valid (${diffDays}d left)`, 
        daysRemaining: diffDays, 
        color: '#047857', 
        bg: 'rgba(4, 120, 87, 0.12)', 
        border: 'rgba(4, 120, 87, 0.25)' 
      };
    }
  };

  const getDocCategoryStyle = (category) => {
    switch (category) {
      case 'Mulkiya':
        return { background: 'rgba(5, 150, 105, 0.12)', color: '#047857', border: '1px solid rgba(5, 150, 105, 0.25)' };
      case 'Insurance':
      case 'Insurance Policy':
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'RTA Passing':
        return { background: 'rgba(140, 91, 48, 0.12)', color: '#8c5b30', border: '1px solid rgba(140, 91, 48, 0.25)' };
      case 'Tracker Passing':
        return { background: 'rgba(124, 58, 237, 0.12)', color: '#6d28d9', border: '1px solid rgba(124, 58, 237, 0.25)' };
      case 'Accident Report':
        return { background: 'rgba(225, 29, 72, 0.12)', color: '#be123c', border: '1px solid rgba(225, 29, 72, 0.25)' };
      default:
        return { background: 'rgba(107, 114, 128, 0.12)', color: '#374151', border: '1px solid rgba(107, 114, 128, 0.25)' };
    }
  };

  const filteredCarDocuments = useMemo(() => {
    return (carDocuments || []).filter(doc => {
      const plateMatch = selectedPlateFilter === 'all' || doc.carPlate === selectedPlateFilter;
      const categoryMatch = docCategoryFilter === 'all' || doc.category === docCategoryFilter;
      
      let statusMatch = true;
      if (docStatusFilter !== 'all') {
        const info = getDocExpiryInfo(doc.expiryDate);
        statusMatch = info.status === docStatusFilter;
      }

      const searchMatch = !docSearchTerm ||
        (doc.carPlate || '').toLowerCase().includes(docSearchTerm.toLowerCase()) ||
        (doc.title || '').toLowerCase().includes(docSearchTerm.toLowerCase()) ||
        (doc.category || '').toLowerCase().includes(docSearchTerm.toLowerCase()) ||
        (doc.fileName || '').toLowerCase().includes(docSearchTerm.toLowerCase()) ||
        (doc.notes || '').toLowerCase().includes(docSearchTerm.toLowerCase());

      return plateMatch && categoryMatch && statusMatch && searchMatch;
    });
  }, [carDocuments, selectedPlateFilter, docCategoryFilter, docStatusFilter, docSearchTerm]);

  const docStats = useMemo(() => {
    const scopedDocs = (carDocuments || []).filter(doc => selectedPlateFilter === 'all' || doc.carPlate === selectedPlateFilter);
    const totalDocs = scopedDocs.length;
    const mulkiyaCount = scopedDocs.filter(d => d.category === 'Mulkiya').length;
    const insuranceCount = scopedDocs.filter(d => d.category === 'Insurance' || d.category === 'Insurance Policy').length;
    const rtaCount = scopedDocs.filter(d => d.category === 'RTA Passing').length;
    const trackerCount = scopedDocs.filter(d => d.category === 'Tracker Passing').length;
    const accidentCount = scopedDocs.filter(d => d.category === 'Accident Report').length;
    
    let expiringCount = 0;
    let expiredCount = 0;
    scopedDocs.forEach(d => {
      const info = getDocExpiryInfo(d.expiryDate);
      if (info.status === 'expiring') expiringCount++;
      if (info.status === 'expired') expiredCount++;
    });

    return {
      totalDocs,
      mulkiyaCount,
      insuranceCount,
      rtaCount,
      trackerCount,
      accidentCount,
      expiringCount,
      expiredCount
    };
  }, [carDocuments, selectedPlateFilter]);

  const handleDocFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit. Please upload a compressed PDF or image.');
      return;
    }

    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: fileSizeFormatted,
        fileData: event.target.result,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDoc = (doc) => {
    if (!doc.fileData) {
      alert('No file attachment available to download.');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || `${doc.carPlate}_${doc.category}_Document.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShareDoc = (doc) => {
    const text = `🚗 *ROAR ADVENTURE TOURISM LLC*\n*VEHICLE OFFICIAL COMPLIANCE RECORD*\n──────────────────────────────\n• *Vehicle Plate:* ${doc.carPlate} ${carLabels[doc.carPlate] ? `(${carLabels[doc.carPlate]})` : ''}\n• *Document Title:* ${doc.title}\n• *Category:* ${doc.category}\n• *Issue Date:* ${doc.issueDate || 'N/A'}\n• *Expiry Date:* ${doc.expiryDate || 'Permanent / No Expiry'}\n• *File Name:* ${doc.fileName} (${doc.fileSize || 'Attached'})\n• *Notes:* ${doc.notes || 'Official corporate record.'}\n──────────────────────────────\n_Generated electronically via Roar CRM Vehicle Vault._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyDocDetails = (doc) => {
    const text = `Vehicle: ${doc.carPlate} | Title: ${doc.title} | Category: ${doc.category} | Expiry: ${doc.expiryDate || 'N/A'} | Notes: ${doc.notes || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDocId(doc.id);
      setTimeout(() => setCopiedDocId(null), 2000);
    }).catch(err => {
      alert('Failed to copy document details: ' + err);
    });
  };

  const handleOpenAddDoc = (plate = null) => {
    setEditingDoc(null);
    const targetPlate = plate || (selectedPlateFilter !== 'all' ? selectedPlateFilter : fleetPlates[0] || 'FF79157');
    setDocFormData({
      carPlate: targetPlate,
      title: '',
      category: 'Mulkiya',
      issueDate: todayStr,
      expiryDate: '',
      fileName: '',
      fileType: '',
      fileSize: '',
      fileData: '',
      notes: ''
    });
    setIsDocModalOpen(true);
  };

  const handleOpenEditDoc = (doc) => {
    setEditingDoc(doc);
    setDocFormData({
      carPlate: doc.carPlate || fleetPlates[0] || 'FF79157',
      title: doc.title || '',
      category: doc.category || 'Mulkiya',
      issueDate: doc.issueDate || '',
      expiryDate: doc.expiryDate || '',
      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
      fileSize: doc.fileSize || '',
      fileData: doc.fileData || '',
      notes: doc.notes || ''
    });
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = (e) => {
    e.preventDefault();
    if (!docFormData.title.trim()) {
      alert('Please enter a document title.');
      return;
    }
    if (!docFormData.fileData) {
      alert('Please select or upload a document file (Mulkiya scan, Insurance policy, Passing certificate, or Accident report).');
      return;
    }

    const payload = {
      ...docFormData,
      id: editingDoc ? editingDoc.id : `cardoc-${Date.now()}`,
      uploadedAt: editingDoc?.uploadedAt || todayStr
    };

    let updatedDocs;
    if (editingDoc) {
      updatedDocs = (carDocuments || []).map(d => d.id === editingDoc.id ? payload : d);
    } else {
      updatedDocs = [payload, ...(carDocuments || [])];
    }

    if (setCarDocuments) {
      setCarDocuments(updatedDocs);
    }

    try {
      fetch(`api.php?action=save&table=car_documents&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('MySQL car_documents save error:', err));
    } catch (err) {
      console.warn('Network error saving car document:', err);
    }

    setIsDocModalOpen(false);
  };

  const handleDeleteDoc = (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    const updated = (carDocuments || []).filter(d => d.id !== id);
    if (setCarDocuments) {
      setCarDocuments(updated);
    }

    try {
      fetch(`api.php?action=delete&table=car_documents&company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.warn('MySQL car_documents delete error:', err));
    } catch (err) {
      console.warn('Network error deleting car document:', err);
    }
  };

  return (
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)' }}>
              Fleet Vehicles & Official Vault
            </h2>
            <span 
              className="badge" 
              style={{ background: 'rgba(140, 91, 48, 0.1)', color: 'var(--primary)', fontWeight: '800', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
            >
              {fleetPlates.length} Cars
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Vehicle maintenance records, Mulkiya, Insurance, Passing & Accident reports by number plate.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Add New Car Button */}
          <button 
            onClick={() => { setNewPlateNumber(''); setNewPlateLabel(''); setIsAddPlateOpen(true); }}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 11px', height: '36px' }}
            title="Add new car number plate to fleet"
          >
            <Plus size={14} /> Add New Car
          </button>

          {/* Car Number Plate Dropdown (No # symbol per user directive) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select 
              value={selectedPlateFilter}
              onChange={(e) => setSelectedPlateFilter(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '190px',
                fontSize: '12px',
                fontWeight: '800',
                color: selectedPlateFilter !== 'all' ? '#8c5b30' : 'var(--text-dark)',
                borderColor: selectedPlateFilter !== 'all' ? '#8c5b30' : '#ede6d9',
                background: '#ffffff',
                height: '36px',
                padding: '4px 10px'
              }}
              title="Filter fleet records by car number plate"
            >
              <option value="all">🚗 All Fleet Cars ({fleetPlates.length} Cars)</option>
              {fleetPlates.map(plate => (
                <option key={plate} value={plate}>
                  {plate} {carLabels[plate] ? `- ${carLabels[plate]}` : ''} ({(carExpensesMap[plate] || 0).toLocaleString()} AED)
                </option>
              ))}
            </select>

            {selectedPlateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setEditingPlateForLabel(selectedPlateFilter);
                  setCustomPlateLabelInput(carLabels[selectedPlateFilter] || '');
                  setIsEditCarLabelOpen(true);
                }}
                className="btn btn-secondary"
                style={{ padding: '7px 10px', height: '36px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Change car label text / nickname"
              >
                <Edit2 size={13} /> Label
              </button>
            )}
          </div>

          {activeSubTab === 'expenses' ? (
            <>
              <button 
                onClick={() => setIsEditCardLabelsOpen(true)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '7px 11px', height: '36px' }}
                title="Customize the 8 card header label texts"
              >
                <Layers size={14} /> Edit Card Labels
              </button>

              <button 
                onClick={handleOpenReport}
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 12px', height: '36px' }}
              >
                <Printer size={14} /> Print Report
              </button>

              <button 
                onClick={() => setIsAddCategoryOpen(true)}
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 12px', height: '36px' }}
              >
                <Plus size={14} /> Add Type
              </button>

              <button 
                onClick={() => handleOpenAddModal()}
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', height: '36px', boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
              >
                <Plus size={14} /> Log Expense
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => window.print()}
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 12px', height: '36px' }}
                title="Print vehicle documents compliance sheet"
              >
                <Printer size={14} /> Print Vault
              </button>

              <button 
                onClick={() => handleOpenAddDoc(selectedPlateFilter !== 'all' ? selectedPlateFilter : null)}
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', height: '36px', boxShadow: '0 4px 12px rgba(140, 91, 48, 0.25)' }}
              >
                <UploadCloud size={14} /> Upload Document
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar: Expenses vs Documents */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid #ede6d9', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveSubTab('expenses')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
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
          <Wrench size={15} /> Fleet Expenses & Maintenance ({filteredExpenses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('documents')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeSubTab === 'documents' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'documents' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <FileText size={15} /> Vehicle Documents & Legal Vault ({(carDocuments || []).length})
        </button>
      </div>

      {activeSubTab === 'expenses' ? (
        <>
      {/* 1-Row Unified Filter and Search Bar (Moved UP per user request) */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px' }}>
        
        {/* Left: Search Input */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search plate, category, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '12.5px' }}
          />
        </div>

        {/* Middle & Right: Car Plate, Category, & Date Range Filters in 1 Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          
          {/* Car Plate Filter */}
          <select 
            className="form-control"
            value={selectedPlateFilter}
            onChange={(e) => setSelectedPlateFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px', fontSize: '12px', fontWeight: '700', color: selectedPlateFilter !== 'all' ? '#8c5b30' : 'var(--text-dark)' }}
            title="Filter by car plate"
          >
            <option value="all">🚗 All Fleet Cars ({fleetPlates.length})</option>
            {fleetPlates.map(plate => (
              <option key={plate} value={plate}>
                {plate} {carLabels[plate] ? `- ${carLabels[plate]}` : ''}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select 
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px', fontSize: '12px', fontWeight: '700', color: categoryFilter !== 'all' ? '#8c5b30' : 'var(--text-dark)' }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
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

      {/* 8 KPI Category & Report Cards Grid (Interactive clickable filters, 2 cards per row on mobile) */}
      <div className="stats-grid" style={{ marginBottom: '14px' }}>
        
        {/* 1. Total Fleet Expenses */}
        <div 
          onClick={() => { setCategoryFilter('all'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter === 'all' ? 'rgba(140, 91, 48, 0.08)' : '#ffffff', 
            border: categoryFilter === 'all' ? '2px solid #8c5b30' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view all expenses"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedPlateFilter !== 'all' ? `TOTAL (CAR ${selectedPlateFilter})` : cardLabels.total}
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
        <div 
          onClick={() => { setCategoryFilter(categories.find(c => c.toLowerCase().includes('oil')) || 'Oil Change & Service'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter.toLowerCase().includes('oil') ? 'rgba(201, 118, 42, 0.08)' : '#ffffff', 
            border: categoryFilter.toLowerCase().includes('oil') ? '2px solid #c9762a' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Oil Change"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.oil}
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
        <div 
          onClick={() => { setCategoryFilter(categories.find(c => c.toLowerCase().includes('tyre') || c.toLowerCase().includes('mat')) || 'Tyre Change'); }}
          className="stat-card" 
          style={{ 
            background: (categoryFilter.toLowerCase().includes('tyre') || categoryFilter.toLowerCase().includes('mat')) ? 'rgba(180, 83, 9, 0.08)' : '#ffffff', 
            border: (categoryFilter.toLowerCase().includes('tyre') || categoryFilter.toLowerCase().includes('mat')) ? '2px solid #b45309' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Tyres & Detailing"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.tyres}
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
        <div 
          onClick={() => { setCategoryFilter(categories.find(c => c.toLowerCase().includes('passing') || c.toLowerCase().includes('mulkiya')) || 'Car Passing'); }}
          className="stat-card" 
          style={{ 
            background: (categoryFilter.toLowerCase().includes('passing') || categoryFilter.toLowerCase().includes('mulkiya')) ? 'rgba(4, 120, 87, 0.08)' : '#ffffff', 
            border: (categoryFilter.toLowerCase().includes('passing') || categoryFilter.toLowerCase().includes('mulkiya')) ? '2px solid #047857' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Passing & Mulkiya"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.passing}
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
        <div 
          onClick={() => { setCategoryFilter(categories.find(c => c.toLowerCase().includes('insurance')) || 'Insurance Renewal'); }}
          className="stat-card" 
          style={{ 
            background: categoryFilter.toLowerCase().includes('insurance') ? 'rgba(29, 78, 216, 0.08)' : '#ffffff', 
            border: categoryFilter.toLowerCase().includes('insurance') ? '2px solid #1d4ed8' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Insurance"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.insurance}
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
        <div 
          onClick={() => { setCategoryFilter(categories.find(c => c.toLowerCase().includes('accident') || c.toLowerCase().includes('repair')) || 'Accidents & Body Repair'); }}
          className="stat-card" 
          style={{ 
            background: (categoryFilter.toLowerCase().includes('accident') || categoryFilter.toLowerCase().includes('repair')) ? 'rgba(185, 28, 28, 0.08)' : '#ffffff', 
            border: (categoryFilter.toLowerCase().includes('accident') || categoryFilter.toLowerCase().includes('repair')) ? '2px solid #b91c1c' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Repairs"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {cardLabels.repairs}
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

        {/* 7. Top Expensed Vehicle or Selected Car Label */}
        <div 
          onClick={() => { 
            if (stats.topCarPlate) setSelectedPlateFilter(stats.topCarPlate); 
          }}
          className="stat-card" 
          style={{ 
            background: '#ffffff', 
            border: '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view top expensed vehicle"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedPlateFilter !== 'all' ? 'SELECTED CAR' : cardLabels.highest}
            </span>
            <Car size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px', fontFamily: 'monospace' }}>
            {selectedPlateFilter !== 'all' ? selectedPlateFilter : stats.topCarPlate}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedPlateFilter !== 'all' 
              ? (carLabels[selectedPlateFilter] || 'Fleet Vehicle') 
              : `${stats.topCarAmount.toLocaleString()} AED total`}
          </div>
        </div>

        {/* 8. This Month */}
        <div 
          onClick={() => { setDateFilter('this_month'); }}
          className="stat-card" 
          style={{ 
            background: dateFilter === 'this_month' ? 'rgba(4, 120, 87, 0.08)' : '#fdfbf7', 
            border: dateFilter === 'this_month' ? '2px solid #047857' : '1px solid #ede6d9', 
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter by Current Month"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedPlateFilter !== 'all' ? `THIS MONTH (${selectedPlateFilter})` : cardLabels.thisMonth}
            </span>
            <Clock size={14} style={{ color: '#047857' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {stats.thisMonthTotal.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '600' }}>AED</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {selectedPlateFilter !== 'all' ? `Car #${selectedPlateFilter}` : 'Current month'}
          </div>
        </div>

      </div>

      {/* Expenses Table (Scrollable on mobile) */}
      <div className="table-responsive card" style={{ background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px', padding: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
          <thead>
            <tr style={{ background: '#fdfbf7', borderBottom: '1px solid #ede6d9', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>DATE</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>PLATE</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>CATEGORY</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>METHOD</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>NOTES</th>
              <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <Wrench size={28} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>No car expenses found for this filter.</p>
                  {(carExpenses || []).length > 0 ? (
                    <div style={{ marginTop: '10px' }}>
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setSelectedPlateFilter('all');
                          setDateFilter('all');
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        Show All Expenses ({carExpenses.length} in database)
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11.5px', marginTop: '3px' }}>Click "Log Expense" above to record a new entry.</p>
                  )}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="clickable-row" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  
                  {/* Date */}
                  <td style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                    {(exp.date || '').split('-').reverse().join('/')}
                  </td>

                  {/* Plate */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '12.5px', background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>
                      {exp.plateNo}
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
                  </td>

                  {/* Amount (AED) */}
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                    {parseFloat(exp.amount || 0).toLocaleString()} AED
                  </td>

                  {/* Method */}
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    {exp.paymentMethod || 'Cash'}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
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

                  {/* Notes */}
                  <td style={{ padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.notes || '—'}
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
      </>
      ) : (
        <>
          {/* Selected Car Scope Banner (When a specific car is selected) */}
          {selectedPlateFilter !== 'all' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(140, 91, 48, 0.05)',
              border: '1.5px solid rgba(140, 91, 48, 0.18)',
              borderRadius: '10px',
              padding: '12px 16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#8c5b30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '18px' }}>
                  🚗
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b', fontFamily: 'monospace' }}>
                      Plate {selectedPlateFilter}
                    </span>
                    <span className="badge" style={{ background: '#ede6d9', color: '#8c5b30', fontWeight: '700', fontSize: '11px', padding: '2px 8px' }}>
                      {carLabels[selectedPlateFilter] || 'Fleet Car'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Showing official Mulkiya, Insurance, Passing & Accident files for vehicle {selectedPlateFilter} ({filteredCarDocuments.length} files).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => handleOpenAddDoc(selectedPlateFilter)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 13px', height: '34px', boxShadow: '0 3px 8px rgba(140, 91, 48, 0.25)' }}
                >
                  <UploadCloud size={14} /> Upload Doc for {selectedPlateFilter}
                </button>
                <button
                  onClick={() => setSelectedPlateFilter('all')}
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', padding: '6px 10px', height: '34px' }}
                >
                  View All Fleet
                </button>
              </div>
            </div>
          )}

          {/* 1-Row Unified Search and Filters Bar for Documents */}
          <div className="card" style={{ padding: '12px 14px', marginBottom: '2px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '10px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Search plate, document title, notes..."
                value={docSearchTerm}
                onChange={(e) => setDocSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12.5px', height: '36px' }}
              />
            </div>

            {/* Middle & Right Filters in 1 Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {/* Car Plate Filter */}
              <select 
                className="form-control"
                value={selectedPlateFilter}
                onChange={(e) => setSelectedPlateFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '140px', fontSize: '12px', fontWeight: '700', color: selectedPlateFilter !== 'all' ? '#8c5b30' : 'var(--text-dark)', height: '36px' }}
                title="Filter by car plate"
              >
                <option value="all">🚗 All Fleet Cars ({fleetPlates.length})</option>
                {fleetPlates.map(plate => (
                  <option key={plate} value={plate}>
                    {plate} {carLabels[plate] ? `- ${carLabels[plate]}` : ''}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select 
                className="form-control"
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '140px', fontSize: '12px', fontWeight: '700', color: docCategoryFilter !== 'all' ? '#8c5b30' : 'var(--text-dark)', height: '36px' }}
              >
                <option value="all">All Document Types</option>
                {CAR_DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Expiry Status Filter */}
              <select 
                className="form-control"
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '120px', fontSize: '12px', height: '36px' }}
              >
                <option value="all">All Statuses</option>
                <option value="valid">Valid</option>
                <option value="expiring">Expiring Soon (30d)</option>
                <option value="expired">Expired</option>
              </select>

              {(docSearchTerm || docCategoryFilter !== 'all' || docStatusFilter !== 'all' || selectedPlateFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setDocSearchTerm('');
                    setDocCategoryFilter('all');
                    setDocStatusFilter('all');
                    setSelectedPlateFilter('all');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', padding: '6px 12px', height: '36px' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 8 Document KPI Cards Grid (Clickable Category & Status Filters, 2 per row on mobile) */}
          <div className="stats-grid" style={{ marginBottom: '8px' }}>
            {/* 1. Total Documents */}
            <div 
              onClick={() => { setDocCategoryFilter('all'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'all' && docStatusFilter === 'all' ? 'rgba(140, 91, 48, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'all' && docStatusFilter === 'all' ? '2px solid var(--primary)' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to view all documents"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TOTAL DOCUMENTS
                </span>
                <FileText size={14} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                {docStats.totalDocs} <span style={{ fontSize: '11px', fontWeight: '600' }}>Files</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedPlateFilter !== 'all' ? `Plate ${selectedPlateFilter}` : 'Across 7 Fleet Cars'}
              </div>
            </div>

            {/* 2. Mulkiya Registration */}
            <div 
              onClick={() => { setDocCategoryFilter('Mulkiya'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'Mulkiya' ? 'rgba(5, 150, 105, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'Mulkiya' ? '2px solid #047857' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to filter Mulkiya cards"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  MULKIYA CARDS
                </span>
                <FileCheck size={14} style={{ color: '#047857' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                {docStats.mulkiyaCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Cards</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                RTA Vehicle Licenses
              </div>
            </div>

            {/* 3. Insurance Policies */}
            <div 
              onClick={() => { setDocCategoryFilter('Insurance'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'Insurance' ? 'rgba(59, 130, 246, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'Insurance' ? '2px solid #1d4ed8' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to filter insurance certificates"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  INSURANCE POLICIES
                </span>
                <Shield size={14} style={{ color: '#1d4ed8' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {docStats.insuranceCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Policies</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Commercial Fleet Coverage
              </div>
            </div>

            {/* 4. RTA Passing */}
            <div 
              onClick={() => { setDocCategoryFilter('RTA Passing'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'RTA Passing' ? 'rgba(140, 91, 48, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'RTA Passing' ? '2px solid #8c5b30' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to filter RTA passing certificates"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  RTA PASSING
                </span>
                <CheckCircle2 size={14} style={{ color: '#8c5b30' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#8c5b30', marginTop: '4px' }}>
                {docStats.rtaCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Certificates</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Technical Inspection Reports
              </div>
            </div>

            {/* 5. Tracker Passing */}
            <div 
              onClick={() => { setDocCategoryFilter('Tracker Passing'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'Tracker Passing' ? 'rgba(124, 58, 237, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'Tracker Passing' ? '2px solid #6d28d9' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to filter tracker compliance"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TRACKER PASSING
                </span>
                <Radio size={14} style={{ color: '#6d28d9' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#6d28d9', marginTop: '4px' }}>
                {docStats.trackerCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Certificates</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                GPS & SIRA Security Gate
              </div>
            </div>

            {/* 6. Accident Reports */}
            <div 
              onClick={() => { setDocCategoryFilter('Accident Report'); setDocStatusFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docCategoryFilter === 'Accident Report' ? 'rgba(225, 29, 72, 0.08)' : '#ffffff', 
                border: docCategoryFilter === 'Accident Report' ? '2px solid #be123c' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to filter accident reports"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  ACCIDENT REPORTS
                </span>
                <AlertCircle size={14} style={{ color: '#be123c' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#be123c', marginTop: '4px' }}>
                {docStats.accidentCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Reports</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Police & Damage Claims
              </div>
            </div>

            {/* 7. Expiring Soon */}
            <div 
              onClick={() => { setDocStatusFilter('expiring'); setDocCategoryFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docStatusFilter === 'expiring' ? 'rgba(217, 119, 6, 0.08)' : '#ffffff', 
                border: docStatusFilter === 'expiring' ? '2px solid #b45309' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to view documents expiring in 30 days"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  EXPIRING SOON
                </span>
                <Clock size={14} style={{ color: '#b45309' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                {docStats.expiringCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Alerts</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Renew within 30 Days
              </div>
            </div>

            {/* 8. Expired / Overdue */}
            <div 
              onClick={() => { setDocStatusFilter('expired'); setDocCategoryFilter('all'); }}
              className="stat-card" 
              style={{ 
                background: docStatusFilter === 'expired' ? 'rgba(185, 28, 28, 0.08)' : '#ffffff', 
                border: docStatusFilter === 'expired' ? '2px solid #b91c1c' : '1px solid #ede6d9', 
                padding: '12px 14px', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease' 
              }}
              title="Click to view expired documents"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  EXPIRED / RENEW
                </span>
                <AlertCircle size={14} style={{ color: '#b91c1c' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
                {docStats.expiredCount} <span style={{ fontSize: '11px', fontWeight: '600' }}>Overdue</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Immediate Renewal Needed
              </div>
            </div>
          </div>

          {/* Document Cards Grid */}
          {filteredCarDocuments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', border: '1px solid #ede6d9', borderRadius: '12px' }}>
              <FileText size={36} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}>No vehicle documents found</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 16px' }}>
                {selectedPlateFilter !== 'all' 
                  ? `No Mulkiya, Insurance, or Passing documents found for car ${selectedPlateFilter}.`
                  : 'No vehicle records matched your search filter criteria.'}
              </p>
              <button 
                onClick={() => handleOpenAddDoc(selectedPlateFilter !== 'all' ? selectedPlateFilter : null)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontSize: '12px' }}
              >
                <UploadCloud size={14} /> Upload First Document
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 285px), 1fr))', 
              gap: '12px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {filteredCarDocuments.map(doc => {
                const expiryInfo = getDocExpiryInfo(doc.expiryDate);
                const isCopied = copiedDocId === doc.id;

                return (
                  <div 
                    key={doc.id}
                    className="card"
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #ede6d9',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease',
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Top Row: Plate + Category + Expiry Status */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            background: '#ede6d9', 
                            color: '#543c2b', 
                            fontWeight: '800', 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            padding: '3px 7px', 
                            borderRadius: '5px' 
                          }}>
                            {doc.carPlate}
                          </span>
                          <span 
                            className="badge" 
                            style={{ 
                              ...getDocCategoryStyle(doc.category), 
                              fontWeight: '700', 
                              fontSize: '10.5px', 
                              padding: '3px 7px', 
                              borderRadius: '5px' 
                            }}
                          >
                            {doc.category}
                          </span>
                        </div>

                        <span 
                          className="badge" 
                          style={{ 
                            background: expiryInfo.bg, 
                            color: expiryInfo.color, 
                            border: `1px solid ${expiryInfo.border}`, 
                            fontSize: '10.5px', 
                            fontWeight: '700', 
                            padding: '3px 7px', 
                            borderRadius: '5px' 
                          }}
                        >
                          {expiryInfo.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', lineHeight: '1.3' }}>
                        {doc.title}
                      </h4>

                      {/* Car Nickname */}
                      <div style={{ fontSize: '11px', color: '#8c5b30', fontWeight: '600', marginBottom: '6px' }}>
                        {carLabels[doc.carPlate] || 'Roar Fleet Vehicle'}
                      </div>

                      {/* Notes / Description */}
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px', minHeight: '28px' }}>
                        {doc.notes || 'Official electronic vehicle compliance file.'}
                      </p>

                      {/* Dates & File Info */}
                      <div style={{ 
                        background: '#fdfbf7', 
                        border: '1px solid #ede6d9', 
                        borderRadius: '8px', 
                        padding: '8px 10px', 
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Issue Date:</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{doc.issueDate ? doc.issueDate.split('-').reverse().join('/') : '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Expiry Date:</span>
                          <span style={{ fontWeight: '700', color: expiryInfo.color }}>
                            {doc.expiryDate ? doc.expiryDate.split('-').reverse().join('/') : 'Permanent / No Expiry'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ede6d9', paddingTop: '4px', marginTop: '2px', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={11} /> File:
                          </span>
                          <span style={{ fontWeight: '600', color: 'var(--primary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.fileName}>
                            {doc.fileName || 'Attached document'} {doc.fileSize ? `(${doc.fileSize})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions - Strictly wrap and fit within screen */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      flexWrap: 'wrap', 
                      borderTop: '1px solid #ede6d9', 
                      paddingTop: '10px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setPreviewingDoc(doc)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px', whiteSpace: 'nowrap' }}
                          title="Preview document in browser"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px', whiteSpace: 'nowrap' }}
                          title="Download document file"
                        >
                          <Download size={12} /> Download
                        </button>
                        <button
                          onClick={() => handleWhatsAppShareDoc(doc)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857', height: '28px', whiteSpace: 'nowrap' }}
                          title="Share formatted details via WhatsApp"
                        >
                          <Share2 size={12} /> Share
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        <button
                          onClick={() => handleCopyDocDetails(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px', height: '28px', minWidth: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Copy details to clipboard"
                        >
                          {isCopied ? <Check size={12} style={{ color: '#047857' }} /> : <Clipboard size={12} />}
                        </button>
                        <button
                          onClick={() => handleOpenEditDoc(doc)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px', height: '28px', minWidth: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Edit document details or replace file"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.title)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px', height: '28px', minWidth: '28px', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete document"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

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
              <div className="form-grid-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                
                {/* Vehicle Plate Selection */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Plate *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.plateNo}
                    onChange={(e) => handleCarSelectChange(e.target.value)}
                  >
                    {fleetPlates.map(plate => (
                      <option key={plate} value={plate}>Plate {plate}</option>
                    ))}
                    <option value="__add_new__">+ Add New Plate...</option>
                  </select>
                </div>

                {/* Expense Category Selection */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Category *</label>
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
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Amount (AED) *</label>
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
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Method</label>
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
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Status</label>
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
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Optional details or maintenance notes..."
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
              <div className="form-group" style={{ marginTop: '8px' }}>
                <label>Car Label / Nickname (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Toyota Land Cruiser (Car 1) or Driver Ali"
                  value={newPlateLabel}
                  onChange={(e) => setNewPlateLabel(e.target.value)}
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
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #ede6d9', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                  {selectedPlateFilter === 'all' ? 'Fleet Maintenance & Expense Report' : `Vehicle Report: Car ${selectedPlateFilter}`}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Scope: {selectedPlateFilter === 'all' ? 'Entire Fleet (All Cars)' : `Car ${selectedPlateFilter} ${carLabels[selectedPlateFilter] ? `(${carLabels[selectedPlateFilter]})` : ''}`} | {dateFilter === 'this_month' ? 'This Month' : (dateFilter === 'last_month' ? 'Last Month' : 'All Time')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Plate selector inside report modal */}
                <select
                  value={selectedPlateFilter}
                  onChange={(e) => setSelectedPlateFilter(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '12px', height: '34px', fontWeight: '800', color: 'var(--primary)' }}
                >
                  <option value="all">🚗 Entire Fleet ({fleetPlates.length} Cars)</option>
                  {fleetPlates.map(p => (
                    <option key={p} value={p}>{p} {carLabels[p] ? `- ${carLabels[p]}` : ''}</option>
                  ))}
                </select>

                <button 
                  onClick={handleExportCSV}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px' }}
                >
                  <Download size={14} /> Export CSV
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px' }}
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
                    {selectedPlateFilter !== 'all' 
                      ? `OFFICIAL VEHICLE MAINTENANCE STATEMENT - CAR #${selectedPlateFilter} ${carLabels[selectedPlateFilter] ? `(${carLabels[selectedPlateFilter]})` : ''}` 
                      : 'OFFICIAL FLEET CAR EXPENSES STATEMENT'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  <div>Date Generated: <strong style={{ color: '#111827' }}>{todayStr.split('-').reverse().join('/')}</strong></div>
                  <div>Report Scope: <strong style={{ color: '#8c5b30' }}>{selectedPlateFilter === 'all' ? `Entire Fleet (${fleetPlates.length} Cars)` : `Car #${selectedPlateFilter} ${carLabels[selectedPlateFilter] ? `(${carLabels[selectedPlateFilter]})` : ''}`}</strong></div>
                  <div>Total Invoices: <strong style={{ color: '#111827' }}>{filteredExpenses.length}</strong></div>
                </div>
              </div>

              {/* Summary Scorecards in Report */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                    {selectedPlateFilter !== 'all' ? `TOTAL (CAR #${selectedPlateFilter})` : 'TOTAL EXPENSES'}
                  </div>
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
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                    {selectedPlateFilter !== 'all' ? 'OTHER REPAIRS' : 'HIGHEST EXPENSED'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', marginTop: '4px', fontFamily: selectedPlateFilter !== 'all' ? 'inherit' : 'monospace' }}>
                    {selectedPlateFilter !== 'all' 
                      ? `${(stats.accidentRepairsTotal + stats.insuranceTotal).toLocaleString()} AED` 
                      : `#${stats.topCarPlate}`}
                  </div>
                </div>
              </div>

              {/* Breakdown by Vehicle Plate Table - ONLY SHOWN IF ALL CARS SELECTED */}
              {selectedPlateFilter === 'all' && (
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
                            <td style={{ padding: '8px 10px', fontWeight: '800', fontFamily: 'monospace' }}>
                              {plate} {carLabels[plate] ? <span style={{ color: '#8c5b30', fontWeight: '600' }}>({carLabels[plate]})</span> : ''}
                            </td>
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
              )}

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
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>METHOD</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>STATUS</th>
                      <th style={{ padding: '8px 10px', fontWeight: '800' }}>NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 10px' }}>{(item.date || '').split('-').reverse().join('/')}</td>
                        <td style={{ padding: '7px 10px', fontWeight: '800', fontFamily: 'monospace' }}>{item.plateNo}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontWeight: '700' }}>{item.category}</span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '800', color: '#8c5b30' }}>
                          {parseFloat(item.amount || 0).toLocaleString()} AED
                        </td>
                        <td style={{ padding: '7px 10px', color: '#4b5563' }}>{item.paymentMethod || 'Cash'}</td>
                        <td style={{ padding: '7px 10px', textTransform: 'capitalize', fontWeight: '700', color: item.status === 'paid' ? '#047857' : '#b45309' }}>
                          {item.status || 'Paid'}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#6b7280', fontSize: '10.5px' }}>{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fdfbf7', borderTop: '2px solid #8c5b30', fontWeight: '800' }}>
                      <td colSpan="3" style={{ padding: '10px', textAlign: 'right', textTransform: 'uppercase', color: '#543c2b' }}>Total Expenditures:</td>
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

      {/* Edit Car Label Modal */}
      {isEditCarLabelOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '14px', padding: '20px', background: '#ffffff', border: '1.5px solid #ede6d9' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                Customize Car Label: {editingPlateForLabel}
              </h3>
              <button onClick={() => setIsEditCarLabelOpen(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSaveCarLabel}>
              <div className="form-group">
                <label>Car Label / Nickname / Driver Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Toyota Land Cruiser (Car 1) or Driver Ali"
                  value={customPlateLabelInput}
                  onChange={(e) => setCustomPlateLabelInput(e.target.value)}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  This label text will appear in the dropdown, KPI cards, and reports for this vehicle.
                </span>
              </div>
              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsEditCarLabelOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Label
                </button>
              </div>
            </form>
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
                  Customize 8 KPI Card Header Labels
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
                    value={cardLabels.oil} 
                    onChange={(e) => setCardLabels({ ...cardLabels, oil: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 3 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.tyres} 
                    onChange={(e) => setCardLabels({ ...cardLabels, tyres: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 4 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.passing} 
                    onChange={(e) => setCardLabels({ ...cardLabels, passing: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 5 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.insurance} 
                    onChange={(e) => setCardLabels({ ...cardLabels, insurance: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 6 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.repairs} 
                    onChange={(e) => setCardLabels({ ...cardLabels, repairs: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 7 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.highest} 
                    onChange={(e) => setCardLabels({ ...cardLabels, highest: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Card 8 Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={cardLabels.thisMonth} 
                    onChange={(e) => setCardLabels({ ...cardLabels, thisMonth: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setCardLabels(DEFAULT_CAR_CARD_LABELS)} 
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

      {/* Upload & Edit Vehicle Document Modal */}
      {isDocModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '560px', borderRadius: '14px', padding: '22px', background: '#ffffff', border: '1.5px solid #ede6d9', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>
                  {editingDoc ? 'Edit Vehicle Document' : 'Upload Vehicle Document'}
                </h3>
              </div>
              <button onClick={() => setIsDocModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveDoc}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                
                {/* Car Plate */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Car Number Plate *</label>
                  <select 
                    className="form-control"
                    required
                    value={docFormData.carPlate}
                    onChange={(e) => setDocFormData({ ...docFormData, carPlate: e.target.value })}
                  >
                    {fleetPlates.map(plate => (
                      <option key={plate} value={plate}>
                        {plate} {carLabels[plate] ? `- ${carLabels[plate]}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Document Category *</label>
                  <select 
                    className="form-control"
                    required
                    value={docFormData.category}
                    onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value })}
                  >
                    {CAR_DOCUMENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Document Title */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Document Title *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    required
                    placeholder="e.g. Mulkiya Registration Card 2026-2027 or Orient Insurance Policy"
                    value={docFormData.title}
                    onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  />
                </div>

                {/* Issue Date */}
                <div className="form-group">
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Issue Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={docFormData.issueDate}
                    onChange={(e) => setDocFormData({ ...docFormData, issueDate: e.target.value })}
                  />
                </div>

                {/* Expiry Date */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Expiry Date</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 1);
                          setDocFormData({ ...docFormData, expiryDate: d.toISOString().split('T')[0] });
                        }}
                        style={{ fontSize: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}
                      >
                        +1 Yr
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocFormData({ ...docFormData, expiryDate: '' })}
                        style={{ fontSize: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <input 
                    type="date" 
                    className="form-control"
                    value={docFormData.expiryDate}
                    onChange={(e) => setDocFormData({ ...docFormData, expiryDate: e.target.value })}
                  />
                </div>

                {/* File Upload Area */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>
                    Document File Attachment (PDF, JPG, PNG, SVG) *
                  </label>
                  
                  <div style={{
                    border: '2px dashed #ede6d9',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center',
                    background: '#fdfbf7',
                    position: 'relative'
                  }}>
                    <input 
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                      onChange={handleDocFileUpload}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <UploadCloud size={28} style={{ color: 'var(--primary)', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>
                      {docFormData.fileName ? docFormData.fileName : 'Click or Drag & Drop to Upload Document'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {docFormData.fileSize ? `File Size: ${docFormData.fileSize} • Click to replace` : 'Supports PDF, PNG, JPG, SVG up to 8MB'}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '800' }}>Notes / Description</label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    placeholder="Policy number, testing center name, claim reference, or specific vehicle remarks..."
                    value={docFormData.notes}
                    onChange={(e) => setDocFormData({ ...docFormData, notes: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsDocModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UploadCloud size={14} /> {editingDoc ? 'Update Document' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document In-Browser Preview Modal */}
      {previewingDoc && (
        <div className="modal-overlay" style={{ zIndex: 2200 }}>
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%', borderRadius: '14px', padding: '22px', background: '#ffffff', border: '1.5px solid #ede6d9', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: '#ede6d9', color: '#543c2b', fontWeight: '800', fontFamily: 'monospace', fontSize: '13px', padding: '3px 8px', borderRadius: '5px' }}>
                  {previewingDoc.carPlate}
                </span>
                <span className="badge" style={{ ...getDocCategoryStyle(previewingDoc.category), fontWeight: '700', fontSize: '11px' }}>
                  {previewingDoc.category}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  {previewingDoc.title}
                </h3>
              </div>
              <button onClick={() => setPreviewingDoc(null)} className="modal-close">&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '14px' }}>
              {/* Document Visual Viewer */}
              <div style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '14px' }}>
                {previewingDoc.fileType?.includes('pdf') ? (
                  <div style={{ height: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <FileText size={48} style={{ color: 'var(--primary)' }} />
                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{previewingDoc.fileName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF Document ({previewingDoc.fileSize})</p>
                    <button onClick={() => handleDownloadDoc(previewingDoc)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} /> Open / Download PDF
                    </button>
                  </div>
                ) : (
                  <img 
                    src={previewingDoc.fileData} 
                    alt={previewingDoc.title} 
                    style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '6px' }} 
                  />
                )}
              </div>

              {/* Document Metadata Summary */}
              <div style={{ background: '#fdfbf7', border: '1px solid #ede6d9', borderRadius: '8px', padding: '12px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Car Plate:</span>
                  <span style={{ fontWeight: '800', fontFamily: 'monospace' }}>{previewingDoc.carPlate}</span> ({carLabels[previewingDoc.carPlate] || 'Fleet Car'})
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Category:</span>
                  <span style={{ fontWeight: '700' }}>{previewingDoc.category}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Issue Date:</span>
                  <span style={{ fontWeight: '600' }}>{previewingDoc.issueDate ? previewingDoc.issueDate.split('-').reverse().join('/') : '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Expiry Date:</span>
                  <span style={{ fontWeight: '700', color: getDocExpiryInfo(previewingDoc.expiryDate).color }}>
                    {previewingDoc.expiryDate ? previewingDoc.expiryDate.split('-').reverse().join('/') : 'Permanent / No Expiry'}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #ede6d9', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Notes / Details:</span>
                  <span>{previewingDoc.notes || 'Official corporate record.'}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid #ede6d9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleDownloadDoc(previewingDoc)} 
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Download size={14} /> Download File
                </button>
                <button 
                  onClick={() => handleWhatsAppShareDoc(previewingDoc)} 
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#047857' }}
                >
                  <Share2 size={14} /> Share on WhatsApp
                </button>
              </div>

              <button onClick={() => setPreviewingDoc(null)} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
