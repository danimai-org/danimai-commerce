 <script lang="ts">
	let {
		partners = ['Kinfolk', 'Monocle', 'Gestalt', 'The Sartorialist']
	}: {
		partners?: string[];
	} = $props();
</script>

<section class="about-partners">
	<div class="about-partners-inner">
		{#each partners as name}
			<span class="about-partner-name">{name}</span>
			{#if name !== partners[partners.length - 1]}
				<span class="about-partner-sep" aria-hidden="true">·</span>
			{/if}
		{/each}
	</div>
</section>

<style>
	.about-partners {
		padding: 2rem 1.5rem;
		border-top: 1px solid #e8e8e8;
	}
	.about-partners-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}
	.about-partner-name {
		font-size: 0.8125rem;
		color: #888;
		letter-spacing: 0.02em;
	}
	.about-partner-sep {
		color: #ccc;
		font-weight: 300;
	}
</style>
