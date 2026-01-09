
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Lock, Mail, Eye, EyeOff, Loader2, Chrome, KeyRound } from 'lucide-react';
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
  
  // Forgot Password State
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

  if (showForgot) {
      return (
          <div className="flex items-center justify-center min-h-[80vh] px-4">
              <div className="w-full max-w-md bg-dark-card border border-white/5 p-8 rounded-3xl shadow-2xl animate-fade-in">
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-400">
                          <KeyRound size={24}/>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                      <p className="text-gray-400 text-sm">Masukkan email Anda. Kami akan mengirimkan link untuk membuat password baru.</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Terdaftar</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
                          <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" placeholder="name@example.com" required />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center">
                        {loading ? <Loader2 className="animate-spin"/> : "Kirim Link Reset"}
                      </button>
                      <button type="button" onClick={() => setShowForgot(false)} className="w-full text-gray-400 hover:text-white text-sm font-bold">
                          Kembali ke Login
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-dark-card border border-white/5 p-8 rounded-3xl shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to access your account</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">{error}</div>}

        <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full mb-6 bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
        >
            <Chrome size={20} className="text-blue-500"/> Sign in with Google
        </button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-card px-2 text-gray-500">Or continue with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" placeholder="Password" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          </div>
          
          <div className="flex justify-end">
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-brand-400 hover:text-brand-300 font-medium">Lupa Password?</button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center">
            {loading ? <Loader2 className="animate-spin"/> : "Sign In"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">Don't have an account? <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Join Member</Link></p>
      </div>
    </div>
  );
};

export default Login;
