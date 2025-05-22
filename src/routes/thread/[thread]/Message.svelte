<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { Message } from '$lib/threads';
	import { cn } from '$lib/utils';
	import { ArrowRight, ArrowRightIcon } from '@lucide/svelte';

	function hexToRgb(hex: string) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: null;
	}
	const stringToColor = (string: string) => {
		let hash = 0;
		for (let i = 0; i < string.length; i++) {
			hash = string.charCodeAt(i) + ((hash << 5) - hash);
		}
		let color = '#';
		for (let i = 0; i < 3; i++) {
			let value = (hash >> (i * 8)) & 0xff;
			color += ('00' + value.toString(16)).substr(-2);
		}
		return color;
	};

	const pickTextColor = (bg: string) => {
		const rgb = hexToRgb(bg);
		if (!rgb) return null;
		const { r, g, b } = rgb;
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq < 128 ? 'text-primary-foreground' : 'text-primary';
	};

	let {
		message,
		class: className
	}: {
		message: Message;
		class?: string;
	} = $props();

	let senderColor = $derived(stringToColor(message.senderId));
	let date = $derived(new Date(message.timestamp));
</script>

<Card.Root class={cn('gap-2 py-4', className)}>
	<Card.Header class="flex flex-row gap-1 px-4 text-sm leading-5">
		<span
			class={cn('text-primary-foreground rounded-md px-1.5 py-0', pickTextColor(senderColor))}
			style={`background-color: ${senderColor}`}
		>
			{message.senderId}
		</span>
		<span class="w-max">-></span>
		{#each message.mentions as mention}
			{@const mentionColor = stringToColor(mention)}
			<span
				class={cn(
					'bg-primary text-primary-foreground rounded-md px-1 py-0',
					pickTextColor(mentionColor)
				)}
				style={`background-color: ${mentionColor}`}
			>
				{mention}
			</span>
		{/each}
		<p class="flex-grow text-right">
			{`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
		</p>
	</Card.Header>
	<Card.Content class="px-4">
		{message.content}
	</Card.Content>
</Card.Root>
