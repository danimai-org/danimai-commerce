import type { Writable } from 'svelte/store';

export const DROPDOWN_CTX = Symbol('dropdown-menu');

export interface DropdownContext {
  open: Writable<boolean>;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

