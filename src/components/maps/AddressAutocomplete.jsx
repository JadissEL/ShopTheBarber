import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { sovereign } from '@/api/apiClient';
import { cn } from '@/lib/utils';
import { useGeocodingConfig } from '@/hooks/useGeocodingConfig';

/**
 * Address input with server-backed autocomplete (Mapbox / Google / Nominatim via /api/at-home-service/suggest).
 * Optionally geocodes on blur when the user typed an address without picking a suggestion.
 */
export default function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Street, city, postal code…',
    className,
    inputClassName,
    disabled = false,
    minChars = 3,
    geocodeOnBlur = true,
    minGeocodeChars = 8,
}) {
    const listId = useId();
    const wrapRef = useRef(null);
    const debounceRef = useRef(null);
    const pickedFromListRef = useRef(false);
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const { data: geoConfig } = useGeocodingConfig();
    const autocompleteEnabled = geoConfig?.geocoding?.supports_autocomplete !== false;

    const fetchSuggestions = useCallback(
        async (query) => {
            const trimmed = query.trim();
            if (!autocompleteEnabled || trimmed.length < minChars) {
                setSuggestions([]);
                setOpen(false);
                return;
            }
            setLoading(true);
            try {
                const data = await sovereign.atHomeService.suggest(trimmed);
                const items = data?.suggestions ?? [];
                setSuggestions(items);
                setOpen(items.length > 0);
                setActiveIndex(-1);
            } catch {
                setSuggestions([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        },
        [minChars, autocompleteEnabled]
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 280);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, fetchSuggestions]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const pickSuggestion = (item) => {
        pickedFromListRef.current = true;
        onChange?.(item.formatted_address);
        onSelect?.(item);
        setSuggestions([]);
        setOpen(false);
    };

    const handleBlur = async () => {
        setOpen(false);
        if (!geocodeOnBlur || !onSelect || pickedFromListRef.current) {
            pickedFromListRef.current = false;
            return;
        }
        const trimmed = value?.trim() ?? '';
        if (trimmed.length < minGeocodeChars) return;
        try {
            const data = await sovereign.atHomeService.geocode(trimmed);
            onSelect?.({
                formatted_address: data.formatted_address,
                latitude: data.latitude,
                longitude: data.longitude,
            });
        } catch {
            // Plain text remains valid; travel quote may geocode server-side
        }
    };

    const onKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            pickSuggestion(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapRef} className={cn('relative flex-1', className)}>
            <Input
                value={value}
                onChange={(e) => {
                    pickedFromListRef.current = false;
                    onChange?.(e.target.value);
                }}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                onBlur={handleBlur}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={cn('rounded-xl', inputClassName)}
                disabled={disabled}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
            />
            {loading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    …
                </span>
            )}
            {open && suggestions.length > 0 && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg py-1"
                >
                    {suggestions.map((item, index) => (
                        <li
                            key={`${item.latitude}-${item.longitude}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                        >
                            <button
                                type="button"
                                className={cn(
                                    'w-full text-left px-3 py-2 text-sm hover:bg-muted/80 transition-colors',
                                    index === activeIndex && 'bg-muted'
                                )}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickSuggestion(item)}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
