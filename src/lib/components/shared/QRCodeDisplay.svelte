<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	interface Props {
		url: string;
		size?: number;
		title?: string;
	}

	let { url, size = 200, title }: Props = $props();

	let canvas: HTMLCanvasElement;

	onMount(() => {
		generateQRCode();
	});

	$effect(() => {
		if (canvas) {
			generateQRCode();
		}
	});

	async function generateQRCode() {
		try {
			await QRCode.toCanvas(canvas, url, {
				width: size,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (err) {
			console.error('Error generating QR code:', err);
		}
	}
</script>

<div class="qr-code-container text-center">
	{#if title}
		<h4 class="mb-3">{title}</h4>
	{/if}
	<canvas bind:this={canvas}></canvas>
	<div class="mt-2">
		<small class="text-muted text-break" style="max-width: {size}px; display: inline-block;">
			{url}
		</small>
	</div>
</div>

<style>
	.qr-code-container {
		background: white;
		padding: 1.5rem;
		border-radius: var(--tblr-border-radius);
		border: 1px solid var(--tblr-border-color);
	}

	canvas {
		display: block;
		margin: 0 auto;
	}
</style>
