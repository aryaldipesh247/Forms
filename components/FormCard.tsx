
import React from 'react';
import { Form } from '../types';

const LOST_FOUND_ID = 'official-lost-found-v1';

interface FormCardProps {
  form: Form;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (form: Form) => void;
  onViewResponses: (id: string) => void;
}

const FormCard: React.FC<FormCardProps> = React.memo(({ form, onSelect, onDelete, onDuplicate, onViewResponses }) => {
  const isOfficial = form.id === LOST_FOUND_ID;
  return (
    <div className={`bg-white rounded shadow-sm hover:shadow-xl transition-all border border-[#edebe9] group cursor-pointer overflow-hidden flex flex-col h-[300px] relative ${isOfficial ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
      <div className={`h-1.5 w-full ${isOfficial ? 'bg-[#ea4300]' : 'bg-[#008272]'}`} />
      <div className="p-6 flex-1 flex flex-col relative" onClick={() => onSelect(form.id)}>
        <div className="flex justify-between items-start mb-4">
           <div className={`w-8 h-8 rounded flex items-center justify-center ${isOfficial ? 'bg-orange-50' : 'bg-teal-50'}`}>
              {isOfficial ? (
                <span className="text-lg">📋</span>
              ) : (
                <svg className="w-5 h-5 text-[#008272]" fill="currentColor" viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M19,19H5V5H19V19M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z"/></svg>
              )}
           </div>
           <div className="flex gap-1 items-center">
              {isOfficial && (
                <span className="text-[8px] bg-[#ea4300] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">MASTER REGISTRY</span>
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
        <h3 className={`font-bold text-lg line-clamp-3 mb-2 leading-tight transition-colors ${isOfficial ? 'text-orange-900' : 'text-[#323130] group-hover:text-[#008272]'}`}>{form.title}</h3>
        <p className="text-[9px] font-black text-[#a19f9d] uppercase tracking-[0.2em] mt-auto">
          {form.responses.length} {form.responses.length === 1 ? 'response' : 'responses'}
        </p>
      </div>
      <div className="px-6 py-4 border-t border-[#f3f2f1] flex justify-between items-center bg-[#faf9f8] group-hover:bg-white transition-colors">
        <button 
          onClick={(e) => { e.stopPropagation(); onViewResponses(form.id); }}
          className={`text-[10px] font-black hover:underline uppercase tracking-widest ${isOfficial ? 'text-[#ea4300]' : 'text-[#008272]'}`}
        >
          VIEW RESULTS
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
});

export default FormCard;
