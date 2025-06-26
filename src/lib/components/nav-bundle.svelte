<script lang="ts">
	import { page } from '$app/state';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from 'phosphor-icons-svelte/IconCaretRightRegular.svelte';
	import type { Component } from 'svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import SidebarMenuBadge from '$lib/components/ui/sidebar/sidebar-menu-badge.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let {
		items
	}: {
		items: {
			title: string;
			icon?: Component;
			sumBadges?: boolean;
			items: {
				title: string;
				url: string;
				badge?: number;
			}[];
		}[];
	} = $props();
</script>

<Sidebar.Menu>
	{#each items as item (item.title)}
		{@const activeSubitems = item.items.map((sub) => page.url.pathname === sub.url)}
		{@const badgeSum = item.sumBadges
			? item.items.reduce((acc, cur) => {
					return acc + (cur.badge ?? 0);
				}, 0)
			: 0}
		<Collapsible.Root open={activeSubitems.indexOf(true) != -1} class="group/collapsible">
			{#snippet child({ props })}
				<Sidebar.MenuItem {...props}>
					<Collapsible.Trigger disabled={item.items.length === 0}>
						{#snippet child({ props })}
							<Sidebar.MenuButton {...props} tooltipContent={item.title}>
								{#if item.icon}
									<item.icon />
								{/if}
								<span class="font-sans font-medium tracking-wide">
									{item.title}
								</span>
								{#if badgeSum}
									<Badge class="font-mono">{badgeSum}</Badge>
								{/if}
								<ChevronRightIcon
									class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
								/>
							</Sidebar.MenuButton>
						{/snippet}
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Sidebar.MenuSub>
							{#each item.items as subItem, i (subItem.title)}
								<Sidebar.MenuSubItem>
									<Sidebar.MenuSubButton isActive={activeSubitems[i]}>
										{#snippet child({ props })}
											<Tooltip.Provider>
												<Tooltip.Root>
													<Tooltip.Trigger {...props}>
														{#snippet child({ props })}
															<a href={subItem.url} {...props}>
																<span class="truncate font-sans font-medium tracking-wide"
																	>{subItem.title}</span
																>
																{#if subItem.badge}
																	<Badge>{subItem.badge}</Badge>
																{/if}
															</a>
														{/snippet}
													</Tooltip.Trigger>
													<Tooltip.Content><p>{subItem.title}</p></Tooltip.Content>
												</Tooltip.Root>
											</Tooltip.Provider>
										{/snippet}
									</Sidebar.MenuSubButton>
								</Sidebar.MenuSubItem>
							{/each}
						</Sidebar.MenuSub>
					</Collapsible.Content>
				</Sidebar.MenuItem>
			{/snippet}
		</Collapsible.Root>
	{/each}
</Sidebar.Menu>
