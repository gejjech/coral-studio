<script lang="ts">
	import { CopyIcon } from '@lucide/svelte';
	import Button from './ui/button/button.svelte';
	import { cn } from '$lib/utils';

	const { text = '', class: className }: { text?: string; class?: string } = $props();
	let copied = $state(false);
</script>

<code
	class={cn(
		'bg-secondary group relative inline-block rounded-md px-2 py-3 whitespace-pre',
		className
	)}
>
	<Button
		size="icon"
		variant="outline"
		disabled={copied}
		class={cn(
			'absolute top-1 right-1 size-7 p-1 opacity-0 transition-opacity group-hover:opacity-100'
		)}
		onclick={async () => {
			copied = true;
			await navigator.clipboard.writeText(text);
			setTimeout(() => {
				copied = false;
			}, 500);
		}}><CopyIcon class="size-3" /></Button
	>{text}
</code>
