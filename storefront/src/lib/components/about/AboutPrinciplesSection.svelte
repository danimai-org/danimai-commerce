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
