import React, { useState } from 'react';
import { User } from '../types';

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L4.5 4.5m15 15l-5.38-5.38" /></svg>
);

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
  isPassword?: boolean;
  maxLength?: number;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = true, 
  isPassword = false, 
  maxLength, 
  autoComplete 
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input 
          type={isPassword ? (visible ? 'text' : 'password') : type}
          placeholder={placeholder}
          className={`w-full p-3 bg-white/85 backdrop-blur-sm border border-[#edebe9] rounded focus:outline-none focus:border-[#008272] focus:ring-1 focus:ring-[#008272] text-black text-sm transition-all ${isPassword ? 'pr-12' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#008272] focus:outline-none p-1"
            tabIndex={-1}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => void;
  onUpdateUser: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, onRegister, onUpdateUser }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_1' | 'forgot_2' | 'forgot_3'>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const resetForm = () => {
    setError('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setPin('');
    setConfirmPin('');
    setFirstName('');
    setLastName('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.email === email)) {
      setError('Email already exists');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (pin !== confirmPin) {
      setError('PIN numbers do not match');
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError('PIN must be a 4-digit number');
      return;
    }
    const newUser: User = { 
      id: Math.random().toString(36).substr(2, 9),
      email, 
      phone,
      password, 
      pin,
      firstName, 
      lastName, 
      forms: [] 
    };
    onRegister(newUser);
    onLogin(newUser);
  };

  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email || (phone && u.phone === phone));
    if (user) {
      setTargetUser(user);
      setMode('forgot_2');
      setError('');
    } else {
      setError('Account not found');
    }
  };

  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUser && pin === targetUser.pin) {
      setMode('forgot_3');
      setError('');
    } else {
      setError('Incorrect PIN');
    }
  };

  const handleForgotStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (targetUser) {
      const updated = { ...targetUser, password };
      onUpdateUser(updated);
      setMode('login');
      setError('');
      alert('Password successfully changed! Please login.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        <div className="md:w-1/2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <div className="w-16 h-16 bg-[#008272] flex items-center justify-center rounded shadow-lg">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M19,19H5V5H19V19M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z"/></svg>
            </div>
            <h1 className="text-[#008272] text-6xl font-bold tracking-tight">Forms</h1>
          </div>
        </div>

        <div className="md:w-[420px] w-full bg-white/85 backdrop-blur-md p-8 rounded-md shadow-2xl border border-[#edebe9]">
          {error && <div className="mb-4 p-3 bg-red-50/85 border border-red-200 text-red-600 text-xs font-bold rounded animate-pulse">{error}</div>}
          
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="email@example.com" autoComplete="username" />
              <InputField label="Password" isPassword={true} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
              <button type="submit" className="w-full bg-[#008272] text-white py-3.5 rounded font-bold text-lg hover:bg-[#006a5d] transition-all shadow-md active:scale-95">Sign In</button>
              <div className="text-center">
                <button type="button" onClick={() => { setMode('forgot_1'); resetForm(); }} className="text-[#008272] text-xs font-bold hover:underline">Forgot your password?</button>
              </div>
              <hr className="border-[#edebe9]" />
              <button type="button" onClick={() => { setMode('register'); resetForm(); }} className="w-full border border-[#edebe9] text-gray-700 py-3 rounded font-bold text-sm hover:bg-gray-50 transition-all">Create new account</button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-black">Sign Up</h2>
                <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="text-gray-400 hover:text-black text-2xl transition-colors">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First Name" type="text" value={firstName} onChange={setFirstName} placeholder="John" autoComplete="given-name" />
                <InputField label="Last Name" type="text" value={lastName} onChange={setLastName} placeholder="Doe" autoComplete="family-name" />
              </div>
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" autoComplete="email" />
              <InputField label="Phone (Optional)" type="tel" value={phone} onChange={setPhone} placeholder="+123456789" required={false} autoComplete="tel" />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Password" isPassword={true} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" />
                <InputField label="Retype Password" isPassword={true} value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="4-Digit PIN" type="text" value={pin} onChange={setPin} placeholder="1234" maxLength={4} autoComplete="off" />
                <InputField label="Retype PIN" type="text" value={confirmPin} onChange={setConfirmPin} placeholder="1234" maxLength={4} autoComplete="off" />
              </div>
              <button type="submit" className="w-full bg-[#008272] text-white py-3.5 rounded font-bold text-lg hover:bg-[#006a5d] mt-2 transition-all active:scale-95 shadow-md">Create Account</button>
              <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="w-full text-xs font-bold text-[#008272] hover:underline text-center block mt-2 uppercase tracking-widest">Back to Login</button>
            </form>
          )}

          {mode === 'forgot_1' && (
            <form onSubmit={handleForgotStep1} className="space-y-4">
              <h2 className="text-xl font-bold text-black">Reset Password</h2>
              <p className="text-xs text-gray-500">Enter your registered Email or Phone number.</p>
              <InputField label="Email or Phone" type="text" value={email} onChange={setEmail} placeholder="Enter identifier" autoComplete="username" />
              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="flex-1 bg-gray-100/85 py-2.5 rounded font-bold text-xs text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-[#008272] text-white py-2.5 rounded font-bold text-xs hover:bg-[#006a5d] transition-all">Continue</button>
              </div>
              <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="w-full text-xs font-bold text-[#008272] hover:underline text-center block mt-2 uppercase tracking-widest">Back to Login</button>
            </form>
          )}

          {mode === 'forgot_2' && (
            <form onSubmit={handleForgotStep2} className="space-y-4">
              <h2 className="text-xl font-bold text-black">Verify Identity</h2>
              <p className="text-xs text-gray-500">Enter the 4-digit PIN you created during sign up.</p>
              <InputField label="4-Digit PIN" type="text" value={pin} onChange={setPin} placeholder="••••" maxLength={4} autoComplete="one-time-code" />
              <button type="submit" className="w-full bg-[#008272] text-white py-3 rounded font-bold text-sm hover:bg-[#006a5d] transition-all">Verify PIN</button>
              <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="w-full text-xs font-bold text-[#008272] hover:underline text-center block mt-2 uppercase tracking-widest">Back to Login</button>
            </form>
          )}

          {mode === 'forgot_3' && (
            <form onSubmit={handleForgotStep3} className="space-y-4">
              <h2 className="text-xl font-bold text-black">Create New Password</h2>
              <InputField label="New Password" isPassword={true} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" />
              <InputField label="Retype Password" isPassword={true} value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" autoComplete="new-password" />
              <button type="submit" className="w-full bg-[#008272] text-white py-3 rounded font-bold text-sm hover:bg-[#006a5d] transition-all">Change Password</button>
              <button type="button" onClick={() => { setMode('login'); resetForm(); }} className="w-full text-xs font-bold text-[#008272] hover:underline text-center block mt-2 uppercase tracking-widest">Back to Login</button>
            </form>
          )}
        </div>
      </div>
      
      <footer className="mt-20 w-full max-w-5xl text-gray-500 text-[11px] border-t border-[#edebe9] pt-8">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex gap-4">
            <span>© 2026 Forms Service</span>
            <span className="hover:underline cursor-pointer">Privacy & Cookies</span>
            <span className="hover:underline cursor-pointer">Terms of Use</span>
          </div>
          <div className="flex gap-4">
            <span>English (US)</span>
            <span className="hover:underline cursor-pointer">Support</span>
            <span className="hover:underline cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;