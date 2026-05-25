<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import User from '@lucide/svelte/icons/user';
	import AtSign from '@lucide/svelte/icons/at-sign';
	import Hash from '@lucide/svelte/icons/hash';
	import Paperclip from '@lucide/svelte/icons/paperclip';

	let timelineComment = $derived('');
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="mb-4 text-sm font-semibold">Timeline</div>
	<div class="flex gap-3">
		<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
			<User class="size-4 text-muted-foreground" />
		</div>
		<div class="flex-1">
			<textarea
				placeholder="Leave a comment..."
				bind:value={timelineComment}
				class="flex min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			></textarea>
			<div class="mt-2 flex items-center gap-2">
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Mention"
				>
					<AtSign class="size-4" />
				</button>
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Hashtag"
				>
					<Hash class="size-4" />
				</button>
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Attach"
				>
					<Paperclip class="size-4" />
				</button>
				<div class="ml-auto">
					<Button size="sm" disabled={!timelineComment.trim()}>Post</Button>
				</div>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">Only you and other staff can see comments</p>
		</div>
	</div>
</div>
