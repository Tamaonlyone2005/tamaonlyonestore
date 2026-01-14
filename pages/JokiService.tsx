
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, ServiceRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Zap, ShieldCheck, UserPlus, Loader2, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useToast } from '../components/Toast';

const JokiService: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [jokiProducts, setJokiProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [experience, setExperience] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            const allProducts = await StorageService.getGlobalProducts();
            // Filter products specifically marked as 'JOKI'
            const jokis = allProducts.filter(p => p.type === 'JOKI');
            setJokiProducts(jokis);
            setLoading(false);
        };
        load();
    }, []);

    const handleRegisterJoki = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = StorageService.getSession();
        if(!user) return navigate('/login');

        if(!name || !contact || !experience) return addToast("Mohon lengkapi formulir.", "error");

        setIsSubmitting(true);
        const req: ServiceRequest = {
            id: 'JOKI_' + Date.now(),
            name: name,
            contact: contact,
            serviceType: 'JOKI_REGISTRATION',
            budget: 'N/A',
            description: `Pengalaman: ${experience}. Username Web: ${user.username}`,
            status: 'OPEN',
            createdAt: new Date().toISOString()
        };
        
        await StorageService.createServiceRequest(req);
        setIsSubmitting(false);
        setName('');
        setContact('');
        setExperience('');
        addToast("Permintaan daftar Joki terkirim! Admin akan menghubungi.", "success");
    };

    return (
        <div className="min-h-screen bg-[#0f172a] pb-24">
            {/* Header */}
            <div className="bg-[#1e293b] py-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 font-bold text-sm">
                        <ArrowLeft size={16}/> Kembali ke Home
                    </button>
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold mb-4">
                            <Zap size={14}/> TOP JOCKEYS
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Jasa Joki Terpercaya</h1>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Push rank cepat & aman bersama penjoki profesional komunitas kami. Pilih penjoki favoritmu berdasarkan rating dan harga.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Product Listing */}
                <div className="mb-16">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-yellow-500 pl-4">
                        Daftar Paket Joki Tersedia
                    </h2>
                    
                    {loading ? (
                        <div className="text-center text-gray-500 py-10">Memuat data joki...</div>
                    ) : jokiProducts.length === 0 ? (
                        <div className="bg-[#1e293b] rounded-3xl p-8 text-center border border-white/5 border-dashed">
                            <Gamepad2 size={48} className="mx-auto text-gray-600 mb-4 opacity-50"/>
                            <p className="text-gray-400 font-bold">Belum ada jasa joki tersedia saat ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {jokiProducts.map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    canBuy={true} 
                                    onBuy={() => navigate(`/shop?product=${p.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Registration Form */}
                <div className="bg-[#1e293b] rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col md:flex-row">
                    <div className="p-8 md:w-1/2 bg-gradient-to-br from-brand-900 to-[#1e293b] relative">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white mb-4">Ingin Jadi Penjoki?</h2>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Hasilkan uang dari skill bermain game-mu. Bergabunglah sebagai mitra penjoki resmi kami dan dapatkan akses ke ribuan pelanggan potensial.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {['Verifikasi Akun Mudah', 'Sistem Pembayaran Aman', 'Fee Kompetitif', 'Komunitas Solid'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300 font-bold text-sm">
                                        <ShieldCheck className="text-green-500" size={18}/> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-8 md:w-1/2 bg-[#1e293b]">
                        <form onSubmit={handleRegisterJoki} className="space-y-4">
                            <div className="text-center mb-6 md:text-left">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <UserPlus size={20} className="text-yellow-500"/> Form Pendaftaran
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap / Nickname</label>
                                <input 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-500 outline-none"
                                    placeholder="Contoh: Pro Player X"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kontak WhatsApp</label>
                                <input 
                                    value={contact} 
                                    onChange={e => setContact(e.target.value)} 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-500 outline-none"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Pengalaman / Rank Tertinggi</label>
                                <textarea 
                                    value={experience} 
                                    onChange={e => setExperience(e.target.value)} 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-500 outline-none h-24 resize-none"
                                    placeholder="Contoh: Mythical Glory 1000 Pts, Conqueror PUBG S12..."
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin"/> : 'Kirim Pendaftaran'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JokiService;
