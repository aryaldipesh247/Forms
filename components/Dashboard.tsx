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
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#323130] flex items-center gap-3">
            My forms
          </h1>
          <p className="text-xs text-[#605e5c] font-medium mt-1">Create, manage and analyze your surveys.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onViewRecycleBin}
            className="p-2.5 text-[#605e5c] hover:bg-[#edebe9] rounded-sm transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Recycle Bin
          </button>
          <button 
            onClick={onCreate}
            className="bg-[#008272] hover:bg-[#006a5d] text-white px-8 py-2.5 rounded-sm font-bold transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <span className="text-xl">+</span> New Form
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {forms.map(form => (
          <div key={form.id} className="bg-white rounded-sm shadow-sm hover:shadow-md transition-all border border-[#edebe9] group cursor-pointer overflow-hidden flex flex-col h-[280px]">
            <div className="h-1.5 w-full bg-[#008272]" />
            <div className="p-5 flex-1 flex flex-col relative" onClick={() => onSelect(form.id)}>
              <h3 className="font-bold text-base text-[#323130] line-clamp-3 mb-2 leading-snug group-hover:text-[#008272] transition-colors">{form.title}</h3>
              <p className="text-[10px] font-bold text-[#a19f9d] uppercase tracking-wider mt-auto">
                {form.responses.length} {form.responses.length === 1 ? 'response' : 'responses'}
              </p>
              
              {/* Quick Actions Overlay on Hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicate(form); }}
                  className="p-1.5 bg-white shadow-sm border rounded-sm text-[#605e5c] hover:bg-gray-50"
                  title="Copy"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                </button>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#f3f2f1] flex justify-between items-center bg-[#faf9f8] group-hover:bg-white transition-colors">
              <div className="flex gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewResponses(form.id); }}
                  className="text-[10px] text-[#008272] font-black hover:underline uppercase tracking-widest"
                >
                  Results
                </button>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(form.id); }}
                className="text-[#a19f9d] hover:text-[#a4262c] p-1.5 transition-colors rounded-full hover:bg-[#fde7e9]"
                title="Move to Recycle Bin"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
        
        {/* Create New Card */}
        <div 
          onClick={onCreate}
          className="bg-white rounded-sm border-2 border-dashed border-[#edebe9] hover:border-[#008272] hover:bg-[#faf9f8] transition-all cursor-pointer h-[280px] flex flex-col items-center justify-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
            <span className="text-3xl text-[#008272]">+</span>
          </div>
          <span className="text-sm font-bold text-[#605e5c] uppercase tracking-widest group-hover:text-[#008272]">New Form</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;