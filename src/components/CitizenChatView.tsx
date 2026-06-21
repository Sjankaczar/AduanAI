import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, FileImage, FileVideo, FileText, AlertTriangle, RotateCcw, UploadCloud, User, Info, Check, CheckCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Attachment } from '../types';
import { AttachmentModal } from './AttachmentModal';

export function CitizenChatView() {
  const { state, addMessage, updateMessageStatus, addReport, updateCitizenName } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Sesi Warga ---
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return sessionStorage.getItem('citizenSessionReportId');
  });

  // Cari tiket berdasarkan sessionId. Jika tidak ada/sudah dihapus (kedaluwarsa), ini akan undefined.
  const activeReport = state.reports.find(r => r.id === sessionId); 

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeReport?.messages?.length, attachments.length]);

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: { target: HTMLInputElement }) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
      };
      setAttachments((prev) => [...prev, attachment]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  // --- Message Sending ---
  const analyzeComplaint = (text: string) => {
    const lower = text.toLowerCase();
    let category = 'Umum';
    let score = 30; // Default Rendah

    // Kategori Darurat
    if (lower.match(/darurat|kebakaran|kecelakaan|api|darah|tolong|gawat|meninggal|nyawa/)) {
      category = 'Darurat';
      score = lower.match(/banyak korban|meninggal|kritis/) ? 100 : 90;
    }
    // Infrastruktur
    else if (lower.match(/jalan|lubang|rusak|aspal|jembatan|tiang|roboh/)) {
      category = 'Infrastruktur';
      score = lower.match(/parah|bahaya|jatuh|korban/) ? 85 : 65;
    }
    // Keamanan
    else if (lower.match(/maling|jambret|curi|begal|gelap|mati lampu|mabuk|preman/)) {
      category = 'Keamanan';
      score = lower.match(/senjata|korban|ancam/) ? 95 : 75;
    }
    // Kebersihan
    else if (lower.match(/sampah|kotor|bau|selokan|banjir|got|limbah/)) {
      category = 'Kebersihan';
      score = lower.match(/parah|banjir bandang|wabah/) ? 80 : 55;
    }
    // Pelayanan Publik
    else if (lower.match(/ktp|antre|petugas|layanan|lama|berkas|pungli/)) {
      category = 'Pelayanan Publik';
      score = lower.match(/pungli|suap/) ? 85 : 45;
    }
    // Fallback if there are attachments but no text
    else if (!text.trim() && attachments.length > 0) {
      category = 'Umum';
      score = 40;
    }

    return { category, score };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;

    let reportId = activeReport?.id;
    const now = new Date();

    // Jika belum ada laporan sama sekali (atau sudah dihapus karena kedaluwarsa 24 jam), buat sesi baru
    if (!reportId) {
      // Find lowest available ID: RPT-001 to RPT-999
      let newIdStr = 'RPT-001';
      for (let i = 1; i <= 999; i++) {
        const candidate = `RPT-${i.toString().padStart(3, '0')}`;
        if (!state.reports.find(r => r.id === candidate)) {
          newIdStr = candidate;
          break;
        }
      }
      reportId = newIdStr;
      
      // Simpan session ID ke browser session (per tab)
      setSessionId(reportId);
      sessionStorage.setItem('citizenSessionReportId', reportId);
      
      const analysis = analyzeComplaint(inputText);
      
      addReport({
        id: reportId,
        citizenName: 'Warga Anonim',
        aiCategory: analysis.category,
        aiPriorityScore: analysis.score,
        status: 'Menunggu',
        date: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        originalComplaint: inputText || 'Hanya melampirkan file',
        preview: inputText.slice(0, 60) || 'Lampiran dikirim',
        attachments: [],
        messages: []
      });
    }

    // AI Ekstraksi Nama Warga
    // Gunakan negative lookahead untuk menghindari kata kerja/sambung yang umum muncul setelah kata "saya" atau "aku"
    const nameMatch = inputText.match(/(?:nama saya|perkenalkan saya|nama aku|aku|saya)\s+(?!(?:mau|ingin|sedang|melihat|lapor|menemukan|di|ke|dari|juga|tidak|sudah|belum|baru|akan|dapat|bisa|harap|mohon|adalah|cuma|hanya|lagi|pernah|selalu|bukan|minta|butuh|lihat|dengar|tahu|pikir|rasa)\b)([A-Za-z]{3,20})/i);
    if (nameMatch && nameMatch[1]) {
      // Hilangkan noise atau panjang karakter berlebih
      const extractedName = nameMatch[1];
      if (extractedName.toLowerCase() !== 'warga' && extractedName.toLowerCase() !== 'anonim') {
        updateCitizenName(reportId, extractedName.charAt(0).toUpperCase() + extractedName.slice(1));
      }
    }

    const messageId = `msg-${Date.now()}`;

    // Untuk demo, jika ada attachment, kita masukkan URL nya ke dalam teks (karena struktur Message kita sederhana)
    // Atau di dunia nyata ini punya array attachment sendiri per pesan.
    const hasAtt = attachments.length > 0;
    addMessage(reportId, {
      id: messageId,
      sender: 'citizen',
      text: inputText.trim(), // Remove the weird [Telah melampirkan...] text
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      attachments: attachments.length > 0 ? attachments : undefined
    });

    setInputText('');
    setAttachments([]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (Math.random() > 0.1) {
        updateMessageStatus(reportId, messageId, 'sent');
      } else {
        throw new Error('Network error');
      }
    } catch {
      updateMessageStatus(reportId, messageId, 'failed');
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    if (!activeReport) return;
    updateMessageStatus(activeReport.id, messageId, 'sending');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateMessageStatus(activeReport.id, messageId, 'sent');
    } catch {
      updateMessageStatus(activeReport.id, messageId, 'failed');
    }
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className="max-w-md mx-auto h-full flex flex-col bg-[#f0f2f5] shadow-sm relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/90 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white/20 p-6 rounded-full mb-4 animate-[bounce_2s_infinite]">
            <UploadCloud className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Drop files here to add to chat</h2>
          <p className="text-blue-100 mt-2 font-medium">Lepaskan file untuk mengunggah foto atau video</p>
        </div>
      )}

      {/* Header Statis Warga */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm z-10 relative">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
          <User className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Admin TeksAduan AI</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600">Terhubung dengan Admin</span>
          </div>
        </div>
      </div>

      {/* Auto-Delete Warning Banner (Khusus jika Selesai) */}
      {activeReport?.status === 'Selesai' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-start gap-2 shrink-0">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-yellow-800 font-medium leading-relaxed">
            Sesi chat ini telah <strong>Selesai</strong> dan bersifat sementara. Pesan ini akan otomatis dihapus oleh sistem dalam kurun waktu 24 jam untuk menjaga privasi.
          </p>
        </div>
      )}

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Welcome Info Message */}
        <div className="flex justify-center mb-8 mt-4">
          <div className="bg-blue-100/50 text-blue-800 text-xs font-semibold px-4 py-2 rounded-full border border-blue-200">
            Ketik keluhan Anda di bawah ini untuk memulai pelaporan.
          </div>
        </div>

        {activeReport?.messages.map((m) => (
           <div key={m.id} className={`flex flex-col ${m.sender === 'citizen' ? 'items-end' : 'items-start'}`}>
             <div className={`max-w-[85%] px-4 py-3 shadow-sm text-[15px] leading-relaxed relative
               ${m.sender === 'citizen' ? 
                 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-md' : 
                 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md'}
               ${m.status === 'failed' ? 'opacity-70' : ''}
             `}>
               {m.text && <span className="whitespace-pre-wrap block mb-2">{m.text}</span>}
               
               {/* Render Attachments inside the chat bubble */}
               {m.attachments && m.attachments.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-1">
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
                           <FileVideo className="w-8 h-8 text-white/80 mb-2" />
                           <span className="text-[10px] text-white/90 font-semibold px-2 text-center line-clamp-2">{att.name}</span>
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
               
               <div className={`flex items-center justify-end gap-1.5 mt-1 -mb-1
                 ${m.sender === 'citizen' ? 'text-[#8696a0]' : 'text-slate-400'}
               `}>
                 <span className="text-[10px] font-medium">{m.timestamp}</span>
                 {m.sender === 'citizen' && m.status !== 'failed' && (
                   <span className="ml-0.5">
                     {m.status === 'sending' ? <Check className="w-3.5 h-3.5 opacity-60" /> : <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                   </span>
                 )}
               </div>
             </div>

             {/* Failed State Indicator outside bubble */}
             {m.sender === 'citizen' && m.status === 'failed' && (
               <button
                 onClick={() => handleRetryMessage(m.id)}
                 className="flex items-center gap-1 text-[10px] text-red-500 font-semibold hover:text-red-700 transition-colors mt-1 mx-1"
               >
                 <AlertTriangle className="w-3 h-3" />
                 Gagal terkirim · 
                 <span className="underline flex items-center gap-0.5">
                   <RotateCcw className="w-2.5 h-2.5" /> Kirim ulang
                 </span>
               </button>
             )}
           </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Footer Area */}
      <div className="bg-[#f0f2f5] p-2 pb-4 shrink-0 relative z-20">
        {/* Attachment Preview Container */}
        {attachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto p-2 bg-white rounded-xl shadow-sm border border-slate-200 mx-2">
            {attachments.map((att) => (
              <div key={att.id} className="relative group shrink-0">
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                    <FileVideo className="w-6 h-6 text-slate-400" />
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

        {/* Informational Text */}
        <div className="px-3 pb-1.5 text-center">
          <p className="text-[11px] text-slate-500 font-medium italic">
            bila ada bukti laporan terkait bisa langsung upload melalui tombol + atau drag-and-drop file ke layar ini.
          </p>
        </div>

        {/* Main Input Box */}
        <div className="flex items-end gap-2 px-2">
          {/* Plus Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors flex-shrink-0 shadow-sm border border-slate-200"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Text Area */}
          <div className="flex-1 flex items-end bg-white border border-slate-200 rounded-3xl p-1 shadow-sm focus-within:border-blue-400 transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik laporan Anda di sini..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none rounded-3xl"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-3 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex-shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal for viewing attachments if needed in citizen view */}
      <AttachmentModal 
        attachment={viewingAttachment} 
        onClose={() => setViewingAttachment(null)} 
      />
    </div>
  );
}
