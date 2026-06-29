import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * URL-synced filter state for the Explore page.
 */
export function useExploreFilters({ languageOptions = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const cityFilter = searchParams.get('city') || '';
  const mobileOnly = searchParams.get('mobile') === '1';
  const shopOnly = searchParams.get('shop') === '1';
  const groupOnly = searchParams.get('group') === '1';

  const [searchTerm, setSearchTermState] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilterState] = useState(searchParams.get('filter') || 'All');
  const [viewType, setViewType] = useState('professionals');
  const [languageFilter, setLanguageFilter] = useState('');
  const [kidsWelcomeOnly, setKidsWelcomeOnly] = useState(searchParams.get('kids') === '1');
  const [sortBy, setSortBy] = useState('rating');
  const [highlightFilter, setHighlightFilter] = useState(null);

  const debounceRef = useRef(null);
  const isInitialMount = useRef(true);

  const setDiscoveryFlag = useCallback(
    (key, enabled, { clear = [] } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (enabled) next.set(key, '1');
          else next.delete(key);
          for (const k of clear) next.delete(k);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setActiveFilter = useCallback(
    (value) => {
      setActiveFilterState(value);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== 'All') next.set('filter', value);
          else next.delete('filter');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setSearchTerm = useCallback((value) => {
    setSearchTermState(value);
  }, []);

  useEffect(() => {
    setActiveFilterState(searchParams.get('filter') || 'All');
  }, [searchParams]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const trimmed = searchTerm.trim();
          if (trimmed) next.set('q', trimmed);
          else next.delete('q');
          return next;
        },
        { replace: true }
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, setSearchParams]);

  const activeFilterItems = useMemo(() => {
    const items = [];
    if (searchTerm.trim()) {
      items.push({ id: 'search', label: `"${searchTerm.trim()}"`, onRemove: () => setSearchTerm('') });
    }
    if (cityFilter) {
      items.push({
        id: 'city',
        label: cityFilter,
        onRemove: () =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('city');
            return next;
          }, { replace: true }),
      });
    }
    if (activeFilter && activeFilter !== 'All') {
      items.push({
        id: 'service',
        label: activeFilter,
        onRemove: () => {
          setActiveFilter('All');
          setHighlightFilter(null);
        },
      });
    }
    if (highlightFilter) {
      const labels = { topRated: 'Top rated', new: 'New', trending: 'Trending' };
      items.push({
        id: 'highlight',
        label: labels[highlightFilter] ?? highlightFilter,
        onRemove: () => setHighlightFilter(null),
      });
    }
    if (languageFilter) {
      const lang = languageOptions.find((l) => l.code === languageFilter);
      items.push({
        id: 'lang',
        label: lang?.label ?? languageFilter,
        onRemove: () => setLanguageFilter(''),
      });
    }
    if (kidsWelcomeOnly) {
      items.push({
        id: 'kids',
        label: 'Kids welcome',
        onRemove: () => {
          setKidsWelcomeOnly(false);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('kids');
            return next;
          }, { replace: true });
        },
      });
    }
    if (mobileOnly) {
      items.push({
        id: 'mobile',
        label: 'Mobile',
        onRemove: () => setDiscoveryFlag('mobile', false),
      });
    }
    if (shopOnly) {
      items.push({
        id: 'shop',
        label: 'In-shop',
        onRemove: () => setDiscoveryFlag('shop', false),
      });
    }
    if (groupOnly) {
      items.push({
        id: 'group',
        label: 'Groups',
        onRemove: () => setDiscoveryFlag('group', false),
      });
    }
    return items;
  }, [
    searchTerm,
    cityFilter,
    activeFilter,
    highlightFilter,
    languageFilter,
    kidsWelcomeOnly,
    mobileOnly,
    shopOnly,
    groupOnly,
    languageOptions,
    setSearchParams,
    setDiscoveryFlag,
    setActiveFilter,
  ]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setActiveFilter('All');
    setHighlightFilter(null);
    setLanguageFilter('');
    setKidsWelcomeOnly(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('mobile');
        next.delete('shop');
        next.delete('group');
        next.delete('city');
        next.delete('filter');
        next.delete('kids');
        next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams, setActiveFilter]);

  const toggleKidsWelcome = useCallback(() => {
    setKidsWelcomeOnly((prev) => {
      const next = !prev;
      setSearchParams(
        (searchPrev) => {
          const params = new URLSearchParams(searchPrev);
          if (next) params.set('kids', '1');
          else params.delete('kids');
          return params;
        },
        { replace: true }
      );
      return next;
    });
  }, [setSearchParams]);

  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    cityFilter,
    mobileOnly,
    shopOnly,
    groupOnly,
    viewType,
    setViewType,
    languageFilter,
    setLanguageFilter,
    kidsWelcomeOnly,
    setKidsWelcomeOnly,
    toggleKidsWelcome,
    sortBy,
    setSortBy,
    highlightFilter,
    setHighlightFilter,
    setDiscoveryFlag,
    activeFilterItems,
    clearAllFilters,
    searchParams,
    setSearchParams,
  };
}
