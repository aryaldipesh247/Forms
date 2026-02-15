
import React, { useMemo } from 'react';
import { Form } from '../types';
import FormCard from './FormCard';

const LOST_FOUND_ID = 'official-lost-found-v1';

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
  const officialForms = useMemo(() => forms.filter(f => f.id === LOST_FOUND_ID), [forms]);
  const userForms = useMemo(() => forms.filter(f => f.id !== LOST_FOUND_ID), [forms]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10 p-10 bg-gradient-to-br from-[#008272] to-[#005a4e] rounded-md text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
           <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome to FORMS PRO</h1>
           <p className="text-lg opacity-90 font-medium">Create engaging surveys and quizzes with intelligent AI tools and professional themes.</p>
           <div className="flex flex-wrap gap-4 mt-8">
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
              <button 
                onClick={() => onViewResponses(LOST_FOUND_ID)}
                className="bg-orange-500/20 text-white border border-orange-400/40 px-6 py-2.5 rounded font-black uppercase text-[11px] tracking-widest hover:bg-orange-500/40 transition-all flex items-center gap-2 group shadow-lg"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">📋</span>
                Lost and Found Registry
              </button>
           </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="space-y-12">
        {/* OFFICIAL REGISTRY SECTION - PINNED AT THE TOP */}
        <section>
          <div className="mb-6 flex items-center justify-between border-b border-orange-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-orange-900 uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-6 bg-[#ea4300] rounded-full"></span>
                Official Portals & Master Registries
              </h2>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">Core Organizational Database Access</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {officialForms.map(form => (
              <FormCard key={form.id} form={form} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onViewResponses={onViewResponses} />
            ))}
            <div 
              key="blank-form-card"
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
        </section>

        {/* USER FORMS SECTION */}
        <section>
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-[#323130] uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-6 bg-[#008272] rounded-full"></span>
                Recent Workspace Documents
              </h2>
              <p className="text-[10px] text-[#a19f9d] font-black uppercase tracking-widest mt-1">Manage your personal collection</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {userForms.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-gray-50/50 rounded border-2 border-dashed border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No custom forms created yet.</p>
              </div>
            ) : (
              userForms.map(form => (
                <FormCard key={form.id} form={form} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onViewResponses={onViewResponses} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
