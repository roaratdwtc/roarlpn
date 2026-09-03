import React, { useState, useMemo } from 'react';
import { 
  Car, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  LogOut, 
  Calendar, 
  ShieldCheck, 
  Eye, 
  Receipt 
} from 'lucide-react';

export default function FreelancerPortalView({ 
  currentUser, 
  cars = [], 
  carExpenses = [], 
  freelancerReceipts = [], 
  setFreelancerReceipts, 
  onSignOut 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'expenses' | 'fines' | 'receipts'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Upload Form State
  const [receiptForm, setReceiptForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    notes: '',
    fileName: '',
    fileData: null
  });
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Identify freelancer's car plate(s)
  const userPlates = useMemo(() => {
    if (!currentUser) return [];
    const assignedPlate = (currentUser.linkedCarPlate || '').trim().toUpperCase();
    if (assignedPlate) return [assignedPlate];
    
    // Fallback: match by owner name or phone in cars list
    const matched = cars.filter(c => 
      (c.owner && currentUser.name && c.owner.toLowerCase().includes(currentUser.name.toLowerCase())) ||
      (c.driver && currentUser.name && c.driver.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
    return matched.map(c => (c.plate || '').toUpperCase()).filter(Boolean);
  }, [currentUser, cars]);

  // Scoped Cars: ONLY their own cars!
  const myCars = useMemo(() => {
    return cars.filter(c => userPlates.includes((c.plate || '').toUpperCase()));
  }, [cars, userPlates]);

  const selectedCar = myCars[0] || null;

  // Scoped Car Expenses: ONLY for their own car(s)!
  const myExpenses = useMemo(() => {
    return (carExpenses || []).filter(e => {
      const expPlate = (e.plate || '').toUpperCase();
      return userPlates.includes(expPlate);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [carExpenses, userPlates]);

  // Separate regular maintenance expenses vs traffic fines
  const regularExpenses = useMemo(() => {
    return myExpenses.filter(e => e.category !== 'Traffic Fine' && e.category !== 'Fines');
  }, [myExpenses]);

  const trafficFines = useMemo(() => {
    return myExpenses.filter(e => e.category === 'Traffic Fine' || e.category === 'Fines');
  }, [myExpenses]);

  // Scoped Receipts Uploaded by this Freelancer
  const myReceipts = useMemo(() => {
    return (freelancerReceipts || []).filter(r => {
      return (
        r.freelancerId === currentUser?.id || 
        r.phone === currentUser?.phone ||
        (r.plate && userPlates.includes(r.plate.toUpperCase()))
      );
    }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [freelancerReceipts, currentUser, userPlates]);

  // File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("File size exceeds 8MB limit. Please upload a smaller image or document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptForm(prev => ({
        ...prev,
        fileName: file.name,
        fileData: event.target.result
      }));
      setUploadError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    const parsedAmount = parseFloat(receiptForm.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setUploadError('Please enter a valid installment payment amount (AED).');
      return;
    }

    if (!receiptForm.fileData) {
      setUploadError('Please upload the payment receipt or bank transfer confirmation file.');
      return;
    }

    const newReceipt = {
      id: 'rcpt_' + Date.now(),
      freelancerId: currentUser?.id,
      freelancerName: currentUser?.name || 'Freelancer',
      phone: currentUser?.phone || '',
      plate: selectedCar?.plate || userPlates[0] || 'Unassigned',
      amount: parsedAmount,
      paymentDate: receiptForm.paymentDate,
      referenceNo: receiptForm.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
      notes: receiptForm.notes,
      fileName: receiptForm.fileName,
      fileData: receiptForm.fileData,
      status: 'pending_approval', // 'pending_approval' | 'approved' | 'rejected'
      submittedAt: new Date().toISOString(),
      adminRemarks: ''
    };

    if (setFreelancerReceipts) {
      setFreelancerReceipts(prev => [newReceipt, ...(prev || [])]);
    } else {
      const stored = JSON.parse(localStorage.getItem('safari_freelancer_receipts') || '[]');
      localStorage.setItem('safari_freelancer_receipts', JSON.stringify([newReceipt, ...stored]));
    }

    setUploadSuccess('Payment receipt submitted successfully! It is now pending admin review and will be credited to your car installment upon approval.');
    setReceiptForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      notes: '',
      fileName: '',
      fileData: null
    });
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadSuccess('');
    }, 2500);
  };

  // Financial Stats
  const totalFinesAmount = trafficFines.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  const totalMaintAmount = regularExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const monthlyInstallment = parseFloat(selectedCar?.installment) || 0;
  const pendingInstallmentsCount = parseInt(selectedCar?.pendingInst) || 0;
  const totalLeasePending = pendingInstallmentsCount * monthlyInstallment;

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7', color: '#543c2b', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Top Navbar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1.5px solid #ede6d9',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(140, 91, 48, 0.1)',
            border: '1px solid rgba(140, 91, 48, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8c5b30'
          }}>
            <Car size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#543c2b', lineHeight: '1.2' }}>
              {currentUser?.name || 'Freelancer Partner'}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361' }}>
              Freelancer Portal • Car Plate: <strong>{userPlates.join(', ') || 'Unassigned'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <Upload size={15} />
            <span>Upload Receipt</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="btn btn-secondary"
            title="Sign Out"
            style={{
              padding: '8px 12px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '8px',
              border: '1px solid #ede6d9'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1050px', margin: '0 auto', padding: '20px 16px 40px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              My Vehicle
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#543c2b' }}>
              {selectedCar ? selectedCar.plate : (userPlates[0] || 'No Car Assigned')}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              {selectedCar ? `${selectedCar.model || selectedCar.brand} (${selectedCar.year || '2024'})` : 'Contact admin to assign plate'}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Monthly Installment
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#8c5b30' }}>
              AED {monthlyInstallment.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              Due: {selectedCar?.instDate ? `${selectedCar.instDate}th of month` : '10th of month'}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Total Lease Pending
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#543c2b' }}>
              AED {totalLeasePending.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: '700' }}>
              {pendingInstallmentsCount} Installments Remaining
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(84,60,43,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c7361', textTransform: 'uppercase', marginBottom: '4px' }}>
              Traffic Fines Total
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: totalFinesAmount > 0 ? '#dc2626' : '#16a34a' }}>
              AED {totalFinesAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
              {trafficFines.length} Recorded Fines
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1.5px solid #ede6d9',
          paddingBottom: '12px',
          marginBottom: '20px',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'overview' ? '#8c5b30' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#8c7361',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Car Profile & Installments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'receipts' ? '#8c5b30' : 'transparent',
              color: activeTab === 'receipts' ? '#ffffff' : '#8c7361',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Payment Receipts ({myReceipts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'expenses' ? '#8c5b30' : 'transparent',
              color: activeTab === 'expenses' ? '#ffffff' : '#8c7361',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Maintenance & Expenses ({regularExpenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fines')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'fines' ? '#8c5b30' : 'transparent',
              color: activeTab === 'fines' ? '#ffffff' : '#8c7361',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Traffic Fines ({trafficFines.length})
          </button>
        </div>

        {/* TAB 1: CAR PROFILE & INSTALLMENT STATUS */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedCar ? (
              <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(84,60,43,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #ede6d9', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#543c2b' }}>
                      {selectedCar.plate} • {selectedCar.model || selectedCar.brand}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#8c7361' }}>
                      Official Leaseholder / Freelancer: <strong>{selectedCar.owner || currentUser?.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} />
                    Upload Payment Slip
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                    <div style={{ fontSize: '11px', color: '#8c7361', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle Year</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#543c2b', marginTop: '2px' }}>{selectedCar.year || '2024'}</div>
                  </div>

                  <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                    <div style={{ fontSize: '11px', color: '#8c7361', fontWeight: '800', textTransform: 'uppercase' }}>Mulkiya Registration</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#543c2b', marginTop: '2px' }}>{selectedCar.mulkiyaExpiry || selectedCar.regDate || 'Active'}</div>
                  </div>

                  <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                    <div style={{ fontSize: '11px', color: '#8c7361', fontWeight: '800', textTransform: 'uppercase' }}>Insurance Expiry</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#543c2b', marginTop: '2px' }}>{selectedCar.insuranceExpiry || selectedCar.insExpDate || 'Valid'}</div>
                  </div>

                  <div style={{ background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
                    <div style={{ fontSize: '11px', color: '#8c7361', fontWeight: '800', textTransform: 'uppercase' }}>Chassis / VIN</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#543c2b', marginTop: '2px', fontFamily: 'monospace' }}>{selectedCar.chassis || 'JTMBH54V2189...'}</div>
                  </div>
                </div>

                {/* Installment Reminder Banner */}
                <div style={{
                  marginTop: '16px',
                  background: 'rgba(140, 91, 48, 0.06)',
                  border: '1px solid rgba(140, 91, 48, 0.2)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Receipt size={22} style={{ color: '#8c5b30', flexShrink: 0 }} />
                  <div style={{ fontSize: '12.5px', color: '#543c2b', lineHeight: '1.4' }}>
                    <strong>Monthly Installment Policy:</strong> Installments are due on the <strong>{selectedCar.instDate || 10}th of each month</strong>. After bank transfer, upload your transfer slip above so admin can verify and credit your balance.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1.5px dashed #ede6d9', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#8c7361' }}>
                <Car size={36} style={{ color: '#8c5b30', opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#543c2b' }}>No Vehicle Linked to Your Profile</div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  Please share your car plate number with the admin or enter it during registration.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT RECEIPTS & APPROVAL STATUS */}
        {activeTab === 'receipts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#543c2b' }}>
                Submitted Installment Receipts
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '8px', gap: '6px' }}
              >
                <Upload size={14} />
                <span>Upload New Slip</span>
              </button>
            </div>

            {myReceipts.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #ede6d9', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#8c7361' }}>
                <Receipt size={36} style={{ color: '#8c5b30', opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b' }}>No Payment Receipts Uploaded Yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  When you make a bank transfer or installment deposit, upload your receipt here for admin review.
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Amount (AED)</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Reference</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Admin Remarks</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b', textAlign: 'center' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReceipts.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #ede6d9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700' }}>{r.paymentDate}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '900', color: '#8c5b30' }}>AED {r.amount.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{r.referenceNo || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {r.status === 'approved' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                              <CheckCircle size={12} /> Approved & Credited
                            </span>
                          ) : r.status === 'rejected' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                              <XCircle size={12} /> Rejected
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(217,119,6,0.1)', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                              <Clock size={12} /> Pending Admin Review
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#8c7361', fontSize: '11.5px' }}>
                          {r.adminRemarks || (r.status === 'approved' ? 'Credited to installment ledger' : 'Under verification')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {r.fileData ? (
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(r)}
                              style={{ background: 'none', border: 'none', color: '#8c5b30', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
                            >
                              <Eye size={13} /> View
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAINTENANCE & EXPENSES */}
        {activeTab === 'expenses' && (
          <div>
            {regularExpenses.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #ede6d9', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#8c7361' }}>
                <Wrench size={36} style={{ color: '#8c5b30', opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b' }}>No Maintenance Expenses Recorded</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Workshop repairs, oil changes, or tyre replacements logged for your car will show here.
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Description</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularExpenses.map((e, idx) => (
                      <tr key={e.id || idx} style={{ borderBottom: '1px solid #ede6d9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700' }}>{e.date}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#fdfbf7', border: '1px solid #ede6d9', fontSize: '11.5px', fontWeight: '700', color: '#543c2b' }}>
                            {e.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#8c7361' }}>{e.description || e.notes || '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '900', color: '#8c5b30' }}>AED {e.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRAFFIC FINES */}
        {activeTab === 'fines' && (
          <div>
            {trafficFines.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #ede6d9', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#8c7361' }}>
                <CheckCircle size={36} style={{ color: '#16a34a', opacity: 0.8, marginBottom: '8px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#543c2b' }}>No Traffic Fines on Record</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#16a34a' }}>
                  Great driving! There are no outstanding traffic or RTA fines registered on your car.
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1.5px solid #ede6d9', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1.5px solid #ede6d9' }}>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Fine Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Violation Details</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Authority / Location</th>
                      <th style={{ padding: '12px 14px', fontWeight: '800', color: '#543c2b' }}>Fine Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficFines.map((f, idx) => (
                      <tr key={f.id || idx} style={{ borderBottom: '1px solid #ede6d9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700' }}>{f.date}</td>
                        <td style={{ padding: '12px 14px', color: '#dc2626', fontWeight: '700' }}>{f.description || 'Speed / Traffic Violation'}</td>
                        <td style={{ padding: '12px 14px', color: '#8c7361' }}>{f.location || 'Dubai Police / RTA'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '900', color: '#dc2626' }}>AED {f.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* UPLOAD RECEIPT MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1.5px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b', margin: 0 }}>
                Upload Installment Receipt
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="modal-close">&times;</button>
            </div>

            {uploadError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#b91c1c', marginBottom: '12px' }}>
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#15803d', marginBottom: '12px' }}>
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <input
                  type="number"
                  min="1"
                  required
                  className="form-control"
                  placeholder="Installment Amount Paid (AED) *"
                  title="Payment Amount (AED)"
                  value={receiptForm.amount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="date"
                  required
                  className="form-control"
                  title="Payment Transfer Date"
                  value={receiptForm.paymentDate}
                  onChange={(e) => setReceiptForm({ ...receiptForm, paymentDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Bank Reference / Transaction ID (Optional)"
                  title="Bank Reference"
                  value={receiptForm.referenceNo}
                  onChange={(e) => setReceiptForm({ ...receiptForm, referenceNo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  className="form-control"
                  title="Upload Bank Slip / Receipt Image"
                  onChange={handleFileChange}
                />
                {receiptForm.fileName && (
                  <div style={{ fontSize: '11px', color: '#8c5b30', fontWeight: '700', marginTop: '4px' }}>
                    Selected: {receiptForm.fileName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Notes / Remittance remarks (Optional)"
                  title="Notes"
                  style={{ resize: 'none' }}
                  value={receiptForm.notes}
                  onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: '800' }}
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT PREVIEW MODAL */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1.5px solid #ede6d9', paddingBottom: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b', margin: 0 }}>
                  Receipt Document: AED {viewingReceipt.amount}
                </h3>
                <span style={{ fontSize: '11.5px', color: '#8c7361' }}>
                  Ref: {viewingReceipt.referenceNo} • Date: {viewingReceipt.paymentDate}
                </span>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="modal-close">&times;</button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', textAlign: 'center', background: '#fdfbf7', padding: '12px', borderRadius: '10px', border: '1px solid #ede6d9' }}>
              {viewingReceipt.fileData?.startsWith('data:image/') ? (
                <img
                  src={viewingReceipt.fileData}
                  alt="Receipt"
                  style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px', color: '#8c7361' }}>
                  <FileText size={48} style={{ color: '#8c5b30', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{viewingReceipt.fileName || 'Attached Receipt PDF/Doc'}</div>
                  <a
                    href={viewingReceipt.fileData}
                    download={viewingReceipt.fileName || 'receipt.pdf'}
                    className="btn btn-primary"
                    style={{ marginTop: '14px', display: 'inline-flex', padding: '6px 14px', fontSize: '12px' }}
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setViewingReceipt(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
