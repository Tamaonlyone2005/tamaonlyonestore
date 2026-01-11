
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { CartItem, Order, OrderStatus, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight, Phone, CreditCard, Info, AlertCircle, CheckCircle, Copy, Landmark, Ticket, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import { PAYMENT_CONFIG } from '../constants';

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    const [whatsapp, setWhatsapp] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Voucher State
    const [voucherCode, setVoucherCode] = useState('');
    const [validatingVoucher, setValidatingVoucher] = useState(false);

    useEffect(() => {
        const session = StorageService.getSession();
        if(!session) {
            navigate('/login');
            return;
        }
        setUser(session);
        loadCart(session.id);
    }, []);

    const loadCart = async (userId: string) => {
        const items = await StorageService.getCart(userId);
        setCartItems(items);
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(!user) return;
        await StorageService.removeFromCart(user.id, id);
        loadCart(user.id);
        addToast("Item dihapus dari keranjang", "info");
    };

    const handleCheckout = async () => {
        if(!user) return;
        if(cartItems.length === 0) return;
        if(!whatsapp) return addToast("Nomor WhatsApp wajib diisi untuk konfirmasi!", "error");
        
        setIsProcessing(true);
        try {
            for (const item of cartItems) {
                const finalPrice = Math.max(0, item.price - (item.discountAmount || 0));
                const order: Order = {
                    id: 'TRX' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
                    userId: user.id,
                    username: user.username,
                    whatsapp: whatsapp,
                    email: user.email || '',
                    gameData: item.inputData,
                    productId: item.productId,
                    productName: item.productName,
                    variantName: item.variantName,
                    price: finalPrice, 
                    originalPrice: item.price,
                    couponCode: item.couponCode || undefined,
                    status: OrderStatus.PENDING,
                    createdAt: new Date().toISOString(),
                    sellerId: item.sellerId
                };
                await StorageService.createOrder(order);
            }

            await StorageService.clearCart(user.id);
            addToast("Pesanan berhasil dibuat!", "success");
            setShowPaymentModal(true);
        } catch (e) {
            addToast("Gagal membuat pesanan", "error");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleApplyVoucher = async () => {
        if(!voucherCode) return addToast("Masukkan kode voucher", "error");
        setValidatingVoucher(true);

        try {
            const updatedItems: CartItem[] = [];
            let appliedCount = 0;

            for (const item of cartItems) {
                // Check per item because coupon might valid only for some items
                const res = await StorageService.validateCoupon(voucherCode, item.productId, item.sellerId);
                
                if (res.valid) {
                    const newItem = { ...item, couponCode: voucherCode, discountAmount: res.discount };
                    await StorageService.addToCart(user!.id, newItem); // Update cart in DB
                    updatedItems.push(newItem);
                    appliedCount++;
                } else {
                    // Reset if invalid for this item or if trying new code
                    if(item.couponCode) {
                         const resetItem = { ...item, couponCode: undefined, discountAmount: 0 };
                         await StorageService.addToCart(user!.id, resetItem);
                         updatedItems.push(resetItem);
                    } else {
                         updatedItems.push(item);
                    }
                }
            }

            setCartItems(updatedItems);
            
            if (appliedCount > 0) {
                addToast(`Voucher diterapkan pada ${appliedCount} item!`, "success");
            } else {
                // Determine reason roughly (e.g., if any item has sellerId)
                const hasSellerItems = cartItems.some(i => !!i.sellerId);
                if (hasSellerItems) addToast("Voucher tidak berlaku untuk produk Seller.", "error");
                else addToast("Kode voucher tidak valid atau tidak memenuhi syarat.", "error");
            }

        } catch (e) {
            console.error(e);
            addToast("Gagal memvalidasi voucher.", "error");
        } finally {
            setValidatingVoucher(false);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const totalDiscount = cartItems.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
    const totalPrice = Math.max(0, subtotal - totalDiscount);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast("Berhasil disalin!", "success");
    };

    if(!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
            <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <ShoppingCart className="text-brand-500"/> Keranjang Belanja
            </h1>

            {cartItems.length === 0 ? (
                <div className="text-center py-20 bg-[#1e293b] rounded-3xl border border-white/5 animate-fade-in">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart size={40} className="text-gray-600"/>
                    </div>
                    <p className="text-gray-400 mb-8 font-medium">Keranjang kamu masih kosong.</p>
                    <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-brand-600 rounded-xl text-white font-bold hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20">Mulai Belanja</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex gap-4 items-center group hover:border-brand-500/30 transition-all relative">
                                <div className="w-20 h-20 bg-dark-bg rounded-xl flex-shrink-0 overflow-hidden border border-white/5">
                                    <img src={item.image || "https://picsum.photos/100"} className="w-full h-full object-cover"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-base truncate">{item.productName}</h4>
                                    <p className="text-xs text-gray-500 mb-1">{item.variantName || 'Regular Pack'}</p>
                                    
                                    {/* Price & Discount Logic */}
                                    <div className="flex items-center gap-2">
                                        <p className="text-brand-400 font-extrabold text-sm">Rp {item.price.toLocaleString()}</p>
                                        {item.discountAmount && item.discountAmount > 0 ? (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">Hemat Rp {item.discountAmount.toLocaleString()}</span>
                                        ) : null}
                                    </div>
                                    {item.couponCode && <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1"><Ticket size={10}/> Kupon: {item.couponCode}</p>}
                                </div>
                                <button onClick={(e) => handleRemove(e, item.id)} className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all z-10 cursor-pointer">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-[#1e293b] p-6 rounded-3xl border border-white/5 sticky top-24 shadow-2xl">
                            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                                <CreditCard size={20} className="text-brand-500"/> Informasi Checkout
                            </h3>
                            
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">Nomor WhatsApp</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 border-r border-white/10 pr-3">
                                            <Phone size={18}/>
                                        </div>
                                        <input 
                                            value={whatsapp} 
                                            onChange={e => setWhatsapp(e.target.value)} 
                                            placeholder="08xxxxxxxxxx" 
                                            className="w-full bg-dark-bg border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                
                                {/* VOUCHER SECTION */}
                                <div>
                                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">Kode Voucher</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <Ticket size={18}/>
                                            </div>
                                            <input 
                                                value={voucherCode} 
                                                onChange={e => setVoucherCode(e.target.value)} 
                                                placeholder="Punya kode promo?" 
                                                className="w-full bg-dark-bg border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:border-brand-500 outline-none"
                                            />
                                        </div>
                                        <button onClick={handleApplyVoucher} disabled={validatingVoucher} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl font-bold text-xs disabled:opacity-50">
                                            {validatingVoucher ? <Loader2 className="animate-spin" size={14}/> : 'Apply'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-dark-bg/50 rounded-2xl p-4 mb-6 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-sm">Subtotal</span>
                                    <span className="text-gray-300 text-sm font-bold">Rp {subtotal.toLocaleString()}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-green-400">
                                        <span className="text-sm">Total Diskon</span>
                                        <span className="text-sm font-bold">-Rp {totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className="text-white font-bold">Total</span>
                                    <span className="text-xl font-black text-brand-400">Rp {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleCheckout} 
                                disabled={isProcessing}
                                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-brand-500/25 transition-all active:scale-95"
                            >
                                {isProcessing ? 'Memproses...' : (
                                    <>Lanjut Pembayaran <ArrowRight size={20}/></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32}/>
                            </div>
                            <h2 className="text-xl font-bold text-white">Selesaikan Pembayaran</h2>
                            <p className="text-gray-400 text-xs mt-1">Total yang harus dibayar: <span className="text-brand-400 font-bold">Rp {totalPrice.toLocaleString()}</span></p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Opsi 1: QRIS */}
                            <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Metode 1: Scan QRIS</p>
                                <div className="bg-white p-3 rounded-xl inline-block shadow-2xl">
                                    <img 
                                        src={PAYMENT_CONFIG.qrisImageUrl} 
                                        alt="QRIS Payment" 
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-4 italic">*Scan menggunakan Dana, OVO, GoPay, atau m-Banking</p>
                            </div>

                            {/* Opsi 2: Transfer Manual */}
                            <div className="bg-dark-bg/80 rounded-2xl p-5 border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Metode 2: Transfer Manual</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg text-brand-400"><Landmark size={18}/></div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{PAYMENT_CONFIG.bankName}</p>
                                                <p className="text-sm font-black text-white">{PAYMENT_CONFIG.accountNumber}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => copyToClipboard(PAYMENT_CONFIG.accountNumber)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Copy size={16}/></button>
                                    </div>
                                    <div className="pt-3 border-t border-white/5">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Atas Nama</p>
                                        <p className="text-sm font-bold text-white">{PAYMENT_CONFIG.accountHolder}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-1"/>
                                <div className="text-left">
                                    <p className="text-[11px] text-gray-300 leading-relaxed">
                                        Simpan bukti transfer Anda. Pergi ke <b>Akun &gt; Pesanan</b> untuk mengunggah bukti agar pesanan segera diproses.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-dark-bg/50">
                            <button 
                                onClick={() => navigate('/profile')}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/20"
                            >
                                Saya Sudah Bayar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
