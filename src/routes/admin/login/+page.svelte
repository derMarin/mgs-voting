<script lang="ts">
	import type { ActionData } from './$types.js';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Admin Login - MGS Voting</title>
</svelte:head>

<div class="page page-center">
	<div class="container container-tight py-4">
		<div class="card card-md">
			<div class="card-body">
				<h2 class="h2 text-center mb-4">Admin Login</h2>

				{#if form?.error}
					<div class="alert alert-danger" role="alert">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
				>
					<div class="mb-3">
						<label class="form-label" for="password">Passwort</label>
						<input
							type="password"
							id="password"
							name="password"
							class="form-control"
							placeholder="Admin-Passwort eingeben"
							required
							autocomplete="current-password"
						/>
					</div>
					<div class="form-footer">
						<button type="submit" class="btn btn-primary w-100" disabled={loading}>
							{#if loading}
								<span class="spinner-border spinner-border-sm me-2" role="status"></span>
							{/if}
							Anmelden
						</button>
					</div>
				</form>
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
