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

export type AgentOption = {
	name: string;
	description?: string;
	value: string | undefined;
} & ({ type: 'string'; default: string | null } | { type: 'number'; default: number | null });

export type RegistryAgent = {
	id: string;
	blocking?: boolean;
	options: { [name: string]: AgentOption };
};

export type Agent = {
	type: 'local';
	agentType: string;
	blocking?: boolean;
	options: { [name: string]: string | number | undefined };
};

export const socketCtx = new Context<{
	session: Session | null;
	registry: { [id: string]: RegistryAgent } | null;
	sessions: string[] | null;
	connection: { host: string; appId: string; privacyKey: string } | null;
}>('websocket');
