import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CitizenDiscussView({ reportId, onBack }: { reportId: string, onBack: () => void }) {
  const { state, addMessage, updateMessageStatus } = useAppContext();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const report = state.reports.find(r => r.id === reportId);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [report?.messages.length]);

  if (!report) {
    return (
      <div className="max-w-md mx-auto h-full flex items-center justify-center bg-white">
        <p className="text-slate-500">Laporan tidak ditemukan.</p>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageId = `msg-${Date.now()}`;
    const now = new Date();

    // Add message with 'sending' status
    addMessage(reportId, {
      id: messageId,
      sender: 'citizen',
      text: inputText.trim(),
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    });

    setInputText('');

    // Simulate send delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 90% chance of success for demo purposes
      if (Math.random() > 0.1) {
        updateMessageStatus(reportId, messageId, 'sent');
      } else {
        throw new Error('Simulated network error');
      }
    } catch {
      updateMessageStatus(reportId, messageId, 'failed');
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    updateMessageStatus(reportId, messageId, 'sending');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateMessageStatus(reportId, messageId, 'sent');
    } catch {
      updateMessageStatus(reportId, messageId, 'failed');
    }
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-white border-x border-slate-200 shadow-sm relative w-full">
      {/* Header Discussion */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-slate-900 leading-tight">Diskusi Laporan</h2>
            <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
              Status: {report.status}
            </p>
          </div>
        </div>
      </div>

      {/* Original Complaint Context */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Keluhan Awal ({report.id})
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          {report.originalComplaint}
        </p>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8fafc]">
        {report.messages.map((m) => (
           <div key={m.id} className={`flex flex-col ${m.sender === 'citizen' ? 'items-end' : 'items-start'}`}>
             <span className="text-[10px] text-slate-400 font-medium mb-1 mx-1 tracking-wide">
               {m.sender === 'citizen' ? 'Saya' : 'Admin Instansi'}
             </span>
             <div className={`max-w-[85%] px-4 py-3 shadow-sm text-[15px] leading-relaxed relative
               ${m.sender === 'citizen' ? 
                 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 
                 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'}
               ${m.status === 'failed' ? 'opacity-70' : ''}
             `}>
               {m.text}
             </div>
             <div className="flex items-center gap-1.5 mt-1 mx-1.5">
               <span className="text-[10px] text-slate-400">
                 {m.timestamp}
               </span>
               {/* Message Status Indicators */}
               {m.sender === 'citizen' && m.status === 'sending' && (
                 <span className="text-[10px] text-blue-400 font-medium">Mengirim...</span>
               )}
               {m.sender === 'citizen' && m.status === 'failed' && (
                 <button
                   onClick={() => handleRetryMessage(m.id)}
                   className="flex items-center gap-1 text-[10px] text-red-500 font-semibold hover:text-red-700 transition-colors"
                 >
                   <AlertTriangle className="w-3 h-3" />
                   Gagal terkirim · 
                   <span className="underline flex items-center gap-0.5">
                     <RotateCcw className="w-2.5 h-2.5" /> Kirim ulang
                   </span>
                 </button>
               )}
             </div>
           </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Reply Input Footer */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2 bg-slate-100 rounded-3xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-100">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Balas admin..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] text-slate-900 placeholder:text-slate-500 rounded-3xl outline-none"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
