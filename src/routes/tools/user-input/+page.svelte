<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';

	import IconRobot from 'phosphor-icons-svelte/IconRobotRegular.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Separator } from '$lib/components/ui/separator';

	import { socketCtx } from '$lib/socket.svelte';
	import { Button } from '$lib/components/ui/button';

	let ctx = socketCtx.get();
	let userQuestions: Record<string, string> = $state({});

	let requests = $derived(Object.values(ctx.userInput.requests ?? {}));

	$effect(() => {
		for (const request of requests) {
			if (request.userQuestion !== undefined) {
				userQuestions[request.id] = request.userQuestion;
			}
		}
	});

	function stringToColor(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		let color = (hash >>> 0).toString(16); // unsigned
		// pad/truncate to 6 chars
		return '#' + color.padStart(6, '0').slice(0, 6);
	}
</script>

<header class="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.Trigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4" />
	<Breadcrumb.Root class="flex-grow">
		<Breadcrumb.List>
			<Breadcrumb.Item class="hidden md:block">
				<Breadcrumb.Link>Tools</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:block" />
			<Breadcrumb.Item>
				<Breadcrumb.Page>User Input Tool</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</header>
<section class="grid h-full grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
	{#each requests as request}
		<Card.Root>
			<Card.Header>
				<h2 class="text-muted-foreground text-sm">{request.sessionId}</h2>
				<h1>'{request.agentId}' asks:</h1>
				<q>{request.agentRequest}</q>
			</Card.Header>
			<Card.Content>
				<Input
					bind:value={userQuestions[request.id]}
					disabled={request.userQuestion !== undefined}
					placeholder="Enter your reply."
					onkeydown={(e) => {
						if (e.key != 'Enter') return;
						const response = userQuestions[request.id];
						ctx.userInput.respond(request.id, response ?? '');
					}}
				/>
				<p>{request.agentAnswer}</p>
			</Card.Content>
		</Card.Root>
	{/each}
	<section class="flex h-full w-full flex-col gap-4">
		<nav class="flex w-full flex-col gap-2 p-1">
			<h1 class="text-lg font-medium">{requests.length} Input requests</h1>
			<section class="flex w-full gap-2">
				<Input placeholder="Search" class="grow " />
				<Button class="">Search</Button>
			</section>
		</nav>
		<Card.Root>
			<Card.Content class="flex w-full flex-col gap-2">
				{#if requests.length === 0}
					<p class="text-muted-foreground col-span-full text-center text-sm">
						No agents have requested user input.
					</p>
				{/if}
				{#each requests as request}
					<div class="flex w-full items-center gap-2">
						<div
							class="h-12 min-w-12 justify-center rounded-md bg-[{stringToColor(request.agentId)}]"
						>
							<IconRobot class="m-auto size-6 h-full" />
						</div>
						<section class="flex w-full flex-col gap-1">
							<span class="flex w-full">
								<span class="grow">{request.agentId}</span>
								<span class="w-fit">1 hour ago</span>
							</span>
							<p class="text-muted-foreground truncate">{request.agentRequest}</p>
						</section>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</section>
	<section class="col-span-3 h-full w-full">
		<Card.Root class=" h-full ">
			<Card.Header>
				<Card.Title class="flex w-full items-center gap-2">
					<div class="h-12 min-w-12 justify-center rounded-md bg-green-400">
						<IconRobot class="m-auto size-6 h-full" />
					</div>
					<span class="grow">Agent title</span>
				</Card.Title>
			</Card.Header>
			<Separator />
			<Card.Content class="grow">
				<ol class="flex flex-col gap-4">
					{#each requests as request}
						<li class="flex gap-4">
							<div
								class="h-12 min-w-12 justify-center rounded-md bg-[{stringToColor(
									request.agentId
								)}]"
							>
								<IconRobot class="m-auto size-6 h-full" />
							</div>
							<div class="bg-input min-h-12 max-w-full rounded-md p-2">
								<p>{request.agentRequest}</p>
							</div>
						</li>
					{/each}
				</ol>
			</Card.Content>
			<Card.Footer class="flex gap-2 p-4">
				<Input placeholder="Type your message..." class="w-full grow" />
				<Button>Send</Button>
			</Card.Footer>
		</Card.Root>
	</section>
</section>
