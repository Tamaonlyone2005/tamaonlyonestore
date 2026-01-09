
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CheckCircle, Package, ArrowRight, Wallet, ShoppingBag } from 'lucide-react';
import { useToast } from '../components/Toast';

const OpenStore: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            const freshUser = await StorageService.findUser(session.id);
            setUser(freshUser || session);
            setLoading(false);
        };
        load();
    }, [navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        if(!storeName.trim()) return addToast("Nama toko wajib diisi", "error");

        setIsSubmitting(true);
        const success = await StorageService.registerSeller(user.id, storeName, description);
        if(success) {
            addToast("Selamat! Toko berhasil dibuat.", "success");
            // Refresh user session locally
            const updatedUser = { ...user, isSeller: true, storeName, storeDescription: description };
            StorageService.setSession(updatedUser);
            setUser(updatedUser);
        } else {
            addToast("Gagal membuat toko.", "error");
        }
        setIsSubmitting(false);
    };

    if(loading) return <div className="p-10 text-center text-white"><Loader2 className="animate-spin mx-auto"/> Memuat...</div>;

    // IF ALREADY SELLER -> SHOW DASHBOARD
    if (user?.isSeller) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
                <div className="bg-gradient-to-r from-brand-900 to-blue-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Store size={32} className="text-brand-300"/>
                            <h1 className="text-3xl font-bold">{user.storeName}</h1>
                        </div>
                        <p className="text-gray-200 max-w-xl">{user.storeDescription || "Kelola produk dan pesananmu di sini."}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Package size={24}/></div>
                            <div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase">Total Produk</h3>
                                <p className="text-2xl font-bold text-white">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><ShoppingBag size={24}/></div>
                            <div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase">Penjualan</h3>
                                <p className="text-2xl font-bold text-white">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl"><Wallet size={24}/></div>
                            <div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase">Pendapatan</h3>
                                <p className="text-2xl font-bold text-white">Rp 0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card border border-white/5 rounded-3xl p-10 text-center">
                    <Package size={48} className="mx-auto text-gray-600 mb-4"/>
                    <h3 className="text-xl font-bold text-white mb-2">Belum Ada Produk</h3>
                    <p className="text-gray-400 mb-6">Kamu belum menambahkan produk apapun ke tokomu.</p>
                    <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed" title="Fitur tambah produk seller sedang dikembangkan">
                        + Tambah Produk Baru (Segera Hadir)
                    </button>
                </div>
            </div>
        );
    }

    // IF NOT SELLER -> SHOW REGISTRATION FORM
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold mb-6 border border-brand-500/20">
                        <Store size={14}/> MITRA SELLER
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                        Mulai Bisnis Digitalmu Bersama Kami
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Jangkau ribuan gamers dan jual produk digitalmu dengan mudah. Gratis pendaftaran dan fitur kelola toko yang lengkap.
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                        {['Buka Toko Gratis Selamanya', 'Jangkauan Luas ke Komunitas', 'Dashboard Pengelolaan Mudah', 'Dukungan Promosi'].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-gray-300">
                                <CheckCircle size={20} className="text-green-500 shrink-0"/> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-dark-card border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <h2 className="text-2xl font-bold text-white mb-6">Form Pendaftaran Toko</h2>
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Nama Toko</label>
                            <input 
                                required
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                className="w-full bg-dark-bg border border-white/10 rounded-xl p-4 text-white focus:border-brand-500 outline-none transition-all"
                                placeholder="Contoh: Pro Gamers Shop"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Deskripsi Singkat</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-dark-bg border border-white/10 rounded-xl p-4 text-white focus:border-brand-500 outline-none transition-all"
                                placeholder="Jelaskan apa yang kamu jual..."
                                rows={4}
                            />
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300">
                            Dengan mendaftar, kamu menyetujui Syarat & Ketentuan seller yang berlaku di platform ini.
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : <>Buka Toko Sekarang <ArrowRight size={18}/></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OpenStore;
