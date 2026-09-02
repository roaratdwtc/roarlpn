import React, { useState, useEffect, useRef } from "react";
import { Send, RefreshCw, Compass, Bot, User, Sparkles } from "lucide-react";

const ASSISTANT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const SUGGESTIONS = [
  "Show today's stats summary",
  "Are there any double-booked drivers?",
  "Assign drivers to pending bookings",
  "Check expiring vehicle documents",
  "Show this month's revenue",
  "Create coupon SUMMERSALE with 15% discount"
];

export default function AdminAssistantView({
  bookings = [],
  setBookings,
  drivers = [],
  coupons = [],
  setCoupons,
  cars = [],
  carDocuments = [],
  packages = [],
  partners = [],
  carExpenses = [],
  companyExpenses = []
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

    // 1. Greetings & Capabilities
    if (
      text === "hi" || 
      text === "hello" || 
      text === "hey" || 
      text.includes("who are you") || 
      text === "help" ||
      text.includes("what can you do")
    ) {
      return `👋 **Hello! I am your Roar CRM Copilot.**\n\nI am connected directly to your live database:\n- 📋 **Bookings**: \`${bookings.length}\` total records\n- 🚗 **Drivers**: \`${drivers.length}\` active drivers\n- 🚙 **Fleet Cars**: \`${cars.length}\` registered vehicles\n- 📄 **Legal & Passing Vault**: \`${carDocuments.length}\` documents\n- 🏷️ **Coupons**: \`${coupons.length}\` promo codes\n\nHow can I help you right now? Try asking for **today's stats**, **driver assignment**, **expiring vehicle documents**, or **creating a promo code**!`;
    }

    // 2. Double booked drivers & conflicts
    if (text.includes("double") || text.includes("clash") || text.includes("conflict") || text.includes("overlap")) {
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
        return "✅ **No driver scheduling conflicts found!** All active drivers are assigned to a maximum of one tour per day.";
      }

      let reply = "⚠️ **Driver Scheduling Conflicts Detected:**\n\n";
      conflicts.forEach(c => {
        reply += `- **${c.driverName}** is assigned to **${c.bookings.length} tours** on **${c.date.split('-').reverse().join('/')}**:\n`;
        c.bookings.forEach(b => {
          reply += `  - ${b}\n`;
        });
      });
      return reply;
    }

    // 3. Unassigned bookings query
    if (text.includes("unassigned") || text.includes("missing driver") || text.includes("who needs a driver")) {
      const pendingBookings = bookings.filter(b => (!b.driverId || b.driverId === '') && b.status === 'confirmed');
      if (pendingBookings.length === 0) {
        return "✅ **All Confirmed Bookings Have Drivers!** There are currently no unassigned confirmed tours in the system.";
      }

      let reply = `📋 **Unassigned Confirmed Bookings (${pendingBookings.length}):**\n\n`;
      pendingBookings.slice(0, 10).forEach(b => {
        reply += `- **${b.customerName}** • ${b.packageName} (${b.date.split('-').reverse().join('/')}, ${b.time || '15:00'}) • ${b.pax} Pax\n`;
      });
      if (pendingBookings.length > 10) {
        reply += `_...and ${pendingBookings.length - 10} more unassigned bookings._\n`;
      }
      reply += `\nType **"Assign drivers to pending bookings"** to automatically allocate drivers!`;
      return reply;
    }

    // 4. Assign drivers auto-allocation
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
          reply += `- **${b.customerName}** (${b.packageName}) ➡️ **${assignedDriver.name}**\n`;
          currentIdx++;
        }
      });
      return reply;
    }

    // 5. Vehicle Documents & Legal Vault Auditing
    if (
      text.includes("document") || 
      text.includes("mulkiya") || 
      text.includes("insurance") || 
      text.includes("passing") || 
      text.includes("tracker") || 
      text.includes("expir")
    ) {
      if (!carDocuments || carDocuments.length === 0) {
        return "📄 **Vehicle Documents Vault**: No vehicle documents have been uploaded yet. You can upload Mulkiya, Insurance, and Passing certificates from the **Car Expenses > Vehicle Documents** tab.";
      }

      const today = new Date();
      let expiredList = [];
      let expiringSoonList = [];

      carDocuments.forEach(doc => {
        if (!doc.expiryDate) return;
        const expDate = new Date(doc.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expiredList.push({ ...doc, diffDays: Math.abs(diffDays) });
        } else if (diffDays <= 30) {
          expiringSoonList.push({ ...doc, diffDays });
        }
      });

      let reply = `📄 **Fleet Documents & Legal Compliance Audit:**\n\n`;
      reply += `- **Total Stored Documents**: \`${carDocuments.length}\` files across fleet cars\n`;

      if (expiredList.length > 0) {
        reply += `\n🔴 **Expired Documents (${expiredList.length}):**\n`;
        expiredList.forEach(d => {
          reply += `  - **${d.carPlate}**: ${d.title} (${d.category}) — expired ${d.diffDays} day(s) ago (${d.expiryDate.split('-').reverse().join('/')})\n`;
        });
      } else {
        reply += `- **Expired Documents**: None (All up to date!)\n`;
      }

      if (expiringSoonList.length > 0) {
        reply += `\n⚠️ **Expiring within 30 Days (${expiringSoonList.length}):**\n`;
        expiringSoonList.forEach(d => {
          reply += `  - **${d.carPlate}**: ${d.title} (${d.category}) — expires in **${d.diffDays} days** (${d.expiryDate.split('-').reverse().join('/')})\n`;
        });
      } else {
        reply += `- **Expiring Soon (<30d)**: None\n`;
      }

      return reply;
    }

    // 6. Fleet Cars Summary
    if (text.includes("car") || text.includes("fleet") || text.includes("vehicle")) {
      const fleetPlates = Array.from(new Set([
        ...cars.map(c => c.plateNo),
        ...bookings.map(b => b.carPlate).filter(Boolean)
      ]));

      const totalCarExp = (carExpenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

      let reply = `🚗 **Fleet Vehicles Overview:**\n\n`;
      reply += `- **Registered Fleet Vehicles**: \`${fleetPlates.length}\` cars\n`;
      reply += `- **Plates**: ${fleetPlates.join(', ') || 'None'}\n`;
      reply += `- **Total Maintenance Expenses Recorded**: \`${totalCarExp.toLocaleString()} AED\`\n`;
      reply += `- **Documents Vault Files**: \`${(carDocuments || []).length}\` files stored\n\n`;
      reply += `Ask **"Check expiring vehicle documents"** to inspect validity!`;
      return reply;
    }

    // 7. Today's stats & summary
    if (text.includes("today") || text.includes("daily") || text.includes("stat") || text.includes("summary")) {
      const todayBookings = bookings.filter(b => b.date === todayStr);
      const confirmedToday = todayBookings.filter(b => b.status === 'confirmed');
      const completedToday = todayBookings.filter(b => b.status === 'completed');
      const pendingToday = todayBookings.filter(b => (!b.driverId || b.driverId === '') && b.status === 'confirmed');
      const revenueToday = todayBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      
      let reply = `📊 **Today's Operational Summary (${todayStr.split('-').reverse().join('/')}):**\n\n`;
      reply += `- **Total Bookings Today**: \`${todayBookings.length}\` tours\n`;
      reply += `- **Confirmed (Upcoming)**: \`${confirmedToday.length}\` slots\n`;
      reply += `- **Completed**: \`${completedToday.length}\` slots\n`;
      reply += `- **Pending Driver Allocation**: \`${pendingToday.length}\` slots\n`;
      reply += `- **Gross Today Revenue**: \`${revenueToday.toLocaleString()} AED\`\n`;
      
      const driversAssigned = Array.from(new Set(
        todayBookings.map(b => {
          const dObj = drivers.find(d => d.id === b.driverId);
          return dObj ? dObj.name : null;
        }).filter(Boolean)
      ));

      reply += `- **Drivers Active Today**: ${driversAssigned.join(', ') || '_None_'}`;
      return reply;
    }

    // 8. Monthly Stats & Revenue
    if (text.includes("month") || text.includes("revenue") || text.includes("sales") || text.includes("turnover") || text.includes("profit") || text.includes("earnings")) {
      const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
      const monthBookings = bookings.filter(b => (b.date || '').startsWith(currentMonthPrefix));
      const confirmedOrDone = monthBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
      const monthRevenue = confirmedOrDone.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
      const totalCarExp = (carExpenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const totalCompanyExp = (companyExpenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const totalExpenses = totalCarExp + totalCompanyExp;

      let reply = `💰 **Financial & Performance Snapshot (Month ${currentMonthPrefix}):**\n\n`;
      reply += `- **Total Bookings This Month**: \`${monthBookings.length}\` bookings\n`;
      reply += `- **Confirmed / Completed Tours**: \`${confirmedOrDone.length}\`\n`;
      reply += `- **Gross Monthly Revenue**: \`${monthRevenue.toLocaleString()} AED\`\n`;
      reply += `- **Car Expenses Recorded**: \`${totalCarExp.toLocaleString()} AED\`\n`;
      reply += `- **Company Expenses Recorded**: \`${totalCompanyExp.toLocaleString()} AED\`\n`;
      reply += `- **Total Operating Expenses**: \`${totalExpenses.toLocaleString()} AED\`\n`;
      reply += `- **Estimated Operating Balance**: \`${(monthRevenue - totalExpenses).toLocaleString()} AED\``;
      return reply;
    }

    // 9. Create coupon
    if (text.includes("coupon") || text.includes("promo") || text.includes("discount")) {
      if (text.includes("create") || text.includes("add") || text.includes("new")) {
        const nameMatch = queryText.match(/coupon\s+([A-Za-z0-9_-]+)/i) || queryText.match(/code\s+([A-Za-z0-9_-]+)/i);
        const discountMatch = queryText.match(/(\d+)\s*%/);
        
        const couponCode = nameMatch ? nameMatch[1].toUpperCase() : "PROMO" + Math.floor(1000 + Math.random() * 9000);
        const discountVal = discountMatch ? parseInt(discountMatch[1]) : 15;

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

        return `✨ **Promo Coupon Created Successfully:**\n\n- **Code**: \`${couponCode}\`\n- **Discount**: \`${discountVal}%\`\n- **Status**: Active\n\nThis coupon code is now ready for use on the client booking form!`;
      }

      // List existing coupons
      if (coupons.length === 0) {
        return "🏷️ **Active Coupons**: No discount coupons are currently configured. Try asking **\"Create coupon SUMMERSALE with 15% discount\"**!";
      }

      let reply = `🏷️ **Active Discount Coupons (${coupons.length}):**\n\n`;
      coupons.forEach(c => {
        reply += `- **${c.code}**: ${c.discount ? `${c.discount}% OFF` : (c.customPrice ? `AED ${c.customPrice} Fixed Rate` : 'Discount')} (${c.status || 'Active'})\n`;
      });
      return reply;
    }

    // 10. Search customer or booking
    if (text.startsWith("find ") || text.startsWith("search ") || text.includes("customer ") || text.includes("booking for ")) {
      const term = text.replace(/^(find|search|customer|booking for)\s+/i, '').trim();
      if (term.length >= 2) {
        const matches = bookings.filter(b => 
          (b.customerName || '').toLowerCase().includes(term) ||
          (b.phone || '').includes(term) ||
          (b.id || '').toLowerCase().includes(term)
        );

        if (matches.length > 0) {
          let reply = `🔍 **Found ${matches.length} Matching Booking(s) for "${term}":**\n\n`;
          matches.slice(0, 5).forEach(b => {
            reply += `- **#${b.id}** • **${b.customerName}** • ${b.packageName} (${b.date.split('-').reverse().join('/')}) • Status: **${b.status}** • AED ${b.price}\n`;
          });
          return reply;
        } else {
          return `🔍 No bookings found matching "${term}". Try searching with a different name or phone number.`;
        }
      }
    }

    // 11. Fallback: Clean, helpful, professional Copilot assistance
    return `🤖 **Roar CRM Smart Copilot**\n\nI couldn't find a direct match for that inquiry. Here are common operations I can perform immediately using your live CRM data:\n\n1. 📊 **"Show today's stats summary"** — Daily operational metrics & revenue\n2. 🚗 **"Assign drivers to pending bookings"** — Automatic round-robin allocation\n3. ⚠️ **"Are there any double-booked drivers?"** — Check scheduling overlaps\n4. 📄 **"Check expiring vehicle documents"** — Mulkiya, Insurance & Passing audits\n5. 💰 **"Show this month's revenue"** — Monthly turnover and bookings totals\n6. 🏷️ **"Create coupon SUMMERSALE with 15% discount"** — Generate new promo code`;
  };

  const performChatFetch = async (currentHistory, queryText) => {
    setLoading(true);
    try {
      if (ASSISTANT_BACKEND_URL) {
        const response = await fetch(`${ASSISTANT_BACKEND_URL}/api/admin/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentHistory.slice(0, -1),
            query: queryText
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) {
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("External AI endpoint unreachable; executing via native CRM Copilot logic:", err);
    }

    // Native in-memory CRM Copilot
    const copilotReply = handleLocalAssistant(queryText);
    setMessages((prev) => [...prev, { role: "assistant", content: copilotReply }]);
    setLoading(false);
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
