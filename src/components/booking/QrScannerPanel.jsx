import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QrScannerPanel({ onScan, className }) {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState(null);
    const [starting, setStarting] = useState(false);

    const stopScanner = () => {
        controlsRef.current?.stop();
        controlsRef.current = null;
        setActive(false);
        setStarting(false);
    };

    useEffect(() => () => stopScanner(), []);

    const startScanner = async () => {
        setError(null);
        setStarting(true);
        try {
            const reader = new BrowserQRCodeReader();
            const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                const text = result?.getText()?.trim();
                if (text) {
                    onScan(text);
                    stopScanner();
                }
            });
            controlsRef.current = controls;
            setActive(true);
        } catch (e) {
            setError(e?.message || 'Camera access denied or unavailable');
            stopScanner();
        } finally {
            setStarting(false);
        }
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="relative aspect-[4/3] max-h-52 rounded-lg overflow-hidden bg-muted border border-border">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline aria-label="QR scanner camera preview" />
                {!active && !starting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/80">
                        <Camera className="w-8 h-8 opacity-60" aria-hidden />
                        <span>Camera preview</span>
                    </div>
                )}
                {starting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
                        <span className="sr-only">Starting camera…</span>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
                {!active ? (
                    <Button type="button" variant="outline" size="sm" className="gap-2 touch-manipulation" disabled={starting} onClick={startScanner}>
                        <Camera className="w-4 h-4" aria-hidden />
                        {starting ? 'Starting…' : 'Scan QR Code'}
                    </Button>
                ) : (
                    <Button type="button" variant="outline" size="sm" className="gap-2 touch-manipulation" onClick={stopScanner}>
                        <CameraOff className="w-4 h-4" aria-hidden />
                        Stop Scanner
                    </Button>
                )}
            </div>
        </div>
    );
}
