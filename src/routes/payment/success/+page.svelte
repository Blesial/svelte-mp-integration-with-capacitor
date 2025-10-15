<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Browser } from '@capacitor/browser';

	// Parámetros que MP envía en la URL
	let paymentId = '';
	let status = '';
	let externalReference = '';
	let merchantOrderId = '';

	onMount(() => {
		// Mercado Pago envía diferentes parámetros según el flujo
		paymentId = $page.url.searchParams.get('payment_id') ||
		            $page.url.searchParams.get('collection_id') || '';
		status = $page.url.searchParams.get('status') ||
		         $page.url.searchParams.get('collection_status') || '';
		externalReference = $page.url.searchParams.get('external_reference') || '';
		merchantOrderId = $page.url.searchParams.get('merchant_order_id') || '';

		console.log('Pago exitoso:', {
			paymentId,
			status,
			externalReference,
			merchantOrderId
		});

		// Si estamos en app móvil, cerrar el browser automáticamente
		if ((window as any).Capacitor) {
			setTimeout(async () => {
				await Browser.close();
			}, 3000); // Cerrar después de 3 segundos
		}
	});
</script>

<svelte:head>
	<title>Pago Exitoso - Marketplace POC</title>
</svelte:head>

<main class="container">
	<div class="card success">
		<div class="icon">✅</div>
		<h1>¡Pago Exitoso!</h1>
		<p class="subtitle">Tu pago ha sido procesado correctamente</p>

		<div class="details">
			{#if paymentId}
				<div class="detail-row">
					<span class="label">ID de Pago:</span>
					<span class="value">{paymentId}</span>
				</div>
			{/if}

			{#if status}
				<div class="detail-row">
					<span class="label">Estado:</span>
					<span class="value status-{status}">{status}</span>
				</div>
			{/if}

			{#if externalReference}
				<div class="detail-row">
					<span class="label">Referencia:</span>
					<span class="value">{externalReference}</span>
				</div>
			{/if}

			{#if merchantOrderId}
				<div class="detail-row">
					<span class="label">Orden:</span>
					<span class="value">{merchantOrderId}</span>
				</div>
			{/if}
		</div>

		<div class="actions">
			<a href="/" class="btn-primary">Volver al inicio</a>
		</div>
	</div>
</main>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card.success {
		border-top: 4px solid #00a650;
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	h1 {
		color: #00a650;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		margin-bottom: 2rem;
	}

	.details {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 600;
		color: #333;
	}

	.value {
		color: #666;
		font-family: monospace;
	}

	.status-approved {
		color: #00a650;
		font-weight: 600;
	}

	.actions {
		margin-top: 2rem;
	}

	.btn-primary {
		display: inline-block;
		background: #009ee3;
		color: white;
		padding: 1rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #0088cc;
	}

	.mobile-note {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #666;
		font-style: italic;
	}
</style>
