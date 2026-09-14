import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Send, AlertTriangle, ShieldAlert, Sparkles, X, User } from 'lucide-react';

interface DrishtiAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat?: number;
  currentLng?: number;
  currentRiskScore?: number;
  onTriggerSOS?: () => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  emergencyAlert?: boolean;
  actions?: string[];
}

export const DrishtiAIAssistantModal: React.FC<DrishtiAIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentLat,
  currentLng,
  currentRiskScore = 25,
  onTriggerSOS
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am DRISHTI AI, your emergency safety assistant for the Nilgiris district. How can I assist your journey or clarify safety protocols today?',
      actions: ['Landslide Safety Protocol', 'Wild Animal Encounter Advice', 'Emergency Hospital Numbers', 'UPI Payment Guidance']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.askAIAssistant(query, currentLat, currentLng, currentRiskScore);
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: res.reply,
        emergencyAlert: res.emergency_alert_required,
        actions: res.suggested_actions
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'I am currently operating in offline deterministic mode. For urgent help, please trigger Emergency SOS or dial 112.',
        emergencyAlert: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-sm flex items-center gap-1.5">
                <span>DRISHTI AI Safety Assistant</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400">Emergency & Terrain Risk Advisory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  m.sender === 'user' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none'
                }`}>
                  {m.text}

                  {/* Prominent Emergency Alert Banner if critical */}
                  {m.emergencyAlert && (
                    <div className="mt-3 p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Hazard Advisory</span>
                      </div>
                      {onTriggerSOS && (
                        <button
                          onClick={() => {
                            onClose();
                            onTriggerSOS();
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-extrabold uppercase shadow cursor-pointer"
                        >
                          Trigger SOS
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Suggestion Pills */}
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {m.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(act)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-full text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing safety database...</span>
            </div>
          )}
        </div>

        {/* Bottom Input Field */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask safety questions (e.g. 'I see mud falling, what to do?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
