<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { IconPlus, IconTrash, IconEdit, IconPhoto, IconUpload, IconX } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateModal = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let imagePreview = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	function handleCategoryFilter(e: Event) {
		const select = e.target as HTMLSelectElement;
		const categoryId = select.value;
		if (categoryId) {
			goto(`/admin/candidates?category=${categoryId}`);
		} else {
			goto('/admin/candidates');
		}
	}

	function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function clearImage() {
		imagePreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function resetModal() {
		showCreateModal = false;
		imagePreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<svelte:head>
	<title>Kandidaten - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<div class="page-pretitle">Verwaltung</div>
				<h2 class="page-title">Kandidaten</h2>
			</div>
			<div class="col-auto ms-auto">
				<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
					<IconPlus size={16} class="me-1" />
					Neuer Kandidat
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
			<div class="card-header">
				<div class="row w-100 align-items-center">
					<div class="col">
						<h3 class="card-title">Alle Kandidaten</h3>
					</div>
					<div class="col-auto">
						<select class="form-select" onchange={handleCategoryFilter}>
							<option value="">Alle Kategorien</option>
							{#each data.categories as category}
								<option
									value={category.id}
									selected={data.selectedCategoryId === category.id}
								>
									{category.name}
								</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<div class="table-responsive">
				<table class="table table-vcenter card-table">
					<thead>
						<tr>
							<th style="width: 60px">Bild</th>
							<th>Name</th>
							<th>Kategorie</th>
							<th>Reihenfolge</th>
							<th class="w-1"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.candidates as candidate}
							<tr>
								<td>
									{#if candidate.images && candidate.images.length > 0}
										<img
											src={candidate.images[0].thumbnailPath}
											alt={candidate.name}
											class="avatar"
										/>
									{:else}
										<span class="avatar">
											<IconPhoto size={20} />
										</span>
									{/if}
								</td>
								<td>{candidate.name}</td>
								<td class="text-muted">
									{#if 'category' in candidate && candidate.category}
										{(candidate.category as { name: string }).name}
									{:else}
										-
									{/if}
								</td>
								<td class="text-muted">{candidate.sortOrder}</td>
								<td>
									<div class="btn-list flex-nowrap">
										<a
											href="/admin/candidates/{candidate.id}"
											class="btn btn-sm btn-outline-primary"
										>
											<IconEdit size={16} />
										</a>
										<button
											class="btn btn-sm btn-outline-danger"
											onclick={() => (deleteConfirmId = candidate.id)}
										>
											<IconTrash size={16} />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center text-muted py-4">
									Keine Kandidaten vorhanden. Erstellen Sie einen neuen Kandidaten.
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
		<div class="modal-dialog modal-lg modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Neuen Kandidaten erstellen</h5>
					<button
						type="button"
						class="btn-close"
						onclick={resetModal}
					></button>
				</div>
				<form
					method="POST"
					action="?/create"
					enctype="multipart/form-data"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								resetModal();
							}
							await update();
						};
					}}
				>
					<div class="modal-body">
						<div class="mb-3">
							<label class="form-label" for="categoryId">Kategorie *</label>
							<select
								id="categoryId"
								name="categoryId"
								class="form-select"
								required
							>
								<option value="">Kategorie wählen...</option>
								{#each data.categories as category}
									<option
										value={category.id}
										selected={data.selectedCategoryId === category.id}
									>
										{category.name}
									</option>
								{/each}
							</select>
						</div>
						<div class="mb-3">
							<label class="form-label" for="name">Name *</label>
							<input
								type="text"
								id="name"
								name="name"
								class="form-control"
								required
								placeholder="Kandidatenname"
							/>
						</div>
						<div class="mb-3">
							<label class="form-label">Foto</label>
							{#if imagePreview}
								<div class="image-preview-container mb-2">
									<img src={imagePreview} alt="Vorschau" class="image-preview" />
									<button
										type="button"
										class="btn btn-sm btn-outline-danger image-preview-remove"
										onclick={clearImage}
									>
										<IconX size={16} />
									</button>
								</div>
							{:else}
								<div class="upload-dropzone" onclick={() => fileInput?.click()}>
									<IconUpload size={32} class="text-muted mb-2" />
									<div class="text-muted">Klicken zum Auswählen oder Bild hierher ziehen</div>
									<small class="text-muted">JPEG, PNG, WebP, GIF (max. 10MB)</small>
								</div>
							{/if}
							<input
								type="file"
								id="image"
								name="image"
								accept="image/jpeg,image/png,image/webp,image/gif"
								class="d-none"
								onchange={handleImageSelect}
								bind:this={fileInput}
							/>
						</div>
						<div class="mb-3">
							<label class="form-label" for="description">Beschreibung (HTML)</label>
							<textarea
								id="description"
								name="description"
								class="form-control"
								rows="5"
								placeholder="Optionale Beschreibung (HTML erlaubt)"
							></textarea>
							<small class="text-muted">
								Für erweiterte Formatierung bearbeiten Sie den Kandidaten nach dem Erstellen.
							</small>
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
							onclick={resetModal}
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
					<h3>Kandidat löschen?</h3>
					<div class="text-muted">
						Diese Aktion kann nicht rückgängig gemacht werden. Alle Bilder und Stimmen werden
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

<style>
	.upload-dropzone {
		border: 2px dashed var(--tblr-border-color);
		border-radius: var(--tblr-border-radius);
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.15s ease-in-out, background-color 0.15s ease-in-out;
	}

	.upload-dropzone:hover {
		border-color: var(--tblr-primary);
		background-color: var(--tblr-bg-surface-secondary);
	}

	.image-preview-container {
		position: relative;
		display: inline-block;
	}

	.image-preview {
		max-width: 100%;
		max-height: 200px;
		border-radius: var(--tblr-border-radius);
		object-fit: contain;
	}

	.image-preview-remove {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}
</style>
