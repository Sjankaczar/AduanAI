import { useState } from 'react';
import { Send, ArrowLeft, Info } from 'lucide-react';
import { REPORTS } from '../data';

export function CitizenDiscussView({ reportId, onBack }: { reportId: string, onBack: () => void }) {
  const [inputText, setInputText] = useState('');
  
  const report = REPORTS.find(r => r.id === reportId) || REPORTS[0];

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
             `}>
               {m.text}
             </div>
             <span className="text-[10px] text-slate-400 mt-1 mx-1.5">
               {m.timestamp}
             </span>
           </div>
        ))}
      </div>

      {/* Reply Input Footer */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2 bg-slate-100 rounded-3xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-100">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Balas admin..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] text-slate-900 placeholder:text-slate-500 rounded-3xl outline-none"
            rows={1}
          />
          <button
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
