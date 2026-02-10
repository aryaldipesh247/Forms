
import React, { useState } from 'react';
import { User } from '../types';

interface SettingsProps {
  user: User;
  onUpdate: (user: User) => void;
  onDeleteAccount: (userId: string) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate, onDeleteAccount, onBack }) => {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [pin, setPin] = useState(user.pin);
  const [password, setPassword] = useState(user.password);
  const [message, setMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...user, email, firstName, lastName, pin, password });
    setMessage('Changes saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = () => {
    if (confirm("WARNING: Are you sure you want to delete your account? This will permanently remove all your forms and response data. This action cannot be undone.")) {
      const finalPin = prompt("Please enter your 4-digit PIN to confirm deletion:");
      // We allow the callback to proceed if they interact with the prompt.
      // In a real app, we'd verify this against the hashed pin.
      if (finalPin) {
        onDeleteAccount(user.id);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-[#edebe9] rounded-full text-[#008272]">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-3xl font-black tracking-tight text-[#323130]">Settings</h1>
      </header>

      <div className="space-y-8">
        <div className="bg-white/85 backdrop-blur-md rounded-md shadow-xl border border-[#edebe9] overflow-hidden">
          <div className="bg-[#008272]/85 backdrop-blur-sm px-8 py-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Account Management</p>
            <h2 className="text-2xl font-black">User Profile</h2>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            {message && <div className="p-3 bg-green-50/85 backdrop-blur-sm border border-green-200 text-green-700 text-xs font-bold rounded">{message}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">User ID</label>
                  <input disabled value={user.id} className="w-full p-3 bg-gray-50/85 backdrop-blur-sm border border-[#edebe9] rounded text-gray-400 text-sm font-bold" />
                  <p className="text-[9px] text-gray-400">User ID cannot be changed manually.</p>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Update PIN (4-Digits)</label>
                  <input type="text" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:border-[#008272] text-sm font-black tracking-[0.5em]" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Update Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <button type="button" onClick={onBack} className="px-6 py-2.5 rounded font-bold text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
               <button type="submit" className="bg-[#008272] text-white px-8 py-2.5 rounded font-bold text-sm shadow-md hover:bg-[#006a5d] transition-all">Save Changes</button>
            </div>
          </form>
        </div>

        <div className="bg-red-50/50 backdrop-blur-md rounded-md border border-red-100 overflow-hidden">
          <div className="px-8 py-6">
            <h3 className="text-lg font-black text-red-700 uppercase tracking-widest">Danger Zone</h3>
            <p className="text-xs font-bold text-red-600/70 mt-1 uppercase tracking-wider">Account Deletion</p>
            <p className="text-sm text-red-600 mt-4 leading-relaxed font-medium">
              Deleting your account is permanent and will remove all associated forms, response data, and settings from our global synchronization engine.
            </p>
            <button 
              onClick={handleDelete}
              className="mt-6 border-2 border-red-600 text-red-600 px-8 py-3 rounded font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              Delete My Account Completely
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
