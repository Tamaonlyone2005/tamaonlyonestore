
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Lock, User as UserIcon, Upload, Eye, EyeOff, Loader2, Mail } from 'lucide-react';

interface RegisterProps {
  onLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return setError("File size must be less than 1MB.");
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatar) return setError("Please upload an avatar.");
    setLoading(true);
    // AuthService.register now accepts email as the 2nd argument
    const res = await AuthService.register(username, email, password, avatar);
    setLoading(false);
    
    if (res.success) {
      onLogin();
      navigate('/shop');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-md bg-dark-card border border-white/5 p-8 rounded-3xl shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Member</h1>
          <p className="text-gray-400">Create an account to start shopping</p>
        </div>
        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
               <div className="w-24 h-24 rounded-full bg-dark-bg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden hover:border-brand-500 transition-colors">
                 {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Upload className="text-gray-500" size={24} />}
               </div>
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
               <p className="text-center text-xs text-gray-500 mt-2">Upload Avatar</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" placeholder="Username" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" placeholder="name@example.com" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" placeholder="Min 6 chars" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center">
             {loading ? <Loader2 className="animate-spin"/> : "Create Account"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;
