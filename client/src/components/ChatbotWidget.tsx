import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Mic, 
  Paperclip, 
  Send, 
  ChevronDown, 
  ImageIcon, 
  BarChart2, 
  Sparkles, 
  FileText, 
  PenTool, 
  LayoutGrid,
  Command,
  Headphones
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'support';
  text: string;
  timestamp: string;
}

interface ChatbotWidgetProps {
  activeAssetClass?: 'hotels' | 'flights';
  currentDestination?: string;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  activeAssetClass = 'hotels',
  currentDestination = 'Dubai, UAE'
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
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Exact 6 Suggested Prompt Pills from Reference Image (media_1795110812740_0cb48d87.png)
  const quickPrompts = [
    { 
      label: 'Create image', 
      icon: ImageIcon, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
      query: `Generate visual distribution model for ${currentDestination} inventory allocation` 
    },
    { 
      label: 'Analyze data', 
      icon: BarChart2, 
      color: 'text-blue-600 bg-blue-50 border-blue-100', 
      query: `Analyze wholesale demand pacing and revenue potential for ${currentDestination}` 
    },
    { 
      label: 'Make a plan', 
      icon: Sparkles, 
      color: 'text-purple-600 bg-purple-50 border-purple-100', 
      query: `Make an optimal procurement plan under the $500,000 budget cap` 
    },
    { 
      label: 'Summarize text', 
      icon: FileText, 
      color: 'text-pink-600 bg-pink-50 border-pink-100', 
      query: `Summarize wholesale supplier cancellation rules and Newsvendor fractiles` 
    },
    { 
      label: 'Help me write', 
      icon: PenTool, 
      color: 'text-orange-600 bg-orange-50 border-orange-100', 
      query: `Help me write an inventory commitment request for top recommended hotels` 
    },
    { 
      label: 'More', 
      icon: LayoutGrid, 
      color: 'text-slate-600 bg-slate-100 border-slate-200', 
      query: `Connect me with TBO Inventory Support Desk or show TreeSHAP factor cards` 
    },
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

      if (q.includes('support') || q.includes('specialist') || q.includes('team') || q.includes('desk') || q.includes('connect')) {
        replyText = `Connecting you to TBO Inventory Support Desk... 🎧\n\nAgent Michael (Wholesale Desk): "Hello Amélie! I am currently monitoring live ${activeAssetClass} commitments for ${currentDestination}. Would you like assistance reviewing your budget allocations or adjusting supplier contract parameters?"`;
      } else if (q.includes('image') || q.includes('visual')) {
        replyText = `🎨 Rendering portfolio distribution graph: Generating multi-tier quantile demand charts (P10, P50, P90) and real-time category distribution for ${currentDestination}.`;
      } else if (q.includes('plan') || q.includes('procurement') || q.includes('budget')) {
        replyText = `📋 Procurement Plan Generated:\n• Total Budget: $500,000\n• Algorithm: PuLP MILP Solver + Newsvendor Q* Sizing\n• Optimization Target: Maximize expected net profit under hard capital ceiling.\n• 15 verified properties selected with average margin of 25.8%.`;
      } else if (q.includes('summarize') || q.includes('cancellation') || q.includes('terms')) {
        replyText = `📄 Contract & Risk Summary:\n• Calibrated Cancellation Risk: 18.2% median across active allotments\n• Critical Fractile (CF): 0.74 calculated via (Price - Wholesale) / (Price - Salvage)\n• Downside Risk Buffer: Fully covered by Isotonic Regression Platt scaling.`;
      } else if (q.includes('write') || q.includes('order') || q.includes('commitment')) {
        replyText = `✍️ Draft Wholesale Commitment Order:\n\n"To: Supplier Allotment Desk\nSubject: Pre-Purchase Commitment Allotment - ${currentDestination}\n\nWe hereby confirm allocation of wholesale blocks per TBO SmartStock AI MILP optimization under Q4 portfolio guidelines. Please confirm rate locks."`;
      } else if (q.includes('analyze') || q.includes('data') || q.includes('pacing')) {
        replyText = `📊 Analysis for ${currentDestination}:\nWholesale commitments are currently yielding a +24.8% projected ROI. Model 5 classifies the portfolio as BALANCED with a 92% demand confidence score.`;
      } else {
        replyText = `I've registered your request regarding "${query}". Our automated optimization engine and human support desk are continuously tracking your commitments in ${currentDestination}. Let me know if you need to run a simulation or adjust parameters!`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: q.includes('support') || q.includes('specialist') || q.includes('desk') ? 'support' : 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 750);
  };

  return (
    <>
      {/* ─── 1. Cute Teddy Bear Floating Action Button (Bottom Right) ─── */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        
        {/* Subtle Online Pulse Ring */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0D4E43] border-2 border-white" />
        </span>

        {/* Cute Cat Avatar Trigger Button (Replica of media_1795116922760_d15d191e.png) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_12px_32px_rgba(59,130,246,0.35)] border-2 transition-all cursor-pointer relative overflow-hidden ${
            isOpen 
              ? 'bg-slate-900 border-slate-700 text-white shadow-slate-900/40' 
              : 'border-white bg-[#8CB5FF] p-0'
          }`}
          aria-label="Open support and AI assistant chat"
          title="Chat with TBO Support & SmartStock AI"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5] text-white" />
          ) : (
            <img 
              src="/chatbot-avatar.png" 
              alt="AI Assistant" 
              className="w-full h-full object-cover select-none pointer-events-none drop-shadow-xs" 
            />
          )}
        </motion.button>
      </div>

      {/* ─── 2. Chat Pop-up Window (Pixel-Perfect Replica of media_1795110812740_0cb48d87.png) ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[355px] sm:w-[395px] h-[610px] max-h-[85vh] bg-white rounded-[32px] border border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.18)] z-50 flex flex-col overflow-hidden text-slate-900 font-sans antialiased select-none"
          >
            {/* Top Bar with 3x3 Dot Grid & Close Button */}
            <div className="flex items-center justify-end gap-2 px-5 pt-4 pb-1 text-slate-400">
              {/* 3x3 Dot Grid Menu Icon */}
              <button 
                type="button" 
                className="hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                title="Options"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <circle cx="3" cy="3" r="1.5" />
                  <circle cx="9" cy="3" r="1.5" />
                  <circle cx="15" cy="3" r="1.5" />
                  <circle cx="3" cy="9" r="1.5" />
                  <circle cx="9" cy="9" r="1.5" />
                  <circle cx="15" cy="9" r="1.5" />
                  <circle cx="3" cy="15" r="1.5" />
                  <circle cx="9" cy="15" r="1.5" />
                  <circle cx="15" cy="15" r="1.5" />
                </svg>
              </button>
              
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100"
                title="Close chat"
              >
                <X className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

            {/* Main Chat Body */}
            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
              
              {/* Initial Welcome Hero State (Matches Reference Image) */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-1 pb-3">
                  
                  {/* Glossy 3D Metallic Orb with Circular Rotating Arrows (Exact Replica) */}
                  <div className="relative w-16 h-16 rounded-full mb-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center bg-gradient-to-br from-stone-800 via-neutral-900 to-black ring-1 ring-white/20 overflow-hidden">
                    {/* Top Specular Light Reflection */}
                    <div className="absolute top-1 left-2 right-2 h-5 rounded-full bg-gradient-to-b from-white/35 to-transparent blur-[0.5px]" />
                    
                    {/* Inner Rotating White Glyph */}
                    <div className="w-8 h-8 rounded-full border-2 border-white/80 border-t-transparent border-b-white/90 animate-spin flex items-center justify-center" style={{ animationDuration: '6s' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    </div>
                  </div>

                  {/* Greeting Text */}
                  <span className="text-slate-500 font-medium text-[15px]">
                    Hi Amélie,
                  </span>
                  
                  <h3 className="text-[22px] sm:text-[23px] font-black text-slate-950 tracking-tight mt-0.5 leading-snug">
                    Welcome back! How can I help?
                  </h3>

                  <p className="text-[12.5px] text-slate-500 max-w-[270px] mt-1.5 leading-relaxed">
                    I'm here to help you tackle your tasks. Choose from the prompts below or just tell me what you need!
                  </p>

                  {/* Exact 6 Quick Prompt Pills (media_1795110812740_0cb48d87.png 2-Row / 3-Col Grid) */}
                  <div className="grid grid-cols-3 gap-1.5 w-full mt-5">
                    {quickPrompts.map((p) => {
                      const IconComponent = p.icon;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleSendMessage(p.query)}
                          className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-2xl border border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/90 transition-all text-xs font-semibold text-slate-800 shadow-2xs group cursor-pointer"
                        >
                          <IconComponent className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                          <span className="text-[11px] truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                </div>
              ) : (
                /* Active Chat Stream */
                <div className="space-y-3 pt-1">
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
                            <span>TBO Wholesale Support</span>
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
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 shadow-xs focus-within:border-slate-400 focus-within:bg-white transition-all">
                
                {/* Input Row: Magnifying Glass + Text Input + Mic / Send */}
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
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 px-1 text-[11px] text-slate-500 font-medium select-none">
                  <button 
                    type="button"
                    className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>UUI v6.0</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Help me review my current wholesale commitments')}
                      className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Command className="w-3 h-3 text-slate-400" />
                      <span>Shortcuts</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Connect me to live support specialist')}
                      className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span>Attach</span>
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
