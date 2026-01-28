<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import {
		IconPlayerPlay,
		IconPlayerStop,
		IconCheck,
		IconRefresh,
		IconUsers,
		IconChartBar,
		IconWifi
	} from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let eventSource: EventSource | null = $state(null);
	let isConnected = $state(false);

	onMount(() => {
		connectSSE();
	});

	onDestroy(() => {
		disconnectSSE();
	});

	function connectSSE() {
		if (eventSource) return;

		eventSource = new EventSource('/api/sse/voting-status');

		eventSource.onopen = () => {
			isConnected = true;
			console.log('SSE connected for admin voting');
		};

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'vote_received') {
					// Refresh data when a vote is received
					invalidateAll();
				} else if (data.type === 'voting_status_changed') {
					// Refresh data when voting status changes
					invalidateAll();
				}
			} catch (err) {
				console.error('Error parsing SSE message:', err);
			}
		};

		eventSource.onerror = () => {
			isConnected = false;
			disconnectSSE();
			// Reconnect after 3 seconds
			setTimeout(connectSSE, 3000);
		};
	}

	function disconnectSSE() {
		if (eventSource) {
			eventSource.close();
			eventSource = null;
			isConnected = false;
		}
	}
</script>

<svelte:head>
	<title>Voting-Steuerung - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col-auto">
				<div class="page-pretitle">Steuerung</div>
				<h2 class="page-title">Voting</h2>
			</div>
			<div class="col-auto ms-auto">
				<span class="badge" class:bg-green={isConnected} class:bg-secondary={!isConnected} style="color: #fff;">
					<IconWifi size={14} class="me-1" />
					{isConnected ? 'Live' : 'Verbinde...'}
				</span>
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
				{#if form.action === 'started'}
					Voting wurde gestartet
				{:else if form.action === 'stopped'}
					Voting wurde gestoppt
				{:else if form.action === 'completed'}
					Voting wurde abgeschlossen
				{:else if form.action === 'reset'}
					Voting wurde zurückgesetzt
				{/if}
			</div>
		{/if}

		{#if data.categories.length === 0}
			<div class="card">
				<div class="card-body text-center py-5">
					<h3>Keine Kategorien vorhanden</h3>
					<p class="text-muted">
						Erstellen Sie zuerst Kategorien, um das Voting zu starten.
					</p>
					<a href="/admin/categories" class="btn btn-primary">Kategorien erstellen</a>
				</div>
			</div>
		{:else}
			<div class="row row-deck row-cards">
				{#each data.categories as category}
					<div class="col-lg-6">
						<div class="card">
							<div class="card-header">
								<div class="d-flex align-items-center w-100">
									<h3 class="card-title">{category.name}</h3>
									<div class="ms-auto">
										{#if category.votingStatus === 'active'}
											<span class="badge bg-green text-green-fg badge-blink">Aktiv</span>
										{:else if category.votingStatus === 'completed'}
											<span class="badge bg-blue text-blue-fg">Abgeschlossen</span>
										{:else}
											<span class="badge bg-secondary text-secondary-fg">Inaktiv</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="card-body">
								<div class="row mb-3">
									<div class="col-6">
										<div class="d-flex align-items-center">
											<IconUsers size={20} class="text-muted me-2" />
											<div>
												<div class="text-muted small">Jury-Mitglieder</div>
												<div class="fw-bold">{category.stats.juryCount}</div>
											</div>
										</div>
									</div>
									<div class="col-6">
										<div class="d-flex align-items-center">
											<IconChartBar size={20} class="text-muted me-2" />
											<div>
												<div class="text-muted small">Kandidaten</div>
												<div class="fw-bold">{category.stats.candidatesCount}</div>
											</div>
										</div>
									</div>
								</div>

								<div class="mb-3">
									<div class="d-flex justify-content-between mb-1">
										<span class="text-muted">Fortschritt</span>
										<span class="fw-bold">
											{category.stats.totalVotes} / {category.stats.expectedVotes} Stimmen
										</span>
									</div>
									<div class="progress">
										<div
											class="progress-bar"
											class:bg-success={category.stats.completionPercentage === 100}
											class:bg-primary={category.stats.completionPercentage < 100}
											style="width: {category.stats.completionPercentage}%"
											role="progressbar"
										></div>
									</div>
								</div>
							</div>
							<div class="card-footer">
								<div class="btn-list">
									{#if category.votingStatus === 'idle'}
										<form method="POST" action="?/startVoting" use:enhance class="d-inline">
											<input type="hidden" name="categoryId" value={category.id} />
											<button type="submit" class="btn btn-success">
												<IconPlayerPlay size={16} class="me-1" />
												Starten
											</button>
										</form>
									{:else if category.votingStatus === 'active'}
										<form method="POST" action="?/stopVoting" use:enhance class="d-inline">
											<input type="hidden" name="categoryId" value={category.id} />
											<button type="submit" class="btn btn-warning">
												<IconPlayerStop size={16} class="me-1" />
												Stoppen
											</button>
										</form>
										<form method="POST" action="?/completeVoting" use:enhance class="d-inline">
											<input type="hidden" name="categoryId" value={category.id} />
											<button type="submit" class="btn btn-primary">
												<IconCheck size={16} class="me-1" />
												Abschließen
											</button>
										</form>
									{:else}
										<form method="POST" action="?/resetVoting" use:enhance class="d-inline">
											<input type="hidden" name="categoryId" value={category.id} />
											<button type="submit" class="btn btn-outline-secondary">
												<IconRefresh size={16} class="me-1" />
												Zurücksetzen
											</button>
										</form>
									{/if}

									<a
										href="/admin/results?category={category.id}"
										class="btn btn-outline-primary"
									>
										Ergebnisse
									</a>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.badge-blink {
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
