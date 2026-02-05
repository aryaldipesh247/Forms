
import React from 'react';
import { Form, ResponseArchive } from '../types';

interface RecycleBinProps {
  forms: Form[];
  archivedResponses?: ResponseArchive[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onRestoreArchive: (formId: string, archiveId: string) => void;
  onDeleteArchivePermanently: (formId: string, archiveId: string) => void;
  onBack: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ 
  forms, 
  archivedResponses = [], 
  onRestore, 
  onPermanentDelete, 
  onRestoreArchive, 
  onDeleteArchivePermanently,
  onBack 
}) => {
  const getDaysRemaining = (deletedAt: string) => {
    const deletedTime = new Date(deletedAt).getTime();
    const now = new Date().getTime();
    const diff = now - deletedTime;
    const remainingDays = 29 - Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, remainingDays);
  };

  const downloadArchiveCSV = (archive: ResponseArchive) => {
    if (archive.responses.length === 0) return alert('No data in this archive.');
    
    // Use first response to infer keys if needed, but usually we just want CSV
    const firstRes = archive.responses[0];
    const keys = Object.keys(firstRes.answers);
    const headers = ['Timestamp', 'Serial Number', ...keys];
    
    const rows = archive.responses.map(r => {
      const row = [new Date(r.timestamp).toLocaleString(), r.serialNumber];
      keys.forEach(k => {
        const val = r.answers[k];
        if (typeof val === 'object') row.push(JSON.stringify(val).replace(/"/g, '""'));
        else row.push((val || '').toString().replace(/"/g, '""'));
      });
      return row.join('","');
    });

    const csvContent = `"${headers.join('","')}"\n"${rows.join('"\n"')}"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Archive_${archive.formTitle.replace(/\s+/g, '_')}_${new Date(archive.deletedAt).toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="flex items-center gap-6 mb-12">
        <button onClick={onBack} className="p-2 hover:bg-[#edebe9] rounded-sm text-[#008272]">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#323130]">Recycle Bin</h1>
          <p className="text-sm text-[#605e5c] font-semibold mt-1 italic">Items are kept for 29 days before being permanently removed.</p>
        </div>
      </header>

      <section className="mb-16">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#a19f9d] mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#008272] rounded-full"></div>
          Deleted Forms
        </h2>
        {forms.length === 0 ? (
          <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-sm border border-dashed border-[#edebe9]">
            <p className="text-sm font-bold text-[#a19f9d]">No deleted forms found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {forms.map(form => (
              <div key={form.id} className="bg-white rounded-sm shadow-sm border border-[#edebe9] group overflow-hidden flex flex-col h-[280px]">
                <div className="h-2 w-full bg-[#a19f9d]" />
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-[#a19f9d] line-clamp-2 mb-3 leading-snug italic">{form.title}</h3>
                  <div className="mt-auto space-y-1">
                      <p className="text-[10px] font-bold text-[#a4262c] uppercase tracking-wider">
                          Expires in {getDaysRemaining(form.deletedAt!)} days
                      </p>
                      <p className="text-[10px] text-[#605e5c] font-semibold">Deleted on: {new Date(form.deletedAt!).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#f3f2f1] flex justify-between items-center bg-[#faf9f8]">
                  <button onClick={() => onRestore(form.id)} className="text-xs text-[#008272] font-bold hover:underline uppercase tracking-wider">Restore</button>
                  <button onClick={() => onPermanentDelete(form.id)} className="text-xs text-[#a4262c] font-bold hover:underline uppercase tracking-wider">Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#a19f9d] mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#107c41] rounded-full"></div>
          Excel Archives (Deleted Data)
        </h2>
        {archivedResponses.length === 0 ? (
          <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-sm border border-dashed border-[#edebe9]">
            <p className="text-sm font-bold text-[#a19f9d]">No archived excel data found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {archivedResponses.map(archive => (
              <div key={archive.id} className="bg-white rounded-sm shadow-sm border border-[#edebe9] group overflow-hidden flex flex-col h-[280px]">
                <div className="h-2 w-full bg-[#107c41]" />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] bg-green-50 text-[#107c41] px-1.5 py-0.5 rounded border border-green-100 font-black uppercase tracking-widest">Excel</span>
                    <button onClick={() => downloadArchiveCSV(archive)} className="text-[9px] font-black uppercase text-[#107c41] hover:underline">Download CSV</button>
                  </div>
                  <h3 className="font-bold text-lg text-[#323130] line-clamp-2 leading-snug">{archive.formTitle}</h3>
                  <p className="text-xs font-bold text-[#a19f9d] mt-2 italic">{archive.responses.length} responses captured</p>
                  
                  <div className="mt-auto space-y-1">
                      <p className="text-[10px] font-bold text-[#a4262c] uppercase tracking-wider">
                          Expires in {getDaysRemaining(archive.deletedAt)} days
                      </p>
                      <p className="text-[10px] text-[#605e5c] font-semibold">Archived on: {new Date(archive.deletedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#f3f2f1] flex justify-between items-center bg-[#faf9f8]">
                  <button 
                    onClick={() => onRestoreArchive(archive.formId, archive.id)} 
                    className="text-xs text-[#008272] font-bold hover:underline uppercase tracking-wider"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => onDeleteArchivePermanently(archive.formId, archive.id)} 
                    className="text-xs text-[#a4262c] font-bold hover:underline uppercase tracking-wider"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecycleBin;