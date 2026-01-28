<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateModal = $state(false);
	let deleteConfirmId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Kategorien - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<div class="page-pretitle">Verwaltung</div>
				<h2 class="page-title">Kategorien</h2>
			</div>
			<div class="col-auto ms-auto">
				<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
					<IconPlus size={16} class="me-1" />
					Neue Kategorie
				</button>
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
				Aktion erfolgreich ausgeführt
			</div>
		{/if}

		<div class="card">
			<div class="table-responsive">
				<table class="table table-vcenter card-table">
					<thead>
						<tr>
							<th>Reihenfolge</th>
							<th>Name</th>
							<th>Beschreibung</th>
							<th>Status</th>
							<th class="w-1"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.categories as category}
							<tr>
								<td class="text-muted">{category.sortOrder}</td>
								<td>{category.name}</td>
								<td class="text-muted">
									{category.description || '-'}
								</td>
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
									<div class="btn-list flex-nowrap">
										<a
											href="/admin/categories/{category.id}"
											class="btn btn-sm btn-outline-primary"
										>
											<IconEdit size={16} />
										</a>
										<button
											class="btn btn-sm btn-outline-danger"
											onclick={() => (deleteConfirmId = category.id)}
										>
											<IconTrash size={16} />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center text-muted py-4">
									Keine Kategorien vorhanden. Erstellen Sie eine neue Kategorie.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="modal modal-blur fade show d-block" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Neue Kategorie erstellen</h5>
					<button
						type="button"
						class="btn-close"
						aria-label="Schließen"
						onclick={() => (showCreateModal = false)}
					></button>
				</div>
				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								showCreateModal = false;
							}
							await update();
						};
					}}
				>
					<div class="modal-body">
						<div class="mb-3">
							<label class="form-label" for="name">Name *</label>
							<input
								type="text"
								id="name"
								name="name"
								class="form-control"
								required
								placeholder="Kategoriename"
							/>
						</div>
						<div class="mb-3">
							<label class="form-label" for="description">Beschreibung</label>
							<textarea
								id="description"
								name="description"
								class="form-control"
								rows="3"
								placeholder="Optionale Beschreibung"
							></textarea>
						</div>
						<div class="mb-3">
							<label class="form-label" for="sortOrder">Reihenfolge</label>
							<input
								type="number"
								id="sortOrder"
								name="sortOrder"
								class="form-control"
								value="0"
								min="0"
							/>
						</div>
					</div>
					<div class="modal-footer">
						<button
							type="button"
							class="btn btn-ghost-secondary"
							onclick={() => (showCreateModal = false)}
						>
							Abbrechen
						</button>
						<button type="submit" class="btn btn-primary">Erstellen</button>
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="modal-backdrop fade show"></div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteConfirmId}
	<div class="modal modal-blur fade show d-block" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-sm modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-status bg-danger"></div>
				<div class="modal-body text-center py-4">
					<IconTrash size={48} class="text-danger mb-2" />
					<h3>Kategorie löschen?</h3>
					<div class="text-muted">
						Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Kandidaten werden
						ebenfalls gelöscht.
					</div>
				</div>
				<div class="modal-footer">
					<div class="w-100">
						<div class="row">
							<div class="col">
								<button
									type="button"
									class="btn w-100"
									onclick={() => (deleteConfirmId = null)}
								>
									Abbrechen
								</button>
							</div>
							<div class="col">
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										return async ({ update }) => {
											deleteConfirmId = null;
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={deleteConfirmId} />
									<button type="submit" class="btn btn-danger w-100">Löschen</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="modal-backdrop fade show"></div>
{/if}
