import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Mic, 
  Paperclip, 
  Send, 
  GripHorizontal, 
  Sparkles, 
  ChevronDown, 
  BarChart3, 
  Building2, 
  Plane, 
  Headphones, 
  CornerDownLeft
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'support';
  text: string;
  timestamp: string;
  actions?: { label: string; action: string }[];
}

interface ChatbotWidgetProps {
  activeAssetClass?: 'hotels' | 'flights';
  currentDestination?: string;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  activeAssetClass = 'hotels',
  currentDestination = 'Bali, Indonesia'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isTyping]);

  // Suggested Prompts (Matching reference design)
  const quickPrompts = [
    { label: 'Analyze data', icon: BarChart3, color: 'text-blue-600', query: `Analyze wholesale demand pacing for ${currentDestination}` },
    { label: activeAssetClass === 'flights' ? 'Check flight risk' : 'Review hotel Q*', icon: activeAssetClass === 'flights' ? Plane : Building2, color: 'text-emerald-600', query: activeAssetClass === 'flights' ? 'Check Model 3 flight cancellation risks for upcoming routes' : 'What is the optimal Newsvendor Q* allocation for top luxury resorts?' },
    { label: 'Model explanation', icon: Sparkles, color: 'text-purple-600', query: 'Explain TreeSHAP reason factors behind recommended allocations' },
    { label: 'Talk to support', icon: Headphones, color: 'text-amber-600', query: 'Connect me with a TBO Inventory Support Specialist' },
  ];

  // Send Message Handler
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Dynamic Bot & Support Agent Response Simulator
    setTimeout(() => {
      let replyText = '';
      const q = query.toLowerCase();

      if (q.includes('support') || q.includes('specialist') || q.includes('team') || q.includes('talk')) {
        replyText = `Connecting you to TBO Wholesale Support Team... 🎧\n\nAgent Michael from Inventory Operations has joined the chat: "Hello! I am reviewing your active ${activeAssetClass} allocations in ${currentDestination}. How can our desk assist with supplier contracts or custom budget overrides?"`;
      } else if (q.includes('flight') || q.includes('cancel')) {
        replyText = `✈️ Model 3 (XGBoost Flight Cancellation Engine) reports a low 3.8% cancellation risk across Bali & direct route sectors. Our LightGBM models forecast steady demand with P50 median pacing at 52 seats/day.`;
      } else if (q.includes('analyze') || q.includes('data') || q.includes('pacing')) {
        replyText = `📊 Analysis for ${currentDestination}: Wholesale pre-buy commitments are currently yielding a +24.8% projected ROI. Model 5 classifies the portfolio as BALANCED with a 92% demand confidence score.`;
      } else if (q.includes('q*') || q.includes('newsvendor') || q.includes('allocation')) {
        replyText = `🏨 Newsvendor sizing (Q*) has dynamically solved critical fractile CF = (P - C)/(P - S). Allocations are capped strictly under your $500,000 budget cap using the PuLP MILP solver.`;
      } else if (q.includes('shap') || q.includes('reason') || q.includes('model')) {
        replyText = `✨ TreeSHAP attribution highlights: Search Intent Velocity (+42.5%), Wholesale Discount Buffer (+28%), with downside risk protected by Calibrated Probability Isotonic Layers.`;
      } else {
        replyText = `I've registered your request regarding ${query}. Our automated optimization engine and human support desk are monitoring your commitments in ${currentDestination}. Would you like to review wholesale batch allotments or adjust your budget cap?`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: q.includes('support') || q.includes('specialist') ? 'support' : 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* ─── 1. Cute Teddy Bear Floating Action Button (Bottom Right) ─── */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        
        {/* Subtle Online Pulse Ring */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0D4E43] border-2 border-white" />
        </span>

        {/* Teddy Bear Trigger Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.18)] border-2 transition-all cursor-pointer relative ${
            isOpen 
              ? 'bg-slate-900 border-slate-700 text-white shadow-slate-900/40' 
              : 'bg-amber-100/90 hover:bg-amber-100 border-amber-300/80 shadow-amber-900/20'
          }`}
          aria-label="Open support and AI assistant chat"
          title="Chat with TBO Support & SmartStock AI"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5] text-white" />
          ) : (
            /* 🧸 Cute Teddy Bear SVG Face */
            <svg 
              viewBox="0 0 100 100" 
              className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-xs"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left Ear */}
              <circle cx="24" cy="28" r="16" fill="#A76D43" />
              <circle cx="24" cy="28" r="9" fill="#E8B490" />
              
              {/* Right Ear */}
              <circle cx="76" cy="28" r="16" fill="#A76D43" />
              <circle cx="76" cy="28" r="9" fill="#E8B490" />
              
              {/* Head Base */}
              <circle cx="50" cy="54" r="36" fill="#C28555" />
              
              {/* Cute Cheek Blushes */}
              <ellipse cx="28" cy="62" rx="7" ry="4" fill="#F8A5A5" opacity="0.6" />
              <ellipse cx="72" cy="62" rx="7" ry="4" fill="#F8A5A5" opacity="0.6" />
              
              {/* Eyes */}
              <circle cx="36" cy="48" r="4.5" fill="#261A13" />
              <circle cx="34.5" cy="46" r="1.8" fill="#FFFFFF" />
              
              <circle cx="64" cy="48" r="4.5" fill="#261A13" />
              <circle cx="62.5" cy="46" r="1.8" fill="#FFFFFF" />
              
              {/* Snout Muzzle */}
              <ellipse cx="50" cy="64" rx="15" ry="12" fill="#F5D0B5" />
              
              {/* Cute Triangle Nose */}
              <path d="M46 59 C46 59, 50 63, 54 59 C54 62, 50 65, 46 59 Z" fill="#3D2314" />
              
              {/* Smiling Mouth */}
              <path d="M46 66 Q50 70 54 66" stroke="#3D2314" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* ─── 2. Chat Pop-up Window (Exact Replica of Reference Image) ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[360px] sm:w-[410px] h-[610px] max-h-[85vh] bg-white rounded-[32px] border border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.18)] z-50 flex flex-col overflow-hidden text-slate-900 font-sans antialiased select-none"
          >
            {/* Top Bar with Grid & Close */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2 text-slate-400">
              <button 
                type="button" 
                className="hover:text-slate-700 transition-colors cursor-pointer p-1"
                title="Options"
              >
                <GripHorizontal className="w-5 h-5" />
              </button>
              
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100"
                title="Close chat"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Main Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
              
              {/* Initial Welcome Hero State (Shown when no active chat messages) */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-2 pb-4">
                  
                  {/* Glossy Avatar Icon Emblem (Exact match to reference image 3D orb) */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-b from-stone-900 to-black shadow-lg flex items-center justify-center p-3 mb-4 ring-4 ring-slate-100">
                    <div className="w-9 h-9 rounded-full border-2 border-slate-400/60 border-t-white flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                    </div>
                  </div>

                  <span className="text-slate-500 font-medium text-sm">
                    Hi Inventory Manager,
                  </span>
                  
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1 leading-snug">
                    Welcome back! How can I help?
                  </h3>

                  <p className="text-xs sm:text-[13px] text-slate-500 max-w-[280px] mt-2 leading-relaxed">
                    I'm here to help you tackle your tasks. Choose from the prompts below or just tell me what you need!
                  </p>

                  {/* Quick Action Prompt Pills (2-column grid matching reference image) */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-6">
                    {quickPrompts.map((p) => {
                      const IconComponent = p.icon;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleSendMessage(p.query)}
                          className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80 transition-all text-left text-xs font-bold text-slate-800 shadow-2xs group cursor-pointer"
                        >
                          <div className={`w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${p.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                </div>
              ) : (
                /* Chat Conversation Stream */
                <div className="space-y-3 pt-2">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs select-text ${
                          m.sender === 'user'
                            ? 'bg-[#0D4E43] text-white rounded-br-xs font-medium'
                            : m.sender === 'support'
                              ? 'bg-amber-50 text-amber-950 border border-amber-200/80 rounded-bl-xs font-medium'
                              : 'bg-slate-100 text-slate-900 rounded-bl-xs font-medium'
                        }`}
                      >
                        {m.sender === 'support' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-700 mb-1">
                            <Headphones className="w-3 h-3" />
                            <span>TBO Support Specialist</span>
                          </div>
                        )}
                        <p className="whitespace-pre-line">{m.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {m.timestamp}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 w-16 shadow-2xs">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

            </div>

            {/* ─── Bottom Input Box (Exact Replica of Reference Image) ─── */}
            <div className="p-4 pt-1 border-t border-slate-100 bg-white">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 shadow-xs focus-within:border-slate-400 focus-within:bg-white transition-all">
                
                {/* Input Row */}
                <div className="flex items-center gap-2 px-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Ask me anything..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                  
                  {inputText.trim() ? (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      className="w-7 h-7 rounded-full bg-[#0D4E43] text-white flex items-center justify-center hover:bg-[#09352e] transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sub-bar inside input box: "UUI v6.0 ⌄" and "Shortcuts", "Attach" */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 px-1 text-[11px] text-slate-500 font-medium select-none">
                  <button 
                    type="button"
                    className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>SmartStock AI v2.0</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Help me review my current wholesale commitments')}
                      className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <CornerDownLeft className="w-3 h-3 text-slate-400" />
                      <span>Prompts</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Connecting to live support team...')}
                      className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span>Support</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
