import { json, type RequestHandler } from '@sveltejs/kit';

const SOUNDCLOUD_OEMBED_URL = 'https://soundcloud.com/oembed';
const ALLOWED_HOSTS = new Set(['soundcloud.com', 'www.soundcloud.com']);

export const GET: RequestHandler = async ({ fetch, url }) => {
	const trackUrl = url.searchParams.get('url');

	if (!trackUrl) {
		return json({ error: 'Missing SoundCloud URL.' }, { status: 400 });
	}

	try {
		const parsedUrl = new URL(trackUrl);
		if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
			return json({ error: 'Only SoundCloud URLs are supported.' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Invalid SoundCloud URL.' }, { status: 400 });
	}

	const oembedUrl = new URL(SOUNDCLOUD_OEMBED_URL);
	oembedUrl.searchParams.set('format', 'json');
	oembedUrl.searchParams.set('url', trackUrl);

	const response = await fetch(oembedUrl);

	if (!response.ok) {
		return json({ error: 'SoundCloud metadata was unavailable.' }, { status: response.status });
	}

	const data = (await response.json()) as {
		author_name?: string;
		provider_url?: string;
		thumbnail_url?: string;
		title?: string;
	};

	return json(
		{
			authorName: data.author_name ?? '',
			providerUrl: data.provider_url ?? '',
			thumbnailUrl: data.thumbnail_url ?? '',
			title: data.title ?? ''
		},
		{
			headers: {
				'cache-control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		}
	);
};
