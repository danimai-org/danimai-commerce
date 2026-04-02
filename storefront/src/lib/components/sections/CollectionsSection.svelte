<script lang="ts">
	interface Collection {
		title: string;
		handle: string;
		image: string;
	}

	const FALLBACK: Collection[] = [
		{
			title: 'Core Essentials',
			handle: 'core-essentials',
			image:
				'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80'
		},
		{
			title: 'Studio & Training',
			handle: 'studio-training',
			image:
				'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'
		},
		{
			title: 'Outer Layers',
			handle: 'outer-layers',
			image:
				'https://images.unsplash.com/photo-1617137968427-85924c2a0505?w=800&q=80'
		}
	];

	let {
		title = 'Shop Collections',
		collections = [] as Collection[]
	}: {
		title?: string;
		collections?: Collection[];
	} = $props();

	const display = $derived(collections.length > 0 ? collections : FALLBACK);
</script>

<section class="section collections-section">
	<h2 class="section-title">{title}</h2>
	<div class="collections-layout">
		{#each display as collection, i (collection.handle)}
			<a
				href={`/collections/${collection.handle}`}
				class="collection-card"
				class:collection-card--large={i === 0 && display.length >= 3}
			>
				<div class="collection-bg" style="background-image: url({collection.image});"></div>
				<div class="collection-overlay"></div>
				<span class="collection-label">{collection.title}</span>
			</a>
		{/each}
	</div>
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
	.collections-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-auto-rows: 1fr;
		gap: 1rem;
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
		background-size: cover;
		background-position: center;
		transition: transform 0.5s ease;
	}
	.collection-card:hover .collection-bg {
		transform: scale(1.04);
	}
	.collection-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.45) 100%);
	}
	.collection-label {
		position: relative;
		z-index: 1;
		padding: 1.25rem 1.5rem;
		font-size: clamp(1rem, 2.5vw, 1.125rem);
		font-weight: 500;
		letter-spacing: 0.02em;
		text-align: center;
		width: 100%;
	}
	@media (min-width: 768px) {
		.collection-label {
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
		.collection-card,
		.collection-card--large {
			grid-row: auto;
			aspect-ratio: 16 / 10;
			min-height: 200px;
		}
		.collection-label {
			text-align: center;
			padding: 1.5rem 1rem;
		}
	}
</style>
