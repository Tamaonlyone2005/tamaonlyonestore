import React, { useState, useEffect } from 'react';
import { Review, User, UserRole } from '../types';
import { StorageService } from '../services/storageService';
import { Star, Send, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import UserAvatar from './UserAvatar';

interface ReviewSectionProps {
  productId: string;
  currentUser: User | null;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, currentUser }) => {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await StorageService.getReviews(productId);
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment.trim()) {
        addToast("Komentar tidak boleh kosong", "error");
        return;
    }

    setSubmitting(true);
    const newReview: Review = {
      id: Date.now().toString(),
      productId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    await StorageService.addReview(newReview);
    setReviews(prev => [newReview, ...prev]);
    setComment('');
    setRating(5);
    setSubmitting(false);
    addToast("Ulasan berhasil dikirim!", "success");
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl animate-fade-in">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Star className="text-yellow-500 fill-current" size={20} />
        Ulasan Pembeli ({reviews.length})
      </h3>

      {/* Review Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-dark-bg/50 p-4 rounded-xl border border-white/5">
          <p className="text-sm font-bold text-white mb-3">Tulis Ulasan Anda</p>
          <div className="flex items-center gap-2 mb-4">
             {[1, 2, 3, 4, 5].map(star => (
                 <button 
                    key={star} 
                    type="button"
                    onClick={() => setRating(star)}
                    className={`transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-500' : 'text-gray-600'}`}
                 >
                     <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                 </button>
             ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bagikan pengalamanmu..."
            className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none mb-3"
            rows={3}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Kirim Ulasan
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
            <p className="text-blue-300 text-sm">Silakan login untuk memberikan ulasan.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat ulasan...</div>
        ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-white/5 rounded-xl">
                Belum ada ulasan untuk produk ini.
            </div>
        ) : (
            reviews.map(review => (
                <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                        <UserAvatar 
                            user={{
                                id: review.userId,
                                username: review.username,
                                avatar: review.userAvatar,
                                email: '',
                                role: UserRole.MEMBER
                            } as any}
                            size="sm" 
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold text-sm">{review.username}</p>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < review.rating ? "text-yellow-500 fill-current" : "text-gray-600"} />
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm mt-2 leading-relaxed">{review.comment}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;