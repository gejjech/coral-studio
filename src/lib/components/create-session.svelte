<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { socketCtx, type Agent, type RegistryAgent } from '$lib/threads';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { ChevronDown, Plus, PlusIcon } from '@lucide/svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';
	import { tick, untrack } from 'svelte';
	import { useId } from 'bits-ui';
	import Input from './ui/input/input.svelte';
	import Layout from '../../routes/+layout.svelte';
	import Combobox from './combobox.svelte';
	import { watch } from 'runed';
	import { SvelteSet } from 'svelte/reactivity';
	import CodeBlock from './code-block.svelte';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';

	let {
		open = $bindable(false),
		agents
	}: { open: boolean; agents: { [id: string]: RegistryAgent } } = $props();

	let agentPickerOpen = $state(false);
	let graph: { agents: (RegistryAgent & { name: string })[] } = $state({
		agents: []
	});

	let finalGraph: { agents: { [name: string]: Agent } } = $state({ agents: {} });
	let finalAgentIds = $derived(graph.agents.map((a) => a.name));
	let finalAgentOptions = $derived(
		Object.fromEntries(
			graph.agents.map((a) => [
				a.name,
				Object.fromEntries(Object.entries(a.options).map(([k, v]) => [k, v.value]))
			])
		)
	);
	let duplicateNames: SvelteSet<string> = $state(new SvelteSet());

	watch([() => finalAgentIds, () => finalAgentOptions], () => {
		finalGraph.agents = {};
		duplicateNames.clear();
		for (const agent of graph.agents) {
			if (agent.name in finalGraph.agents) {
				duplicateNames.add(agent.name);
				continue;
			}
			finalGraph.agents[agent.name] = {
				options: finalAgentOptions[agent.name],
				id: agent.id
			};
		}
	});

	let valid = $derived(
		duplicateNames.size == 0 &&
			graph.agents.every((v) => {
				return Object.values(v.options).every((opt) => {
					console.log({
						opt,
						default: opt.default,
						value: opt.value,
						valid: opt.default !== null || !!opt.value
					});
					return opt.default !== null || !!opt.value;
				});
			})
	);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		agentPickerOpen = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
	const triggerId = useId();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="grid max-h-[90svh] grid-rows-[max-content_minmax(0,1fr)_max-content]">
		<Dialog.Header>
			<Dialog.Title>New Session</Dialog.Title>
			<Dialog.Description>Create a new session.</Dialog.Description>
		</Dialog.Header>
		<ScrollArea class="-mr-4">
			<div class="grid gap-4 py-4 pr-4">
				<div class="flex flex-col gap-4">
					<section class="flex flex-row gap-2">
						<Label class="text-right">Agents</Label>
						<Popover.Root bind:open={agentPickerOpen}>
							<Popover.Trigger
								id={triggerId}
								class={buttonVariants({
									variant: 'outline',
									size: 'icon',
									class: 'justify-center'
								})}
							>
								<PlusIcon />
							</Popover.Trigger>
							<Popover.Content class="w-[200px] p-0" side="right" align="start">
								<Command.Root>
									<Command.Input placeholder="Add agent..." />
									<Command.List>
										<Command.Empty>No results found.</Command.Empty>
										<Command.Group>
											{#each Object.values(agents) as agent}
												<Command.Item
													value={agent.id}
													onSelect={() => {
														graph.agents.push({
															...agent,
															name: `agent-${graph.agents.length + 1}`
														});
														closeAndFocusTrigger(triggerId);
													}}
												>
													<span>
														{agent.id}
													</span>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					</section>

					<ul>
						{#each graph.agents as agent}
							<Collapsible.Root class="group/collapsible" open={true}>
								<div class="flex flex-row items-center gap-1">
									<Collapsible.Trigger
										class={cn(buttonVariants({ size: 'icon', variant: 'ghost' }), 'size-8')}
									>
										<ChevronRightIcon
											class="transition-transform group-data-[state=open]/collapsible:rotate-90"
										/>
									</Collapsible.Trigger>
									<Input
										bind:value={agent.name}
										placeholder="agent name"
										aria-invalid={!agent.name || duplicateNames.has(agent.name)}
									/>
									<Combobox
										bind:value={agent.id}
										options={Object.keys(agents)}
										onValueChange={(id) => {
											const newAgent = agents[id];
											if (!newAgent) return;
											agent.options = newAgent.options;
										}}
										selectPlaceholder="Select an agent..."
										searchPlaceholder="Search agents..."
										emptyLabel="No agents found."
									/>
								</div>
								<Collapsible.Content class="flex flex-col gap-1 p-2 pl-4">
									<Collapsible.Root class="group/options" open={true}>
										<Collapsible.Trigger
											class={cn(
												buttonVariants({ size: 'icon', variant: 'ghost' }),
												'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
											)}
										>
											<ChevronRightIcon
												class="transition-transform group-data-[state=open]/options:rotate-90"
											/>
											<h3 class="text-sm font-bold">Options</h3>
										</Collapsible.Trigger>
										<Collapsible.Content class="grid grid-cols-[max-content_auto] gap-2 p-2 pl-4">
											{#each Object.values(agent.options) as option (option.name)}
												<Tooltip.Provider>
													<Tooltip.Root disabled={!option.description}>
														<Tooltip.Trigger>
															{#snippet child({ props })}
																<Label {...props} class="gap-1">
																	{option.name}
																	<span class="text-destructive"
																		>{option.default === null ? '*' : ''}
																	</span>
																</Label>
															{/snippet}
														</Tooltip.Trigger>
														<Tooltip.Content>
															<p>{option.description}</p>
														</Tooltip.Content>
													</Tooltip.Root>
												</Tooltip.Provider>
												<Input
													placeholder={option.default !== null ? option.default.toString() : ''}
													required={option.default === null}
													aria-invalid={option.default === null && !option.value}
													bind:value={option.value}
												/>
											{/each}
										</Collapsible.Content>
									</Collapsible.Root>
									<Collapsible.Root class="group/tools" open={false}>
										<Collapsible.Trigger
											class={cn(
												buttonVariants({ size: 'icon', variant: 'ghost' }),
												'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
											)}
										>
											<ChevronRightIcon
												class="transition-transform group-data-[state=open]/tools:rotate-90"
											/>
											<h3 class="text-sm font-bold">Custom Tools</h3>
										</Collapsible.Trigger>
										<Collapsible.Content class="grid grid-cols-[max-content_auto] gap-2 p-2">
											{#each Object.values(agent.options) as option (option.name)}{/each}
										</Collapsible.Content>
									</Collapsible.Root>
								</Collapsible.Content>
							</Collapsible.Root>
						{/each}
					</ul>
				</div>
				<Collapsible.Root class="group/tools" open={false}>
					<Collapsible.Trigger
						class={cn(
							buttonVariants({ size: 'icon', variant: 'ghost' }),
							'flex h-6 w-max flex-row items-center gap-1 px-2 pl-1'
						)}
					>
						<ChevronRightIcon
							class="transition-transform group-data-[state=open]/tools:rotate-90"
						/>
						<h3 class="text-sm font-bold">Import/Export</h3>
					</Collapsible.Trigger>
					<Collapsible.Content class="p-2 pl-4">
						<CodeBlock text={JSON.stringify(finalGraph, null, 2)} class="w-full" language="json" />
					</Collapsible.Content>
				</Collapsible.Root>
			</div>
		</ScrollArea>

		<Dialog.Footer>
			<Button type="submit" onclick={() => {}} disabled={!valid}>Create</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
