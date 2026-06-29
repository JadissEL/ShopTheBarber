import { motion } from 'framer-motion';
import { Star, ThumbsUp, MessageSquare, MoreHorizontal } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

/** Normalize API / legacy review shapes for display */
export function normalizeReview(review) {
    if (!review) return null;
    const r = review.data || review;
    const text = r.text ?? r.content ?? '';
    let dateText = r.date_text;
    if (!dateText && r.created_at) {
        try {
            dateText = formatDistanceToNow(new Date(r.created_at), { addSuffix: true });
        } catch {
            dateText = 'Recent';
        }
    }
    return {
        ...r,
        author_name: r.author_name || 'Verified Client',
        text,
        date_text: dateText || 'Recent',
        rating: r.rating ?? 5,
    };
}

export default function ReviewCard({ review, showActions = false, delay = 0 }) {
    const reviewData = normalizeReview(review);
    if (!reviewData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.05 }}
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <UserAvatar
                        name={reviewData.author_name}
                        src={reviewData.author_avatar}
                        className="w-10 h-10 border border-border"
                    />
                    <div>
                        <h4 className="font-bold text-foreground text-sm">{reviewData.author_name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {reviewData.date_text}
                            {reviewData.target_type === 'shop' && (
                                <span className="text-amber-600">, Shop review</span>
                            )}
                            {showActions && <span>, Verified Client</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-500 text-xs font-bold border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-500" /> {reviewData.rating}
                </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                &ldquo;{reviewData.text || 'Great service!'}&rdquo;
            </p>

            {showActions && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({reviewData.likes || 0})
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Reply
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
