
import React, { useState, useEffect } from 'react';
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
  <div className="flex items-center gap-2 mt-2 ml-4 p-2 bg-teal-50/50 rounded-lg border border-teal-100 transition-all hover:border-teal-300">
    <span className="text-[10px] font-black uppercase text-[#008272] flex items-center gap-1.5">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      Go to:
    </span>
    <select 
      value={value?.nextQuestionId || 'next'} 
      onChange={(e) => onChange({ nextQuestionId: e.target.value as any })}
      className="text-[10px] bg-transparent border-none outline-none font-black text-[#008272] cursor-pointer"
    >
      <option value="next">Next Question (Default)</option>
      <option value="end">End of Form</option>
      {questions.map((q, idx) => (
        <option key={q.id} value={q.id}>Q{idx + 1}: {q.title.substring(0, 30)}...</option>
      ))}
    </select>
  </div>
);

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, number, allQuestions, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast, themeColor
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [localQuestion, setLocalQuestion] = useState<Question>(question);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalQuestion(question);
    setHasUnsavedChanges(false);
  }, [question]);

  const updateProp = (prop: keyof Question, value: any, immediateSync = false) => {
    const updated = { ...localQuestion, [prop]: value };
    setLocalQuestion(updated);
    if (immediateSync) {
      onUpdate(updated);
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), { id: Math.random().toString(36).substr(2, 9), text: `Option ${(localQuestion.options?.length || 0) + 1}` }];
    updateProp('options', newOptions);
  };

  const updateOption = (id: string, text?: string, branching?: BranchingConfig) => {
    const newOptions = (localQuestion.options || []).map(o => 
      o.id === id ? { ...o, text: text !== undefined ? text : o.text, branching: branching !== undefined ? branching : o.branching } : o
    );
    updateProp('options', newOptions, branching !== undefined);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!localQuestion.options) return;
    const newOptions = [...localQuestion.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    updateProp('options', newOptions, true);
  };

  const handleManualUpdate = () => {
    onUpdate(localQuestion);
    setHasUnsavedChanges(false);
  };

  return (
    <div onFocus={() => setIsActive(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setIsActive(false); if (hasUnsavedChanges) handleManualUpdate(); } }} className={`bg-white rounded shadow p-10 transition-all relative border-l-[8px] group ${isActive ? 'shadow-xl' : ''}`} style={{ borderLeftColor: isActive ? themeColor : 'transparent', marginBottom: '2rem' }}>
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
        <div className="flex bg-gray-50 border rounded overflow-hidden">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="p-2 hover:bg-[#008272] hover:text-white text-gray-400 border-r disabled:opacity-20">↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="p-2 hover:bg-[#008272] hover:text-white text-gray-400 disabled:opacity-20">↓</button>
        </div>
        <button onClick={() => onDuplicate(localQuestion)} className="p-2 hover:bg-gray-100 rounded text-gray-400 bg-white border">📋</button>
        <button onClick={() => onDelete(localQuestion.id)} className="p-2 hover:bg-red-50 text-red-500 rounded bg-white border">✕</button>
      </div>
      <div className="flex items-start gap-4 mb-8">
        <span className="text-xl font-bold" style={{ color: themeColor }}>{number}.</span>
        <div className="flex-1">
          {isActive && <FormatToolbar format={localQuestion.titleFormatting || {}} onChange={f => updateProp('titleFormatting', f, true)} />}
          <input type="text" value={localQuestion.title} onChange={e => updateProp('title', e.target.value)} placeholder="Enter Question Box..." className={`w-full text-2xl border-none focus:ring-0 outline-none placeholder-[#a19f9d] bg-transparent ${localQuestion.titleFormatting?.bold ? 'font-black' : ''} ${localQuestion.titleFormatting?.italic ? 'italic' : ''}`} />
          {localQuestion.showSubtitle && <input type="text" value={localQuestion.subtitle || ''} onChange={e => updateProp('subtitle', e.target.value)} placeholder="Add a subtitle" className="w-full text-sm border-none focus:ring-0 outline-none text-gray-400 bg-transparent italic mt-1" />}
        </div>
      </div>
      <div className="ml-10 space-y-6">
        {localQuestion.type === QuestionType.DOUBLE_RANKING_BOX && (
          <div className="space-y-4">
            <div className="grid grid-cols-[1.5fr_2fr_0.5fr_100px] gap-4 mb-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Item</span>
              <input type="text" value={localQuestion.columnName || 'Detail'} onChange={e => updateProp('columnName', e.target.value)} className="text-[10px] font-black uppercase text-center border-b outline-none bg-transparent" />
              <input type="text" value={localQuestion.columnNameSmall || 'Value'} onChange={e => updateProp('columnNameSmall', e.target.value)} className="text-[10px] font-black uppercase text-center border-b outline-none bg-transparent" />
            </div>
            {localQuestion.options?.map((opt, idx) => (
              <div key={opt.id} className="grid grid-cols-[1.5fr_2fr_0.5fr_100px] gap-4 items-center">
                <input type="text" value={opt.text} onChange={e => updateOption(opt.id, e.target.value)} className="text-sm font-black uppercase border-none bg-transparent outline-none" />
                <div className="h-10 border border-gray-100 rounded-lg flex items-center px-3 text-[10px] text-gray-300">Response...</div>
                <div className="h-10 border border-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-300">Value</div>
                <div className="flex gap-2">
                  <button onClick={() => moveOption(idx, 'up')} disabled={idx === 0} className="text-gray-400">↑</button>
                  <button onClick={() => moveOption(idx, 'down')} disabled={idx === (localQuestion.options?.length || 0) - 1} className="text-gray-400">↓</button>
                  <button onClick={() => updateProp('options', localQuestion.options?.filter(o => o.id !== opt.id), true)} className="text-gray-300">✕</button>
                </div>
              </div>
            ))}
            <button onClick={addOption} className="text-[10px] font-black uppercase text-[#008272]">+ Add Row Item</button>
          </div>
        )}
        {(localQuestion.type === QuestionType.CHOICE || localQuestion.type === QuestionType.RANKING) && (
          <div className="space-y-4">
            {localQuestion.options?.map((opt, idx) => (
              <div key={opt.id} className="space-y-2 group/opt relative">
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 flex items-center justify-center font-bold text-[9px] border-2 ${localQuestion.type === QuestionType.RANKING ? 'bg-gray-50' : (localQuestion.multipleSelection ? 'rounded-sm' : 'rounded-full')}`}>{localQuestion.type === QuestionType.RANKING ? idx + 1 : ''}</div>
                  <input type="text" value={opt.text} onChange={e => updateOption(opt.id, e.target.value)} className="flex-1 py-2 border-none bg-transparent outline-none text-sm font-bold" />
                  <div className="flex gap-2 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                    <button onClick={() => moveOption(idx, 'up')} disabled={idx === 0} className="text-gray-400">↑</button>
                    <button onClick={() => moveOption(idx, 'down')} disabled={idx === (localQuestion.options?.length || 0) - 1} className="text-gray-400">↓</button>
                    <button onClick={() => updateProp('options', localQuestion.options?.filter(o => o.id !== opt.id), true)} className="text-gray-300">✕</button>
                  </div>
                </div>
                {localQuestion.enableBranching && <BranchingSelector questions={allQuestions.filter(aq => aq.id !== localQuestion.id)} value={opt.branching} onChange={v => updateOption(opt.id, undefined, v)} />}
              </div>
            ))}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-dashed">
              <button onClick={addOption} className="text-[10px] font-bold uppercase text-[#008272]">+ Add Option</button>
              {localQuestion.type === QuestionType.CHOICE && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={localQuestion.multipleSelection} onChange={e => updateProp('multipleSelection', e.target.checked, true)} className="sr-only peer" />
                    <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-[#008272] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400">Multiple Answers</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-12 pt-8 border-t flex justify-between items-center">
        <div className="flex items-center gap-6">
           {hasUnsavedChanges && <button onClick={handleManualUpdate} className="bg-[#008272] text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest shadow animate-pulse">Update Question</button>}
           <span className="text-[9px] font-black uppercase text-gray-300">{hasUnsavedChanges ? 'Unsaved' : 'Synced'}</span>
        </div>
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={localQuestion.required} onChange={e => updateProp('required', e.target.checked, true)} className="w-5 h-5" style={{ accentColor: themeColor }} />
            <span className="text-xs font-bold uppercase text-gray-500">Required</span>
          </label>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400 hover:text-black text-xl">⋮</button>
            {showMenu && (
              <div className="absolute bottom-full right-0 mb-3 w-64 bg-white border shadow-2xl rounded-md py-2 z-50 animate-in slide-in-from-bottom-2">
                <button onClick={() => { updateProp('enableBranching', !localQuestion.enableBranching, true); setShowMenu(false); }} className={`w-full text-left px-5 py-3 text-xs font-bold uppercase ${localQuestion.enableBranching ? 'text-[#008272] bg-teal-50' : 'text-gray-700'} hover:bg-gray-50 transition-colors`}>
                  {localQuestion.enableBranching ? '✓ BRANCHING ACTIVE' : 'Enable Branching'}
                </button>
                
                {localQuestion.enableBranching && (
                  <div className="px-5 py-3 bg-gray-50/50 border-t border-b border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">DEFAULT NEXT STEP:</p>
                    <select 
                      value={localQuestion.branching?.nextQuestionId || 'next'}
                      onChange={(e) => updateProp('branching', { nextQuestionId: e.target.value }, true)}
                      className="w-full p-2 text-[11px] font-black border border-gray-200 rounded-sm bg-white text-[#323130] focus:ring-1 focus:ring-[#008272] outline-none cursor-pointer"
                    >
                      <option value="next">Next Question (Default)</option>
                      <option value="end">End of Form</option>
                      {allQuestions.filter(aq => aq.id !== localQuestion.id).map((q, idx) => (
                        <option key={q.id} value={q.id}>Q{idx + 1}: {q.title.substring(0, 25)}...</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={() => { updateProp('showSubtitle', !localQuestion.showSubtitle, true); setShowMenu(false); }} className={`w-full text-left px-5 py-3 text-xs font-bold uppercase ${localQuestion.showSubtitle ? 'text-[#008272]' : 'text-gray-700'} hover:bg-gray-50`}>{localQuestion.showSubtitle ? '✓ Subtitle Enabled' : 'Add Subtitle'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
