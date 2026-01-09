
import React, { useState, useEffect } from 'react';
import { Review, User } from '../types';
import { StorageService } from '../services/storageService';
import { Star, MessageSquare } from 'lucide-react';
import { useToast } from './Toast';
import UserAvatar from './UserAvatar';

interface ReviewSectionProps {
    productId: string;
    currentUser: User | null;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, currentUser }) => {
    const { addToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hasOrdered, setHasOrdered] = useState(false);

    useEffect(() => {
        loadReviews();
        const checkPurchase = async () => {
            if(currentUser) {
                const orders = await StorageService.getOrders();
                // Check if user has bought this product and it is COMPLETED
                const bought = orders.some(o => o.userId === currentUser.id && o.productId === productId && o.status === 'COMPLETED');
                setHasOrdered(bought);
            }
        };
        checkPurchase();
    }, [productId, currentUser]);

    const loadReviews = async () => {
        setReviews(await StorageService.getReviews(productId));
    };

    const handleSubmit = async () => {
        if(!currentUser) return;
        if(!comment.trim()) return addToast("Tulis komentar dulu!", "error");
        
        const review: Review = {
            id: Date.now().toString(),
            productId,
            userId: currentUser.id,
            username: currentUser.username,
            userAvatar: currentUser.avatar,
            rating,
            comment,
            createdAt: new Date().toISOString()
        };
        
        await StorageService.addReview(review);
        setComment('');
        loadReviews();
        addToast("Ulasan berhasil dikirim!", "success");
    };

    return (
        <div className="mt-8 bg-[#1e293b] rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <Star className="text-yellow-400 fill-current"/> Ulasan Pembeli ({reviews.length})
            </h3>
            
            {/* Review List */}
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                {reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Belum ada ulasan. Jadilah yang pertama!</p>
                ) : (
                    reviews.map(r => (
                        <div key={r.id} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                            <div className="w-10 h-10 flex-shrink-0">
                                <img src={r.userAvatar || "https://picsum.photos/50"} className="w-full h-full rounded-full object-cover"/>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{r.username}</span>
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"}/>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm mt-1">{r.comment}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Write Review Form */}
            {currentUser ? (
                hasOrdered ? (
                    <div className="bg-dark-bg p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold text-white text-sm mb-3">Tulis Ulasan Kamu</h4>
                        <div className="flex gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className={`hover:scale-110 transition-transform ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                                    <Star size={24} fill="currentColor"/>
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={comment} 
                            onChange={e => setComment(e.target.value)}
                            placeholder="Bagaimana pengalaman belanja kamu?"
                            className="w-full bg-dark-card border border-white/10 rounded-lg p-3 text-white text-sm mb-3 outline-none focus:border-brand-500"
                            rows={3}
                        />
                        <button onClick={handleSubmit} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                            Kirim Ulasan
                        </button>
                    </div>
                ) : (
                    <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 text-gray-400 text-sm">
                        Yuk belanja produk ini dulu untuk memberikan ulasan!
                    </div>
                )
            ) : (
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 text-gray-400 text-sm">
                    Silahkan login untuk menulis ulasan.
                </div>
            )}
        </div>
    );
};

export default ReviewSection;
