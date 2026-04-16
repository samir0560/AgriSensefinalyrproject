import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse, getChatHistory } from '../api/api';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';

const Chatbot = ({ isOpen, onClose }) => {
  const { t, locale, dateLocale } = useI18n();
  const { token } = useAuth();

  const [messages, setMessages] = useState([
    { id: 'greeting', text: t('chatbotGreeting'), sender: 'bot', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const textareaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyReady, setHistoryReady] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 40) + 'px';
    }
  }, [inputMessage]);

  useEffect(() => {
    if (!isOpen) return;

    const greeting = {
      id: 'greeting',
      text: t('chatbotGreeting'),
      sender: 'bot',
      timestamp: new Date()
    };

    if (!token) {
      setMessages([greeting]);
      setHistoryReady(true);
      return;
    }

    let cancelled = false;
    setHistoryReady(false);
    getChatHistory(token)
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const fromDb = [];
          res.data.forEach((ex) => {
            fromDb.push({
              id: `u-${ex._id}`,
              text: ex.userMessage,
              sender: 'user',
              timestamp: new Date(ex.createdAt)
            });
            fromDb.push({
              id: `b-${ex._id}`,
              text: ex.botResponse,
              sender: 'bot',
              timestamp: new Date(ex.createdAt)
            });
          });
          setMessages([greeting, ...fromDb]);
        } else {
          setMessages([greeting]);
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([greeting]);
      })
      .finally(() => {
        if (!cancelled) setHistoryReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, token, t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const trimmed = inputMessage.trim();
    const historyPayload = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    try {
      const response = await getChatResponse(trimmed, null, { messages: historyPayload }, locale, token || null);

      let botText = t('chatbotFallback');
      if (response?.success && response.data?.response != null && String(response.data.response).trim() !== '') {
        botText = String(response.data.response).trim();
      } else if (response?.message) {
        botText = String(response.message);
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: t('chatbotErrorGeneric'),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div>
          <h3>{t('chatbotTitle')}</h3>
          {token && (
            <p className="chatbot-history-hint">{t('chatbotHistoryHint')}</p>
          )}
        </div>
        <button className="chatbot-close" onClick={onClose}>×</button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender}`}
          >
            <div className="message-content">
              {message.text.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('chatbotPlaceholder')}
          rows="1"
          className="chatbot-textarea"
          style={{ height: 'auto' }}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!inputMessage.trim() || isLoading || !historyReady}
          className="chatbot-send-btn"
        >
          {t('chatbotSend')}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;