import type { tools } from '$lib/mcptools';
import type { CustomTool } from '$lib/threads';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { io, Socket } from 'socket.io-client';

type MaybePromise<T> = Promise<T> | T;
const toolCalls: {
	[K in keyof typeof tools]: ({
		event,
		sessionId,
		agentId
	}: {
		event: RequestEvent;
		sessionId: string;
		agentId: string;
		body: Record<string, unknown> | null;
		getSock: () => Socket;
	}) => MaybePromise<Response>;
} = {
	'user-input': ({ sessionId, agentId, getSock, body }) => {
		const sock = getSock();
		const id = crypto.randomUUID();
		sock.emit('request', { id, sessionId, agentId, message: body?.message });
		return new Promise((res) => {
			sock.on('response', ({ id: resId, value }) => {
				console.log('response', { id, resId, value });
				if (resId !== id) return;
				res(new Response(value));
			});
		});
	}
};

export const handle: Handle = async ({ event }) => {
	const [tool, sessionId, agentId, ...extra] = event.url.pathname
		.split('/')
		.slice(3)
		.reduce((acc, part) => (part.length > 0 ? [...acc, part] : acc), [] as string[]);
	console.log({ tool, sessionId, agentId, extra });

	const body = await event.request.json().catch((err) => null);

	if (!tool || !sessionId || !agentId || extra.length > 0)
		return new Response('Not found', { status: 404 });

	if (!(tool in toolCalls)) return new Response(`Tool '${tool}' not found.`, { status: 404 });
	const getSock = () => {
		return io(`${event.url.origin}/socket.io/${tool}`, {
			auth: { secret: (globalThis as any).socketSecret, tool }
		});
	};
	return toolCalls[tool as keyof typeof toolCalls]({ event, sessionId, agentId, getSock, body });
};
