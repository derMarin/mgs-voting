<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { IconArrowLeft, IconTrash, IconUpload } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let deleteImageId = $state<string | null>(null);
</script>

<svelte:head>
	<title>{data.candidate.name} bearbeiten - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<a href="/admin/candidates" class="btn btn-outline-secondary btn-sm me-2">
					<IconArrowLeft size={16} />
				</a>
			</div>
			<div class="col">
				<div class="page-pretitle">Kandidat bearbeiten</div>
				<h2 class="page-title">{data.candidate.name}</h2>
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
				{#if form?.imageDeleted}
					Bild erfolgreich gelöscht
				{:else}
					Kandidat erfolgreich aktualisiert
				{/if}
			</div>
		{/if}

		<div class="row">
			<div class="col-lg-8">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Kandidaten-Details</h3>
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
								<label class="form-label" for="categoryId">Kategorie *</label>
								<select
									id="categoryId"
									name="categoryId"
									class="form-select"
									required
								>
									{#each data.categories as category}
										<option
											value={category.id}
											selected={data.candidate.categoryId === category.id}
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
									value={data.candidate.name}
									required
								/>
							</div>
							<div class="mb-3">
								<label class="form-label" for="description">Beschreibung (HTML)</label>
								<textarea
									id="description"
									name="description"
									class="form-control"
									rows="8"
								>{data.candidate.description || ''}</textarea>
								<small class="text-muted">
									HTML-Formatierung ist erlaubt. Der Rich-Text-Editor wird in einer späteren Version hinzugefügt.
								</small>
							</div>
							<div class="mb-3">
								<label class="form-label" for="sortOrder">Reihenfolge</label>
								<input
									type="number"
									id="sortOrder"
									name="sortOrder"
									class="form-control"
									value={data.candidate.sortOrder}
									min="0"
								/>
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
						<h3 class="card-title">Bilder</h3>
					</div>
					<div class="card-body">
						<form
							action="/api/images/upload"
							method="POST"
							enctype="multipart/form-data"
							class="mb-3"
						>
							<input type="hidden" name="candidateId" value={data.candidate.id} />
							<div class="mb-2">
								<input
									type="file"
									name="image"
									accept="image/*"
									class="form-control"
								/>
							</div>
							<button type="submit" class="btn btn-outline-primary btn-sm">
								<IconUpload size={16} class="me-1" />
								Bild hochladen
							</button>
						</form>

						{#if data.candidate.images.length > 0}
							<div class="row g-2">
								{#each data.candidate.images as image}
									<div class="col-6">
										<div class="position-relative">
											<img
												src={image.thumbnailPath}
												alt="Kandidatenbild"
												class="img-fluid rounded"
											/>
											<button
												type="button"
												class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
												onclick={() => (deleteImageId = image.id)}
											>
												<IconTrash size={14} />
											</button>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted mb-0">Keine Bilder vorhanden</p>
						{/if}
					</div>
				</div>

				{#if data.candidate.category}
					<div class="card mt-3">
						<div class="card-header">
							<h3 class="card-title">Kategorie</h3>
						</div>
						<div class="card-body">
							<p class="mb-1"><strong>{data.candidate.category.name}</strong></p>
							{#if data.candidate.category.description}
								<p class="text-muted mb-0">{data.candidate.category.description}</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Delete Image Confirmation Modal -->
{#if deleteImageId}
	<div class="modal modal-blur fade show d-block" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-sm modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-status bg-danger"></div>
				<div class="modal-body text-center py-4">
					<IconTrash size={48} class="text-danger mb-2" />
					<h3>Bild löschen?</h3>
					<div class="text-muted">
						Diese Aktion kann nicht rückgängig gemacht werden.
					</div>
				</div>
				<div class="modal-footer">
					<div class="w-100">
						<div class="row">
							<div class="col">
								<button
									type="button"
									class="btn w-100"
									onclick={() => (deleteImageId = null)}
								>
									Abbrechen
								</button>
							</div>
							<div class="col">
								<form
									method="POST"
									action="?/deleteImage"
									use:enhance={() => {
										return async ({ update }) => {
											deleteImageId = null;
											await update();
										};
									}}
								>
									<input type="hidden" name="imageId" value={deleteImageId} />
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
