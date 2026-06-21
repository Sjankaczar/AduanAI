import { useState } from 'react';
import { Send } from 'lucide-react';

export function CitizenSubmitView() {
  const [complaintText, setComplaintText] = useState('');

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-slate-50 border-x border-slate-200 shadow-sm relative overflow-y-auto w-full">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Ajukan Keluhan Baru</h2>
        <p className="text-sm text-slate-500 mb-4">Sampaikan masalah tanpa birokrasi rumit.</p>
        
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm mb-4 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Ceritakan detail masalah di lingkungan Anda..."
            className="w-full min-h-[140px] bg-transparent border-0 focus:ring-0 resize-none text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
          />
        </div>
        <button
          disabled={!complaintText.trim()}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Kirim Laporan <Send className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
