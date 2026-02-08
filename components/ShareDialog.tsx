import React, { useState, useCallback } from 'react';

interface ShareDialogProps {
  formId: string;
  isPublished?: boolean;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ formId, isPublished, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Robust URL generation for single-page hash routing
  const shareUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    const cleanBase = base.endsWith('/') ? base : base + '/';
    return `${cleanBase}#preview/${formId}`;
  }, [formId]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=008272`;

  const copyToClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }, [shareUrl]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] max-w-md w-full p-10 text-black border border-white/20 relative overflow-hidden animate-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-black text-[#008272] tracking-tighter leading-none mb-2">Share Link</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Deploy to respondents</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 text-4xl transition-colors leading-none">&times;</button>
        </div>

        {!isPublished && (
          <div className="mb-10 p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl flex gap-4 animate-pulse">
             <span className="text-2xl">⚠️</span>
             <div>
               <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Draft Mode Active</p>
               <p className="text-[10px] text-amber-600 mt-1 font-bold">Respondents cannot submit until you click "Publish" in the main editor.</p>
             </div>
          </div>
        )}

        <div className="flex flex-col items-center mb-10 bg-[#faf9f8] p-10 rounded-[2rem] border-2 border-dashed border-[#edebe9] group transition-all">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <img 
              src={qrUrl} 
              alt="QR Code" 
              className="w-48 h-48 object-contain" 
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/200?text=QR+Error';
              }}
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#008272]">Scan for instant access</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] ml-1">Universal Link</label>
            <div className="flex gap-3">
              <input readOnly value={shareUrl} className="flex-1 p-4 bg-gray-50 border-2 border-[#edebe9] rounded-2xl text-xs font-black truncate focus:outline-none focus:border-[#008272] transition-colors" />
              <button 
                onClick={copyToClipboard} 
                className={`px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${copied ? 'bg-green-600 text-white' : 'bg-[#008272] text-white hover:brightness-110'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Please fill this form: ' + shareUrl)}`, '_blank')} className="flex items-center justify-center gap-3 p-4 bg-green-50 text-green-700 border-2 border-green-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm">WhatsApp</button>
             <button onClick={() => window.location.href = `mailto:?subject=Survey Request&body=${encodeURIComponent('Please complete this form: ' + shareUrl)}`} className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 border-2 border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm">Email Link</button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.6em]">Secure Protocol | AjD Group</p>
        </div>
      </div>
    </div>
  );
};

import { useMemo } from 'react';

export default ShareDialog;