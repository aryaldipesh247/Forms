
import React, { useState } from 'react';
import { User } from '../types';
import { hashPassword } from './Auth';

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
  const [pin, setPin] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<User> = { email, firstName, lastName };
    
    if (pin.length > 0) {
      if (pin.length !== 4 || isNaN(Number(pin))) return alert("PIN must be exactly 4 digits.");
      updates.pin = await hashPassword(pin);
    }
    
    if (password.length > 0) {
      updates.password = await hashPassword(password);
    }

    onUpdate({ ...user, ...updates });
    setMessage('Profile updated successfully!');
    setPin('');
    setPassword('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = () => {
    if (confirm("WARNING: Permanent deletion. All forms and responses will be lost. Continue?")) {
      const finalPin = prompt("Please enter your 4-digit PIN to confirm:");
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
        <h1 className="text-3xl font-black tracking-tight text-[#323130]">User Settings</h1>
      </header>

      <div className="space-y-8">
        <div className="bg-white rounded shadow-xl border border-[#edebe9] overflow-hidden">
          <div className="bg-[#008272] px-8 py-6 text-white">
            <h2 className="text-2xl font-black tracking-tight">Profile Management</h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Manage your secure workspace</p>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded">{message}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global ID</label>
                  <input disabled value={user.id} className="w-full p-3 bg-gray-50 border border-[#edebe9] rounded text-gray-400 text-sm font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-white border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 bg-white border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-3 bg-white border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#008272] uppercase tracking-widest">Update 4-Digit PIN</label>
                  <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" className="w-full p-3 bg-white border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#008272] uppercase tracking-widest">Update Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-white border border-[#edebe9] rounded focus:border-[#008272] text-sm" />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <button type="button" onClick={onBack} className="px-6 py-2.5 rounded font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
               <button type="submit" className="bg-[#008272] text-white px-8 py-2.5 rounded font-black text-xs uppercase tracking-widest shadow-md hover:brightness-110 transition-all">Save Changes</button>
            </div>
          </form>
        </div>

        <div className="bg-red-50 rounded border border-red-100 p-8">
            <h3 className="text-sm font-black text-red-700 uppercase tracking-widest">Danger Zone</h3>
            <p className="text-xs text-red-600 mt-2 font-medium">Removing your account will wipe all forms, responses, and synced data from the cloud permanently.</p>
            <button 
              onClick={handleDelete}
              className="mt-6 border-2 border-red-600 text-red-600 px-6 py-2.5 rounded font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
              Delete Account Forever
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;