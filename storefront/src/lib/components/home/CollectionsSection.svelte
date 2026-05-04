<script lang="ts">
	interface Collection {
		title: string;
		handle: string;
		image: string;
	}	

	let {
		title = 'Shop Collections',
		collections: collectionsProp
	}: {
		title?: string;
		collections?: Collection[];
	} = $props();


	const display = $derived(
		collectionsProp === undefined ? collectionsProp ?? [] : collectionsProp?.length > 0 ? collectionsProp : []
	);
	const collections = $derived(display);
	const featureLayout = $derived(collections.length === 3);
</script>

<section class="section collections-section">
	<h2 class="section-title">{title}</h2>
	{#if collections.length === 0}
		<p class="collections-empty">No collections yet.</p>
	{:else}
		<div class="collections-layout" class:collections-layout--feature={featureLayout}>
			{#each collections as collection, i (collection.handle)}
				<a
					href={`/collections/${encodeURIComponent(collection.handle)}`}
					class="collection-card"
					class:collection-card--large={featureLayout && i === 0}
				>
					<div class="collection-bg" style="background-image: url({collection.image});"></div>
					<img src={collection.image} alt="" class="collection-image" aria-hidden="true" />
					<div class="collection-overlay"></div>
					<span class="collection-title">{collection.title}</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
