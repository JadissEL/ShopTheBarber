import { prisma } from '../db/prisma';
import { parseHighlights } from './logic';

export type DiscoveryPreview = {
    barber_id: string;
    portfolio_count: number;
    thumbnails: string[];
    highlights: string[];
    years_experience: number | null;
    has_story: boolean;
    story_snippet: string | null;
};

const MAX_BARBER_IDS = 100;
const MAX_THUMBNAILS = 3;
const MAX_HIGHLIGHTS = 2;

function bioSnippet(bio: string | null | undefined): string | null {
    const text = bio?.trim();
    if (!text) return null;
    const first = text.split(/\n/)[0]?.trim() ?? text;
    if (first.length <= 120) return first;
    return `${first.slice(0, 117)}…`;
}

export async function getBatchDiscoveryPreviews(
    barberIds: string[]
): Promise<Record<string, DiscoveryPreview>> {
    const unique = [...new Set(barberIds.filter(Boolean))].slice(0, MAX_BARBER_IDS);
    if (!unique.length) return {};

    const [barbers, videos, careerCounts] = await Promise.all([
        prisma.barbers.findMany({
            where: { id: { in: unique } },
            select: {
                id: true,
                bio: true,
                years_experience: true,
                profile_highlights: true,
                career_started_year: true,
            },
        }),
        prisma.barber_videos.findMany({
            where: {
                barber_id: { in: unique },
                OR: [{ status: 'approved' }, { status: 'active' }, { status: null }],
            },
            orderBy: { created_at: 'desc' },
            select: { barber_id: true, thumbnail_url: true, video_url: true },
        }),
        prisma.provider_career_entries.groupBy({
            by: ['barber_id'],
            where: { barber_id: { in: unique } },
            _count: { _all: true },
        }),
    ]);

    const videosByBarber = new Map<string, typeof videos>();
    for (const v of videos) {
        if (!v.barber_id) continue;
        const list = videosByBarber.get(v.barber_id) ?? [];
        list.push(v);
        videosByBarber.set(v.barber_id, list);
    }

    const careerCountByBarber = new Map(
        careerCounts
            .filter((row) => row.barber_id)
            .map((row) => [row.barber_id as string, row._count._all])
    );

    const result: Record<string, DiscoveryPreview> = {};

    for (const barber of barbers) {
        const barberVideos = videosByBarber.get(barber.id) ?? [];
        const highlights = parseHighlights(barber.profile_highlights).slice(0, MAX_HIGHLIGHTS);
        const thumbnails = barberVideos
            .slice(0, MAX_THUMBNAILS)
            .map((v) => v.thumbnail_url || v.video_url)
            .filter(Boolean);
        const portfolioCount = barberVideos.length;
        const careerCount = careerCountByBarber.get(barber.id) ?? 0;
        const snippet = bioSnippet(barber.bio);
        const hasStory =
            portfolioCount > 0 ||
            highlights.length > 0 ||
            Boolean(snippet) ||
            careerCount > 0 ||
            (barber.years_experience != null && barber.years_experience > 0);

        result[barber.id] = {
            barber_id: barber.id,
            portfolio_count: portfolioCount,
            thumbnails,
            highlights,
            years_experience: barber.years_experience,
            has_story: hasStory,
            story_snippet: snippet,
        };
    }

    return result;
}
