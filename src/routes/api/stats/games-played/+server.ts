import { getGamesPlayedCount } from '$lib/server/games-played';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const increment = url.searchParams.get('increment') === '1';

	try {
		const count = await getGamesPlayedCount(increment);

		return json(
			{ count },
			{
				headers: {
					'cache-control': 'no-store'
				}
			}
		);
	} catch {
		return json({ error: 'Counter unavailable.' }, { status: 502 });
	}
};
