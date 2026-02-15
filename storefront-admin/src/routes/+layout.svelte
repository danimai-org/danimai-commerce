<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { user, logout } from '$lib/auth.js';
	import { Collapsible, DropdownMenu } from 'bits-ui';
	import {
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarInset,
		SidebarMenu,
		SidebarMenuBadge,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarMenuSub,
		SidebarMenuSubButton,
		SidebarMenuSubItem,
		SidebarProvider,
		SidebarTrigger,
		Sidebar as SidebarRoot
	} from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Tag from '@lucide/svelte/icons/tag';
	import Layers from '@lucide/svelte/icons/layers';
	import Users from '@lucide/svelte/icons/users';
	import BadgePercent from '@lucide/svelte/icons/badge-percent';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import Store from '@lucide/svelte/icons/store';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Globe from '@lucide/svelte/icons/globe';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Settings from '@lucide/svelte/icons/settings';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { TooltipProvider } from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	let { children } = $props();

	const path = $derived($page.url.pathname);
	const PUBLIC_PATHS = ['/login', '/accept-invite'];
	const isPublicPath = (p: string) =>
		PUBLIC_PATHS.some((pub) => p === pub || p.startsWith(pub + '/'));

	let productsOpen = $state(false);
	let storeOpen = $state(false);
	let promotionsOpen = $state(false);
	let rolesPermissionsOpen = $state(false);

	$effect(() => {
		if (path.startsWith('/products')) productsOpen = true;
	});
	$effect(() => {
		if (path.startsWith('/store') || path.startsWith('/regions') || path.startsWith('/tax-regions'))
			storeOpen = true;
	});
	$effect(() => {
		if (path.startsWith('/promotions')) promotionsOpen = true;
	});
	$effect(() => {
		if (path.startsWith('/settings/users') ||
			path.startsWith('/settings/roles') ||
			path.startsWith('/settings/permissions') ||
			path.startsWith('/settings/invites'))
			rolesPermissionsOpen = true;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isPublicPath(path)}
	{@render children()}
{:else}
<TooltipProvider>
	<SidebarProvider>
		<SidebarRoot>
			<SidebarHeader>
				<div class="flex flex-1 items-center gap-2 px-2 py-2">
					<div
						class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground"
					>
						M
					</div>
					<span class="truncate text-base font-semibold">Danimai Store</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path === '/'}
									tooltipContent="Search"
									onclick={() => goto('/')}
								>
									<Search />
									<span>Search</span>
									<SidebarMenuBadge>⌘K</SidebarMenuBadge>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path.startsWith('/orders')}
									tooltipContent="Orders"
									onclick={() => goto('/orders')}
								>
									<ShoppingCart />
									<span>Orders</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Collapsible.Root bind:open={productsOpen} class="group/collapsible">
									<Collapsible.Trigger>
										{#snippet child({ props: triggerProps })}
											<SidebarMenuButton
												{...triggerProps}
												isActive={path.startsWith('/products')}
												tooltipContent="Manage Product"
											>
												<Tag />
												<span>Manage Product</span>
												<ChevronDown
													class={cn(
														'ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180'
													)}
												/>
											</SidebarMenuButton>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/products"
													isActive={path === '/products' || path === '/products/'}
												>
													Products
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/products/collections"
													isActive={path.endsWith('/products/collections')}
												>
													Collections
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/products/categories"
													isActive={path.endsWith('/products/categories')}
												>
													Categories
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/products/tags"
													isActive={path.endsWith('/products/tags')}
												>
													Tags
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/products/attributes"
													isActive={path.startsWith('/products/attributes')}
												>
													Attributes
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</Collapsible.Content>
								</Collapsible.Root>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Collapsible.Root bind:open={storeOpen} class="group/collapsible">
									<Collapsible.Trigger>
										{#snippet child({ props: triggerProps })}
											<SidebarMenuButton
												{...triggerProps}
												isActive={path.startsWith('/store') ||
													path.startsWith('/regions') ||
													path.startsWith('/tax-regions')}
												tooltipContent="Manage Store"
											>
												<Building2 />
												<span>Manage Store</span>
												<ChevronDown
													class={cn(
														'ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180'
													)}
												/>
											</SidebarMenuButton>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/store"
													isActive={path === '/store' || path === '/store/'}
												>
													Store
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/regions"
													isActive={path.startsWith('/regions')}
												>
													Regions
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/tax-regions"
													isActive={path.startsWith('/tax-regions')}
												>
													Tax Regions
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</Collapsible.Content>
								</Collapsible.Root>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path.startsWith('/sales-channels')}
									tooltipContent="Sales Channels"
									onclick={() => goto('/sales-channels')}
								>
									<Store />
									<span>Sales Channels</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path.startsWith('/inventory')}
									tooltipContent="Inventory"
									onclick={() => goto('/inventory')}
								>
									<Layers />
									<span>Inventory</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path.startsWith('/customers')}
									tooltipContent="Customers"
									onclick={() => goto('/customers')}
								>
									<Users />
									<span>Customers</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Collapsible.Root bind:open={promotionsOpen} class="group/collapsible">
									<Collapsible.Trigger>
										{#snippet child({ props: triggerProps })}
											<SidebarMenuButton
												{...triggerProps}
												isActive={path.startsWith('/promotions')}
												tooltipContent="Promotions"
											>
												<BadgePercent />
												<span>Promotions</span>
												<ChevronDown
													class={cn(
														'ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180'
													)}
												/>
											</SidebarMenuButton>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/promotions"
													isActive={path === '/promotions' || path === '/promotions/'}
												>
													Promotions
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/promotions/campaigns"
													isActive={path.startsWith('/promotions/campaigns')}
												>
													Campaigns
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</Collapsible.Content>
								</Collapsible.Root>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path.startsWith('/price-lists')}
									tooltipContent="Price Lists"
									onclick={() => goto('/price-lists')}
								>
									<DollarSign />
									<span>Price Lists</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Collapsible.Root bind:open={rolesPermissionsOpen} class="group/collapsible">
									<Collapsible.Trigger>
										{#snippet child({ props: triggerProps })}
											<SidebarMenuButton
												{...triggerProps}
												isActive={path.startsWith('/settings/users') ||
													path.startsWith('/settings/roles') ||
													path.startsWith('/settings/permissions') ||
													path.startsWith('/settings/invites')}
												tooltipContent="Manage Users"
											>
												<ShieldCheck />
												<span>Manage Users</span>
												<ChevronDown
													class={cn(
														'ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180'
													)}
												/>
											</SidebarMenuButton>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/settings/users"
													isActive={path.startsWith('/settings/users')}
												>
													Users
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/settings/roles"
													isActive={path.startsWith('/settings/roles')}
												>
													Roles
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/settings/permissions"
													isActive={path.startsWith('/settings/permissions')}
												>
													Permissions
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													href="/settings/invites"
													isActive={path.startsWith('/settings/invites')}
												>
													Invites
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</Collapsible.Content>
								</Collapsible.Root>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={path === '/settings' ||
										path === '/settings/' ||
										(path.startsWith('/settings') &&
										!path.startsWith('/settings/users') &&
										!path.startsWith('/settings/roles') &&
										!path.startsWith('/settings/permissions') &&
										!path.startsWith('/settings/invites'))}
									tooltipContent="Settings"
									onclick={() => goto('/settings')}
								>
									<Settings />
									<span>Settings</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<div
							class={cn(
								'flex w-full items-center gap-2 rounded-md p-2 text-sm text-sidebar-foreground'
							)}
						>
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
							>
								A
							</div>
							<span class="flex-1 truncate">{$user?.email ?? '—'}</span>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">User menu</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Profile"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={() => goto('/settings')}
										>
											Profile
										</DropdownMenu.Item>
										<DropdownMenu.Item
											textValue="Log out"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={async () => {
												await logout();
												goto('/login');
											}}
										>
											Log out
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</SidebarRoot>

		<SidebarInset>
			<div class="flex-1 overflow-auto">
				<div class="relative h-full">
					<div class="absolute top-4 left-0 z-20">
						<SidebarTrigger class="size-8 shrink-0" />
					</div>
					{@render children()}
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
</TooltipProvider>
{/if}
