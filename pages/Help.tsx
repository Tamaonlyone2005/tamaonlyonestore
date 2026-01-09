
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const Help: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        { q: "Bagaimana cara melakukan Top Up?", a: "Pilih game yang diinginkan, masukkan User ID, pilih nominal, lakukan pembayaran, dan konfirmasi bukti bayar di halaman Pesanan." },
        { q: "Berapa lama proses masuknya item?", a: "Rata-rata proses memakan waktu 5-10 menit setelah pembayaran diverifikasi. Untuk joki, tergantung antrian." },
        { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami menerima Transfer Bank (BCA, Mandiri), E-Wallet (Dana, OVO, GoPay), dan QRIS." },
        { q: "Apakah aman belanja di sini?", a: "Sangat aman. Kami menggunakan sistem keamanan terenkripsi dan garansi uang kembali jika pesanan gagal diproses dalam 24 jam." },
        { q: "Bagaimana jika pesanan saya belum masuk?", a: "Silakan hubungi Customer Service kami melalui tombol WhatsApp atau Live Chat dengan menyertakan ID Transaksi." }
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
                <HelpCircle size={48} className="text-brand-500 mx-auto mb-4"/>
                <h1 className="text-3xl font-bold text-white mb-2">Pusat Bantuan</h1>
                <p className="text-gray-400">Pertanyaan yang sering diajukan</p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                        <button 
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full p-5 text-left flex justify-between items-center text-white font-bold hover:bg-white/5 transition-colors"
                        >
                            {faq.q}
                            {openIndex === idx ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </button>
                        {openIndex === idx && (
                            <div className="p-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Help;
