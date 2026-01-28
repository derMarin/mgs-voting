<script lang="ts">
	import {
		IconHome,
		IconCategory,
		IconUsers,
		IconUser,
		IconChartBar,
		IconSettings,
		IconLogout,
		IconPlayerPlay
	} from '@tabler/icons-svelte';
	import { page } from '$app/stores';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: IconHome },
		{ href: '/admin/categories', label: 'Kategorien', icon: IconCategory },
		{ href: '/admin/candidates', label: 'Kandidaten', icon: IconUsers },
		{ href: '/admin/jury', label: 'Jury', icon: IconUser },
		{ href: '/admin/voting', label: 'Voting', icon: IconPlayerPlay },
		{ href: '/admin/results', label: 'Ergebnisse', icon: IconChartBar }
	];
</script>

<div class="page">
	<aside class="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
		<div class="container-fluid">
			<button
				class="navbar-toggler"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#sidebar-menu"
				aria-controls="sidebar-menu"
				aria-expanded="false"
				aria-label="Toggle navigation"
			>
				<span class="navbar-toggler-icon"></span>
			</button>
			<h1 class="navbar-brand navbar-brand-autodark">
				<a href="/admin">MGS Voting</a>
			</h1>
			<div class="collapse navbar-collapse" id="sidebar-menu">
				<ul class="navbar-nav pt-lg-3">
					{#each navItems as item}
						<li class="nav-item">
							<a
								class="nav-link"
								href={item.href}
								class:active={$page.url.pathname === item.href ||
									($page.url.pathname.startsWith(item.href) && item.href !== '/admin')}
							>
								<span class="nav-link-icon d-md-none d-lg-inline-block">
									<item.icon size={24} />
								</span>
								<span class="nav-link-title">{item.label}</span>
							</a>
						</li>
					{/each}
					<li class="nav-item mt-auto">
						<form action="/admin/logout" method="POST">
							<button type="submit" class="nav-link w-100 text-start border-0 bg-transparent">
								<span class="nav-link-icon d-md-none d-lg-inline-block">
									<IconLogout size={24} />
								</span>
								<span class="nav-link-title">Abmelden</span>
							</button>
						</form>
					</li>
				</ul>
			</div>
		</div>
	</aside>
	<div class="page-wrapper">
		{@render children()}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: row;
		min-height: 100vh;
	}

	.navbar-vertical {
		width: 15rem;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 1030;
	}

	.page-wrapper {
		flex: 1;
		margin-left: 15rem;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 991.98px) {
		.navbar-vertical {
			position: relative;
			width: 100%;
		}

		.page-wrapper {
			margin-left: 0;
		}

		.page {
			flex-direction: column;
		}
	}
</style>
