import seedrandom from 'seedrandom';

export const ARTIST_NAME = 'Maisie Peters';
export const SC_USER = 'maisie-peters';

export type TrackData = {
	title: string;
	slug: string;
};

export type Track = TrackData & {
	artist: string;
	url: string;
};

export const TRACKS_DATA: TrackData[] = [
	{ title: 'Mary Janes', slug: 'mary-janes' },
	{ title: 'Audrey Hepburn', slug: 'audrey-hepburn' },
	{ title: 'Say My Name In Your Sleep', slug: 'say-my-name-in-your-sleep' },
	{ title: 'Old Fashioned', slug: 'old-fashioned' },
	{ title: 'Houses', slug: 'houses' },
	{ title: 'Kingmaker (with Julia Michaels)', slug: 'kingmaker-with-julia-michaels' },
	{ title: 'Vampire Time', slug: 'vampire-time' },
	{ title: 'My Regards', slug: 'my-regards' },
	{ title: 'You You You', slug: 'you-you-you' },
	{ title: 'If You Let Me (with Marcus Mumford)', slug: 'if-you-let-me-with-marcus' },
	{ title: 'Flat Earther', slug: 'flat-earther' },
	{ title: 'Questions', slug: 'questions' },
	{ title: 'Girl’s Just Flying', slug: 'girls-just-flying' },
	{ title: 'You Then Me Now', slug: 'you-then-me-now' },
	{ title: 'Nothing Like Being In Love', slug: 'nothing-like-being-in-love' },
	{ title: 'Holy Revival', slug: 'holy-revival' },
	{ title: 'The Song', slug: 'the-song' },
	{ title: 'Guy On A Horse', slug: 'guy-on-a-horse' },
	{ title: 'The Last One', slug: 'the-last-one' },
	{ title: 'Yoko', slug: 'yoko' },
	{ title: 'Truth Is', slug: 'truth-is' },
	{ title: 'The Band And I', slug: 'the-band-and-i' },
	{ title: 'There It Goes', slug: 'there-it-goes' },
	{ title: 'Watch', slug: 'watch' },
	{ title: 'History Of Man', slug: 'history-of-man' },
	{ title: 'You’re Just A Boy (And I’m Kinda The Man)', slug: 'youre-just-a-boy-and-im-kinda' },
	{ title: 'The Good Witch', slug: 'the-good-witch' },
	{ title: 'Want You Back', slug: 'want-you-back' },
	{ title: 'BSC', slug: 'bsc' },
	{ title: 'Run', slug: 'run' },
	{ title: 'Wendy', slug: 'wendy' },
	{ title: 'Coming Of Age', slug: 'coming-of-age' },
	{ title: 'Therapy', slug: 'therapy' },
	{ title: 'Two Weeks Ago', slug: 'two-weeks-ago' },
	{ title: 'Lost The Breakup', slug: 'lost-the-breakup' },
	{ title: 'Body Better', slug: 'body-better' },
	{ title: 'Together This Christmas', slug: 'together-this-christmas' },
	{ title: 'Not Another Rockstar', slug: 'not-another-rockstar' },
	{ title: 'Good Enough', slug: 'good-enough' },
	{ title: 'Blonde', slug: 'blonde' },
	{ title: 'Cate’s Brother', slug: 'cates-brother' },
	{ title: 'I’m Trying (Not Friends)', slug: 'im-trying-not-friends' },
	{ title: 'Villain', slug: 'villain' },
	{ title: 'Elvis Song', slug: 'elvis-song' },
	{ title: 'Talking To Strangers', slug: 'talking-to-strangers' },
	{ title: 'Love Him I Don’t', slug: 'love-him-i-dont' },
	{ title: 'Outdoor Pool', slug: 'outdoor-pool' },
	{ title: 'Boy', slug: 'boy' },
	{ title: 'Hollow', slug: 'hollow' },
	{ title: 'Tough Act', slug: 'tough-act' },
	{ title: 'Volcano', slug: 'volcano' },
	{ title: 'Brooklyn', slug: 'brooklyn' },
	{ title: 'You Signed Up For This', slug: 'you-signed-up-for-this' },
	{ title: 'Psycho', slug: 'psycho' },
	{ title: 'The Party', slug: 'the-party' },
	{ title: 'Lunar Years', slug: 'lunar-years' },
	{ title: 'Happy Hunting Ground (feat. Griff)', slug: 'happy-hunting-ground-feat' },
	{ title: 'Helicopter', slug: 'helicopter' },
	{ title: 'Milhouse', slug: 'milhouse' },
	{ title: 'Glowing Review', slug: 'glowing-review' },
	{ title: 'Neck Of The Woods', slug: 'neck-of-the-woods' },
	{ title: 'Funeral (feat. James Bay)', slug: 'funeral-feat-james-bay' },
	{ title: 'John Hughes Movie', slug: 'john-hughes' },
	{ title: "Maybe Don't (feat. JP Saxe)", slug: 'maybe-dont-feat-jp-saxe' },
	{ title: 'Sad Girl Summer', slug: 'sad-girl-summer' },
	{ title: 'The List', slug: 'the-list' },
	{ title: 'Daydreams', slug: 'daydreams' },
	{ title: 'Look At Me Now', slug: 'look-at-me-now-1' },
	{ title: 'Take Care Of Yourself', slug: 'take-care-of-yourself-1' },
	{ title: 'Personal Best', slug: 'personal-best-1' },
	{ title: 'April Showers', slug: 'april-showers' },
	{ title: 'Adore You', slug: 'adore-you' },
	{ title: 'This Is On You', slug: 'this-is-on-you-1' },
	{ title: 'This Is On You', slug: 'this-is-on-you' },
	{ title: 'Favourite Ex', slug: 'favourite-ex' },
	{ title: 'Stay Young', slug: 'stay-young' },
	{ title: 'Enough For You', slug: 'enough-for-you' },
	{ title: 'You To You', slug: 'you-to-you' },
	{ title: 'Architecture', slug: 'architecture-1' },
	{ title: 'Feels Like This', slug: 'feels-like-this' },
	{ title: 'Details', slug: 'details' },
	{ title: 'In My Head', slug: 'in-my-head' },
	{ title: "Best I'll Ever Sing", slug: 'best-ill-ever-sing-1' },
	{ title: 'Worst of You', slug: 'worst-of-you' }
];

const scheduledTracks: Track[] = TRACKS_DATA.map(({ title, slug }) => ({
	title,
	slug,
	artist: ARTIST_NAME,
	url: `https://soundcloud.com/${SC_USER}/${slug}`
}));

// Keep duplicate SoundCloud uploads in the established daily rotation so a
// catalog cleanup cannot change a live answer, but show each answer only once
// in the guess list.
export const tracks: Track[] = Array.from(
	new Map(scheduledTracks.map((track) => [normalizeTrackTitle(track.title), track])).values()
);

export function getLocalDateKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getDailyTrack(dateKey = getLocalDateKey()) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
	if (!match) throw new Error(`Invalid date key: ${dateKey}`);

	const [, year, month, day] = match;
	const dayNumber = Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000);
	const cycle = Math.floor(dayNumber / scheduledTracks.length);
	const position =
		((dayNumber % scheduledTracks.length) + scheduledTracks.length) % scheduledTracks.length;
	const shuffled = scheduledTracks.map((_, index) => index);
	const rng = seedrandom(`maisie-heardle:${cycle}`);

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(rng() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}

	return scheduledTracks[shuffled[position]];
}

export function normalizeTrackTitle(title: string) {
	return title
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[’‘]/g, "'")
		.replace(/[^a-z0-9]+/gi, ' ')
		.trim()
		.toLowerCase();
}
