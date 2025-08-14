<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Form from '$lib/components/ui/form';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	// TODO: change these icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ClipboardCopy, PlusIcon, TrashIcon } from '@lucide/svelte';

	import { cn } from '$lib/utils';
	import {
		sessionCtx,
		type CustomTool,
		type GraphAgentRequest,
		type PublicRegistryAgent,
		type PublicRegistryAgentWithOptions
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
	import { watch } from 'runed';
	import { SvelteSet } from 'svelte/reactivity';
	import { Textarea } from '$lib/components/ui/textarea';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as schemas from './schemas';
	import Card from '$lib/components/ui/card/card.svelte';

	let ctx = sessionCtx.get();

	let {
		open = $bindable(false),
		agents
	}: { open: boolean; agents: { [id: string]: PublicRegistryAgentWithOptions } } = $props();

	let graph: {
		agents: (PublicRegistryAgentWithOptions & {
			name: string;
			blocking?: boolean;
			tools: (keyof typeof tools)[];
			systemPrompt?: string;
		})[];
	} = $state({
		agents: []
	});

	const form = superForm(defaults(zod4(schemas.formSchema)), {
		SPA: true,
		validators: zod4(schemas.formSchema),
		onUpdate({ form }) {
			if (form.valid) {
				// TODO: Call an external API with form.data, await the result and update form
			}
		}
	});

	const { form: formData, errors, enhance } = form;

	let selectedAgent: number | null = $state(null);

	let finalBody: {
		agentGraph: {
			agents: { [name: string]: GraphAgentRequest };
			links: string[][];
			tools: { [name: string]: CustomTool };
		};
	} = $state({
		agentGraph: { agents: {}, links: [], tools: {} }
	});

	const importFromJson = (text: string) => {
		const data: {
			agentGraph: { agents: { [name: string]: GraphAgentRequest }; links?: string[][] };
		} = JSON.parse(text);
		if (
			!('agentGraph' in data) ||
			typeof data.agentGraph !== 'object' ||
			!data.agentGraph ||
			!('agents' in data.agentGraph) ||
			typeof data.agentGraph.agents !== 'object' ||
			!data.agentGraph.agents
		) {
			return;
		}
		// TODO(alan): proper validation (e.g zod)
		graph.agents = [];
		finalBody.agentGraph.links = data.agentGraph.links ?? [];
		const importAgents = data.agentGraph.agents;
		for (const [name, agent] of Object.entries(importAgents)) {
			if (!('agentType' in agent)) {
				continue;
			}

			const newAgent: PublicRegistryAgentWithOptions & {
				name: string;
				tools: (keyof typeof tools)[];
				systemPrompt?: string;
				blocking?: boolean;
			} = {
				name,
				id: agent.agentType,
				blocking: agent.blocking,
				// TODO (alan): handle when this lookup fails
				options: agents[agent.agentType]!.options,
				systemPrompt: agent.systemPrompt,
				tools: (agent.tools ?? []) as any
			};
			for (const [oName, opt] of Object.entries(agent.options)) {
				newAgent.options[oName]!.value = opt as any;
			}
			graph.agents.push(newAgent);
		}
	};
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
						<section class="grid grid-cols-2 grid-rows-[min-content_1fr] gap-1 gap-x-2">
							<ScrollArea
								class="bg-card text-card-foreground row-span-full flex flex-col gap-6 rounded-xl border shadow-sm"
							>
								<ul class="flex w-full flex-col content-stretch">
									{#each $formData.agents as agent, i}
										<li class="contents">
											<Toggle
												class="justify-start"
												bind:pressed={() => selectedAgent === i, () => (selectedAgent = i)}
												>{agent.name}</Toggle
											>
										</li>
									{/each}
								</ul>
								<Combobox
									side="right"
									align="start"
									options={Object.keys(agents)}
									searchPlaceholder="Search agents..."
									onValueChange={(value) => {
										const count = $formData.agents.filter(
											(agent) => agent.agentType === value
										).length;
										$formData.agents.push({
											agentType: value,
											name: value + (count > 0 ? `-${count + 1}` : '')
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
							</ScrollArea>
							{#if selectedAgent !== null}
								<Form.Fieldset {form} name="agents" class="space-y-0">
									<Form.Control>
										{#snippet children({ props })}
											{#if selectedAgent !== null && $formData.agents.length > selectedAgent}
												<Input {...props} bind:value={$formData.agents[selectedAgent]!.name} />
											{/if}
										{/snippet}
									</Form.Control>
								</Form.Fieldset>
								<Tabs.Root value="options">
									<Tabs.List>
										<Tabs.Trigger value="options">Options</Tabs.Trigger>
										<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
									</Tabs.List>
									<ScrollArea></ScrollArea>
								</Tabs.Root>
							{/if}
						</section>

						<ModalCollapsible title="Groups">
							<p class="text-muted-foreground text-sm leading-tight">
								Define a list of groups, where each agent in a group can all interact.
							</p>
							<ul class="mt-2 flex flex-col gap-1">
								{#each finalBody.agentGraph.links as link, i}
									<Select.Root
										type="multiple"
										value={link}
										onValueChange={(value) => {
											finalBody.agentGraph.links[i] = value;
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
											{#if Object.keys(finalBody.agentGraph.agents).length == 0}
												<span class="text-muted-foreground px-2 text-sm italic">No agents</span>
											{/if}
											{#each Object.keys(finalBody.agentGraph.agents) as id}
												<Select.Item value={id}>{id}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/each}
								<Button
									size="icon"
									class="w-fit gap-1 px-3"
									disabled={(finalBody.agentGraph.links.at(-1)?.length ?? 1) == 0}
									onclick={() => {
										finalBody.agentGraph.links.push([]);
									}}>New group<PlusIcon /></Button
								>
							</ul>
						</ModalCollapsible>
						<ModalCollapsible title="Export">
							<CodeBlock text={JSON.stringify(finalBody, null, 2)} class="" language="json" />
						</ModalCollapsible>
					</section>
				</ScrollArea>

				<Dialog.Footer>
					<Button
						type="submit"
						onclick={async () => {
							if (!ctx.connection) return;
							try {
								const res = await fetch(`http://${ctx.connection.host}/sessions`, {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									body: JSON.stringify({
										...finalBody,
										applicationId: ctx.connection.appId,
										privacyKey: ctx.connection.privacyKey
									})
								});

								if (res.status != 200) {
									// todo @alan there should probably be an api class where we can generic-ify the handling of this error
									// with a proper type implementation too..!
									let error: { message: string; stackTrace: string[] } = await res.json();
									console.error(error.stackTrace);

									toast.error(`Failed to create session: ${error.message}`);
									return;
								}

								let session: { sessionId: string } = await res.json();

								if (!ctx.sessions) ctx.sessions = [];
								ctx.sessions.push(session.sessionId);
								ctx.session = new Session({
									...ctx.connection,
									session: session.sessionId
								});
								open = false;
							} catch (e) {
								console.log(e);
								toast.error(`Failed to create session: ${e}`);
							}
						}}>Create</Button
					>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
