<script lang="ts">
	import User from 'phosphor-icons-svelte/IconUserRegular.svelte';
	import Robot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import Wrench from 'phosphor-icons-svelte/IconWrenchRegular.svelte';
	import CodeBlock from '$lib/components/code-block.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	let {
		message
	}: {
		message: any;
	} = $props();

	const roleMap = {
		user: {
			borderClass: 'border-telemetry-user/20',
			textClass: 'text-telemetry-user',
			icon: User,
			label: 'User input'
		},
		assistant: {
			borderClass: 'border-telemetry-assistant/20',
			textClass: 'text-telemetry-assistant',
			icon: Robot,
			label: 'Assistant'
		},
		tool: {
			borderClass: 'border-telemetry-tool/20',
			textClass: 'text-telemetry-tool',
			icon: Wrench,
			label: 'Tool response'
		}
	};

	const defaultRole = {
		borderClass: 'border-transparent',
		textClass: 'text-muted-foreground',
		icon: null,
		label: 'Unrecognised role'
	};

	type Role = keyof typeof roleMap;

	let roleKey = message.role;

	if (!(roleKey in roleMap)) {
		roleKey = 'user';
	}

	let roleData = $state(roleMap[message.role as Role] || defaultRole);
	const Icon = $derived(roleData.icon || null);
</script>

<li
	class={`bg-sidebar flex flex-row gap-4 rounded-lg border-2 p-4 py-6 text-sm ${roleData.borderClass}`}
>
	<div
		class={`bg-input relative h-6 w-6 self-center rounded-lg p-5 *:absolute *:inset-0 *:m-auto *:h-6 *:w-6`}
	>
		{#if roleData.icon != null}
			<Icon class={roleData.textClass} />
		{:else}
			<span class="text-muted-foreground">?</span>
		{/if}
	</div>

	<section class="text-muted-foreground flex w-full flex-col gap-2">
		{#if message.content && message.content.length > 0}
			<span class="text-foreground font-bold">{roleData.label}</span>

			{#each message.content as part}
				{#if message.role != 'user'}
					<CodeBlock
						text={part.text}
						class=" max-w-full  whitespace-break-spaces "
						language="json"
					/>
				{:else}
					<p class="whitespace-pre-wrap">{part.text}</p>
				{/if}
			{/each}
		{:else if message.tool_calls}
			<span class="text-foreground font-bold">Agent invoked tools</span>
			<ul>
				{#each message.tool_calls as toolCall}
					<li>
						<span class="font-bold">{toolCall.function.name} </span>
						<CodeBlock text={toolCall.function.arguments} class="max-w-max" language="json" />
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-gray-400 italic">No content</p>
		{/if}
	</section>
</li>

<Separator orientation="vertical" class="separator ml-6 h-6 max-h-6 min-h-6" />
