<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { IconArrowLeft, IconUsers } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>{data.category.name} bearbeiten - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<a href="/admin/categories" class="btn btn-outline-secondary btn-sm me-2">
					<IconArrowLeft size={16} />
				</a>
			</div>
			<div class="col">
				<div class="page-pretitle">Kategorie bearbeiten</div>
				<h2 class="page-title">{data.category.name}</h2>
			</div>
		</div>
	</div>
</div>

<div class="page-body">
	<div class="container-xl">
		{#if form?.error}
			<div class="alert alert-danger mb-4" role="alert">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="alert alert-success mb-4" role="alert">
				Kategorie erfolgreich aktualisiert
			</div>
		{/if}

		<div class="row">
			<div class="col-lg-8">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Kategorie-Details</h3>
					</div>
					<div class="card-body">
						<form
							method="POST"
							action="?/update"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update();
								};
							}}
						>
							<div class="mb-3">
								<label class="form-label" for="name">Name *</label>
								<input
									type="text"
									id="name"
									name="name"
									class="form-control"
									value={data.category.name}
									required
								/>
							</div>
							<div class="mb-3">
								<label class="form-label" for="description">Beschreibung</label>
								<textarea
									id="description"
									name="description"
									class="form-control"
									rows="3"
								>{data.category.description || ''}</textarea>
							</div>
							<div class="mb-3">
								<label class="form-label" for="sortOrder">Reihenfolge</label>
								<input
									type="number"
									id="sortOrder"
									name="sortOrder"
									class="form-control"
									value={data.category.sortOrder}
									min="0"
								/>
							</div>
							<div class="mb-3">
								<label class="form-label">Status</label>
								<div>
									{#if data.category.votingStatus === 'active'}
										<span class="badge bg-green text-green-fg">Aktiv</span>
									{:else if data.category.votingStatus === 'completed'}
										<span class="badge bg-blue text-blue-fg">Abgeschlossen</span>
									{:else}
										<span class="badge bg-secondary text-secondary-fg">Inaktiv</span>
									{/if}
									<span class="text-muted ms-2">(Status wird über Voting-Steuerung geändert)</span>
								</div>
							</div>
							<button type="submit" class="btn btn-primary" disabled={loading}>
								{#if loading}
									<span class="spinner-border spinner-border-sm me-2"></span>
								{/if}
								Speichern
							</button>
						</form>
					</div>
				</div>
			</div>

			<div class="col-lg-4">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Kandidaten</h3>
					</div>
					<div class="card-body">
						<p class="text-muted">
							{data.category.candidates.length} Kandidat(en) in dieser Kategorie
						</p>
						<a href="/admin/candidates?category={data.category.id}" class="btn btn-outline-primary">
							<IconUsers size={16} class="me-1" />
							Kandidaten verwalten
						</a>
					</div>
					{#if data.category.candidates.length > 0}
						<div class="list-group list-group-flush">
							{#each data.category.candidates.slice(0, 5) as candidate}
								<a
									href="/admin/candidates/{candidate.id}"
									class="list-group-item list-group-item-action"
								>
									{candidate.name}
								</a>
							{/each}
							{#if data.category.candidates.length > 5}
								<div class="list-group-item text-muted">
									... und {data.category.candidates.length - 5} weitere
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
