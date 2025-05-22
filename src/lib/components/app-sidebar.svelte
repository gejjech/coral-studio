<script lang="ts" module>
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { socketCtx } from '$lib/threads';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Badge from './ui/badge/badge.svelte';
	import { cn } from '$lib/utils';

	let ctx = socketCtx.get();
	let conn = $derived(ctx.session);

	let threadName = $state('');
	let participants: string[] = $state([]);
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<span class="text-base font-semibold">coral-dbg</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="gap-0">
		<Sidebar.Group>
			<Sidebar.GroupLabel
				class="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
			>
				Threads
				<!-- <ChevronRightIcon -->
				<!-- 	class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" -->
				<!-- /> -->
			</Sidebar.GroupLabel>

			<Dialog.Root>
				<Dialog.Trigger
					disabled={!conn?.appId ||
						!conn?.host ||
						!conn?.privKey ||
						!conn?.session ||
						!conn?.agentId}
				>
					{#snippet child({ props })}
						<Sidebar.GroupAction {...props} title="Create Thread">
							<Plus /> <span class="sr-only">Create Thread</span>
						</Sidebar.GroupAction>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>New Thread</Dialog.Title>
						<Dialog.Description>Create a new thread.</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid grid-cols-4 items-center gap-4">
							<Label for="name" class="text-right">Name</Label>
							<Input id="name" bind:value={threadName} class="col-span-3" autocomplete="name" />
						</div>
						<div class="grid grid-cols-4 items-center gap-4">
							<Label class="text-right">Participants</Label>
							<Select.Root type="multiple" bind:value={participants}>
								<Select.Trigger class="w-[180px]"></Select.Trigger>
								<Select.Content>
									{#each Object.values(conn?.agents ?? {}) as agent}
										<Select.Item value={agent.id}>{agent.id}</Select.Item>
									{/each}
									{#if Object.values(conn?.agents ?? {}).length == 0}
										<p class="text-muted-foreground text-center text-sm">No agents registered.</p>
									{/if}
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<Dialog.Footer>
						<Button
							type="submit"
							onclick={() => {
								if (
									!conn?.appId ||
									!conn?.host ||
									!conn?.privKey ||
									!conn?.session ||
									!conn?.agentId
								)
									return;
								fetch(
									`http://${conn.host}/debug/${conn.appId}/${conn.privKey}/${conn.session}/${conn.agentId}/thread/`,
									{
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({
											threadName,
											participantIds: participants ?? []
										})
									}
								);
							}}>Create</Button
						>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each Object.values(conn?.threads ?? {}) as thread (thread.id)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton class="truncate">
								{#snippet child({ props })}
									<a href={`/thread/${thread.id}`} {...props}
										>{thread.name}
										<Badge class={cn(thread.unread == 0 && 'hidden')}>{thread.unread}</Badge>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
