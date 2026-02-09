
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, View, FormResponse, User, ResponseArchive } from './types';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';
import ResponseDashboard from './components/ResponseDashboard';
import RecycleBin from './components/RecycleBin';
import Auth, { hashPassword } from './components/Auth';
import Settings from './components/Settings';
import { saveDatabase, loadDatabase } from './services/databaseService';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleHashChange = useCallback(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#preview/')) {
      const id = hash.replace('#preview/', '');
      setActiveFormId(id);
      setCurrentView('preview');
    } else if (currentView === 'preview') {
      setCurrentView('dashboard');
    }
  }, [currentView]);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  // Initial load: Fetch global state from Cloudinary
  useEffect(() => {
    const init = async () => {
      const loadedUsers = await loadDatabase();
      
      // Default Admin Account
      const adminEmail = 'Jungdai@1';
      const adminSecret = 'Jungdai@1';
      const adminPin = '1111';
      
      if (!loadedUsers.find(u => u.email === adminEmail)) {
        const hashedPassword = await hashPassword(adminSecret);
        const hashedPin = await hashPassword(adminPin);
        
        loadedUsers.push({
          id: 'admin-access-jungdai',
          email: adminEmail,
          password: hashedPassword,
          pin: hashedPin,
          firstName: 'Admin',
          lastName: 'Jung',
          forms: []
        });
      }

      setUsers(loadedUsers);
      setIsLoading(false);

      const hash = window.location.hash;
      if (hash.startsWith('#preview/')) {
        setActiveFormId(hash.replace('#preview/', ''));
        setCurrentView('preview');
      }
    };
    init();
  }, []);

  // Sync cycle: Triggers whenever users are updated
  useEffect(() => {
    if (!isLoading && isDirty && users.length > 0) {
      const sync = async () => {
        setIsSyncing(true);
        await saveDatabase(users);
        setIsSyncing(false);
        setIsDirty(false);
      };
      sync();
    }
  }, [users, isLoading, isDirty]);

  // Multi-device active form lookup: Searches all users for the specific form ID
  const activeForm = useMemo(() => {
    if (!activeFormId || users.length === 0) return null;
    return users.flatMap(u => u.forms).find(f => f.id === activeFormId) || null;
  }, [users, activeFormId]);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === updatedUser.id);
      if (exists) {
        return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
      }
      return [...prev, updatedUser];
    });
    setIsDirty(true);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const handleUpdateForms = useCallback((updatedForms: Form[]) => {
    if (!currentUser) return;
    handleUpdateUser({ ...currentUser, forms: updatedForms });
  }, [currentUser, handleUpdateUser]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#008272] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#008272]">Forms PRO Syncing...</p>
      </div>
    </div>
  );

  const isDirectPreview = window.location.hash.startsWith('#preview/');
  const shouldShowAuth = !currentUser && currentView !== 'preview' && !isDirectPreview;

  if (shouldShowAuth) {
    return (
      <Auth 
        onLogin={u => { 
          // Always re-fetch the latest data for this specific user from global state
          const globalStateUser = users.find(gu => gu.id === u.id) || u;
          setCurrentUser(globalStateUser); 
          setCurrentView('dashboard'); 
          window.location.hash = ''; 
        }} 
        users={users} 
        onRegister={u => { 
          setUsers(prev => [...prev, u]); 
          setCurrentUser(u); 
          setIsDirty(true);
          setCurrentView('dashboard'); 
        }} 
        onUpdateUser={handleUpdateUser} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-[#008272]/20" style={{ backgroundColor: currentView === 'preview' ? activeForm?.theme?.backgroundColor || '#f3f2f1' : '#f3f2f1' }}>
      {currentView !== 'preview' && (
        <header className="bg-[#008272] px-6 h-12 flex justify-between items-center z-[100] text-white shadow-sm sticky top-0 transition-all">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }}>Forms PRO</span>
            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Global Sync</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('settings')} className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Settings</button>
            <button onClick={() => { setCurrentUser(null); setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }} className="text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-all">Sign Out</button>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            forms={currentUser.forms.filter(f => !f.deletedAt)} 
            onCreate={() => {
              const f: Form = { id: Math.random().toString(36).substr(2, 9), title: 'Untitled Form', descriptions: [], questions: [], createdAt: new Date().toISOString(), responses: [], isPublished: false };
              handleUpdateForms([...currentUser.forms, f]);
              setActiveFormId(f.id); 
              setCurrentView('editor');
            }}
            onSelect={id => { setActiveFormId(id); setCurrentView('editor'); }}
            onDelete={id => handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: new Date().toISOString()} : f))}
            onDuplicate={f => handleUpdateForms([...currentUser.forms, {...f, id: Math.random().toString(36).substr(2, 9), title: `${f.title} (Copy)`, responses: [], createdAt: new Date().toISOString(), isPublished: false}])}
            onViewResponses={id => { setActiveFormId(id); setCurrentView('responses'); }} 
            onViewRecycleBin={() => setCurrentView('recycle-bin')}
          />
        )}
        
        {currentView === 'editor' && activeForm && (
          <FormEditor 
            form={activeForm} 
            onBack={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }} 
            onPreview={() => { window.location.hash = `preview/${activeForm.id}`; setCurrentView('preview'); }}
            onViewResponses={() => setCurrentView('responses')} 
            onDelete={() => { if (confirm('Move to Recycle Bin?')) { handleUpdateForms(currentUser!.forms.map(f => f.id === activeForm.id ? {...f, deletedAt: new Date().toISOString()} : f)); setCurrentView('dashboard'); } }} 
            onUpdate={updated => handleUpdateForms(currentUser!.forms.map(f => f.id === updated.id ? updated : f))}
          />
        )}

        {currentView === 'preview' && (
          <FormPreview 
            form={activeForm} 
            isGuest={!currentUser}
            onBack={() => { if (currentUser) { setCurrentView('editor'); window.location.hash = ''; } else { window.location.hash = ''; setCurrentView('dashboard'); } }} 
            onSubmit={answers => {
              // Find the TRUE owner of the form from the global user list
              const owner = users.find(u => u.forms.some(f => f.id === activeFormId));
              if (!owner) return 0;
              let sn = 1;
              const updatedForms = owner.forms.map(f => {
                if (f.id === activeFormId) { 
                  sn = f.responses.length + 1; 
                  return { ...f, responses: [...f.responses, { id: Math.random().toString(36).substr(2, 9), formId: f.id, timestamp: new Date().toISOString(), answers, serialNumber: sn }] }; 
                }
                return f;
              });
              handleUpdateUser({ ...owner, forms: updatedForms }); 
              return sn;
            }}
          />
        )}

        {currentView === 'responses' && activeForm && (
          <ResponseDashboard form={activeForm} onBack={() => setCurrentView('editor')} onArchiveResponses={() => {
            if (!currentUser) return;
            const archive: ResponseArchive = { id: Math.random().toString(36).substr(2, 9), deletedAt: new Date().toISOString(), responses: [...activeForm.responses], formTitle: activeForm.title, formId: activeForm.id };
            handleUpdateForms(currentUser.forms.map(f => f.id === activeForm.id ? { ...f, responses: [], archivedResponseSets: [...(f.archivedResponseSets || []), archive] } : f));
          }} onEditQuestion={() => setCurrentView('editor')} onUpdateForm={f => handleUpdateForms(currentUser!.forms.map(item => item.id === f.id ? f : item))} />
        )}

        {currentView === 'recycle-bin' && currentUser && (
          <RecycleBin forms={currentUser.forms.filter(f => f.deletedAt)} archivedResponses={currentUser.forms.flatMap(f => f.archivedResponseSets || [])} onRestore={id => handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: undefined} : f))} onPermanentDelete={id => handleUpdateForms(currentUser.forms.filter(f => f.id !== id))} onRestoreArchive={(fid, aid) => { const f = currentUser.forms.find(x => x.id === fid); const set = f?.archivedResponseSets?.find(s => s.id === aid); if (set) handleUpdateForms(currentUser.forms.map(x => x.id === fid ? {...x, responses: [...x.responses, ...set.responses], archivedResponseSets: x.archivedResponseSets?.filter(s => s.id !== aid)} : x)); }} onDeleteArchivePermanently={(fid, aid) => handleUpdateForms(currentUser.forms.map(x => x.id === fid ? {...x, archivedResponseSets: x.archivedResponseSets?.filter(s => s.id !== aid)} : x))} onBack={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'settings' && currentUser && <Settings user={currentUser} onUpdate={handleUpdateUser} onBack={() => setCurrentView('dashboard')} />}
      </main>
    </div>
  );
};

export default App;
