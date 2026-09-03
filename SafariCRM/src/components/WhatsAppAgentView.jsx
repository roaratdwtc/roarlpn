import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Send,
  Phone,
  Clock,
  User,
  RefreshCw,
  Check,
  Tag,
  CheckCheck,
  UserCheck,
  Wifi,
  WifiOff,
  AlertCircle,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
  Package,
  Ticket,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const POLL_INTERVAL = 5000;

const STAGES = ['New Lead', 'Inquiry', 'Interested', 'Proposed', 'Confirmed', 'Followed-up', 'Completed'];

const STAGE_COLORS = {
  'New Lead': '#6b7280',
  'Inquiry': '#f59e0b',
  'Interested': '#3b82f6',
  'Proposed': '#8b5cf6',
  'Confirmed': '#10b981',
  'Followed-up': '#f97316',
  'Completed': '#059669'
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

function formatFullTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function WhatsAppAgentView({ bookings = [], setBookings, packages = [], coupons = [], setCoupons, customers = [], setCustomers }) {
  const [conversations, setConversations] = useState([]);
  const [activePhone, setActivePhone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpHours, setFollowUpHours] = useState(4);
  const [followUpReason, setFollowUpReason] = useState('');
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find(c => c.phone === activePhone);

  // Fetch all conversations from backend
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setConversations(data);
      setIsConnected(true);
      setError(null);
      if (!activePhone && data.length > 0) {
        setActivePhone(data[0].phone);
      }
    } catch (err) {
      setIsConnected(false);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activePhone]);

  // Sync backend bookings/customers into CRM state
  const syncCrmData = useCallback(async () => {
    try {
      const [bRes, cRes, cpRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/bookings`),
        fetch(`${BACKEND_URL}/api/customers`),
        fetch(`${BACKEND_URL}/api/coupons`)
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData);
      }
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        setCoupons(cpData);
      }
    } catch (err) {
      console.error('[CRM sync]', err.message);
    }
  }, [setBookings, setCustomers, setCoupons]);

  // Polling
  useEffect(() => {
    fetchConversations();
    syncCrmData();
    const convInterval = setInterval(fetchConversations, POLL_INTERVAL);
    const syncInterval = setInterval(syncCrmData, 30000); // sync CRM data every 30s
    return () => {
      clearInterval(convInterval);
      clearInterval(syncInterval);
    };
  }, [fetchConversations, syncCrmData]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages?.length, activePhone]);

  // Send manual message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activePhone || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activePhone, message: inputText.trim() })
      });
      if (res.ok) {
        setInputText('');
        setTimeout(fetchConversations, 1000);
      }
    } catch (err) {
      console.error('[send]', err.message);
    } finally {
      setSending(false);
    }
  };

  // Schedule follow-up
  const handleFollowUp = async () => {
    if (!activePhone) return;
    try {
      await fetch(`${BACKEND_URL}/api/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activePhone,
          name: activeConv?.name || 'Customer',
          delayHours: followUpHours,
          reason: followUpReason || 'Manual follow-up from CRM'
        })
      });
      setShowFollowUpModal(false);
      setFollowUpReason('');
    } catch (err) {
      console.error('[followup]', err.message);
    }
  };

  // Update pipeline stage
  const handleStageUpdate = async (stage) => {
    if (!activePhone) return;
    try {
      await fetch(`${BACKEND_URL}/api/conversations/${encodeURIComponent(activePhone)}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      fetchConversations();
    } catch (err) {
      console.error('[stage]', err.message);
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const activeBookings = bookings.filter(b => b.whatsapp === activePhone || b.phone === activePhone);

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-primary, #0f1419)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Sidebar */}
      <div style={{ width: '320px', minWidth: '280px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary, #1a1f2e)' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isConnected ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#ef4444" />}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #e5e7eb)' }}>WhatsApp Live</div>
                <div style={{ fontSize: '11px', color: isConnected ? '#10b981' : '#ef4444' }}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
            <button type="button" onClick={fetchConversations} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #6b7280)', padding: '6px', borderRadius: '8px' }}>
              <RefreshCw size={16} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #6b7280)' }} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Connection error */}
        {error && !isConnected && (
          <div style={{ margin: '12px', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
              <AlertCircle size={14} /> Backend Offline
            </div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>{error}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              Make sure the backend is running and VITE_BACKEND_URL is set correctly.
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #6b7280)', fontSize: '13px' }}>Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
              <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <div style={{ fontSize: '13px' }}>No conversations yet</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Messages will appear when customers WhatsApp you</div>
            </div>
          ) : filteredConversations.map(conv => {
            const lastMsg = conv.messages?.at(-1);
            const isActive = conv.phone === activePhone;
            const stage = conv.stage || 'New Lead';
            const stageColor = STAGE_COLORS[stage] || '#6b7280';
            return (
              <div
                key={conv.phone}
                onClick={() => setActivePhone(conv.phone)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(140,91,48,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary, #8c5b30)' : '3px solid transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${stageColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: stageColor, flexShrink: 0 }}>
                      {(conv.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary, #e5e7eb)' }}>{conv.name || conv.phone}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>{conv.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>{formatTime(lastMsg?.timestamp)}</div>
                    <div style={{ marginTop: '3px', padding: '2px 6px', borderRadius: '20px', background: `${stageColor}22`, color: stageColor, fontSize: '9px', fontWeight: '700' }}>
                      {stage}
                    </div>
                  </div>
                </div>
                {lastMsg && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #6b7280)', marginLeft: '44px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {lastMsg.role === 'agent' ? '✓ ' : ''}{lastMsg.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-secondary, #1a1f2e)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${STAGE_COLORS[activeConv.stage || 'New Lead']}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: STAGE_COLORS[activeConv.stage || 'New Lead'] }}>
                {(activeConv.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary, #e5e7eb)' }}>{activeConv.name || activeConv.phone}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={11} /> {activeConv.phone}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {/* Stage pills */}
              {STAGES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStageUpdate(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: `1px solid ${STAGE_COLORS[s]}`,
                    background: activeConv.stage === s ? STAGE_COLORS[s] : 'transparent',
                    color: activeConv.stage === s ? '#fff' : STAGE_COLORS[s],
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-primary, #0f1419)' }}>
            {(activeConv.messages || []).map(msg => {
              const isAgent = msg.role === 'agent';
              return (
                <div key={msg.id || msg.timestamp} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%',
                    padding: '10px 14px',
                    borderRadius: isAgent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isAgent ? 'linear-gradient(135deg, var(--primary, #8c5b30), #a0693a)' : 'rgba(255,255,255,0.07)',
                    color: isAgent ? '#fff' : 'var(--text-primary, #e5e7eb)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {msg.text}
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6, textAlign: 'right' }}>
                      {formatFullTime(msg.timestamp)}
                      {isAgent && ' ✓✓'}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-secondary, #1a1f2e)' }}>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(true)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(140,91,48,0.3)', background: 'rgba(140,91,48,0.1)', color: '#d97706', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Clock size={12} /> Schedule Follow-up
              </button>
              {activeBookings.length > 0 && (
                <div style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCheck size={12} /> {activeBookings.length} Booking{activeBookings.length > 1 ? 's' : ''} Confirmed
                </div>
              )}
              {activeConv.labels?.map(label => (
                <div key={label} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted, #6b7280)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Tag size={10} /> {label}
                </div>
              ))}
            </div>

            {/* Active bookings mini-view */}
            {activeBookings.length > 0 && (
              <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', marginBottom: '6px' }}>📋 Confirmed Bookings</div>
                {activeBookings.map(b => (
                  <div key={b.id} style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>📌 {b.id}</span>
                    <span>📦 {b.packageName}</span>
                    <span>📅 {b.date}</span>
                    <span>👥 {b.pax} pax</span>
                    <span>💰 {b.price} AED</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: '1.4', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: inputText.trim() ? 'var(--primary, #8c5b30)' : 'rgba(255,255,255,0.08)', cursor: inputText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
              >
                <Send size={18} color={inputText.trim() ? '#fff' : '#6b7280'} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-muted, #6b7280)' }}>
          <MessageSquare size={48} style={{ opacity: 0.2 }} />
          <div style={{ fontSize: '15px', fontWeight: '600' }}>Select a conversation</div>
          <div style={{ fontSize: '12px' }}>
            {isConnected ? 'Choose a customer from the left panel' : 'Backend is offline — start the backend server first'}
          </div>
        </div>
      )}

      {/* Right panel — customer info */}
      {activeConv && (
        <div style={{ width: '260px', borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-secondary, #1a1f2e)', overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Customer Info</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>
              <User size={13} /> {activeConv.name || 'Unknown'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>
              <Phone size={13} /> {activeConv.phone}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>
              <Clock size={13} /> Since {new Date(activeConv.createdAt || Date.now()).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Pipeline Stage</div>
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: `${STAGE_COLORS[activeConv.stage || 'New Lead']}15`, border: `1px solid ${STAGE_COLORS[activeConv.stage || 'New Lead']}30`, color: STAGE_COLORS[activeConv.stage || 'New Lead'], fontSize: '12px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
            {activeConv.stage || 'New Lead'}
          </div>

          {activeConv.labels?.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Labels</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                {activeConv.labels.map(l => (
                  <div key={l} style={{ padding: '3px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted, #6b7280)', fontSize: '10px' }}>{l}</div>
                ))}
              </div>
            </>
          )}

          {activeConv.bookingDraft && Object.values(activeConv.bookingDraft).some(v => v) && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Booking Draft</div>
              <div style={{ background: 'rgba(140,91,48,0.07)', border: '1px solid rgba(140,91,48,0.15)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--text-muted, #6b7280)', marginBottom: '16px' }}>
                {activeConv.bookingDraft.name && <div>👤 {activeConv.bookingDraft.name}</div>}
                {activeConv.bookingDraft.pax && <div>👥 {activeConv.bookingDraft.pax} guests</div>}
                {activeConv.bookingDraft.package && <div>📦 {activeConv.bookingDraft.package}</div>}
                {activeConv.bookingDraft.date && <div>📅 {activeConv.bookingDraft.date}</div>}
                {activeConv.bookingDraft.pickup && <div>📍 {activeConv.bookingDraft.pickup}</div>}
                {activeConv.bookingDraft.room && <div>🏨 Room {activeConv.bookingDraft.room}</div>}
              </div>
            </>
          )}

          {activeBookings.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Confirmed Bookings</div>
              {activeBookings.map(b => (
                <div key={b.id} style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>#{b.id}</div>
                  <div>📦 {b.packageName}</div>
                  <div>📅 {b.date}</div>
                  <div>👥 {b.pax} pax • 💰 {b.price} AED</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(84, 60, 43, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '360px', border: '1.5px solid #ede6d9', boxShadow: '0 10px 25px rgba(84, 60, 43, 0.12)' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#543c2b', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Schedule Follow-Up</div>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="number"
                value={followUpHours}
                onChange={e => setFollowUpHours(Number(e.target.value))}
                min={1}
                max={72}
                placeholder="Delay in Hours (e.g. 2)"
                title="Delay (hours)"
                style={{ width: '100%', padding: '10px 12px', background: '#fdfbf7', border: '1.5px solid #ede6d9', borderRadius: '8px', color: '#543c2b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={followUpReason}
                onChange={e => setFollowUpReason(e.target.value)}
                placeholder="Reason (e.g. Customer will confirm tonight)"
                title="Reason (optional)"
                style={{ width: '100%', padding: '10px 12px', background: '#fdfbf7', border: '1.5px solid #ede6d9', borderRadius: '8px', color: '#543c2b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setShowFollowUpModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ede6d9', background: 'transparent', color: '#8c7361', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>Cancel</button>
              <button type="button" onClick={handleFollowUp} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--primary, #8c5b30)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '800' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
