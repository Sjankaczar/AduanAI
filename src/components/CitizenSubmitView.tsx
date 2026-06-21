import { useState, useRef } from 'react';
import { Send, Paperclip, X, FileImage, FileVideo, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Attachment } from '../types';

// Simulasi AI Klasifikasi
function simulateAIClassification(text: string): Promise<{ category: string; priority: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lower = text.toLowerCase();
      let category = 'Umum';
      let priority = 30;

      if (lower.includes('jalan') || lower.includes('lubang') || lower.includes('jembatan') || lower.includes('rusak') || lower.includes('banjir') || lower.includes('saluran')) {
        category = 'Infrastruktur';
        priority = 75;
      } else if (lower.includes('lampu') || lower.includes('gelap') || lower.includes('jambret') || lower.includes('pencurian') || lower.includes('keamanan') || lower.includes('maling')) {
        category = 'Keamanan';
        priority = 80;
      } else if (lower.includes('sampah') || lower.includes('bau') || lower.includes('kotor') || lower.includes('limbah') || lower.includes('nyamuk')) {
        category = 'Kebersihan';
        priority = 50;
      } else if (lower.includes('petugas') || lower.includes('pelayanan') || lower.includes('kantor') || lower.includes('antrian') || lower.includes('lambat')) {
        category = 'Pelayanan Publik';
        priority = 55;
      } else if (lower.includes('kebakaran') || lower.includes('longsor') || lower.includes('gempa') || lower.includes('darurat') || lower.includes('korban')) {
        category = 'Darurat';
        priority = 95;
      }

      // Boost priority for urgency keywords
      if (lower.includes('segera') || lower.includes('darurat') || lower.includes('korban') || lower.includes('jatuh') || lower.includes('bahaya')) {
        priority = Math.min(100, priority + 15);
      }

      resolve({ category, priority });
    }, 1500);
  });
}

export function CitizenSubmitView() {
  const { addReport } = useAppContext();
  const [complaintText, setComplaintText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
  const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

  const handleFileSelect = (e: { target: HTMLInputElement }) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setValidationError(`Format file "${file.name}" tidak didukung. Gunakan JPG, PNG, WebP, GIF, MP4, atau WebM.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationError(`File "${file.name}" terlalu besar. Maksimal 10MB.`);
        continue;
      }

      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
      };
      setAttachments((prev) => [...prev, attachment]);
      setValidationError('');
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleSubmit = async () => {
    // Validasi
    if (!complaintText.trim()) {
      setValidationError('Teks keluhan wajib diisi sebelum mengirim laporan.');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Proses AI
      const aiResult = await simulateAIClassification(complaintText);

      const now = new Date();
      const reportId = `RPT-${String(now.getTime()).slice(-6)}`;

      addReport({
        id: reportId,
        citizenName: 'Warga Anonim',
        aiCategory: aiResult.category,
        aiPriorityScore: aiResult.priority,
        status: 'Menunggu',
        date: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        originalComplaint: complaintText,
        preview: complaintText.slice(0, 60) + (complaintText.length > 60 ? '...' : ''),
        attachments: attachments,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'citizen',
            text: complaintText,
            timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          },
        ],
      });

      setSubmitResult('success');
      setComplaintText('');
      setAttachments([]);
    } catch {
      setSubmitResult('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-slate-50 border-x border-slate-200 shadow-sm relative overflow-y-auto w-full">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Ajukan Keluhan Baru</h2>
        <p className="text-sm text-slate-500 mb-4">Sampaikan masalah tanpa birokrasi rumit.</p>

        {/* Success Message */}
        {submitResult === 'success' && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Laporan berhasil dikirim!</p>
              <p className="text-xs mt-1 text-emerald-600">Keluhan Anda sedang diproses oleh AI dan akan ditinjau oleh admin.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitResult === 'error' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Gagal mengirim laporan</p>
              <p className="text-xs mt-1 text-red-600">Terjadi masalah pada server AI. Silakan coba kirim ulang.</p>
              <button
                onClick={handleSubmit}
                className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
              >
                Coba kirim ulang →
              </button>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{validationError}</p>
          </div>
        )}

        {/* Text Input */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm mb-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            value={complaintText}
            onChange={(e) => {
              setComplaintText(e.target.value);
              if (validationError) setValidationError('');
              if (submitResult) setSubmitResult(null);
            }}
            placeholder="Ceritakan detail masalah di lingkungan Anda..."
            className="w-full min-h-[140px] bg-transparent border-0 focus:ring-0 resize-none text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                    <FileVideo className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
                  <p className="text-xs text-slate-400">{(att.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
          className="w-full mb-3 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {attachments.length > 0 ? (
            <>
              <FileImage className="w-4 h-4" />
              Tambah Lampiran Lainnya
            </>
          ) : (
            <>
              <Paperclip className="w-4 h-4" />
              Unggah Bukti Visual (Opsional)
            </>
          )}
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!complaintText.trim() || isSubmitting}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses AI...
            </>
          ) : (
            <>
              Kirim Laporan <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
