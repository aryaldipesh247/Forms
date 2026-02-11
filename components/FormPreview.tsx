
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Form, QuestionType, Question } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

const ImageUploadQuestion = ({ q, value, onAnswer }: { q: Question, value: any, onAnswer: (v: any) => void }) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImageToCloudinary(file);
        setPreview(url);
        onAnswer(url);
      } catch (error) {
        console.error('Respondent upload failed:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  }, [onAnswer]);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-40 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3">
             <div className="w-8 h-8 border-2 border-[#008272] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase text-[#008272] tracking-widest">Uploading...</p>
          </motion.div>
        ) : preview ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative group">
            <img src={preview} className="w-full rounded-xl shadow-lg border-2 border-white object-cover max-h-[300px]" alt="Preview" />
            <button onClick={() => { setPreview(null); onAnswer(null); }} className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg">✕</button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
            <label className="h-36 border-2 border-dashed border-[#edebe9] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#faf9f8] hover:border-[#008272] cursor-pointer transition-all active:scale-95">
              <span className="text-4xl">📸</span>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Take Photo</p>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </label>
            <label className="h-36 border-2 border-dashed border-[#edebe9] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#faf9f8] hover:border-[#008272] cursor-pointer transition-all active:scale-95">
              <span className="text-4xl">📁</span>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Choose File</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FormPreviewProps {
  form: Form | null;
  isGuest?: boolean;
  onBack: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<number>;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, isGuest, onBack, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * DYNAMIC BRANCHING LOGIC
   * Calculates the ordered path of visible questions based on answers and rules.
   */
  const visibleQuestions = useMemo(() => {
    if (!form || !form.questions.length) return [];
    
    const questions = form.questions;
    const path: Question[] = [];
    const visited = new Set<string>();
    
    let currentId: string | 'end' | 'next' = questions[0].id;

    while (currentId && currentId !== 'end') {
      const q = questions.find(x => x.id === currentId);
      if (!q || visited.has(q.id)) break;
      
      path.push(q);
      visited.add(q.id);

      const answer = answers[q.id];
      let nextId: string | 'next' | 'end' = 'next';

      // 1. Check Option-level Branching (Only if single selection choice)
      if (q.type === QuestionType.CHOICE && !q.multipleSelection && answer) {
        const selectedOpt = q.options?.find(o => o.text === answer);
        if (selectedOpt?.branching?.nextQuestionId) {
          nextId = selectedOpt.branching.nextQuestionId;
        }
      }

      // 2. Check Question-level Branching if no specific option branch
      if (nextId === 'next' && q.enableBranching && q.branching?.nextQuestionId) {
        nextId = q.branching.nextQuestionId;
      }

      // Resolve 'next' to the physical next question in the array
      if (nextId === 'next') {
        const currentIndex = questions.findIndex(x => x.id === q.id);
        const nextPhysical = questions[currentIndex + 1];
        currentId = nextPhysical ? nextPhysical.id : 'end';
      } else {
        currentId = nextId;
      }

      // Stop revealing questions if a required question isn't answered yet
      // This creates a "progressive reveal" effect common in professional forms
      if (q.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
        break;
      }
    }

    return path;
  }, [form, answers]);

  const handleAnswer = useCallback((qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form) return;
    
    // Validation ONLY for questions on the current visible path
    for (const q of visibleQuestions) {
      if (q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
        const el = document.getElementById(`q-${q.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert(`Required: ${q.title}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const s = await onSubmit(answers);
      setTicketNumber(s);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, onSubmit, form, visibleQuestions]);

  if (!form) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
        <div className="max-w-md w-full bg-white p-12 rounded shadow-2xl text-center border-t-[14px]" style={{ borderTopColor: form.theme?.primaryColor || '#008272' }}>
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">✓</div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Success!</h2>
          <p className="text-gray-500 font-bold mb-10">Your response has been recorded.</p>
          <div className="bg-[#faf9f8] p-10 rounded border-2 border-dashed border-gray-200 mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Submission ID</p>
            <p className="text-6xl font-black text-[#323130]">#{ticketNumber}</p>
          </div>
          {!isGuest && (
            <button onClick={onBack} className="w-full py-5 text-white font-black uppercase tracking-widest rounded shadow-xl" style={{ backgroundColor: form.theme?.primaryColor || '#008272' }}>Exit Preview</button>
          )}
        </div>
      </div>
    );
  }

  const theme = form.theme || { primaryColor: '#008272', backgroundColor: '#f3f2f1' };

  return (
    <div className="min-h-screen flex flex-col antialiased relative" style={{ backgroundColor: theme.backgroundColor, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b p-4 shadow-sm flex justify-between items-center px-8 h-14">
        {!isGuest ? (
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-[#008272] hover:opacity-70">← Back to Editor</button>
        ) : (
          <div className="flex items-center gap-2 font-black text-[#008272] text-[10px] tracking-widest uppercase">FORMS PRO | Secured Response</div>
        )}
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
           Status: <span className="text-green-600 animate-pulse">Live Sync Active</span>
        </div>
      </nav>

      <div className="flex-grow flex flex-col items-center py-10 px-4">
        <div className="max-w-3xl w-full space-y-6">
          {/* Main Title Block */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-md rounded shadow-xl border-t-[14px] p-10 md:p-14 text-center" style={{ borderTopColor: theme.primaryColor }}>
            {theme.logoUrl && (
              <div className={`mb-10 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
                <img src={theme.logoUrl} style={{ width: `${(theme.logoScale || 100) * 0.7}px` }} className="h-auto object-contain" alt="Logo" />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-[#323130] mb-8 tracking-tighter leading-tight">{form.title}</h1>
            <div className="space-y-4">
              {(form.descriptions ?? []).map(d => (
                <p key={d.id} className={`text-gray-500 font-medium leading-relaxed ${d.formatting?.italic ? 'italic' : ''}`} style={{ textAlign: d.formatting?.textAlign || 'center', fontSize: d.formatting?.fontSize === 'large' ? '1.2rem' : '1rem' }}>{d.text}</p>
              ))}
            </div>
          </motion.div>

          {/* Dynamic Questions rendering based on branching path */}
          <AnimatePresence mode="popLayout">
            {visibleQuestions.map((q, idx) => (
              <motion.div 
                key={q.id} 
                id={`q-${q.id}`} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 backdrop-blur-md p-10 md:p-14 rounded shadow-lg border-l-[12px]" 
                style={{ borderLeftColor: theme.primaryColor }}
              >
                <div className="mb-8">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Question {idx + 1}</span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#323130] leading-tight">
                    {q.title} {q.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {q.subtitle && <p className="text-gray-400 italic text-sm mt-3">{q.subtitle}</p>}
                </div>
                
                <div className="space-y-6">
                  {q.type === QuestionType.IMAGE_UPLOAD && <ImageUploadQuestion q={q} value={answers?.[q.id]} onAnswer={val => handleAnswer(q.id, val)} />}
                  
                  {q.type === QuestionType.SECTION && (
                    <div className="p-8 bg-gray-50 rounded border-2 border-dashed border-gray-100 text-center">
                       <p className="text-gray-500 font-black uppercase tracking-widest text-[#008272]">--- {q.title} ---</p>
                    </div>
                  )}

                  {q.type === QuestionType.CHOICE && (
                    <div className="space-y-3">
                      {q.options?.map(o => {
                        const isChecked = q.multipleSelection 
                          ? (Array.isArray(answers?.[q.id]) ? answers[q.id].includes(o.text) : false) 
                          : (answers?.[q.id] === o.text);
                        
                        return (
                          <label key={o.id} className={`flex items-center gap-4 p-5 border-2 rounded cursor-pointer transition-all active:scale-[0.99] group ${isChecked ? 'border-[#008272] bg-teal-50/20' : 'border-gray-100 hover:border-gray-300'}`}>
                            <input 
                              type={q.multipleSelection ? 'checkbox' : 'radio'} 
                              name={q.id} 
                              className="w-5 h-5 cursor-pointer" 
                              style={{ accentColor: theme.primaryColor }} 
                              onChange={() => {
                                if (q.multipleSelection) {
                                  const current = Array.isArray(answers?.[q.id]) ? answers[q.id] : [];
                                  if (current.includes(o.text)) {
                                    handleAnswer(q.id, current.filter((v: string) => v !== o.text));
                                  } else {
                                    handleAnswer(q.id, [...current, o.text]);
                                  }
                                } else {
                                  handleAnswer(q.id, o.text);
                                }
                              }} 
                              checked={isChecked}
                            />
                            <span className={`font-black text-sm uppercase tracking-wider group-hover:text-[#008272] ${isChecked ? 'text-[#008272]' : 'text-[#323130]'}`}>{o.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === QuestionType.RANKING && (
                    <div className="space-y-3">
                      {(answers?.[q.id] || []).length > 0 && (
                        <div className="mb-4 p-4 bg-teal-50/50 rounded border border-dashed border-[#008272]/30 flex flex-wrap gap-2 items-center">
                          {(answers[q.id] || []).map((rankItem: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-[#008272] text-white text-[10px] font-black rounded-full shadow-md">
                              {i + 1}. {rankItem}
                            </span>
                          ))}
                          <button onClick={() => handleAnswer(q.id, [])} className="text-[9px] font-black text-red-500 ml-auto uppercase tracking-widest hover:underline">Clear</button>
                        </div>
                      )}
                      {q.options?.filter(o => !(Array.isArray(answers?.[q.id]) ? answers[q.id] : []).includes(o.text)).map(o => (
                        <button key={o.id} onClick={() => {
                          const current = Array.isArray(answers?.[q.id]) ? answers[q.id] : [];
                          handleAnswer(q.id, [...current, o.text]);
                        }} className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded hover:border-[#008272] hover:bg-teal-50/20 cursor-pointer transition-all text-left group">
                          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-black text-gray-300 group-hover:border-[#008272] group-hover:text-[#008272]">?</div>
                          <span className="font-black text-sm text-[#323130] uppercase tracking-wider">{o.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === QuestionType.TEXT && (
                    <textarea 
                      className="w-full border-2 border-gray-100 p-5 rounded bg-gray-50 focus:bg-white focus:border-[#008272] transition-all outline-none font-bold text-base min-h-[120px]" 
                      placeholder="Type your response..." 
                      value={answers?.[q.id] || ''}
                      onChange={e => handleAnswer(q.id, e.target.value)} 
                    />
                  )}

                  {q.type === QuestionType.DATE && (
                    <input 
                      type="date" 
                      className="w-full border-2 border-gray-100 p-5 rounded bg-gray-50 font-black outline-none focus:border-[#008272] text-lg" 
                      value={answers?.[q.id] || ''}
                      onChange={e => handleAnswer(q.id, e.target.value)} 
                    />
                  )}

                  {q.type === QuestionType.DOUBLE_RANKING_BOX && (
                    <div className="overflow-x-auto border rounded bg-white shadow-inner">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-[10px] font-black uppercase text-gray-400 p-4 border-b">Item</th>
                            <th className="text-center text-[10px] font-black uppercase text-gray-400 p-4 border-b">{q.columnName || 'Details'}</th>
                            <th className="text-center text-[10px] font-black uppercase text-gray-400 p-4 border-b">{q.columnNameSmall || 'Qty'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {q.options?.map(o => {
                            const currentAnswers = answers?.[q.id] || {};
                            const rowValue = currentAnswers[o.id] || {};
                            return (
                              <tr key={o.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-black text-sm text-[#323130]">{o.text}</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    placeholder="..."
                                    value={rowValue[`${q.columnName || 'detail'}_big`] || ''}
                                    className="w-full p-3 bg-white border rounded text-xs font-medium focus:border-[#008272] outline-none"
                                    onChange={e => {
                                      handleAnswer(q.id, { ...currentAnswers, [o.id]: { ...rowValue, [`${q.columnName || 'detail'}_big`]: e.target.value } });
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    placeholder="0"
                                    value={rowValue[`${q.columnNameSmall || 'value'}_small`] || ''}
                                    className="w-16 mx-auto p-3 bg-white border rounded text-xs text-center font-black focus:border-[#008272] outline-none"
                                    onChange={e => {
                                      handleAnswer(q.id, { ...currentAnswers, [o.id]: { ...rowValue, [`${q.columnNameSmall || 'value'}_small`]: e.target.value } });
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Submit button logic based on path completion */}
          <div className="flex justify-center pt-8 mb-20">
             <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-16 py-5 text-white font-black uppercase tracking-[0.3em] rounded shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-base"
              style={{ backgroundColor: theme.primaryColor }}
             >
               {isSubmitting ? 'Submitting...' : 'Submit Response'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
