<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import { Browser } from '@capacitor/browser';

	let sellers: any[] = [];
	let loading = true;
	let oauthUrl = '/api/mp/oauth/start';

	onMount(async () => {
		// Detectar si estamos en Capacitor (mobile)
		const isCapacitor = (window as any).Capacitor;

		if (isCapacitor) {
			// En mobile, usar tunnel URL para OAuth
			oauthUrl = `${PUBLIC_APP_URL}/api/mp/oauth/start`;
			console.log('🔗 Mobile detected, using tunnel URL for OAuth:', oauthUrl);
		} else {
			// En web, usar ruta relativa
			oauthUrl = '/api/mp/oauth/start';
			console.log('🌐 Web detected, using relative URL for OAuth');
		}

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

	async function handleOAuthConnect() {
		const isCapacitor = (window as any).Capacitor;

		if (isCapacitor) {
			// En mobile, abrir OAuth en Browser de Capacitor
			console.log('🔗 Opening OAuth in Capacitor Browser:', oauthUrl);

			// Listener para cuando se cierra el browser
			const listener = await Browser.addListener('browserFinished', () => {
				console.log('🔗 OAuth browser closed');
				// Recargar sellers para mostrar el nuevo seller conectado
				location.reload();
				listener.remove();
			});

			// Abrir browser con opciones optimizadas
			await Browser.open({ 
				url: oauthUrl,
				presentationStyle: 'fullscreen',
				toolbarColor: '#ffffff'
			});
		} else {
			// En web, redirigir normalmente
			window.location.href = oauthUrl;
		}
	}
</script>

<svelte:head>
	<title>Conectar Seller - Marketplace POC</title>
</svelte:head>

<main class="container">
	<h1>🔗 Conectar Seller con Mercado Pago</h1>

	<div class="card">
		<h2>Paso 1: Autorizar tu cuenta</h2>
		<p>Para vender en este marketplace, necesitas conectar tu cuenta de Mercado Pago.</p>

		<button on:click={handleOAuthConnect} class="btn-primary">
			Conectar con Mercado Pago
		</button>
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
		border: none;
		cursor: pointer;
		font-size: 1rem;
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
