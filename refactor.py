import re

filepath = 'src/components/CitizenChatView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PenSquare
content = content.replace("CheckCircle2, ChevronRight } from 'lucide-react';", "CheckCircle2, ChevronRight, PenSquare } from 'lucide-react';")

# 2. Add BottomNav Component
bottom_nav = """
  const renderBottomNav = () => (
    <div className="bg-white border-t border-slate-200 flex justify-around p-2 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20 relative">
      <button
        onClick={() => {
          setSessionId(null);
          sessionStorage.removeItem('citizenSessionReportId');
          setShowInbox(false);
          playMenuCloseSound();
        }}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all ${
          !showInbox && !activeReport ? 'text-[#00a884] bg-[#00a884]/10' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <PenSquare className="w-6 h-6 mb-1" />
        <span className="text-[11px] font-bold">Buat Laporan</span>
      </button>
      <button
        onClick={() => {
          setShowInbox(true);
          playMenuOpenSound();
        }}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all relative ${
          showInbox ? 'text-[#00a884] bg-[#00a884]/10' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <div className="relative">
          <Inbox className="w-6 h-6 mb-1" />
          {state.reports.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <span className="text-[11px] font-bold">Kotak Masuk</span>
      </button>
    </div>
  );
"""
content = content.replace("  if (sessionId && !state.isLoaded) {", bottom_nav + "\n  if (sessionId && !state.isLoaded) {")

# 3. Phase 1 (Submission): remove header inbox button, add bottom nav, and if showInbox is true, render ONLY inbox.
# Wait, let's just make it a single unified return at the end of the file.
# It's better to rewrite the component rendering entirely.
