import {
    Calendar,
    GraduationCap,
    Briefcase,
    Award,
    BadgeCheck,
    MapPin,
    Instagram,
    Globe,
    Sparkles,
    Truck,
    Store,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';

const ENTRY_ICONS = {
    education: GraduationCap,
    employment: Briefcase,
    certification: BadgeCheck,
    milestone: Sparkles,
    award: Award,
};

const ENTRY_LABELS = {
    education: 'Education',
    employment: 'Experience',
    certification: 'Certification',
    milestone: 'Milestone',
    award: 'Award',
};

function formatYearRange(started, ended, isCurrent) {
    if (!started && !ended) return null;
    if (started && !ended) return isCurrent ? `${started} - Present` : started;
    if (started && ended) return `${started} - ${ended}`;
    return ended || started;
}

function SocialLink({ type, handle, url }) {
    if (type === 'website' && url) {
        const href = url.startsWith('http') ? url : `https://${url}`;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
                <Globe className="w-4 h-4" />
                Website
            </a>
        );
    }
    if (type === 'instagram' && handle) {
        const clean = handle.replace(/^@/, '');
        return (
            <a
                href={`https://instagram.com/${clean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
                <Instagram className="w-4 h-4" />
                @{clean}
            </a>
        );
    }
    if (type === 'tiktok' && handle) {
        const clean = handle.replace(/^@/, '');
        return (
            <a
                href={`https://tiktok.com/@${clean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
                <span className="text-xs font-bold">TT</span>
                @{clean}
            </a>
        );
    }
    return null;
}

export default function ProviderShowcasePublic({
    showcase,
    bio,
    skills = [],
    compact = false,
    hidePortfolio = false,
}) {
    const display = showcase ?? {};
    const hasTimeline =
        (display.career_timeline?.length ?? 0) > 0 || (display.auto_milestones?.length ?? 0) > 0;
    const hasMeta =
        display.member_since_label ||
        display.years_experience ||
        display.career_started_year ||
        display.founded_year ||
        display.mobile_service_started_year;
    const hasSocial = display.instagram_handle || display.tiktok_handle || display.website_url;
    const hasHighlights = (display.profile_highlights?.length ?? 0) > 0;
    const hasPortfolio = !hidePortfolio && (display.portfolio?.length ?? 0) > 0;

    if (!bio && !skills.length && !hasTimeline && !hasMeta && !hasSocial && !hasHighlights && !hasPortfolio) {
        return null;
    }

    return (
        <div className={`space-y-6 ${compact ? '' : 'animate-in fade-in duration-500'}`}>
            {(hasMeta || display.member_since_label) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {display.member_since_label && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Member since
                            </div>
                            <p className="font-semibold text-sm">{display.member_since_label}</p>
                        </div>
                    )}
                    {display.years_experience != null && display.years_experience > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                Experience
                            </div>
                            <p className="font-semibold text-sm">{display.years_experience}+ years</p>
                        </div>
                    )}
                    {display.career_started_year && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Career since
                            </div>
                            <p className="font-semibold text-sm">{display.career_started_year}</p>
                        </div>
                    )}
                    {display.founded_year && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Store className="w-3.5 h-3.5" />
                                Est.
                            </div>
                            <p className="font-semibold text-sm">{display.founded_year}</p>
                        </div>
                    )}
                    {display.mobile_service_started_year && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Truck className="w-3.5 h-3.5" />
                                Mobile since
                            </div>
                            <p className="font-semibold text-sm">{display.mobile_service_started_year}</p>
                        </div>
                    )}
                </div>
            )}

            {bio && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-2">About</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>
                </div>
            )}

            {hasHighlights && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-3">Highlights</h3>
                    <div className="flex flex-wrap gap-2">
                        {display.profile_highlights.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {skills.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                            <span
                                key={s}
                                className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {hasSocial && (
                <div className="flex flex-wrap gap-4 px-1">
                    <SocialLink type="website" url={display.website_url} />
                    <SocialLink type="instagram" handle={display.instagram_handle} />
                    <SocialLink type="tiktok" handle={display.tiktok_handle} />
                </div>
            )}

            {hasTimeline && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-4">Career & background</h3>
                    <div className="space-y-4">
                        {display.auto_milestones?.map((m) => (
                            <div key={m.label} className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{m.label}</p>
                                    {m.year && (
                                        <p className="text-xs text-muted-foreground">{m.year}</p>
                                    )}
                                    {m.detail && (
                                        <p className="text-xs text-muted-foreground mt-1">{m.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {display.career_timeline?.map((entry) => {
                            const Icon = ENTRY_ICONS[entry.entry_type] || Briefcase;
                            const range = formatYearRange(
                                entry.started_at,
                                entry.ended_at,
                                entry.is_current
                            );
                            return (
                                <div key={entry.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-sm">{entry.title}</p>
                                            <Badge variant="outline" className="text-[10px]">
                                                {ENTRY_LABELS[entry.entry_type] || entry.entry_type}
                                            </Badge>
                                        </div>
                                        {entry.organization && (
                                            <p className="text-sm text-muted-foreground">{entry.organization}</p>
                                        )}
                                        {entry.location && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {entry.location}
                                            </p>
                                        )}
                                        {range && (
                                            <p className="text-xs text-muted-foreground mt-1">{range}</p>
                                        )}
                                        {entry.description && (
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                {entry.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {hasPortfolio && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-4">Portfolio</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {display.portfolio.map((item) => (
                            <a
                                key={item.id}
                                href={item.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square rounded-2xl overflow-hidden bg-muted relative group border border-border"
                            >
                                <OptimizedImage
                                    src={
                                        item.thumbnail_url ||
                                        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop'
                                    }
                                    alt={item.title}
                                    fill
                                    imgClassName="group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                    <p className="text-white text-xs font-semibold line-clamp-2">{item.title}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ProviderShowcasePortfolioOnly({ showcase }) {
    if (!showcase?.portfolio?.length) return null;
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {showcase.portfolio.map((item) => (
                <a
                    key={item.id}
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-2xl overflow-hidden bg-muted relative group border border-border"
                >
                    <OptimizedImage
                        src={
                            item.thumbnail_url ||
                            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop'
                        }
                        alt={item.title}
                        fill
                        imgClassName="group-hover:scale-105 transition-transform duration-500"
                    />
                </a>
            ))}
        </div>
    );
}
