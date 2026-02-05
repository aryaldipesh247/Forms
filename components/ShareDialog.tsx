
import React from 'react';

interface ShareDialogProps {
  formId: string;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ formId, onClose }) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}#preview/${formId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent('Please fill this form: ' + shareUrl)}`, '_blank');
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=Form Submission&body=${encodeURIComponent('Please fill out this form: ' + shareUrl)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Collect responses</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl">&times;</button>
        </div>

        <div className="flex flex-col items-center mb-6 bg-gray-50 p-4 rounded border border-gray-100">
          <img src={qrUrl} alt="QR Code" className="w-32 h-32 mb-2 bg-white p-2 border" />
          <p className="text-xs text-gray-500">Scan QR code to open form</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              readOnly 
              value={shareUrl} 
              className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50 focus:outline-none" 
            />
            <button 
              onClick={copyToClipboard}
              className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Copy
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1 p-2 border rounded hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📱</span>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>
            <button 
              onClick={shareEmail}
              className="flex flex-col items-center gap-1 p-2 border rounded hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">✉️</span>
              <span className="text-xs font-semibold">Email</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 p-2 border rounded hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">💬</span>
              <span className="text-xs font-semibold">Messenger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
