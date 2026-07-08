import { describe, it, expect } from 'vitest';
import { denyWriteScopeOnCreate } from './entityWriteScope';

function mockReply() {
    const reply = {
        statusCode: 200,
        body: null as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(body: unknown) {
            this.body = body;
            return this;
        },
    };
    return reply;
}

describe('entityWriteScope', () => {
    it('rejects inspiration_post create with foreign author_id', async () => {
        const reply = mockReply();
        const data = { title: 'Test', author_id: 'other-user' };
        const denied = await denyWriteScopeOnCreate(
            'inspiration_post',
            data,
            { id: 'author-1', role: 'blogger' },
            undefined,
            reply as never,
        );
        expect(denied).toBe(true);
        expect(reply.statusCode).toBe(403);
    });

    it('binds favorite create to authenticated user', async () => {
        const reply = mockReply();
        const data = { barber_id: 'b1' };
        const denied = await denyWriteScopeOnCreate(
            'favorite',
            data,
            { id: 'user-1', role: 'client' },
            undefined,
            reply as never,
        );
        expect(denied).toBe(false);
        expect(data.user_id).toBe('user-1');
    });
});
