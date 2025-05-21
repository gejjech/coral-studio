import { Context } from 'runed';
import { SvelteMap } from 'svelte/reactivity';
export type Message = {
	id: string;
	threadId: string;
	senderId: string;
	content: string;
	timestamp: number;
	mentions: string[];
};

export type Thread = {
	id: string;
	name: string;
	creatorId: string;
	summary?: string;
	participants: string[];
	isClosed: boolean;
};

export type Agent = {
	id: string;
	description?: string;
};

export const socketCtx = new Context<{
	socket: WebSocket | null;

	host: string | null;
	appId: string | null;
	privKey: string | null;
	session: string | null;
	agentId: string | null;
	agents: SvelteMap<string, Agent>;
	threads: SvelteMap<string, Thread>;
	messages: SvelteMap<string, Message[]>;
}>('websocket');
