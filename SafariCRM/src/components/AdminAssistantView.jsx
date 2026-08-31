import React, { useState, useEffect, useRef } from "react";
import { Send, RefreshCw, Compass, Bot, User, Sparkles } from "lucide-react";

const ASSISTANT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const SUGGESTIONS = [
  "Show today's stats summary",
  "Assign drivers to pending bookings",
  "Create coupon SUMMERSALE with 15% discount",
  "Are there any double-booked drivers?"
];

export default function AdminAssistantView({
  bookings = [],
  setBookings,
  drivers = [],
  coupons = [],
  setCoupons
}) {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLocalAssistant = (queryText) => {
    const text = queryText.toLowerCase().trim();
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    // 1. Double booked drivers
    if (text.includes("double") || text.includes("clash") || text.includes("conflict")) {
      const driverDays = {};
      bookings.forEach(b => {
        if (b.driverId && b.status !== 'cancelled') {
          const key = `${b.date}_${b.driverId}`;
          if (!driverDays[key]) driverDays[key] = [];
          driverDays[key].push(b);
        }
      });

      const conflicts = [];
      Object.entries(driverDays).forEach(([key, list]) => {
        if (list.length > 1) {
          const driverObj = drivers.find(d => d.id === list[0].driverId);
          conflicts.push({
            driverName: driverObj ? driverObj.name : 'Unknown Driver',
            date: list[0].date,
            bookings: list.map(b => `${b.customerName} (${b.packageName})`)
          });
        }
      });

      if (conflicts.length === 0) {
        return "✅ **No driver conflicts found!** All active drivers are assigned to a maximum of one booking per day.";
      }

      let reply = "⚠️ **Driver Conflicts Detected:**\n\n";
      conflicts.forEach(c => {
        reply += `- **${c.driverName}** is assigned to **${c.bookings.length} tours** on **${c.date.split('-').reverse().join('/')}**:\n`;
        c.bookings.forEach(b => {
          reply += `  - ${b}\n`;
        });
      });
      return reply;
    }

    // 2. Assign drivers
    if (text.includes("assign") || text.includes("auto-assign") || text.includes("allocate")) {
      const pendingBookings = bookings.filter(b => (!b.driverId || b.driverId === '') && b.status === 'confirmed');
      if (pendingBookings.length === 0) {
        return "✅ **Driver Allocation**: All confirmed bookings already have drivers assigned!";
      }

      if (drivers.length === 0) {
        return "❌ **Failed to assign**: No drivers exist in the system.";
      }

      // Allocate round-robin
      let driverIdx = 0;
      const updatedBookings = bookings.map(b => {
        if ((!b.driverId || b.driverId === '') && b.status === 'confirmed') {
          const assignedDriver = drivers[driverIdx % drivers.length];
          driverIdx++;
          return { ...b, driverId: assignedDriver.id };
        }
        return b;
      });

      if (setBookings) {
        setBookings(updatedBookings);
      }

      let reply = `🤖 **Auto-Assigned Drivers to ${pendingBookings.length} Bookings:**\n\n`;
      let currentIdx = 0;
      bookings.forEach(b => {
        if ((!b.driverId || b.driverId === '') && b.status === 'confirmed') {
          const assignedDriver = drivers[currentIdx % drivers.length];
          reply += `- **${b.customerName}** (${b.packageName}) ➡️ assigned to **${assignedDriver.name}**\n`;
          currentIdx++;
        }
      });
      return reply;
    }

    // 3. Create coupon
    if (text.includes("coupon") || text.includes("promo") || text.includes("discount")) {
      const nameMatch = queryText.match(/coupon\s+([A-Za-z0-9_-]+)/i) || queryText.match(/code\s+([A-Za-z0-9_-]+)/i);
      const discountMatch = queryText.match(/(\d+)\s*%/);
      
      const couponCode = nameMatch ? nameMatch[1].toUpperCase() : "PROMO" + Math.floor(1000 + Math.random() * 9000);
      const discountVal = discountMatch ? parseInt(discountMatch[1]) : 10;

      const newCoupon = {
        id: "cpn_" + Math.random().toString(36).substr(2, 9),
        code: couponCode,
        discount: discountVal,
        type: 'percentage',
        status: 'active'
      };

      if (setCoupons) {
        setCoupons([...coupons, newCoupon]);
      }

      return `✨ **Promo Coupon Created:**\n\n- **Code**: \`${couponCode}\`\n- **Value**: \`${discountVal}%\` discount\n- **Status**: Active\n\nThis coupon code is now ready for use on the client booking form!`;
    }

    // 4. Today's stats
    if (text.includes("stat") || text.includes("summary") || text.includes("today") || text.includes("report")) {
      const todayBookings = bookings.filter(b => b.date === todayStr);
      const confirmedToday = todayBookings.filter(b => b.status === 'confirmed');
      const completedToday = todayBookings.filter(b => b.status === 'completed');
      const revenueToday = todayBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      
      let reply = `📊 **Today's Operational Dashboard Summary (${todayStr.split('-').reverse().join('/')}):**\n\n`;
      reply += `- **Total Bookings**: \`${todayBookings.length}\` tours logged today\n`;
      reply += `- **Confirmed (Upcoming)**: \`${confirmedToday.length}\` slots\n`;
      reply += `- **Completed**: \`${completedToday.length}\` slots\n`;
      reply += `- **Gross Today Revenue**: \`${revenueToday.toLocaleString()} AED\`\n`;
      
      const driversAssigned = Array.from(new Set(
        todayBookings.map(b => {
          const dObj = drivers.find(d => d.id === b.driverId);
          return dObj ? dObj.name : null;
        }).filter(Boolean)
      ));

      reply += `- **Assigned Drivers**: ${driversAssigned.join(', ') || '_None_'}`;
      return reply;
    }

    return `👋 **Hi! I am your Offline CRM Admin Assistant.**\n\nI couldn't reach the backend AI microservice (localhost:8000), but I have loaded the live CRM database in-memory to assist you! Try requesting any of these actions:\n\n1. 📊 "Show today's stats summary"\n2. 🚗 "Assign drivers to pending bookings"\n3. 🏷️ "Create coupon SUMMERSALE with 15% discount"\n4. ⚠️ "Are there any double-booked drivers?"`;
  };

  const performChatFetch = async (currentHistory, queryText) => {
    setLoading(true);
    try {
      const response = await fetch(`${ASSISTANT_BACKEND_URL}/api/admin/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentHistory.slice(0, -1),
          query: queryText
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.warn("AI Backend unavailable, executing query via offline CRM logic:", err);
      const offlineReply = handleLocalAssistant(queryText);
      setMessages((prev) => [...prev, { role: "assistant", content: offlineReply }]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuery = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMsg = { role: "user", content: queryText.trim() };
    setMessages((prev) => {
      const updatedMessages = [...prev, userMsg];
      performChatFetch(updatedMessages, userMsg.content);
      return updatedMessages;
    });
    setQuery("");
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    sendQuery(query);
  };

  const handleSuggestionClick = (suggestionText) => {
    sendQuery(suggestionText);
  };

  const formatMessage = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const cleanLine = isBullet ? line.replace(/^\s*[-*]\s*/, "") : line;

      let parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      let lastIndex = 0;

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ fontWeight: "700", color: "inherit" }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: "20px", marginBottom: "6px", listStyleType: "disc" }}>
            {parts.length > 0 ? parts : cleanLine}
          </li>
        );
      }

      return (
        <div key={idx} style={{ minHeight: "1.2em", marginBottom: idx === lines.length - 1 ? 0 : "8px" }}>
          {parts.length > 0 ? parts : cleanLine}
        </div>
      );
    });
  };

  return (
    <div className="panel-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 170px)", minHeight: "500px" }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(0, 0, 0, 0.06)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-glow)", color: "var(--primary)" }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-dark)", fontFamily: "var(--font-heading)" }}>Admin AI Copilot</h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Connected to CRM intelligence</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={12} /> Clear Chat
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "6px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "60px", padding: "0 20px" }}>
            <Compass size={48} style={{ color: "var(--primary)", marginBottom: "16px", opacity: 0.8 }} />
            <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--text-dark)", fontSize: "18px", marginBottom: "8px" }}>Welcome to the Admin Assistant!</h3>
            <p style={{ fontSize: "13.5px", maxWidth: "460px", margin: "0 auto", lineHeight: "1.6" }}>
              Ask about booking statistics, request driver assignments, or generate discount coupons using simple conversational English.
            </p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "32px", maxWidth: "600px", margin: "32px auto 0 auto" }}>
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: "1px solid rgba(140, 91, 48, 0.12)",
                    background: "rgba(255, 255, 255, 0.65)",
                    color: "var(--primary-dark)",
                    fontWeight: "500",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(140, 91, 48, 0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
            {m.role !== "user" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary)", color: "white", flexShrink: 0, marginTop: "2px" }}>
                <Bot size={14} />
              </div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: "14px",
              fontSize: "13.5px",
              lineHeight: "1.5",
              background: m.role === "user" ? "var(--primary)" : "rgba(255, 255, 255, 0.75)",
              color: m.role === "user" ? "white" : "var(--text-dark)",
              border: m.role === "user" ? "none" : "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: m.role === "user" ? "0 2px 8px rgba(140, 91, 48, 0.15)" : "0 2px 6px rgba(0, 0, 0, 0.02)"
            }}>
              {formatMessage(m.content)}
            </div>
            {m.role === "user" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(140, 91, 48, 0.15)", color: "var(--primary)", flexShrink: 0, marginTop: "2px" }}>
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-start", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary)", color: "white", flexShrink: 0 }}>
              <Bot size={14} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "10px 16px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.75)", border: "1px solid rgba(0, 0, 0, 0.05)" }}>
              <div className="typing-dot" style={{ animationDelay: "0s" }} />
              <div className="typing-dot" style={{ animationDelay: "0.2s" }} />
              <div className="typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query input form */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", borderTop: "1px solid rgba(0, 0, 0, 0.04)", paddingTop: "14px" }}>
        <input
          type="text"
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything or request actions..."
          disabled={loading}
          style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", background: "var(--bg-input)" }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !query.trim()}
          style={{ padding: "0 20px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
