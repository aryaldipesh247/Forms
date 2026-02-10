
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-40 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3">
             <div className="w-8 h-8 border-2 border-[#008272] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase text-[#008272] tracking-widest">Uploading...</p>
          </motion.div>
        ) : preview ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
            <img src={preview} className="w-full rounded-xl shadow-lg border-2 border-white object-cover max-h-[300px]" alt="Preview" />
            <button onClick={() => { setPreview(null); onAnswer(null); }} className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg">✕</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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
          </div>
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

  const handleAnswer = useCallback((qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const currentQuestions = useMemo(() => {
    if (!form || !form.questions) return [];
    
    const visible: Question[] = [];
    const questions = form.questions;
    let curIdx = 0;

    // We use a safe iteration to handle branching or simple linear progression
    while (curIdx < questions.length) {
      const q = questions[curIdx];
      visible.push(q);
      
      const ans = answers[q.id];
      let nextId: string | 'next' | 'end' = 'next';

      if (q.enableBranching) {
        if (q.type === QuestionType.CHOICE && ans) {
          const selectedOpt = q.options?.find(o => o.text === ans);
          if (selectedOpt?.branching) {
            nextId = selectedOpt.branching.nextQuestionId;
          }
        } else if (q.branching) {
          nextId = q.branching.nextQuestionId;
        }
      }

      if (nextId === 'end') break;
      if (nextId === 'next' || !nextId) {
        curIdx++;
      } else {
        const targetIdx = questions.findIndex(fq => fq.id === nextId);
        // Safety: If target is not found or is behind current, just go to next to prevent infinite loops or skips
        if (targetIdx !== -1 && targetIdx > curIdx) {
          curIdx = targetIdx;
        } else {
          curIdx++;
        }
      }
    }
    return visible;
  }, [form, answers]);

  const handleSubmit = useCallback(async () => {
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
  }, [answers, onSubmit]);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1] p-6">
        <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-sm border">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
          <h2 className="text-3xl font-black mb-3">Loading Form...</h2>
          <p className="text-gray-400 text-xs mb-8">Fetching the latest version from the cloud.</p>
          <div className="w-8 h-8 border-4 border-[#008272] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const isPublished = form.isPublished ?? (form as any).published ?? false;

  if (isGuest && !isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
        <div className="max-w-md w-full bg-white p-12 rounded-2xl shadow-2xl text-center border-t-[14px] border-red-500">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">🚫</div>
          <h2 className="text-3xl font-black mb-4">Form Restricted</h2>
          <p className="text-gray-500 text-sm font-bold mb-2">This form is currently in "Draft" mode.</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-10 leading-relaxed">
            The owner must click "Publish" in the editor before respondents can access this content.
          </p>
          
          <div className="flex flex-col gap-3">
             <button onClick={() => window.location.reload()} className="w-full bg-[#008272] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Refresh Status</button>
             <button onClick={onBack} className="text-[9px] font-black uppercase tracking-widest text-[#008272] hover:underline">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
        <div className="max-w-md w-full bg-white p-12 rounded-2xl shadow-2xl text-center border-t-[14px]" style={{ borderTopColor: form.theme?.primaryColor || '#008272' }}>
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">✓</div>
          <h2 className="text-4xl font-black mb-2">Success!</h2>
          <p className="text-gray-500 font-bold mb-10">Thank you for your response.</p>
          <div className="bg-[#faf9f8] p-10 rounded-2xl border-2 border-dashed border-gray-200 mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Submission Serial</p>
            <p className="text-6xl font-black text-[#323130]">#{ticketNumber}</p>
          </div>
          {!isGuest && (
            <button onClick={onBack} className="w-full py-5 text-white font-black uppercase tracking-widest rounded-xl shadow-xl" style={{ backgroundColor: form.theme?.primaryColor || '#008272' }}>Exit Preview</button>
          )}
        </div>
      </div>
    );
  }

  const theme = form.theme || { primaryColor: '#008272', backgroundColor: '#f3f2f1' };

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden relative" style={{ backgroundColor: theme.backgroundColor, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      {theme.backgroundVideoUrl && <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover -z-10 opacity-30"><source src={theme.backgroundVideoUrl} type="video/mp4" /></video>}
      
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b p-4 shadow-sm flex justify-between items-center px-8 h-14 transition-all">
        {!isGuest ? (
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-[#008272] hover:opacity-70">← Back to Editor</button>
        ) : (
          <div className="flex items-center gap-2 font-black text-[#008272] text-[10px] tracking-widest uppercase">FORMS Pro | Respondent Interface</div>
        )}
        <div className="w-2 h-2 rounded-full bg-[#008272] animate-pulse"></div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-md rounded shadow-2xl border-t-[14px] p-12 relative overflow-hidden" style={{ borderTopColor: theme.primaryColor }}>
          {theme.logoUrl && (
            <div className={`mb-8 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
              <img src={theme.logoUrl} style={{ width: `${(theme.logoScale || 100) * 0.7}px` }} className="h-auto object-contain" alt="Logo" />
            </div>
          )}
          <h1 className="text-4xl font-black text-[#323130] mb-6 tracking-tighter leading-tight">{form.title}</h1>
          <div className="space-y-3">
            {(form.descriptions ?? []).map(d => (
              <p key={d.id} className={`text-gray-500 font-medium leading-relaxed ${d.formatting?.italic ? 'italic' : ''}`} style={{ textAlign: d.formatting?.textAlign || 'left', fontSize: d.formatting?.fontSize === 'large' ? '1.2rem' : '1rem' }}>{d.text}</p>
            ))}
          </div>
        </motion.div>

        {currentQuestions.map((q, idx) => (
          <motion.div key={q.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white/95 backdrop-blur-md p-10 rounded shadow-xl border-l-[8px] transition-all" style={{ borderLeftColor: theme.primaryColor }}>
            <h3 className="text-xl font-black mb-8 text-[#323130]">{idx + 1}. {q.title} {q.required && <span className="text-red-500 ml-1">*</span>}</h3>
            
            <div className="space-y-4">
              {q.type === QuestionType.IMAGE_UPLOAD && <ImageUploadQuestion q={q} value={answers[q.id]} onAnswer={val => handleAnswer(q.id, val)} />}
              
              {q.type === QuestionType.CHOICE && (
                <div className="space-y-3">
                  {q.options?.map(o => (
                    <label key={o.id} className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-[#008272] hover:bg-teal-50/20 cursor-pointer transition-all active:scale-[0.99] group">
                      <input 
                        type={q.multipleSelection ? 'checkbox' : 'radio'} 
                        name={q.id} 
                        className="w-6 h-6 cursor-pointer" 
                        style={{ accentColor: theme.primaryColor }} 
                        onChange={() => {
                          if (q.multipleSelection) {
                            const current = answers[q.id] || [];
                            if (current.includes(o.text)) {
                              handleAnswer(q.id, current.filter((v: string) => v !== o.text));
                            } else {
                              handleAnswer(q.id, [...current, o.text]);
                            }
                          } else {
                            handleAnswer(q.id, o.text);
                          }
                        }} 
                        checked={q.multipleSelection ? (answers[q.id] || []).includes(o.text) : answers[q.id] === o.text}
                      />
                      <span className="font-black text-sm text-[#323130] uppercase tracking-wider group-hover:text-[#008272]">{o.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === QuestionType.RANKING && (
                <div className="space-y-3">
                  {(answers[q.id] || []).length > 0 && (
                    <div className="mb-4 p-4 bg-[#faf9f8] rounded-xl border border-dashed border-[#008272]/30 flex flex-wrap gap-2 items-center">
                      {(answers[q.id] || []).map((rankItem: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-[#008272] text-white text-[10px] font-black rounded-full shadow-sm">
                          {i + 1}. {rankItem}
                        </span>
                      ))}
                      <button 
                        onClick={() => handleAnswer(q.id, [])} 
                        className="text-[10px] font-black text-red-500 ml-auto uppercase tracking-widest hover:underline"
                      >
                        Reset Order
                      </button>
                    </div>
                  )}
                  {q.options?.filter(o => !(answers[q.id] || []).includes(o.text)).map(o => (
                    <button
                      key={o.id}
                      onClick={() => {
                        const current = answers[q.id] || [];
                        handleAnswer(q.id, [...current, o.text]);
                      }}
                      className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-[#008272] hover:bg-teal-50/20 cursor-pointer transition-all active:scale-[0.99] group text-left"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-black text-gray-300 group-hover:border-[#008272] group-hover:text-[#008272]">
                        ?
                      </div>
                      <span className="font-black text-sm text-[#323130] uppercase tracking-wider group-hover:text-[#008272]">{o.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {q.type === QuestionType.DOUBLE_RANKING_BOX && (
                <div className="overflow-x-auto border-2 border-gray-50 rounded-xl">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-[10px] font-black uppercase text-gray-400 p-4">Item</th>
                        <th className="text-center text-[10px] font-black uppercase text-gray-400 p-4">{q.columnName || 'Detail'}</th>
                        <th className="text-center text-[10px] font-black uppercase text-gray-400 p-4">{q.columnNameSmall || 'Value'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {q.options?.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-black text-xs text-[#323130]">{o.text}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="..."
                              className="w-full p-3 bg-white border border-gray-100 rounded-lg text-sm font-medium focus:border-[#008272] outline-none transition-all shadow-sm"
                              onChange={e => {
                                const current = answers[q.id] || {};
                                const row = current[o.id] || {};
                                handleAnswer(q.id, { ...current, [o.id]: { ...row, [`${q.columnName || 'detail'}_big`]: e.target.value } });
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="0"
                              className="w-20 mx-auto p-3 bg-white border border-gray-100 rounded-lg text-sm text-center font-black focus:border-[#008272] outline-none shadow-sm"
                              onChange={e => {
                                const current = answers[q.id] || {};
                                const row = current[o.id] || {};
                                handleAnswer(q.id, { ...current, [o.id]: { ...row, [`${q.columnNameSmall || 'value'}_small`]: e.target.value } });
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
                <textarea 
                  className="w-full border-2 border-gray-100 p-5 rounded-xl bg-gray-50 focus:bg-white focus:border-[#008272] transition-all outline-none font-bold text-sm min-h-[140px]" 
                  placeholder="Enter your response here..." 
                  onChange={e => handleAnswer(q.id, e.target.value)} 
                />
              )}

              {q.type === QuestionType.DATE && (
                <input 
                  type="date" 
                  className="w-full border-2 border-gray-100 p-5 rounded-xl bg-gray-50 font-black outline-none focus:border-[#008272]" 
                  onChange={e => handleAnswer(q.id, e.target.value)} 
                />
              )}
            </div>
          </motion.div>
        ))}

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full py-6 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </div>
    </div>
  );
};

export default FormPreview;
