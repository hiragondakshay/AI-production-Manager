import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, X, Send } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your AI Health Assistant. Ask me a question about symptoms, diet, or lifestyle.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/analysis/chat', { message: userMessage });
            setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary"
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    borderRadius: '50%', width: '60px', height: '60px',
                    padding: 0, boxShadow: 'var(--shadow-lg)', zIndex: 999
                }}
            >
                <MessageSquare size={24} />
            </button>

            {isOpen && (
                <div className="glass-panel animate-fade-in" style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '350px', height: '500px', display: 'flex', flexDirection: 'column',
                    boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <MessageSquare size={20} /> AI Health Assistant
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.5)' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user' ? 'var(--primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                borderBottomRightRadius: msg.sender === 'user' ? 0 : '1rem',
                                borderBottomLeftRadius: msg.sender === 'bot' ? 0 : '1rem',
                                maxWidth: '85%',
                                boxShadow: 'var(--shadow-sm)',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.75rem 1rem', borderRadius: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'white', display: 'flex', gap: '0.5rem' }} onSubmit={handleSend}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="input-field"
                            style={{ padding: '0.5rem 1rem', marginBottom: 0 }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={loading}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
