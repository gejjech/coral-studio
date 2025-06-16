<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { socketCtx } from '$lib/threads';
	import '../app.css';

	let { children } = $props();

	let socket = $state({
		session: null,
		sessions: null,
		registry: null
	});
	socketCtx.set(socket);
</script>

<Toaster />
{@render children()}
