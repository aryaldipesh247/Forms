
import React, { useState, useRef } from 'react';
import { Form, Question, QuestionType, TextFormat, FormDescription, FormTheme } from '../types';
import QuestionCard from './QuestionCard';
import ShareDialog from './ShareDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuestionsFromAI, suggestThemeFromAI } from '../services/geminiService';

interface FormEditorProps {
  form: Form;
  onUpdate: (form: Form) => void;
  onBack: () => void;
  onPreview: () => void;
  onViewResponses: () => void;
  onDelete: () => void;
}

const THEME_PRESETS = [
  { id: 'teal', color: '#008272', bg: '#f3f2f1', label: 'Classic' },
  { id: 'professional', color: '#323130', bg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop', label: 'Business' },
  { id: 'academic', color: '#005a9e', bg: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2000&auto=format&fit=crop', label: 'Education' },
  { id: 'creative', color: '#d83b01', bg: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2000&auto=format&fit=crop', label: 'Creative' },
  { id: 'tech', color: '#4f6bed', bg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop', label: 'Tech' },
  { id: 'organic', color: '#107c10', bg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop', label: 'Nature' },
  { id: 'event', color: '#b4009e', bg: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2000&auto=format&fit=crop', label: 'Celebration' },
  { id: 'minimal', color: '#605e5c', bg: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop', label: 'Minimal' },
  { id: 'vibrant', color: '#881798', bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop', label: 'Modern' },
  { id: 'serene', color: '#0078d4', bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop', label: 'Beach' },
  { id: 'sunset', color: '#ea4300', bg: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=2000&auto=format&fit=crop', label: 'Skyline' },
  { id: 'midnight', color: '#252423', bg: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2000&auto=format&fit=crop', label: 'Midnight' },
  // New Themes Added
  { id: 'ocean', color: '#005175', bg: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=2000&auto=format&fit=crop', label: 'Ocean' },
  { id: 'forest', color: '#2d4a22', bg: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000&auto=format&fit=crop', label: 'Deep Forest' },
  { id: 'autumn', color: '#8b4513', bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2000&auto=format&fit=crop', label: 'Autumn' },
  { id: 'nebula', color: '#4b0082', bg: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2000&auto=format&fit=crop', label: 'Cosmos' },
  { id: 'pastel', color: '#ff69b4', bg: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2000&auto=format&fit=crop', label: 'Pastel' },
  { id: 'arctic', color: '#add8e6', bg: 'https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?q=80&w=2000&auto=format&fit=crop', label: 'Arctic' },
  { id: 'vintage', color: '#d2b48c', bg: 'https://images.unsplash.com/photo-1586075010633-244519635c17?q=80&w=2000&auto=format&fit=crop', label: 'Vintage' },
  { id: 'cyber', color: '#00ffcc', bg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop', label: 'Cyberpunk' },
  { id: 'zen', color: '#556b2f', bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop', label: 'Zen' },
  { id: 'marble', color: '#708090', bg: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=2000&auto=format&fit=crop', label: 'Marble' },
  { id: 'industrial', color: '#4a4a4a', bg: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=2000&auto=format&fit=crop', label: 'Gallery' },
  { id: 'coffee', color: '#4e342e', bg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop', label: 'Cafe' }
];

const STOCK_HEADER_MEDIA = [
  { type: 'none', url: '', label: 'None' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174', label: 'Office' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', label: 'Collaboration' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4', label: 'Workshop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1454165833767-027ffea9e778', label: 'Planning' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8', label: 'Reading' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', label: 'Mountains' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3', label: 'Festival' }
];

const FormEditor: React.FC<FormEditorProps> = ({ form, onUpdate, onBack, onPreview, onViewResponses }) => {
  const [showShare, setShowShare] = useState(false);
  const [showThemePane, setShowThemePane] = useState(false);
  const [showAIPane, setShowAIPane] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  
  const theme = form.theme || { primaryColor: '#008272', backgroundColor: '#f3f2f1' };
  const headerFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const updateForm = (updates: Partial<Form>) => onUpdate({ ...form, ...updates });

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const questions = await generateQuestionsFromAI(aiPrompt);
      updateForm({ questions: [...form.questions, ...questions] });
      setAiPrompt('');
      setShowAIPane(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAISuggestTheme = async () => {
    setIsAiLoading(true);
    try {
      const themeSuggestion = await suggestThemeFromAI(form.title, form.descriptions[0]?.text || '');
      updateForm({ theme: { ...theme, ...themeSuggestion } });
    } finally {
      setIsAiLoading(false);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...form.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    updateForm({ questions: newQuestions });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        if (type === 'header') {
          updateForm({ theme: { ...theme, headerBackgroundImage: url, headerBackgroundVideoUrl: undefined } });
        } else {
          updateForm({ theme: { ...theme, logoUrl: url, logoAlignment: theme.logoAlignment || 'left', logoScale: theme.logoScale || 100 } });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addDescription = () => {
    const newDesc: FormDescription = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New separate description block',
      formatting: { italic: true, fontSize: 'medium' },
      position: { x: 0, y: 0 }
    };
    updateForm({ descriptions: [...form.descriptions, newDesc] });
  };

  const updateDescription = (id: string, updates: Partial<FormDescription>) => {
    updateForm({
      descriptions: form.descriptions.map(d => d.id === id ? { ...d, ...updates } : d)
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: 'New Question',
      required: false,
      options: [QuestionType.CHOICE, QuestionType.RANKING, QuestionType.DOUBLE_RANKING_BOX].includes(type) ? [
        { id: Math.random().toString(36).substr(2, 9), text: 'Option 1' },
        { id: Math.random().toString(36).substr(2, 9), text: 'Option 2' }
      ] : undefined,
    };
    updateForm({ questions: [...form.questions, newQuestion] });
  };

  const FormattingToolbar = ({ format, onChange }: { format: TextFormat, onChange: (f: TextFormat) => void }) => (
    <div className="absolute -top-12 left-0 flex items-center gap-1 bg-white border p-1 shadow-xl rounded z-[100] scale-90 origin-left">
      <button onClick={() => onChange({ ...format, bold: !format.bold })} className={`p-2 rounded ${format.bold ? 'bg-[#008272] text-white' : 'hover:bg-gray-100'}`}><b>B</b></button>
      <button onClick={() => onChange({ ...format, italic: !format.italic })} className={`p-2 rounded ${format.italic ? 'bg-[#008272] text-white' : 'hover:bg-gray-100'}`}><i>I</i></button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button onClick={() => onChange({ ...format, textAlign: 'left' })} className={`p-2 rounded ${format.textAlign === 'left' ? 'bg-[#008272] text-white' : 'hover:bg-gray-100'}`}>L</button>
      <button onClick={() => onChange({ ...format, textAlign: 'center' })} className={`p-2 rounded ${format.textAlign === 'center' ? 'bg-[#008272] text-white' : 'hover:bg-gray-100'}`}>C</button>
      <button onClick={() => onChange({ ...format, textAlign: 'right' })} className={`p-2 rounded ${format.textAlign === 'right' ? 'bg-[#008272] text-white' : 'hover:bg-gray-100'}`}>R</button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <select 
        value={format.fontSize || 'medium'} 
        onChange={(e) => onChange({ ...format, fontSize: e.target.value as any })}
        className="text-[10px] font-bold uppercase p-1 bg-transparent border-none outline-none"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Big</option>
      </select>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden" style={{ 
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

      {showShare && <ShareDialog formId={form.id} onClose={() => setShowShare(false)} />}
      
      <nav className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-[60] px-6 h-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded text-[#008272]">←</button>
          <span className="font-bold text-[#323130] truncate max-w-[200px] text-[11px] uppercase tracking-widest">{form.title}</span>
        </div>
        <div className="flex items-center gap-8 h-full">
           <button className="px-4 h-full text-[11px] font-bold uppercase tracking-widest ms-active-underline text-[#008272]">Questions</button>
           <button onClick={onViewResponses} className="px-4 h-full text-[11px] font-bold uppercase tracking-widest text-[#605e5c] hover:text-[#323130]">Responses ({form.responses.length})</button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setShowAIPane(!showAIPane); setShowThemePane(false); }} 
            className="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:brightness-110 transition-all flex items-center gap-1.5"
          >
            <span className="text-sm">✨</span> AI Assistant
          </button>
          <button onClick={() => { setShowThemePane(!showThemePane); setShowAIPane(false); }} className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50">Style</button>
          <button onClick={onPreview} className="text-[#008272] px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50">Preview</button>
          <button onClick={() => setShowShare(true)} className="bg-[#008272] text-white px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: theme.primaryColor }}>Collect responses</button>
        </div>
      </nav>

      <AnimatePresence>
        {showAIPane && (
          <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed right-0 top-12 bottom-0 w-80 bg-white shadow-2xl z-[70] border-l p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <span className="text-lg">✨</span> Gemini AI Assistant
              </h3>
              <button onClick={() => setShowAIPane(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-6">
              <section>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-2 block">Generate Questions</label>
                <div className="relative">
                  <textarea 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. A customer satisfaction survey for a sushi restaurant..."
                    className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded text-xs focus:ring-1 focus:ring-indigo-400 outline-none min-h-[100px] resize-none"
                  />
                  <button 
                    disabled={isAiLoading || !aiPrompt}
                    onClick={handleGenerateAI}
                    className="w-full mt-2 bg-indigo-600 text-white py-3 rounded text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {isAiLoading ? 'Magic in progress...' : 'Generate with AI'}
                  </button>
                </div>
              </section>

              <div className="h-px bg-gray-100" />

              <section>
                <label className="text-[9px] font-bold text-gray-400 uppercase mb-2 block">Visual Magic</label>
                <button 
                  disabled={isAiLoading}
                  onClick={handleAISuggestTheme}
                  className="w-full flex items-center justify-center gap-2 p-4 border border-indigo-200 rounded text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <span className="text-sm">🎨</span> Suggest Theme from Content
                </button>
              </section>

              <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-[8px] text-gray-400 font-bold uppercase leading-relaxed">
                  Tip: Gemini works best with descriptive prompts. Try including the target audience and specific goals of your form.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {showThemePane && (
          <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed right-0 top-12 bottom-0 w-80 bg-white shadow-2xl z-[70] border-l p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#008272]">Style Pane</h3>
              <button onClick={() => setShowThemePane(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <section className="mb-8">
               <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-4">Header Customization</h4>
               <div className="space-y-4">
                  <button 
                    onClick={() => headerFileRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 text-[#008272]"
                  >
                    Upload Header Background
                  </button>
                  <input ref={headerFileRef} type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'header')} />
                  
                  <button 
                    onClick={() => logoFileRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 text-[#008272]"
                  >
                    Upload Logo
                  </button>
                  <input ref={logoFileRef} type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
               </div>

               {theme.logoUrl && (
                 <div className="mt-6 p-4 bg-gray-50 rounded space-y-4">
                    <h5 className="text-[9px] font-bold uppercase text-gray-400">Logo Controls</h5>
                    <div className="space-y-2">
                       <p className="text-[9px] font-bold text-gray-500 uppercase">Alignment</p>
                       <div className="flex gap-2">
                          {['left', 'center', 'right'].map(align => (
                            <button 
                              key={align} 
                              onClick={() => updateForm({ theme: { ...theme, logoAlignment: align as any } })}
                              className={`flex-1 py-1 text-[8px] font-black uppercase border rounded ${theme.logoAlignment === align ? 'bg-[#008272] text-white border-[#008272]' : 'bg-white text-gray-400'}`}
                            >
                              {align}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-bold text-gray-500 uppercase">Scale: {theme.logoScale || 100}%</p>
                       <input 
                         type="range" min="20" max="200" 
                         value={theme.logoScale || 100} 
                         onChange={e => updateForm({ theme: { ...theme, logoScale: parseInt(e.target.value) } })}
                         className="w-full accent-[#008272]"
                       />
                    </div>
                    <button onClick={() => updateForm({ theme: { ...theme, logoUrl: undefined } })} className="w-full py-2 text-[8px] text-red-500 font-bold uppercase border border-red-100 hover:bg-red-50 rounded">Remove Logo</button>
                 </div>
               )}
            </section>

            <section className="mb-8">
               <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-4">Stock Image Headers</h4>
               <div className="grid grid-cols-2 gap-2 mb-4">
                 {STOCK_HEADER_MEDIA.map((stock, i) => (
                   <button 
                      key={i} 
                      onClick={() => {
                        if (stock.type === 'none') {
                          updateForm({ theme: { ...theme, headerBackgroundImage: undefined, headerBackgroundVideoUrl: undefined } });
                        } else {
                          updateForm({ theme: { ...theme, headerBackgroundImage: stock.url, headerBackgroundVideoUrl: undefined } });
                        }
                      }}
                      className="h-16 rounded border bg-gray-100 overflow-hidden relative group"
                    >
                      {stock.type === 'none' ? <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">NONE</div> : <img src={stock.url} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <span className="text-[7px] text-white font-bold uppercase">{stock.label}</span>
                      </div>
                   </button>
                 ))}
               </div>
            </section>

            <section className="mb-8">
              <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-4">Color & Image Themes</h4>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map(preset => (
                  <button 
                    key={preset.id} 
                    onClick={() => updateForm({ theme: { ...theme, primaryColor: preset.color, backgroundColor: (preset.bg?.startsWith('http') ? '#f3f2f1' : preset.bg || '#f3f2f1'), backgroundImage: preset.bg?.startsWith('http') ? preset.bg : undefined, backgroundVideoUrl: undefined, themePreset: preset.id } })}
                    className={`h-24 rounded border-2 relative overflow-hidden group ${theme.themePreset === preset.id ? 'border-[#008272]' : 'border-transparent'}`}
                    style={{ backgroundColor: preset.bg?.startsWith('http') ? '#eee' : preset.bg }}
                  >
                     {preset.bg?.startsWith('http') && <img src={preset.bg} className="w-full h-full object-cover" />}
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all flex items-end p-2">
                       <span className="text-[8px] text-white font-black uppercase tracking-widest">{preset.label}</span>
                     </div>
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 py-10 relative">
        <div className="max-w-3xl mx-auto space-y-8 px-4">
          <div className="bg-white/95 backdrop-blur-md rounded-md shadow-lg border-t-[10px] p-10 relative min-h-[400px] overflow-hidden" style={{ borderTopColor: theme.primaryColor }}>
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
              {theme.headerBackgroundVideoUrl && (
                <video key={theme.headerBackgroundVideoUrl} src={theme.headerBackgroundVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20" />
              )}
              {theme.headerBackgroundImage && (
                <img src={theme.headerBackgroundImage} className="w-full h-full object-cover opacity-20" />
              )}
            </div>

            {theme.logoUrl && (
              <div 
                className={`mb-6 flex ${theme.logoAlignment === 'center' ? 'justify-center' : (theme.logoAlignment === 'right' ? 'justify-end' : 'justify-start')}`}
              >
                 <img 
                    src={theme.logoUrl} 
                    style={{ width: `${(theme.logoScale || 100) * 0.8}px` }} 
                    className="h-auto object-contain transition-all" 
                    alt="Logo" 
                 />
              </div>
            )}
            
            <motion.div 
              drag dragMomentum={false} 
              onDragEnd={(_, info) => updateForm({ titlePosition: { x: info.point.x, y: info.point.y } })}
              className="relative group w-fit cursor-move mb-8"
              onMouseEnter={() => setActiveBlock('title')}
              onMouseLeave={() => setActiveBlock(null)}
            >
              {activeBlock === 'title' && <FormattingToolbar format={form.titleFormatting || {}} onChange={f => updateForm({ titleFormatting: f })} />}
              <input 
                type="text" value={form.title} 
                onChange={e => updateForm({ title: e.target.value })} 
                placeholder="Untitled Form"
                className={`bg-transparent border-none focus:ring-0 outline-none w-full ${form.titleFormatting?.bold ? 'font-black' : 'font-normal'} ${form.titleFormatting?.italic ? 'italic' : ''}`}
                style={{ 
                  fontSize: form.titleFormatting?.fontSize === 'large' ? '3rem' : (form.titleFormatting?.fontSize === 'small' ? '1.2rem' : '2.25rem'),
                  textAlign: form.titleFormatting?.textAlign || 'left',
                  minWidth: '300px'
                }} 
              />
            </motion.div>

            {form.descriptions.map((desc) => (
              <motion.div 
                key={desc.id} drag dragMomentum={false}
                className="relative group w-fit cursor-move mb-4"
                onMouseEnter={() => setActiveBlock(desc.id)}
                onMouseLeave={() => setActiveBlock(null)}
              >
                {activeBlock === desc.id && (
                  <FormattingToolbar 
                    format={desc.formatting || {}} 
                    onChange={f => updateDescription(desc.id, { formatting: f })} 
                  />
                )}
                <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 flex flex-col gap-1">
                  <button onClick={() => updateForm({ descriptions: form.descriptions.filter(d => d.id !== desc.id) })} className="text-red-400 hover:text-red-600">✕</button>
                </div>
                <textarea 
                  value={desc.text} 
                  onChange={e => updateDescription(desc.id, { text: e.target.value })} 
                  placeholder="Enter description..."
                  className={`bg-transparent border-none focus:ring-0 outline-none resize-none ${desc.formatting?.bold ? 'font-bold' : ''} ${desc.formatting?.italic ? 'italic' : ''}`}
                  style={{ 
                    fontSize: desc.formatting?.fontSize === 'large' ? '1.5rem' : (desc.formatting?.fontSize === 'small' ? '0.75rem' : '0.9rem'),
                    textAlign: desc.formatting?.textAlign || 'left',
                    minWidth: '200px'
                  }}
                  rows={1}
                  onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                />
              </motion.div>
            ))}

            <button onClick={addDescription} className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#008272] hover:underline">+ Add Draggable Description Box</button>
          </div>

          <div className="space-y-4">
            {form.questions.map((q, idx) => (
              <QuestionCard 
                key={q.id} question={q} number={idx + 1} allQuestions={form.questions}
                onUpdate={updated => updateForm({ questions: form.questions.map(item => item.id === updated.id ? updated : item) })}
                onDelete={id => updateForm({ questions: form.questions.filter(item => item.id !== id) })}
                onDuplicate={question => {
                  const duplicate = { ...question, id: Math.random().toString(36).substr(2, 9), title: `${question.title} (Copy)` };
                  updateForm({ questions: [...form.questions, duplicate] });
                }}
                onMoveUp={() => moveQuestion(idx, 'up')}
                onMoveDown={() => moveQuestion(idx, 'down')}
                isFirst={idx === 0}
                isLast={idx === form.questions.length - 1}
                themeColor={theme.primaryColor}
              />
            ))}
          </div>

          <div className="bg-white p-8 rounded-md border shadow-sm mb-20">
             <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {[
                  { type: QuestionType.CHOICE, label: 'Choice', icon: '🔘' },
                  { type: QuestionType.TEXT, label: 'Text', icon: '📝' },
                  { type: QuestionType.DATE, label: 'Date', icon: '📅' },
                  { type: QuestionType.RANKING, label: 'Ranking', icon: '🔢' },
                  { type: QuestionType.DOUBLE_RANKING_BOX, label: 'Double', icon: '⚖️' },
                  { type: QuestionType.IMAGE_UPLOAD, label: 'Image', icon: '📸' },
                  { type: QuestionType.SECTION, label: 'Section', icon: '📑' },
                ].map(btn => (
                  <button key={btn.type} onClick={() => addQuestion(btn.type)} className="flex flex-col items-center p-3 hover:bg-gray-50 border rounded transition-colors group">
                    <span className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                    <span className="text-[9px] font-bold uppercase text-gray-500 mt-1">{btn.label}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormEditor;
