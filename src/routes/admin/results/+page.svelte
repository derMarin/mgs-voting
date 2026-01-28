<script lang="ts">
	import type { PageData } from './$types.js';
	import { goto } from '$app/navigation';
	import { IconTrophy, IconPhoto, IconChevronDown, IconChevronUp } from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();

	let expandedCandidate = $state<string | null>(null);

	function handleCategoryChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const categoryId = select.value;
		if (categoryId) {
			goto(`/admin/results?category=${categoryId}`);
		} else {
			goto('/admin/results');
		}
	}

	function toggleExpanded(candidateId: string) {
		if (expandedCandidate === candidateId) {
			expandedCandidate = null;
		} else {
			expandedCandidate = candidateId;
		}
	}

	function getRankClass(index: number): string {
		if (index === 0) return 'bg-yellow text-yellow-fg';
		if (index === 1) return 'bg-secondary';
		if (index === 2) return 'bg-orange text-orange-fg';
		return 'bg-secondary-lt';
	}

	function getRankIcon(index: number) {
		if (index < 3) return IconTrophy;
		return null;
	}

	function getScoreBadgeClass(score: number): string {
		if (score >= 8) return 'bg-green text-green-fg';
		if (score >= 5) return 'bg-yellow text-yellow-fg';
		return 'bg-red text-red-fg';
	}
</script>

<svelte:head>
	<title>Ergebnisse - MGS Voting</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row align-items-center">
			<div class="col">
				<div class="page-pretitle">Auswertung</div>
				<h2 class="page-title">Ergebnisse</h2>
			</div>
			<div class="col-auto">
				<select class="form-select" onchange={handleCategoryChange}>
					<option value="">Kategorie wählen...</option>
					{#each data.categories as category}
						<option value={category.id} selected={data.selectedCategoryId === category.id}>
							{category.name}
							{#if category.votingStatus === 'completed'}
								(Abgeschlossen)
							{:else if category.votingStatus === 'active'}
								(Aktiv)
							{/if}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</div>

<div class="page-body">
	<div class="container-xl">
		{#if !data.selectedCategoryId}
			<div class="card">
				<div class="card-body text-center py-5">
					<h3>Kategorie auswählen</h3>
					<p class="text-muted">
						Wählen Sie eine Kategorie aus, um die Ergebnisse anzuzeigen.
					</p>
				</div>
			</div>
		{:else if data.results.length === 0}
			<div class="card">
				<div class="card-body text-center py-5">
					<h3>Keine Ergebnisse</h3>
					<p class="text-muted">
						Für diese Kategorie wurden noch keine Stimmen abgegeben.
					</p>
				</div>
			</div>
		{:else}
			<div class="card mb-4">
				<div class="card-header">
					<h3 class="card-title">{data.selectedCategory?.name} - Ergebnisse</h3>
					{#if data.selectedCategory}
						<div class="card-actions">
							{#if data.selectedCategory.votingStatus === 'completed'}
								<span class="badge bg-blue text-blue-fg">Abgeschlossen</span>
							{:else if data.selectedCategory.votingStatus === 'active'}
								<span class="badge bg-green text-green-fg">Aktiv</span>
							{:else}
								<span class="badge bg-secondary text-secondary-fg">Inaktiv</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="row row-cards">
				{#each data.results as result, index}
					{@const RankIcon = getRankIcon(index)}
					<div class="col-12">
						<div class="card">
							<div class="card-body">
								<div class="row align-items-center">
									<div class="col-auto">
										<span
											class="avatar avatar-lg {getRankClass(index)}"
											style="font-size: 1.5rem; font-weight: bold;"
										>
											{#if RankIcon}
												<RankIcon size={24} />
											{:else}
												{index + 1}
											{/if}
										</span>
									</div>
									<div class="col-auto">
										{#if result.images && result.images.length > 0}
											<img
												src={result.images[0].thumbnailPath}
												alt={result.candidateName}
												class="avatar avatar-lg"
											/>
										{:else}
											<span class="avatar avatar-lg">
												<IconPhoto size={24} />
											</span>
										{/if}
									</div>
									<div class="col">
										<h3 class="mb-0">{result.candidateName}</h3>
										<div class="text-muted">
											{result.totalVotes} Stimme{result.totalVotes !== 1 ? 'n' : ''}
										</div>
									</div>
									<div class="col-auto">
										<div class="h1 mb-0 text-primary">{result.averageScore.toFixed(2)}</div>
										<div class="text-muted small">Durchschnitt</div>
									</div>
									<div class="col-auto">
										<button
											class="btn btn-ghost-secondary"
											onclick={() => toggleExpanded(result.candidateId)}
										>
											{#if expandedCandidate === result.candidateId}
												<IconChevronUp size={20} />
											{:else}
												<IconChevronDown size={20} />
											{/if}
										</button>
									</div>
								</div>

								{#if expandedCandidate === result.candidateId}
									<div class="mt-4 pt-4 border-top">
										<h4 class="mb-3">Einzelne Bewertungen</h4>
										{#if result.votes.length > 0}
											<div class="table-responsive">
												<table class="table table-vcenter">
													<thead>
														<tr>
															<th>Jury-Mitglied</th>
															<th>Bewertung</th>
															<th>Visualisierung</th>
														</tr>
													</thead>
													<tbody>
														{#each result.votes as vote}
															<tr>
																<td>{vote.juryMemberName}</td>
																<td>
																	<span class="badge {getScoreBadgeClass(vote.score)}">{vote.score}</span>
																</td>
																<td style="width: 200px;">
																	<div class="progress">
																		<div
																			class="progress-bar"
																			style="width: {vote.score * 10}%"
																		></div>
																	</div>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										{:else}
											<p class="text-muted">Keine Bewertungen vorhanden.</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Summary Statistics -->
			<div class="card mt-4">
				<div class="card-header">
					<h3 class="card-title">Zusammenfassung</h3>
				</div>
				<div class="card-body">
					<div class="row">
						<div class="col-md-4">
							<div class="d-flex align-items-center mb-3">
								<div class="me-3">
									<span class="bg-primary text-white avatar">
										{data.results.length}
									</span>
								</div>
								<div>
									<div class="text-muted">Kandidaten</div>
								</div>
							</div>
						</div>
						<div class="col-md-4">
							<div class="d-flex align-items-center mb-3">
								<div class="me-3">
									<span class="bg-green text-white avatar">
										{data.results.reduce((sum, r) => sum + r.totalVotes, 0)}
									</span>
								</div>
								<div>
									<div class="text-muted">Abgegebene Stimmen</div>
								</div>
							</div>
						</div>
						<div class="col-md-4">
							<div class="d-flex align-items-center mb-3">
								<div class="me-3">
									<span class="bg-yellow text-yellow-fg avatar">
										{data.results[0]?.averageScore.toFixed(1) || '-'}
									</span>
								</div>
								<div>
									<div class="text-muted">Höchster Durchschnitt</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
