import React from 'react';

interface ShareDialogProps {
  formId: string;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ formId, onClose }) => {
  // Ensure the pathname includes a trailing slash if needed before the hash
  const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
  const shareUrl = `${window.location.origin}${window.location.pathname}#preview/${formId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Form link copied to clipboard!');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent('Please take a moment to fill out this form: ' + shareUrl)}`, '_blank');
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=Survey Request: Form Submission&body=${encodeURIComponent('Hi, \n\nPlease fill out this form at your earliest convenience: ' + shareUrl)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-black border border-gray-100 scale-100 overflow-hidden relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-[#008272] tracking-tight">Collect responses</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Anyone with the link can respond</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 text-3xl transition-colors leading-none">&times;</button>
        </div>

        <div className="flex flex-col items-center mb-8 bg-[#faf9f8] p-8 rounded-xl border border-dashed border-[#edebe9]">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 hover:scale-105 transition-transform">
            <img src={qrUrl} alt="Form QR Code" className="w-40 h-40 object-contain" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#008272]">Scan to open form</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Form Link</label>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={shareUrl} 
                className="flex-1 p-3.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:outline-none font-medium truncate" 
              />
              <button 
                onClick={copyToClipboard}
                className="bg-[#008272] text-white px-8 rounded-lg text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button 
              onClick={shareWhatsApp}
              className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-green-50/50 hover:border-green-100 transition-all group aspect-square"
            >
              <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">📟</div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 group-hover:text-green-600">WhatsApp</span>
            </button>
            <button 
              onClick={shareEmail}
              className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-blue-50/50 hover:border-blue-100 transition-all group aspect-square"
            >
              <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">✉️</div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 group-hover:text-blue-600 text-center leading-tight">Email</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-100 rounded-2xl aspect-square bg-gray-50/30 opacity-60 cursor-not-allowed group"
            >
              <div className="text-3xl filter grayscale opacity-50">🗨️</div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">Teams</span>
            </button>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Designed by AjD Group Of Company</p>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;