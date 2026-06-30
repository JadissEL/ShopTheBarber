import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { subscribePwaInstall, promptPwaInstall, isStandalonePwa } from '@/lib/pwaInstall';

const DISMISS_KEY = 'stb_pwa_install_dismissed';

export default function InstallPrompt() {
    const [canInstall, setCanInstall] = useState(false);
    const [dismissed, setDismissed] = useState(() =>
        typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
    );
    const [hidden, setHidden] = useState(isStandalonePwa());

    useEffect(() => {
        return subscribePwaInstall((prompt) => {
            setCanInstall(!!prompt);
        });
    }, []);

    if (hidden || dismissed || !canInstall) return null;

    const install = async () => {
        const ok = await promptPwaInstall();
        if (ok) setHidden(true);
    };

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm">
            <div className=" border bg-card shadow-lg p-4 flex gap-3 items-start">
                <Download className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Install ShopTheBarber</p>
                    <p className="text-xs text-muted-foreground mt-1">Add to your home screen for faster booking and offline access to your account shell.</p>
                    <div className="flex gap-2 mt-3">
                        <Button size="sm" className="rounded-lg h-8" onClick={install}>Install</Button>
                        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={dismiss}>Not now</Button>
                    </div>
                </div>
                <button type="button" onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
