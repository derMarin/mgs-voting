<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import QRCodeDisplay from '$lib/components/shared/QRCodeDisplay.svelte';
	import {
		IconPlus,
		IconTrash,
		IconEdit,
		IconQrcode,
		IconRefresh,
		IconCheck,
		IconX
	} from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateModal = $state(false);
	let showQRModal = $state<{ name: string; token: string } | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let selectedJuryType = $state<'core' | 'category'>('core');

	const appUrl = env.PUBLIC_APP_URL || 'http://localhost:5173';

	function getJuryUrl(token: string): string {
		return `${appUrl}/jury/${token}`;
	}
</script>

<svelte:head>
	<title>Jury-Verwaltung - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<div class="page-pretitle">Verwaltung</div>
				<h2 class="page-title">Jury-Mitglieder</h2>
			</div>
			<div class="col-auto ms-auto">
				<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
					<IconPlus size={16} class="me-1" />
					Neues Jury-Mitglied
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
				{#if form?.tokenRegenerated}
					Neuer Zugangscode wurde generiert
				{:else}
					Aktion erfolgreich ausgeführt
				{/if}
			</div>
		{/if}

		<div class="card">
			<div class="table-responsive">
				<table class="table table-vcenter card-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Typ</th>
							<th>Kategorien</th>
							<th>Status</th>
							<th class="w-1"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.juryMembers as member}
							<tr>
								<td>{member.name}</td>
								<td>
									{#if member.juryType === 'core'}
										<span class="badge bg-blue text-blue-fg">Kern-Jury</span>
									{:else}
										<span class="badge bg-pink text-pink-fg">Kategorie-Jury</span>
									{/if}
								</td>
								<td>
									{#if member.juryType === 'core'}
										<span class="text-muted">Alle Kategorien</span>
									{:else if member.categoryAssignments?.length > 0}
										<div class="d-flex flex-wrap gap-1">
											{#each member.categoryAssignments as assignment}
												<span class="badge bg-secondary-lt">
													{assignment.category.name}
												</span>
											{/each}
										</div>
									{:else}
										<span class="text-muted">Keine</span>
									{/if}
								</td>
								<td>
									<form
										method="POST"
										action="?/toggleActive"
										use:enhance
										class="d-inline"
									>
										<input type="hidden" name="id" value={member.id} />
										<button
											type="submit"
											class="btn btn-sm"
											class:btn-success={member.isActive}
											class:btn-secondary={!member.isActive}
											title={member.isActive ? 'Aktiv - Klicken zum Deaktivieren' : 'Inaktiv - Klicken zum Aktivieren'}
										>
											{#if member.isActive}
												<IconCheck size={16} />
											{:else}
												<IconX size={16} />
											{/if}
										</button>
									</form>
								</td>
								<td>
									<div class="btn-list flex-nowrap">
										<button
											class="btn btn-sm btn-outline-primary"
											onclick={() =>
												(showQRModal = { name: member.name, token: member.accessToken })}
											title="QR-Code anzeigen"
										>
											<IconQrcode size={16} />
										</button>
										<form
											method="POST"
											action="?/regenerateToken"
											use:enhance
											class="d-inline"
										>
											<input type="hidden" name="id" value={member.id} />
											<button
												type="submit"
												class="btn btn-sm btn-outline-warning"
												title="Neuen Zugangscode generieren"
											>
												<IconRefresh size={16} />
											</button>
										</form>
										<a
											href="/admin/jury/{member.id}"
											class="btn btn-sm btn-outline-primary"
											title="Bearbeiten"
										>
											<IconEdit size={16} />
										</a>
										<button
											class="btn btn-sm btn-outline-danger"
											onclick={() => (deleteConfirmId = member.id)}
											title="Löschen"
										>
											<IconTrash size={16} />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center text-muted py-4">
									Keine Jury-Mitglieder vorhanden. Erstellen Sie ein neues Jury-Mitglied.
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
					<h5 class="modal-title">Neues Jury-Mitglied erstellen</h5>
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
								placeholder="Name des Jury-Mitglieds"
							/>
						</div>
						<div class="mb-3" role="group" aria-labelledby="juryTypeLabel">
							<span class="form-label" id="juryTypeLabel">Jury-Typ *</span>
							<div class="form-selectgroup">
								<label class="form-selectgroup-item">
									<input
										type="radio"
										name="juryType"
										value="core"
										class="form-selectgroup-input"
										checked
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
							<div class="mb-3" role="group" aria-labelledby="categoriesLabel">
								<span class="form-label" id="categoriesLabel">Kategorien zuweisen *</span>
								{#if data.categories.length > 0}
									<div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
										{#each data.categories as category}
											<label class="form-selectgroup-item flex-fill">
												<input
													type="checkbox"
													name="categoryIds"
													value={category.id}
													class="form-selectgroup-input"
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
										Keine Kategorien vorhanden. Erstellen Sie zuerst Kategorien.
									</div>
								{/if}
							</div>
						{/if}
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

<!-- QR Code Modal -->
{#if showQRModal}
	<div class="modal modal-blur fade show d-block" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">QR-Code für {showQRModal.name}</h5>
					<button
						type="button"
						class="btn-close"
						aria-label="Schließen"
						onclick={() => (showQRModal = null)}
					></button>
				</div>
				<div class="modal-body">
					<QRCodeDisplay url={getJuryUrl(showQRModal.token)} size={250} />
					<div class="mt-3 text-center">
						<p class="text-muted mb-2">
							Scannen Sie diesen QR-Code, um das Voting-Interface zu öffnen.
						</p>
						<a
							href={getJuryUrl(showQRModal.token)}
							target="_blank"
							class="btn btn-outline-primary btn-sm"
						>
							Link öffnen
						</a>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => (showQRModal = null)}>Schließen</button>
				</div>
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
					<h3>Jury-Mitglied löschen?</h3>
					<div class="text-muted">
						Diese Aktion kann nicht rückgängig gemacht werden. Alle Stimmen dieses Mitglieds werden
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
