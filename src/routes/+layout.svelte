<script lang="ts">
	import { onMount } from 'svelte';
	import { initDeepLinks } from '$lib/deeplinks';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// Inicializar deep links cuando la app carga
	onMount(() => {
		initDeepLinks();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
