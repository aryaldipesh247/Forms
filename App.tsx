import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, View, FormResponse, User, ResponseArchive } from './types';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';
import ResponseDashboard from './components/ResponseDashboard';
import RecycleBin from './components/RecycleBin';
import Auth from './components/Auth';
import Settings from './components/Settings';

const USERS_STORAGE_KEY = 'forms_pro_cloud_sync_v1';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimized hash handler - runs once on mount and then on events
  const handleHashChange = useCallback(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#preview/')) {
      const id = hash.replace('#preview/', '');
      setActiveFormId(id);
      setCurrentView('preview');
    } else if (currentView === 'preview') {
      setCurrentView(currentUser ? 'dashboard' : 'dashboard');
    }
  }, [currentUser, currentView]);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  // Initial data load - single source of truth
  useEffect(() => {
    const loadInitialData = () => {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      let loadedUsers: User[] = [];
      const adminUser: User = {
        id: 'admin-access-jungdai',
        email: 'Jungdai@1', password: 'Jungdai@1', pin: '1111', firstName: 'Admin', lastName: 'Jung', forms: []
      };

      try {
        if (saved) {
          loadedUsers = JSON.parse(saved);
        }
        if (!loadedUsers.find(u => u.email === adminUser.email)) {
          loadedUsers.push(adminUser);
        }
      } catch (e) {
        loadedUsers = [adminUser];
      }

      setUsers(loadedUsers);
      setIsLoading(false);

      // Trigger initial hash check after users are loaded
      const hash = window.location.hash;
      if (hash.startsWith('#preview/')) {
        setActiveFormId(hash.replace('#preview/', ''));
        setCurrentView('preview');
      }
    };
    loadInitialData();
  }, []);

  // Efficient persistence - only save when users actually change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  // High-performance form lookup
  const activeForm = useMemo(() => {
    if (!activeFormId || users.length === 0) return null;
    // Fast path: check current user
    if (currentUser) {
      const f = currentUser.forms.find(f => f.id === activeFormId);
      if (f) return f;
    }
    // Global path: check all users
    return users.flatMap(u => u.forms).find(f => f.id === activeFormId) || null;
  }, [users, currentUser, activeFormId]);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const handleUpdateForms = useCallback((updatedForms: Form[]) => {
    if (!currentUser) return;
    handleUpdateUser({ ...currentUser, forms: updatedForms });
  }, [currentUser, handleUpdateUser]);

  if (isLoading) return null;

  const isDirectPreview = window.location.hash.startsWith('#preview/');
  const shouldShowAuth = !currentUser && currentView !== 'preview' && !isDirectPreview;

  if (shouldShowAuth) {
    return (
      <Auth 
        onLogin={u => { setCurrentUser(u); setCurrentView('dashboard'); window.location.hash = ''; }} 
        users={users} 
        onRegister={u => { setUsers(prev => [...prev, u]); setCurrentUser(u); setCurrentView('dashboard'); }} 
        onUpdateUser={handleUpdateUser} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-[#008272]/20" style={{ backgroundColor: currentView === 'preview' ? activeForm?.theme?.backgroundColor || '#f3f2f1' : '#f3f2f1' }}>
      {currentView !== 'preview' && (
        <header className="bg-[#008272] px-6 h-12 flex justify-between items-center z-[100] text-white shadow-sm sticky top-0 transition-all">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }}>Forms Pro</span>
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
              const owner = users.find(u => u.forms.some(f => f.id === activeFormId)) || currentUser;
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
      
      <div className="fixed bottom-2 right-4 z-[9999] opacity-30 pointer-events-none text-[8px] font-black uppercase tracking-widest">AjD Group | High-Performance Engine</div>
    </div>
  );
};

export default App;