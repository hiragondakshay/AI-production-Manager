import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { Bot, Send, X, Sparkles, AlertCircle, RefreshCw, Layers, Cpu, ArrowRight } from 'lucide-react';

export default function AICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your NEXUSPROD AI Factory Copilot. I can analyze real-time machine telemetry, check inventory reorder points, evaluate production bottlenecks, and suggest maintenance actions. How can I assist you today?",
      suggested_actions: ["What machines are at risk?", "Which materials are low in stock?", "Show today's production bottleneck"],
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/enterprise/copilot/ask', { query });
      const botMsg = {
        role: 'assistant',
        text: res.data.answer,
        category: res.data.category,
        suggested_actions: res.data.suggested_actions || [],
        timestamp: res.data.timestamp || new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I experienced an error analyzing the factory telemetry. Please check your backend connection.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '420px',
      maxWidth: '90vw',
      height: '100vh',
      background: 'rgba(10, 15, 29, 0.96)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid rgba(56, 189, 248, 0.25)',
      boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            padding: '8px',
            borderRadius: '10px',
            color: '#fff',
            display: 'flex',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              AI Factory Copilot <Sparkles size={14} color="var(--accent-cyan)" />
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              ● Online & Context-Aware
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
          <X size={18} />
        </button>
      </div>

      {/* Message Chat Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{
              background: m.role === 'user' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(30, 41, 59, 0.8)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
              color: '#fff',
              padding: '12px 14px',
              borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              fontSize: '0.86rem',
              lineHeight: 1.45,
              whiteSpace: 'pre-line'
            }}>
              {m.text}
            </div>
            
            {/* Suggested Quick Action Chips */}
            {m.suggested_actions && m.suggested_actions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {m.suggested_actions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => handleSend(act)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--accent-cyan)',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{act}</span>
                    <ArrowRight size={10} />
                  </button>
                ))}
              </div>
            )}

            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              paddingLeft: '4px',
              paddingRight: '4px'
            }}>
              {m.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-color)',
            padding: '10px 14px',
            borderRadius: '14px 14px 14px 2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-cyan)',
            fontSize: '0.82rem'
          }}>
            <RefreshCw size={14} className="spin-icon" />
            <span>Analyzing factory telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.9)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot about machines, OEE, bottlenecks..."
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#0a0f1d',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.85rem'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ padding: '0 14px', borderRadius: '8px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
