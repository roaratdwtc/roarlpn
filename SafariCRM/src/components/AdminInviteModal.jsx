import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  UserPlus, 
  Car, 
  Compass, 
  ShieldCheck, 
  ExternalLink,
  Settings,
  AlertCircle
} from 'lucide-react';
import { getFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured } from '../utils/firebaseAuth';

export default function AdminInviteModal({ 
  onClose, 
  drivers = [], 
  cars = [],
  invites = [],
  setInvites
}) {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'list' | 'firebase'
  const [copiedCode, setCopiedCode] = useState(null);

  // New Invite Form
  const [newInviteRole, setNewInviteRole] = useState('driver');
  const [targetName, setTargetName] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [selectedPlate, setSelectedPlate] = useState(cars[0]?.plateNo || cars[0]?.plate || '');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState(null);

  // Firebase Config Form
  const [fbConfig, setFbConfig] = useState(() => getFirebaseConfig());
  const [fbSuccess, setFbSuccess] = useState('');
  const [fbError, setFbError] = useState('');

  // Always fetch latest invites from MySQL database on modal open
  useEffect(() => {
    const fetchInvitesFromMySQL = async () => {
      try {
        const res = await fetch('api.php?action=get_invites');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.invites)) {
            if (setInvites) {
              setInvites(data.invites);
            }
            localStorage.setItem('safari_invites', JSON.stringify(data.invites));
          }
        }
      } catch (err) {
        console.warn("Could not fetch invites from MySQL:", err);
      }
    };
    fetchInvitesFromMySQL();
  }, []);

  // Generate Invite Code and Persist to MySQL
  const handleGenerateInvite = async (e) => {
    e.preventDefault();

    const rolePrefix = newInviteRole === 'driver' ? 'DRV' : newInviteRole === 'freelancer' ? 'FL' : 'OPS';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `INV-${rolePrefix}-${randomSuffix}`;

    const newInvite = {
      id: 'inv_' + Date.now(),
      code,
      role: newInviteRole,
      targetName: targetName.trim(),
      targetPhone: targetPhone.trim(),
      targetPlate: newInviteRole === 'freelancer' ? selectedPlate : '',
      targetDriverId: newInviteRole === 'driver' ? selectedDriverId : '',
      isUsed: false,
      usedByPhone: '',
      usedAt: null,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately Save to MySQL Database (Zero Data Loss)
    try {
      await fetch('api.php?action=save&table=invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvite,
          isUsed: 0
        })
      });
    } catch (err) {
      console.warn("Failed to save invite to MySQL:", err);
    }

    // 2. Update React State & Local Storage Cache
    if (setInvites) {
      setInvites(prev => [newInvite, ...(prev || [])]);
    } else {
      const stored = JSON.parse(localStorage.getItem('safari_invites') || '[]');
      localStorage.setItem('safari_invites', JSON.stringify([newInvite, ...stored]));
    }

    setLastGeneratedInvite(newInvite);
    setTargetName('');
    setTargetPhone('');
  };

  // Copy Link Helper
  const handleCopyLink = (code) => {
    const link = `${window.location.origin}${window.location.pathname}#/register?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Revoke Invite and Delete from MySQL
  const handleRevokeInvite = async (inviteId) => {
    if (confirm("Are you sure you want to revoke this invite code?")) {
      // 1. Delete from MySQL Database
      try {
        await fetch('api.php?action=delete&table=invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: inviteId })
        });
      } catch (err) {
        console.warn("Failed to delete invite from MySQL:", err);
      }

      // 2. Update State & Local Storage Cache
      if (setInvites) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
      } else {
        const stored = JSON.parse(localStorage.getItem('safari_invites') || '[]');
        localStorage.setItem('safari_invites', JSON.stringify(stored.filter(i => i.id !== inviteId)));
      }
    }
  };

  // Save Firebase Config
  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    setFbError('');
    setFbSuccess('');

    if (!fbConfig.apiKey || !fbConfig.projectId) {
      setFbError('Both API Key and Project ID are required from your Firebase Console.');
      return;
    }

    const ok = saveFirebaseConfig(fbConfig);
    if (ok) {
      setFbSuccess('Firebase configuration saved successfully! Real WhatsApp / Phone OTP is now active.');
      setTimeout(() => setFbSuccess(''), 3500);
    } else {
      setFbError('Failed to save Firebase configuration.');
    }
  };

  const hasFirebase = isFirebaseConfigured();

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ maxWidth: '640px', padding: '24px' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1.5px solid #ede6d9', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#543c2b', margin: 0 }}>
              Staff & Freelancer Invitations (Invite-Only Gate)
            </h3>
            <span style={{ fontSize: '11.5px', color: '#8c7361' }}>
              Only users with an official invite code and verified phone number can register
            </span>
          </div>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #ede6d9', paddingBottom: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'generate' ? '#8c5b30' : '#fdfbf7',
              color: activeTab === 'generate' ? '#ffffff' : '#8c7361',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Create New Invite
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'list' ? '#8c5b30' : '#fdfbf7',
              color: activeTab === 'list' ? '#ffffff' : '#8c7361',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Active & Used Invites ({(invites || []).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: hasFirebase ? 'none' : '1px solid #dc2626',
              background: activeTab === 'firebase' ? '#8c5b30' : '#fdfbf7',
              color: activeTab === 'firebase' ? '#ffffff' : (hasFirebase ? '#8c7361' : '#dc2626'),
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Settings size={13} />
            <span>Firebase Keys {!hasFirebase && '(Setup Required)'}</span>
          </button>
        </div>

        {/* TAB 1: GENERATE INVITE */}
        {activeTab === 'generate' && (
          <div>
            {!hasFirebase && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Firebase Keys Missing:</strong> You must enter your Firebase API keys in the <strong>Firebase Keys</strong> tab before invitees can receive real OTPs.
                </span>
              </div>
            )}

            <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <select
                  className="form-control"
                  title="Select Role to Assign"
                  value={newInviteRole}
                  onChange={(e) => setNewInviteRole(e.target.value)}
                  style={{ fontWeight: '700' }}
                >
                  <option value="driver">Role: Desert Safari Driver (Assigned Bookings & Scanner)</option>
                  <option value="freelancer">Role: Freelancer Leaseholder (Own Car, Installments & Receipts)</option>
                  <option value="operations">Role: Operations Team (Scanner-Only Booking Verification)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Staff / Freelancer Name (Optional)"
                    title="Staff Name"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="WhatsApp Phone (e.g. +971501234567)"
                    title="WhatsApp Phone"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Sub-selection */}
              {newInviteRole === 'freelancer' && (
                <div className="form-group">
                  <select
                    className="form-control"
                    title="Assign Vehicle Plate"
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                  >
                    <option value="">-- Pre-assign Vehicle Plate (Optional) --</option>
                    {cars.map(c => {
                      const plate = c.plateNo || c.plate || c.carPlate || '';
                      return (
                        <option key={c.id || plate} value={plate}>
                          {plate} ({c.brand ? `${c.brand} ` : ''}{c.model ? `${c.model} - ` : ''}{c.owner || 'Freelancer'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {newInviteRole === 'driver' && (
                <div className="form-group">
                  <select
                    className="form-control"
                    title="Assign Driver Profile"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                  >
                    <option value="">-- Pre-assign Fleet Driver Profile (Optional) --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.whatsapp || d.phone || d.carPlate || 'Fleet Driver'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '13px', fontWeight: '900', marginTop: '4px' }}
              >
                <Key size={15} style={{ marginRight: '6px' }} />
                Generate Secure Invite Code
              </button>
            </form>

            {/* Recently Generated Invite Box */}
            {lastGeneratedInvite && (
              <div style={{
                marginTop: '16px',
                background: '#fdfbf7',
                border: '1.5px solid #8c5b30',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8c5b30', textTransform: 'uppercase' }}>
                  Invite Ready to Send
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0' }}>
                  <code style={{ fontSize: '16px', fontWeight: '900', color: '#543c2b', background: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ede6d9' }}>
                    {lastGeneratedInvite.code}
                  </code>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#8c5b30' }}>
                    Role: {lastGeneratedInvite.role.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(lastGeneratedInvite.code)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '12px', gap: '4px' }}
                  >
                    {copiedCode === lastGeneratedInvite.code ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode === lastGeneratedInvite.code ? 'Link Copied!' : 'Copy Invite Link'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${(lastGeneratedInvite.targetPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello${lastGeneratedInvite.targetName ? ' ' + lastGeneratedInvite.targetName : ''},\n\nYou have been invited to register on Roar Safari CRM as a ${lastGeneratedInvite.role.toUpperCase()}.\n\nYour Invite Code is: ${lastGeneratedInvite.code}\n\nClick here to register with WhatsApp authentication:\n${window.location.origin}${window.location.pathname}#/register?invite=${lastGeneratedInvite.code}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '12px', gap: '4px', textDecoration: 'none' }}
                  >
                    <Send size={14} />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVITES LIST */}
        {activeTab === 'list' && (
          <div>
            {(!invites || invites.length === 0) ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#8c7361', fontSize: '13px' }}>
                No invite codes generated yet. Click "Create New Invite" to issue one.
              </div>
            ) : (
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      background: '#fdfbf7',
                      border: '1px solid #ede6d9',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ fontWeight: '900', color: '#543c2b', fontSize: '13px' }}>{inv.code}</code>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: inv.isUsed ? 'rgba(22,163,74,0.1)' : 'rgba(140,91,48,0.1)',
                          color: inv.isUsed ? '#16a34a' : '#8c5b30'
                        }}>
                          {inv.isUsed ? 'REDEEMED' : 'ACTIVE'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#8c7361' }}>• Role: {inv.role}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8c7361', marginTop: '2px' }}>
                        {inv.targetName && <span>For: {inv.targetName} • </span>}
                        {inv.targetPlate && <span>Plate: {inv.targetPlate} • </span>}
                        Created: {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!inv.isUsed && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv.code)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Copy Invite Link"
                        >
                          {copiedCode === inv.code ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', color: '#dc2626' }}
                        title="Revoke / Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FIREBASE CONFIG KEYS */}
        {activeTab === 'firebase' && (
          <div>
            <div style={{ fontSize: '12px', color: '#8c7361', marginBottom: '12px', lineHeight: '1.4' }}>
              Paste your web app configuration from Firebase Console (<strong>Project Settings &gt; General &gt; Your apps &gt; Web SDK</strong>):
            </div>

            {fbError && (
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#b91c1c', marginBottom: '12px' }}>
                {fbError}
              </div>
            )}

            {fbSuccess && (
              <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#15803d', marginBottom: '12px' }}>
                {fbSuccess}
              </div>
            )}

            <form onSubmit={handleSaveFirebaseConfig} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="apiKey (e.g. AIzaSy...)"
                  title="Firebase API Key"
                  value={fbConfig.apiKey}
                  onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="projectId (e.g. roar-safari-crm)"
                    title="Project ID"
                    value={fbConfig.projectId}
                    onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="authDomain (e.g. roar-safari-crm.firebaseapp.com)"
                    title="Auth Domain"
                    value={fbConfig.authDomain}
                    onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="storageBucket (e.g. roar-safari-crm.appspot.com)"
                    title="Storage Bucket"
                    value={fbConfig.storageBucket}
                    onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="messagingSenderId"
                    title="Messaging Sender ID"
                    value={fbConfig.messagingSenderId}
                    onChange={(e) => setFbConfig({ ...fbConfig, messagingSenderId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="appId (e.g. 1:123456789:web:abcdef...)"
                  title="App ID"
                  value={fbConfig.appId}
                  onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: '900', padding: '8px 18px' }}
                >
                  Save Firebase Keys
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
