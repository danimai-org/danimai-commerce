<script lang="ts">
	import '../layout.css';
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-dvh bg-muted/30 flex items-center justify-center p-4">
	{@render children()}
</div>
