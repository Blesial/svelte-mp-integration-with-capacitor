<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let paymentId = '';
	let status = '';
	let externalReference = '';
	let merchantOrderId = '';

	onMount(() => {
		paymentId = $page.url.searchParams.get('payment_id') ||
		            $page.url.searchParams.get('collection_id') || '';
		status = $page.url.searchParams.get('status') ||
		         $page.url.searchParams.get('collection_status') || '';
		externalReference = $page.url.searchParams.get('external_reference') || '';
		merchantOrderId = $page.url.searchParams.get('merchant_order_id') || '';

		console.log('⏳ Pago pendiente:', {
			paymentId,
			status,
			externalReference,
			merchantOrderId
		});

		// Si estamos en app móvil, cerrar el browser
		if ((window as any).Capacitor) {
			setTimeout(async () => {
				const { Browser } = await import('@capacitor/browser');
				await Browser.close();
			}, 4000); // Cerrar después de 4 segundos
		}
	});
</script>

<svelte:head>
	<title>Pago Pendiente - Marketplace POC</title>
</svelte:head>

<main class="container">
	<div class="card pending">
		<div class="icon">⏳</div>
		<h1>Pago Pendiente</h1>
		<p class="subtitle">Tu pago está siendo procesado</p>

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

		<div class="info-box">
			<h3>¿Qué significa esto?</h3>
			<p>
				Tu pago está siendo verificado. Esto puede suceder por varios motivos:
			</p>
			<ul>
				<li>Pago con efectivo (Rapipago, Pago Fácil)</li>
				<li>Transferencia bancaria en proceso</li>
				<li>Verificación adicional de seguridad</li>
			</ul>
			<p class="notification-note">
				Te notificaremos por email cuando se confirme el pago.
			</p>
		</div>

		<div class="actions">
			<a href="/" class="btn-primary">Volver al inicio</a>
		</div>

		{#if (window as any).Capacitor}
			<p class="mobile-note">Esta ventana se cerrará automáticamente en 4 segundos...</p>
		{/if}
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

	.card.pending {
		border-top: 4px solid #ffc107;
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	h1 {
		color: #ffc107;
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
		margin-bottom: 1.5rem;
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

	.status-pending,
	.status-in_process {
		color: #ffc107;
		font-weight: 600;
	}

	.info-box {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.info-box h3 {
		color: #856404;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.info-box p {
		color: #856404;
		margin-bottom: 1rem;
	}

	.info-box ul {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	.info-box li {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		color: #856404;
	}

	.info-box li::before {
		content: '•';
		position: absolute;
		left: 0;
		font-weight: bold;
	}

	.notification-note {
		font-weight: 600;
		margin-bottom: 0 !important;
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
