
import React, { useState } from 'react';
import { Form, QuestionType, Question } from '../types';
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

type DashboardTab = 'analytics' | 'data';

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({ form, onBack, onUpdateForm, onEditQuestion, onArchiveResponses }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const responses = form.responses ?? [];
  const questions = form.questions ?? [];

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

  const downloadCSV = () => {
    if (responses.length === 0) return alert('No data to export.');
    const headers = ['Timestamp', 'Serial Number', ...questions.map(q => q.title)];
    const rows = responses.map(r => {
      const row = [new Date(r.timestamp).toLocaleString(), r.serialNumber];
      questions.forEach(q => {
        const ans = r.answers?.[q.id];
        row.push(typeof ans === 'object' ? JSON.stringify(ans).replace(/"/g, '""') : (ans || '').toString().replace(/"/g, '""'));
      });
      return `"${row.join('","')}"`;
    });
    const csvContent = `"${headers.join('","')}"\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form.title.replace(/\s+/g, '_')}_Responses.csv`;
    link.click();
  };

  const getQuestionStats = (q: Question) => {
    if (q.type !== QuestionType.CHOICE) return null;
    const stats: Record<string, number> = {};
    responses.forEach(r => {
      const ans = r.answers?.[q.id];
      if (ans && typeof ans === 'string') stats[ans] = (stats[ans] || 0) + 1;
    });
    if (Object.keys(stats).length === 0) return null;
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f2f1] antialiased">
      {/* Primary Navigation */}
      <nav className="bg-white border-b sticky top-0 z-[60] px-6 h-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded text-[#008272]">←</button>
          <h1 className="font-bold text-xs uppercase tracking-[0.2em] text-[#008272]">{form.title} | Response Center</h1>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={downloadCSV} className="bg-[#107c41] text-white px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#0b5d31] transition-all">Export Excel</button>
           <button onClick={onArchiveResponses} className="text-[#a4262c] text-[10px] font-black uppercase tracking-widest hover:underline">Clear Data</button>
        </div>
      </nav>

      {/* Tab Switcher */}
      <div className="bg-white border-b px-6 sticky top-12 z-[55] shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-8">
          {[
            { id: 'analytics', label: 'Analytics & Charts', icon: '📈' },
            { id: 'data', label: 'Master Data Sheet', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`py-3 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${activeTab === tab.id ? 'text-[#008272]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#008272]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pb-20"
            >
              {/* KPI Section */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#008272]">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Submissions</p>
                   <h2 className="text-5xl font-black text-[#323130]">{responses.length}</h2>
                </div>
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-[#0078d4]">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                   <h2 className="text-xl font-black text-[#0078d4] uppercase mt-2">
                     {form.isPublished ? 'Live & Syncing' : 'Offline / Closed'}
                   </h2>
                   <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Real-time Cloud Node Active</p>
                </div>
                <div className="bg-white p-8 rounded shadow-sm border-t-4 border-indigo-600">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Analyst</p>
                   <button onClick={handleGenerateInsights} disabled={isAnalyzing} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-md hover:brightness-110 disabled:opacity-50">
                      {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
                   </button>
                </div>
              </section>

              {/* AI Insights Section */}
              {insights && (
                <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-10 rounded-xl relative shadow-inner">
                   <button onClick={() => setInsights(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 text-xl font-bold">&times;</button>
                   <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">✨ Gemini AI Summary</h3>
                   <div className="prose prose-indigo max-w-none text-indigo-800 leading-relaxed font-medium whitespace-pre-wrap text-sm">{insights}</div>
                </motion.section>
              )}

              {/* Visual Charts Section - All on one page below KPIs */}
              <div className="pt-4 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Visual Summary ({questions.length} Items)</h3>
                </div>
                
                {responses.length === 0 ? (
                  <div className="bg-white p-20 text-center rounded border border-dashed border-gray-200">
                    <span className="text-4xl mb-4 block">⏳</span>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Waiting for responses to generate charts...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {questions.map((q, idx) => {
                      const stats = getQuestionStats(q);
                      return (
                        <div key={q.id} className="bg-white p-8 rounded shadow-sm border border-gray-100 h-[450px] flex flex-col group hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <span className="text-[9px] font-black text-[#008272] uppercase tracking-widest block mb-1">Question {idx + 1}</span>
                              <h4 className="text-sm font-bold text-[#323130] line-clamp-2">{q.title}</h4>
                            </div>
                          </div>
                          <div className="flex-1 relative">
                             {stats && stats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={stats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                  </PieChart>
                                </ResponsiveContainer>
                             ) : (
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                    {q.type === QuestionType.SECTION ? 'Section Header' : (responses.length > 0 ? 'Response Feed' : 'No Data')}
                                  </p>
                                  <div className="w-full space-y-2 overflow-y-auto max-h-[220px]">
                                     {responses.length > 0 ? (
                                       responses.slice(-5).map(r => {
                                         const ans = r.answers?.[q.id];
                                         return (
                                           <div key={r.id} className="bg-white p-3 rounded border text-[11px] text-[#323130] text-left shadow-sm">
                                             {typeof ans === 'object' ? JSON.stringify(ans) : (ans || <em className="text-gray-300">No Answer</em>)}
                                           </div>
                                         );
                                       })
                                     ) : (
                                       <div className="text-[9px] font-bold text-gray-300 uppercase italic text-center py-10">Waiting for submissions...</div>
                                     )}
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-[#323130] uppercase tracking-widest">Master Data Sheet</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Full response history audit log</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50 border-b">
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r">Serial</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r">Timestamp</th>
                         {questions.map(q => (
                           <th key={q.id} className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 min-w-[200px] border-r">{q.title}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {responses.slice().reverse().map(r => (
                        <tr key={r.id} className="hover:bg-teal-50/20 transition-colors">
                           <td className="p-4 text-[11px] font-black text-[#008272] border-r">#{r.serialNumber}</td>
                           <td className="p-4 text-[10px] font-medium text-gray-400 whitespace-nowrap border-r">{new Date(r.timestamp).toLocaleString()}</td>
                           {questions.map(q => {
                              const ans = r.answers?.[q.id];
                              return (
                                <td key={q.id} className="p-4 text-[11px] text-[#323130] border-r max-w-xs truncate">
                                   {typeof ans === 'object' ? JSON.stringify(ans) : (ans || '-')}
                                </td>
                              );
                           })}
                        </tr>
                      ))}
                      {responses.length === 0 && (
                        <tr>
                          <td colSpan={questions.length + 2} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-[11px]">No records found in database.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ResponseDashboard;
