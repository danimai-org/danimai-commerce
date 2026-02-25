<script lang="ts">
	let {
		heading = 'Our Principles',
		subtext = 'We design for people who value intention over excess, who seek quality that endures, and who understand that true luxury lies in simplicity.',
		principles = [
			{
				title: 'RADICAL HONESTY',
				text: 'Full transparency in our supply chain, from fiber to finished garment. We share the true cost and impact of everything we create.'
			},
			{
				title: 'SLOW FASHION',
				text: 'We release one thoughtful collection per year, not twelve. Each piece is designed to last seasons, not weeks.'
			},
			{
				title: 'MINDFUL MOVEMENT',
				text: 'Supporting practices that enhance body and mind through partnerships with yoga studios and wellness communities.'
			},
			{
				title: 'CIRCULAR DESIGN',
				text: 'Take-back program for worn pieces, which we repair, reheart or responsibly recycle into new materials.'
			}
		]
	}: {
		heading?: string;
		subtext?: string;
		principles?: { title: string; text: string }[];
	} = $props();
</script>

<section class="about-principles" id="principles">
	<h2 class="about-principles-heading">{heading}</h2>
	<p class="about-principles-sub">{subtext}</p>
	<div class="about-principles-grid">
		{#each principles as p}
			<div class="about-principles-card">
				<h3 class="about-principles-card-title">{p.title}</h3>
				<p class="about-principles-card-text">{p.text}</p>
			</div>
		{/each}
	</div>
</section>

<style>
	.about-principles {
		background: #1a1a1a;
		color: #e8e8e8;
		padding: 4rem 1.5rem;
		text-align: center;
	}
	.about-principles-heading {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 700;
		margin: 0 0 1rem;
		letter-spacing: -0.02em;
		color: #fff;
	}
	.about-principles-sub {
		max-width: 640px;
		margin: 0 auto 3rem;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #b0b0b0;
	}
	.about-principles-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
		text-align: left;
	}
	.about-principles-card {
		padding: 1.5rem;
		border: 1px solid #333;
		border-radius: 4px;
	}
	.about-principles-card-title {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		font-weight: 700;
		color: #fff;
		margin: 0 0 0.75rem;
		text-transform: uppercase;
	}
	.about-principles-card-text {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #b0b0b0;
		margin: 0;
	}
	@media (max-width: 768px) {
		.about-principles-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
