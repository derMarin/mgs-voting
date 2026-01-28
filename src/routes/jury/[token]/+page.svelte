<script lang="ts">
	import type { PageData, ActionData } from './$types.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { IconPhoto, IconCheck } from '@tabler/icons-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let currentVotes = $state<Record<string, number>>({ ...data.votes });
	let submittingCandidate = $state<string | null>(null);

	// Update currentVotes when form succeeds
	$effect(() => {
		if (form?.success && form?.candidateId && form?.score) {
			currentVotes[form.candidateId] = form.score;
		}
	});

	// SSE connection for real-time updates
	let eventSource: EventSource | null = null;

	onMount(() => {
		// Connect to SSE endpoint for voting status updates
		eventSource = new EventSource('/api/sse/voting-status');

		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'voting_status_changed') {
				// Reload the page to get new voting status
				invalidateAll();
			}
		};

		eventSource.onerror = () => {
			// Reconnect after a delay
			setTimeout(() => {
				if (eventSource) {
					eventSource.close();
					eventSource = new EventSource('/api/sse/voting-status');
				}
			}, 5000);
		};
	});

	onDestroy(() => {
		eventSource?.close();
	});

	function getVoteForCandidate(candidateId: string): number | undefined {
		return currentVotes[candidateId];
	}

	function hasVotedForCandidate(candidateId: string): boolean {
		return candidateId in currentVotes;
	}

	const allVoted = $derived(
		data.candidates.every((c) => hasVotedForCandidate(c.id))
	);

	const votedCount = $derived(
		data.candidates.filter((c) => hasVotedForCandidate(c.id)).length
	);
</script>

<svelte:head>
	<title>Voting - MGS Voting</title>
</svelte:head>

<div class="page">
	<div class="container-xl py-4">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div>
				<h1 class="h2 mb-0">Voting</h1>
				<p class="text-muted mb-0">Willkommen, {data.juryMember.name}</p>
			</div>
			{#if data.activeCategory && data.canVote}
				<div class="badge bg-blue text-blue-fg fs-5 px-3 py-2">
					{data.activeCategory.name}
				</div>
			{/if}
		</div>

		{#if !data.activeCategory}
			<!-- Waiting for voting to start -->
			<div class="card">
				<div class="card-body text-center py-5">
					<div class="waiting-pulse mb-4">
						<div
							class="avatar avatar-xl bg-primary-lt text-primary mx-auto"
							style="width: 100px; height: 100px;"
						>
							<span class="fs-1">...</span>
						</div>
					</div>
					<h2>Warten auf Voting</h2>
					<p class="text-muted">
						Das Voting wurde noch nicht gestartet. Bitte warten Sie, bis der Administrator das
						Voting aktiviert.
					</p>
				</div>
			</div>
		{:else if !data.canVote}
			<!-- Not authorized for this category -->
			<div class="card">
				<div class="card-body text-center py-5">
					<h2>Kategorie nicht verfügbar</h2>
					<p class="text-muted">
						Sie sind nicht berechtigt, in der Kategorie "{data.activeCategory.name}" abzustimmen.
					</p>
					<p class="text-muted">
						Bitte warten Sie, bis eine Kategorie aktiviert wird, in der Sie abstimmen können.
					</p>
				</div>
			</div>
		{:else if data.candidates.length === 0}
			<!-- No candidates -->
			<div class="card">
				<div class="card-body text-center py-5">
					<h2>Keine Kandidaten</h2>
					<p class="text-muted">
						In dieser Kategorie gibt es keine Kandidaten zum Bewerten.
					</p>
				</div>
			</div>
		{:else}
			<!-- Voting interface -->
			{#if form?.error}
				<div class="alert alert-danger mb-4" role="alert">
					{form.error}
				</div>
			{/if}

			<div class="mb-4">
				<div class="d-flex justify-content-between align-items-center mb-2">
					<span>Fortschritt</span>
					<span class="fw-bold">{votedCount} / {data.candidates.length}</span>
				</div>
				<div class="progress progress-lg">
					<div
						class="progress-bar"
						class:bg-success={allVoted}
						style="width: {(votedCount / data.candidates.length) * 100}%"
					></div>
				</div>
			</div>

			{#if allVoted}
				<div class="alert alert-success mb-4">
					<div class="d-flex align-items-center">
						<IconCheck size={24} class="me-2" />
						<div>
							<h4 class="alert-title">Alle Stimmen abgegeben!</h4>
							<div>Sie können Ihre Bewertungen jederzeit ändern, solange das Voting aktiv ist.</div>
						</div>
					</div>
				</div>
			{/if}

			<div class="row row-cards">
				{#each data.candidates as candidate}
					{@const existingVote = getVoteForCandidate(candidate.id)}
					{@const hasVoted = hasVotedForCandidate(candidate.id)}

					<div class="col-md-6 col-lg-4">
						<div class="card candidate-card" class:border-success={hasVoted}>
							{#if candidate.images && candidate.images.length > 0}
								<img
									src={candidate.images[0].mediumPath}
									alt={candidate.name}
									class="card-img-top"
									style="height: 200px; object-fit: cover;"
								/>
							{:else}
								<div
									class="card-img-top d-flex align-items-center justify-content-center bg-light"
									style="height: 200px;"
								>
									<IconPhoto size={48} class="text-muted" />
								</div>
							{/if}
							<div class="card-body">
								<h3 class="card-title">{candidate.name}</h3>
								{#if candidate.description}
									<div class="text-muted small mb-3">
										{@html candidate.description}
									</div>
								{/if}

								<form
									method="POST"
									action="?/vote"
									use:enhance={() => {
										submittingCandidate = candidate.id;
										return async ({ update }) => {
											submittingCandidate = null;
											await update({ reset: false });
										};
									}}
								>
									<input type="hidden" name="candidateId" value={candidate.id} />

									<div class="mb-3">
										<label class="form-label d-flex justify-content-between">
											<span>Bewertung</span>
											<span class="fw-bold text-primary fs-4" id="score-display-{candidate.id}">
												{existingVote || 5}
											</span>
										</label>
										<input
											type="range"
											name="score"
											min="1"
											max="10"
											value={existingVote || 5}
											class="vote-slider w-100"
											oninput={(e) => {
												const display = document.getElementById(`score-display-${candidate.id}`);
												if (display) display.textContent = (e.target as HTMLInputElement).value;
											}}
										/>
										<div class="d-flex justify-content-between text-muted small mt-1">
											<span>1</span>
											<span>10</span>
										</div>
									</div>

									<button
										type="submit"
										class="btn w-100"
										class:btn-success={hasVoted}
										class:btn-primary={!hasVoted}
										disabled={submittingCandidate === candidate.id}
									>
										{#if submittingCandidate === candidate.id}
											<span class="spinner-border spinner-border-sm me-2"></span>
										{/if}
										{#if hasVoted}
											<IconCheck size={16} class="me-1" />
											Bewertung aktualisieren
										{:else}
											Bewertung abgeben
										{/if}
									</button>
								</form>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
