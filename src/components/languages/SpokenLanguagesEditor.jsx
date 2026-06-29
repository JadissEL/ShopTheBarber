import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FALLBACK_LANGUAGE_OPTIONS, getLanguageDisplay } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';

export default function SpokenLanguagesEditor({
    title = 'Spoken languages',
    description = 'Select languages you can comfortably serve clients in. Clients can filter by language when booking.',
    value = [],
    onSave,
    isSaving = false,
    max = 8,
}) {
    const [selected, setSelected] = useState(value);

    const { data: options = FALLBACK_LANGUAGE_OPTIONS } = useQuery({
        queryKey: ['language-options'],
        queryFn: () => sovereign.languages.getOptions(),
        staleTime: 1000 * 60 * 60,
    });

    useEffect(() => {
        setSelected(value);
    }, [value]);

    const toggle = (code) => {
        setSelected((prev) => {
            if (prev.includes(code)) return prev.filter((c) => c !== code);
            if (prev.length >= max) {
                toast.error(`Maximum ${max} languages`);
                return prev;
            }
            return [...prev, code];
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Languages className="w-5 h-5 text-primary" />
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map((lang) => {
                    const active = selected.includes(lang.code);
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => toggle(lang.code)}
                            className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                                active
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-card text-foreground/90 border-slate-200 hover:border-primary/40'
                            }`}
                        >
                            {getLanguageDisplay(lang.code, options)}
                        </button>
                    );
                })}
            </div>
            {selected.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Selected: {selected.map((c) => getLanguageDisplay(c, options)).join(', ')}
                </p>
            )}
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={() => onSave(selected)}
                    disabled={isSaving}
                    className="rounded-xl"
                >
                    {isSaving ? 'Saving…' : 'Save languages'}
                </Button>
            </div>
        </div>
    );
}

export function ProviderLanguagesPanel({ barberLanguages = [], shopLanguages = [], shopId, shopName }) {
    const queryClient = useQueryClient();

    const barberMutation = useMutation({
        mutationFn: (languages) => sovereign.languages.updateBarberLanguages(languages),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-languages'] });
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            queryClient.invalidateQueries({ queryKey: ['barbers'] });
            toast.success('Your languages updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const shopMutation = useMutation({
        mutationFn: (languages) => sovereign.languages.updateShopLanguages(shopId, languages),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-languages'] });
            queryClient.invalidateQueries({ queryKey: ['my-shop'] });
            queryClient.invalidateQueries({ queryKey: ['explore-shops'] });
            toast.success('Shop languages updated');
        },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-8">
            <SpokenLanguagesEditor
                title="Your spoken languages"
                description="Languages you personally speak with clients during appointments."
                value={barberLanguages}
                onSave={(langs) => barberMutation.mutate(langs)}
                isSaving={barberMutation.isPending}
            />
            {shopId && (
                <div className="pt-6 border-t border-border">
                    <SpokenLanguagesEditor
                        title={shopName ? `${shopName}, shop languages` : 'Shop languages'}
                        description="Languages spoken by your team. Shown on your shop profile and combined with each barber's languages."
                        value={shopLanguages}
                        onSave={(langs) => shopMutation.mutate(langs)}
                        isSaving={shopMutation.isPending}
                    />
                </div>
            )}
        </div>
    );
}
