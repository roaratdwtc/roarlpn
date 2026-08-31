import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Share2, Download, Trash2, Edit, Calendar, AlertTriangle, Link, Check, Clipboard, Folder, Save } from 'lucide-react';

export default function CompanyDocumentsView({ documents = [], setDocuments, settings = [], onSaveSetting }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [copiedDocId, setCopiedDocId] = useState(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState({});

  // Dynamic Categories Resolver
  const defaultCategories = ['License', 'Insurance', 'Certificate', 'Agreement', 'Lease', 'Permit', 'Other'];
  const categoriesSetting = settings.find(s => s.setting_key === 'document_categories')?.setting_value;
  const categories = categoriesSetting
    ? categoriesSetting.split(',').map(c => c.trim()).filter(Boolean)
    : defaultCategories;

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || 'License',
    expiryDate: '',
    fileName: '',
    fileType: '',
    fileData: '',
    notes: ''
  });

  const handleUpdateCategory = async (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) return;
    
    if (categories.includes(trimmedNew)) {
      alert("A category with this name already exists.");
      return;
    }

    const updatedCategories = categories.map(c => c === oldName ? trimmedNew : c);
    
    const updatedDocuments = documents.map(d => {
      if (d.category === oldName) {
        return { ...d, category: trimmedNew };
      }
      return d;
    });

    if (onSaveSetting) {
      await onSaveSetting('document_categories', updatedCategories.join(','));
      setDocuments(updatedDocuments);
      setEditingCategoryName(prev => {
        const copy = { ...prev };
        delete copy[oldName];
        return copy;
      });
    }
  };

  const handleDeleteCategory = async (catName) => {
    const isUsed = documents.some(d => d.category === catName);
    if (isUsed) {
      alert(`The category "${catName}" cannot be deleted because it is currently assigned to one or more documents.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      return;
    }

    const updatedCategories = categories.filter(c => c !== catName);
    if (onSaveSetting) {
      await onSaveSetting('document_categories', updatedCategories.join(','));
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert("A category with this name already exists.");
      return;
    }

    const updatedCategories = [...categories, trimmed];
    if (onSaveSetting) {
      await onSaveSetting('document_categories', updatedCategories.join(','));
      setNewCatName('');
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileData: event.target.result // base64 data URI
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a document name.');
      return;
    }
    if (!formData.fileData) {
      alert('Please select or upload a document file.');
      return;
    }

    const payload = {
      ...formData,
      id: editingDoc ? editingDoc.id : `doc-${Date.now()}`
    };

    if (editingDoc) {
      setDocuments(documents.map(d => d.id === editingDoc.id ? payload : d));
    } else {
      setDocuments([payload, ...documents]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || 'License',
      expiryDate: '',
      fileName: '',
      fileType: '',
      fileData: '',
      notes: ''
    });
    setEditingDoc(null);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      category: doc.category || 'License',
      expiryDate: doc.expiryDate || '',
      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
      fileData: doc.fileData || '',
      notes: doc.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDownload = (doc) => {
    if (!doc.fileData) {
      alert('No file content available to download.');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || `${doc.name}.bin`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (doc) => {
    if (!doc.fileData) return;
    navigator.clipboard.writeText(doc.fileData).then(() => {
      setCopiedDocId(doc.id);
      setTimeout(() => setCopiedDocId(null), 2000);
    }).catch(err => {
      alert('Failed to copy file link: ' + err);
    });
  };

  const handleWhatsAppShare = (doc) => {
    const text = `Company Document Share:\n*Name:* ${doc.name}\n*Category:* ${doc.category}\n*Expiry Date:* ${doc.expiryDate || 'N/A'}\n*Notes:* ${doc.notes || 'N/A'}\n\nPlease request the file attachment from the administrator.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Parse DD-MM-YYYY or YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    return new Date(dateStr);
  };

  // Expiry notifications
  const getExpiryAlerts = () => {
    const today = new Date();
    const alerts = [];
    documents.forEach(d => {
      if (d.expiryDate) {
        const exp = parseDate(d.expiryDate);
        if (exp) {
          const diffTime = exp.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            alerts.push({ ...d, status: 'expired', days: Math.abs(diffDays) });
          } else if (diffDays <= 30) {
            alerts.push({ ...d, status: 'warning', days: diffDays });
          }
        }
      }
    });
    return alerts;
  };

  const alerts = getExpiryAlerts();

  const filteredDocs = (documents || []).filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' ? true : d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Expiry Alerts Panel */}
      {alerts.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '14px', fontWeight: '800' }}>
            <AlertTriangle size={16} />
            COMPANY DOCUMENTS EXPIRY CENTER ({alerts.length})
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
                  <strong style={{ color: '#111827' }}>{a.name}</strong> ({a.category})
                </div>
                <div style={{ fontWeight: '800', color: a.status === 'expired' ? '#b91c1c' : '#b45309' }}>
                  {a.status === 'expired' ? `🔴 EXPIRED ${a.days} days ago (${a.expiryDate})` : `⚠️ Expiring in ${a.days} days (${a.expiryDate})`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="controls-bar" style={{
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
          <div style={{ position: 'relative', width: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={14} />
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search documents..." 
              style={{ paddingLeft: '32px', fontSize: '13px', borderRadius: '10px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>Category:</span>
            <select 
              className="form-control" 
              style={{ width: '130px', padding: '6px', fontSize: '13px', borderRadius: '8px' }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: 'auto', justifyContent: 'flex-start', alignItems: 'center', marginTop: '0px' }}>
          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Folder size={15} /> Manage Categories
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="btn btn-primary" 
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Upload Document
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {filteredDocs.map(doc => {
          const isExpired = doc.expiryDate && parseDate(doc.expiryDate) < new Date();
          return (
            <div key={doc.id} className="panel-card" style={{
              background: '#ffffff',
              border: `1.5px solid ${isExpired ? '#fecaca' : '#ede6d9'}`,
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 4px 12px rgba(84, 60, 43, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-partner" style={{ background: '#faf6f0', color: 'var(--primary)', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase' }}>
                    {doc.category}
                  </span>
                  {doc.expiryDate && (
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '800', 
                      color: isExpired ? '#ef4444' : '#059669', 
                      background: isExpired ? '#fee2e2' : '#d1fae5',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  )}
                </div>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)' }}>
                  {doc.name}
                </h4>

                {doc.expiryDate && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} style={{ color: 'var(--primary)' }} />
                    Expires: <strong>{doc.expiryDate}</strong>
                  </p>
                )}

                {doc.notes && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#fdfbf7', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid var(--primary-light)' }}>
                    {doc.notes}
                  </p>
                )}
                
                {doc.fileName && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'var(--primary-dark)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={11} /> {doc.fileName}
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleDownload(doc)} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Download File"
                  >
                    <Download size={12} /> Download
                  </button>
                  <button 
                    onClick={() => handleCopyLink(doc)} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: copiedDocId === doc.id ? '#059669' : '#ede6d9' }}
                    title="Copy File Link (Base64)"
                  >
                    {copiedDocId === doc.id ? <Check size={12} style={{ color: '#059669' }} /> : <Link size={12} />} 
                    {copiedDocId === doc.id ? 'Copied' : 'Copy Link'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleWhatsAppShare(doc)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#25D366' }}
                    title="Share details via WhatsApp"
                  >
                    <Share2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(doc)} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--primary)' }}
                    title="Edit Document"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(doc.id, doc.name)} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#ef4444' }}
                    title="Delete Document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredDocs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No documents found matching search criteria. Click "Upload Document" to add one.
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(84, 60, 43, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #ede6d9',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            animation: 'fIn 0.2s ease-out'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '900', color: 'var(--text-dark)', borderBottom: '1.5px solid #ede6d9', paddingBottom: '8px' }}>
              {editingDoc ? 'Edit Document Info' : 'Upload Company Document'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', display: 'block' }}>Document Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Trade License 2026"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', display: 'block' }}>Category *</label>
                  <select 
                    className="form-control"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', display: 'block' }}>Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', display: 'block' }}>
                  {editingDoc ? 'Replace Document File (Optional)' : 'Select Document File *'}
                </label>
                <input 
                  type="file" 
                  className="form-control"
                  style={{ padding: '6px' }}
                  onChange={handleFileChange}
                />
                {formData.fileName && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '10.5px', color: 'var(--primary)' }}>
                    Selected: <strong>{formData.fileName}</strong>
                  </p>
                )}
              </div>

              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px', display: 'block' }}>Notes</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Enter details, description or reference numbers..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  {editingDoc ? 'Save Changes' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                📁 Manage Document Categories
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              
              {/* Creator Section */}
              <div style={{ background: '#fdfbf7', border: '1.5px solid #ede6d9', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Create New Category
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Visa, VAT Certificate" 
                    style={{ flex: 1, height: '38px', borderRadius: '8px' }}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button 
                    onClick={handleAddCategory} 
                    className="btn btn-primary"
                    style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px' }}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Categories list */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '900', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
                  Available Categories
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {categories.map((cat) => {
                    const isDefault = defaultCategories.includes(cat);
                    const isEditing = editingCategoryName[cat] !== undefined;
                    const currentValue = isEditing ? editingCategoryName[cat] : cat;

                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', border: '1.5px solid #ede6d9', borderRadius: '10px', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          {isDefault ? (
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                              {cat} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>(System Default)</span>
                            </span>
                          ) : (
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ height: '32px', fontSize: '13px', padding: '0 8px', border: '1px solid var(--border)' }}
                              value={currentValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingCategoryName(prev => ({ ...prev, [cat]: val }));
                              }}
                            />
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isDefault && (
                            <>
                              {isEditing && currentValue.trim() !== cat && (
                                <button 
                                  onClick={() => handleUpdateCategory(cat, currentValue)} 
                                  className="btn btn-primary" 
                                  style={{ padding: '6px', minWidth: 'auto', background: 'var(--success)', borderColor: 'var(--success)' }}
                                  title="Save Rename"
                                >
                                  <Save size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteCategory(cat)} 
                                className="btn btn-secondary" 
                                style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
