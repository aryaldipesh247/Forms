
import React, { useState, useMemo, useRef } from 'react';
import { Form, QuestionType, Question } from '../types';
import { Reorder } from 'framer-motion';

const ImageUploadQuestion = ({ q, value, onAnswer }: { q: Question, value: any, onAnswer: (v: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPreview(url);
        onAnswer(url);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative group">
          <img src={preview} className="w-full rounded-lg shadow border" />
          <button 
            onClick={() => { setPreview(null); onAnswer(null); }}
            className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="h-32 border-2 border-dashed border-[#edebe9] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">📸</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Take Photo</p>
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFile} 
            />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="h-32 border-2 border-dashed border-[#edebe9] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <span className="text-3xl">📁</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Upload File</p>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFile} 
            />
          </button>
        </div>
      )}
    </div>
  );
};

const RankingQuestion = ({ q, onAnswer }: { q: Question, onAnswer: (v: any) => void }) => {
  const [items, setItems] = useState(q.options || []);
  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    onAnswer(newItems.map(i => i.text));
  };

  return (
    <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item} className="p-4 bg-gray-50 border rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-4 group">
           <div className="flex-1 flex items-center gap-4">
             <span className="text-gray-300 font-bold group-hover:text-[#008272]">≡</span>
             <span className="font-bold text-gray-700">{item.text}</span>
           </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

const DoubleBoxQuestion = ({ q, answers, onAnswer }: { q: Question, answers: any, onAnswer: (v: any) => void }) => {
  const current = answers || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[3fr_1fr] gap-4">
        <div className="text-[10px] font-black uppercase text-gray-400">{q.columnName || 'Detail'}</div>
        <div className="text-[10px] font-black uppercase text-gray-400 text-center">{q.columnNameSmall || 'Value'}</div>
      </div>
      {q.options?.map(opt => (
        <div key={opt.id} className="space-y-2 border-b border-gray-50 pb-6 mb-4">
          <div className="text-xs font-black text-gray-800 uppercase tracking-widest mb-3">{opt.text}</div>
          <div className="grid grid-cols-[3fr_1fr] gap-4 items-start">
            <textarea 
              placeholder="Enter detailed notes freely..." 
              className="p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#008272] outline-none min-h-[120px] transition-all resize-y w-full font-medium"
              value={current[opt.id + '_big'] || ''}
              onChange={e => onAnswer({ ...current, [opt.id + '_big']: e.target.value })}
            />
            <input 
              type="text" placeholder="Value" 
              className="p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#008272] outline-none h-[45px] text-center font-black"
              value={current[opt.id + '_small'] || ''}
              onChange={e => onAnswer({ ...current, [opt.id + '_small']: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

interface FormPreviewProps {
  form: Form;
  isGuest?: boolean;
  onBack: () => void;
  onSubmit: (answers: Record<string, any>) => number;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, isGuest, onBack, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  const theme = form.theme || { primaryColor: '#008272', backgroundColor: '#f3f2f1' };

  const handleAnswer = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const currentQuestions = useMemo(() => {
    const visible: Question[] = [];
    let curIdx = 0;
    while(curIdx < form.questions.length) {
      const q = form.questions[curIdx];
      visible.push(q);
      
      const ans = answers[q.id];
      let nextId: string | 'next' | 'end' = 'next';
      
      if (q.enableBranching) {
        if (q.type === QuestionType.CHOICE && ans) {
          const selectedOpt = q.options?.find(o => o.text === ans);
          if (selectedOpt?.branching) nextId = selectedOpt.branching.nextQuestionId;
        } else if (q.branching) {
          nextId = q.branching.nextQuestionId;
        }
      }

      if (nextId === 'end') break;
      if (nextId === 'next') { curIdx++; continue; }
      
      const targetIdx = form.questions.findIndex(fq => fq.id === nextId);
      if (targetIdx > curIdx) { curIdx = targetIdx; } else { curIdx++; }
    }
    return visible;
  }, [form.questions, answers]);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
        <div className="max-w-md w-full bg-white p-12 rounded-xl shadow-2xl text-center border-t-[12px]" style={{ borderTopColor: theme.primaryColor }}>
          <h2 className="text-3xl font-black mb-2">Done!</h2>
          <p className="text-gray-500 font-bold mb-10">Submission successful.</p>
          <div className="bg-[#faf9f8] p-8 rounded-xl border-2 mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">Serial</p>
            <p className="text-5xl font-black">#{ticketNumber}</p>
          </div>
          {!isGuest && (
            <button onClick={onBack} className="w-full py-4 text-white font-black uppercase rounded-lg shadow-lg" style={{ backgroundColor: theme.primaryColor }}>Close</button>
          )}
          {isGuest && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">You can now close this tab.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative" style={{ 
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
    }}>
      {theme.backgroundVideoUrl && (
        <video key={theme.backgroundVideoUrl} autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover -z-10 opacity-30">
          <source src={theme.backgroundVideoUrl} type="video/mp4" />
        </video>
      )}

      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b p-4 shadow-sm flex justify-between items-center px-8">
          {!isGuest ? (
            <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-[#008272]">Back to Editor</button>
          ) : (
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-[#008272] flex items-center justify-center rounded-sm">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M19,19H5V5H19V19M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z"/></svg>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-[#008272]">Form</span>
            </div>
          )}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public Response Form</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 mt-12 space-y-8">
        <div className="bg-white/95 backdrop-blur-md rounded-md shadow-xl border-t-[12px] p-12 relative overflow-hidden" style={{ borderTopColor: theme.primaryColor }}>
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            {theme.headerBackgroundVideoUrl && (
              <video key={theme.headerBackgroundVideoUrl} src={theme.headerBackgroundVideoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-10" />
            )}
            {theme.headerBackgroundImage && (
              <img src={theme.headerBackgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-10" />
            )}
          </div>
          {theme.logoUrl && (
            <div className={`mb-6 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
              <img src={theme.logoUrl} style={{ width: `${(theme.logoScale || 100) * 0.8}px` }} className="h-auto object-contain" alt="Logo" />
            </div>
          )}
          <h1 className={`text-4xl ${theme.logoFormatting?.bold ? 'font-black' : 'font-bold'} mb-4`} style={{ textAlign: theme.logoAlignment }}>{form.title}</h1>
          <div className="space-y-4">
            {form.descriptions.map(d => (
              <p 
                key={d.id} 
                className={`text-lg text-gray-500 ${d.formatting?.bold ? 'font-bold' : ''} ${d.formatting?.italic ? 'italic' : ''}`}
                style={{ textAlign: d.formatting?.textAlign || 'left' }}
              >
                {d.text}
              </p>
            ))}
          </div>
        </div>

        {currentQuestions.map((q, idx) => (
          <div key={q.id} className="bg-white/95 backdrop-blur-md p-10 rounded shadow-lg border-l-[8px]" style={{ borderLeftColor: theme.primaryColor }}>
            <h3 className="text-xl font-bold mb-8">{idx + 1}. {q.title}</h3>
            {q.type === QuestionType.RANKING && <RankingQuestion q={q} onAnswer={val => handleAnswer(q.id, val)} />}
            {q.type === QuestionType.DOUBLE_RANKING_BOX && <DoubleBoxQuestion q={q} answers={answers[q.id]} onAnswer={val => handleAnswer(q.id, val)} />}
            {q.type === QuestionType.IMAGE_UPLOAD && <ImageUploadQuestion q={q} value={answers[q.id]} onAnswer={val => handleAnswer(q.id, val)} />}
            {q.type === QuestionType.CHOICE && (
              <div className="space-y-2">
                {q.options?.map(o => (
                  <label key={o.id} className="flex items-center gap-3 p-4 border rounded hover:bg-gray-50 cursor-pointer transition-all">
                    <input 
                      type={q.multipleSelection ? 'checkbox' : 'radio'} 
                      name={q.id} 
                      className="w-5 h-5" 
                      style={{ accentColor: theme.primaryColor }}
                      onChange={() => handleAnswer(q.id, o.text)}
                    />
                    <span className="font-bold">{o.text}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === QuestionType.TEXT && (
              <textarea 
                className="w-full border p-4 rounded bg-gray-50 focus:bg-white transition-colors focus:ring-1 focus:ring-[#008272] outline-none font-bold" 
                placeholder="Type your answer here..." 
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            )}
            {q.type === QuestionType.DATE && (
              <input 
                type="date" 
                className="w-full border p-4 rounded bg-gray-50 focus:bg-white transition-colors outline-none font-bold" 
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <button 
          onClick={() => { const s = onSubmit(answers); setTicketNumber(s); setSubmitted(true); }}
          className="w-full py-5 text-white font-black uppercase tracking-widest rounded shadow-xl hover:brightness-110 active:scale-95 transition-all"
          style={{ backgroundColor: theme.primaryColor }}
        >
          Submit Response
        </button>
      </div>
    </div>
  );
};

export default FormPreview;
