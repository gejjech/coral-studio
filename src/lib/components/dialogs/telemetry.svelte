<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	import Arrow from 'phosphor-icons-svelte/IconArrowRightRegular.svelte';
	import Chat from 'phosphor-icons-svelte/IconChatRegular.svelte';
	import TextIndent from 'phosphor-icons-svelte/IconTextIndentRegular.svelte';
	import GlobeSimple from 'phosphor-icons-svelte/IconGlobeSimpleRegular.svelte';
	import CodeBlock from '$lib/components/code-block.svelte';

	import { type paths, type components } from '../../../generated/api';
	import type { Session } from '$lib/session.svelte';
	import createClient from 'openapi-fetch';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Separator from '../ui/separator/separator.svelte';
	import Telemetry from '$lib/components/telemetry-message.svelte';

	const filter = $state({
		user: true,
		agent: true,
		tool: true
	});

	let showActivityBar = $state(true);
	let showPanel = $state(false);

	let {
		open = $bindable(false),
		session,
		messageId,
		threadId
	}: {
		open: boolean;
		session: Session;
		messageId: string;
		threadId: string;
	} = $props();

	const client = createClient<paths>({ baseUrl: `${location.protocol}//${session.host}` });

	// promise unresolved whilst waiting for data and resolved as undefined if there is no data (no telemetry data for the message,
	// which will happen if it is currently being sent or the agent does not support telemetry (this is the majority of agents currently))
	let dataPromise = $derived.by(async () => {
		return (
			await client.GET('/api/v1/telemetry/{sessionId}/{threadId}/{messageId}', {
				params: {
					path: {
						messageId,
						sessionId: session.session,
						threadId
					}
				}
			})
		).data;
	});
</script>

{#await dataPromise}
	<p>waiting data!</p>
{:then data}
	{#if data}
		<Dialog.Root bind:open>
			<Dialog.Content
				class="mx-auto flex h-[80%] max-h-[80%] w-full max-w-2xl min-w-[80%] flex-col overflow-scroll"
			>
				<Dialog.Header>
					<Dialog.Title class="h-fit  font-[400]">Full Telemetry Data</Dialog.Title>
					<span>{data}</span>
				</Dialog.Header>
				<Tabs.Root value="messages" class="flex flex-col gap-6">
					<Tabs.List class="h-11 border  p-0.5">
						<Tabs.Trigger value="messages"><Chat /> Message Insights</Tabs.Trigger>
						<Tabs.Trigger value="details"><TextIndent /> Thread Details</Tabs.Trigger>
						<Tabs.Trigger value="hyperparameters"><GlobeSimple /> Hyperparameters</Tabs.Trigger>
					</Tabs.List>
					<section class="flex gap-4">
						<Button variant="outline" class="rounded-full"
							><Arrow class="rotate-90" /> Expand all</Button
						>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="outline">Filter</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-56">
								<DropdownMenu.Group>
									<DropdownMenu.Label>Show messages</DropdownMenu.Label>
									<DropdownMenu.Separator />
									<DropdownMenu.CheckboxItem closeOnSelect={false} bind:checked={filter.user}>
										User
									</DropdownMenu.CheckboxItem>
									<DropdownMenu.CheckboxItem closeOnSelect={false} bind:checked={filter.agent}
										>Agent</DropdownMenu.CheckboxItem
									>
									<DropdownMenu.CheckboxItem closeOnSelect={false} bind:checked={filter.tool}
										>Tool</DropdownMenu.CheckboxItem
									>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</section>
					<Tabs.Content value="messages" class="pb-4">
						<ul class="flex flex-col [&_.separator:last-of-type]:hidden">
							{#each data.messages.data as message, i}
								{#if filter.user && message.role === 'user'}
									<Telemetry {message} />
								{/if}
								{#if filter.agent && message.role === 'assistant'}
									<Telemetry {message} />
								{/if}
								{#if filter.tool && message.role === 'tool'}
									<Telemetry {message} />
								{/if}
							{/each}
						</ul>
					</Tabs.Content>
					<Tabs.Content value="hyperparameters" class="p-2">empty</Tabs.Content>
					<Tabs.Content value="details" class="p-2"
						><ol>
							<li class="flex flex-col">
								Additional parameters: <span class="bg-white/5"
									>{JSON.stringify(data.additional_params)}</span
								>
							</li>
							<li>Max tokens: {data.max_tokens}</li>
							<li>Model description: {data.model_description}</li>
							<li>Preamble: {data.preamble}</li>
							<li class="flex flex-col">
								Resources: <span class="bg-white/5">{JSON.stringify(data.resources)}</span>
							</li>
							<li>Temperature: {data.temperature}</li>
						</ol>
						<CodeBlock
							text={JSON.stringify(data, null, 2)}
							class=" overflow-scroll whitespace-pre-wrap"
							language="json"
						/>
					</Tabs.Content>
				</Tabs.Root>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<p>no data</p>
	{/if}
{/await}
