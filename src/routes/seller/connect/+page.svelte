<script lang="ts">
	import { onMount } from 'svelte';

	let sellers: any[] = [];
	let loading = true;

	onMount(async () => {
		// Obtener lista de sellers conectados (para debug)
		try {
			const res = await fetch('/api/mp/sellers');
			if (res.ok) {
				sellers = await res.json();
			}
		} catch (e) {
			console.error('Error fetching sellers:', e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Conectar Seller - Marketplace POC</title>
</svelte:head>

<main class="container">
	<h1>🔗 Conectar Seller con Mercado Pago</h1>

	<div class="card">
		<h2>Paso 1: Autorizar tu cuenta</h2>
		<p>Para vender en este marketplace, necesitas conectar tu cuenta de Mercado Pago.</p>

		<a href="/api/mp/oauth/start" class="btn-primary">
			Conectar con Mercado Pago
		</a>
	</div>

	{#if !loading && sellers.length > 0}
		<div class="card">
			<h3>Sellers conectados ({sellers.length})</h3>
			<ul>
				{#each sellers as seller}
					<li>
						<strong>{seller.nickname || seller.id}</strong>
						{#if seller.email}
							- {seller.email}
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		margin-bottom: 2rem;
	}

	.card {
		background: #f5f5f5;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.btn-primary {
		display: inline-block;
		background: #009ee3;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		margin-top: 1rem;
	}

	.btn-primary:hover {
		background: #0088cc;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #ddd;
	}

	li:last-child {
		border-bottom: none;
	}
</style>
