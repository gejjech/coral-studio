<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { socketCtx, type Agent } from '$lib/threads';
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

	let { open = $bindable(false), agents }: { open: boolean; agents: { [id: string]: Agent } } =
		$props();

	let agentPickerOpen = $state(false);
	let graph: { agents: (Agent & { name: string })[] } = $state({
		agents: []
	});

	let finalGraph: { agents: { [name: string]: Agent } } = $state({ agents: {} });
	let finalAgentIds = $derived(graph.agents.map((a) => a.name));
	let duplicateNames: SvelteSet<string> = $state(new SvelteSet());

	watch(
		() => finalAgentIds,
		() => {
			finalGraph.agents = {};
			duplicateNames.clear();
			for (const agent of graph.agents) {
				if (agent.name in finalGraph.agents) {
					duplicateNames.add(agent.name);
					continue;
				}
				finalGraph.agents[agent.name] = agent;
			}
		}
	);

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
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>New Session</Dialog.Title>
			<Dialog.Description>Create a new session.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
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
													graph.agents.push({ ...agent, name: `agent-${graph.agents.length + 1}` });
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
									class={cn(buttonVariants({ size: 'icon', variant: 'outline' }), 'size-8')}
								>
									<ChevronRightIcon
										class="transition-transform group-data-[state=open]/collapsible:rotate-90"
									/>
								</Collapsible.Trigger>
								<Input
									bind:value={agent.name}
									placeholder="agent name"
									aria-invalid={duplicateNames.has(agent.name)}
								/>
								<Combobox
									bind:value={agent.id}
									options={Object.keys(agents)}
									selectPlaceholder="Select an agent..."
									searchPlaceholder="Search agents..."
									emptyLabel="No agents found."
								/>
							</div>
							<Collapsible.Content class="grid grid-cols-[max-content_auto] gap-2 p-2">
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
										bind:value={option.value}
									/>
								{/each}
							</Collapsible.Content>
						</Collapsible.Root>
					{/each}
				</ul>
			</div>
		</div>

		<Dialog.Footer>
			<Button type="submit" onclick={() => {}} disabled={!valid}>Create</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
