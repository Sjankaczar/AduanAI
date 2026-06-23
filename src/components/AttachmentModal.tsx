import { X, Download, FileVideo } from 'lucide-react';
import { Attachment } from '../types';
import { playMarbleDropSound } from '../utils/audio';

interface Props {
  attachment: Attachment | null;
  onClose: () => void;
}

export function AttachmentModal({ attachment, onClose }: Props) {
  if (!attachment) return null;

  const handleClose = () => {
    playMarbleDropSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-8 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-4xl max-h-full flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-bold text-slate-900 truncate">{attachment.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.type.split('/')[0].toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <a
              href={attachment.url}
              download={attachment.name}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold text-xs rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline uppercase tracking-wider">Unduh File</span>
            </a>
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content (Scrollable, Fit to screen) */}
        <div className="flex-1 overflow-auto p-4 bg-slate-200 flex items-center justify-center min-h-[50vh] relative">
          {attachment.type === 'image' ? (
            <img 
              src={attachment.url} 
              alt={attachment.name} 
              className="max-w-full max-h-[70vh] object-contain rounded shadow-md" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
               <FileVideo className="w-16 h-16 mb-4 text-slate-300" />
               <p className="font-semibold text-slate-700">Video Preview</p>
               <p className="text-sm text-slate-500 mb-6 text-center max-w-xs mt-1">Silakan unduh file untuk memutar video ini di perangkat Anda.</p>
               <a 
                 href={attachment.url} 
                 download={attachment.name} 
                 className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
               >
                 <Download className="w-4 h-4" /> Unduh Video Sekarang
               </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
