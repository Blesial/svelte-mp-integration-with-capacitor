import { json } from '@sveltejs/kit';
import { listSellers } from '$lib/server/seller.repo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const sellers = listSellers();
	return json(sellers);
};
