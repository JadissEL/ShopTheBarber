import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import { pagesConfig } from '@/pages.config';
import { FUNNEL_PAGE_EVENTS } from '@/lib/analyticsSession';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        window.parent?.postMessage({
            type: 'app_changed_url',
            url: window.location.href,
        }, '*');
    }, [location]);

    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                (key) => key.toLowerCase() === pathSegment.toLowerCase()
            );
            pageName = matchedKey || null;
        }

        if (pageName && FUNNEL_PAGE_EVENTS[pageName]) {
            sovereign.analytics.track({
                eventName: FUNNEL_PAGE_EVENTS[pageName],
                properties: { page: pageName },
            });
        }

        if (isAuthenticated && pageName) {
            sovereign.appLogs.logUserInApp(pageName).catch(() => {});
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    useEffect(() => {
        const onUnload = () => sovereign.analytics.flush?.();
        window.addEventListener('pagehide', onUnload);
        return () => window.removeEventListener('pagehide', onUnload);
    }, []);

    return null;
}
