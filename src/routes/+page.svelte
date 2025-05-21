<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
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
						if (socket.socket) {
							socket.socket.close();
							socket.socket = null;
						} else {
							socket.socket = new WebSocket(
								`ws://${host.current}/debug/${appId.current}/${privKey.current}/${session.current}/?timeout=10000`
							);
							socket.host = host.current;
							socket.privKey = privKey.current;
							socket.appId = appId.current;
							socket.session = session.current;

							socket.socket.onopen = () => {
								toast.success('WS connected.');
							};
							socket.socket.onerror = (e) => {
								toast.error(`WS error: ${e}`);
								socket.socket?.close();
								socket.socket = null;
							};
							socket.socket.onclose = () => {
								socket.host = null;
								socket.privKey = null;
								socket.appId = null;
								socket.session = null;
								socket.socket = null;
								socket.threads.clear();
								socket.agents.clear();
							};
							socket.socket.onmessage = (ev) => {
								let data = null;
								try {
									data = JSON.parse(ev.data);
								} catch (e) {
									toast.warning(`ws: '${ev.data}'`);
									return;
								}

								switch (data.type ?? '') {
									case 'DebugAgentRegistered':
										socket.agentId = data.id;
										break;
									case 'ThreadList':
										for (const thread of data.threads) {
											socket.threads.set(thread.id, { messages: [], ...thread });
										}
										break;
									case 'AgentList':
										for (const agent of data.agents) {
											socket.agents.set(agent.id, agent);
										}
										break;
									case 'org.coralprotocol.coralserver.session.Event.AgentRegistered':
										socket.agents.set(data.agent.id, data.agent);
										break;
									case 'org.coralprotocol.coralserver.session.Event.ThreadCreated':
										console.log('new thread');
										socket.threads.set(data.id, {
											id: data.id,
											name: data.name,
											participants: data.participants,
											messages: [],
											summary: data.summary,
											creatorId: data.creatorId,
											isClosed: data.isClosed
										});
										break;
									case 'org.coralprotocol.coralserver.session.Event.MessageSent':
										const thread = socket.threads.get(data.message.threadId);
										if (thread) {
											console.log('message setn');
											thread.messages.push(data.message);
											socket.threads.set(thread.id, thread);
										} else {
											console.warn('uh oh');
										}
										break;
								}

								console.log({ data });
							};
						}
					}}
				>
					{socket.socket === null ? 'Connect' : 'Disconnect'}
				</Button>
			</header>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
