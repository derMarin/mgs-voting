<script lang="ts">
	import { IconUsers, IconLock } from '@tabler/icons-svelte';
</script>

<svelte:head>
	<title>MGS Voting</title>
</svelte:head>

<div class="page page-center">
	<div class="container container-tight py-4">
		<div class="text-center mb-4">
			<h1 class="h1">MGS Voting</h1>
			<p class="text-muted">Willkommen beim Voting-System</p>
		</div>

		<div class="row row-cards">
			<div class="col-12">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center mb-3">
							<span class="avatar bg-primary-lt me-3">
								<IconLock size={24} class="text-primary" />
							</span>
							<div>
								<h3 class="mb-0">Admin-Bereich</h3>
								<p class="text-muted mb-0">Verwaltung und Steuerung</p>
							</div>
						</div>
						<a href="/admin" class="btn btn-primary w-100">Zum Admin-Bereich</a>
					</div>
				</div>
			</div>

			<div class="col-12">
				<div class="card">
					<div class="card-body">
						<div class="d-flex align-items-center mb-3">
							<span class="avatar bg-green-lt me-3">
								<IconUsers size={24} class="text-green" />
							</span>
							<div>
								<h3 class="mb-0">Jury-Mitglieder</h3>
								<p class="text-muted mb-0">Zugang über QR-Code</p>
							</div>
						</div>
						<p class="text-muted small">
							Jury-Mitglieder erhalten einen persönlichen QR-Code vom Administrator, um am Voting teilzunehmen.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.page-center {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 100vh;
	}
</style>
