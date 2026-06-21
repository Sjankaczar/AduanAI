import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { CitizenChatView } from './components/CitizenChatView';
import { AdminView } from './components/AdminView';
import { MessageSquare, ShieldAlert } from 'lucide-react';

function AppContent() {
  const [isCitizenView, setIsCitizenView] = useState(true);

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
            <button
              onClick={() => setIsCitizenView(true)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${isCitizenView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                `}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Warga</span>
              <span className="sm:hidden">Warga</span>
            </button>
            <button
              onClick={() => setIsCitizenView(false)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${!isCitizenView ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
                `}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {isCitizenView ? (
          <div className="h-full w-full">
            <CitizenChatView />
          </div>
        ) : (
          <AdminView />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
