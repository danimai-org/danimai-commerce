<script lang="ts">
    let {
        partners = ["Kinfolk", "Monocle", "Gestalt", "The Sartorialist"],
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

