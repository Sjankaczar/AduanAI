import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, FileVideo, FileText, AlertTriangle, RotateCcw, UploadCloud, User, Info, Check, CheckCheck, Camera, Loader2, ImageOff, Search, Inbox, ArrowLeft, MessageCircle, AlertCircle, Clock, CheckCircle2, ChevronRight, PenSquare } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Attachment } from '../types';
import { AttachmentModal } from './AttachmentModal';
import { TypewriterText } from './TypewriterText';
import { playAiThinkingSound, playAiDoneSound, playErrorSound, playMessageSentSound, playMenuOpenSound, playMenuCloseSound, playSendAirplaneSound, playMarbleDropSound } from '../utils/audio';

const STATUS_CONFIG: Record<string, any> = {
  Menunggu: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  Ditinjau: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Search },
  Diproses: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Loader2 },
  Selesai: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

// --- AI Thinking text phases (tanpa emoticon) ---
const THINKING_PHASES = [
  'Sedang membaca laporan Anda...',
  'Menganalisa bukti & keluhan...',
  'Mengecek kategori & prioritas...',
];

// --- Auto-reply CS message ---
const AUTO_REPLY_TEXT = `Halo, terima kasih sudah menghubungi TeksAduan AI!

Laporan Anda sudah kami terima dan sedang diproses oleh sistem AI kami.

Untuk mempercepat penanganan, mohon jelaskan secara detail:
- Lokasi kejadian (alamat lengkap/patokan)
- Waktu kejadian (tanggal dan jam)
- Kronologi singkat kejadian

Tim admin kami akan segera menindaklanjuti laporan Anda. Terima kasih atas kesediaannya melaporkan!`;

// --- Helper: Image with fallback ---
function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className={`${className} bg-slate-700 flex flex-col items-center justify-center text-slate-400`}>
        <ImageOff className="w-8 h-8 mb-1 opacity-60" />
        <span className="text-[9px] font-medium px-2 text-center line-clamp-2 opacity-80">{alt}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}

export function CitizenChatView() {
  const { state, addMessage, updateMessageStatus, addReport, updateCitizenName } = useAppContext();

  // --- Session State ---
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return sessionStorage.getItem('citizenSessionReportId');
  });
  const activeReport = state.reports.find(r => r.id === sessionId);

  // If session exists but report was deleted (expired) and data is loaded, clear session
  useEffect(() => {
    if (state.isLoaded && sessionId && !activeReport) {
      setSessionId(null);
      sessionStorage.removeItem('citizenSessionReportId');
    }
  }, [state.isLoaded, sessionId, activeReport]);

  // --- Submission Page State ---
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [complaintText, setComplaintText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Chat State ---
  const [showInbox, setShowInbox] = useState(false);
  const [inputText, setInputText] = useState('');
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [pendingChatAttachments, setPendingChatAttachments] = useState<Attachment[]>([]);
  const [spotlightText, setSpotlightText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatDocInputRef = useRef<HTMLInputElement>(null);

  // --- AI Thinking Animation State ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingMessageId, setAnalyzingMessageId] = useState<string | null>(null);
  const [thinkingPhaseIndex, setThinkingPhaseIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeReport?.messages?.length]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, []);

  // Update read status for active report
  useEffect(() => {
    if (activeReport && activeReport.messages.length > 0) {
      const lastMsg = activeReport.messages[activeReport.messages.length - 1];
      sessionStorage.setItem(`citizenRead_${activeReport.id}`, lastMsg.id);
    }
  }, [activeReport, activeReport?.messages.length]);

  // =============================================
  //  SUBMISSION PAGE HANDLERS
  // =============================================
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

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url: e.target?.result as string,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          size: file.size,
        };
        setPendingAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePendingAttachment = (id: string) => {
    playMarbleDropSound();
    setPendingAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  // =============================================
  //  AI ANALYSIS + AUTO-REPLY LOGIC
  // =============================================
  const analyzeComplaint = (text: string) => {
    const lower = text.toLowerCase();
    let category = 'Umum';
    let score = 30;

    if (lower.match(/darurat|kebakaran|kecelakaan|api|darah|tolong|gawat|meninggal|nyawa/)) {
      category = 'Darurat';
      score = lower.match(/banyak korban|meninggal|kritis/) ? 100 : 90;
    } else if (lower.match(/jalan|lubang|rusak|aspal|jembatan|tiang|roboh/)) {
      category = 'Infrastruktur';
      score = lower.match(/parah|bahaya|jatuh|korban/) ? 85 : 65;
    } else if (lower.match(/maling|jambret|curi|begal|gelap|mati lampu|mabuk|preman/)) {
      category = 'Keamanan';
      score = lower.match(/senjata|korban|ancam/) ? 95 : 75;
    } else if (lower.match(/sampah|kotor|bau|selokan|banjir|got|limbah/)) {
      category = 'Kebersihan';
      score = lower.match(/parah|banjir bandang|wabah/) ? 80 : 55;
    } else if (lower.match(/ktp|antre|petugas|layanan|lama|berkas|pungli/)) {
      category = 'Pelayanan Publik';
      score = lower.match(/pungli|suap/) ? 85 : 45;
    } else if (pendingAttachments.length > 0) {
      category = 'Umum';
      score = 40;
    }

    return { category, score };
  };

  const startAnalyzingAnimation = useCallback((reportId: string, messageId?: string) => {
    setIsAnalyzing(true);
    if (messageId) setAnalyzingMessageId(messageId);
    setThinkingPhaseIndex(0);
    setIsFadingOut(false);

    // Play the Siri-like activation sound when rainbow effect starts
    playAiThinkingSound();

    // Cycle thinking text every 1.5s
    let phaseIdx = 0;
    phaseTimerRef.current = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % THINKING_PHASES.length;
      setThinkingPhaseIndex(phaseIdx);
    }, 1500);

    // After ~5 seconds: start fade-out, then send auto-reply
    analyzeTimerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);

      // After fade-out transition (0.8s), send auto-reply and clean up
      setTimeout(() => {
        playAiDoneSound();
        const now = new Date();
        const autoReplyId = `msg-auto-${Date.now()}`;
        addMessage(reportId, {
          id: autoReplyId,
          sender: 'admin',
          text: AUTO_REPLY_TEXT,
          timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        });

        setIsAnalyzing(false);
        setIsFadingOut(false);
        setThinkingPhaseIndex(0);
        setAnalyzingMessageId(null);
      }, 800);
    }, 5000);
  }, [addMessage]);

  // =============================================
  //  SUBMIT REPORT (Laman Pengajuan → Chat)
  // =============================================
  const handleSubmitReport = () => {
    if (!complaintText.trim()) return;
    playSendAirplaneSound();

    const now = new Date();

    // Find lowest available ID
    let reportId = 'RPT-001';
    for (let i = 1; i <= 999; i++) {
      const candidate = `RPT-${i.toString().padStart(3, '0')}`;
      if (!state.reports.find(r => r.id === candidate)) {
        reportId = candidate;
        break;
      }
    }

    // Save session
    setSessionId(reportId);
    sessionStorage.setItem('citizenSessionReportId', reportId);

    const textForAnalysis = complaintText.trim();
    const analysis = analyzeComplaint(textForAnalysis);

    // Create the report
    addReport({
      id: reportId,
      citizenName: 'Warga Anonim',
      aiCategory: analysis.category,
      aiPriorityScore: analysis.score,
      status: 'Menunggu',
      date: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      originalComplaint: textForAnalysis,
      preview: textForAnalysis.slice(0, 60),
      attachments: [],
      messages: [],
    });

    // Send first message: text + optional evidence
    const textMsgId = `msg-text-${Date.now()}`;
    addMessage(reportId, {
      id: textMsgId,
      sender: 'citizen',
      text: textForAnalysis,
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    });

    // AI Name extraction
    const nameMatch = complaintText.match(/(?:nama saya|perkenalkan saya|nama aku|aku|saya)\s+(?!(?:mau|ingin|sedang|melihat|lapor|menemukan|di|ke|dari|juga|tidak|sudah|belum|baru|akan|dapat|bisa|harap|mohon|adalah|cuma|hanya|lagi|pernah|selalu|bukan|minta|butuh|lihat|dengar|tahu|pikir|rasa)\b)([A-Za-z]{3,20})/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1];
      if (extractedName.toLowerCase() !== 'warga' && extractedName.toLowerCase() !== 'anonim') {
        updateCitizenName(reportId, extractedName.charAt(0).toUpperCase() + extractedName.slice(1));
      }
    }

    // Clear submission state
    setPendingAttachments([]);
    setComplaintText('');

    // Start AI analyzing animation → auto-reply after ~5s
    startAnalyzingAnimation(reportId, textMsgId);
  };

  // =============================================
  //  CHAT MESSAGE SENDING (teks saja)
  // =============================================
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!activeReport) return;
    playSendAirplaneSound();

    const reportId = activeReport.id;
    const now = new Date();
    const messageId = `msg-${Date.now()}`;

    // AI Name extraction
    const nameMatch = inputText.match(/(?:nama saya|perkenalkan saya|nama aku|aku|saya)\s+(?!(?:mau|ingin|sedang|melihat|lapor|menemukan|di|ke|dari|juga|tidak|sudah|belum|baru|akan|dapat|bisa|harap|mohon|adalah|cuma|hanya|lagi|pernah|selalu|bukan|minta|butuh|lihat|dengar|tahu|pikir|rasa)\b)([A-Za-z]{3,20})/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1];
      if (extractedName.toLowerCase() !== 'warga' && extractedName.toLowerCase() !== 'anonim') {
        updateCitizenName(reportId, extractedName.charAt(0).toUpperCase() + extractedName.slice(1));
      }
    }

    addMessage(reportId, {
      id: messageId,
      sender: 'citizen',
      text: inputText.trim(),
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    });

    setInputText('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (Math.random() > 0.1) {
        updateMessageStatus(reportId, messageId, 'sent');
      } else {
        throw new Error('Network error');
      }
    } catch {
      updateMessageStatus(reportId, messageId, 'failed');
      playErrorSound();
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    if (!activeReport) return;
    updateMessageStatus(activeReport.id, messageId, 'sending');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateMessageStatus(activeReport.id, messageId, 'sent');
      playMessageSentSound();
    } catch {
      updateMessageStatus(activeReport.id, messageId, 'failed');
      playErrorSound();
    }
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeReport) return;
    
    const validFiles = Array.from(files).filter(f => 
      (f.type.startsWith('image/') || f.type.startsWith('video/')) && f.size <= MAX_FILE_SIZE
    );

    if (validFiles.length === 0) return;

    const newAttachments: Attachment[] = [];
    let processedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url: evt.target?.result as string,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          size: file.size,
        });
        processedCount++;
        
        if (processedCount === validFiles.length) {
          setPendingChatAttachments(newAttachments);
          setSpotlightText('');
          setIsAttachmentMenuOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const handleChatDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeReport) return;
    
    const validFiles = Array.from(files).filter(f => 
      (f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.doc') || f.name.endsWith('.docx') || f.type.startsWith('text/')) && f.size <= MAX_FILE_SIZE
    );

    if (validFiles.length === 0) return;

    const newAttachments: Attachment[] = [];
    let processedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url: evt.target?.result as string,
          type: 'document',
          size: file.size,
        });
        processedCount++;
        
        if (processedCount === validFiles.length) {
          setPendingChatAttachments(newAttachments);
          setSpotlightText('');
          setIsAttachmentMenuOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (chatDocInputRef.current) chatDocInputRef.current.value = '';
  };

  const handleSendSpotlightDescription = () => {
    if (!activeReport || pendingChatAttachments.length === 0) return;
    playSendAirplaneSound();

    const messageId = `msg-evidence-chat-${Date.now()}`;
    
    // Add attachment message
    addMessage(activeReport.id, {
      id: messageId,
      sender: 'citizen',
      text: '',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      attachments: pendingChatAttachments,
    });

    if (spotlightText.trim()) {
      const textMsgId = `msg-text-chat-${Date.now()}`;
      addMessage(activeReport.id, {
        id: textMsgId,
        sender: 'citizen',
        text: spotlightText.trim(),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: 'sending',
      });
    }

    startAnalyzingAnimation(activeReport.id, messageId);
    
    setPendingChatAttachments([]);
    setSpotlightText('');
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // =============================================
  //  RENDER: LOADING STATE (session exists but data not loaded yet)
  // =============================================
  if (sessionId && !state.isLoaded) {
    return (
      <div className="max-w-[400px] mx-auto h-full flex flex-col items-center justify-center bg-[#f0f2f5] shadow-md border-x border-slate-200 w-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Memuat data laporan...</p>
      </div>
    );
  }

  // =============================================
  //  RENDER: SUBMISSION PAGE (Fase 1)
  // =============================================
  if (!activeReport) {
    return (
      <div
        className="max-w-[400px] mx-auto h-full flex flex-col bg-[#f0f2f5] shadow-md border-x border-slate-200 relative w-full"
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
            <h2 className="text-2xl font-bold tracking-tight">Lepaskan file di sini</h2>
            <p className="text-blue-100 mt-2 font-medium">Upload foto atau video sebagai bukti laporan</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center gap-4 shrink-0 shadow-sm z-10 relative">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm transform -rotate-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Layanan Pengaduan</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Sampaikan masalah di lingkungan Anda</p>
          </div>
        </div>

        {/* Submission Form Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Title */}
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-slate-900">Ajukan Pengaduan</h3>
            <p className="text-sm text-slate-500 mt-1">Ceritakan detail masalah di lingkungan Anda untuk memulai laporan</p>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 
              flex flex-col items-center justify-center text-center transition-all duration-200
              ${pendingAttachments.length > 0
                ? 'border-blue-300 bg-blue-50/50'
                : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className={`p-4 rounded-full mb-3 ${pendingAttachments.length > 0 ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <Camera className={`w-8 h-8 ${pendingAttachments.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-semibold text-blue-600 text-base">Upload Foto / Video (Opsional)</p>
            <p className="text-sm text-slate-400 mt-1.5">atau drop file ke sini</p>
            <p className="text-xs text-slate-400 mt-1">Maksimal 10MB per file</p>
          </div>

          {/* File Previews (with delete buttons) */}
          {pendingAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Bukti terlampir ({pendingAttachments.length} file)
              </p>
              {pendingAttachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                      <FileVideo className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
                    <p className="text-xs text-slate-400">{(att.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePendingAttachment(att.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Complaint Text */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Deskripsi Keluhan <span className="text-red-500">*</span>
            </label>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Ceritakan kronologi kejadian, lokasi, dll..."
                className="w-full min-h-[100px] bg-transparent border-0 focus:ring-0 resize-none p-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Submit Button Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <button
            onClick={handleSubmitReport}
            disabled={!complaintText.trim()}
            className="w-full bg-[#00a884] text-white font-semibold py-3.5 rounded-xl hover:bg-[#008f6f] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 transition-colors shadow-sm flex items-center justify-center gap-2 text-base"
          >
            {!complaintText.trim() ? (
              'Isi deskripsi terlebih dahulu'
            ) : (
              <>
                Kirim Pengaduan
                <Send className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* BOTTOM NAV BAR (SUBMIT PHASE) */}
        <div className="bg-white border-t border-slate-200 flex justify-around p-2 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20 relative">
          <button
            onClick={() => {
              setSessionId(null);
              sessionStorage.removeItem('citizenSessionReportId');
              setShowInbox(false);
              playMenuCloseSound();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all text-[#00a884] bg-[#00a884]/10`}
          >
            <PenSquare className="w-6 h-6 mb-1" />
            <span className="text-[11px] font-bold">Buat Laporan</span>
          </button>
          <button
            onClick={() => {
              setShowInbox(true);
              playMenuOpenSound();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all relative text-slate-500 hover:bg-slate-50`}
          >
            <div className="relative">
              <Inbox className="w-6 h-6 mb-1" />
              {state.reports.some(r => {
                const lastMsg = r.messages[r.messages.length - 1];
                const lastRead = sessionStorage.getItem(`citizenRead_${r.id}`);
                return lastMsg?.sender === 'admin' && lastMsg.id !== lastRead;
              }) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[11px] font-bold">Kotak Masuk</span>
          </button>
        </div>

        {/* Slide-over Inbox Modal */}
        {showInbox && (
          <div className="absolute inset-0 bg-slate-50 z-50 flex flex-col animate-[slideIn_0.2s_ease-out]">
            <div className="p-4 md:p-6 pb-2 relative shrink-0">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Riwayat Laporan Saya</h2>
              <p className="text-sm text-slate-500 mb-6">Semua laporan dan status penanganannya.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
              {state.reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-8">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                    <MessageCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-semibold">Belum ada laporan</p>
                  <p className="text-sm text-slate-500 mt-2">Buat laporan pertama Anda sekarang.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.reports.map(r => {
                    const lastMessage = r.messages[r.messages.length - 1];
                    const lastReadId = sessionStorage.getItem(`citizenRead_${r.id}`);
                    const hasAdminResponse = lastMessage?.sender === 'admin' && lastMessage.id !== lastReadId;
                    const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG['Menunggu'];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSessionId(r.id);
                          sessionStorage.setItem('citizenSessionReportId', r.id);
                          setShowInbox(false);
                          playMenuCloseSound();
                        }}
                        className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start justify-between group"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">{r.id}</span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
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
                            {lastMessage?.text || r.preview}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 mt-2 flex-shrink-0 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BOTTOM NAV BAR (INBOX PHASE) */}
            <div className="bg-white border-t border-slate-200 flex justify-around p-2 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20 relative">
              <button
                onClick={() => {
                  setSessionId(null);
                  sessionStorage.removeItem('citizenSessionReportId');
                  setShowInbox(false);
                  playMenuCloseSound();
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all text-slate-500 hover:bg-slate-50`}
              >
                <PenSquare className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-bold">Buat Laporan</span>
              </button>
              <button
                onClick={() => {
                  setShowInbox(true);
                  playMenuOpenSound();
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all relative text-[#00a884] bg-[#00a884]/10`}
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
          </div>
        )}
      </div>
    );
  }

  // =============================================
  //  RENDER: CHAT VIEW (Fase 2)
  // =============================================
  return (
    <div className="max-w-[400px] mx-auto h-full flex flex-col bg-[#f0f2f5] shadow-md border-x border-slate-200 relative w-full">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm z-10 relative">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
          <User className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900 leading-tight">Admin TeksAduan AI</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Terhubung dengan Admin</span>
          </div>
        </div>
        <button 
          onClick={() => { setShowInbox(true); playMenuOpenSound(); }}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
          title="Buka Kotak Masuk"
        >
          <Inbox className="w-6 h-6" />
          {state.reports.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>

      {/* Auto-Delete Warning Banner */}
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
        {/* Welcome Info */}
        <div className="flex justify-center mb-4 mt-4">
          <div className="bg-blue-100/50 text-blue-800 text-xs font-semibold px-4 py-2 rounded-full border border-blue-200">
            Laporan Anda sedang ditangani oleh admin.
          </div>
        </div>

        {activeReport?.messages.map((m, idx) => {
          // Determine if this specific message is being analyzed
          const isBeingAnalyzed = isAnalyzing && m.id === analyzingMessageId;

          const bubbleContent = (
            <div
              className={`
                max-w-[85%] px-4 py-3 shadow-sm text-[15px] leading-relaxed relative
                ${m.sender === 'citizen'
                  ? 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-md'}
                ${m.status === 'failed' ? 'opacity-70' : ''}
                ${isBeingAnalyzed ? 'rainbow-border-inner' : ''}
              `}
            >
              {m.text && (
                <span className="whitespace-pre-wrap block mb-2">
                  {m.id.startsWith('msg-auto-') ? (
                    <TypewriterText 
                      text={m.text} 
                      messageId={m.id} 
                      onType={() => {
                        // Scroll down slightly as it types
                        chatEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
                      }}
                    />
                  ) : (
                    m.text
                  )}
                </span>
              )}

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
                        <SafeImage src={att.url} alt={att.name} className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border border-slate-200/50" />
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
          );

          return (
            <div key={m.id} className={`flex flex-col ${m.sender === 'citizen' ? 'items-end' : 'items-start'}`}>
              {/* Wrap with rainbow border if analyzing */}
              {isBeingAnalyzed ? (
                <div className={`rainbow-border-wrapper max-w-[85%] ${isFadingOut ? 'fade-out' : ''}`}>
                  {bubbleContent}
                </div>
              ) : (
                bubbleContent
              )}

              {/* Failed State Indicator */}
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
          );
        })}

        {/* AI Thinking Indicator */}
        {isAnalyzing && (
          <div className={`flex items-start gap-2 ai-thinking-indicator ${isFadingOut ? 'fade-out' : ''}`}>
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span className="text-sm text-slate-600 font-medium">
                {THINKING_PHASES[thinkingPhaseIndex]}
              </span>
            </div>
          </div>
        )}

        {/* Pending Local Attachment Preview in Chat */}
        <div className={`flex justify-end transition-all duration-500 ease-out origin-bottom-right ${pendingChatAttachments.length > 0 ? 'opacity-100 scale-100 max-h-[600px] mb-4' : 'opacity-0 scale-50 max-h-0 mb-0 overflow-hidden'}`}>
           <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] text-[#111b21] shadow-sm p-1.5 pb-2 relative">
             <button onClick={() => { setPendingChatAttachments([]); playMarbleDropSound(); }} className="absolute -top-2 -left-2 bg-slate-800 text-white p-1 rounded-full shadow-md z-10">
               <X className="w-3 h-3" />
             </button>
             <div className={`grid gap-1 mb-1 ${pendingChatAttachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {pendingChatAttachments.map((att, idx) => (
                  <div key={idx} className="relative aspect-square">
                    {att.type === 'image' ? (
                      <img src={att.url} alt="Attached" className="w-full h-full object-cover rounded-lg" />
                    ) : att.type === 'video' ? (
                      <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center">
                        <FileVideo className="w-10 h-10 text-white/70" />
                      </div>
                    ) : (
                       <div className="w-full h-full bg-white/50 rounded-lg flex flex-col items-center justify-center p-2 border border-slate-200">
                         <FileText className="w-8 h-8 text-blue-500 mb-2" />
                         <span className="text-xs text-center truncate w-full">{att.name}</span>
                       </div>
                    )}
                  </div>
                ))}
             </div>
             <div className="flex items-center justify-end gap-1 px-1 mt-1">
                 <span className="text-[11px] text-slate-500">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                 <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
             </div>
           </div>
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Footer */}
      <div className="bg-[#f0f2f5] p-2 pb-4 shrink-0 relative z-20">
        {/* Floating Attachment Menu */}
        <div 
          className={`absolute bottom-full left-4 mb-4 flex flex-col-reverse gap-4 transition-all duration-300 origin-bottom-left z-50 ${
            isAttachmentMenuOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-50 pointer-events-none translate-y-4'
          }`}
        >
          <button 
            onClick={() => {
              setIsAttachmentMenuOpen(false);
              playMenuCloseSound();
              chatFileInputRef.current?.click();
            }} 
            className="group flex items-center gap-3 transform -rotate-[6deg] hover:-rotate-[2deg] transition-all duration-300"
          >
            <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-white/40">
              <span className="text-sm font-bold text-slate-700">Foto / Video</span>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[1.25rem] shadow-xl border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
              <Camera className="w-7 h-7 drop-shadow-md" />
            </div>
          </button>

          <button 
            onClick={() => {
              setIsAttachmentMenuOpen(false);
              playMenuCloseSound();
              chatDocInputRef.current?.click();
            }}
            className="group flex items-center gap-3 transform -rotate-[12deg] hover:-rotate-[6deg] transition-all duration-300"
          >
            <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-white/40">
              <span className="text-sm font-bold text-slate-700">Dokumen</span>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[1.25rem] shadow-xl border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-7 h-7 drop-shadow-md" />
            </div>
          </button>
        </div>

        <div className="flex items-end gap-2 px-2 relative z-10">
          <button
            onClick={() => {
              const newState = !isAttachmentMenuOpen;
              setIsAttachmentMenuOpen(newState);
              if (newState) playMenuOpenSound();
              else playMenuCloseSound();
            }}
            className={`p-3 transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? 'text-blue-500' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 border-current flex items-center justify-center transition-transform duration-300 ${isAttachmentMenuOpen ? 'rotate-45 scale-110' : 'rotate-0'}`}>
              <span className="text-xl leading-none font-medium mb-1">+</span>
            </div>
          </button>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={chatFileInputRef}
            onChange={handleChatFileSelect}
            className="hidden"
          />
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
            ref={chatDocInputRef}
            onChange={handleChatDocSelect}
            className="hidden"
          />
          <div className="flex-1 flex items-end bg-white border border-slate-200 rounded-3xl p-1 shadow-sm focus-within:border-blue-400 transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda di sini..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none rounded-3xl"
              rows={1}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-3 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex-shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Spotlight-like Description Input Overlay */}
      <div 
        className={`absolute inset-x-0 bottom-24 z-[60] flex flex-col items-center justify-end transition-all duration-500 pointer-events-none ${pendingChatAttachments.length > 0 ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className={`w-[92%] max-w-md pointer-events-auto bg-slate-800/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-600/50 flex items-center p-1.5 transform transition-all duration-500 ${pendingChatAttachments.length > 0 ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
          <button 
             onClick={() => { setPendingChatAttachments([]); playMarbleDropSound(); }} 
             className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/60 transition-all duration-200 ml-1 shrink-0 overflow-hidden group hover:scale-105 hover:text-white hover:shadow-[0_4px_15px_rgba(239,68,68,0.5),inset_0_2px_3px_rgba(255,255,255,0.4)] active:scale-95 active:brightness-50"
             title="Batalkan"
          >
             <div className="absolute inset-0 bg-gradient-to-b from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"></div>
             <X className="w-6 h-6 relative z-10 group-hover:drop-shadow-sm transition-transform duration-300 group-hover:rotate-180" />
          </button>
          <input
             type="text"
             autoFocus={pendingChatAttachments.length > 0}
             placeholder="Tambahkan keterangan (opsional)..."
             className="flex-1 bg-transparent border-0 focus:ring-0 text-white text-[17px] px-3 py-3 outline-none placeholder:text-white/50 font-medium"
             value={spotlightText}
             onChange={e => setSpotlightText(e.target.value)}
             onKeyDown={e => {
               if (e.key === 'Enter') handleSendSpotlightDescription();
             }}
          />
          <button 
            onClick={handleSendSpotlightDescription} 
            className="w-11 h-11 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 flex items-center justify-center text-white hover:brightness-110 shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_4px_15px_rgba(59,130,246,0.5)] transition shrink-0 hover:scale-105 mr-1"
          >
             <Send className="w-5 h-5 ml-0.5 drop-shadow-sm" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Attachments */}
      <AttachmentModal 
        attachment={viewingAttachment} 
        onClose={() => setViewingAttachment(null)} 
      />

      {/* Slide-over Inbox Modal */}
      {showInbox && (
        <div className="absolute inset-0 bg-slate-50 z-50 flex flex-col animate-[slideIn_0.2s_ease-out]">
          <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-slate-200 shadow-sm shrink-0">
            <button 
              onClick={() => { setShowInbox(false); playMenuCloseSound(); }} 
              className="p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="font-bold text-lg text-slate-900">Riwayat Laporan Saya</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
            {state.reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center mt-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                  <MessageCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-semibold">Belum ada laporan</p>
                <p className="text-sm text-slate-500 mt-2">Buat laporan pertama Anda sekarang.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.reports.map(r => {
                  const lastMessage = r.messages[r.messages.length - 1];
                  const lastReadId = sessionStorage.getItem(`citizenRead_${r.id}`);
                  const hasAdminResponse = lastMessage?.sender === 'admin' && lastMessage.id !== lastReadId;
                  const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG['Menunggu'];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSessionId(r.id);
                        sessionStorage.setItem('citizenSessionReportId', r.id);
                        setShowInbox(false);
                        playMenuCloseSound();
                      }}
                      className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start justify-between group"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{r.id}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
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
                          {lastMessage?.text || r.preview}
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
      )}
    </div>
  );
}
