import type { PublicRegistryAgent } from '$lib/threads';
import { z } from 'zod/v4';

const formSchema = z.object({
	applicationId: z.string().nonempty(),
	privacyKey: z.string().nonempty(),
	agentGraphRequest: z.array(
		z.object({
			id: z.object({
				name: z.string().nonempty(),
				version: z.string().nonempty()
			}),
			name: z.string().nonempty(),
			description: z.string().optional(),
			coralPlugins: z
				.array(
					z.object({
						type: z.literal('close_session_tool')
					})
				)
				.optional(),

			agentName: z.string().nonempty(),
			provider: z.discriminatedUnion('type', [
				z.object({
					type: z.literal('local'),
					runtime: z.union([z.literal('function'), z.literal('executable'), z.literal('docker')])
				}),

				z.object({
					type: z.literal('remote'),
					server: z.string(), // GraphAgentServer (simplified as string, replace if needed)
					runtime: z.union([
						z.literal('docker'),
						z.literal('phala'),
						z.string() // fallback if runtime ids are freeform
					]),
					wallet: z.string(),
					maxCost: z.number(),
					paymentSessionId: z.string()
				}),

				z.object({
					type: z.literal('remote_request'),
					runtime: z.union([z.literal('docker'), z.literal('phala'), z.string()]),
					maxCost: z.number(),
					serverSource: z.discriminatedUnion('type', [
						z.object({
							type: z.literal(
								'org.coralprotocol.coralserver.agent.graph.server.GraphAgentServerSource.Indexer'
							),
							indexer: z.string()
						}),
						z.object({
							type: z.literal('servers'),
							servers: z.array(z.string()) // GraphAgentServer[]
						})
					]),
					serverScoring: z
						.discriminatedUnion('type', [
							z.object({ type: z.literal('default') }),
							z.object({
								type: z.literal('custom'),
								scorers: z.array(
									z.discriminatedUnion('op', [
										z.object({
											op: z.literal('is_false'),
											type: z.string(),
											effect: z.any()
										}),
										z.object({
											op: z.literal('is_not_present'),
											type: z.string(),
											effect: z.any()
										}),
										z.object({
											op: z.literal('is_present'),
											type: z.string(),
											effect: z.any()
										}),
										z.object({
											op: z.literal('is_true'),
											type: z.string(),
											effect: z.any()
										}),
										z.object({
											op: z.literal('string_equal'),
											type: z.string(),
											string: z.string(),
											effect: z.any()
										}),
										z.object({
											op: z.literal('string_not_equal'),
											type: z.string(),
											string: z.string(),
											effect: z.any()
										})
									])
								)
							})
						])
						.optional()
				})
			]),

			systemPrompt: z.string().optional(),
			customToolAccess: z.set(z.string()),
			blocking: z.boolean(),

			options: z.record(
				z.string(),
				z.discriminatedUnion('type', [
					z.object({ type: z.literal('string'), value: z.string() }),
					z.object({ type: z.literal('secret'), value: z.string() }),
					z.object({ type: z.literal('number'), value: z.number() })
				])
			)
		})
	),
	links: z.array(z.array(z.string()))
});
export const makeFormSchema = (registryAgents: { [agent: string]: PublicRegistryAgent }) =>
	formSchema.superRefine((data, ctx) => {
		data.agents.forEach((agent, i) => {
			const regAgent = registryAgents[agent.name];
			if (!regAgent) {
				ctx.addIssue({
					code: 'custom',
					path: ['agent', i, 'agentName'],
					message: `Agent name ${agent.name} not found in registry.`
				});
				return;
			}

			const provider = agent.provider;
			if ('runtime' in provider) {
				const allowedRuntimes = Object.values(regAgent.runtimes) as string[];
				if (!allowedRuntimes.includes(provider.runtime)) {
					ctx.addIssue({
						code: 'custom',
						path: ['agentGraphRequest', i, 'provider', 'runtime'],
						message: `Runtime ${provider.runtime} not available for agent ${agent.name}.`
					});
				}
			}

			const regOptions = Object.entries(regAgent.options ?? {});
			for (const [optName, optSpec] of regOptions) {
				if ('default' in optSpec && optSpec.default !== undefined) continue;

				const val = agent.options?.[optName];
				if (!val || (val.type === 'string' && val.value.length === 0)) {
					ctx.addIssue({
						code: 'custom',
						path: ['agentGraphRequest', i, 'options', optName],
						message: `Missing required option: ${optName}`
					});
				}
			}
		});
	});

export type FormSchema = typeof formSchema;
