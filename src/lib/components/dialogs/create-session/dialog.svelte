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
	import { Button } from '$lib/components/ui/button';
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
	import CodeBlock from '$lib/components/code-block.svelte';
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
		agents
	}: { open: boolean; agents: { [id: string]: PublicRegistryAgent } } = $props();
	console.debug('[SessionForm] props.agents', JSON.stringify(agents, null, 2)); // DEBUG

	let formSchema = $derived(schemas.makeFormSchema(agents));
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
						body: asJson
					});
					console.debug('[onUpdate] POST result', res); // DEBUG

					if (res.error) {
						console.error('[onUpdate] res.error', res.error); // DEBUG
						let error = {
							message: res.error.message ?? 'Unknown error',
							stackTrace: res.error.stackTrace
						};
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
	console.debug('[SessionForm] formData', $formData); // DEBUG

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

	let usedTools = $derived(
		new Set($formData.agents.flatMap((agent) => Array.from(agent.customTools)))
	) as Set<keyof typeof tools>;
	$inspect('[SessionForm] usedTools', usedTools); // DEBUG

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
	$inspect('[SessionForm] selectedAgent', selectedAgent); // DEBUG
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
						<ClipboardImportDialog onImport={importFromJson}>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-fit">Import <ClipboardCopy /></Button>
							{/snippet}
						</ClipboardImportDialog>
						<Separator class="mt-2" />

						<h2>Agents</h2>
						<!-- TODO: h-96 here but overflow is ruining me -->
						<section class="grid grid-cols-2 grid-rows-[min-content_1fr] gap-1 gap-x-2">
							<ScrollArea
								class="bg-card text-card-foreground row-span-full flex min-h-0 flex-col gap-6 rounded-md border shadow-sm"
							>
								<ul class="flex h-full min-h-0 w-full grow flex-col content-stretch">
									{#each $formData.agents as agent, i}
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
														$formData.agents.splice(i, 1);
														$formData.agents = $formData.agents;
														selectedAgent =
															selectedAgent && Math.min(selectedAgent, $formData.agents.length - 1);
													}}><TrashIcon /></TwostepButton
												>
											</Toggle>
										</li>
									{/each}
									{#if $formData.agents.length == 0}
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
										options={Object.keys(agents)}
										searchPlaceholder="Search agents..."
										onValueChange={(value) => {
											const count = $formData.agents.filter((agent) => agent.name === value).length;
											$formData.agents.push({
												provider: {
													type: 'local',
													runtime: agents[value]?.runtimes?.at(-1) ?? 'executable'
												},
												systemPrompt: undefined,
												blocking: true,
												name: value + (count > 0 ? `-${count + 1}` : ''),
												options: {},
												customTools: new Set()
											});
											$formData.agents = $formData.agents;
											selectedAgent = $formData.agents.length - 1;
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
							{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
								{@const agent = $formData.agents[selectedAgent]!}
								{@const availableOptions = agent && agents[agent.name]?.options}
								<Tabs.Root value="options" class="min-h-0">
									<Tabs.List class="w-full">
										<Tabs.Trigger value="options">Options</Tabs.Trigger>
										<Tabs.Trigger value="prompt">Prompt</Tabs.Trigger>
										<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
									</Tabs.List>
									<ScrollArea class="min-h-0">
										<Tabs.Content value="options" class="flex min-h-0 flex-col gap-2">
											{#if availableOptions && selectedAgent !== null && $formData.agents.length > selectedAgent}
												<Form.ElementField
													{form}
													name="agents[{selectedAgent}].name"
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
																bind:value={$formData.agents[selectedAgent!]!.name}
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
																options={Object.keys(agents)}
																searchPlaceholder="Search agents..."
																bind:value={$formData.agents[selectedAgent].name}
																onValueChange={() => {
																	for (const name in $formData.agents[selectedAgent!]!.options) {
																		if (!(name in availableOptions)) {
																			delete $formData.agents[selectedAgent!]!.options[name];
																		}
																	}
																	$formData.agents = $formData.agents;
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
																options={agents[agent.name]?.runtimes ?? []}
																searchPlaceholder="Search agents..."
																bind:value={$formData.agents[selectedAgent!]!.provider.runtime}
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
																		() => $formData.agents[selectedAgent!]!.options[name]?.value,
																		(value) => {
																			$formData.agents[selectedAgent!]!.options[name] = {
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
															bind:value={$formData.agents[selectedAgent!]!.systemPrompt}
														/>
													{/snippet}
												</Form.Control>
											</Form.ElementField>
										</Tabs.Content>
										<Tabs.Content value="tools">
											<Form.Fieldset {form} name="agents[{selectedAgent}].customTools">
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
																				$formData.agents[selectedAgent!]?.customTools?.has(tool) ??
																				false,
																			() => {}
																		}
																		onCheckedChange={(checked) => {
																			if (
																				selectedAgent === null ||
																				!$formData.agents[selectedAgent]
																			)
																				return;
																			if (checked)
																				$formData.agents[selectedAgent!]!.customTools.add(tool);
																			else
																				$formData.agents[selectedAgent!]!.customTools.delete(tool);
																			$formData.agents = $formData.agents;
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
											{#if $formData.agents.length == 0}
												<span class="text-muted-foreground px-2 text-sm italic">No agents</span>
											{/if}
											{#each new Set($formData.agents.map((agent) => agent.name)) as id}
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
						<ModalCollapsible title="Export">
							<CodeBlock text={JSON.stringify(asJson, null, 2)} class="" language="json" />
							<!-- TODO: add an Issues: collapsible with a user friendly list (e.g "Agents > my-agent > API_KEY : misssing required field", and it's clickable)
							<!-- <CodeBlock text={JSON.stringify($errors, null, 2)} class="" language="json" /> -->
						</ModalCollapsible>
					</section>
				</ScrollArea>

				<Dialog.Footer>
					<Form.Button>Create</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
