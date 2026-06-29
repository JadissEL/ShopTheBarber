/**
 * Pre-build: refresh public/sitemap.xml from production API when VITE_API_URL is set.
 * Falls back to the committed static sitemap when the API is unreachable.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const apiBase = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '');
const siteOrigin = (process.env.VITE_SITE_URL || 'https://shop-the-barber.vercel.app').replace(/\/$/, '');

async function main() {
    const sitemapPath = path.join(root, 'public', 'sitemap.xml');
    const robotsPath = path.join(root, 'public', 'robots.txt');

    let xml = null;
    if (apiBase) {
        try {
            const res = await fetch(`${apiBase}/api/public/sitemap.xml`, { signal: AbortSignal.timeout(15_000) });
            if (res.ok) {
                xml = await res.text();
                console.log('[generate-sitemap] Fetched dynamic sitemap from API');
            } else {
                console.warn('[generate-sitemap] API returned', res.status);
            }
        } catch (err) {
            console.warn('[generate-sitemap] API fetch failed:', err instanceof Error ? err.message : err);
        }
    } else {
        console.log('[generate-sitemap] VITE_API_URL not set — keeping static sitemap');
    }

    if (xml?.includes('<urlset')) {
        fs.writeFileSync(sitemapPath, xml, 'utf8');
        console.log('[generate-sitemap] Wrote', sitemapPath);
    }

    if (fs.existsSync(robotsPath)) {
        let robots = fs.readFileSync(robotsPath, 'utf8');
        const sitemapLine = `Sitemap: ${siteOrigin}/sitemap.xml`;
        if (/^Sitemap:/m.test(robots)) {
            robots = robots.replace(/^Sitemap:.*/m, sitemapLine);
        } else {
            robots = `${robots.trim()}\n\n${sitemapLine}\n`;
        }
        fs.writeFileSync(robotsPath, robots, 'utf8');
        console.log('[generate-sitemap] Updated robots.txt sitemap URL');
    }
}

main().catch((e) => {
    console.error('[generate-sitemap] failed:', e);
    process.exit(1);
});
