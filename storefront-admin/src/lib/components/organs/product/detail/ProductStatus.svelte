<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	interface Props {
		status: 'draft' | 'proposed' | 'published' | 'rejected' | undefined;
		disabled?: boolean;
		onStatusChange: (status: 'draft' | 'proposed' | 'published' | 'rejected') => void;
	}

	let { status, disabled = false, onStatusChange }: Props = $props();

	function statusLabel(s: string | undefined): string {
		if (!s) return 'Draft';
		if (s === 'published') return 'Active';
		if (s === 'draft') return 'Draft';
		if (s === 'proposed') return 'Unlisted';
		if (s === 'rejected') return 'Rejected';
		return s;
	}

	function statusDotClass(s: string | undefined): string {
		if (s === 'published') return 'bg-emerald-500';
		if (s === 'draft' || !s) return 'bg-muted-foreground/60';
		if (s === 'proposed') return 'bg-amber-500';
		if (s === 'rejected') return 'bg-red-500';
		return 'bg-muted-foreground/60';
	}
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<h2 class="mb-4 font-semibold">Status</h2>
	<Select.Root
		type="single"
		value={status ?? 'draft'}
		onValueChange={(v) => {
			if (v && (v === 'draft' || v === 'proposed' || v === 'published' || v === 'rejected')) {
				onStatusChange(v);
			}
		}}
		{disabled}
	>
		<Select.Trigger class="w-full">
			<span class="flex items-center gap-2">
				<span
					class={`inline-block size-2 shrink-0 rounded-full ${statusDotClass(status)}`}
					aria-hidden="true"
				></span>
				<span>{statusLabel(status)}</span>
			</span>
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="published" label="Active">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-emerald-500"></span>
					<span>Active</span>
				</span>
			</Select.Item>
			<Select.Item value="draft" label="Draft">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-muted-foreground/60"></span>
					<span>Draft</span>
				</span>
			</Select.Item>
			<Select.Item value="proposed" label="Unlisted">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-amber-500"></span>
					<span>Unlisted</span>
				</span>
			</Select.Item>
			<Select.Item value="rejected" label="Rejected">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-red-500"></span>
					<span>Rejected</span>
				</span>
			</Select.Item>
		</Select.Content>
	</Select.Root>
	<h2 class="mt-6 mb-4 font-semibold">Visibility</h2>
	<Select.Root
		type="single"
		value={status === 'published' ? 'public' : 'private'}
		onValueChange={(v) => {
			if (v === 'public') onStatusChange('published');
			if (v === 'private') onStatusChange('draft');
		}}
		{disabled}
	>
		<Select.Trigger class="w-full">
			{status === 'published' ? 'Public' : 'Private'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="public" label="Public">Public</Select.Item>
			<Select.Item value="private" label="Private">Private</Select.Item>
		</Select.Content>
	</Select.Root>
</div>
