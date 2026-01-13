
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';

interface RegisterProps {
  onLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!username || !email || !password) return addToast("Mohon lengkapi data pendaftaran.", "error");
    
    setLoading(true);
    // Default avatar
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const res = await AuthService.register(username, email, password, avatar);
    setLoading(false);

    if (res.success) {
        addToast("Registrasi berhasil! Selamat datang.", "success");
        onLogin();
        navigate('/shop');
    } else {
        addToast(res.message, "error");
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
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Buat Akun Baru</h1>
            <p className="text-gray-400 text-sm">Bergabunglah dengan komunitas kami sekarang.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" 
                        placeholder="Username unik" 
                        required 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" 
                        placeholder="name@example.com" 
                        required 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:bg-black/40 transition-all" 
                        placeholder="Minimal 6 karakter" 
                        required 
                    />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 flex justify-center transform hover:-translate-y-1 active:scale-95 mt-4">
                {loading ? <Loader2 className="animate-spin"/> : "Daftar Sekarang"}
            </button>
        </form>

        <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
                Sudah punya akun? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold hover:underline">Login disini</Link>
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-white transition-colors">
                <ArrowLeft size={14}/> Kembali ke Beranda
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
