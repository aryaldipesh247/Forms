
import React from 'react';

interface ShareDialogProps {
  formId: string;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ formId, onClose }) => {
  // Ensure the link includes the hash for proper SPA routing in the preview mode
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-black border border-gray-100 scale-100 overflow-hidden relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#008272]">Collect responses</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Anyone with the link can respond</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 text-3xl transition-colors">&times;</button>
        </div>

        <div className="flex flex-col items-center mb-8 bg-[#faf9f8] p-6 rounded-xl border border-dashed border-[#edebe9]">
          <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
            <img src={qrUrl} alt="Form QR Code" className="w-40 h-40 object-contain" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#008272]">Scan to open form</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Form Link</label>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={shareUrl} 
                className="flex-1 p-3 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none font-medium truncate" 
              />
              <button 
                onClick={copyToClipboard}
                className="bg-[#008272] text-white px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button 
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 p-3 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-100 transition-all group"
            >
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">📱</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-green-600">WhatsApp</span>
            </button>
            <button 
              onClick={shareEmail}
              className="flex flex-col items-center gap-2 p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all group"
            >
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">✉️</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-600">Email</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2 p-3 border border-gray-100 rounded-xl opacity-40 cursor-not-allowed"
            >
              <span className="text-2xl grayscale">💬</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Teams</span>
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Designed by AjD Group Of Company</p>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;