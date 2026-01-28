<script lang="ts">
	interface Props {
		title?: string;
		message?: string;
	}

	let { title = 'Bitte warten', message = 'Das Voting wurde noch nicht gestartet.' }: Props = $props();
</script>

<div class="waiting-screen">
	<div class="waiting-content">
		<div class="waiting-animation mb-4">
			<div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
				<span class="visually-hidden">Laden...</span>
			</div>
		</div>
		<h2 class="waiting-title">{title}</h2>
		<p class="waiting-message text-muted">{message}</p>
	</div>
</div>

<style>
	.waiting-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
	}

	.waiting-content {
		max-width: 400px;
		padding: 2rem;
	}

	.waiting-animation {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.waiting-title {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.waiting-message {
		font-size: 1rem;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
