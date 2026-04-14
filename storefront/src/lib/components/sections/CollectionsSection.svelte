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

<style>
	.section {
		max-width: var(--section-max-width, 1200px);
		margin: 0 auto;
		padding: var(--section-padding-y, 4rem) var(--section-padding-x, 1.5rem);
		box-sizing: border-box;
	}
	.section-title {
		font-family: var(--font-serif, Georgia, serif);
		font-size: clamp(1.5rem, 3vw, 2.125rem);
		font-weight: 600;
		text-align: center;
		margin: 0 0 2rem;
		letter-spacing: -0.02em;
	}
	.collections-empty {
		margin: 0;
		text-align: center;
		color: #666;
		font-size: 1rem;
	}
	.collections-layout {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
		gap: 1rem;
	}
	.collections-layout--feature {
		grid-template-columns: 1fr 1fr;
		grid-auto-rows: 1fr;
		min-height: 700px;
	}
	.collection-card {
		position: relative;
		display: flex;
		align-items: flex-end;
		min-height: 200px;
		overflow: hidden;
		text-decoration: none;
		color: #fff;
		border-radius: 0;
	}
	.collection-card--large {
		grid-column: 1;
		grid-row: 1 / span 2;
		min-height: 100%;
	}
	.collection-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		background-size: cover;
		background-position: center;
		transition: transform 0.5s ease;
	}
	.collection-image {
		position: absolute;
		inset: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
		pointer-events: none;
	}
	.collection-card:hover .collection-bg,
	.collection-card:hover .collection-image {
		transform: scale(1.04);
	}
	.collection-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.45) 100%);
	}
	.collection-title {
		position: relative;
		z-index: 2;
		padding: 1.25rem 1.5rem;
		font-size: clamp(1rem, 2.5vw, 1.125rem);
		font-weight: 500;
		letter-spacing: 0.02em;
		text-align: center;
		width: 100%;
		margin-top: auto;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
	}
	@media (min-width: 768px) {
		.collection-title {
			font-size: 1.125rem;
			text-align: left;
		}
	}
	@media (max-width: 767px) {
		.collections-layout {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			min-height: unset;
		}
		.collections-layout--feature {
			display: flex;
		}
		.collection-card,
		.collection-card--large {
			grid-row: auto;
			aspect-ratio: 16 / 10;
			min-height: 200px;
		}
		.collection-title {
			text-align: center;
			padding: 1.5rem 1rem;
		}
	}
</style>
