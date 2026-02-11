
import React, { useState } from 'react';

// ShareDialog component for generating and copying the form preview link
interface ShareDialogProps {
  formId: string;
  isPublished?: boolean;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ formId, isPublished, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Construct the absolute URL for the form preview using the hash routing logic in App.tsx
  const shareUrl = `${window.location.origin}${window.location.pathname}#preview/${formId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    // Copy the constructed share URL to the user's clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy link. Please manually copy the URL from the input field.');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop for the modal to dismiss on click outside */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal content area with professional styling matching FORMS PRO brand */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#008272] p-6 text-white">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-black uppercase tracking-widest">Collect Responses</h3>
            <button onClick={onClose} className="text-2xl font-bold leading-none hover:opacity-70 transition-opacity">&times;</button>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Share your form with the world</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Informative alert if the form is currently in draft mode */}
          {!isPublished && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Form is not published</p>
                <p className="text-[10px] text-amber-700 font-medium mt-1">Respondents won't be able to view or submit this form until you click "Publish" in the editor.</p>
              </div>
            </div>
          )}

          {!showQR ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Form Link</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={shareUrl} 
                    className="flex-1 p-3 bg-gray-50 border border-[#edebe9] rounded text-xs font-mono text-gray-600 focus:outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded font-black uppercase text-[10px] tracking-widest transition-all ${copied ? 'bg-green-600 text-white' : 'bg-[#008272] text-white hover:bg-[#006a5d]'}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-center gap-6">
                <button onClick={() => setShowQR(true)} className="text-center group cursor-pointer outline-none">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 mx-auto border group-hover:bg-gray-100 transition-colors">
                    <span className="text-xl">📱</span>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Show QR Code</p>
                </button>
                <div className="text-center group opacity-40">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 mx-auto border">
                    <span className="text-xl">📧</span>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Email</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
               <p className="text-[10px] font-black text-[#008272] uppercase tracking-widest">Scan to Open Form</p>
               <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-inner">
                  <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
               </div>
               <button onClick={() => setShowQR(false)} className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black">← Back to Link</button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-t">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Forms Pro | Multi-Device Sync</span>
          <button onClick={onClose} className="text-[10px] font-black text-[#008272] uppercase tracking-widest hover:underline">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
