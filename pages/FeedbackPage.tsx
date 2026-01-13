
import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Feedback } from '../types';
import { useToast } from '../components/Toast';
import { Send, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeedbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || !message.trim()) return addToast("Mohon lengkapi formulir.", "error");

        setLoading(true);
        const feedback: Feedback = {
            id: Date.now().toString(),
            name: name,
            message: message,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        await StorageService.createFeedback(feedback);
        setLoading(false);
        setName('');
        setMessage('');
        addToast("Terima kasih atas masukan Anda!", "success");
        setTimeout(() => navigate('/'), 1500);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#1e293b] rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden animate-fade-in">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm font-bold">
                    <ArrowLeft size={16}/> Kembali
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32}/>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Kotak Saran</h1>
                    <p className="text-gray-400 text-sm">Masukan Anda sangat berharga untuk pengembangan website kami.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Nama</label>
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                            placeholder="Nama atau Inisial Anda"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Pesan / Saran</label>
                        <textarea 
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none resize-none h-32"
                            placeholder="Tulis kritik, saran, atau request fitur..."
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Kirim Masukan</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackPage;
