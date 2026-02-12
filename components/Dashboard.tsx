
import React from 'react';
import { Form } from '../types';

interface DashboardProps {
  forms: Form[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (form: Form) => void;
  onViewResponses: (id: string) => void;
  onViewRecycleBin: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ forms, onCreate, onSelect, onDelete, onDuplicate, onViewResponses, onViewRecycleBin }) => {
  const LOST_FOUND_ID = 'official-lost-found-v1';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10 p-10 bg-gradient-to-br from-[#008272] to-[#005a4e] rounded-md text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
           <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome to FORMS PRO</h1>
           <p className="text-lg opacity-90 font-medium">Create engaging surveys and quizzes with intelligent AI tools and professional themes.</p>
           <div className="flex gap-4 mt-8">
              <button 
                onClick={onCreate}
                className="bg-white text-[#008272] px-6 py-2.5 rounded font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                + Create New Form
              </button>
              <button 
                onClick={onViewRecycleBin}
                className="bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded font-black uppercase text-[11px] tracking-widest hover:bg-white/20 transition-all"
              >
                Access Recycle Bin
              </button>
           </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b pb-6 border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-[#323130] flex items-center gap-3">
            Recent FORMS PRO documents
          </h2>
          <p className="text-[10px] text-[#a19f9d] font-black uppercase tracking-widest mt-1">Manage your active collection</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {forms.map(form => {
          const isOfficial = form.id === LOST_FOUND_ID;
          return (
            <div key={form.id} className={`bg-white rounded shadow-sm hover:shadow-xl transition-all border border-[#edebe9] group cursor-pointer overflow-hidden flex flex-col h-[300px] relative ${isOfficial ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
              <div className={`h-1.5 w-full ${isOfficial ? 'bg-amber-500' : 'bg-[#008272]'}`} />
              <div className="p-6 flex-1 flex flex-col relative" onClick={() => onSelect(form.id)}>
                <div className="flex justify-between items-start mb-4">
                   <div className={`w-8 h-8 rounded flex items-center justify-center ${isOfficial ? 'bg-amber-50' : 'bg-teal-50'}`}>
                      {isOfficial ? (
                        <span className="text-lg">🆘</span>
                      ) : (
                        <svg className="w-5 h-5 text-[#008272]" fill="currentColor" viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M19,19H5V5H19V19M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z"/></svg>
                      )}
                   </div>
                   <div className="flex gap-1 items-center">
                      {isOfficial && (
                        <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">Official</span>
                      )}
                      {form.isPublished ? (
                        <span className="text-[8px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-100">Live</span>
                      ) : (
                        <span className="text-[8px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-100">Draft</span>
                      )}
                      {!isOfficial && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicate(form); }}
                          className="p-1.5 bg-white shadow-sm border rounded hover:bg-gray-50 text-[#605e5c] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        </button>
                      )}
                   </div>
                </div>
                <h3 className={`font-bold text-lg line-clamp-3 mb-2 leading-tight transition-colors ${isOfficial ? 'text-amber-800' : 'text-[#323130] group-hover:text-[#008272]'}`}>{form.title}</h3>
                <p className="text-[9px] font-black text-[#a19f9d] uppercase tracking-[0.2em] mt-auto">
                  {form.responses.length} {form.responses.length === 1 ? 'response' : 'responses'}
                </p>
              </div>
              <div className="px-6 py-4 border-t border-[#f3f2f1] flex justify-between items-center bg-[#faf9f8] group-hover:bg-white transition-colors">
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewResponses(form.id); }}
                  className={`text-[10px] font-black hover:underline uppercase tracking-widest ${isOfficial ? 'text-amber-600' : 'text-[#008272]'}`}
                >
                  View Results
                </button>
                {!isOfficial && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(form.id); }}
                    className="text-[#a19f9d] hover:text-[#a4262c] p-2 transition-colors rounded-full hover:bg-red-50"
                    title="Archive"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        <div 
          onClick={onCreate}
          className="bg-white rounded border-2 border-dashed border-[#edebe9] hover:border-[#008272] hover:bg-[#faf9f8] transition-all cursor-pointer h-[300px] flex flex-col items-center justify-center gap-4 group"
        >
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all shadow-inner group-hover:shadow-md">
            <span className="text-4xl text-[#008272] group-hover:scale-125 transition-transform">+</span>
          </div>
          <div className="text-center">
            <span className="text-[11px] font-black text-[#605e5c] uppercase tracking-widest group-hover:text-[#008272]">New blank form</span>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Start from scratch</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
