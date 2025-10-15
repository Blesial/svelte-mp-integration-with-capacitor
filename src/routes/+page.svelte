<script lang="ts">
	import { onMount } from 'svelte';
	import { Browser } from '@capacitor/browser';

	let sellers: any[] = [];
	let loading = true;
	let paying = false;

	// Datos del producto a pagar
	let amount = 100; // ARS 100
	let title = 'Mensaje de muro';
	let selectedSellerId = '';

	onMount(async () => {
		// Obtener lista de sellers conectados
		try {
			const res = await fetch('/api/mp/sellers');
			if (res.ok) {
				sellers = await res.json();
				// Seleccionar el primer seller por defecto
				if (sellers.length > 0) {
					selectedSellerId = sellers[0].id;
				}
			}
		} catch (e) {
			console.error('Error fetching sellers:', e);
		} finally {
			loading = false;
		}
	});

	async function handlePay() {
		if (!selectedSellerId) {
			alert('No hay sellers conectados. Por favor conecta un seller primero.');
			return;
		}

		paying = true;

		try {
			// Detectar si estamos en Capacitor (app móvil)
			const isNative = (window as any).Capacitor ? 'app' : 'web';

			// Crear preferencia de pago
			const res = await fetch('/api/mp/create-preference', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					sellerId: selectedSellerId,
					amount,
					title,
					external_reference: `order-${Date.now()}`,
					isNative
				})
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Error creating preference');
			}

			const { init_point } = await res.json();

		// Redirigir según plataforma
		if (isNative === 'app') {
			// En app móvil: abrir Browser de Capacitor
			console.log('🔗 Abriendo MercadoPago checkout...');
			
			// Listener para cuando se cierra el browser
			const listener = await Browser.addListener('browserFinished', () => {
				console.log('🔗 Browser cerrado, reseteando estado...');
				paying = false;
				listener.remove();
			});

			// Abrir browser con opciones optimizadas
			await Browser.open({ 
				url: init_point,
				presentationStyle: 'fullscreen', // Abre en pantalla completa (más rápido)
				toolbarColor: '#ffffff'
			});
		} else {
			// En web: redirigir normalmente
			window.location.href = init_point;
		}
		} catch (error) {
			console.error('Error al procesar pago:', error);
			alert(`Error: ${error}`);
			paying = false;
		}
	}
</script>

<svelte:head>
	<title>Marketplace POC - Mercado Pago</title>
</svelte:head>

<main class="container">
	<h1>Marketplace POC</h1>
	<p class="subtitle">Checkout Pro + Split Payments con Capacitor</p>

	{#if loading}
		<div class="card">
			<p>Cargando...</p>
		</div>
	{:else if sellers.length === 0}
		<div class="card warning">
			<h2>No hay sellers conectados</h2>
			<p>Necesitas conectar al menos un seller para poder recibir pagos.</p>
			<a href="/seller/connect" class="btn-primary">Conectar Seller</a>
		</div>
	{:else}
		<div class="card">
			<h2>Realizar Pago</h2>

			<div class="form-group">
				<label for="seller">Seller:</label>
				<select id="seller" bind:value={selectedSellerId}>
					{#each sellers as seller}
						<option value={seller.id}>
							{seller.nickname || seller.id} ({seller.email || 'Sin email'})
						</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="product">Producto:</label>
				<input id="product" type="text" bind:value={title} />
			</div>

			<div class="form-group">
				<label for="amount">Monto (ARS):</label>
				<input id="amount" type="number" bind:value={amount} min="1" />
			</div>

			<div class="info-box">
				<p><strong>Total:</strong> ${amount}</p>
				<p><strong>Comisión Marketplace (5%):</strong> ${Math.round(amount * 0.05)}</p>
				<p><strong>Seller recibe:</strong> ${amount - Math.round(amount * 0.05)}</p>
			</div>

			<button on:click={handlePay} disabled={paying} class="btn-pay">
				{paying ? 'Procesando...' : 'Pagar con Mercado Pago'}
			</button>
		</div>

		<div class="card info">
			<h3>Sellers conectados ({sellers.length})</h3>
			<ul>
				{#each sellers as seller}
					<li>
						<strong>{seller.nickname || seller.id}</strong>
						{#if seller.email}
							<span class="email">({seller.email})</span>
						{/if}
					</li>
				{/each}
			</ul>
			<a href="/seller/connect">+ Conectar otro seller</a>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 700px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		margin-bottom: 2rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card.warning {
		background: #fff3cd;
		border: 2px solid #ffc107;
	}

	.card.info {
		background: #f0f9ff;
		border: 1px solid #009ee3;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	input,
	select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #009ee3;
	}

	.info-box {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1rem;
		margin: 1.5rem 0;
	}

	.info-box p {
		margin: 0.5rem 0;
		color: #333;
	}

	.btn-pay {
		width: 100%;
		background: #009ee3;
		color: white;
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-pay:hover:not(:disabled) {
		background: #0088cc;
	}

	.btn-pay:disabled {
		background: #ccc;
		cursor: not-allowed;
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
		padding: 0.75rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	li:last-child {
		border-bottom: none;
	}

	.email {
		color: #666;
		font-size: 0.9rem;
	}
</style>
