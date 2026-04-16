<!-- <svelte:head>
	<title>Sales Channels</title>
	<meta name="description" content="Manage sales channels." />
</svelte:head> -->

<script>
	let { children } = $props();
</script>

<div class="layout-wrapper">
	{@render children()}
</div>
