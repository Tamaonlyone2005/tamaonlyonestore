import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const JokiService: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
                <AlertTriangle size={64} className="text-gray-600 mx-auto mb-6 opacity-30"/>
                <h1 className="text-3xl font-bold text-white mb-4">Layanan Joki Tidak Tersedia</h1>
                <p className="text-gray-400 mb-8">Fitur ini sedang dinonaktifkan sementara atau dalam masa pemeliharaan.</p>
                
                <button onClick={() => navigate('/')} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 mx-auto transition-all">
                    <ArrowLeft size={18}/> Kembali ke Beranda
                </button>
            </div>
        </div>
    );
};

export default JokiService;