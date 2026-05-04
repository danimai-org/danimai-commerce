<script lang="ts">
    let {
        heading = "Designed with Purpose",
        paragraph = "Born from the Nordic philosophy of functional beauty, we create timeless essentials crafted for your everyday movement and in-between. Each piece is an exercise in minimalism—no excess, no compromise—built to move with you from dawn to dusk.",
        columns = [
            {
                title: "TIMELESS QUALITY",
                text: "Meticulously crafted from premium European fabrics, designed to become indispensable with time, not to expire.",
            },
            {
                title: "CONSCIOUS CRAFT",
                text: "Responsibly produced in small batches using certified organic and recycled materials, minimizing waste at every step.",
            },
            {
                title: "FLUID LIVING",
                text: "Garments that move between yoga studio, coffee shop, and evening stroll. A focus on comfort in constant change.",
            },
        ],
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

