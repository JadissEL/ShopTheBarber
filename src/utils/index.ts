const AUTH_PATH_ALIASES: Record<string, string> = {
  SignIn: '/login',
  SignUp: '/register',
};

export function createPageUrl(pageName: string): string {
    if (!pageName) return '/';
    const qIndex = pageName.indexOf('?');
    const base = qIndex === -1 ? pageName : pageName.slice(0, qIndex);
    const query = qIndex === -1 ? '' : pageName.slice(qIndex);
    const alias = AUTH_PATH_ALIASES[base];
    if (alias) return `${alias}${query}`;
    const normalized = pageName.replace(/ /g, '-');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/** Sign-in URL that returns the user to a path after login. */
export function signInUrlWithReturn(returnPath?: string): string {
    const path = returnPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
    return `${createPageUrl('SignIn')}?return=${encodeURIComponent(path)}`;
}
