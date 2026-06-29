export type TombolaStreamEvent =
    | { type: 'state'; draw_id: string }
    | { type: 'countdown'; draw_id: string; seconds_left: number }
    | { type: 'winner'; draw_id: string; winner_user_id: string; winner_display_name: string };

type Listener = (event: TombolaStreamEvent) => void;

const listeners = new Set<Listener>();

export function subscribeTombola(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function publishTombola(event: TombolaStreamEvent): void {
    listeners.forEach((fn) => {
        try {
            fn(event);
        } catch {
            /* ignore */
        }
    });
}
