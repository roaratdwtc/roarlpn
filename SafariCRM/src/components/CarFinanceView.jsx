import React, { useState } from 'react';
import { Car, Landmark, Receipt, Percent, Plus, Trash2, Edit2, Clipboard, DollarSign, Calendar, Search, Filter, Printer, Copy, FileText, Sparkles } from 'lucide-react';
import DocumentOcrUploader from './DocumentOcrUploader';

const freelancerWhatsAppMap = {
  'Jaspreen': '971551356738',
  'Bashar': '971558066595',
  'Shahmir': '971564847249',
  'Umar': '971522262975',
  'Mirza': '971524748814',
  'Irshad': '971554321940',
  'Shafique': '971557440285',
  'Munawar': '971543260032',
  'Asad': '971589344077',
  'M. Aslam': '971547535622'
};

export default function CarFinanceView({ cars, setCars, drivers = [], viewMode = 'registry', carDocuments = [], setActiveTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('all');
  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id || null);

  // Modal states for CRUD Car
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carFormData, setCarFormData] = useState({
    plateNo: '',
    bank: 'Emirates NBD',
    brand: 'Land Cruiser',
    model: '',
    owner: '',
    whatsapp: '',
    installment: 0,
    deferment: '',
    instDate: 15,
    currentValue: 0,
    regDate: '',
    expDate: '',
    insCompany: '',
    policyNo: '',
    insExp: '',
    color: '',
    chassisNo: '',
    passengers: 7
  });

  // Modal states for CRUD Ledger Monthly Record
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingLedgerRow, setEditingLedgerRow] = useState(null);
  const [ledgerFormData, setLedgerFormData] = useState({
    month: 'January',
    salik: 0,
    fine: 0,
    others: 0,
    installment: 0,
    received: 0,
    note: ''
  });

  // Modal states for traffic fines
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [fineFormData, setFineFormData] = useState({
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    month: 'January',
    amount: 0,
    description: ''
  });

  // Helper parser for DD-MM-YYYY
  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Expiry calculation notification engine (alert threshold: 30 days)
  const getExpiryAlerts = () => {
    const today = new Date();
    const alerts = [];
    cars.forEach(c => {
      const driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === c.plateNo.toUpperCase());
      const driverName = driverObj ? driverObj.name : c.owner || 'N/A';

      // Parse Reg Expiry
      if (c.expDate) {
        const exp = parseDDMMYYYY(c.expDate);
        if (exp) {
          const diffTime = exp.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            alerts.push({
              plateNo: c.plateNo,
              type: 'Registration',
              status: 'expired',
              days: Math.abs(diffDays),
              date: c.expDate,
              driverName
            });
          } else if (diffDays <= 30) {
            alerts.push({
              plateNo: c.plateNo,
              type: 'Registration',
              status: 'warning',
              days: diffDays,
              date: c.expDate,
              driverName
            });
          }
        }
      }

      // Parse Insurance Expiry
      if (c.insExp) {
        const ins = parseDDMMYYYY(c.insExp);
        if (ins) {
          const diffTime = ins.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            alerts.push({
              plateNo: c.plateNo,
              type: 'Insurance',
              status: 'expired',
              days: Math.abs(diffDays),
              date: c.insExp,
              driverName
            });
          } else if (diffDays <= 30) {
            alerts.push({
              plateNo: c.plateNo,
              type: 'Insurance',
              status: 'warning',
              days: diffDays,
              date: c.insExp,
              driverName
            });
          }
        }
      }
    });
    return alerts;
  };

  // Filter Cars list
  const filteredCars = cars.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      c.plateNo.toLowerCase().includes(searchLower) ||
      c.brand.toLowerCase().includes(searchLower) ||
      c.owner.toLowerCase().includes(searchLower);

    const matchesBank = filterBank === 'all' ? true : c.bank === filterBank;
    return matchesSearch && matchesBank;
  });

  // Get selected car object (reactive fallback to first car if selectedCarId is not found)
  const selectedCar = cars.find(c => c.id === selectedCarId) || cars[0];

  // Calculate Running Ledger Balance mathematically
  const getCalculatedLedger = (car) => {
    if (!car || !car.ledger) return [];
    const fines = car.fines || [];
    let runningPending = 0;
    return car.ledger.map((row, index) => {
      const salik = parseFloat(row.salik) || 0;
      
      // Sum traffic violation fines matching this row's month name
      const monthlyFinesSum = fines
        .filter(f => f.month.toLowerCase() === row.month.toLowerCase())
        .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
      
      const fine = monthlyFinesSum > 0 ? monthlyFinesSum : (parseFloat(row.fine) || 0);
      const others = parseFloat(row.others) || 0;
      const installment = parseFloat(row.installment) || 0;
      const received = parseFloat(row.received) || 0;

      const rowCost = salik + fine + others + installment - received;
      runningPending += rowCost;

      return {
        ...row,
        sn: index + 1,
        fine,
        netAddition: rowCost,
        cumulativePending: runningPending
      };
    });
  };

  const calculatedLedgerRows = getCalculatedLedger(selectedCar);
  const finalPendingBalance = calculatedLedgerRows[calculatedLedgerRows.length - 1]?.cumulativePending || 0;

  // Selected vehicle lease calculations (60 months total financed)
  const paidInsts = selectedCar ? (selectedCar.ledger || []).filter(row => {
    const note = (row.note || '').toLowerCase();
    return !note.includes('deferment') && !note.includes('deferred');
  }).length : 0;
  
  const pendingInsts = selectedCar ? Math.max(0, 60 - paidInsts) : 0;
  const leasePendingBalance = selectedCar ? Math.max(0, pendingInsts * (parseFloat(selectedCar.installment) || 0)) : 0;

  // Overview stats across all cars
  const totalVehiclesCount = cars.length;
  const activeBankInstallments = cars.filter(c => c.installment > 0).length;
  
  const totalOutstandingPendingAcrossAllCars = cars.reduce((total, car) => {
    const ledger = getCalculatedLedger(car);
    const pending = ledger[ledger.length - 1]?.cumulativePending || 0;
    return total + pending;
  }, 0);

  const totalMarketValueAcrossAllCars = cars.reduce((sum, c) => sum + (parseFloat(c.currentValue) || 0), 0);

  // Report and PDF WhatsApp Handlers
  const handleGenerateReport = () => {
    if (!selectedCar) return;
    const element = document.getElementById('printable-area');
    if (!element) {
      window.print();
      return;
    }

    // Driver name retrieval
    const driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === selectedCar.plateNo.toUpperCase());
    const driverName = driverObj ? driverObj.name : (selectedCar.owner || 'Driver');
    const driverNameClean = driverName.replace(/[^a-zA-Z0-9]/g, '');

    // Month retrieval
    const latestMonth = calculatedLedgerRows[calculatedLedgerRows.length - 1]?.month || 'Statement';
    const latestMonthClean = latestMonth.replace(/[^a-zA-Z]/g, ''); // Extracts letters only (e.g. "June")

    const fileName = `${driverNameClean}${latestMonthClean}BalanceReport.png`;
    const originalTitle = document.title;
    document.title = `${driverNameClean}${latestMonthClean}BalanceReport`;

    // Dynamically import html2canvas for instant load
    import('html2canvas').then(({ default: html2canvas }) => {
      const noPrintElements = element.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.style.visibility = 'hidden');

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        noPrintElements.forEach(el => el.style.visibility = 'visible');
        document.title = originalTitle;

        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error("html2canvas capture failed, falling back to print:", err);
        noPrintElements.forEach(el => el.style.visibility = 'visible');
        document.title = originalTitle;
        window.print();
      });
    }).catch(err => {
      console.error("Failed to load html2canvas, printing natively:", err);
      document.title = originalTitle;
      window.print();
    });
  };

  const handlePrintLedger = () => {
    if (!selectedCar) return;
    const originalTitle = document.title;

    const driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === selectedCar.plateNo.toUpperCase());
    const driverName = driverObj ? driverObj.name : (selectedCar.owner || 'Driver');
    const driverNameClean = driverName.replace(/[^a-zA-Z0-9]/g, '');

    const latestMonth = calculatedLedgerRows[calculatedLedgerRows.length - 1]?.month || 'Statement';
    const latestMonthClean = latestMonth.replace(/[^a-zA-Z]/g, '');

    document.title = `${driverNameClean}${latestMonthClean}BalanceReport`;
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleWhatsAppShare = () => {
    if (!selectedCar) return;
    
    // Find driver matching by plate
    let driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === selectedCar.plateNo.toUpperCase());
    
    // Fallback: Find driver matching by owner name (case-insensitive)
    const ownerName = selectedCar.owner || '';
    if (!driverObj && ownerName) {
      driverObj = drivers.find(d => d.name && d.name.toLowerCase().includes(ownerName.toLowerCase()));
    }
    
    const cleanOwner = ownerName.trim().toLowerCase();
    const mapKey = Object.keys(freelancerWhatsAppMap).find(k => k.toLowerCase() === cleanOwner);
    const mappedWhatsApp = selectedCar.whatsapp || (mapKey ? freelancerWhatsAppMap[mapKey] : '');
    const rawPhone = mappedWhatsApp || driverObj?.whatsapp || driverObj?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    
    let targetPhone = cleanPhone;
    if (!targetPhone) {
      targetPhone = prompt(
        "No WhatsApp number found for this driver/freelancer. Please enter country code (e.g. 971501234567):", 
        "971543466557"
      );
      if (!targetPhone) return;
    }
    
    const plateClean = selectedCar.plateNo.replace(/[^a-zA-Z0-9]/g, '');
    const latestMonth = calculatedLedgerRows[calculatedLedgerRows.length - 1]?.month || 'Statement';
    const pdfFileName = `${plateClean}${latestMonth}Balance.pdf`;
    
    const shareMessage = `*ROAR ADVENTURE TOURISM - VEHICLE FINANCE STATEMENT*\n` +
      `--------------------------------------------------\n` +
      `*Vehicle:* ${selectedCar.plateNo}\n` +
      `*Driver / Freelancer:* ${driverObj ? driverObj.name : selectedCar.owner}\n` +
      `*Statement Month:* ${latestMonth}\n` +
      `*Pending Balance:* AED ${finalPendingBalance.toLocaleString()}\n` +
      `--------------------------------------------------\n` +
      `Please check the attached PDF: *${pdfFileName}*`;
      
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank');
  };

  // Save Car (Add/Edit)
  const handleOpenAddCarModal = () => {
    setEditingCar(null);
    setCarFormData({
      plateNo: '',
      bank: 'Emirates NBD',
      brand: 'Land Cruiser',
      model: new Date().getFullYear().toString(),
      owner: 'Roar',
      whatsapp: '',
      installment: 4400,
      deferment: 'April+May',
      instDate: 15,
      currentValue: 220000,
      regDate: '',
      expDate: '',
      insCompany: 'Orient Insurance',
      policyNo: '',
      insExp: '',
      color: 'White',
      chassisNo: '',
      passengers: 7
    });
    setIsCarModalOpen(true);
  };

  const handleOpenEditCarModal = (car) => {
    setEditingCar(car);
    setCarFormData({
      plateNo: car.plateNo,
      bank: car.bank,
      brand: car.brand,
      model: car.model || '',
      owner: car.owner || '',
      whatsapp: car.whatsapp || freelancerWhatsAppMap[car.owner] || freelancerWhatsAppMap[(car.owner || '').trim()] || '',
      installment: car.installment || 0,
      deferment: car.deferment || '',
      instDate: car.instDate || 15,
      currentValue: car.currentValue || 0,
      regDate: car.regDate || '',
      expDate: car.expDate || '',
      insCompany: car.insCompany || '',
      policyNo: car.policyNo || '',
      insExp: car.insExp || '',
      color: car.color || '',
      chassisNo: car.chassisNo || '',
      passengers: car.passengers || 7
    });
    setIsCarModalOpen(true);
  };

  const handleSaveCar = (e) => {
    e.preventDefault();
    if (!carFormData.plateNo) {
      alert('Plate Number is required.');
      return;
    }

    const finalPlate = carFormData.plateNo.toUpperCase().trim();
    const finalId = `car-${finalPlate.toLowerCase().replace(/\s+/g, '-')}`;

    if (editingCar) {
      setCars(cars.map(c => c.id === editingCar.id ? { 
        ...c, 
        ...carFormData, 
        plateNo: finalPlate,
        id: finalId,
        ledger: c.ledger || []
      } : c));
    } else {
      const newCar = {
        ...carFormData,
        id: finalId,
        plateNo: finalPlate,
        ledger: []
      };
      setCars([...cars, newCar]);
      setSelectedCarId(newCar.id);
    }
    setIsCarModalOpen(false);
  };

  const handleDeleteCar = (carId) => {
    if (window.confirm('Are you sure you want to remove this vehicle from database? All running logs and ledger data will be deleted permanent.')) {
      setCars(cars.filter(c => c.id !== carId));
      if (selectedCarId === carId) {
        setSelectedCarId(cars[0]?.id || null);
      }
    }
  };

  const handleCloneCar = (car) => {
    const suffix = Math.floor(Math.random() * 100);
    const cloned = {
      ...car,
      id: `car-cloned-${Date.now()}`,
      plateNo: `${car.plateNo}-CL${suffix}`,
      ledger: car.ledger ? [...car.ledger] : []
    };
    setCars([...cars, cloned]);
  };

  // Save Ledger Row (Add/Edit)
  const handleOpenAddLedgerModal = () => {
    setEditingLedgerRow(null);
    setLedgerFormData({
      month: 'June',
      salik: 0,
      fine: 0,
      others: 0,
      installment: selectedCar?.installment || 0,
      received: 0,
      note: ''
    });
    setIsLedgerModalOpen(true);
  };

  const handleOpenEditLedgerRow = (row) => {
    setEditingLedgerRow(row);
    setLedgerFormData({
      month: row.month,
      salik: row.salik || 0,
      fine: row.fine || 0,
      others: row.others || 0,
      installment: row.installment || 0,
      received: row.received || 0,
      note: row.note || ''
    });
    setIsLedgerModalOpen(true);
  };

  const handleSaveLedgerRow = (e) => {
    e.preventDefault();
    if (!selectedCar) return;

    const currentLedger = selectedCar.ledger || [];
    let updatedLedger;

    if (editingLedgerRow) {
      updatedLedger = currentLedger.map(row => 
        row.id === editingLedgerRow.id ? { ...row, ...ledgerFormData } : row
      );
    } else {
      const newRow = {
        ...ledgerFormData,
        id: `row-${Date.now()}`
      };
      updatedLedger = [...currentLedger, newRow];
    }

    setCars(cars.map(c => c.id === selectedCar.id ? { ...c, ledger: updatedLedger } : c));
    setIsLedgerModalOpen(false);
  };

  const handleDeleteLedgerRow = (rowId) => {
    if (window.confirm('Are you sure you want to remove this ledger entry row?')) {
      const updatedLedger = (selectedCar.ledger || []).filter(row => row.id !== rowId);
      setCars(cars.map(c => c.id === selectedCar.id ? { ...c, ledger: updatedLedger } : c));
    }
  };

  const handleSaveFine = (e) => {
    e.preventDefault();
    if (!selectedCar) return;
    if (!fineFormData.amount || fineFormData.amount <= 0) {
      alert('Please enter a valid fine amount.');
      return;
    }
    const newFine = {
      ...fineFormData,
      id: `fine-${Date.now()}`
    };
    const updatedFines = [...(selectedCar.fines || []), newFine];
    setCars(cars.map(c => c.id === selectedCar.id ? { ...c, fines: updatedFines } : c));
    setIsFineModalOpen(false);
  };

  const handleFineDateChange = (dateVal) => {
    const monthsList = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const parts = dateVal.split('-');
    let monthName = fineFormData.month;
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthName = monthsList[monthIdx];
      }
    }
    setFineFormData({
      ...fineFormData,
      date: dateVal,
      month: monthName
    });
  };

  if (viewMode === 'registry') {
    const alerts = getExpiryAlerts();

    return (
      <div>
        {/* Expiry Alerts Panel */}
        {alerts.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '14px', fontWeight: '800' }}>
              <span style={{ display: 'inline-flex', padding: '4px', background: '#fee2e2', borderRadius: '50%' }}>⚠️</span>
              VEHICLE REGISTRATION & INSURANCE EXPIRY CENTER ({alerts.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {alerts.map((a, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: a.status === 'expired' ? '#fee2e2' : '#fef3c7',
                  borderLeft: `4px solid ${a.status === 'expired' ? '#ef4444' : '#f59e0b'}`,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  <div>
                    <strong style={{ color: '#111827' }}>{a.plateNo}</strong> ({a.type}) &bull; Driver / Freelancer: <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{a.driverName}</span>
                  </div>
                  <div style={{ fontWeight: '800', color: a.status === 'expired' ? '#b91c1c' : '#b45309' }}>
                    {a.status === 'expired' ? `🔴 EXPIRED ${a.days} days ago (${a.date})` : `⚠️ Expiring in ${a.days} days (${a.date})`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview stats cards (2 cards per row on mobile) */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span>TOTAL REGISTERED CARS</span>
              <Car style={{ color: 'var(--primary)' }} />
            </div>
            <div className="stat-value">{totalVehiclesCount} Cars</div>
            <div className="stat-footer">Active operational fleet</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>BANK FINANCE CARS</span>
              <Landmark style={{ color: '#059669' }} />
            </div>
            <div className="stat-value">{activeBankInstallments} Active</div>
            <div className="stat-footer">Carrying monthly installments</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>TOTAL ASSETS BOOK VALUE</span>
              <DollarSign style={{ color: '#2563eb' }} />
            </div>
            <div className="stat-value">AED {totalMarketValueAcrossAllCars.toLocaleString()}</div>
            <div className="stat-footer">Combined market valuation</div>
          </div>

          <div className="stat-card" style={{ background: 'rgba(140, 91, 48, 0.05)', borderColor: 'var(--primary)' }}>
            <div className="stat-header">
              <span>TOTAL OUTSTANDING PENDING</span>
              <Receipt style={{ color: 'var(--primary)' }} />
            </div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              AED {totalOutstandingPendingAcrossAllCars.toLocaleString()}
            </div>
            <div className="stat-footer">Cumulative pending fleet balance</div>
          </div>
        </div>

        {/* Cars Registry Main Panel */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="panel-title" style={{ margin: 0 }}>
              <span>Vehicles & Freelancer Profiles Registry</span>
            </div>
            <button onClick={handleOpenAddCarModal} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}>
              <Plus size={15} /> Add Vehicle / Freelancer
            </button>
          </div>

          {/* Filtering Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: '1 1 200px' }}>
              <Search size={14} />
              <input 
                type="text" 
                className="form-control"
                placeholder="Search Plate#, Brand, Owner..."
                style={{ padding: '8px 12px 8px 34px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="form-control"
              style={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '100%', padding: '8px', fontSize: '13px' }}
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            >
              <option value="all">All Banks</option>
              <option value="Emirates NBD">Emirates NBD</option>
              <option value="Emirates Islamic">Emirates Islamic</option>
              <option value="RAK Bank">RAK Bank</option>
              <option value="ADCB">ADCB</option>
              <option value="No Bank">No Bank / Free</option>
            </select>
          </div>

          {/* Cars Table */}
          <div className="table-responsive">
            <table className="modal-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Plate#</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Brand & Model</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Financing Bank</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Owner / Driver</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Expiries</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Monthly Installment</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Asset Book Value</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(c => {
                  const driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === c.plateNo.toUpperCase());
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '14px 10px', fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                        {c.plateNo}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ fontWeight: '600' }}>{c.brand}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Year: {c.model || '—'} &bull; {c.color || '—'}</div>
                      </td>
                      <td style={{ padding: '14px 10px', fontWeight: '500' }}>
                        {c.bank}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{c.owner}</div>
                        {driverObj && (
                          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                            Driver: {driverObj.name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        {(() => {
                          const today = new Date();
                          const parseDate = (dStr) => {
                            if (!dStr) return null;
                            const parts = dStr.split('-');
                            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                          };

                          const exp = parseDate(c.expDate);
                          const ins = parseDate(c.insExp);

                          const getExpiryText = (dateObj, rawStr, label) => {
                            if (!dateObj) return <span style={{ color: '#9ca3af' }}>No {label}</span>;
                            const diffDays = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < 0) {
                              return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 Expired ({rawStr})</span>;
                            } else if (diffDays <= 30) {
                              return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚠️ {diffDays}d ({rawStr})</span>;
                            }
                            return <span style={{ color: '#059669' }}>🟢 {rawStr}</span>;
                          };

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                              <div><strong>Reg Expiry:</strong> {getExpiryText(exp, c.expDate, 'Reg')}</div>
                              <div><strong>Ins Expiry:</strong> {getExpiryText(ins, c.insExp, 'Ins')}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                        {c.installment > 0 ? c.installment.toLocaleString() : 'No Bank'}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right', fontWeight: '500', color: 'var(--text-muted)' }}>
                        {c.currentValue > 0 ? c.currentValue.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              if (setActiveTab) setActiveTab('carExpenses');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8c5b30', borderColor: '#ede6d9' }}
                            title={`View Official Documents Vault for ${c.plateNo}`}
                          >
                            <FileText size={12} /> Docs ({(carDocuments || []).filter(d => d.carPlate === c.plateNo).length})
                          </button>
                          <button 
                            onClick={() => handleCloneCar(c)}
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            title="Clone Vehicle Settings"
                          >
                            <Copy size={13} />
                          </button>
                          <button 
                            onClick={() => handleOpenEditCarModal(c)}
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCar(c.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCars.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No vehicles found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRUD Vehicle Modal */}
        {isCarModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '550px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                  {editingCar ? 'Modify Vehicle Details' : 'Register Vehicle Profile'}
                </h3>
                <button onClick={() => setIsCarModalOpen(false)} className="modal-close">&times;</button>
              </div>

              <form onSubmit={handleSaveCar} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {/* Document OCR Auto-Fill Zone */}
                <DocumentOcrUploader 
                  label="Scan Mulkiya / Insurance (Auto-Fill Vehicle Details)"
                  onExtracted={(extracted) => {
                    setCarFormData(prev => ({
                      ...prev,
                      plateNo: extracted.plateNo || prev.plateNo,
                      brand: extracted.brand || prev.brand,
                      model: extracted.model || prev.model,
                      owner: extracted.owner || prev.owner,
                      regDate: extracted.regDate ? extracted.regDate.split('-').reverse().join('-') : prev.regDate,
                      expDate: extracted.expDate ? extracted.expDate.split('-').reverse().join('-') : prev.expDate,
                      insCompany: extracted.insCompany || prev.insCompany,
                      policyNo: extracted.policyNo || prev.policyNo,
                      insExp: extracted.insExp ? extracted.insExp.split('-').reverse().join('-') : prev.insExp,
                      chassisNo: extracted.chassisNo || prev.chassisNo,
                      color: extracted.color || prev.color,
                      passengers: extracted.passengers || prev.passengers
                    }));
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      required
                      placeholder="Plate Number * (e.g. EE66074)"
                      title="Plate Number *"
                      value={carFormData.plateNo}
                      onChange={(e) => setCarFormData({ ...carFormData, plateNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <select 
                      className="form-control"
                      title="Financing Bank *"
                      value={carFormData.bank}
                      onChange={(e) => setCarFormData({ ...carFormData, bank: e.target.value })}
                    >
                      <option value="Emirates NBD">Bank: Emirates NBD</option>
                      <option value="Emirates Islamic">Bank: Emirates Islamic</option>
                      <option value="RAK Bank">Bank: RAK Bank</option>
                      <option value="ADCB">Bank: ADCB</option>
                      <option value="No Bank">No Bank (Paid Off / Owned)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      required
                      placeholder="Brand / Model * (e.g. Land Cruiser)"
                      title="Brand / Model *"
                      value={carFormData.brand}
                      onChange={(e) => setCarFormData({ ...carFormData, brand: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Model Year (e.g. 2024)"
                      title="Model Year"
                      value={carFormData.model}
                      onChange={(e) => setCarFormData({ ...carFormData, model: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Vehicle Owner / Driver Name"
                      title="Vehicle Owner / Driver Name"
                      value={carFormData.owner}
                      onChange={(e) => setCarFormData({ ...carFormData, owner: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Owner WhatsApp (+971...)"
                      title="Owner WhatsApp (Freelancer Share)"
                      value={carFormData.whatsapp || ''}
                      onChange={(e) => setCarFormData({ ...carFormData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Monthly Installment (AED)"
                      title="Monthly Installment (AED)"
                      value={carFormData.installment || ''}
                      onChange={(e) => setCarFormData({ ...carFormData, installment: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Due Day of Month (e.g. 15)"
                      title="Due Date (Day of Month)"
                      min="1"
                      max="31"
                      value={carFormData.instDate}
                      onChange={(e) => setCarFormData({ ...carFormData, instDate: parseInt(e.target.value) || 15 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Deferment Schedule / Notes"
                      title="Deferment Schedule / Notes"
                      value={carFormData.deferment}
                      onChange={(e) => setCarFormData({ ...carFormData, deferment: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Current Value (AED)"
                      title="Current Value (AED)"
                      value={carFormData.currentValue || ''}
                      onChange={(e) => setCarFormData({ ...carFormData, currentValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Registration, Insurance, capacity detail fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Color (e.g. White)"
                      title="Color"
                      value={carFormData.color}
                      onChange={(e) => setCarFormData({ ...carFormData, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Chassis Number"
                      title="Chassis Number"
                      value={carFormData.chassisNo}
                      onChange={(e) => setCarFormData({ ...carFormData, chassisNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Capacity (Pax)"
                      title="Capacity (Passengers)"
                      value={carFormData.passengers}
                      onChange={(e) => setCarFormData({ ...carFormData, passengers: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Registration Date (DD-MM-YYYY)"
                      title="Registration Date"
                      value={carFormData.regDate}
                      onChange={(e) => setCarFormData({ ...carFormData, regDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Registration Expiry (DD-MM-YYYY)"
                      title="Registration Expiry Date"
                      value={carFormData.expDate}
                      onChange={(e) => setCarFormData({ ...carFormData, expDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Insurance Company (e.g. Orient)"
                      title="Insurance Company"
                      value={carFormData.insCompany}
                      onChange={(e) => setCarFormData({ ...carFormData, insCompany: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Insurance Policy #"
                      title="Policy Number"
                      value={carFormData.policyNo}
                      onChange={(e) => setCarFormData({ ...carFormData, policyNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Insurance Expiry Date (DD-MM-YYYY)"
                    title="Insurance Expiry Date"
                    value={carFormData.insExp}
                    onChange={(e) => setCarFormData({ ...carFormData, insExp: e.target.value })}
                  />
                </div>

                <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setIsCarModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCar ? 'Update Fleet' : 'Add Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // viewMode === 'ledger'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {selectedCar ? (
        <div id="printable-area" className="premium-ledger-container">
          {/* Top Selection Row & Control Buttons */}
          <div className="controls-bar no-print" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            borderBottom: '1px solid rgba(140, 91, 48, 0.12)',
            paddingBottom: '14px',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: 'auto' }}>
              <span style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Vehicle:
              </span>
              <select 
                className="form-control"
                style={{ 
                  width: '100%',
                  maxWidth: '320px', 
                  padding: '8px 12px', 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  borderColor: 'var(--primary)', 
                  borderRadius: '10px' 
                }}
                value={selectedCarId || ''}
                onChange={(e) => setSelectedCarId(e.target.value)}
              >
                {cars.map(c => {
                  const driverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === c.plateNo.toUpperCase());
                  const driverStr = driverObj ? ` - Driven by ${driverObj.name}` : '';
                  return (
                    <option key={c.id} value={c.id}>
                      {c.plateNo} ({c.brand} - {c.owner}{driverStr})
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: 'auto', justifyContent: 'flex-start', alignItems: 'center', marginTop: '0px' }} className="no-print">
              <button 
                onClick={handleWhatsAppShare}
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px 12px', 
                  borderColor: '#25D366',
                  color: '#25D366',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Share Statement to WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.468 3.42 1.284 4.884L2 22l5.244-1.26c1.416.768 3.012 1.212 4.768 1.212 5.532 0 10.012-4.48 10.012-10.012C22.024 6.48 17.544 2 12.012 2zm.006 17.172c-1.572 0-3.12-.42-4.488-1.224l-.324-.192-3.324.804.816-3.216-.216-.336c-.888-1.428-1.356-3.096-1.356-4.8 0-4.944 4.02-8.964 8.964-8.964 4.944 0 8.964 4.02 8.964 8.964 0 4.956-4.008 8.964-8.964 8.964zm4.908-6.72c-.276-.132-1.608-.792-1.86-.888-.252-.096-.432-.144-.612.132-.18.276-.696.888-.852 1.068-.156.18-.312.204-.588.072-.276-.132-1.164-.432-2.22-1.368-.816-.732-1.368-1.632-1.524-1.908-.156-.276-.012-.42.12-.552.12-.12.276-.324.408-.48.132-.156.18-.276.264-.456.096-.18.048-.336-.024-.48-.072-.144-.612-1.476-.84-2.016-.216-.528-.444-.456-.612-.456-.156 0-.336-.024-.516-.024-.18 0-.48.072-.732.348-.252.276-.96.936-.96 2.28 0 1.344.984 2.64 1.104 2.808.12.168 1.932 2.952 4.692 4.14 1.548.66 2.196.756 2.988.648.516-.072 1.608-.66 1.836-1.296.228-.636.228-1.188.156-1.296-.072-.108-.264-.168-.54-.3z"/>
                </svg>
              </button>
              <button 
                onClick={handlePrintLedger}
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} /> Save PDF / Print
              </button>
              <button onClick={handleOpenAddLedgerModal} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}>
                <Plus size={15} /> Add Ledger Row
              </button>
              <button 
                onClick={() => {
                  const monthsList = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  setFineFormData({
                    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
                    month: monthsList[new Date().getMonth()],
                    amount: 0,
                    description: ''
                  });
                  setIsFineModalOpen(true);
                }} 
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  background: 'rgba(239, 68, 68, 0.05)'
                }}
              >
                <Plus size={14} style={{ color: '#ef4444' }} /> Add Fines
              </button>
            </div>
          </div>

          {/* Premium Statement Header - PRINT ONLY */}
          <div className="premium-ledger-header print-only">
            <div className="premium-logo-block">
              <img src="/logo.jpg" alt="Roar Adventure Tourism" style={{ maxHeight: '55px', display: 'block', marginBottom: '8px' }} />
              <p style={{ fontWeight: 'bold', margin: '2px 0', color: '#2c2520' }}>Roar Adventure Tourism LLC</p>
              <p style={{ margin: '1px 0', fontSize: '11px', color: '#6b5c50' }}>Dubai World Trade Centre 2, Dubai, UAE</p>
              <p style={{ margin: '1px 0', fontSize: '11px', color: '#6b5c50' }}>TRN: 104650317100003</p>
            </div>
            
            <div className="premium-ledger-title-block">
              <h2>VEHICLE FINANCE STATEMENT</h2>
              <div className="premium-ledger-ref">Statement Ref: <strong>ST-{selectedCar.plateNo}</strong></div>
              
              <div className="premium-balance-due-card">
                <span className="label">PENDING BALANCE</span>
                <span className="value">AED {finalPendingBalance.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Statement Details Block - PRINT ONLY */}
          <div className="premium-ledger-details print-only">
            <div className="premium-driver-info">
              <h4>Statement For:</h4>
              {(() => {
                const selectedDriverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === selectedCar.plateNo.toUpperCase());
                return (
                  <>
                    <strong>{selectedDriverObj ? selectedDriverObj.name : selectedCar.owner}</strong>
                    <p>Plate No: <strong>{selectedCar.plateNo}</strong> ({selectedCar.brand} &bull; {selectedCar.model})</p>
                    <p>Owner: {selectedCar.owner} &bull; Bank: {selectedCar.bank}</p>
                    <p>Installment Day: {selectedCar.instDate}th of each month</p>
                    <p style={{ marginTop: '8px', borderTop: '1px dashed #efe9df', paddingTop: '6px' }}>Registration Date: <strong>{selectedCar.regDate || 'N/A'}</strong> &bull; Lease: <strong>5 Years (60 Months)</strong></p>
                    <p>Pending Installments: <strong>{pendingInsts}</strong> &bull; Total Lease Pending: <strong>AED {leasePendingBalance.toLocaleString()}</strong></p>
                  </>
                );
              })()}
            </div>
            
            <div className="premium-ledger-meta">
              <div>
                <span className="label">Statement Date:</span>
                <span className="val">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div>
                <span className="label">Statement Period:</span>
                <span className="val">
                  {calculatedLedgerRows[0]?.month || 'Start'} - {calculatedLedgerRows[calculatedLedgerRows.length - 1]?.month || 'End'}
                </span>
              </div>
              <div>
                <span className="label">Terms:</span>
                <span className="val">Finance Ledgers</span>
              </div>
            </div>
          </div>

          {/* Screen Only Vehicle Header - SCREEN ONLY */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', padding: '4px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                  Vehicle: <span style={{ color: 'var(--primary)' }}>{selectedCar.plateNo}</span>
                </h3>
                <span className="badge badge-partner" style={{ fontSize: '11px' }}>
                  {selectedCar.brand} &bull; {selectedCar.model}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Bank: <strong>{selectedCar.bank}</strong> &bull; Owner: <strong>{selectedCar.owner}</strong> &bull; {(() => {
                  const selectedDriverObj = drivers.find(d => d.carPlate && d.carPlate.toUpperCase() === selectedCar.plateNo.toUpperCase());
                  return selectedDriverObj ? <>Driver: <strong style={{ color: 'var(--primary)' }}>{selectedDriverObj.name}</strong> &bull; </> : null;
                })()} Installment Due: <strong>{selectedCar.instDate}th each month</strong>
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', fontSize: '11.5px' }}>
                <div style={{ background: '#faf6f0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #efe9df', color: 'var(--text-dark)' }}>
                  <strong>Registration Date:</strong> {selectedCar.regDate || 'N/A'}
                </div>
                <div style={{ background: '#faf6f0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #efe9df', color: 'var(--text-dark)' }}>
                  <strong>Lease Duration:</strong> 5 Years (60 Months)
                </div>
                <div style={{ background: '#faf6f0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #efe9df', color: 'var(--text-dark)' }}>
                  <strong>Pending Installments:</strong> {pendingInsts}
                </div>
                <div style={{ background: '#faf6f0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #efe9df', color: 'var(--text-dark)' }}>
                  <strong>Total Lease Pending:</strong> AED {leasePendingBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Running Ledger Details Table */}
          <div className="table-responsive">
            <table className="modal-table premium-ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                  <th style={{ padding: '10px', textAlign: 'center', width: '50px' }}>S/N</th>
                  <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>Ins. Month</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '80px' }}>Salik</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '80px' }}>Fine</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '80px' }}>Others</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '95px' }}>Installment</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '95px' }}>Received</th>
                  <th style={{ padding: '10px', textAlign: 'right', width: '110px' }}>Total Pending</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Note</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '70px' }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculatedLedgerRows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {row.sn}
                    </td>
                    <td style={{ padding: '10px', fontWeight: '700', color: '#374151' }}>
                      {row.month}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.salik > 0 ? '#111827' : '#9ca3af' }}>
                      {row.salik > 0 ? row.salik.toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.fine > 0 ? '#ef4444' : '#9ca3af', fontWeight: row.fine > 0 ? '600' : 'normal' }}>
                      {row.fine > 0 ? row.fine.toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.others > 0 ? '#111827' : '#9ca3af' }}>
                      {row.others > 0 ? row.others.toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.installment > 0 ? '#111827' : '#9ca3af' }}>
                      {row.installment > 0 ? row.installment.toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: row.received > 0 ? '#059669' : '#9ca3af', fontWeight: row.received > 0 ? '600' : 'normal' }}>
                      {row.received > 0 ? row.received.toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: row.cumulativePending > 0 ? '#b45309' : '#059669' }}>
                      {row.cumulativePending.toLocaleString()}
                    </td>
                    <td 
                      style={{ 
                        padding: '10px', 
                        color: 'var(--text-muted)', 
                        fontSize: '11px', 
                        maxWidth: '180px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }} 
                      title={row.note || ''}
                    >
                      {row.note || '—'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }} className="no-print">
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => handleOpenEditLedgerRow(row)} style={{ padding: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => handleDeleteLedgerRow(row.id)} style={{ padding: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {calculatedLedgerRows.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No monthly finance statements logged. Click "Add Ledger Row" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Running Balance accounting footer card - SCREEN ONLY */}
          <div className="no-print" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginTop: '16px' 
          }}>
            <div style={{ 
              textAlign: 'right', 
              background: 'rgba(245, 158, 11, 0.08)', 
              border: '1px solid rgba(245, 158, 11, 0.2)', 
              padding: '12px 24px', 
              borderRadius: '12px',
              minWidth: '200px'
            }}>
              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PENDING BALANCE
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309', marginTop: '2px' }}>
                AED {finalPendingBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Traffic Fines Log - SCREEN ONLY */}
          <div className="no-print" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚨 TRAFFIC VIOLATIONS & FINES LEDGER (All Time)
            </h4>
            {(!selectedCar.fines || selectedCar.fines.length === 0) ? (
              <div style={{ padding: '16px', fontStyle: 'italic', color: 'var(--text-muted)', background: '#faf6f0', borderRadius: '8px', border: '1px dashed #efe9df', fontSize: '13px' }}>
                No traffic fines logged for this vehicle. Click "Add Fines" to log a violation fine.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {(() => {
                  const grouped = {};
                  (selectedCar.fines || []).forEach(f => {
                    if (!grouped[f.month]) grouped[f.month] = [];
                    grouped[f.month].push(f);
                  });
                  
                  return Object.keys(grouped).map(m => (
                    <div key={m} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: 'var(--primary)', borderBottom: '1px solid #efe9df', paddingBottom: '6px' }}>
                        {m} Fines
                      </h5>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {grouped[m].map(f => (
                          <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12px', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>AED {parseFloat(f.amount).toLocaleString()}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{f.date} &bull; {f.description}</div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this fine?')) {
                                  const updatedFines = (selectedCar.fines || []).filter(item => item.id !== f.id);
                                  setCars(cars.map(c => c.id === selectedCar.id ? { ...c, fines: updatedFines } : c));
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Traffic Fines Detail - PRINT ONLY */}
          {(() => {
            const latestMonth = calculatedLedgerRows[calculatedLedgerRows.length - 1]?.month || '';
            const currentMonthFines = (selectedCar.fines || []).filter(f => f.month.toLowerCase() === latestMonth.toLowerCase());
            if (currentMonthFines.length === 0) return null;
            
            return (
              <div className="print-only" style={{ marginTop: '20px', borderTop: '1.5px solid #c5a059', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#c5a059', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Traffic Violations & Fines Details - {latestMonth}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '10px' }}>
                  {currentMonthFines.map((f, idx) => (
                    <div key={f.id} style={{ display: 'flex', flexDirection: 'column', padding: '6px 10px', background: '#faf6f0', border: '1px solid #efe9df', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Fine #{idx + 1}</span>
                        <span style={{ color: '#ef4444' }}>AED {parseFloat(f.amount).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#543d2b', marginTop: '2px', fontSize: '9.5px' }}>
                        Date: {f.date} &bull; Violation: {f.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Running Balance accounting footer card - PRINT ONLY */}
          <div className="premium-ledger-footer-grid print-only">
            <div className="bank-details-card">
              <h5>Bank Transfer Details</h5>
              <div className="bank-row"><span>Account Name:</span><strong>Roar Adventure Tourism LLC</strong></div>
              <div className="bank-row"><span>Bank Name:</span><strong>RAK BANK (Currency: AED)</strong></div>
              <div className="bank-row"><span>Account Number:</span><strong>0373211257001</strong></div>
              <div className="bank-row"><span>IBAN Number:</span><strong>AE170400000373211257001</strong></div>
            </div>
            
            <div className="invoice-notes-card">
              <h5>Important Note</h5>
              <p>Please ensure all pending installments are cleared before the 10th of each month. Late payments may attract additional fines or legal holds on the vehicle license.</p>
              <div className="signature-area">
                <p>Finance Officer Signature</p>
                <div className="sig-line"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
          Select a vehicle to inspect monthly running accounting statements.
        </div>
      )}

      {/* CRUD Ledger Monthly Row Modal */}
      {isLedgerModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                {editingLedgerRow ? 'Edit Finance Statement Entry' : 'Log Monthly Statements Details'}
              </h3>
              <button onClick={() => setIsLedgerModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveLedgerRow} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div className="form-group">
                  <select 
                    className="form-control"
                    title="Month Name"
                    value={ledgerFormData.month}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, month: e.target.value })}
                  >
                    <option value="January">Month: January</option>
                    <option value="February">Month: February</option>
                    <option value="March">Month: March</option>
                    <option value="April">Month: April</option>
                    <option value="May">Month: May</option>
                    <option value="June">Month: June</option>
                    <option value="July">Month: July</option>
                    <option value="August">Month: August</option>
                    <option value="September">Month: September</option>
                    <option value="October">Month: October</option>
                    <option value="November">Month: November</option>
                    <option value="December">Month: December</option>
                  </select>
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Installment (AED)"
                    title="Installment (AED)"
                    value={ledgerFormData.installment || ''}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, installment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Salik Trips (AED)"
                    title="Salik Trips (AED)"
                    value={ledgerFormData.salik || ''}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, salik: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Traffic Fines (AED)"
                    title="Traffic Fines (AED)"
                    value={ledgerFormData.fine || ''}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, fine: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Others (AED)"
                    title="Others (AED)"
                    value={ledgerFormData.others || ''}
                    onChange={(e) => setLedgerFormData({ ...ledgerFormData, others: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="Amount Received / Deposited (AED)"
                  title="Amount Received / Deposited (AED)"
                  value={ledgerFormData.received || ''}
                  onChange={(e) => setLedgerFormData({ ...ledgerFormData, received: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Ledger Notes / Remarks (Payment date, reference, notes...)"
                  title="Ledger Notes / Remarks"
                  style={{ resize: 'none' }}
                  value={ledgerFormData.note}
                  onChange={(e) => setLedgerFormData({ ...ledgerFormData, note: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsLedgerModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLedgerRow ? 'Update ledger row' : 'Log Statement row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Traffic Fine Modal */}
      {isFineModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                🚨 Log Traffic Fine / Violation
              </h3>
              <button onClick={() => setIsFineModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleSaveFine} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <input 
                    type="date" 
                    className="form-control"
                    title="Fine Date"
                    value={fineFormData.date}
                    onChange={(e) => handleFineDateChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <select 
                    className="form-control"
                    title="Fine Month"
                    value={fineFormData.month}
                    onChange={(e) => setFineFormData({ ...fineFormData, month: e.target.value })}
                  >
                    <option value="January">Month: January</option>
                    <option value="February">Month: February</option>
                    <option value="March">Month: March</option>
                    <option value="April">Month: April</option>
                    <option value="May">Month: May</option>
                    <option value="June">Month: June</option>
                    <option value="July">Month: July</option>
                    <option value="August">Month: August</option>
                    <option value="September">Month: September</option>
                    <option value="October">Month: October</option>
                    <option value="November">Month: November</option>
                    <option value="December">Month: December</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="Fine Amount (AED) *"
                  title="Fine Amount (AED) *"
                  value={fineFormData.amount || ''}
                  onChange={(e) => setFineFormData({ ...fineFormData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Violation / Fine Description (e.g. Over speeding Sheikh Zayed Road)"
                  title="Violation / Fine Description"
                  style={{ resize: 'none' }}
                  value={fineFormData.description}
                  onChange={(e) => setFineFormData({ ...fineFormData, description: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsFineModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                  Log Traffic Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
