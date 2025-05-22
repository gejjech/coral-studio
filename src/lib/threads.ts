import { Context } from 'runed';
import type { Session } from './session.svelte';
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
	session: Session | null;
}>('websocket');
