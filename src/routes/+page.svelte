<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<main></main>
	</Sidebar.Inset>
</Sidebar.Provider>
