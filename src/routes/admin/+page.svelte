<script lang="ts">
	import type { PageData } from './$types.js';
	import {
		IconCategory,
		IconUsers,
		IconUser,
		IconChartBar,
		IconPlayerPlay
	} from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="page-pretitle">Übersicht</div>
		<h2 class="page-title">Dashboard</h2>
	</div>
</div>

<div class="page-body">
	<div class="container-xl">
		{#if data.activeCategory}
			<div class="alert alert-success mb-4" role="alert">
				<div class="d-flex align-items-center">
					<IconPlayerPlay size={24} class="me-2" />
					<div>
						<h4 class="alert-title">Voting aktiv</h4>
						<div class="text-secondary">Kategorie: {data.activeCategory.name}</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="row row-deck row-cards">
			<div class="col-sm-6 col-lg-3">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center">
							<div class="subheader">Kategorien</div>
						</div>
						<div class="h1 mb-3">{data.stats.categories}</div>
						<a href="/admin/categories" class="btn btn-primary btn-sm">
							<IconCategory size={16} class="me-1" />
							Verwalten
						</a>
					</div>
				</div>
			</div>

			<div class="col-sm-6 col-lg-3">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center">
							<div class="subheader">Kandidaten</div>
						</div>
						<div class="h1 mb-3">{data.stats.candidates}</div>
						<a href="/admin/candidates" class="btn btn-primary btn-sm">
							<IconUsers size={16} class="me-1" />
							Verwalten
						</a>
					</div>
				</div>
			</div>

			<div class="col-sm-6 col-lg-3">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center">
							<div class="subheader">Jury-Mitglieder</div>
						</div>
						<div class="h1 mb-3">{data.stats.juryMembers}</div>
						<a href="/admin/jury" class="btn btn-primary btn-sm">
							<IconUser size={16} class="me-1" />
							Verwalten
						</a>
					</div>
				</div>
			</div>

			<div class="col-sm-6 col-lg-3">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center">
							<div class="subheader">Abgegebene Stimmen</div>
						</div>
						<div class="h1 mb-3">{data.stats.votes}</div>
						<a href="/admin/results" class="btn btn-primary btn-sm">
							<IconChartBar size={16} class="me-1" />
							Ergebnisse
						</a>
					</div>
				</div>
			</div>
		</div>

		<div class="card mt-4">
			<div class="card-header">
				<h3 class="card-title">Kategorien-Übersicht</h3>
			</div>
			<div class="table-responsive">
				<table class="table table-vcenter card-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Status</th>
							<th class="w-1"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.categories as category}
							<tr>
								<td>{category.name}</td>
								<td>
									{#if category.votingStatus === 'active'}
										<span class="badge bg-green text-green-fg">Aktiv</span>
									{:else if category.votingStatus === 'completed'}
										<span class="badge bg-blue text-blue-fg">Abgeschlossen</span>
									{:else}
										<span class="badge bg-secondary text-secondary-fg">Inaktiv</span>
									{/if}
								</td>
								<td>
									<a href="/admin/categories/{category.id}" class="btn btn-sm">
										Bearbeiten
									</a>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="text-center text-muted">
									Keine Kategorien vorhanden
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
