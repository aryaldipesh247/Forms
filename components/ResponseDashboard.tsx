import React, { useState } from 'react';
import { Form, QuestionType, Question } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResponseDashboardProps {
  form: Form;
  onBack: () => void;
  onUpdateForm: (form: Form) => void;
  onEditQuestion: (qId: string) => void;
  onArchiveResponses: () => void;
}

const COLORS = ['#008272', '#0078d4', '#107c10', '#a4262c', '#6264a7', '#d13438', '#5c2d91'];

const ResponseDashboard: React.FC<ResponseDashboardProps> = ({ form, onBack, onUpdateForm, onEditQuestion, onArchiveResponses }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'results'>('summary');

  const handleDeleteExcel = () => {
    if (form.responses.length === 0) {
      alert("There are no responses to delete.");
      return;
    }
    if (window.confirm("Warning: This will permanently move all response data to the Recycle Bin and clear the active sheet. This action cannot be undone. Proceed?")) {
      onArchiveResponses();
      alert("Responses archived successfully and cleared from active view.");
    }
  };

  const deleteQuestion = (id: string) => {
    if (window.confirm("Remove this question from form?")) {
      onUpdateForm({ ...form, questions: form.questions.filter(q => q.id !== id) });
    }
  };

  const downloadCSV = () => {
    if (form.responses.length === 0) return alert('No data to export.');
    
    // Build CSV Headers
    const headers = ['Timestamp', 'Serial Number'];
    form.questions.forEach(q => headers.push(q.title));

    // Build Rows
    const rows = form.responses.map(r => {
      const row = [new Date(r.timestamp).toLocaleString(), r.serialNumber];
      form.questions.forEach(q => {
        const ans = r.answers[q.id];
        if (ans === undefined || ans === null) {
          row.push('');
        } else if (typeof ans === 'object') {
          row.push(JSON.stringify(ans).replace(/"/g, '""'));
        } else {
          row.push(ans.toString().replace(/"/g, '""'));
        }
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
    form.responses.forEach(r => {
      const ans = r.answers[q.id];
      if (ans) {
        stats[ans] = (stats[ans] || 0) + 1;
      }
    });
    const data = Object.entries(stats).map(([name, value]) => ({ name, value }));
    return data.length > 0 ? data : null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f2f1]">
      <nav className="bg-white border-b sticky top-0 z-20 px-6 h-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded text-[#008272]">←</button>
          <h1 className="font-bold text-xs truncate max-w-[150px]">{form.title}</h1>
        </div>
        <div className="flex h-full">
          <button onClick={() => setViewMode('summary')} className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider border-b-4 ${viewMode === 'summary' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-[#605e5c]'}`}>Summary</button>
          <button onClick={() => setViewMode('results')} className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider border-b-4 ${viewMode === 'results' ? 'border-[#008272] text-[#008272]' : 'border-transparent text-[#605e5c]'}`}>Results</button>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleDeleteExcel} className="text-[#a4262c] px-3 py-1.5 hover:bg-red-50 rounded text-[10px] font-black uppercase tracking-widest border border-red-100 transition-all">Delete Excel</button>
           <button onClick={downloadCSV} className="bg-[#107c41] text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-[#0b5d31] transition-colors">Open in Excel</button>
        </div>
      </nav>

      <main className="flex-1 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded shadow-sm border-l-8 border-[#008272]">
                <p className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">Total Responses</p>
                <h2 className="text-5xl font-black">{form.responses.length}</h2>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border-l-8 border-[#0078d4]">
                <p className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-3 h-3 rounded-full ${form.responses.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                   <h2 className="text-xl font-black text-[#323130] uppercase tracking-widest">{form.responses.length > 0 ? 'Active' : 'Empty'}</h2>
                </div>
            </div>
          </div>

          <div className="space-y-4">
             {form.questions.map((q, idx) => {
               const stats = getQuestionStats(q);
               return (
                 <div key={q.id} className="bg-white p-8 rounded shadow-sm relative group border border-[#edebe9]">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => onEditQuestion(q.id)} className="text-[9px] font-black uppercase tracking-widest text-[#008272] hover:underline">Edit</button>
                      <button onClick={() => deleteQuestion(q.id)} className="text-[9px] font-black uppercase tracking-widest text-[#a4262c] hover:underline">Delete</button>
                    </div>
                    <div className="flex items-start gap-3 mb-6">
                      <span className="text-sm font-black text-[#008272] bg-gray-50 w-6 h-6 flex items-center justify-center rounded">{idx + 1}</span>
                      <h3 className="text-sm font-black text-[#323130]">{q.title}</h3>
                    </div>
                    
                    <div className="h-px bg-[#f3f2f1] mb-6" />
                    
                    {viewMode === 'summary' ? (
                      stats ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={stats} cx="50%" cy="50%" 
                                innerRadius={60} outerRadius={80} 
                                paddingAngle={5} dataKey="value"
                              >
                                {stats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="space-y-2">
                           {form.responses.length === 0 ? (
                             <p className="text-xs text-[#a19f9d] italic">No responses recorded yet.</p>
                           ) : (
                             <div className="grid grid-cols-1 gap-2">
                               {form.responses.slice(0, 5).map((r, i) => (
                                 <div key={r.id} className="text-xs p-3 bg-gray-50 rounded flex justify-between">
                                    <span className="font-medium text-[#605e5c] truncate pr-4">
                                      {typeof r.answers[q.id] === 'object' ? 'Detail entry' : (r.answers[q.id] || 'No response')}
                                    </span>
                                    <span className="text-[10px] text-[#a19f9d] shrink-0">#{r.serialNumber}</span>
                                 </div>
                               ))}
                               {form.responses.length > 5 && <p className="text-[10px] text-center text-[#a19f9d] mt-2">+ {form.responses.length - 5} more</p>}
                             </div>
                           )}
                        </div>
                      )
                    ) : (
                       <div className="space-y-3">
                          <div className="max-h-80 overflow-y-auto space-y-2 bg-[#faf9f8] p-4 rounded-sm border border-[#edebe9]">
                             {form.responses.length === 0 ? (
                               <p className="text-xs text-center text-[#a19f9d]">No data available</p>
                             ) : (
                               form.responses.map((r, i) => (
                                 <div key={r.id} className="text-xs p-3 bg-white rounded border border-[#edebe9] flex gap-4">
                                   <span className="font-black text-[#008272] min-w-[30px]">#{r.serialNumber}</span>
                                   <div className="flex-1">
                                      {typeof r.answers[q.id] === 'object' ? (
                                        <div className="space-y-1">
                                          {Object.entries(r.answers[q.id]).map(([key, val]: [string, any]) => (
                                            <div key={key} className="flex justify-between border-b border-gray-50 pb-1">
                                              <span className="text-[9px] uppercase font-bold text-gray-400">{key.replace('_big', ' detail').replace('_small', ' value')}</span>
                                              <span className="font-medium">{val}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="font-medium text-[#323130]">{r.answers[q.id] || <em className="text-gray-300">No answer</em>}</span>
                                      )}
                                   </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </div>
                    )}
                 </div>
               );
             })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResponseDashboard;