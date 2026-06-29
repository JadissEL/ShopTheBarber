/**
 * Client-side showcase completeness (mirrors server/providerShowcase/completeness.ts).
 */

export function computeBarberShowcaseCompleteness(input) {
    const bioDone = Boolean(input.bio?.trim());
    const highlightsDone = (input.profile_highlights?.length ?? 0) >= 2;
    const timelineDone = (input.career_entries?.length ?? 0) >= 1;
    const portfolioDone = (input.portfolio?.length ?? 0) >= 3;
    const experienceDone =
        (input.years_experience != null && input.years_experience > 0) ||
        (input.career_started_year != null && input.career_started_year > 0);

    const items = [
        {
            id: 'bio',
            label: 'Write your bio',
            done: bioDone,
            tip: 'Tell clients your style and what makes your chair unique.',
        },
        {
            id: 'highlights',
            label: 'Add 2+ highlights',
            done: highlightsDone,
            tip: 'Tags like “Precision fades” help clients find you on Explore.',
        },
        {
            id: 'timeline',
            label: 'Add a career entry',
            done: timelineDone,
            tip: 'School, shop experience, or a milestone builds trust before booking.',
        },
        {
            id: 'portfolio',
            label: 'Upload 3+ portfolio items',
            done: portfolioDone,
            tip: 'Your best cuts show up on your profile and in discovery cards.',
        },
        {
            id: 'experience',
            label: 'Set years of experience',
            done: experienceDone,
            tip: 'Clients compare barbers by experience, add years or career start year.',
        },
    ];

    const score = items.filter((i) => i.done).length;
    const max_score = items.length;

    return {
        score,
        max_score,
        percent: max_score > 0 ? Math.min(100, Math.round((score / max_score) * 100)) : 0,
        items,
        is_discoverable: bioDone && (portfolioDone || (highlightsDone && timelineDone)),
    };
}

export function computeShopShowcaseCompleteness(input) {
    const descriptionDone = Boolean(input.description?.trim());
    const highlightsDone = (input.profile_highlights?.length ?? 0) >= 2;
    const timelineDone = (input.career_entries?.length ?? 0) >= 1;
    const foundedDone = input.founded_year != null && input.founded_year > 0;

    const items = [
        {
            id: 'description',
            label: 'Write your shop story',
            done: descriptionDone,
            tip: 'Describe your vibe, team, and what clients can expect.',
        },
        {
            id: 'highlights',
            label: 'Add 2+ highlights',
            done: highlightsDone,
            tip: 'Walk-ins, luxury lounge, kids welcome, help shoppers choose you.',
        },
        {
            id: 'timeline',
            label: 'Add shop history or milestones',
            done: timelineDone,
            tip: 'Opening year, expansion, or awards show up on your public shop page.',
        },
        {
            id: 'founded',
            label: 'Set year established',
            done: foundedDone,
            tip: 'Longevity signals trust on your ShopTheBarber profile.',
        },
    ];

    const score = items.filter((i) => i.done).length;
    const max_score = items.length;

    return {
        score,
        max_score,
        percent: max_score > 0 ? Math.min(100, Math.round((score / max_score) * 100)) : 0,
        items,
        is_discoverable: descriptionDone && (highlightsDone || timelineDone),
    };
}
