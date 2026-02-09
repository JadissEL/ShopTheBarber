import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import BarberCard from '@/components/ui/barber-card';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reasonings, setReasonings] = useState({});

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => sovereign.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: bookings } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: () => sovereign.entities.Booking.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: favorites } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: () => sovereign.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allBarbers } = useQuery({
    queryKey: ['all-barbers'],
    queryFn: () => sovereign.entities.Barber.list(),
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['user-reviews'],
    queryFn: () => sovereign.entities.Review.filter({ author_name: user?.full_name }),
    enabled: !!user,
    initialData: [],
  });

  useEffect(() => {
    if (user && allBarbers.length > 0) {
      generateRecommendations();
    }
  }, [user, bookings, favorites, allBarbers, reviews]);

  const generateRecommendations = async () => {
    setIsAnalyzing(true);

    try {
      const userProfile = {
        name: user?.full_name || 'User',
        location: user?.location || 'Not specified',
        booking_history: bookings.map(b => ({
          service: b.service_name,
          location: b.location,
          date: b.date_text,
        })),
        favorite_barbers: favorites.map(f => f.barber_name || f.item_name),
        reviewed_barbers: reviews.map(r => ({
          barber: r.target_name,
          rating: r.rating,
        })),
      };

      const barbersData = allBarbers.map(b => ({
        id: b.id,
        name: b.name,
        title: b.title,
        rating: b.rating,
        location: b.location || 'City Center',
        services: b.services || [],
        price_range: b.price_range || '$$',
        specialties: b.specialties || [],
      }));

      const prompt = `You are an expert barber recommendation AI. Analyze the user's profile and recommend the TOP 3 barbers from the available list that best match their preferences.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

AVAILABLE BARBERS:
${JSON.stringify(barbersData, null, 2)}

Consider:
1. Past booking patterns (services, locations)
2. Favorite barbers' characteristics
3. Review ratings and feedback patterns
4. Location proximity
5. Service offerings alignment
6. Price range preferences
7. Specialties that match user interests

Return EXACTLY 3 barber recommendations with specific reasoning for each.`;

      const res = await sovereign.functions.invoke('ai-advisor', {
        prompt: prompt
      });

      let aiData;
      try {
        const cleanResponse = res.response
          .replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '')
          .trim();

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
        } else {
          aiData = JSON.parse(cleanResponse);
        }
      } catch (e) {
        console.warn('Failed to parse AI recommendations JSON:', e);
        throw new Error('Invalid AI response format');
      }

      const recommendedBarbers = (aiData.recommendations || [])
        .map(rec => {
          const barber = allBarbers.find(b => b.id === rec.barber_id);
          if (barber) {
            setReasonings(prev => ({
              ...prev,
              [barber.id]: {
                reasoning: rec.reasoning,
                score: rec.match_score,
                factors: rec.key_factors
              }
            }));
          }
          return barber;
        })
        .filter(Boolean)
        .slice(0, 3);

      setRecommendations(recommendedBarbers);
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      const fallback = allBarbers
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);
      setRecommendations(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Picks For You</h2>
            <p className="text-sm text-slate-500">Personalized based on your preferences</p>
          </div>
        </div>
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-violet-600 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((barber, index) => {
              const reasoning = reasonings[barber.id];
              return (
                <motion.div
                  key={barber.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {reasoning && (
                    <div className="absolute -top-3 left-4 z-20 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {Math.round(reasoning.score * 100)}% Match
                    </div>
                  )}
                  <BarberCard barber={barber} variant="vertical" appearance="light" />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
