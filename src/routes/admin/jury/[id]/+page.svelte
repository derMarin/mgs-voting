<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import QRCodeDisplay from '$lib/components/shared/QRCodeDisplay.svelte';
	import { IconArrowLeft } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let selectedJuryType = $state<'core' | 'category'>(data.juryMember.juryType);

	const appUrl = env.PUBLIC_APP_URL || 'http://localhost:5173';
	const juryUrl = `${appUrl}/jury/${data.juryMember.accessToken}`;

	const assignedCategoryIds = data.juryMember.categoryAssignments?.map((a) => a.categoryId) || [];
</script>

<svelte:head>
	<title>{data.juryMember.name} bearbeiten - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<a href="/admin/jury" class="btn btn-outline-secondary btn-sm me-2">
					<IconArrowLeft size={16} />
				</a>
			</div>
			<div class="col">
				<div class="page-pretitle">Jury-Mitglied bearbeiten</div>
				<h2 class="page-title">{data.juryMember.name}</h2>
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
				Jury-Mitglied erfolgreich aktualisiert
			</div>
		{/if}

		<div class="row">
			<div class="col-lg-8">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Jury-Mitglied Details</h3>
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
									value={data.juryMember.name}
									required
								/>
							</div>

							<div class="mb-3">
								<label class="form-label">Jury-Typ *</label>
								<div class="form-selectgroup">
									<label class="form-selectgroup-item">
										<input
											type="radio"
											name="juryType"
											value="core"
											class="form-selectgroup-input"
											checked={selectedJuryType === 'core'}
											onchange={() => (selectedJuryType = 'core')}
										/>
										<span class="form-selectgroup-label">
											<strong>Kern-Jury</strong>
											<br />
											<small class="text-muted">Kann in allen Kategorien abstimmen</small>
										</span>
									</label>
									<label class="form-selectgroup-item">
										<input
											type="radio"
											name="juryType"
											value="category"
											class="form-selectgroup-input"
											checked={selectedJuryType === 'category'}
											onchange={() => (selectedJuryType = 'category')}
										/>
										<span class="form-selectgroup-label">
											<strong>Kategorie-Jury</strong>
											<br />
											<small class="text-muted">Kann nur in zugewiesenen Kategorien abstimmen</small>
										</span>
									</label>
								</div>
							</div>

							{#if selectedJuryType === 'category'}
								<div class="mb-3">
									<label class="form-label">Kategorien zuweisen *</label>
									{#if data.categories.length > 0}
										<div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
											{#each data.categories as category}
												<label class="form-selectgroup-item flex-fill">
													<input
														type="checkbox"
														name="categoryIds"
														value={category.id}
														class="form-selectgroup-input"
														checked={assignedCategoryIds.includes(category.id)}
													/>
													<div class="form-selectgroup-label d-flex align-items-center p-3">
														<div class="me-3">
															<span class="form-selectgroup-check"></span>
														</div>
														<div>
															{category.name}
														</div>
													</div>
												</label>
											{/each}
										</div>
									{:else}
										<div class="alert alert-warning mb-0">
											Keine Kategorien vorhanden.
										</div>
									{/if}
								</div>
							{/if}

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
						<h3 class="card-title">QR-Code</h3>
					</div>
					<div class="card-body">
						<QRCodeDisplay url={juryUrl} size={200} />
						<div class="mt-3 text-center">
							<a href={juryUrl} target="_blank" class="btn btn-outline-primary btn-sm">
								Voting-Link öffnen
							</a>
						</div>
					</div>
				</div>

				<div class="card mt-3">
					<div class="card-header">
						<h3 class="card-title">Status</h3>
					</div>
					<div class="card-body">
						{#if data.juryMember.isActive}
							<span class="badge bg-green text-green-fg">Aktiv</span>
						{:else}
							<span class="badge bg-secondary text-secondary-fg">Inaktiv</span>
						{/if}
						<p class="text-muted mt-2 mb-0">
							Erstellt am: {new Date(data.juryMember.createdAt).toLocaleDateString('de-DE')}
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
