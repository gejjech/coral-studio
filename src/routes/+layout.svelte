<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { socketCtx, type Agent, type Message, type Thread } from '$lib/threads';
	import { SvelteMap } from 'svelte/reactivity';
	import '../app.css';

	let { children } = $props();

	let socket = $state({
		host: null,
		appId: null,
		privKey: null,
		session: null,
		agentId: null,

		socket: null,
		threads: new SvelteMap<string, Thread>(),
		messages: new SvelteMap<string, Message[]>(),
		agents: new SvelteMap<string, Agent>()
	});
	socketCtx.set(socket);
</script>

<Toaster />
{@render children()}
