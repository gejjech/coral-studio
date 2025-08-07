<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Resizable from '$lib/components/ui/resizable/index.js';

	import Arrow from 'phosphor-icons-svelte/IconArrowRightRegular.svelte';

	// can we use highlight.js here?
	import { type paths, type components } from '../../../generated/api';
	import type { Session } from '$lib/session.svelte';
	import createClient from 'openapi-fetch';

	let { 
    open = $bindable(false), 
    session,
    messageId,
    threadId
  }: { 
    open: boolean, 
    session: Session,
    messageId: string,
    threadId: string
  } = $props();

  const client = createClient<paths>({baseUrl: `${location.protocol}//${session.host}`});

  // promise unresolved whilst waiting for data and resolved as undefined if there is no data (no telemetry data for the message,
  // which will happen if it is currently being sent or the agent does not support telemetry (this is the majority of agents currently))
  let dataPromise = $derived.by(async () => {
    return (await client.GET("/api/v1/telemetry/{sessionId}/{threadId}/{messageId}", {
      params: {
        path: {
          messageId,
          sessionId: session.session,
          threadId
        }
      }
    })).data;
  })
</script>

{#await dataPromise}
  <p>waiting data!</p>
{:then data} 
  {#if data}
    <Dialog.Root bind:open>
    <Dialog.Content
      class="mx-auto flex h-[80%] max-h-[80%] w-full max-w-2xl min-w-[60%] flex-col overflow-scroll"
    >
      <Dialog.Header>
        <Dialog.Title class="h-fit p-4">Telemetry data</Dialog.Title>
      </Dialog.Header>
      <Dialog.Description class="flex h-full flex-1 flex-col">
        <Resizable.PaneGroup
          direction="horizontal"
          class="min-h-[200px] w-full	 rounded-lg border"
          autoSaveId="telemetryInfoPanel"
        >
          <Resizable.Pane defaultSize={25}>
            <Tabs.Root value="details" class="w-full ">
              <Tabs.List class="w-full rounded-none">
                <Tabs.Trigger value="hyperparameters">Hyperparameters</Tabs.Trigger>
                <Tabs.Trigger value="details">Details</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="hyperparameters" class="p-2">empty</Tabs.Content>
              <Tabs.Content value="details" class="p-2">
                <ol>
                  <li class="flex flex-col">
                    Additional parameters: <span class="bg-white/5"
                      >{JSON.stringify(data.additional_params)}</span
                    >
                  </li>
                  <li>Max tokens: {data.max_tokens}</li>
                  <li>Model description: {data.model_description}</li>
                  <li>Preamble: {data.preamble}</li>
                  <li class="flex flex-col">
                    Resources: <span class="bg-white/5"
                      >{JSON.stringify(data.resources)}</span
                    >
                  </li>
                  <li>Temperature: {data.temperature}</li>
                </ol>
              </Tabs.Content>
            </Tabs.Root>
          </Resizable.Pane>
          <Resizable.Handle withHandle />
          <Resizable.Pane defaultSize={75}>
            <ul class="flex h-full flex-col items-center justify-center gap-4 p-6">
              {#each data.messages.data as message, i}
                <li class="w-fit overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm {message.role}">
                  {#if message.content && message.content.length > 0}
                    {#each message.content as part}
                      <p>{part.text}</p>
                      {#if message.tool_call_id}
                        <p>{message.tool_call_id}</p>
                      {/if}
                    {/each}
                  {:else if message.tool_calls}
                    <div class="">
                      agent used tools:
                      <ul>
                        {#each message.tool_calls as toolCall}
                          <li>
                            <span class="font-bold">{toolCall.function.name} </span>({toolCall
                              .function.arguments})
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {:else}
                    <p class="text-gray-400 italic">No content</p>
                  {/if}
                </li>
                {#if i < data.messages.data.length - 1}
                  <Arrow class="rotate-90" />
                {/if}
              {/each}
            </ul>
          </Resizable.Pane>
        </Resizable.PaneGroup>
      </Dialog.Description>
    </Dialog.Content>
  </Dialog.Root>
  {:else}
    <p>no data</p>
  {/if}
{/await}

<style>
	.user {
		background-color: rgb(106, 78, 46);
	}
	.assistant {
		background-color: #314455;
	}
	.tool {
		background-color: #393939;
	}
</style>
