<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		value = $bindable(''),
		selectPlaceholder = 'Select an item...',
		searchPlaceholder = 'Search items...',
		emptyLabel = 'No items found.',
		options = []
	}: {
		open?: boolean;
		value?: string;
		options?: string[];
		selectPlaceholder?: string;
		searchPlaceholder?: string;
		emptyLabel?: string;
	} = $props();

	let triggerRef = $state<HTMLButtonElement>(null!);
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="w-[200px] justify-between"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{value || selectPlaceholder}
				<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0">
		<Command.Root>
			<Command.Input placeholder={searchPlaceholder} />
			<Command.List>
				<Command.Empty>{emptyLabel}</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item
							value={option}
							onSelect={() => {
								value = option;
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn('mr-2 size-4', value !== option && 'text-transparent')} />
							{option}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
