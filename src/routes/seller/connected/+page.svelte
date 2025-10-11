<script lang="ts">
	import { page } from '$app/stores';

	$: sellerId = $page.url.searchParams.get('sellerId') || '';
	$: nickname = $page.url.searchParams.get('nickname') || '';
</script>

<svelte:head>
	<title>Seller Conectado - Marketplace POC</title>
</svelte:head>

<main class="container">
	<div class="success-card">
		<h1>Seller Conectado Exitosamente</h1>

		<div class="info">
			<p><strong>Seller ID:</strong> {sellerId}</p>
			{#if nickname}
				<p><strong>Nickname:</strong> {nickname}</p>
			{/if}
		</div>

		<p class="message">
			Tu cuenta de Mercado Pago ha sido vinculada correctamente. Ahora puedes recibir pagos en este
			marketplace.
		</p>

		<div class="actions">
			<a href="/" class="btn-primary">Ir al inicio</a>
			<a href="/seller/connect" class="btn-secondary">Ver sellers conectados</a>
		</div>
	</div>
</main>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.success-card {
		background: #f0f9ff;
		border: 2px solid #009ee3;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		color: #009ee3;
		margin-bottom: 1.5rem;
	}

	.info {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		text-align: left;
	}

	.info p {
		margin: 0.5rem 0;
	}

	.message {
		margin: 1.5rem 0;
		color: #666;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
	}

	.btn-primary {
		background: #009ee3;
		color: white;
	}

	.btn-primary:hover {
		background: #0088cc;
	}

	.btn-secondary {
		background: white;
		color: #009ee3;
		border: 2px solid #009ee3;
	}

	.btn-secondary:hover {
		background: #f0f9ff;
	}
</style>
