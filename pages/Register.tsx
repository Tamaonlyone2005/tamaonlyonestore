
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

interface RegisterProps {
  onLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const navigate = useNavigate();

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
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl animate-fade-in text-center relative overflow-hidden">
        
        {/* Decorative alert icon */}
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-black text-white mb-4">Pendaftaran Ditutup</h1>
        
        <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            Mohon maaf, saat ini pendaftaran akun baru sedang ditutup sementara untuk pengembangan sistem. Silakan cek kembali nanti atau hubungi Admin jika ada keperluan mendesak.
        </p>
        
        <div className="space-y-3">
             <button onClick={() => navigate('/')} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                 <ArrowLeft size={20} /> Kembali ke Beranda
             </button>
             
             <button onClick={() => navigate('/login')} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5">
                 Login (Sudah Punya Akun)
             </button>
        </div>

      </div>
    </div>
  );
};

export default Register;
