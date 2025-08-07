import { Context } from 'runed';
import type { Session } from './session.svelte';
import type { components } from '../generated/api';

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

export type PublicRegistryAgent = components["schemas"]["PublicRegistryAgent"];
export type PublicRegistryAgentWithOptions = PublicRegistryAgent & {
	options: { [name: string]: 
		(PublicRegistryAgent["options"][string] & {
			value: string | undefined
		}) 
	};
}

export type GraphAgentRequest = components["schemas"]["GraphAgentRequest"];

export type ToolTransport = {
	type: 'http';
	url: string;
};

export type CustomTool = {
	transport: ToolTransport;
	toolSchema: {
		name: string;
		description?: string;
		inputSchema: {
			type: 'object';
			properties: Record<string, unknown>;
			required?: string[];
		};
	};
};

export const sessionCtx = new Context<{
	session: Session | null;
	registry: { [id: string]: PublicRegistryAgent } | null;
	sessions: string[] | null;
	connection: { host: string; appId: string; privacyKey: string } | null;
}>('sessionCtx');
