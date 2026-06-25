export function createPageUrl(pageName: string): string {
    if (!pageName) return '/';
    const normalized = pageName.replace(/ /g, '-');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}