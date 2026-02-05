import React, { useState, useEffect, useMemo } from 'react';
import { Form, View, FormResponse, User, ResponseArchive } from './types';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';
import ResponseDashboard from './components/ResponseDashboard';
import RecycleBin from './components/RecycleBin';
import Auth from './components/Auth';
import Settings from './components/Settings';

// Unified storage key to match the cloud simulation in services
const USERS_STORAGE_KEY = 'forms_pro_cloud_sync_v1';

const App: React.FC = () => {
  const getInitialViewFromHash = (): { view: View; id: string | null } => {
    const hash = window.location.hash;
    if (hash.startsWith('#preview/')) {
      return { view: 'preview', id: hash.replace('#preview/', '') };
    }
    return { view: 'dashboard', id: null };
  };

  const initial = getInitialViewFromHash();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(initial.view);
  const [activeFormId, setActiveFormId] = useState<string | null>(initial.id);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize hash changes with the application state
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#preview/')) {
        const id = hash.replace('#preview/', '');
        setActiveFormId(id); 
        setCurrentView('preview');
      } else if (hash === '' || hash === '#') {
        // Only return to dashboard if we aren't already there and no other view is explicitly set
        if (!currentUser && currentView !== 'dashboard' && !hash.includes('#preview/')) {
          setCurrentView('dashboard');
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Initial check
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser, currentView]);

  // Load data from simulated cloud storage
  useEffect(() => {
    const loadUsers = () => {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      let currentUsers: User[] = [];
      
      const adminUser: User = {
        id: 'admin-access-jungdai',
        email: 'Jungdai@1', password: 'Jungdai@1', pin: '1111', firstName: 'Admin', lastName: 'Jung', forms: []
      };

      if (saved) {
        try {
          currentUsers = JSON.parse(saved);
          if (!currentUsers.find(u => u.email === adminUser.email)) currentUsers.push(adminUser);
        } catch (e) {
          currentUsers = [adminUser];
        }
      } else {
        currentUsers = [adminUser];
      }
      
      setUsers(currentUsers);
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  // Persist user state changes to storage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  // Compute the active form based on ID and user context
  const activeForm = useMemo(() => {
    if (!activeFormId) return null;
    
    // Check currently logged in user first for fast updates
    if (currentUser) {
      const localForm = currentUser.forms.find(f => f.id === activeFormId);
      if (localForm) return localForm;
    }

    // Comprehensive search across all stored users (critical for guest preview links)
    const globalForm = users.flatMap(u => u.forms).find(f => f.id === activeFormId);
    return globalForm || null;
  }, [users, currentUser, activeFormId]);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prevUsers => {
      const exists = prevUsers.some(u => u.id === updatedUser.id);
      if (exists) {
        return prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
      }
      return [...prevUsers, updatedUser];
    });
    
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleUpdateForms = (updatedForms: Form[]) => {
    if (!currentUser) return;
    handleUpdateUser({ ...currentUser, forms: updatedForms });
  };

  const handleArchiveResponses = (formId: string) => {
    if (!currentUser) return;
    const form = currentUser.forms.find(f => f.id === formId);
    if (!form || form.responses.length === 0) return;

    const archive: ResponseArchive = {
      id: Math.random().toString(36).substr(2, 9),
      deletedAt: new Date().toISOString(),
      responses: [...form.responses],
      formTitle: form.title,
      formId: form.id
    };

    const updatedForms = currentUser.forms.map(f => {
      if (f.id === formId) {
        return {
          ...f,
          responses: [],
          archivedResponseSets: [...(f.archivedResponseSets || []), archive]
        };
      }
      return f;
    });
    handleUpdateForms(updatedForms);
  };

  const handleRestoreArchive = (formId: string, archiveId: string) => {
    if (!currentUser) return;
    const updatedForms = currentUser.forms.map(f => {
      if (f.id === formId) {
        const set = f.archivedResponseSets?.find(s => s.id === archiveId);
        if (set) {
          return {
            ...f,
            responses: [...f.responses, ...set.responses],
            archivedResponseSets: f.archivedResponseSets?.filter(s => s.id !== archiveId)
          };
        }
      }
      return f;
    });
    handleUpdateForms(updatedForms);
  };

  const handleDeleteArchivePermanently = (formId: string, archiveId: string) => {
    if (!currentUser) return;
    const updatedForms = currentUser.forms.map(f => {
      if (f.id === formId) {
        return { ...f, archivedResponseSets: f.archivedResponseSets?.filter(s => s.id !== archiveId) };
      }
      return f;
    });
    handleUpdateForms(updatedForms);
  };

  const handleDuplicateForm = (formToDup: Form) => {
    if (!currentUser) return;
    const duplicated: Form = {
      ...formToDup,
      id: Math.random().toString(36).substr(2, 9),
      title: `${formToDup.title} (Copy)`,
      responses: [],
      createdAt: new Date().toISOString(),
      deletedAt: undefined,
      archivedResponseSets: []
    };
    handleUpdateForms([...currentUser.forms, duplicated]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
        <div className="text-[#008272] font-black uppercase tracking-widest text-xs animate-pulse">
          Initializing Cloud Sync...
        </div>
      </div>
    );
  }

  // Determine if we should bypass the login screen for a direct preview
  const isDirectPreview = window.location.hash.startsWith('#preview/');
  const shouldShowAuth = !currentUser && currentView !== 'preview' && !isDirectPreview;

  if (shouldShowAuth) {
    return (
      <Auth 
        onLogin={u => { 
          setCurrentUser(u); 
          setCurrentView('dashboard'); 
          window.location.hash = ''; 
        }} 
        users={users} 
        onRegister={u => setUsers(prev => [...prev, u])} 
        onUpdateUser={handleUpdateUser} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: currentView === 'preview' ? activeForm?.theme?.backgroundColor || '#f3f2f1' : '#f3f2f1' }}>
      {currentView !== 'preview' && (
        <header className="bg-[#008272] px-6 h-12 flex justify-between items-center z-50 text-white shadow sticky top-0">
          <div className="flex items-center gap-3">
            <span 
              className="font-bold text-xl cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => { 
                setCurrentView('dashboard'); 
                window.location.hash = ''; 
                setActiveFormId(null); 
              }}
            >
              Forms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('settings')} className="text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">Settings</button>
            <button 
              onClick={() => { 
                setCurrentUser(null); 
                setCurrentView('dashboard'); 
                window.location.hash = ''; 
                setActiveFormId(null); 
              }} 
              className="text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-colors"
            >
              Log Out
            </button>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            forms={currentUser.forms.filter(f => !f.deletedAt)} 
            onCreate={() => {
              const f: Form = { 
                id: Math.random().toString(36).substr(2, 9), 
                title: 'Untitled Form', 
                descriptions: [], 
                questions: [], 
                createdAt: new Date().toISOString(), 
                responses: [] 
              };
              const updatedForms = [...currentUser.forms, f];
              handleUpdateForms(updatedForms);
              setActiveFormId(f.id); 
              setCurrentView('editor');
            }}
            onSelect={id => { setActiveFormId(id); setCurrentView('editor'); }}
            onDelete={id => handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: new Date().toISOString()} : f))}
            onDuplicate={handleDuplicateForm}
            onViewResponses={id => { setActiveFormId(id); setCurrentView('responses'); }} 
            onViewRecycleBin={() => setCurrentView('recycle-bin')}
          />
        )}
        {currentView === 'editor' && activeForm && (
          <FormEditor 
            form={activeForm} 
            onBack={() => { setCurrentView('dashboard'); window.location.hash = ''; setActiveFormId(null); }} 
            onPreview={() => { 
              window.location.hash = `preview/${activeForm.id}`;
              setCurrentView('preview'); 
            }}
            onViewResponses={() => setCurrentView('responses')} 
            onDelete={() => {
              if (window.confirm('Are you sure you want to move this form to the Recycle Bin?')) {
                handleUpdateForms(currentUser!.forms.map(f => f.id === activeForm.id ? {...f, deletedAt: new Date().toISOString()} : f));
                setCurrentView('dashboard');
                setActiveFormId(null);
              }
            }} 
            onUpdate={updated => handleUpdateForms(currentUser!.forms.map(f => f.id === updated.id ? updated : f))}
          />
        )}
        {currentView === 'preview' && (
          activeForm ? (
            <FormPreview 
              form={activeForm} 
              isGuest={!currentUser}
              onBack={() => {
                if (currentUser) {
                  setCurrentView('editor');
                  window.location.hash = '';
                } else {
                  setCurrentView('dashboard'); 
                }
              }} 
              onSubmit={answers => {
                const owner = users.find(u => u.forms.some(f => f.id === activeForm.id)) || currentUser!;
                let sn = 1;
                const updatedForms = owner.forms.map(f => {
                  if (f.id === activeForm.id) { 
                    sn = f.responses.length + 1; 
                    return { ...f, responses: [...f.responses, { id: Math.random().toString(36).substr(2, 9), formId: f.id, timestamp: new Date().toISOString(), answers, serialNumber: sn }] }; 
                  }
                  return f;
                });
                handleUpdateUser({ ...owner, forms: updatedForms }); 
                return sn;
              }}
            />
          ) : (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f2f1]">
              <div className="bg-white p-12 rounded-xl shadow-xl text-center max-w-sm animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-black text-red-500 mb-2">Form Not Found</h2>
                <p className="text-gray-500 text-sm mb-6">The form you are looking for doesn't exist or has been deleted by the owner.</p>
                <button 
                  onClick={() => { 
                    window.location.hash = ''; 
                    setCurrentView('dashboard'); 
                    setActiveFormId(null); 
                  }} 
                  className="w-full bg-[#008272] text-white py-3 rounded font-bold uppercase text-xs tracking-widest hover:brightness-110 shadow-lg active:scale-95 transition-all"
                >
                  Return Home
                </button>
              </div>
            </div>
          )
        )}
        {currentView === 'responses' && activeForm && (
          <ResponseDashboard 
            form={activeForm} onBack={() => setCurrentView('editor')} 
            onArchiveResponses={() => handleArchiveResponses(activeForm.id)}
            onEditQuestion={() => setCurrentView('editor')}
            onUpdateForm={f => handleUpdateForms(currentUser!.forms.map(item => item.id === f.id ? f : item))}
          />
        )}
        {currentView === 'recycle-bin' && currentUser && (
          <RecycleBin 
            forms={currentUser.forms.filter(f => f.deletedAt)} 
            archivedResponses={currentUser.forms.flatMap(f => f.archivedResponseSets || [])}
            onRestore={id => handleUpdateForms(currentUser.forms.map(f => f.id === id ? {...f, deletedAt: undefined} : f))}
            onPermanentDelete={id => handleUpdateForms(currentUser.forms.filter(f => f.id !== id))}
            onRestoreArchive={handleRestoreArchive}
            onDeleteArchivePermanently={handleDeleteArchivePermanently}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'settings' && currentUser && <Settings user={currentUser} onUpdate={handleUpdateUser} onBack={() => setCurrentView('dashboard')} />}
      </main>
      <div className="fixed bottom-2 right-4 z-[9999] opacity-30 pointer-events-none text-[8px] font-bold">AjD Group Of Company | Designed By Dipesh Jung Aryal</div>
    </div>
  );
};

export default App;