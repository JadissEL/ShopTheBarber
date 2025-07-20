import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTouchGestures } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileCarouselProps {
  items: React.ReactNode[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

export function MobileCarousel({
  items,
  className,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
}: MobileCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const gesture = useTouchGestures();
  const autoPlayRef = React.useRef<NodeJS.Timeout>();

  const nextSlide = React.useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [items.length, isTransitioning]);

  const prevSlide = React.useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [items.length, isTransitioning]);

  const goToSlide = React.useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  // Handle touch gestures
  React.useEffect(() => {
    if (gesture?.type === 'swipe') {
      if (gesture.direction === 'left') {
        nextSlide();
      } else if (gesture.direction === 'right') {
        prevSlide();
      }
    }
  }, [gesture, nextSlide, prevSlide]);

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && items.length > 1) {
      autoPlayRef.current = setInterval(nextSlide, interval);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, interval, nextSlide, items.length]);

  if (items.length === 0) return null;

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Carousel Container */}
      <div className="relative w-full h-full">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 relative"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "bg-moroccan-charcoal/80 text-moroccan-offwhite",
              "hover:bg-moroccan-charcoal hover:text-moroccan-gold",
              "transition-all duration-300 hover:scale-110",
              "shadow-lg border border-moroccan-darkgrey"
            )}
            disabled={isTransitioning}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "bg-moroccan-charcoal/80 text-moroccan-offwhite",
              "hover:bg-moroccan-charcoal hover:text-moroccan-gold",
              "transition-all duration-300 hover:scale-110",
              "shadow-lg border border-moroccan-darkgrey"
            )}
            disabled={isTransitioning}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                "border-2 border-moroccan-gold",
                currentIndex === index
                  ? "bg-moroccan-gold scale-125"
                  : "bg-transparent hover:bg-moroccan-gold/50"
              )}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-moroccan-darkgrey/30">
          <div
            className="h-full bg-moroccan-gradient-primary transition-all duration-100 ease-linear"
            style={{
              width: `${((currentIndex + 1) / items.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
} 