import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
    const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

    useEffect(() => {
        const on = () => setOffline(false);
        const off = () => setOffline(true);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    if (!offline) return null;

    return (
        <div
            className={cn(
                'fixed top-0 inset-x-0 z-[100]',
                'bg-primary text-primary-foreground text-sm font-sans',
                'py-2.5 px-4 flex items-center justify-center gap-2',
                'shadow-sm rounded-b-lg',
            )}
            role="status"
            aria-live="polite"
        >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
            <span>You&apos;re offline — some features need a connection.</span>
            <Link to="/Offline" className="underline font-medium ml-1 hover:text-primary-foreground/90">
                Help
            </Link>
        </div>
    );
}
