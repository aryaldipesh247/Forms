
import React, { useState, useMemo, useCallback } from 'react';
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
        alert('Failed to upload image.');
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
      if (q.type === QuestionType.CHOICE && !q.multipleSelection && answer) {
        const selectedOpt = q.options?.find(o => o.text === answer);
        if (selectedOpt?.branching?.nextQuestionId) nextId = selectedOpt.branching.nextQuestionId;
        else if (q.enableBranching && q.branching?.nextQuestionId) nextId = q.branching.nextQuestionId;
      } else if (q.enableBranching && q.branching?.nextQuestionId) {
        nextId = q.branching.nextQuestionId;
      }
      if (nextId === 'next') {
        const currentIndex = questions.findIndex(x => x.id === q.id);
        const nextPhysical = questions[currentIndex + 1];
        currentId = nextPhysical ? nextPhysical.id : 'end';
      } else currentId = nextId;
      if (q.required && (!answer || (Array.isArray(answer) && answer.length === 0))) break;
    }
    return path;
  }, [form, answers]);

  const handleAnswer = useCallback((qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form) return;
    for (const q of visibleQuestions) {
      if (q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, onSubmit, form, visibleQuestions]);

  if (!form) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
        <div className="max-w-md w-full bg-white p-12 rounded shadow-2xl text-center border-l-[14px]" style={{ borderLeftColor: form.theme?.primaryColor || '#008272' }}>
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
          {/* ENLARGED HEADER BLOCK */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-md rounded shadow-xl border-l-[16px] p-12 md:p-16 relative overflow-hidden" style={{ borderLeftColor: theme.primaryColor }}>
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {theme.headerBackgroundVideoUrl && (
                <video key={theme.headerBackgroundVideoUrl} src={theme.headerBackgroundVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-10" />
              )}
              {theme.headerBackgroundImage && (
                <img src={theme.headerBackgroundImage} className="w-full h-full object-cover opacity-10" />
              )}
            </div>
            
            <div className="relative z-10">
              {theme.logoUrl && (
                <div className={`mb-12 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
                  <img src={theme.logoUrl} style={{ width: `${(theme.logoScale || 100) * 0.7}px` }} className="h-auto object-contain" alt="Logo" />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-black text-[#323130] mb-10 tracking-tighter leading-tight" style={{ 
                fontSize: `${form.titleFormatting?.fontSize || 40}px`,
                textAlign: form.titleFormatting?.textAlign || 'left',
                fontWeight: form.titleFormatting?.bold ? '900' : '700',
                fontStyle: form.titleFormatting?.italic ? 'italic' : 'normal'
              }}>{form.title}</h1>
              <div className="space-y-6">
                {(form.descriptions ?? []).map(d => (
                  <p key={d.id} className={`text-gray-500 font-medium leading-relaxed ${d.formatting?.italic ? 'italic' : ''}`} style={{ 
                    textAlign: d.formatting?.textAlign || 'left', 
                    fontSize: `${d.formatting?.fontSize || 16}px`,
                    fontWeight: d.formatting?.bold ? 'bold' : 'normal'
                  }}>{d.text}</p>
                ))}
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {visibleQuestions.map((q, idx) => (
              <motion.div 
                key={q.id} id={`q-${q.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 backdrop-blur-md p-10 md:p-14 rounded shadow-lg border-l-[12px]" 
                style={{ borderLeftColor: theme.primaryColor }}
              >
                <div className="mb-8">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-3 block">Question {idx + 1}</span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#323130] leading-tight" style={{
                    fontSize: `${q.titleFormatting?.fontSize || 24}px`,
                    textAlign: q.titleFormatting?.textAlign || 'left',
                    fontStyle: q.titleFormatting?.italic ? 'italic' : 'normal',
                    fontWeight: q.titleFormatting?.bold ? '900' : '700'
                  }}>
                    {q.title} {q.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {q.subtitle && <p className="text-gray-400 italic text-sm mt-3">{q.subtitle}</p>}
                </div>
                
                <div className="space-y-6">
                  {q.type === QuestionType.IMAGE_UPLOAD && <ImageUploadQuestion q={q} value={answers?.[q.id]} onAnswer={val => handleAnswer(q.id, val)} />}
                  
                  {q.type === QuestionType.CHOICE && (
                    <div className="space-y-3">
                      {q.options?.map(o => {
                        const isChecked = q.multipleSelection ? (Array.isArray(answers?.[q.id]) ? answers[q.id].includes(o.text) : false) : (answers?.[q.id] === o.text);
                        return (
                          <label key={o.id} className={`flex items-center gap-4 p-5 border-2 rounded cursor-pointer transition-all active:scale-[0.99] group ${isChecked ? 'border-[#008272] bg-teal-50/20' : 'border-gray-100 hover:border-gray-300'}`}>
                            <input type={q.multipleSelection ? 'checkbox' : 'radio'} className="w-5 h-5" style={{ accentColor: theme.primaryColor }} onChange={() => {
                              if (q.multipleSelection) {
                                const current = Array.isArray(answers?.[q.id]) ? answers[q.id] : [];
                                handleAnswer(q.id, current.includes(o.text) ? current.filter((v: string) => v !== o.text) : [...current, o.text]);
                              } else handleAnswer(q.id, o.text);
                            }} checked={isChecked} />
                            <span className={`font-black text-sm uppercase tracking-wider ${isChecked ? 'text-[#008272]' : 'text-[#323130]'}`}>{o.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === QuestionType.RANKING && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Tap items in order of preference</p>
                      {q.options?.map(o => {
                        const currentRanking = Array.isArray(answers?.[q.id]) ? answers[q.id] : [];
                        const rank = currentRanking.indexOf(o.text) + 1;
                        const isRanked = rank > 0;
                        
                        return (
                          <div 
                            key={o.id} 
                            onClick={() => {
                              const newRanking = isRanked 
                                ? currentRanking.filter((item: string) => item !== o.text)
                                : [...currentRanking, o.text];
                              handleAnswer(q.id, newRanking);
                            }}
                            className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all active:scale-[0.99] group ${isRanked ? 'border-[#008272] bg-teal-50/20' : 'border-gray-100 hover:border-gray-300'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all ${isRanked ? 'bg-[#008272] text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'}`}>
                              {isRanked ? rank : ''}
                            </div>
                            <span className={`font-black text-sm uppercase tracking-wider ${isRanked ? 'text-[#008272]' : 'text-[#323130]'}`}>{o.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === QuestionType.DOUBLE_RANKING_BOX && (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Item</th>
                            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{q.columnName || 'Detail'}</th>
                            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{q.columnNameSmall || 'Value'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.options?.map(opt => (
                            <tr key={opt.id} className="group">
                              <td className="px-4 py-3 bg-white rounded-l-xl border-y border-l border-gray-100 align-middle">
                                <span className="font-black text-xs uppercase tracking-wider text-[#323130]">{opt.text}</span>
                              </td>
                              <td className="px-4 py-3 bg-white border-y border-gray-100 align-middle">
                                <input 
                                  type="text" 
                                  className="w-full p-3 bg-white border border-gray-200 rounded font-bold text-sm text-[#323130] placeholder:text-gray-300 focus:border-[#008272] focus:ring-1 focus:ring-[#008272] outline-none transition-all shadow-sm" 
                                  placeholder="Enter response..."
                                  value={answers?.[q.id]?.[opt.id]?.big || ''}
                                  onChange={e => {
                                    const current = answers?.[q.id] || {};
                                    handleAnswer(q.id, { ...current, [opt.id]: { ...(current[opt.id] || {}), big: e.target.value } });
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 bg-white border-y border-r rounded-r-xl border-gray-100 align-middle w-24">
                                <input 
                                  type="text" 
                                  className="w-full p-3 bg-white border border-gray-200 rounded font-black text-center text-sm text-[#323130] placeholder:text-gray-300 focus:border-[#008272] focus:ring-1 focus:ring-[#008272] outline-none transition-all shadow-sm" 
                                  placeholder="Value"
                                  value={answers?.[q.id]?.[opt.id]?.small || ''}
                                  onChange={e => {
                                    const current = answers?.[q.id] || {};
                                    handleAnswer(q.id, { ...current, [opt.id]: { ...(current[opt.id] || {}), small: e.target.value } });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {q.type === QuestionType.TEXT && (
                    <textarea className="w-full border-2 border-gray-100 p-5 rounded bg-gray-50 focus:bg-white focus:border-[#008272] transition-all outline-none font-bold text-base min-h-[120px] text-[#323130]" placeholder="Type your response..." value={answers?.[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)} />
                  )}

                  {q.type === QuestionType.DATE && (
                    <input type="date" className="w-full border-2 border-gray-100 p-5 rounded bg-gray-50 font-black outline-none focus:border-[#008272] text-lg text-[#323130]" value={answers?.[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)} />
                  )}
                  
                  {q.type === QuestionType.SECTION && (
                    <div className="border-y-2 border-dashed border-[#008272]/20 py-8 my-4 text-center">
                       <p className="text-[10px] font-black uppercase text-[#008272] tracking-[0.4em]">Next Section</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex justify-center pt-8 mb-20">
             <button onClick={handleSubmit} disabled={isSubmitting} className="px-16 py-5 text-white font-black uppercase tracking-[0.3em] rounded shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-base" style={{ backgroundColor: theme.primaryColor }}>
               {isSubmitting ? 'Submitting...' : 'Submit Response'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
