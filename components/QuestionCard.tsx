import React, { useState } from 'react';
import { Question, QuestionType, TextFormat, ChoiceOption, BranchingConfig } from '../types';

interface QuestionCardProps {
  question: Question;
  number: number;
  allQuestions: Question[];
  onUpdate: (q: Question) => void;
  onDelete: (id: string) => void;
  onDuplicate: (q: Question) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  themeColor: string;
}

const FormatToolbar: React.FC<{ format: TextFormat, onChange: (f: TextFormat) => void }> = ({ format, onChange }) => (
  <div className="flex gap-1 bg-white border border-[#edebe9] p-0.5 shadow-sm rounded-sm mb-1 scale-75 origin-left w-fit">
    <button onClick={() => onChange({ ...format, bold: !format.bold })} className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded ${format.bold ? 'bg-[#008272] text-white' : 'hover:bg-gray-100 text-[#323130]'}`}>B</button>
    <button onClick={() => onChange({ ...format, italic: !format.italic })} className={`w-6 h-6 flex items-center justify-center italic text-xs rounded ${format.italic ? 'bg-[#008272] text-white' : 'hover:bg-gray-100 text-[#323130]'}`}>I</button>
  </div>
);

const BranchingSelector: React.FC<{ value?: BranchingConfig, questions: Question[], onChange: (v: BranchingConfig) => void }> = ({ value, questions, onChange }) => (
  <div className="flex items-center gap-2 mt-2 ml-4 p-2 bg-gray-50 rounded border border-dashed border-gray-200">
    <span className="text-[9px] font-bold uppercase text-gray-400">Go to:</span>
    <select 
      value={value?.nextQuestionId || 'next'} 
      onChange={(e) => onChange({ nextQuestionId: e.target.value as any })}
      className="text-[10px] bg-transparent border-none outline-none font-bold text-[#008272]"
    >
      <option value="next">Next Question</option>
      <option value="end">End of Form</option>
      {questions.map((q, idx) => (
        <option key={q.id} value={q.id}>Q{idx + 1}: {q.title.substring(0, 20)}...</option>
      ))}
    </select>
  </div>
);

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, number, allQuestions, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast, themeColor
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const updateProp = (prop: keyof Question, value: any) => onUpdate({ ...question, [prop]: value });

  const addOption = () => {
    const newOptions = [...(question.options || []), { id: Math.random().toString(36).substr(2, 9), text: `Option ${(question.options?.length || 0) + 1}` }];
    updateProp('options', newOptions);
  };

  const updateOption = (id: string, text: string, branching?: BranchingConfig) => {
    const newOptions = (question.options || []).map(o => o.id === id ? { ...o, text: text !== undefined ? text : o.text, branching: branching || o.branching } : o);
    updateProp('options', newOptions);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!question.options) return;
    const newOptions = [...question.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    updateProp('options', newOptions);
  };

  const quickSwap = (id1: string, id2: string) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    const idx1 = newOptions.findIndex(o => o.id === id1);
    const idx2 = newOptions.findIndex(o => o.id === id2);
    if (idx1 === -1 || idx2 === -1) return;
    [newOptions[idx1], newOptions[idx2]] = [newOptions[idx2], newOptions[idx1]];
    updateProp('options', newOptions);
    setSwappingId(null);
  };

  return (
    <div 
      onFocus={() => setIsActive(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsActive(false); }}
      className={`bg-white/95 backdrop-blur-md rounded-md shadow-sm p-10 transition-all relative border-l-[8px] group ${isActive ? 'shadow-xl' : ''}`}
      style={{ borderLeftColor: isActive ? themeColor : 'transparent' }}
    >
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
        <div className="flex bg-gray-50 border rounded overflow-hidden">
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
            disabled={isFirst}
            title="Move Up" 
            className="p-2 hover:bg-[#008272] hover:text-white text-gray-400 border-r disabled:opacity-20"
          >
            ↑
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
            disabled={isLast}
            title="Move Down" 
            className="p-2 hover:bg-[#008272] hover:text-white text-gray-400 disabled:opacity-20"
          >
            ↓
          </button>
        </div>
        <button onClick={() => onDuplicate(question)} title="Duplicate" className="p-2 hover:bg-gray-100 rounded text-gray-400 bg-white border">📋</button>
        <button onClick={() => onDelete(question.id)} title="Delete" className="p-2 hover:bg-red-50 text-red-500 rounded bg-white border">✕</button>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <span className="text-xl font-bold" style={{ color: themeColor }}>{number}.</span>
        <div className="flex-1">
          {isActive && <FormatToolbar format={question.titleFormatting || {}} onChange={f => updateProp('titleFormatting', f)} />}
          <input 
            type="text" value={question.title} 
            onChange={e => updateProp('title', e.target.value)} 
            placeholder="Enter Question Box..." 
            className={`w-full text-2xl border-none focus:ring-0 focus:outline-none placeholder-[#a19f9d] text-[#323130] bg-transparent ${question.titleFormatting?.bold ? 'font-black' : 'font-normal'} ${question.titleFormatting?.italic ? 'italic' : ''}`} 
          />
        </div>
      </div>

      <div className="ml-10 space-y-6">
        {question.type === QuestionType.DOUBLE_RANKING_BOX && (
           <div className="space-y-4">
              <div className="grid grid-cols-[1.5fr_2fr_0.5fr_100px] gap-4 mb-2">
                 <span className="text-[10px] font-black uppercase text-gray-400">Row Item</span>
                 <input type="text" value={question.columnName || 'Big Box'} onChange={e => updateProp('columnName', e.target.value)} className="text-[10px] font-bold text-center border-b outline-none bg-transparent" placeholder="Header Left" />
                 <input type="text" value={question.columnNameSmall || 'Small'} onChange={e => updateProp('columnNameSmall', e.target.value)} className="text-[10px] font-bold text-center border-b outline-none bg-transparent" placeholder="Header Right" />
                 <div />
              </div>
              {question.options?.map((opt, idx) => (
                <div key={opt.id} className="grid grid-cols-[1.5fr_2fr_0.5fr_100px] gap-4 items-center">
                  <input type="text" value={opt.text} onChange={e => updateOption(opt.id, e.target.value)} className="text-sm font-bold border-none bg-transparent focus:ring-0 outline-none" placeholder="Row Label" />
                  <div className="h-10 bg-gray-50 border rounded flex items-center justify-center text-[10px] text-gray-300">Big Answer Box</div>
                  <div className="h-10 bg-gray-50 border rounded flex items-center justify-center text-[10px] text-gray-300">Sm</div>
                  <div className="flex gap-2">
                    <button onClick={() => moveOption(idx, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-black disabled:opacity-20 p-1">↑</button>
                    <button onClick={() => moveOption(idx, 'down')} disabled={idx === (question.options?.length || 0) - 1} className="text-gray-400 hover:text-black disabled:opacity-20 p-1">↓</button>
                    <button onClick={() => updateProp('options', question.options?.filter(o => o.id !== opt.id))} className="text-gray-300 hover:text-red-500 text-sm ml-2">✕</button>
                  </div>
                </div>
              ))}
              <button onClick={addOption} className="text-[10px] font-bold uppercase tracking-widest text-[#008272] hover:underline">+ Add Option Row</button>
           </div>
        )}

        {question.type === QuestionType.IMAGE_UPLOAD && (
          <div className="space-y-4">
            <div className="w-full h-40 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50">
               <span className="text-3xl opacity-50">📸</span>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image Box Enabled</p>
               <p className="text-[10px] text-gray-400">Respondent can capture photo or upload file</p>
            </div>
            {question.enableBranching && <BranchingSelector questions={allQuestions.filter(aq => aq.id !== question.id)} value={question.branching} onChange={v => updateProp('branching', v)} />}
          </div>
        )}

        {(question.type === QuestionType.CHOICE || question.type === QuestionType.RANKING) && (
          <div className="space-y-4">
            {question.options?.map((opt, idx) => (
              <div key={opt.id} className="space-y-2 group/opt relative">
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 flex items-center justify-center font-bold text-[9px] border-2 ${question.type === QuestionType.RANKING ? 'bg-gray-50' : (question.multipleSelection ? 'rounded-sm' : 'rounded-full')}`}>
                    {question.type === QuestionType.RANKING ? idx + 1 : ''}
                  </div>
                  <input type="text" value={opt.text} onChange={e => updateOption(opt.id, e.target.value)} className="flex-1 py-2 border-none bg-transparent focus:ring-0 outline-none text-sm font-bold" placeholder="Option Text..." />
                  
                  <div className="flex gap-2 items-center opacity-0 group-hover/opt:opacity-100 transition-opacity">
                    <button 
                       onClick={() => setSwappingId(swappingId === opt.id ? null : opt.id)}
                       className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase border transition-all ${swappingId === opt.id ? 'bg-[#008272] text-white' : 'text-[#008272] hover:bg-[#008272]/5'}`}
                    >
                       Swap
                    </button>
                    <button onClick={() => moveOption(idx, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-black disabled:opacity-20 p-1">↑</button>
                    <button onClick={() => moveOption(idx, 'down')} disabled={idx === (question.options?.length || 0) - 1} className="text-gray-400 hover:text-black disabled:opacity-20 p-1">↓</button>
                    <button onClick={() => updateProp('options', question.options?.filter(o => o.id !== opt.id))} className="text-gray-300 hover:text-red-500 ml-2">✕</button>
                  </div>
                </div>

                {swappingId === opt.id && (
                  <div className="ml-9 p-2 bg-[#faf9f8] rounded border border-dashed border-[#008272]/20 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-[9px] font-black uppercase text-gray-400">Swap with:</span>
                    <div className="flex flex-wrap gap-1">
                      {question.options?.filter(o => o.id !== opt.id).map(o => (
                        <button 
                          key={o.id} 
                          onClick={() => quickSwap(opt.id, o.id)}
                          className="px-2 py-0.5 text-[8px] bg-white border rounded font-bold hover:bg-[#008272] hover:text-white transition-colors"
                        >
                          {o.text.substring(0, 10)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {question.enableBranching && <BranchingSelector questions={allQuestions.filter(aq => aq.id !== question.id)} value={opt.branching} onChange={v => updateOption(opt.id, opt.text, v)} />}
              </div>
            ))}
            <button onClick={addOption} className="text-[10px] font-bold uppercase tracking-widest text-[#008272] hover:underline">+ Add {question.type === QuestionType.RANKING ? 'Ranking' : 'Choice'} Box</button>
          </div>
        )}

        {question.type === QuestionType.TEXT && (
           <div className="space-y-4">
              <div className="w-full border-b-2 border-dashed border-gray-100 py-4 text-gray-300 text-sm font-bold italic">User will type here...</div>
              {question.enableBranching && <BranchingSelector questions={allQuestions.filter(aq => aq.id !== question.id)} value={question.branching} onChange={v => updateProp('branching', v)} />}
           </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t flex justify-end gap-8 items-center">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={question.required} onChange={e => updateProp('required', e.target.checked)} className="w-5 h-5 rounded-sm" style={{ accentColor: themeColor }} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Required</span>
        </label>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-black rounded text-xl">⋮</button>
          {showMenu && (
            <div className="absolute bottom-full right-0 mb-3 w-56 bg-white border shadow-2xl rounded-md py-2 z-50">
              <button onClick={() => { updateProp('enableBranching', !question.enableBranching); setShowMenu(false); }} className={`w-full text-left px-5 py-3 text-xs font-bold uppercase ${question.enableBranching ? 'text-[#008272]' : 'text-gray-700'} hover:bg-gray-50`}>
                {question.enableBranching ? '✓ Branching Settings' : 'Branching Settings'}
              </button>
              <button onClick={() => { updateProp('showSubtitle', !question.showSubtitle); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-xs font-bold uppercase hover:bg-gray-50">Subtitle</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;