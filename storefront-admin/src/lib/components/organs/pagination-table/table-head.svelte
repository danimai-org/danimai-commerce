<script lang="ts">
	let { columns = [] }: { columns: { 
        label: string; 
        key: string 
        }[] 
        } = $props();
</script>

<thead class="sticky top-0 border-b bg-muted/50">
    <tr>
		{#each columns as column}
			<th class="px-4 py-3 text-left font-medium">{column.label}</th>
		{/each}
    </tr>
</thead>