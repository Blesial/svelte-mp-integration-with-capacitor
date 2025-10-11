<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let paymentId = '';
	let status = '';
	let externalReference = '';
	let statusDetail = '';

	onMount(() => {
		paymentId = $page.url.searchParams.get('payment_id') ||
		            $page.url.searchParams.get('collection_id') || '';
		status = $page.url.searchParams.get('status') ||
		         $page.url.searchParams.get('collection_status') || '';
		externalReference = $page.url.searchParams.get('external_reference') || '';
		statusDetail = $page.url.searchParams.get('status_detail') || '';

		console.log('Pago rechazado:', {
			paymentId,
			status,
			statusDetail,
			externalReference
		});

		// Si estamos en app móvil, cerrar el browser
		if ((window as any).Capacitor) {
			setTimeout(async () => {
				const { Browser } = await import('@capacitor/browser');
				await Browser.close();
			}, 5000); // Cerrar después de 5 segundos
		}
	});

	function getErrorMessage(detail: string): string {
		const messages: Record<string, string> = {
			'cc_rejected_bad_filled_card_number': 'Número de tarjeta inválido',
			'cc_rejected_bad_filled_date': 'Fecha de expiración inválida',
			'cc_rejected_bad_filled_security_code': 'Código de seguridad inválido',
			'cc_rejected_insufficient_amount': 'Saldo insuficiente',
			'cc_rejected_max_attempts': 'Máximo de intentos alcanzado',
			'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
			'cc_rejected_high_risk': 'Pago rechazado por riesgo',
			'cc_rejected_blacklist': 'Tarjeta en lista negra',
			'cc_rejected_other_reason': 'Pago rechazado por el banco'
		};
		return messages[detail] || 'El pago no pudo ser procesado';
	}
</script>

<svelte:head>
	<title>Pago Rechazado - Marketplace POC</title>
</svelte:head>

<main class="container">
	<div class="card failure">
		<div class="icon">❌</div>
		<h1>Pago Rechazado</h1>
		<p class="subtitle">
			{statusDetail ? getErrorMessage(statusDetail) : 'Tu pago no pudo ser procesado'}
		</p>

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

			{#if statusDetail}
				<div class="detail-row">
					<span class="label">Detalle:</span>
					<span class="value">{statusDetail}</span>
				</div>
			{/if}

			{#if externalReference}
				<div class="detail-row">
					<span class="label">Referencia:</span>
					<span class="value">{externalReference}</span>
				</div>
			{/if}
		</div>

		<div class="help-box">
			<h3>¿Qué puedes hacer?</h3>
			<ul>
				<li>Verifica que los datos de tu tarjeta sean correctos</li>
				<li>Asegúrate de tener saldo suficiente</li>
				<li>Intenta con otro medio de pago</li>
				<li>Contacta a tu banco para autorizar la operación</li>
			</ul>
		</div>

		<div class="actions">
			<a href="/" class="btn-primary">Intentar nuevamente</a>
		</div>

		{#if (window as any).Capacitor}
			<p class="mobile-note">Esta ventana se cerrará automáticamente en 5 segundos...</p>
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

	.card.failure {
		border-top: 4px solid #f23d4f;
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	h1 {
		color: #f23d4f;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		margin-bottom: 2rem;
		font-size: 1.1rem;
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

	.status-rejected {
		color: #f23d4f;
		font-weight: 600;
	}

	.help-box {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.help-box h3 {
		color: #856404;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.help-box ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.help-box li {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		color: #856404;
	}

	.help-box li::before {
		content: '•';
		position: absolute;
		left: 0;
		font-weight: bold;
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
