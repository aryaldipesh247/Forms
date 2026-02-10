
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
  const [currentStep, setCurrentStep] = useState(0); // 0 is Welcome/Title, >0 are questions
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-calculate the linear path based on current answers and branching
  const questionPath = useMemo(() => {
    if (!form || !form.questions) return [];
    const path: Question[] = [];
    const questions = form.questions;
    let curIdx = 0;

    while (curIdx < questions.length && curIdx !== -1) {
      const q = questions[curIdx];
      path.push(q);
      
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
        curIdx = questions.findIndex(fq => fq.id === nextId);
      }
    }
    return path;
  }, [form, answers]);

  const handleAnswer = useCallback((qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const nextStep = () => {
    if (currentStep < questionPath.length) {
      // Validate required
      if (currentStep > 0) {
        const currentQ = questionPath[currentStep - 1];
        if (currentQ.required && !answers[currentQ.id]) {
          alert('This field is required.');
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = useCallback(async () => {
    // Final validation
    const lastQ = questionPath[questionPath.length - 1];
    if (lastQ?.required && !answers[lastQ.id]) {
        alert('Please answer the final required question.');
        return;
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
  }, [answers, onSubmit, questionPath]);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1] p-6">
        <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-sm border">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
          <h2 className="text-3xl font-black mb-3">Loading Form...</h2>
          <p className="text-gray-400 text-xs mb-8 tracking-widest uppercase font-black">Connecting to global DB</p>
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
  const currentQ = currentStep > 0 ? questionPath[currentStep - 1] : null;
  const progress = (currentStep / questionPath.length) * 100;

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-[#008272]/20 relative" style={{ backgroundColor: theme.backgroundColor, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      {theme.backgroundVideoUrl && <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover -z-10 opacity-30"><source src={theme.backgroundVideoUrl} type="video/mp4" /></video>}
      
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-gray-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full" style={{ backgroundColor: theme.primaryColor }} />
      </div>

      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b p-4 shadow-sm flex justify-between items-center px-8 h-14 transition-all">
        {!isGuest ? (
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-[#008272] hover:opacity-70">← Back to Editor</button>
        ) : (
          <div className="flex items-center gap-2 font-black text-[#008272] text-[10px] tracking-widest uppercase">FORMS Pro | Secure Response</div>
        )}
        <div className="flex items-center gap-4">
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Page {currentStep} of {questionPath.length}</span>
           <div className="w-2 h-2 rounded-full bg-[#008272] animate-pulse"></div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            {currentStep === 0 ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-white/95 backdrop-blur-md rounded shadow-2xl border-t-[14px] p-12 relative overflow-hidden text-center"
                style={{ borderTopColor: theme.primaryColor }}
              >
                {theme.logoUrl && (
                  <div className={`mb-10 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
                    <img src={theme.logoUrl} style={{ width: `${(theme.logoScale || 100) * 0.7}px` }} className="h-auto object-contain" alt="Logo" />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-black text-[#323130] mb-8 tracking-tighter leading-tight">{form.title}</h1>
                <div className="space-y-4 mb-12">
                  {(form.descriptions ?? []).map(d => (
                    <p key={d.id} className={`text-gray-500 font-medium leading-relaxed ${d.formatting?.italic ? 'italic' : ''}`} style={{ textAlign: d.formatting?.textAlign || 'center', fontSize: d.formatting?.fontSize === 'large' ? '1.2rem' : '1rem' }}>{d.text}</p>
                  ))}
                </div>
                <button 
                  onClick={nextStep}
                  className="px-12 py-5 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all text-sm"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Start Form
                </button>
              </motion.div>
            ) : currentQ ? (
              <motion.div 
                key={currentQ.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white/95 backdrop-blur-md p-10 md:p-14 rounded shadow-2xl border-l-[12px] transition-all"
                style={{ borderLeftColor: theme.primaryColor }}
              >
                <div className="mb-10">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-4 block">Question {currentStep} of {questionPath.length}</span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#323130] leading-tight">
                    {currentQ.title} {currentQ.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {currentQ.subtitle && <p className="text-gray-400 italic text-sm mt-3">{currentQ.subtitle}</p>}
                </div>
                
                <div className="space-y-6 mb-12 min-h-[150px]">
                  {currentQ.type === QuestionType.IMAGE_UPLOAD && <ImageUploadQuestion q={currentQ} value={answers[currentQ.id]} onAnswer={val => handleAnswer(currentQ.id, val)} />}
                  
                  {currentQ.type === QuestionType.SECTION && (
                    <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                       <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Section Break</p>
                       <p className="text-[10px] text-gray-400 mt-1">Please proceed to next set of questions</p>
                    </div>
                  )}

                  {currentQ.type === QuestionType.CHOICE && (
                    <div className="space-y-4">
                      {currentQ.options?.map(o => (
                        <label key={o.id} className="flex items-center gap-4 p-6 border-2 border-gray-100 rounded-2xl hover:border-[#008272] hover:bg-teal-50/20 cursor-pointer transition-all active:scale-[0.99] group">
                          <input 
                            type={currentQ.multipleSelection ? 'checkbox' : 'radio'} 
                            name={currentQ.id} 
                            className="w-6 h-6 cursor-pointer" 
                            style={{ accentColor: theme.primaryColor }} 
                            onChange={() => {
                              if (currentQ.multipleSelection) {
                                const current = answers[currentQ.id] || [];
                                if (current.includes(o.text)) {
                                  handleAnswer(currentQ.id, current.filter((v: string) => v !== o.text));
                                } else {
                                  handleAnswer(currentQ.id, [...current, o.text]);
                                }
                              } else {
                                handleAnswer(currentQ.id, o.text);
                                setTimeout(nextStep, 300); // Auto-advance single choices
                              }
                            }} 
                            checked={currentQ.multipleSelection ? (answers[currentQ.id] || []).includes(o.text) : answers[currentQ.id] === o.text}
                          />
                          <span className="font-black text-base text-[#323130] uppercase tracking-wider group-hover:text-[#008272]">{o.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQ.type === QuestionType.RANKING && (
                    <div className="space-y-4">
                      {(answers[currentQ.id] || []).length > 0 && (
                        <div className="mb-4 p-5 bg-[#faf9f8] rounded-2xl border border-dashed border-[#008272]/30 flex flex-wrap gap-2 items-center">
                          {(answers[currentQ.id] || []).map((rankItem: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-[#008272] text-white text-[11px] font-black rounded-full shadow-md">
                              {i + 1}. {rankItem}
                            </span>
                          ))}
                          <button onClick={() => handleAnswer(currentQ.id, [])} className="text-[10px] font-black text-red-500 ml-auto uppercase tracking-widest hover:underline">Reset</button>
                        </div>
                      )}
                      {currentQ.options?.filter(o => !(answers[currentQ.id] || []).includes(o.text)).map(o => (
                        <button
                          key={o.id}
                          onClick={() => {
                            const current = answers[currentQ.id] || [];
                            handleAnswer(currentQ.id, [...current, o.text]);
                          }}
                          className="w-full flex items-center gap-4 p-6 border-2 border-gray-100 rounded-2xl hover:border-[#008272] hover:bg-teal-50/20 cursor-pointer transition-all active:scale-[0.99] group text-left"
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-sm font-black text-gray-300 group-hover:border-[#008272] group-hover:text-[#008272]">?</div>
                          <span className="font-black text-base text-[#323130] uppercase tracking-wider group-hover:text-[#008272]">{o.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ.type === QuestionType.TEXT && (
                    <textarea 
                      autoFocus
                      className="w-full border-2 border-gray-100 p-6 rounded-2xl bg-gray-50 focus:bg-white focus:border-[#008272] transition-all outline-none font-bold text-lg min-h-[200px]" 
                      placeholder="Type your response here..." 
                      value={answers[currentQ.id] || ''}
                      onChange={e => handleAnswer(currentQ.id, e.target.value)} 
                    />
                  )}

                  {currentQ.type === QuestionType.DATE && (
                    <input 
                      type="date" 
                      className="w-full border-2 border-gray-100 p-6 rounded-2xl bg-gray-50 font-black outline-none focus:border-[#008272] text-xl" 
                      value={answers[currentQ.id] || ''}
                      onChange={e => handleAnswer(currentQ.id, e.target.value)} 
                    />
                  )}

                  {currentQ.type === QuestionType.DOUBLE_RANKING_BOX && (
                    <div className="overflow-x-auto border-2 border-gray-100 rounded-2xl bg-white shadow-inner">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-[11px] font-black uppercase text-gray-400 p-5">Item</th>
                            <th className="text-center text-[11px] font-black uppercase text-gray-400 p-5">{currentQ.columnName || 'Detail'}</th>
                            <th className="text-center text-[11px] font-black uppercase text-gray-400 p-5">{currentQ.columnNameSmall || 'Value'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {currentQ.options?.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-5 font-black text-sm text-[#323130]">{o.text}</td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="..."
                                  value={answers[currentQ.id]?.[o.id]?.[`${currentQ.columnName || 'detail'}_big`] || ''}
                                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#008272] outline-none shadow-sm"
                                  onChange={e => {
                                    const current = answers[currentQ.id] || {};
                                    const row = current[o.id] || {};
                                    handleAnswer(currentQ.id, { ...current, [o.id]: { ...row, [`${currentQ.columnName || 'detail'}_big`]: e.target.value } });
                                  }}
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={answers[currentQ.id]?.[o.id]?.[`${currentQ.columnNameSmall || 'value'}_small`] || ''}
                                  className="w-20 mx-auto p-4 bg-white border border-gray-200 rounded-xl text-sm text-center font-black focus:border-[#008272] outline-none shadow-sm"
                                  onChange={e => {
                                    const current = answers[currentQ.id] || {};
                                    const row = current[o.id] || {};
                                    handleAnswer(currentQ.id, { ...current, [o.id]: { ...row, [`${currentQ.columnNameSmall || 'value'}_small`]: e.target.value } });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center gap-6">
                   <button 
                    onClick={prevStep}
                    className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all border border-gray-100"
                   >
                     Back
                   </button>
                   <button 
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="flex-[2] py-5 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    style={{ backgroundColor: theme.primaryColor }}
                   >
                     {currentStep === questionPath.length ? (isSubmitting ? 'Submitting...' : 'Complete Form') : 'Next Question'}
                   </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      
      <footer className="fixed bottom-2 right-4 z-[9999] pointer-events-none select-none text-right">
        <div className="text-[7px] md:text-[8px] font-bold text-gray-400/60 uppercase tracking-tight">
          AjD Group of Company | Designed By Dipesh Jung<br/>
          Contact:aryaldipesh248@gmail.com
        </div>
      </footer>
    </div>
  );
};

export default FormPreview;
