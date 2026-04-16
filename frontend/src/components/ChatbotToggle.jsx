import React, { useState } from 'react';
import Chatbot from './Chatbot';
import { useI18n } from '../i18n/i18nContext';

const ChatbotToggle = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { t } = useI18n();

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <>
      <button 
        className="chatbot-toggle-btn"
        onClick={toggleChatbot}
        aria-label={t('chatbotToggleLabel')}
      >
        💬
      </button>
      
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </>
  );
};

export default ChatbotToggle;