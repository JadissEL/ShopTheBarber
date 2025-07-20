import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Flag,
  Camera,
  Heart,
} from "lucide-react";

interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  images?: string[];
  pros?: string[];
  cons?: string[];
  recommended: boolean;
  userHasLiked?: boolean;
  userHasDisliked?: boolean;
}

interface ProductReviewsProps {
  productId: number;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onSubmitReview: (review: {
    rating: number;
    title: string;
    comment: string;
    pros: string[];
    cons: string[];
    recommended: boolean;
  }) => void;
  onVoteReview: (reviewId: number, vote: "helpful" | "not-helpful") => void;
  onReportReview: (reviewId: number, reason: string) => void;
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
  onSubmitReview,
  onVoteReview,
  onReportReview,
}: ProductReviewsProps) {
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [sortBy, setSortBy] = React.useState("helpful");
  const [filterBy, setFilterBy] = React.useState("all");
  const [newReview, setNewReview] = React.useState({
    rating: 5,
    title: "",
    comment: "",
    pros: [""],
    cons: [""],
    recommended: true,
  });

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: totalReviews
      ? (reviews.filter((r) => r.rating === rating).length / totalReviews) * 100
      : 0,
  }));

  const handleSubmitReview = () => {
    onSubmitReview({
      ...newReview,
      pros: newReview.pros.filter((p) => p.trim()),
      cons: newReview.cons.filter((c) => c.trim()),
    });
    setShowReviewForm(false);
    setNewReview({
      rating: 5,
      title: "",
      comment: "",
      pros: [""],
      cons: [""],
      recommended: true,
    });
  };

  const addProField = () => {
    setNewReview((prev) => ({ ...prev, pros: [...prev.pros, ""] }));
  };

  const addConField = () => {
    setNewReview((prev) => ({ ...prev, cons: [...prev.cons, ""] }));
  };

  const updatePro = (index: number, value: string) => {
    setNewReview((prev) => ({
      ...prev,
      pros: prev.pros.map((p, i) => (i === index ? value : p)),
    }));
  };

  const updateCon = (index: number, value: string) => {
    setNewReview((prev) => ({
      ...prev,
      cons: prev.cons.map((c, i) => (i === index ? value : c)),
    }));
  };

  const removePro = (index: number) => {
    setNewReview((prev) => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index),
    }));
  };

  const removeCon = (index: number) => {
    setNewReview((prev) => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== index),
    }));
  };

  const filteredReviews = reviews
    .filter((review) => {
      if (filterBy === "all") return true;
      if (filterBy === "verified") return review.verified;
      if (filterBy === "recommended") return review.recommended;
      if (filterBy === "with-images")
        return review.images && review.images.length > 0;
      return parseInt(filterBy) === review.rating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "helpful":
        default:
          return b.helpful - a.helpful;
      }
    });

  return (
    <div className="space-y-8">
      {/* Reviews Overview */}
      <div className="bg-moroccan-darkgrey/60 rounded-2xl p-6 border border-moroccan-gold/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-moroccan-gold">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= averageRating ? "text-moroccan-gold fill-current" : "text-moroccan-gold/30"}`}
                />
              ))}
            </div>
            <div className="text-moroccan-cream">
              Basé sur {totalReviews} avis
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-400">
                <ThumbsUp className="w-4 h-4" />
                {Math.round(
                  (reviews.filter((r) => r.recommended).length / totalReviews) *
                    100,
                )}
                % recommandent
              </div>
              <div className="flex items-center gap-1 text-moroccan-gold">
                <CheckCircle className="w-4 h-4" />
                {Math.round(
                  (reviews.filter((r) => r.verified).length / totalReviews) *
                    100,
                )}
                % achats vérifiés
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-moroccan-sand">{rating}</span>
                  <Star className="w-3 h-3 text-moroccan-gold fill-current" />
                </div>
                <div className="flex-1 h-2 bg-moroccan-darkgrey rounded-full overflow-hidden">
                  <div
                    className="h-full bg-moroccan-gold transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-moroccan-cream w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
              <SelectItem value="helpful">Plus utiles</SelectItem>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
              <SelectItem value="highest">Notes les plus hautes</SelectItem>
              <SelectItem value="lowest">Notes les plus basses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-48 bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
              <SelectItem value="all">Tous les avis</SelectItem>
              <SelectItem value="5">5 étoiles</SelectItem>
              <SelectItem value="4">4 étoiles</SelectItem>
              <SelectItem value="3">3 étoiles</SelectItem>
              <SelectItem value="2">2 étoiles</SelectItem>
              <SelectItem value="1">1 étoile</SelectItem>
              <SelectItem value="verified">Achats vérifiés</SelectItem>
              <SelectItem value="recommended">Recommandés</SelectItem>
              <SelectItem value="with-images">Avec photos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogTrigger asChild>
            <Button className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper">
              <MessageSquare className="w-4 h-4 mr-2" />
              Écrire un avis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-moroccan-charcoal border-moroccan-gold/20 text-moroccan-sand">
            <DialogHeader>
              <DialogTitle className="text-moroccan-gold">
                Partager votre expérience
              </DialogTitle>
              <DialogDescription className="text-moroccan-cream">
                Aidez les autres clients avec votre avis détaillé
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Note globale *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setNewReview((prev) => ({ ...prev, rating: star }))
                      }
                      className={`text-2xl transition-all ${star <= newReview.rating ? "text-moroccan-gold scale-110" : "text-moroccan-gold/30 hover:text-moroccan-gold/70"}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Titre de l'avis *
                </label>
                <Input
                  placeholder="Résumez votre expérience en quelques mots"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Votre avis détaillé *
                </label>
                <Textarea
                  placeholder="Partagez votre expérience avec ce produit..."
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand min-h-[100px]"
                />
              </div>

              {/* Pros */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Points positifs
                </label>
                {newReview.pros.map((pro, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Point positif"
                      value={pro}
                      onChange={(e) => updatePro(index, e.target.value)}
                      className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                    />
                    {newReview.pros.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePro(index)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addProField}
                  className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                >
                  + Ajouter un point positif
                </Button>
              </div>

              {/* Cons */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Points négatifs
                </label>
                {newReview.cons.map((con, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Point négatif"
                      value={con}
                      onChange={(e) => updateCon(index, e.target.value)}
                      className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                    />
                    {newReview.cons.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCon(index)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addConField}
                  className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                >
                  + Ajouter un point négatif
                </Button>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-moroccan-sand">
                  Recommanderiez-vous ce produit ?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newReview.recommended}
                      onChange={() =>
                        setNewReview((prev) => ({ ...prev, recommended: true }))
                      }
                      className="text-moroccan-gold"
                    />
                    <span className="text-moroccan-sand">Oui</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!newReview.recommended}
                      onChange={() =>
                        setNewReview((prev) => ({
                          ...prev,
                          recommended: false,
                        }))
                      }
                      className="text-moroccan-gold"
                    />
                    <span className="text-moroccan-sand">Non</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmitReview}
                  disabled={!newReview.title || !newReview.comment}
                  className="flex-1 bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper"
                >
                  Publier l'avis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                  className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-moroccan-darkgrey/60 rounded-xl p-6 border border-moroccan-gold/20 space-y-4"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center text-moroccan-charcoal font-bold">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-moroccan-sand">
                      {review.userName}
                    </span>
                    {review.verified && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-moroccan-cream">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= review.rating ? "text-moroccan-gold fill-current" : "text-moroccan-gold/30"}`}
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span>
                      {new Date(review.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {review.recommended && (
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Recommande
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-moroccan-cream hover:text-red-400"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Review Title */}
            <h4 className="font-semibold text-moroccan-sand text-lg">
              {review.title}
            </h4>

            {/* Review Content */}
            <p className="text-moroccan-cream leading-relaxed">
              {review.comment}
            </p>

            {/* Pros and Cons */}
            {(review.pros || review.cons) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {review.pros && review.pros.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-green-400 flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      Points positifs
                    </h5>
                    <ul className="text-sm text-moroccan-cream space-y-1">
                      {review.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.cons && review.cons.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-red-400 flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      Points négatifs
                    </h5>
                    <ul className="text-sm text-moroccan-cream space-y-1">
                      {review.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Avis ${review.id} - Image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Review Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-moroccan-gold/20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onVoteReview(review.id, "helpful")}
                  className={`flex items-center gap-1 text-sm transition-colors ${review.userHasLiked ? "text-green-400" : "text-moroccan-cream hover:text-green-400"}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Utile ({review.helpful})
                </button>
                <button
                  onClick={() => onVoteReview(review.id, "not-helpful")}
                  className={`flex items-center gap-1 text-sm transition-colors ${review.userHasDisliked ? "text-red-400" : "text-moroccan-cream hover:text-red-400"}`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Pas utile ({review.notHelpful})
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-moroccan-cream hover:text-moroccan-gold"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Répondre
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-moroccan-gold/20 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-moroccan-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-moroccan-sand mb-2">
              Aucun avis trouvé
            </h3>
            <p className="text-moroccan-cream text-sm">
              Soyez le premier à laisser un avis sur ce produit
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
