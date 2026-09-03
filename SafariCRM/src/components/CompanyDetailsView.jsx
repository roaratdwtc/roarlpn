import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

export default function CompanyDetailsView({ companyDetails, onSave }) {
  const [formData, setFormData] = useState(companyDetails || {
    id: 'company_info',
    fullName: '',
    address: '',
    contactPerson: '',
    whatsapp: '',
    email: '',
    regDate: '',
    licenseNo: '',
    whatWeOffer: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '4px 2px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-dark)' }}>Company Profile Setup</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0, lineHeight: '1.4' }}>
            Official registration and contact metadata utilized exclusively by AI Assistant Ana.
          </p>
        </div>
        {showSuccess && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#e6f4ea',
            color: '#137333',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            <CheckCircle2 size={15} /> Saved to Database!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          
          {/* Full Name */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Registered Company Name * (e.g. Roar Adventure Tourism LLC)"
              title="Registered Company Name *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Contact Person */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Official Contact Person * (e.g. Mr. Abid Ali)"
              title="Official Contact Person *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Phone/WhatsApp */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="text"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="WhatsApp / Contact Phone * (e.g. +97145578679)"
              title="WhatsApp / Contact Phone *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Email */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Official Email Address * (e.g. info@roaradventuretourism.com)"
              title="Official Email Address *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Registration Date */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="text"
              name="regDate"
              value={formData.regDate}
              onChange={handleChange}
              placeholder="Establishment / Registration Date * (e.g. 2016-01-01)"
              title="Establishment / Registration Date *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* License No */}
          <div style={{ minWidth: 0 }}>
            <input 
              type="text"
              name="licenseNo"
              value={formData.licenseNo}
              onChange={handleChange}
              placeholder="Tour Operator License Details * (e.g. DET/DTCM Licensed)"
              title="Tour Operator License Details *"
              required
              className="form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

        </div>

        {/* Address (Full Row) */}
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <input 
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Headquarters Physical Address * (e.g. DWTC, Sheikh Zayed Rd, Dubai)"
            title="Headquarters Physical Address *"
            required
            className="form-control"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Services Offered (Full Row) */}
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <textarea 
            name="whatWeOffer"
            value={formData.whatWeOffer}
            onChange={handleChange}
            placeholder="Summary of Core Services Offered * (List core offerings separated by commas...)"
            title="Summary of Core Services Offered *"
            required
            className="form-control"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.5', fontFamily: 'inherit' }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button 
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '700'
            }}
          >
            <Save size={15} />
            {isSaving ? 'Saving...' : 'Save Profile Details'}
          </button>
        </div>

      </form>
    </div>
  );
}
