<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
<<<<<<< Updated upstream
	import { Button } from '$lib/components/ui/button';
=======
	import { Button, buttonVariants } from '$lib/components/ui/button';

	// TODO: change these icons
>>>>>>> Stashed changes
	import { ClipboardCopy, PlusIcon, TrashIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import {
		sessionCtx,
		type CustomTool,
		type GraphAgentRequest,
		type PublicRegistryAgent
	} from '$lib/threads';
	import { Session } from '$lib/session.svelte';
	import { tools } from '$lib/mcptools';

	import ClipboardImportDialog from '../clipboard-import-dialog.svelte';
	import Combobox from '$lib/components/combobox.svelte';
	import TooltipLabel from '$lib/components/tooltip-label.svelte';
	import TwostepButton from '$lib/components/twostep-button.svelte';
	import ModalCollapsible from '$lib/components/modal-collapsible.svelte';

	import { toast } from 'svelte-sonner';
	import { Textarea } from '$lib/components/ui/textarea';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as schemas from './schemas';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import createClient from 'openapi-fetch';
	import type { paths, components } from '../../../../generated/api';

	type CreateSessionRequest = components['schemas']['SessionRequest'];

	type Complete<T> = {
		[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
	};

	let ctx = sessionCtx.get();
	console.debug('[SessionForm] ctx', ctx); // DEBUG

	const inputTypes: {
		[K in PublicRegistryAgent['options'][string]['type']]: HTMLInputTypeAttribute;
	} = {
		string: 'text',
		number: 'text',
		secret: 'password'
	};
	console.debug('[SessionForm] inputTypes', inputTypes); // DEBUG

	let {
		open = $bindable(false),
<<<<<<< Updated upstream
		agents
	}: { open: boolean; agents: { [id: string]: PublicRegistryAgent } } = $props();
	console.debug('[SessionForm] props.agents', JSON.stringify(agents, null, 2)); // DEBUG

	let formSchema = $derived(schemas.makeFormSchema(agents));
=======
		registry
	}: { open: boolean; registry: { [id: string]: PublicRegistryAgent } } = $props();

	let formSchema = $derived(schemas.makeFormSchema(registry));
>>>>>>> Stashed changes
	$inspect('[SessionForm] formSchema', formSchema); // DEBUG

	let form = $derived(
		superForm(defaults(zod4(formSchema)), {
			SPA: true,
			dataType: 'json',
			validators: zod4(formSchema),
			async onUpdate({ form: f }) {
				console.debug('[onUpdate] form valid?', f.valid, f); // DEBUG
				if (!f.valid) {
					toast.error('Please fix all errors in the form.');
					return;
				}
				if (!ctx.connection) return;
				try {
					const client = createClient<paths>({
						baseUrl: `${location.protocol}//${ctx.connection.host}`
					});
					console.debug('[onUpdate] POSTing asJson', JSON.stringify(asJson, null, 2)); // DEBUG
					const res = await client.POST('/api/v1/sessions', {
						// body: asJson
					});
					console.debug('[onUpdate] POST result', res); // DEBUG

					if (res.error) {
						// todo @alan there should probably be an api class where we can generic-ify the handling of this error
						// with a proper type implementation too..!
<<<<<<< Updated upstream
						let error: { message: string; stackTrace: string[] } = res.error;
=======
						let error = {
							message: res.error.message ?? 'Unknown error',
							stackTrace: res.error.stackTrace
						};
>>>>>>> Stashed changes
						console.error(error.stackTrace);

						toast.error(`Failed to create session: ${error.message}`);
						return;
					}
					if (res.data) {
						console.debug('[onUpdate] session created', res.data); // DEBUG
						if (!ctx.sessions) ctx.sessions = [];
						ctx.sessions.push(res.data.sessionId);
						ctx.session = new Session({
							...ctx.connection,
							session: res.data.sessionId
						});
						open = false;
					} else {
						throw new Error('no data received');
					}
				} catch (e) {
					console.error('[onUpdate] exception', e); // DEBUG
					toast.error(`Failed to create session: ${e}`);
				}
			}
		})
	);

	let { form: formData, errors, enhance } = $derived(form);
<<<<<<< Updated upstream

	const importFromJson = (json: string) => {
		console.debug('[importFromJson] raw json', json); // DEBUG
		const data: CreateSessionRequest = JSON.parse(json);
		console.debug('[importFromJson] parsed', data); // DEBUG
		$formData = {
			links: data.agentGraphRequest?.groups ?? [],
			applicationId: data.applicationId,
			privacyKey: data.privacyKey,
			agents: Object.entries(data.agentGraphRequest?.agents ?? {})
				.filter(([_, agent]) => agent.provider.type === 'local')
				.map(([name, agent]) => {
					console.debug('[importFromJson] adding agent', name, agent); // DEBUG
					return {
						name: agent.name,
						provider: agent.provider as any,
						blocking: agent.blocking ?? true,
						options: agent.options,
						customTools: new Set(agent.customToolAccess)
					};
				})
		};
		console.debug('[importFromJson] $formData', $formData); // DEBUG
		selectedAgent = $formData.agents.length > 0 ? 0 : null;
	};
=======
>>>>>>> Stashed changes

	let usedTools = $derived(
		new Set($formData.agentGraphRequest.flatMap((agent) => Array.from(agent.customToolAccess)))
	) as Set<keyof typeof tools>;
<<<<<<< Updated upstream
	let asJson: CreateSessionRequest = $derived.by(() => {
		const result: CreateSessionRequest = {
			privacyKey: $formData.privacyKey,
			applicationId: $formData.applicationId,
			agentGraphRequest: {
				agents: $formData.agents.map((agent) => {
					console.debug('[asJson] building agent entry', agent); // DEBUG
					return {
						id: {
							name: agent.name,
							version: agents[agent.name]?.id.version ?? '1.0.0'
						},
						name: agent.name,
						options: agent.options as any,
						systemPrompt: agent.systemPrompt,
						blocking: agent.blocking,
						customToolAccess: Array.from(agent.customTools),
						provider: agent.provider
					};
				}),
				customTools: Object.fromEntries(
					Array.from(usedTools).map((tool) => [tool, tools[tool]])
				) as any,
				groups: $formData.links
			}
		};
		console.debug('[asJson] result', JSON.stringify(result, null, 2)); // DEBUG
		return result;
	});

	let selectedAgent: number | null = $state(null);
=======

	let selectedAgent: number | null = $state(null);

	// const importFromJson = (json: string) => {
	// 	const data: CreateSessionRequest = JSON.parse(json);
	// 	$formData = {
	// 		links: data.agentGraphRequest?.groups ?? [],
	// 		applicationId: data.applicationId,
	// 		privacyKey: data.privacyKey,
	// 		agents: Object.entries(data.agentGraphRequest?.agents ?? {})
	// 			.filter(([_, agent]) => agent.provider.type === 'local')
	// 			.map(([name, agent]) => ({
	// 				name: agent.name,
	// 				provider: agent.provider as any, // FIXME: annoying hack since ts doesn't know we filtered for local providers
	// 				blocking: agent.blocking ?? true,
	// 				options: agent.options,
	// 				customTools: new Set(agent.customToolAccess)
	// 			}))
	// 	};
	// 	selectedAgent = $formData.agentGraphRequest.length > 0 ? 0 : null;
	// };

	// let asJson: CreateSessionRequest = $derived.by(() => {
	// 	return {
	// 		privacyKey: $formData.privacyKey,
	// 		applicationId: $formData.applicationId,
	// 		agentGraphRequest: {
	// 			agents: $formData.agentGraphRequest.map((agent) => ({
	// 				id: {
	// 					name: agent.name,
	// 					version: registry[agent.name]?.id.version ?? '1.0.0'
	// 				},
	// 				name: agent.name,
	// 				options: agent.options as any, // FIXME
	// 				systemPrompt: agent.systemPrompt,
	// 				blocking: agent.blocking,
	// 				customToolAccess: Array.from(agent.customToolAccess),
	// 				provider: agent.provider
	// 			})),
	// 			customTools: Object.fromEntries(
	// 				Array.from(usedTools).map((tool) => [tool, tools[tool]])
	// 			) as any, // FIXME: !!!
	// 			groups: $formData.links
	// 		}
	// 	} satisfies CreateSessionRequest;
	// });
>>>>>>> Stashed changes
</script>

{#if ctx.connection}
	<Dialog.Root bind:open>
		<Dialog.Content
			class="grid max-h-[90svh] grid-cols-[100%] grid-rows-[max-content_minmax(0,1fr)_max-content] gap-y-2 lg:max-w-2xl"
		>
			<Dialog.Header>
				<Dialog.Title>New Session</Dialog.Title>
				<Dialog.Description>Create a new session.</Dialog.Description>
			</Dialog.Header>
			<form method="POST" use:enhance>
				<ScrollArea class="">
					<section class="flex max-w-full flex-col gap-2 pr-4">
						<section class="grid grid-cols-[minmax(0,max-content)_auto] gap-4 gap-y-2 pt-2">
							<Form.Field {form} name="applicationId">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Application ID</Form.Label>
										<Input {...props} bind:value={$formData.applicationId} />
									{/snippet}
								</Form.Control>
							</Form.Field>
							<Form.Field {form} name="privacyKey">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Privacy Key</Form.Label>
										<Input {...props} type="password" bind:value={$formData.privacyKey} />
									{/snippet}
								</Form.Control>
							</Form.Field>
						</section>
						<!-- <ClipboardImportDialog onImport={importFromJson}>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-fit">Import <ClipboardCopy /></Button>
							{/snippet}
						</ClipboardImportDialog> -->
						<Separator class="mt-2" />

						<h2>Agents</h2>
						<!-- TODO: h-96 here but overflow is ruining me -->
						<section class="grid grid-cols-2 grid-rows-[min-content_1fr] gap-1 gap-x-2">
							<ScrollArea
								class="bg-card text-card-foreground row-span-full flex min-h-0 flex-col gap-6 rounded-md border shadow-sm"
							>
								<ul class="flex h-full min-h-0 w-full grow flex-col content-stretch">
									{#each $formData.agentGraphRequest as agent, i}
										<li class="contents">
											<Toggle
												class="flex justify-start pr-0"
												bind:pressed={() => selectedAgent === i, () => (selectedAgent = i)}
											>
												<p class="grow">{agent.name}</p>
												<TwostepButton
													class="size-9"
													variant="outline"
													onclick={() => {
														$formData.agentGraphRequest.splice(i, 1);
														$formData.agentGraphRequest = $formData.agentGraphRequest;
														selectedAgent =
															selectedAgent &&
															Math.min(selectedAgent, $formData.agentGraphRequest.length - 1);
													}}><TrashIcon /></TwostepButton
												>
											</Toggle>
										</li>
									{/each}
									{#if $formData.agentGraphRequest.length == 0}
										<li class="contents">
											<p
												class="text-muted-foreground flex h-9 grow items-center justify-center text-sm"
											>
												No agents added.
											</p>
										</li>
									{:else}
										<li class="grow"></li>
									{/if}
									<Combobox
										side="right"
										align="start"
										options={Object.keys(registry)}
										searchPlaceholder="Search agents..."
										onValueChange={(value) => {
<<<<<<< Updated upstream
											const count = $formData.agents.filter(
												(agent) => agent.agentName === value
											).length;
											$formData.agents.push({
												agentName: value,
=======
											const count = $formData.agentGraphRequest.filter(
												(agent) => agent.name === value
											).length;
											$formData.agentGraphRequest.push({
>>>>>>> Stashed changes
												provider: {
													type: 'local',
													runtime: registry[value]?.runtimes?.at(-1) ?? 'executable'
												},
												id: {
													name: value,
													version: registry[value]?.id.version ?? '1.0.0'
												},
												systemPrompt: undefined,
												blocking: true,
												name: value + (count > 0 ? `-${count + 1}` : ''),
												options: {},
												customToolAccess: new Set()
											});
											$formData.agentGraphRequest = $formData.agentGraphRequest;
											selectedAgent = $formData.agentGraphRequest.length - 1;
										}}
									>
										{#snippet trigger({ props })}
											<Button {...props} size="icon" class="mt-2 w-full gap-1 px-3"
												>New agent<PlusIcon /></Button
											>{/snippet}
										{#snippet option({ option })}
											{option}
										{/snippet}
									</Combobox>
								</ul>
							</ScrollArea>
<<<<<<< Updated upstream
							{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
								{@const agent = $formData.agents[selectedAgent]!}
								{@const availableOptions = agent && agents[agent.agentName]?.options}
=======
							{#if selectedAgent !== null && $formData.agentGraphRequest.length > selectedAgent}
								{@const agent = $formData.agentGraphRequest[selectedAgent]!}
								{@const availableOptions = agent && registry[agent.name]?.options}
>>>>>>> Stashed changes
								<Tabs.Root value="options" class="min-h-0">
									<Tabs.List class="w-full">
										<Tabs.Trigger value="options">Options</Tabs.Trigger>
										<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
										<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
									</Tabs.List>
									<ScrollArea class="min-h-0">
										<Tabs.Content value="options" class="flex min-h-0 flex-col gap-2">
											{#if availableOptions && selectedAgent !== null && $formData.agentGraphRequest.length > selectedAgent}
												<Form.ElementField
													{form}
													name="agents.[{selectedAgent}].name"
													class="flex items-center gap-2"
												>
													<Form.Control>
														{#snippet children({ props })}
															<TooltipLabel
																tooltip={'Name of the agent in this session'}
																class="m-0">Name</TooltipLabel
															>
															<Input
																{...props}
																bind:value={$formData.agentGraphRequest[selectedAgent!]!.name}
															/>
														{/snippet}
													</Form.Control>
												</Form.ElementField>
												<Form.ElementField
													{form}
													name="agents[{selectedAgent}].name"
													class="flex items-center gap-2"
												>
													<Form.Control>
														{#snippet children({ props })}
															<TooltipLabel tooltip={'Type of this agent'} class="m-0"
																>Type</TooltipLabel
															>
															<Combobox
																{...props}
																class="w-auto grow pr-[2px]"
																side="right"
																align="start"
																options={Object.keys(registry)}
																searchPlaceholder="Search agents..."
<<<<<<< Updated upstream
																bind:value={$formData.agents[selectedAgent!]!.agentName}
=======
																bind:value={$formData.agentGraphRequest[selectedAgent].name}
>>>>>>> Stashed changes
																onValueChange={() => {
																	for (const name in $formData.agentGraphRequest[selectedAgent!]!
																		.options) {
																		if (!(name in availableOptions)) {
																			delete $formData.agentGraphRequest[selectedAgent!]!.options[
																				name
																			];
																		}
																	}
																	$formData.agentGraphRequest = $formData.agentGraphRequest;
																}}
															/>
														{/snippet}
													</Form.Control>
												</Form.ElementField>
												<Form.ElementField
													{form}
													name="agents[{selectedAgent}].provider.runtime"
													class="flex items-center gap-2"
												>
													<Form.Control>
														{#snippet children({ props })}
															<TooltipLabel
																tooltip={'What runtime to use for this agent.'}
																class="m-0">Runtime</TooltipLabel
															>
															<Combobox
																{...props}
																class="w-auto grow pr-[2px]"
																side="right"
																align="start"
<<<<<<< Updated upstream
																options={agents[agent.agentName]?.runtimes ?? []}
=======
																options={registry[agent.name]?.runtimes ?? []}
>>>>>>> Stashed changes
																searchPlaceholder="Search agents..."
																bind:value={
																	$formData.agentGraphRequest[selectedAgent!]!.provider.runtime
																}
															/>
														{/snippet}
													</Form.Control>
												</Form.ElementField>
												<Separator />
												{#each Object.entries(availableOptions) as [name, opt] (name)}
													<Form.ElementField
														{form}
														name="agents[{selectedAgent}].options.{name}.value"
													>
														<Form.Control>
															{#snippet children({ props })}
																<TooltipLabel tooltip={opt.description} class="gap-1">
																	{name}
																	{#if !('default' in opt) || opt.default === undefined}
																		<span class="text-destructive">*</span>
																	{/if}
																</TooltipLabel>
																<Input
																	{...props}
																	type={inputTypes[opt.type]}
																	bind:value={
																		() =>
																			$formData.agentGraphRequest[selectedAgent!]!.options[name]
																				?.value,
																		(value) => {
																			$formData.agentGraphRequest[selectedAgent!]!.options[name] = {
																				type: opt.type,
																				value
																			} as any; // FIXME: !!
																		}
																	}
																	placeholder={'default' in opt
																		? opt.default?.toString()
																		: undefined}
																/>
															{/snippet}
														</Form.Control>
													</Form.ElementField>
												{/each}
											{/if}
										</Tabs.Content>
										<Tabs.Content value="prompt">
											<Form.ElementField {form} name="agents[{selectedAgent}].systemPrompt">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label class="text-muted-foreground leading-tight"
															>Additional system prompt to add to this agent.</Form.Label
														>
														<Textarea
															{...props}
															bind:value={$formData.agentGraphRequest[selectedAgent!]!.systemPrompt}
														/>
													{/snippet}
												</Form.Control>
											</Form.ElementField>
										</Tabs.Content>
										<Tabs.Content value="tools">
											<Form.Fieldset {form} name="agents[{selectedAgent}].customToolsAccess">
												<ul class="flex flex-col gap-2">
													{#each Object.keys(tools) as tool (tool)}
														<li class="flex gap-2">
															<Form.Control>
																{#snippet children({ props })}
																	<Checkbox
																		{...props}
																		value={tool}
																		bind:checked={
																			() =>
																				$formData.agentGraphRequest[
																					selectedAgent!
																				]?.customToolAccess?.has(tool) ?? false,
																			() => {}
																		}
																		onCheckedChange={(checked) => {
																			if (
																				selectedAgent === null ||
																				!$formData.agentGraphRequest[selectedAgent]
																			)
																				return;
																			if (checked)
																				$formData.agentGraphRequest[
																					selectedAgent!
																				]!.customToolAccess.add(tool);
																			else
																				$formData.agentGraphRequest[
																					selectedAgent!
																				]!.customToolAccess.delete(tool);
																			$formData.agentGraphRequest = $formData.agentGraphRequest;
																		}}
																	/>
																	<Form.Label>{tool}</Form.Label>
																{/snippet}
															</Form.Control>
														</li>{/each}
												</ul>
											</Form.Fieldset>
										</Tabs.Content>
									</ScrollArea>
								</Tabs.Root>
							{/if}
						</section>

						<ModalCollapsible title="Groups">
							<p class="text-muted-foreground text-sm leading-tight">
								Define a list of groups, where each agent in a group can all interact.
							</p>
							<ul class="mt-2 flex flex-col gap-1">
								{#each $formData.links as link, i}
									<Select.Root
										type="multiple"
										value={link}
										onValueChange={(value) => {
											$formData.links[i] = value;
											$formData.links = $formData.links;
										}}
									>
										<Select.Trigger>
											{#if link.length == 0}
												<span class="text-muted-foreground text-sm italic">Empty Group</span>
											{:else}
												{link.join(', ')}
											{/if}
										</Select.Trigger>
										<Select.Content>
											{#if $formData.agentGraphRequest.length == 0}
												<span class="text-muted-foreground px-2 text-sm italic">No agents</span>
											{/if}
											{#each new Set($formData.agentGraphRequest.map((agent) => agent.name)) as id}
												<Select.Item value={id}>{id}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/each}
								<Button
									size="icon"
									class="w-fit gap-1 px-3"
									disabled={($formData.links.at(-1)?.length ?? 1) == 0}
									onclick={() => {
										$formData.links = [...$formData.links, []];
									}}>New group<PlusIcon /></Button
								>
							</ul>
						</ModalCollapsible>
						<!-- <ModalCollapsible title="Export">
							<CodeBlock text={JSON.stringify(asJson, null, 2)} class="" language="json" />
							TODO: add an Issues: collapsible with a user friendly list (e.g "Agents > my-agent > API_KEY : misssing required field", and it's clickable)
							<CodeBlock text={JSON.stringify($errors, null, 2)} class="" language="json" />
						</ModalCollapsible> -->
					</section>
				</ScrollArea>

				<Dialog.Footer>
					<Form.Button>Create</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
