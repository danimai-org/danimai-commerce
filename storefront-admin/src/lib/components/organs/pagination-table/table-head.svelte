<script lang="ts">
	let {
		columns = [],
		showSelectAll = false,
		selectAllChecked = false,
		selectAllIndeterminate = false,
		onToggleSelectAll
	}: {
		columns: { label: string; key: string }[];
		showSelectAll?: boolean;
		selectAllChecked?: boolean;
		selectAllIndeterminate?: boolean;
		onToggleSelectAll?: () => void;
	} = $props();

	let checkboxEl = $state<HTMLInputElement | null>(null);
	$effect(() => {
		if (checkboxEl) checkboxEl.indeterminate = selectAllIndeterminate;
	});
</script>

<thead class="sticky top-0 border-b bg-muted/50">
	<tr>
		{#if showSelectAll}
			<th class="w-10 px-4 py-3">
				<input
					type="checkbox"
					bind:this={checkboxEl}
					class="h-4 w-4 rounded border-input"
					checked={selectAllChecked}
					onchange={onToggleSelectAll}
				/>
			</th>
		{/if}
		{#each columns as column}
			<th class="px-4 py-3 text-left font-medium">{column.label}</th>
		{/each}
	</tr>
</thead>