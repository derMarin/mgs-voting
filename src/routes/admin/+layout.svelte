<script lang="ts">
	import AdminLayout from '$lib/components/layout/AdminLayout.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Don't use AdminLayout for login page
	const isLoginPage = $derived($page.url.pathname === '/admin/login');
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<AdminLayout>
		{@render children()}
	</AdminLayout>
{/if}
