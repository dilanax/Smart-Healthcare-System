import React from "react";

export default function Sidebar({ navigate }) {
  return (
    <aside style={{
      width: 220,
      background: '#f4f6f8',
      padding: 24,
      borderRight: '1px solid #e0e0e0',
      minHeight: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, color: '#009688', marginBottom: 18 }}>Smart Health Menu</h2>
      <button onClick={() => navigate('/symptom-checker')} style={btnStyle}>
        AI Symptom Checker
      </button>
      <button onClick={() => navigate('/symptom-chatbot')} style={btnStyle}>
        AI Health ChatBot
      </button>
      {/* Add more sidebar links as needed */}
    </aside>
  );
}

const btnStyle = {
  background: '#fff',
  border: '1px solid #b2dfdb',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#009688',
  fontWeight: 600,
  fontSize: 16,
  marginBottom: 8,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.2s',
};
