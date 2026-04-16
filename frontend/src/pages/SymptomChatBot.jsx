import React, { useState } from "react";

export default function SymptomChatBot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your AI Symptom Checker. Please describe your symptoms." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setLoading(true);
    try {
      const response = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: input.split(",").map(s => s.trim()).filter(Boolean) })
      });
      if (!response.ok) throw new Error("Failed to get suggestion");
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "bot",
          text: `Suggestion: ${data.suggestion}\nRecommended Specialties: ${data.recommendedSpecialties.join(", ")}`
        }
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Sorry, I couldn't process your request." }
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="chatbot-container" style={{ maxWidth: 400, margin: '0 auto', border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#fff', boxShadow: '0 2px 8px #eee' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 12 }}>AI Symptom ChatBot</h2>
      <div className="chat-window" style={{ minHeight: 200, maxHeight: 300, overflowY: 'auto', marginBottom: 12, padding: 8, background: '#f9f9f9', borderRadius: 6 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === "bot" ? "left" : "right", margin: '8px 0' }}>
            <span style={{
              display: 'inline-block',
              background: msg.sender === "bot" ? '#e0f7fa' : '#c8e6c9',
              color: '#333',
              borderRadius: 16,
              padding: '8px 14px',
              maxWidth: '80%',
              wordBreak: 'break-word'
            }}>{msg.text}</span>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'left', color: '#888' }}>Bot is typing...</div>}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your symptoms..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: '8px 16px', borderRadius: 6, background: '#009688', color: '#fff', border: 'none' }}>
          Send
        </button>
      </form>
    </div>
  );
}
