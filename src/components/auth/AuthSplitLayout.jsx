import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const AUTH_PHOTO =
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop';

export default function AuthSplitLayout({
  eyebrow,
  heroTitle = (
    <>
      Elevate your
      <br />
      standard.
    </>
  ),
  heroDescription = 'Book elite barbers, manage your chair, and earn rewards — all in one sharp platform.',
  children,
  className,
  contentClassName,
}) {
  return (
    <div className={cn('stb-page flex min-h-[calc(100vh-4rem)] lg:min-h-screen', className)}>
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <OptimizedImage
          src={AUTH_PHOTO}
          alt="Barber shop atmosphere"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 h-full">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold no-underline font-sans"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {eyebrow ? (
              <p className={cn(stb.overline, 'text-white/90 mb-6')}>{eyebrow}</p>
            ) : null}
            <h2 className={cn(stb.display, 'text-white mb-5')}>{heroTitle}</h2>
            <p className="text-lg text-white/80 max-w-sm leading-relaxed font-sans normal-case">
              {heroDescription}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-8 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={cn('w-full max-w-md py-8 lg:py-12', contentClassName)}
        >
          <div className="lg:hidden mb-8">
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium no-underline font-sans"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
