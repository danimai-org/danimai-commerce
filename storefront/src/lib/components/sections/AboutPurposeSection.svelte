<script lang="ts">
	let {
		heading = 'Designed with Purpose',
		paragraph = 'Born from the Nordic philosophy of functional beauty, we create timeless essentials crafted for your everyday movement and in-between. Each piece is an exercise in minimalism—no excess, no compromise—built to move with you from dawn to dusk.',
		columns = [
			{
				title: 'TIMELESS QUALITY',
				text: 'Meticulously crafted from premium European fabrics, designed to become indispensable with time, not to expire.'
			},
			{
				title: 'CONSCIOUS CRAFT',
				text: 'Responsibly produced in small batches using certified organic and recycled materials, minimizing waste at every step.'
			},
			{
				title: 'FLUID LIVING',
				text: 'Garments that move between yoga studio, coffee shop, and evening stroll. A focus on comfort in constant change.'
			}
		]
	}: {
		heading?: string;
		paragraph?: string;
		columns?: { title: string; text: string }[];
	} = $props();
</script>

<section class="about-purpose">
	<h2 class="about-purpose-heading">{heading}</h2>
	<p class="about-purpose-para">{paragraph}</p>
	<div class="about-purpose-grid">
		{#each columns as col}
			<div class="about-purpose-col">
				<h3 class="about-purpose-col-title">{col.title}</h3>
				<p class="about-purpose-col-text">{col.text}</p>
			</div>
		{/each}
	</div>
</section>

<style>
	.about-purpose {
		max-width: 900px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
		text-align: center;
	}
	.about-purpose-heading {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 700;
		margin: 0 0 1.5rem;
		letter-spacing: -0.02em;
		color: #1a1a1a;
	}
	.about-purpose-para {
		color: #4a4a4a;
		line-height: 1.7;
		margin: 0 0 3rem;
		font-size: 1rem;
	}
	.about-purpose-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		text-align: center;
	}
	.about-purpose-col-title {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.75rem;
		text-transform: uppercase;
	}
	.about-purpose-col-text {
		font-size: 0.9375rem;
		color: #4a4a4a;
		line-height: 1.6;
		margin: 0;
	}
	@media (max-width: 768px) {
		.about-purpose-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
