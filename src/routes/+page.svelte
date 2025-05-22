<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Session } from '$lib/session.svelte';
	import { socketCtx } from '$lib/threads';
	import { PersistedState } from 'runed';
	import { toast } from 'svelte-sonner';

	let socket = socketCtx.get();

	let host = new PersistedState('host', '127.0.0.1:5555');
	let appId = new PersistedState('appId', 'appId');
	let privKey = new PersistedState('privKey', 'privKey');
	let session = new PersistedState('session', 'session1');
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<main>
			<header class="flex flex-row">
				<Input placeholder="127.0.0.1:5555" bind:value={host.current} />
				<Input placeholder="app id" bind:value={appId.current} />
				<Input placeholder="privacy key" bind:value={privKey.current} />
				<Input placeholder="session" bind:value={session.current} />
				<Button
					onclick={() => {
						if (socket.session) {
							socket.session.close();
							socket.session = null;
						} else {
							socket.session = new Session({
								host: host.current,
								session: session.current,
								privKey: privKey.current,
								appId: appId.current
							});
						}
					}}
				>
					{socket.session === null ? 'Connect' : 'Disconnect'}
				</Button>
			</header>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
