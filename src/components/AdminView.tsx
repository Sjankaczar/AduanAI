import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, AlertTriangle, Send, User, ShieldAlert, X, CheckCircle, RotateCcw, ChevronDown, Sparkles, Info, Plus, FileText, FileImage, FileVideo, Check, CheckCheck } from 'lucide-react';
import { Report, Attachment } from '../types';
import { AttachmentModal } from './AttachmentModal';

const ALL_CATEGORIES = ['Semua', 'Infrastruktur', 'Keamanan', 'Kebersihan', 'Pelayanan Publik', 'Darurat', 'Umum'];
const ALL_STATUSES: Array<Report['status']> = ['Menunggu', 'Ditinjau', 'Diproses', 'Selesai'];

export function AdminView() {
  const { state, addMessage, updateMessageStatus, updateReportStatus } = useAppContext();
  const [selectedId, setSelectedId] = useState(state.reports[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusSaveNotification, setStatusSaveNotification] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MAX 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) continue;
      
      let type: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      const attachment: Attachment = {
        id: `att-admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type,
        size: file.size,
      };
      setAttachments((prev) => [...prev, attachment]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  // --- Filtered & sorted reports ---
  const filteredReports = useMemo(() => {
    let results = [...state.reports];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r => {
        // Tentukan label prioritas berdasarkan skor untuk keperluan pencarian
        let priorityLabel = 'rendah biasa';
        if (r.aiPriorityScore >= 80) priorityLabel = 'tinggi segera harus';
        else if (r.aiPriorityScore >= 50) priorityLabel = 'menengah';

        const matchName = r.citizenName.toLowerCase().includes(q);
        const matchComplaint = r.originalComplaint.toLowerCase().includes(q);
        const matchPreview = r.preview.toLowerCase().includes(q);
        const matchCategory = r.aiCategory.toLowerCase().includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        const matchStatus = r.status.toLowerCase().includes(q);
        const matchPriority = priorityLabel.includes(q);
        const matchMessages = r.messages.some(m => m.text.toLowerCase().includes(q));

        return matchName || matchComplaint || matchPreview || matchCategory || matchId || matchStatus || matchPriority || matchMessages;
      });
    }

    // Category filter
    if (filterCategory !== 'Semua') {
      results = results.filter(r => r.aiCategory === filterCategory);
    }

    // Sort by priority (highest first)
    results.sort((a, b) => b.aiPriorityScore - a.aiPriorityScore);

    return results;
  }, [state.reports, searchQuery, filterCategory]);

  const selectedReport = state.reports.find(r => r.id === selectedId) || filteredReports[0];

  // Auto-select first report when filter changes
  useEffect(() => {
    if (filteredReports.length > 0 && !filteredReports.find(r => r.id === selectedId)) {
      setSelectedId(filteredReports[0].id);
    }
  }, [filteredReports, selectedId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedReport?.messages.length]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- AI Quick Replies Logic ---
  const lastMessage = selectedReport?.messages[selectedReport.messages.length - 1];
  const isLastMessageFromCitizen = lastMessage?.sender === 'citizen';
  
  const suggestedReplies = useMemo(() => {
    if (!isLastMessageFromCitizen || !lastMessage) return [];
    
    const lower = lastMessage.text.toLowerCase();
    
    // Infrastruktur & Jalan
    if (lower.includes('jalan') || lower.includes('lubang') || lower.includes('rusak')) {
      return [
        "Tim Dinas PU akan kami terjunkan segera ke lokasi untuk mengecek kondisi jalan.",
        "Mohon konfirmasi patokan lokasi pastinya agar tim mudah menemukan titik kerusakan.",
        "Terima kasih. Kami telah memasukkan laporan ini ke prioritas perbaikan infrastruktur minggu ini."
      ];
    }
    // Sampah & Kebersihan
    if (lower.includes('sampah') || lower.includes('bau') || lower.includes('kotor')) {
      return [
        "Terima kasih informasinya, kami telah menghubungi armada truk kebersihan untuk segera menuju ke lokasi.",
        "Apakah tumpukan sampah tersebut sampai menutup akses jalan utama?",
        "Laporan diterima. Jadwal pengangkutan akan dievaluasi ulang agar tidak menumpuk."
      ];
    }
    // Keamanan
    if (lower.includes('maling') || lower.includes('jambret') || lower.includes('gelap') || lower.includes('mati')) {
      return [
        "Kami telah meneruskan laporan ini ke Polsek setempat dan teknisi PJU.",
        "Harap selalu waspada. Teknisi kami akan segera memperbaiki lampu jalan yang mati.",
        "Terima kasih atas laporan daruratnya. Patroli lingkungan akan segera ditingkatkan di area tersebut."
      ];
    }
    // Default fallback
    return [
      "Baik, terima kasih atas laporannya. Segera kami tindak lanjuti.",
      "Bisa tolong sebutkan detail lokasinya secara lebih spesifik?",
      "Laporan Anda sedang kami proses. Mohon kesediaannya untuk menunggu."
    ];
  }, [isLastMessageFromCitizen, lastMessage]);


  // --- Send reply ---
  const handleSendReply = async () => {
    if (!replyText.trim() && attachments.length === 0) return;
    if (!selectedReport) return;

    const messageId = `msg-admin-${Date.now()}`;
    const now = new Date();

    addMessage(selectedReport.id, {
      id: messageId,
      sender: 'admin',
      text: replyText.trim(),
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      attachments: attachments.length > 0 ? attachments : undefined
    });

    setReplyText('');
    setAttachments([]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (Math.random() > 0.1) {
        updateMessageStatus(selectedReport.id, messageId, 'sent');
      } else {
        throw new Error('Send failed');
      }
    } catch {
      updateMessageStatus(selectedReport.id, messageId, 'failed');
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    if (!selectedReport) return;
    updateMessageStatus(selectedReport.id, messageId, 'sending');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateMessageStatus(selectedReport.id, messageId, 'sent');
    } catch {
      updateMessageStatus(selectedReport.id, messageId, 'failed');
    }
  };

  // --- Update status ---
  const handleStatusChange = (newStatus: Report['status']) => {
    if (!selectedReport) return;
    updateReportStatus(selectedReport.id, newStatus);
    setStatusSaveNotification(`Status berhasil diubah ke "${newStatus}"`);
    setTimeout(() => setStatusSaveNotification(null), 3000);
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 w-full overflow-hidden">
      {/* Sidebar - List Laporan */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col h-[40vh] md:h-full flex-shrink-0 z-10">
        <div className="p-4 border-b border-slate-100 bg-white shadow-sm relative z-20 shrink-0">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Daftar Laporan (Kotak Masuk)</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari keluhan..." 
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`p-2 border rounded-lg transition-colors ${
                  filterCategory !== 'Semua'
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 animate-[fadeIn_0.15s_ease-out]">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</p>
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        filterCategory === cat
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Active filter indicator */}
          {(searchQuery || filterCategory !== 'Semua') && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                {filteredReports.length} hasil
              </span>
              {filterCategory !== 'Semua' && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  {filterCategory}
                  <button onClick={() => setFilterCategory('Semua')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Tidak ada hasil ditemukan</p>
              <p className="text-xs mt-1">Coba ubah kata kunci atau filter.</p>
            </div>
          ) : (
            filteredReports.map(r => (
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
                <div className="flex gap-2 items-center flex-wrap">
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
            ))
          )}
        </div>
      </div>

      {/* Main Content - Detail & Chat */}
      {selectedReport ? (
        <div className="flex-1 flex flex-col h-full relative z-0 bg-white">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-4 border-b border-slate-200 bg-white shrink-0 shadow-sm z-20 relative gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tiket {selectedReport.id}</h2>
                <div className="relative inline-flex">
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleStatusChange(e.target.value as Report['status'])}
                    className={`text-[10px] uppercase font-bold pl-2 pr-6 py-1 rounded-full appearance-none cursor-pointer border outline-none transition-colors ${
                      selectedReport.status === 'Menunggu' ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' :
                      selectedReport.status === 'Ditinjau' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' :
                      selectedReport.status === 'Diproses' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                      'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                    }`}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {selectedReport.citizenName}
              </p>
            </div>
            
            {/* AI Priority Badge */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded border shadow-sm text-[11px] font-bold flex items-center bg-white border-slate-200 text-slate-600 uppercase tracking-wide">
                {selectedReport.aiCategory}
              </div>
              <div className={`px-3 py-1.5 rounded border shadow-sm text-[11px] uppercase tracking-wide font-bold flex items-center gap-1.5
                ${selectedReport.aiPriorityScore >= 80 ? 'bg-red-500 text-white border-red-600' :
                selectedReport.aiPriorityScore >= 50 ? 'bg-amber-400 text-slate-900 border-amber-500' :
                'bg-emerald-500 text-white border-emerald-600'}
              `}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Skor Prioritas: {selectedReport.aiPriorityScore}/100
              </div>
            </div>
            {statusSaveNotification && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out] z-50">
                <CheckCircle className="w-3.5 h-3.5" />
                {statusSaveNotification}
              </div>
            )}
          </div>

          {/* Auto-Delete Warning Banner (Admin Side) */}
          {selectedReport.status === 'Selesai' && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5 flex items-start gap-2 shrink-0 z-10 shadow-inner">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-yellow-800 font-medium leading-relaxed">
                Tiket ini telah ditandai <strong>Selesai</strong>. Sesuai kebijakan, seluruh riwayat percakapan akan dihapus dan ID tiket dikembalikan ke dalam antrean (dapat digunakan kembali) dalam kurun waktu 24 jam.
              </p>
            </div>
          )}

          {/* Discussion Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 relative">

            {/* AI Analysis Card */}
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
                    {selectedReport.aiPriorityScore >= 80 ? 'Harus Segera (Tinggi)' :
                     selectedReport.aiPriorityScore >= 50 ? 'Menengah' : 'Rendah/Biasa'}
                  </span>
                </div>
              </div>

              {/* Attachments display */}
              {selectedReport.attachments.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Bukti Visual</span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReport.attachments.map(att => (
                      <button 
                        key={att.id} 
                        onClick={() => setViewingAttachment(att)}
                        className="relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 rounded-lg transition-all"
                      >
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Video</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 rounded-lg transition-colors flex items-center justify-center">
                          <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Box */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 bg-[#f0f2f5] min-h-[300px]">
            {selectedReport.messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-500 font-medium mb-1.5 mx-1 flex items-center gap-1 tracking-wide">
                  {m.sender === 'admin' ? 'Anda (Admin Kota)' : selectedReport.citizenName}
                </span>
                <div className={`max-w-[90%] md:max-w-[75%] px-4 py-3 shadow-sm text-[15px] leading-relaxed relative
                  ${m.sender === 'admin' ? 
                    'bg-[#0f172a] text-[#f8fafc] rounded-2xl rounded-tr-md' : 
                    'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md'}
                  ${m.status === 'failed' ? 'opacity-70' : ''}
                `}>
                  {m.text && <span className="whitespace-pre-wrap block mb-2">{m.text}</span>}
                  
                  {/* Render Attachments inside the chat bubble */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 mt-2">
                      {m.attachments.map(att => (
                        <button
                          key={att.id}
                          onClick={() => setViewingAttachment(att)}
                          className="relative group cursor-pointer hover:ring-2 hover:ring-blue-300 rounded-lg transition-all overflow-hidden"
                        >
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border border-slate-200/50" />
                          ) : att.type === 'video' ? (
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-black/20 rounded-lg flex flex-col items-center justify-center border border-slate-200/50">
                              <FileVideo className="w-8 h-8 text-slate-800 mb-2 opacity-80" />
                              <span className="text-[10px] text-slate-800 font-semibold px-2 text-center line-clamp-2">{att.name}</span>
                            </div>
                          ) : (
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200/50">
                              <FileText className="w-8 h-8 text-blue-500 mb-2" />
                              <span className="text-[10px] text-slate-700 font-semibold px-2 text-center line-clamp-2">{att.name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md font-bold text-xs bg-black/40 px-2 py-1 rounded-full">Buka Lampiran</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 mx-1.5">
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                    {m.timestamp}
                  </span>
                  {m.sender === 'admin' && m.status !== 'failed' && (
                    <span className="ml-0.5">
                      {m.status === 'sending' ? <Check className="w-3 h-3 text-slate-400" /> : <CheckCheck className="w-3 h-3 text-blue-400" />}
                    </span>
                  )}
                  {m.sender === 'admin' && m.status === 'failed' && (
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

          {/* Admin Reply Footer */}
          <div className="p-4 md:px-6 md:py-4 bg-white border-t border-slate-200 shrink-0 relative z-20">
            {/* AI Suggested Replies */}
            {isLastMessageFromCitizen && suggestedReplies.length > 0 && (
              <div className="mb-3 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Saran Balasan Cepat AI</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedReplies.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(suggestion)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-200 transition-colors text-left max-w-[90%] truncate"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments Preview Area for Admin Input */}
            {attachments.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group shrink-0">
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    ) : att.type === 'video' ? (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 flex flex-col items-center justify-center border border-slate-300">
                        <FileVideo className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[8px] text-slate-600 truncate w-full px-1 text-center">{att.name}</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white flex flex-col items-center justify-center border border-slate-200">
                        <FileText className="w-5 h-5 text-blue-400 mb-1" />
                        <span className="text-[8px] text-slate-600 truncate w-full px-1 text-center">{att.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-slate-400 focus-within:bg-white transition-all shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 shadow-sm border border-slate-200 mb-0.5"
              >
                <Plus className="w-5 h-5" />
              </button>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Berikan balasan atau lampirkan file (PDF, Docx, dsb)..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
                rows={2}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() && attachments.length === 0}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex-shrink-0 flex items-center gap-2 font-semibold mb-0.5 shadow-sm"
              >
                <span className="hidden sm:inline">Kirim</span>
                <Send className="w-4 h-4 sm:ml-1" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <p>Pilih laporan dari daftar untuk melihat detail.</p>
        </div>
      )}

      {/* Lightbox Modal for Attachments */}
      <AttachmentModal 
        attachment={viewingAttachment} 
        onClose={() => setViewingAttachment(null)} 
      />
    </div>
  );
}
