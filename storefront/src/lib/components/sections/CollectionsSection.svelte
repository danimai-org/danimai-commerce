<script lang="ts">
	let {
		title = 'Shop Collections'
	}: {
		title?: string;
	} = $props();
</script>

<section class="section collections-section">
	<h2 class="section-title">{title}</h2>
	<div class="collections-grid">
		<a href="/collections/core-essentials" class="collection-card collection-card-large">
			<div class="collection-bg collection-core"></div>
			<span class="collection-label">Core Essentials →</span>
		</a>
		<div class="collections-stack">
			<a href="/collections/studio-training" class="collection-card">
				<div class="collection-bg collection-studio"></div>
				<span class="collection-label">Studio & Training →</span>
			</a>
			<a href="/collections/outer-layers" class="collection-card">
				<div class="collection-bg collection-outer"></div>
				<span class="collection-label">Outer Layers →</span>
			</a>
		</div>
	</div>
</section>

<style>
	.section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
	}
	.collections-section .section-title {
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		margin: 0 0 2rem;
		letter-spacing: -0.02em;
	}
	.collections-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.collection-card {
		position: relative;
		display: block;
		border-radius: 8px;
		overflow: hidden;
		aspect-ratio: 1;
		text-decoration: none;
		color: #fff;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		cursor: pointer;
	}
	.collection-card-large {
		grid-row: span 2;
		aspect-ratio: auto;
		min-height: 100%;
	}
	.collections-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.collection-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		pointer-events: none;
	}
	.collection-core {
		background: linear-gradient(180deg, #e8e0d5 0%, #d4c8bc 100%);
	}
	.collection-studio {
		background: linear-gradient(180deg, #8a9a7a 0%, #6b7c5c 100%);
	}
	.collection-outer {
		background: linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%);
	}
	.collection-label {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem 1.25rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
		font-size: 1rem;
		font-weight: 500;
	}
	@media (max-width: 900px) {
		.collections-grid {
			grid-template-columns: 1fr;
		}
		.collection-card-large {
			grid-row: auto;
			aspect-ratio: 16/10;
		}
	}
</style>
