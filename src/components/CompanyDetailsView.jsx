import React, { useState } from 'react';
import { Save, Building, MapPin, User, Phone, Mail, Calendar, FileText, CheckCircle2, Compass } from 'lucide-react';

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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
        padding: '32px',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-dark)' }}>Company Profile Setup</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Official registration and contact metadata utilized exclusively by AI Assistant Ana.
            </p>
          </div>
          {showSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e6f4ea',
              color: '#137333',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <CheckCircle2 size={16} /> Saved to Database!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} /> REGISTERED COMPANY NAME
              </label>
              <input 
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Roar Adventure Tourism LLC"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            {/* Contact Person */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> OFFICIAL CONTACT PERSON
              </label>
              <input 
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Mr. Abid Ali"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            {/* Phone/WhatsApp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> WHATSAPP / CONTACT PHONE
              </label>
              <input 
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="e.g. +971589344077"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> OFFICIAL EMAIL ADDRESS
              </label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. info@roaradventuretourism.com"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            {/* Registration Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> ESTABLISHMENT / REGISTRATION DATE
              </label>
              <input 
                type="text"
                name="regDate"
                value={formData.regDate}
                onChange={handleChange}
                placeholder="e.g. 2016-01-01"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            {/* License No */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> TOUR OPERATOR LICENSE DETAILS
              </label>
              <input 
                type="text"
                name="licenseNo"
                value={formData.licenseNo}
                onChange={handleChange}
                placeholder="e.g. DET/DTCM Licensed Tour Operator"
                required
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

          </div>

          {/* Address (Full Row) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> HEADQUARTERS PHYSICAL ADDRESS
            </label>
            <input 
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Dubai World Trade Centre (DWTC), Sheikh Zayed Rd, Dubai, UAE"
              required
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Services Offered (Full Row) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} /> SUMMARY OF CORE SERVICES OFFERED
            </label>
            <textarea 
              name="whatWeOffer"
              value={formData.whatWeOffer}
              onChange={handleChange}
              placeholder="List core offerings separated by commas..."
              required
              className="form-control"
              rows={4}
              style={{ width: '100%', resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button 
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <Save size={16} />
              {isSaving ? 'Syncing...' : 'Save Profile Details'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
