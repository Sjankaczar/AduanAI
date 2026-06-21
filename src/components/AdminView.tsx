import { useState } from 'react';
import { REPORTS } from '../data';
import { Search, Filter, AlertTriangle, Send, User, ShieldAlert } from 'lucide-react';

export function AdminView() {
  const [selectedId, setSelectedId] = useState(REPORTS[0].id);
  const [replyText, setReplyText] = useState('');

  const selectedReport = REPORTS.find(r => r.id === selectedId) || REPORTS[0];

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 w-full overflow-hidden">
      {/* Sidebar - List Laporan */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col h-[40vh] md:h-full flex-shrink-0 z-10">
        <div className="p-4 border-b border-slate-100 bg-white shadow-sm relative z-20 shrink-0">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Daftar Laporan Masuk</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari keluhan..." 
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50">
          {REPORTS.sort((a, b) => b.aiPriorityScore - a.aiPriorityScore).map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                selectedId === r.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-semibold text-slate-900 text-sm truncate">{r.citizenName}</span>
                <span className="text-[11px] text-slate-400 font-medium">{r.date}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed text-left">
                {r.preview}
              </p>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-white border-slate-200 text-slate-600 uppercase tracking-wider">
                  {r.aiCategory}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider
                  ${r.aiPriorityScore >= 80 ? 'bg-red-50 text-red-700 border-red-200' :
                  r.aiPriorityScore >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                  'bg-green-50 text-green-700 border-green-200'}
                `}>
                  <AlertTriangle className="w-3 h-3" />
                  Prioritas {r.aiPriorityScore}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Detail & Chat */}
      <div className="flex-1 flex flex-col bg-white h-[60vh] md:h-full relative overflow-hidden">
        {/* Header Detail */}
        <div className="p-4 md:px-6 md:py-5 border-b border-slate-200 bg-white relative z-10 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Tiket {selectedReport.id}</h1>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  selectedReport.status === 'Menunggu' ? 'bg-slate-100 text-slate-600' :
                  selectedReport.status === 'Ditinjau' ? 'bg-amber-100 text-amber-700' :
                  selectedReport.status === 'Diproses' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedReport.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {selectedReport.citizenName}
              </p>
            </div>
            
            {/* AI Summary/Meta Badge */}
            <div className="flex md:flex gap-2">
              <div className={`px-3 py-1.5 rounded border shadow-sm text-xs font-bold flex items-center gap-1.5
                ${selectedReport.aiPriorityScore >= 80 ? 'bg-red-500 text-white border-red-600' :
                selectedReport.aiPriorityScore >= 50 ? 'bg-amber-400 text-slate-900 border-amber-500' :
                'bg-emerald-500 text-white border-emerald-600'}
              `}>
                <AlertTriangle className="w-4 h-4" />
                Skor Prioritas: {selectedReport.aiPriorityScore}/100
              </div>
            </div>
          </div>

          {/* AI Automated Analysis Card */}
          <div className="mt-5 p-4 md:p-5 bg-slate-50/80 border border-slate-200 rounded-xl shadow-inner">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Klasifikasi & Analisis AI
            </h3>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 mb-4 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Teks Keluhan Asli</span>
              <p className="text-[15px] text-slate-800 leading-relaxed italic">
                "{selectedReport.originalComplaint}"
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Kategori AI</span>
                <span className="font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-200 rounded shadow-sm">{selectedReport.aiCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Tingkat Penanganan</span>
                <span className={`font-bold ${selectedReport.aiPriorityScore >= 80 ? 'text-red-700' : 'text-slate-900'}`}>
                  {selectedReport.aiPriorityScore >= 80 ? 'Darurat (Skor Tinggi)' : 'Menengah/Biasa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Box (Admin Perspective) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 bg-[#f0f2f5] min-h-[300px]">
          {selectedReport.messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-500 font-medium mb-1.5 mx-1 flex items-center gap-1 tracking-wide">
                {m.sender === 'admin' ? 'Anda (Admin)' : selectedReport.citizenName}
              </span>
              <div className={`max-w-[90%] md:max-w-[75%] px-4 py-3 shadow-sm text-[15px] leading-relaxed relative
                ${m.sender === 'admin' ? 
                  'bg-[#0f172a] text-[#f8fafc] rounded-2xl rounded-tr-md' : 
                  'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md'}
              `}>
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 mx-1.5 font-medium tracking-wide">
                {m.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Admin Input Footer */}
        <div className="p-4 md:px-6 md:py-4 bg-white border-t border-slate-200 shrink-0 relative z-20">
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-slate-400 focus-within:bg-white transition-all shadow-sm">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Berikan balasan atau minta klarifikasi ke warga..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
              rows={2}
            />
            <button
              disabled={!replyText.trim()}
              className="bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex-shrink-0 flex items-center gap-2 font-semibold mb-0.5 shadow-sm"
            >
              <span className="hidden sm:inline">Kirim Balasan</span>
              <Send className="w-4 h-4 sm:ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
