import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeujqFpthLUXy-pXT6DtN-rnSELuCf6AzI6gPHJm7p7goWOdv30fbrKq4orP9PxMNGRZz7PZWuSGUZC1GYP9euNSu57JoF79cO5bl4Bde7XxXgP8VARjoOiN0-CZASEPpe2S8mFnNqT7l4xHxk8--zmg4W_cBPQnorjtqf0YhO064gqc8-IiQZJxkWVrhBAF4uiBnwdKuPyBFFeeYhwOXeIBxWy6Gc2Srt_5gZZkgmre0j2Vwv_i4JIZqV5IqmzcbX8WmyEb4l8PI",
    title: "Discover your best look",
    description: "Find the perfect grooming services tailored to your style and needs."
  },
  {
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop",
    title: "Book with ease",
    description: "Schedule appointments with top barbers in just a few taps."
  },
  {
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=400&fit=crop",
    title: "Look your best",
    description: "Get premium grooming services from verified professionals."
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate(createPageUrl("Home"));
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="stb-page-dark flex flex-col items-center justify-center px-6 py-12 font-sans">
      <div className="w-full max-w-md flex flex-col h-full">

        {/* Image Card */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-matte-silver text-base leading-relaxed max-w-xs mx-auto">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-primary w-8' : 'bg-surface-light/20 w-2 hover:bg-surface-light/40'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}