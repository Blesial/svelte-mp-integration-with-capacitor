import { App as CapacitorApp } from '@capacitor/app';
import { goto } from '$app/navigation';

/**
 * Inicializa el listener de deep links para Capacitor
 *
 * Cuando Mercado Pago redirige a marketplacepoc://payment/success?payment_id=123
 * esta función captura el evento y navega a la ruta correspondiente en SvelteKit
 */
export function initDeepLinks() {
	// Solo ejecutar en entorno Capacitor (móvil)
	if (!(window as any).Capacitor) {
		console.log('🔗 Deep links: Skipped (not running in Capacitor)');
		return;
	}

	console.log('🔗 Deep links: Initializing listener...');

	// Listener para cuando la app recibe un deep link
	CapacitorApp.addListener('appUrlOpen', (event) => {
		console.log('🔗 Deep link received:', event.url);

		try {
			const url = new URL(event.url);

			// Verificar que sea nuestro scheme
			if (url.protocol !== 'marketplacepoc:') {
				console.warn('🔗 Unknown protocol:', url.protocol);
				return;
			}

			// Extraer path y query params
			// marketplacepoc://payment/success?payment_id=123
			// -> host: payment
			// -> pathname: /success
			// -> search: ?payment_id=123

			const host = url.hostname; // "payment"
			const pathname = url.pathname; // "/success"
			const search = url.search; // "?payment_id=123"

			// Construir la ruta de SvelteKit
			const svelteRoute = `/${host}${pathname}${search}`;

			console.log(`🔗 Navigating to: ${svelteRoute}`);

			// Navegar a la ruta en SvelteKit
			goto(svelteRoute);
		} catch (error) {
			console.error('🔗 Error parsing deep link:', error);
		}
	});

	console.log('✅ Deep links: Listener ready');
}

/**
 * Cleanup del listener (opcional)
 */
export async function removeDeepLinks() {
	if ((window as any).Capacitor) {
		await CapacitorApp.removeAllListeners();
		console.log('🔗 Deep links: Listener removed');
	}
}
