import { MessageCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { REPORTS } from '../data';

export function CitizenInboxView({ onOpenDiscussion }: { onOpenDiscussion: (id: string) => void }) {
  // Hanya ambil diskusi jika admin sudah mengirim pesan
  const activeDiscussions = REPORTS.filter(r => r.messages.some(m => m.sender === 'admin'));

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-slate-50 border-x border-slate-200 shadow-sm relative overflow-y-auto w-full">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Kotak Masuk Diskusi</h2>
        <p className="text-sm text-slate-500 mb-6">Pesan dari admin terkait laporan Anda.</p>
        
        {activeDiscussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">Belum ada permintaan diskusi</p>
            <p className="text-sm text-slate-500 mt-2">
              Ruang diskusi hanya bisa dibuka apabila Admin Instansi membutuhkan informasi atau klarifikasi tambahan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDiscussions.map(r => {
                const adminMessage = r.messages.filter(m => m.sender === 'admin').pop();
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenDiscussion(r.id)}
                    className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start justify-between group"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-slate-900 text-sm">Pesan dari Admin</span>
                        <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Butuh Respon
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2 font-medium">Terkait laporan: {r.id}</p>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 italic">
                        "{adminMessage?.text}"
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
