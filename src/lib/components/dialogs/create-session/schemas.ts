import { z } from 'zod/v4';

export const agentSchema = z.object({
	name: z.string(),
	agentType: z.string(),
	options: z.array(z.any())
});

export const formSchema = z.object({
	applicationId: z.string(),
	privacyKey: z.string(),
	agents: z.array(agentSchema)
});

export type FormSchema = typeof formSchema;
