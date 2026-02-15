
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, View, FormResponse, User, ResponseArchive, QuestionType } from './types';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';
import ResponseDashboard from './components/ResponseDashboard';
import RecycleBin from './components/RecycleBin';
import Auth, { hashPassword } from './components/Auth';
import Settings from './components/Settings';
import { db } from './services/firebase';
import { saveDatabase, loadDatabase, deleteUserCompletely, getFormById, saveResponse, saveForm, deleteFormPermanently, clearFormResponses } from './services/databaseService';

const SESSION_KEY = 'forms_pro_active_session_v1';
const LOST_FOUND_ID = 'official-lost-found-v1';

const GlobalFooter = () => (
  <footer className="fixed bottom-2 right-4 z-[9999] pointer-events-none select-none text-right">
    <div className="text-[7px] md:text-[8px] font-bold text-gray-400/70 uppercase tracking-tight">AjD Group of Company | Designed By Dipesh Jung<br/>Contact:aryaldipesh248@gmail.com</div>
  </footer>
);

const LOST_AND_FOUND_TEMPLATE: Form = {
  id: LOST_FOUND_ID,
  title: 'Lost & Found Official Registry',
  descriptions: [{
    id: 'desc-lost-1',
    text: 'Official portal for reporting lost or found items. Data is segregated into Alcohol, Valuable, and Non-Valuable registries.',
    formatting: { italic: true, fontSize: 'medium' }
  }],
  questions: [
    { id: 'q-found-date', type: QuestionType.DATE, title: 'Add Found Date', required: true },
    { id: 'q-location', type: QuestionType.TEXT, title: 'LOCATION', subtitle: 'Where it found', required: true },
    {
      id: 'q-department',
      type: QuestionType.CHOICE,
      title: 'DEPARTMENT',
      required: true,
      options: [
        { id: 'dept-hk', text: 'HOUSEKEEPING' }, { id: 'dept-eng', text: 'ENGINEERING' }, { id: 'dept-lnd', text: 'LAUNDRY' },
        { id: 'dept-fb', text: 'F&B' }, { id: 'dept-stew', text: 'STEWARDING' }, { id: 'dept-ird', text: 'IRD' },
        { id: 'dept-fin', text: 'FINANCE' }, { id: 'dept-it', text: 'IT' }, { id: 'dept-acc', text: 'ACCOUNT' },
        { id: 'dept-pur', text: 'PURCHASING' }, { id: 'dept-fo', text: 'FRONT OFFICE' }, { id: 'dept-con', text: 'CONCERIAGE' },
        { id: 'dept-cc', text: 'CALL CENTER' }, { id: 'dept-btl', text: 'BUTLER' }, { id: 'dept-gst', text: 'GUEST' }
      ]
    },
    { id: 'q-found-time', type: QuestionType.TEXT, title: 'FOUND TIME', required: true },
    {
      id: 'q-category',
      type: QuestionType.CHOICE,
      title: 'VALUABLE / NON VALUABEL / ALCOHOL',
      multipleSelection: true,
      required: true,
      options: [
        { id: 'cat-alc', text: 'ALCOHOL' },
        { id: 'cat-val', text: 'VALUABLE' },
        { id: 'cat-non', text: 'NON VALUABLE' }
      ]
    },
    {
      id: 'q-alcohol-details',
      type: QuestionType.DOUBLE_RANKING_BOX,
      title: 'SEALED /UNSEALED',
      columnName: 'ALCOHOL NAME',
      columnNameSmall: 'QUANTITY',
      required: false,
      options: [
        { id: 'alc-unsealed', text: 'UNSEALED' }, { id: 'alc-750', text: 'SEALED 750 ML' },
        { id: 'alc-1l', text: 'SEALED 1L' }, { id: 'alc-1500', text: 'SEALED 1500 ML' }, { id: 'alc-others', text: 'OTHERS' }
      ]
    },
    { id: 'q-valuable-details', type: QuestionType.TEXT, title: 'VALUABLE', subtitle: 'VALUABLE(Jewelry, Phone , Watch , Money etc..)', required: false },
    { id: 'q-non-valuable-details', type: QuestionType.TEXT, title: 'NON VALUABLE', subtitle: 'NON VALUABLE (Clothes, Shoes, Cosmetics etc..)', required: false },
    { id: 'q-item-desc', type: QuestionType.TEXT, title: 'ITEM DESCRIPTION', required: true },
    { id: 'q-item-pic', type: QuestionType.IMAGE_UPLOAD, title: 'ITEM PICTURE', required: true },
    { id: 'q-contact', type: QuestionType.TEXT, title: 'CONTACT DETAILS', required: true },
    { id: 'q-remarks', type: QuestionType.TEXT, title: 'COMMENTS (REMARKS)', required: false }
  ],
  createdAt: new Date().toISOString(),
  responses: [],
  isPublished: true,
  theme: { primaryColor: '#ea4300', backgroundColor: '#fffaf5', themePreset: 'LostAndFound' }
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [liveForm, setLiveForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronization effect: Only initialize the official registry if it is completely missing.
  // This allows users to add/edit questions without them being overwritten by the template.
  useEffect(() => {
    if (currentUser) {
      const existingForm = currentUser.forms.find(f => f.id === LOST_FOUND_ID);
      if (!existingForm) {
        const otherForms = currentUser.forms.filter(f => f.id !== LOST_FOUND_ID);
        const updatedForms = [LOST_AND_FOUND_TEMPLATE, ...otherForms];
        const updatedUser = { ...currentUser, forms: updatedForms };
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        saveForm(currentUser.id, LOST_AND_FOUND_TEMPLATE);
      }
    }
  }, [currentUser?.id]); // Only re-run if the active user ID changes

  useEffect(() => {
    if (!isLoading && users.length > 0) localStorage.setItem('forms_pro_local_backup', JSON.stringify(users));
  }, [users, isLoading]);

  useEffect(() => {
    if (!activeFormId) { setLiveForm(null); return; }
    const formRef = db.ref(`forms/${activeFormId}`);
    const respRef = db.ref(`responses/${activeFormId}`);
    const handleFormUpdate = (snapshot: any) => {
      if (snapshot.exists()) {
        const formData = snapshot.val();
        const cleanedQuestions = formData.questions ? (Array.isArray(formData.questions) ? formData.questions : Object.values(formData.questions)) : [];
        const cleanedDescriptions = formData.descriptions ? (Array.isArray(formData.descriptions) ? formData.descriptions : Object.values(formData.descriptions)) : [];
        setLiveForm(prev => ({
          ...prev, ...formData, descriptions: cleanedDescriptions,
          questions: cleanedQuestions.map((q: any) => ({ ...q, options: q.options ? (Array.isArray(q.options) ? q.options : Object.values(q.options)) : [] })),
          isPublished: formData.published ?? formData.isPublished ?? false, responses: prev?.responses || []
        }));
      }
    };
    const handleRespUpdate = (snapshot: any) => {
      const responses = snapshot.exists() ? Object.values(snapshot.val()) : [];
      setLiveForm(prev => prev ? { ...prev, responses: responses as FormResponse[] } : null);
    };
    formRef.on('value', handleFormUpdate);
    respRef.on('value', handleRespUpdate);
    return () => { formRef.off('value', handleFormUpdate); respRef.off('value', handleRespUpdate); };
  }, [activeFormId]);

  const handleHashChange = useCallback(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#preview/')) { setActiveFormId(hash.replace('#preview/', '')); setCurrentView('preview'); }
    else if (currentView === 'preview') { setCurrentView('dashboard'); setActiveFormId(null); }
  }, [currentView]);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  useEffect(() => {
    const init = async () => {
      const loadedUsers = await loadDatabase();
      const adminEmail = 'Jungdai@1', adminSecret = 'Jungdai@1', adminPin = '1111';
      let allUsers = [...loadedUsers];
      if (!allUsers.find(u => u.email === adminEmail)) {
        const hashedPassword = await hashPassword(adminSecret), hashedPin = await hashPassword(adminPin);
        allUsers.push({ id: 'admin-access-jungdai', email: adminEmail, password: hashedPassword, pin: hashedPin, firstName: 'Admin', lastName: 'Jung', forms: [] });
      }
      setUsers(allUsers);
      const savedSessionId = localStorage.getItem(SESSION_KEY);
      if (savedSessionId) { const user = allUsers.find(u => u.id === savedSessionId); if (user) setCurrentUser(user); else localStorage.removeItem(SESSION_KEY); }
      setIsLoading(false);
      const hash = window.location.hash; if (hash.startsWith('#preview/')) { setActiveFormId(hash.replace('#preview/', '')); setCurrentView('preview'); }
    };
    init();
  }, []);

  const activeForm = useMemo(() => liveForm || (currentUser ? currentUser.forms.find(f => f.id === activeFormId) : null) || null, [liveForm, currentUser, activeFormId]);
  const handleLogin = useCallback((user: User) => { setCurrentUser(user); localStorage.setItem(SESSION_KEY, user.id); setCurrentView('dashboard'); window.location.hash = ''; }, []);
  const handleSignOut = useCallback(() => { setCurrentUser(null); localStorage.removeItem(SESSION_KEY); window.location.hash = ''; setActiveFormId(null); }, []);
  const handleUpdateUser = useCallback(async (updatedUser: User) => { setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u)); if (currentUser?.id === updatedUser.id) { setCurrentUser(updatedUser); localStorage.setItem(SESSION_KEY, updatedUser.id); } await saveDatabase([updatedUser]); }, [currentUser]);
  const handleUpdateForms = useCallback(async (updatedForms: Form[]) => { if (!currentUser) return; const updatedUser = { ...currentUser, forms: updatedForms }; setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u)); setCurrentUser(updatedUser); setIsSyncing(true); try { const active = updatedForms.find(f => f.id === activeFormId); if (active) await saveForm(currentUser.id, active); else await Promise.all(updatedForms.map(f => saveForm(currentUser.id, f))); } finally { setIsSyncing(false); } }, [currentUser, activeFormId]);
  const handlePermanentDelete = useCallback(async (id: string) => { if (!currentUser) return; if (id === LOST_FOUND_ID) return alert("Official registry forms cannot be permanently deleted."); setIsSyncing(true); try { await deleteFormPermanently(id); const updatedForms = currentUser.forms.filter(f => f.id !== id); const updatedUser = { ...currentUser, forms: updatedForms }; setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u)); setCurrentUser(updatedUser); } finally { setIsSyncing(false); } }, [currentUser]);
  const handleDeleteUser = useCallback(async (userId: string) => { if (!currentUser) return; await deleteUserCompletely(userId, currentUser.forms); setUsers(prev => prev.filter(u => u.id !== userId)); setCurrentUser(null); localStorage.removeItem(SESSION_KEY); setCurrentView('dashboard'); window.location.hash = ''; }, [currentUser]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-[#008272] border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#008272]">FORMS PRO Syncing...</p></div>
    </div>
  );

  const isDirectPreview = window.location.hash.startsWith('#preview/');
  const shouldShowAuth = !currentUser && !isDirectPreview;

  if (shouldShowAuth) return <div className="min-h-screen relative overflow-hidden"><Auth onLogin={handleLogin} users={users} onRegister={(u) => { setUsers(prev => [...prev, u]); handleLogin(u); }} onUpdateUser={handleUpdateUser} /><GlobalFooter /></div>;

  return (
    <div className="min-h-screen flex flex-col antialiased relative" style={{ backgroundColor: currentView === 'preview' ? activeForm?.theme?.backgroundColor || '#f3f2f1' : '#f3f2f1' }}>
      {currentView !== 'preview' && (
        <header className="bg-[#008272] px-6 h-12 flex justify-between items-center z-[100] text-white shadow-sm fixed top-0 left-0 w-full transition-all">
          <div className="flex items-center gap-3"><span className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }}>FORMS PRO</span>{isSyncing && <div className="text-[8px] font-black uppercase tracking-widest animate-pulse px-2 bg-white/10 rounded flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Pushing Data...</div>}</div>
          <div className="flex items-center gap-6"><button onClick={() => setCurrentView('settings')} className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Settings</button><button onClick={handleSignOut} className="text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-all">Sign Out</button></div>
        </header>
      )}
      <main className={`flex-grow pb-12 ${currentView !== 'preview' ? 'pt-12' : ''}`}>
        {currentView === 'dashboard' && currentUser && <Dashboard forms={currentUser.forms.filter(f => !f.deletedAt)} onCreate={() => { const f: Form = { id: Math.random().toString(36).substr(2, 9), title: 'Untitled Form', descriptions: [], questions: [], createdAt: new Date().toISOString(), responses: [], isPublished: true }; handleUpdateForms([...currentUser.forms, f]); setActiveFormId(f.id); setCurrentView('editor'); }} onSelect={id => { setActiveFormId(id); setCurrentView('editor'); }} onDelete={id => { if (id === LOST_FOUND_ID) return alert("Official registry forms cannot be archived."); handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: new Date().toISOString()} : f)); }} onDuplicate={f => handleUpdateForms([...currentUser.forms, {...f, id: Math.random().toString(36).substr(2, 9), title: `${f.title} (Copy)`, responses: [], createdAt: new Date().toISOString(), isPublished: false}])} onViewResponses={id => { setActiveFormId(id); setCurrentView('responses'); }} onViewRecycleBin={() => setCurrentView('recycle-bin')} />}
        {currentView === 'editor' && activeForm && <FormEditor form={activeForm} onBack={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }} onPreview={() => { window.location.hash = `preview/${activeForm.id}`; setCurrentView('preview'); }} onViewResponses={() => setCurrentView('responses')} onDelete={() => { if (activeForm.id === LOST_FOUND_ID) return alert("Official registry forms cannot be archived."); if (confirm('Move to Recycle Bin?')) { handleUpdateForms(currentUser!.forms.map(f => f.id === activeForm.id ? {...f, deletedAt: new Date().toISOString()} : f)); setCurrentView('dashboard'); } }} onUpdate={updated => handleUpdateForms(currentUser!.forms.map(f => f.id === updated.id ? updated : f))} />}
        {currentView === 'preview' && (
          <FormPreview 
            form={activeForm} isGuest={!currentUser} onBack={() => { if (currentUser) { setCurrentView('editor'); window.location.hash = ''; } else { window.location.hash = ''; setCurrentView('dashboard'); } }} 
            onSubmit={async (answers) => {
              const fid = activeFormId || activeForm?.id; if (!fid) return 0;
              let lastSN = (activeForm?.responses?.length || 0);
              
              if (fid === LOST_FOUND_ID) {
                // For Lost & Found, we split multi-category reports into individual entries.
                // We must also ensure any newly added custom questions are included in the 'shared' data.
                const categories = Array.isArray(answers['q-category']) ? answers['q-category'] : [answers['q-category']];
                
                // Collect all answers that aren't specific to the multi-entry logic
                const baseAnswers = { ...answers };
                delete baseAnswers['q-category'];
                delete baseAnswers['q-alcohol-details'];
                delete baseAnswers['q-valuable-details'];
                delete baseAnswers['q-non-valuable-details'];

                const submissions = categories.map(cat => {
                  let catKey: any = 'GENERAL';
                  const specific: any = {};
                  if (cat === 'ALCOHOL') { catKey = 'ALCOHOL'; specific['q-alcohol-details'] = answers['q-alcohol-details']; }
                  else if (cat === 'VALUABLE') { catKey = 'VALUABLE'; specific['q-valuable-details'] = answers['q-valuable-details']; }
                  else if (cat === 'NON VALUABLE') { catKey = 'NON_VALUABLE'; specific['q-non-valuable-details'] = answers['q-non-valuable-details']; }
                  
                  lastSN++;
                  return { 
                    id: Math.random().toString(36).substr(2, 9), 
                    formId: fid, 
                    timestamp: new Date().toISOString(), 
                    answers: { ...baseAnswers, ...specific, 'q-category': [cat] }, 
                    serialNumber: lastSN, 
                    category: catKey 
                  };
                });
                
                for (const sub of submissions) await saveResponse(fid, sub);
                return lastSN;
              } else {
                lastSN++;
                const newResponse: FormResponse = { id: Math.random().toString(36).substr(2, 9), formId: fid, timestamp: new Date().toISOString(), answers, serialNumber: lastSN };
                await saveResponse(fid, newResponse); return lastSN;
              }
            }}
          />
        )}
        {currentView === 'responses' && activeForm && <ResponseDashboard form={activeForm} onBack={() => setCurrentView('editor')} onArchiveResponses={async () => { if (!currentUser || !activeForm) return; if (!confirm('Are you sure you want to clear all responses? This will move them to the Recycle Bin archives.')) return; setIsSyncing(true); try { const archive: ResponseArchive = { id: Math.random().toString(36).substr(2, 9), deletedAt: new Date().toISOString(), responses: [...activeForm.responses], formTitle: activeForm.title, formId: activeForm.id }; await clearFormResponses(activeForm.id); const updatedForms = currentUser.forms.map(f => f.id === activeForm.id ? { ...f, responses: [], archivedResponseSets: [...(f.archivedResponseSets || []), archive] } : f); await handleUpdateForms(updatedForms); } finally { setIsSyncing(false); } }} onEditQuestion={() => setCurrentView('editor')} onUpdateForm={f => handleUpdateForms(currentUser!.forms.map(item => item.id === f.id ? f : item))} />}
        {currentView === 'recycle-bin' && currentUser && <RecycleBin forms={currentUser.forms.filter(f => f.deletedAt)} archivedResponses={currentUser.forms.flatMap(f => f.archivedResponseSets || [])} onRestore={id => handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: undefined} : f))} onPermanentDelete={handlePermanentDelete} onRestoreArchive={(fid, aid) => { const f = currentUser.forms.find(x => x.id === fid); const set = f?.archivedResponseSets?.find(s => s.id === aid); if (set) handleUpdateForms(currentUser.forms.map(x => x.id === fid ? {...x, responses: [...x.responses, ...set.responses], archivedResponseSets: x.archivedResponseSets?.filter(s => s.id !== aid)} : x)); }} onDeleteArchivePermanently={(fid, aid) => handleUpdateForms(currentUser.forms.map(x => x.id === fid ? {...x, archivedResponseSets: x.archivedResponseSets?.filter(s => s.id !== aid)} : x))} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'settings' && currentUser && <Settings user={currentUser} onUpdate={handleUpdateUser} onDeleteAccount={handleDeleteUser} onBack={() => setCurrentView('dashboard')} />}
      </main>
      <GlobalFooter />
    </div>
  );
};

export default App;
