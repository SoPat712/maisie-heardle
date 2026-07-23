import { getGamesPlayedCount } from '$lib/server/games-played';
import { json, type RequestHandler } from '@sveltejs/kit';

async function respond(increment: boolean) {
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
}

export const GET: RequestHandler = async () => respond(false);

// This is intentionally anonymous. It is an approximate aggregate rather than
// an anti-abuse or user-tracking mechanism.
export const POST: RequestHandler = async () => respond(true);
