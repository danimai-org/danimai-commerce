<script lang="ts">
  import { getContext } from 'svelte';
  import { DROPDOWN_CTX } from './context';
  import type { DropdownContext } from './context';

  const ctx = getContext<DropdownContext>(DROPDOWN_CTX);

  let className: string | undefined = undefined;
  let type: 'button' | 'submit' | 'reset' = 'button';

  export { className as class, type };
</script>

<button type={type} class={className} on:click={() => ctx.toggleMenu()}>
  <slot />
</button>

