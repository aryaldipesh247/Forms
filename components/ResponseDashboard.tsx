
import React, { useState, useMemo } from 'react';
import { Form, QuestionType, Question, FormResponse } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { generateInsightsFromAI } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ResponseDashboardProps {
  form: Form;
  onBack: () => void;
  onUpdateForm: (form: Form) => void;
  onEditQuestion: (qId: string) => void;
  onArchiveResponses: () => void;
}

const COLORS = ['#008272', '#0078d4', '#107c10', '#a4262c', '#6264a7', '#d13438', '#5c2d91'];
const LOST_FOUND_ID = 'official-lost-found-v1';

type DashboardTab = 'analytics' | 'data_all' | 'data_valuable' | 'data_nonvaluable' | 'data_alcohol';

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({ form, onBack, onUpdateForm, onEditQuestion, onArchiveResponses }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const responses = form.responses ?? [];
  const questions = form.questions ?? [];
  const isOfficial = form.id === LOST_FOUND_ID;

  const filteredResponses = useMemo(() => {
    if (!isOfficial) return responses;
    if (activeTab === 'data_valuable') return responses.filter(r => r.category === 'VALUABLE');
    if (activeTab === 'data_nonvaluable') return responses.filter(r => r.category === 'NON_VALUABLE');
    if (activeTab === 'data_alcohol') return responses.filter(r => r.category === 'ALCOHOL');
    return responses;
  }, [responses, activeTab, isOfficial]);

  const handleGenerateInsights = async () => {
    if (responses.length === 0) return alert("No responses to analyze yet.");
    setIsAnalyzing(true);
    try {
      const res = await generateInsightsFromAI(form);
      setInsights(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadCSV = (targetData?: FormResponse[], fileNameSuffix?: string) => {
    const target = targetData || filteredResponses;
    if (target.length === 0) return alert('No data to export for this selection.');
    
    const headers = ['Timestamp', 'Serial Number', 'Category', ...questions.map(q => q.title)];
    const rows = target.map(r => {
      const row = [new Date(r.timestamp).toLocaleString(), r.serialNumber, r.category || 'N/A'];
      questions.forEach(q => {
        const ans = r.answers?.[q.id];
        // Handle nested objects (like double ranking boxes) gracefully
        const cellValue = typeof ans === 'object' && ans !== null 
          ? JSON.stringify(ans).replace(/"/g, '""') 
          : (ans || '').toString().replace(/"/g, '""');
        row.push(cellValue);
      });
      return `"${row.join('","')}"`;
    });
    
    const csvContent = `"${headers.join('","')}"\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const suffix = fileNameSuffix || activeTab;
    link.download = `${form.title.replace(/\s+/g, '_')}_${suffix}.csv`;
    link.click();
  };

  const getQuestionStats = (q: Question) => {
    if (q.type !== QuestionType.CHOICE) return null;
    const stats: Record<string, number> = {};
    filteredResponses.forEach(r => {
      const ans = r.answers?.[q.id];
      if (ans) {
        if (Array.isArray(ans)) ans.forEach(a => stats[a] = (stats[a] || 0) + 1);
        else if (typeof ans === 'string') stats[ans] = (stats[ans] || 0) + 1;
      }
    });
    if (Object.keys(stats).length === 0) return null;
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  };

  const DataSheet = ({ data, categoryLabel }: { data: FormResponse[], categoryLabel: string }) => (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black text-[#323130] uppercase tracking-widest">{categoryLabel} Master Data Sheet</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Exporting this view will only include items in the {categoryLabel} registry.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-[#008272] uppercase tracking-widest">{data.length} Records</span>
          <button 
            onClick={() => downloadCSV(data, categoryLabel.toLowerCase().replace(/\s+/g, '_'))}
            className="bg-[#107c41] text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#0b5d31] transition-all shadow-sm"
          >
            Download {categoryLabel} Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r">Serial</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r">Time</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r">Registry</th>
              {questions.map(q => <th key={q.id} className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[150px] border-r">{q.title}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.slice().reverse().map(r => (
              <tr key={r.id} className="hover:bg-teal-50/20 transition-colors">
                <td className="p-4 text-[11px] font-black text-[#008272] border-r">#{r.serialNumber}</td>
                <td className="p-4 text-[10px] font-medium text-gray-400 whitespace-nowrap border-r">{new Date(r.timestamp).toLocaleTimeString()}</td>
                <td className="p-4 border-r">
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${r.category === 'ALCOHOL' ? 'bg-purple-100 text-purple-700' : r.category === 'VALUABLE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.category}</span>
                </td>
                {questions.map(q => {
                  const ans = r.answers?.[q.id];
                  return <td key={q.id} className="p-4 text-[11px] text-[#323130] border-r max-w-xs truncate">{typeof ans === 'object' ? JSON.stringify(ans) : (ans || '-')}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f2f1] antialiased">
      <nav className="bg-white border-b sticky top-0 z-[60] px-6 h-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4"><button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded text-[#008272]">←</button><h1 className="font-bold text-xs uppercase tracking-[0.2em] text-[#008272]">{form.title} | Registry View</h1></div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCSV()} className="bg-[#107c41] text-white px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#0b5d31] transition-all">Export Current View</button>
          <button onClick={onArchiveResponses} className="text-[#a4262c] text-[10px] font-black uppercase tracking-widest hover:underline">Clear Data</button>
        </div>
      </nav>

      <div className="bg-white border-b px-6 sticky top-12 z-[55] shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {[
            { id: 'analytics', label: 'Overview', icon: '📈' },
            { id: 'data_all', label: 'All Records', icon: '📋' },
            ...(isOfficial ? [
              { id: 'data_alcohol', label: 'Alcohol Registry', icon: '🍷' },
              { id: 'data_valuable', label: 'Valuable Registry', icon: '💎' },
              { id: 'data_nonvaluable', label: 'Non-Valuable Registry', icon: '📦' }
            ] : [])
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DashboardTab)} className={`py-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${activeTab === tab.id ? 'text-[#008272]' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-sm">{tab.icon}</span>{tab.label}{activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#008272]" />}</button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' ? (
            <motion.div key="analytics" className="space-y-8 pb-20">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#008272]"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Registry Entries</p><h2 className="text-5xl font-black text-[#323130]">{responses.length}</h2></div>
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#ea4300]">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registry Console</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => downloadCSV(responses.filter(r => r.category === 'ALCOHOL'), 'alcohol_master')} className="w-full text-left py-1 text-[9px] font-black uppercase text-purple-600 hover:underline">Download Alcohol Master Excel</button>
                    <button onClick={() => downloadCSV(responses.filter(r => r.category === 'VALUABLE'), 'valuable_master')} className="w-full text-left py-1 text-[9px] font-black uppercase text-amber-600 hover:underline">Download Valuable Master Excel</button>
                    <button onClick={() => downloadCSV(responses.filter(r => r.category === 'NON_VALUABLE'), 'non_valuable_master')} className="w-full text-left py-1 text-[9px] font-black uppercase text-blue-600 hover:underline">Download Non-Valuable Master Excel</button>
                  </div>
                </div>
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-indigo-600"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Analyst</p><button onClick={handleGenerateInsights} disabled={isAnalyzing} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-md hover:brightness-110 disabled:opacity-50">{isAnalyzing ? 'Analyzing...' : 'Generate Insights'}</button></div>
              </section>
              {insights && <motion.section className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-10 rounded-xl relative shadow-inner"><button onClick={() => setInsights(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 text-xl font-bold">&times;</button><h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">✨ Gemini AI Summary</h3><div className="prose prose-indigo max-w-none text-indigo-800 leading-relaxed font-medium whitespace-pre-wrap text-sm">{insights}</div></motion.section>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {questions.map((q, idx) => {
                  const stats = getQuestionStats(q);
                  return (
                    <div key={q.id} className="bg-white p-8 rounded shadow-sm border border-gray-100 h-[450px] flex flex-col group hover:shadow-md transition-shadow">
                      <div className="mb-6"><span className="text-[9px] font-black text-[#008272] uppercase tracking-widest block mb-1">Question {idx + 1}</span><h4 className="text-sm font-bold text-[#323130] line-clamp-2">{q.title}</h4></div>
                      <div className="flex-1 relative">{stats ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer> : <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Latest Feed Entries</p><div className="w-full space-y-2 overflow-y-auto max-h-[220px]">{responses.slice(-5).map(r => { const ans = r.answers?.[q.id]; return <div key={r.id} className="bg-white p-3 rounded border text-[11px] text-[#323130] text-left shadow-sm">{typeof ans === 'object' ? JSON.stringify(ans) : (ans || <em className="text-gray-300">No Answer</em>)}</div>; })}</div></div>}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <DataSheet 
                  data={filteredResponses} 
                  categoryLabel={
                    activeTab === 'data_all' ? 'All Records' : 
                    activeTab === 'data_alcohol' ? 'Alcohol' : 
                    activeTab === 'data_valuable' ? 'Valuable' : 
                    activeTab === 'data_nonvaluable' ? 'Non-Valuable' : 'Registry'
                  } 
               />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ResponseDashboard;
