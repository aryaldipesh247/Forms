import React, { useState, useEffect } from 'react';
import { Form, View, FormResponse, User, ResponseArchive } from './types';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';
import ResponseDashboard from './components/ResponseDashboard';
import RecycleBin from './components/RecycleBin';
import Auth from './components/Auth';
import Settings from './components/Settings';

const USERS_STORAGE_KEY = 'forms_users_v11';

const App: React.FC = () => {
  const getInitialView = (): { view: View; id: string | null } => {
    const hash = window.location.hash;
    if (hash.startsWith('#preview/')) {
      return { view: 'preview', id: hash.replace('#preview/', '') };
    }
    return { view: 'dashboard', id: null };
  };

  const initial = getInitialView();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(initial.view);
  const [activeFormId, setActiveFormId] = useState<string | null>(initial.id);

  useEffect(() => {
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
    
    if (currentView === 'preview' && activeFormId) {
      const allForms = currentUsers.flatMap(u => u.forms);
      const exists = allForms.some(f => f.id === activeFormId);
      if (!exists) {
        setCurrentView('dashboard');
        setActiveFormId(null);
      }
    }

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#preview/')) {
        const id = hash.replace('#preview/', '');
        setActiveFormId(id); 
        setCurrentView('preview');
      } else if (hash === '' || hash === '#') {
        if (!currentUser) setCurrentView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    if (currentUser && currentUser.id === updatedUser.id) setCurrentUser(updatedUser);
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

  const activeForm = users.flatMap(u => u.forms).find(f => f.id === activeFormId) || null;

  if (!currentUser && currentView !== 'preview') {
    return (
      <Auth 
        onLogin={u => { setCurrentUser(u); setCurrentView('dashboard'); window.location.hash = ''; }} 
        users={users} 
        onRegister={u => setUsers([...users, u])} 
        onUpdateUser={handleUpdateUser} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: currentView === 'preview' ? activeForm?.theme?.backgroundColor : '#f3f2f1' }}>
      {currentView !== 'preview' && (
        <header className="bg-[#008272] px-6 h-12 flex justify-between items-center z-50 text-white shadow sticky top-0">
          <div className="flex items-center gap-3">
            <span 
              className="font-bold text-xl cursor-pointer hover:opacity-90" 
              onClick={() => { setCurrentView('dashboard'); window.location.hash = ''; }}
            >
              Forms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('settings')} className="text-xs font-bold uppercase tracking-widest hover:opacity-80">Settings</button>
            <button onClick={() => { setCurrentUser(null); setCurrentView('dashboard'); window.location.hash = ''; }} className="text-[10px] font-black uppercase bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-colors">Log Out</button>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            forms={currentUser.forms.filter(f => !f.deletedAt)} 
            onCreate={() => {
              const f: Form = { id: Math.random().toString(36).substr(2, 9), title: 'Untitled Form', descriptions: [], questions: [], createdAt: new Date().toISOString(), responses: [] };
              handleUpdateForms([...currentUser.forms, f]);
              setActiveFormId(f.id); setCurrentView('editor');
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
            form={activeForm} onBack={() => { setCurrentView('dashboard'); window.location.hash = ''; }} onPreview={() => { setCurrentView('preview'); window.location.hash = `preview/${activeForm.id}`; }}
            onViewResponses={() => setCurrentView('responses')} 
            onDelete={() => {
              if (window.confirm('Are you sure you want to move this form to the Recycle Bin?')) {
                handleUpdateForms(currentUser!.forms.map(f => f.id === activeForm.id ? {...f, deletedAt: new Date().toISOString()} : f));
                setCurrentView('dashboard');
              }
            }} 
            onUpdate={updated => handleUpdateForms(currentUser!.forms.map(f => f.id === updated.id ? updated : f))}
          />
        )}
        {currentView === 'preview' && activeForm && (
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
              const owner = users.find(u => u.forms.some(f => f.id === activeForm.id))!;
              let sn = 1;
              const uUser = { ...owner, forms: owner.forms.map(f => {
                if (f.id === activeForm.id) { 
                  sn = f.responses.length + 1; 
                  return { ...f, responses: [...f.responses, { id: Math.random().toString(36).substr(2, 9), formId: f.id, timestamp: new Date().toISOString(), answers, serialNumber: sn }] }; 
                }
                return f;
              })};
              handleUpdateUser(uUser); 
              return sn;
            }}
          />
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