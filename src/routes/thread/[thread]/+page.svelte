<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Input from '$lib/components/ui/input/input.svelte';
	import ScrollAreaScrollbar from '$lib/components/ui/scroll-area/scroll-area-scrollbar.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { socketCtx } from '$lib/threads';

	let conn = socketCtx.get();
	let thread = $derived(conn.threads.get(page.params['thread']));
	let messages = $derived(conn.messages.get(page.params['thread']));

	let message = $state('');
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link>Threads</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>{thread?.name}</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<main class="flex flex-1 flex-col gap-4 p-4">
			<ScrollArea class="flex-grow">
				<div class="flex flex-grow flex-col gap-4">
					{#each messages ?? [] as message (message.id)}
						<div class="bg-muted/50 hw-full rounded-lg">
							<p>{new Date(message.timestamp).toTimeString()}</p>
							<header class="flex flex-row gap-1">
								<span class="bg-secondary text-secondary-foreground rounded-md">
									{message.senderId}
								</span>
								<span>></span>
								{#each message.mentions as mention}
									<span class="bg-primary text-primary-foreground rounded-md px-1 py-0">
										{mention}
									</span>
								{/each}
							</header>
							<p>{message.content}</p>
						</div>
					{/each}
				</div>
			</ScrollArea>
			<footer class="flex flex-row">
				<Input
					placeholder="send a message"
					disabled={!thread ||
						!conn.appId ||
						!conn.host ||
						!conn.privKey ||
						!conn.session ||
						!conn.agentId}
					bind:value={message}
					onkeydown={(e) => {
						if (
							!thread ||
							!conn.appId ||
							!conn.host ||
							!conn.privKey ||
							!conn.session ||
							!conn.agentId
						)
							return;
						if (e.key == 'Enter') {
							fetch(
								`http://${conn.host}/debug/${conn.appId}/${conn.privKey}/${conn.session}/${conn.agentId}/thread/sendMessage/`,
								{
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									body: JSON.stringify({
										threadId: thread.id,
										content: message,
										mentions: thread.participants.filter((p) => p !== conn.agentId)
									})
								}
							);
							message = '';
						}
					}}
				/>
			</footer>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
