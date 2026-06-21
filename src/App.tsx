import { useState } from 'react';
import { CitizenSubmitView } from './components/CitizenSubmitView';
import { CitizenDiscussView } from './components/CitizenDiscussView';
import { CitizenInboxView } from './components/CitizenInboxView';
import { AdminView } from './components/AdminView';
import { MessageSquare, ShieldAlert, FileEdit, Inbox } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'citizen_submit' | 'citizen_inbox' | 'citizen_discuss' | 'admin'>('citizen_submit');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleOpenDiscussion = (id: string) => {
    setSelectedReportId(id);
    setView('citizen_discuss');
  };

  const handleBackToInbox = () => {
    setSelectedReportId(null);
    setView('citizen_inbox');
  };

  const isCitizenView = view === 'citizen_submit' || view === 'citizen_inbox' || view === 'citizen_discuss';

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Global Navigation Toggle */}
      <header className="bg-slate-900 text-white p-3 md:p-4 shadow-md z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
            <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span>TeksAduan <span className="text-blue-400">AI</span></span>
          </div>
          
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
             {/* Mobile & Desktop Main Toggles */}
             <button
                onClick={() => setView('citizen_submit')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${isCitizenView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                `}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Mode Warga</span>
                <span className="sm:hidden">Warga</span>
              </button>
              <button
                onClick={() => setView('admin')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${view === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                `}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Mode Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>
          </nav>
        </div>
      </header>

      {/* Citizen Sub-Navigation */}
      {isCitizenView && (
        <div className="bg-white border-b border-slate-200 shadow-sm z-40 flex-shrink-0">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={() => setView('citizen_submit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors
                ${view === 'citizen_submit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              `}
            >
              <FileEdit className="w-4 h-4" />
              Buat Laporan
            </button>
            <button
              onClick={() => setView('citizen_inbox')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors
                ${(view === 'citizen_inbox' || view === 'citizen_discuss') ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              `}
            >
              <Inbox className="w-4 h-4" />
              Diskusi
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex">
        {view === 'citizen_submit' && <CitizenSubmitView />}
        {view === 'citizen_inbox' && <CitizenInboxView onOpenDiscussion={handleOpenDiscussion} />}
        {view === 'citizen_discuss' && selectedReportId && <CitizenDiscussView reportId={selectedReportId} onBack={handleBackToInbox} />}
        {view === 'admin' && <AdminView />}
      </main>
    </div>
  );
}
