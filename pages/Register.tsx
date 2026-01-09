
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Lock, User as UserIcon, Upload, Eye, EyeOff, Loader2, Mail, Camera } from 'lucide-react';

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
    const res = await AuthService.register(username, email, password, avatar);
    setLoading(false);
    
    if (res.success) {
      onLogin();
      navigate('/shop');
    } else {
      setError(res.message);
    }
  };

  // BACKGROUND PARTICLES
  const Background = () => (
      <div className="absolute inset-0 overflow-hidden -z-10 bg-[#0f172a]">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-blob"></div>
          <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-brand-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>
  );

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-12 relative">
      <Background />
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-fade-in relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Join Member</h1>
          <p className="text-gray-400 font-medium">Buat akun untuk mulai berbelanja</p>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm text-center font-bold animate-pulse">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-pointer">
               <div className={`w-28 h-28 rounded-full bg-black/30 border-2 ${avatar ? 'border-brand-500' : 'border-dashed border-gray-600'} flex items-center justify-center overflow-hidden group-hover:border-brand-400 transition-all shadow-xl`}>
                 {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Upload className="text-gray-500 group-hover:text-brand-400 transition-colors" size={32} />}
               </div>
               <div className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                   <Camera size={16}/>
               </div>
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="Username" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="name@example.com" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="Min 6 chars" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/30 flex justify-center transform hover:-translate-y-1 active:scale-95">
             {loading ? <Loader2 className="animate-spin"/> : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
            Sudah punya akun? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold underline decoration-brand-500/30">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
