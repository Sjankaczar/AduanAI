import { MessageCircle, ChevronRight, AlertCircle, Clock, CheckCircle2, Search as SearchIcon, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const STATUS_CONFIG = {
  Menunggu: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  Ditinjau: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: SearchIcon },
  Diproses: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Loader2 },
  Selesai: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

export function CitizenInboxView({ onOpenDiscussion }: { onOpenDiscussion: (id: string) => void }) {
  const { state } = useAppContext();
  const reports = state.reports;

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-slate-50 border-x border-slate-200 shadow-sm relative overflow-y-auto w-full">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Riwayat Laporan Saya</h2>
        <p className="text-sm text-slate-500 mb-6">Semua laporan dan status penanganannya.</p>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">Belum ada laporan</p>
            <p className="text-sm text-slate-500 mt-2">
              Buat laporan pertama Anda di tab "Buat Laporan".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => {
              const hasAdminResponse = r.messages.some(m => m.sender === 'admin');
              const lastMessage = r.messages[r.messages.length - 1];
              const StatusIcon = STATUS_CONFIG[r.status].icon;

              return (
                <button
                  key={r.id}
                  onClick={() => onOpenDiscussion(r.id)}
                  className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start justify-between group"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{r.id}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[r.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {r.status}
                      </span>
                      {hasAdminResponse && (
                        <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Ada Balasan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2 font-medium">{r.date} · {r.aiCategory}</p>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {lastMessage?.text}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 mt-2 flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
