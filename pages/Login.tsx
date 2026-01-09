
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Lock, Mail, Eye, EyeOff, Loader2, Chrome, KeyRound, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await AuthService.login(email, password);
    setLoading(false);
    
    if (res.success) {
      onLogin();
      if (res.user?.role === 'ADMIN') navigate('/admin');
      else navigate('/shop');
    } else {
      setError(res.message);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await AuthService.loginWithGoogle();
    setLoading(false);

    if (res.success) {
        onLogin();
        navigate('/shop');
    } else {
        setError(res.message);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const res = await AuthService.resetPassword(resetEmail);
      setLoading(false);
      
      if(res.success) {
          addToast(res.message, "success");
          setShowForgot(false);
      } else {
          addToast(res.message, "error");
      }
  };

  // BACKGROUND PARTICLES & GLASS STYLE
  const Background = () => (
      <div className="absolute inset-0 overflow-hidden -z-10 bg-[#0f172a]">
          {/* Animated Blobs */}
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>
  );

  if (showForgot) {
      return (
          <div className="flex items-center justify-center min-h-[90vh] px-4 relative">
              <Background />
              <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl animate-slide-up">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                          <KeyRound size={28}/>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                      <p className="text-gray-400 text-sm">Masukkan email untuk memulihkan akses akun Anda.</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                          <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="name@example.com" required />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/20 flex justify-center hover:scale-[1.02] active:scale-95">
                        {loading ? <Loader2 className="animate-spin"/> : "Kirim Link Reset"}
                      </button>
                      <button type="button" onClick={() => setShowForgot(false)} className="w-full text-gray-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2">
                          <ArrowLeft size={16}/> Kembali ke Login
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 relative py-12">
      <Background />
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Decorative shine */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 font-medium">Masuk untuk melanjutkan belanja</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm text-center font-bold animate-pulse">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors z-10" size={20} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="relative z-10 w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="name@example.com" required />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-brand-400 hover:text-brand-300 font-bold hover:underline">Lupa Password?</button>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors z-10" size={20} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="relative z-10 w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white z-10">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/30 flex justify-center transform hover:-translate-y-1 active:scale-95">
            {loading ? <Loader2 className="animate-spin"/> : "Sign In"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
            <span className="text-gray-500 text-xs font-bold uppercase">Or</span>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
        </div>

        <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full bg-white text-gray-900 font-bold py-3.5 rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]"
        >
            <Chrome size={20} className="text-blue-600"/> Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
            Belum punya akun? <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold underline decoration-brand-500/30">Daftar Member</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
