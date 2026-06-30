import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { createPageUrl } from '@/utils';

export default function Offline() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="stb-page flex items-center justify-center p-4">
            <MetaTags title="Offline" description="You are offline" noindex />
            <div className="w-full max-w-md">
                <EmptyState
                    icon={WifiOff}
                    title="You're offline"
                    description="Check your connection and try again. Your installed app shell is still available for basic navigation."
                    actionLabel="Try again"
                    onAction={handleRetry}
                />
                <div className="flex justify-center -mt-2 pb-8">
                    <Button asChild variant="outline">
                        <Link to={createPageUrl('Home')}>Go home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
