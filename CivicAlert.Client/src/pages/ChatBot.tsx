import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Bot, User, Send, HelpCircle, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: Date;
  isError?: boolean;
}

const WELCOME_EN = "Hello! I am the CivicAlert Karachi support assistant. How can I help you today?";
const WELCOME_UR = "ہیلو! میں سوک الرٹ کراچی سپورٹ اسسٹنٹ ہوں۔ آج میں آپ کی کس طرح مدد کر سکتا ہوں؟";

const STARTER_CHIPS = {
  en: [
    { label: "How do I report?", value: "How do I submit a report?" },
    { label: "What happens next?", value: "What happens after I submit a report?" },
    { label: "How does verification work?", value: "How does community verification work?" },
    { label: "Who handles my report?", value: "Who handles my report?" }
  ],
  ur: [
    { label: "میں رپورٹ کیسے کروں؟", value: "میں رپورٹ کیسے کروں؟" },
    { label: "اس کے بعد کیا ہوتا ہے؟", value: "رپورٹ درج کرنے کے بعد کیا ہوتا ہے؟" },
    { label: "تصدیق کا عمل کیسے کام کرتا ہے؟", value: "برادری کی تصدیق کا عمل کیسے کام کرتا ہے؟" },
    { label: "میری رپورٹ کون سنبھالتا ہے؟", value: "میری رپورٹ کون سنبھالتا ہے؟" }
  ]
};

const ChatBot: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: WELCOME_EN,
      time: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync welcome message on language change if chat is untouched
  useEffect(() => {
    if (messages.length === 1 && (messages[0].id === 'welcome' || messages[0].id === 'welcome_ur')) {
      setMessages([
        {
          id: language === 'en' ? 'welcome' : 'welcome_ur',
          sender: 'bot',
          text: language === 'en' ? WELCOME_EN : WELCOME_UR,
          time: new Date()
        }
      ]);
    }
  }, [language]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/chat', {
        question: textToSend,
        language: language
      });
      
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: res.data.answer,
        time: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      let errorText = "An error occurred. Please check your connection.";
      if (err.response?.status === 429) {
        errorText = language === 'en' 
          ? "Rate limit exceeded. Maximum 10 requests per minute." 
          : "پیغام بھیجنے کی حد ختم ہو گئی ہے۔ براہ کرم ایک منٹ بعد دوبارہ کوشش کریں۔";
      } else if (err.response?.data?.error) {
        errorText = err.response.data.error;
      }
      
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: errorText,
        time: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const activeChips = language === 'en' ? STARTER_CHIPS.en : STARTER_CHIPS.ur;

  return (
    <div className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0a0f1a] min-h-[calc(100vh-4rem)] font-sans text-slate-300">
      <div className="w-full max-w-3xl bg-[#111827] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0a0f1a]/60 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-450">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white text-sm font-semibold tracking-tight leading-tight">CivicAlert Support Agent</h2>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">AI FAQ & Assistant</span>
            </div>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center bg-[#0a0f1a] border border-slate-700/50 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ur')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                language === 'ur'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Chat History Panel */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={msg.id}
                className={`flex items-start space-x-3 max-w-[85%] ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs font-semibold ${
                  isBot 
                    ? 'bg-[#0a0f1a] border-slate-700/50 text-emerald-450 shadow shadow-emerald-500/5' 
                    : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                }`}>
                  {isBot ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  msg.isError
                    ? 'bg-red-950/20 border border-red-500/25 text-red-200'
                    : isBot
                      ? 'bg-[#0a0f1a] border border-slate-700/50 text-slate-100'
                      : 'bg-emerald-600 text-white font-medium'
                }`}>
                  {msg.isError && (
                    <div className="flex items-center space-x-1.5 font-semibold text-red-400 mb-1 text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{language === 'en' ? 'System Notice' : 'سسٹم نوٹس'}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-normal">
                    {msg.text}
                  </p>
                  <span className={`text-[9px] block text-right mt-1.5 font-mono ${
                    isBot ? 'text-slate-550' : 'text-emerald-200'
                  }`}>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bouncing Dots Loading Animation */}
          {loading && (
            <div className="flex items-start space-x-3 max-w-[85%] mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-emerald-450 shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-[#0a0f1a] border border-slate-700/50 text-slate-200 rounded-2xl px-4.5 py-3 shadow-sm flex items-center space-x-1.5 h-9">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Panel: Suggestions & Input bar */}
        <div className="bg-[#0a0f1a]/60 border-t border-slate-700/50 p-4 space-y-4">
          
          {/* Starter Chips suggestions */}
          {messages.length <= 2 && !loading && (
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block px-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Suggested Questions</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(chip.value)}
                    disabled={loading}
                    className="bg-[#0a0f1a] hover:bg-[#1a2332] border border-slate-700/50 text-slate-300 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={
                language === 'en' 
                  ? "Ask anything about CivicAlert..." 
                  : "سوک الرٹ کے بارے میں کچھ بھی پوچھیں..."
              }
              className="flex-grow bg-[#0a0f1a] border border-slate-700/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl p-3 transition-all duration-200 shadow-md shadow-emerald-950/20 active:scale-95"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ChatBot;
