<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import moment from 'moment';
	import {
		Icon,
		Play,
		Pause,
		InformationCircle,
		QuestionMarkCircle,
		Sun,
		Moon
	} from 'svelte-hero-icons';
	declare const SC: any;

	// ─── CONFIG & THEME ───────────────────────────────────────────────────────────
	const ARTIST_NAME = 'Maisie Peters';
	const SC_USER = 'maisie-peters';

	const COLORS = {
		background: '#ffffff',
		text: '#050315',
		primary: '#83D4FD',
		secondary: '#F484C1',
		accent: '#F0440E'
	};

	// ─── TRACK LIST ───────────────────────────────────────────────────────────────
	type TrackData = { title: string; slug: string };
	const TRACKS_DATA: TrackData[] = [
		{ title: 'Holy Revival', slug: 'holy-revival' },
		{ title: 'The Song', slug: 'the-song' },
		{ title: 'Guy On A Horse', slug: 'guy-on-a-horse' },
		{ title: 'The Last One', slug: 'the-last-one' },
		{ title: 'Yoko', slug: 'yoko' },
		{ title: 'Truth Is', slug: 'truth-is' },
		// { title: "There It Goes (Acoustic)", slug: "there-it-goes-acoustic" },
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
		// { title: "Lost The Breakup (Acoustic)", slug: "lost-the-breakup-acoustic" },
		// { title: "Lost The Breakup (The Wild Remix)", slug: "lost-the-breakup-the-wild" },
		{ title: 'Two Weeks Ago', slug: 'two-weeks-ago' },
		{ title: 'Lost The Breakup', slug: 'lost-the-breakup' },
		{ title: 'Lost The Breakup', slug: 'lost-the-breakup-1' },
		// { title: "Body Better (Acapella)", slug: "body-better-acapella-acapella" },
		// { title: "Body Better (Acoustic)", slug: "body-better-acoustic-acoustic" },
		{ title: 'Body Better', slug: 'body-better' },
		{ title: 'Together This Christmas', slug: 'together-this-christmas' },
		{ title: 'Not Another Rockstar', slug: 'not-another-rockstar' },
		{ title: 'Good Enough', slug: 'good-enough' },
		{ title: 'Blonde', slug: 'blonde' },
		// { title: "Cate’s Brother (BRELAND's Version)", slug: "cates-brother-brelands-version" },
		// { title: "Cate’s Brother (Matt's Version)", slug: "cates-brother-matts-version" },
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
		// { title: "Psycho (Danny L Harle Remix)", slug: "psycho-danny-l-harle-remix" },
		// { title: "Psycho (Acoustic)", slug: "psycho-acoustic" },
		// { title: "Psycho (Joel Corry Remix)", slug: "psycho-joel-corry-remix" },
		{ title: 'Psycho', slug: 'psycho' },
		{ title: 'The Party', slug: 'the-party' },
		{ title: 'Lunar Years', slug: 'lunar-years' },
		{ title: 'Happy Hunting Ground (feat. Griff)', slug: 'happy-hunting-ground-feat' },
		{ title: 'Helicopter', slug: 'helicopter' },
		{ title: 'Milhouse', slug: 'milhouse' },
		{ title: 'Glowing Review', slug: 'glowing-review' },
		// { title: "I Want You To Change (Because You Want To Change) [feat. Bear's Den]", slug: "i-want-you-to-change-because" },
		{ title: 'Neck Of The Woods', slug: 'neck-of-the-woods' },
		{ title: 'Funeral (feat. James Bay)', slug: 'funeral-feat-james-bay' },
		// { title: "John Hughes Movie (Acoustic)", slug: "john-hughes-movie-acoustic" },
		// { title: "John Hughes Movie (Oliver Nelson Remix)", slug: "john-hughes-movie-oliver" },
		{ title: 'John Hughes Movie', slug: 'john-hughes' },
		// { title: "Maybe Don't (feat. JP Saxe) [Acoustic]", slug: "maybe-dont-feat-jp-saxe-1" },
		// { title: "Maybe Don't (feat. JP Saxe) [MOTi Remix]", slug: "maybe-dont-feat-jp-saxe-moti" },
		// { title: "Maybe Don't (feat. JP Saxe) [HONNE Remix]", slug: "maybe-dont-feat-jp-saxe-honne" },
		{ title: "Maybe Don't (feat. JP Saxe)", slug: 'maybe-dont-feat-jp-saxe' },
		// { title: "Sad Girl Summer (Cavetown Rework)", slug: "sad-girl-summer-cavetown" },
		// { title: "Sad Girl Summer (emo version)", slug: "sad-girl-summer-emo-version" },
		{ title: 'Sad Girl Summer', slug: 'sad-girl-summer' },
		{ title: 'The List', slug: 'the-list' },
		{ title: 'Daydreams', slug: 'daydreams' },
		// { title: "Take Care of Yourself (Live Acoustic)", slug: "take-care-of-yourself-acoustic" },
		// { title: "Adore You (Breydon Beggs Remix)", slug: "adore-you-breydon-beggs-remix" },
		// { title: "Adore You (Acoustic)", slug: "adore-you-acoustic" },
		// { title: "This Is On You (Acoustic)", slug: "this-is-on-you-acoustic" },
		{ title: 'Look At Me Now', slug: 'look-at-me-now-1' },
		{ title: 'Take Care Of Yourself', slug: 'take-care-of-yourself-1' },
		{ title: 'Personal Best', slug: 'personal-best-1' },
		{ title: 'April Showers', slug: 'april-showers' },
		{ title: 'Adore You', slug: 'adore-you' },
		{ title: 'This Is On You', slug: 'this-is-on-you-1' },
		{ title: 'This Is On You', slug: 'this-is-on-you' },
		{ title: 'Favourite Ex', slug: 'favourite-ex' },
		// { title: "Stay Young (Acoustic)", slug: "stay-young-acoustic" },
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

	type Track = { title: string; artist: string; url: string };
	const tracks: Track[] = TRACKS_DATA.map(({ title, slug }) => ({
		title,
		artist: ARTIST_NAME,
		url: `https://soundcloud.com/${SC_USER}/${slug}`
	}));

	// ─── DAILY‐SEEDED RANDOM TRACK ───────────────────────────────────────────────
	let seed = parseInt(moment().format('YYYYMMDD'), 10);
	function seededRandom() {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	}
	let currentTrack: Track = tracks[Math.floor(seededRandom() * tracks.length)];

	// ─── SEGMENTS ───────────────────────────────────────────────────────────────
	const SEGMENT_INCREMENTS = [2, 1, 2, 3, 4, 5];
	const segmentDurations = SEGMENT_INCREMENTS.reduce<number[]>((acc, inc) => {
		acc.push((acc.at(-1) ?? 0) + inc * 1000);
		return acc;
	}, []);
	const TOTAL_MS = segmentDurations.at(-1)!;
	const TOTAL_SECONDS = TOTAL_MS / 1000;
	const maxAttempts = SEGMENT_INCREMENTS.length;
	$: boundaries = segmentDurations.map((ms) => ms / 1000).slice(0, -1);

	// ─── GAME STATE ─────────────────────────────────────────────────────────────
	type Info = { status: 'skip' | 'wrong' | 'correct'; title?: string };
	let attemptInfos: Info[] = [];
	let attemptCount = 0;
	let gameOver = false;
	let message = '';

	let iframeElement: HTMLIFrameElement;
	let widget: any;
	let widgetReady = false;
	let isPlaying = false;
	let currentPosition = 0;

	let showHowTo = false;
	let showInfo = false;
	let darkMode =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: false;
	let userInput = '';
	let suggestions: Track[] = [];
	let selectedTrack: Track | null = null;
	let inputEl: HTMLInputElement;

	$: suggestions = userInput
		? tracks.filter((t) => t.title.toLowerCase().includes(userInput.toLowerCase())).slice(0, 5)
		: [];

	$: fillPercent = (currentPosition / TOTAL_MS) * 100;
	$: nextIncrementSec =
		attemptCount < SEGMENT_INCREMENTS.length - 1 ? SEGMENT_INCREMENTS[attemptCount + 1] : 0;

	function formatTime(ms: number) {
		const s = Math.floor(ms / 1000);
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	}

	onMount(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', (e) => (darkMode = e.matches));

		widget = SC.Widget(iframeElement);
		widget.bind(SC.Widget.Events.READY, () => (widgetReady = true));

		widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: { currentPosition: number }) => {
			const limit = segmentDurations[attemptCount];
			if (e.currentPosition >= limit) {
				currentPosition = limit;
				widget.pause();
				isPlaying = false;
			} else {
				currentPosition = e.currentPosition;
			}
		});

		widget.bind(SC.Widget.Events.PLAY, () => (isPlaying = true));
		widget.bind(SC.Widget.Events.PAUSE, () => (isPlaying = false));
	});

	onDestroy(() => {
		widget?.unbind && Object.values(SC.Widget.Events).forEach((ev) => widget.unbind(ev));
	});

	function playSegment() {
		if (!widgetReady || gameOver) return;
		widget.seekTo(0);
		widget.play();
	}

	function togglePlayPause() {
		if (!widgetReady || gameOver) return;
		isPlaying ? widget.pause() : playSegment();
	}

	function toggleDark() {
		darkMode = !darkMode;
	}

	function skipIntro() {
		if (!widgetReady || gameOver) return;
		attemptInfos = [...attemptInfos, { status: 'skip' }];
		attemptCount++;
		userInput = '';
		selectedTrack = null;
		if (attemptCount >= maxAttempts) revealAnswer();
		else playSegment();
	}

	function submitGuess() {
		if (!widgetReady || !selectedTrack || gameOver) return;
		attemptCount++;
		const ans = currentTrack.title.toLowerCase();
		if (selectedTrack.title.toLowerCase() === ans) {
			attemptInfos = [...attemptInfos, { status: 'correct', title: currentTrack.title }];
			gameOver = true;
			message = `✅ Correct! It was “${currentTrack.title}.”`;
			widget.pause();
		} else {
			attemptInfos = [...attemptInfos, { status: 'wrong', title: selectedTrack.title }];
			userInput = '';
			selectedTrack = null;
			if (attemptCount >= maxAttempts) revealAnswer();
		}
	}

	function revealAnswer() {
		gameOver = true;
		message = `❌ Out of tries! It was “${currentTrack.title}.”`;
		widget.pause();
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !gameOver) {
			e.preventDefault();
			if (!selectedTrack && suggestions.length) {
				selectedTrack =
					suggestions.find((t) => t.title.toLowerCase() === userInput.toLowerCase()) ||
					suggestions[0];
			}
			if (selectedTrack) submitGuess();
		}
	}

	function selectSuggestion(s: Track) {
		selectedTrack = s;
		userInput = s.title;
		suggestions = [];
		inputEl.blur();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<!-- How to Play Modal -->
{#if showHowTo}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0" style="background: rgba(0,0,0,0.4)"></div>
		<div
			class="relative w-4/5 max-w-md rounded-lg p-8 text-center"
			style="background: {COLORS.background}"
		>
			<h2
				class="mb-4 text-2xl font-bold uppercase"
				style="color: {COLORS.primary}; font-family: 'Inter', sans-serif"
			>
				How to Play
			</h2>
			<ul class="space-y-4 text-base" style="color: {COLORS.text}">
				<li>🎵 Play the snippet.</li>
				<li>🔊 Skips & wrongs unlock more.</li>
				<li>👍 Guess in as few tries as possible!</li>
			</ul>
			<div class="mt-6 flex justify-center">
				<button
					class="rounded px-6 py-2 font-semibold"
					style="background: {COLORS.primary}; color: {COLORS.background}"
					on:click={() => (showHowTo = false)}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Info Modal -->
{#if showInfo}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0" style="background: rgba(0,0,0,0.4)"></div>
		<div
			class="relative w-4/5 max-w-md space-y-4 rounded-lg p-8"
			style="background: {COLORS.background}; color: {COLORS.text}"
		>
			<p class="text-base font-semibold">
				{ARTIST_NAME} – Test your {ARTIST_NAME} knowledge!
			</p>
			<p class="text-base">
				All songs used are copyrighted and belong to {ARTIST_NAME}.
			</p>
			<hr style="border-color: {COLORS.text}" class="my-4" />
			<p class="text-xs" style="color: {COLORS.accent}">
				Prepared with SoundCloud, Svelte, Tailwind, Inter font,<br />
				svelte‑hero‑icons
			</p>
			<p class="text-xs" style="color: {COLORS.accent}">Game version: 1.0.0</p>
			<div class="mt-4 flex justify-center">
				<button
					class="rounded px-6 py-2 font-semibold"
					style="background: {COLORS.primary}; color: {COLORS.background}"
					on:click={() => (showInfo = false)}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Main UI anchored to viewport -->
<div
	class="fixed inset-0 flex flex-col overflow-hidden"
	style="
    background: {darkMode ? COLORS.text : COLORS.background};
    color:      {darkMode ? COLORS.background : COLORS.text};
    font-family:'Inter', sans-serif
  "
>
	<!-- header -->
	<div class="flex items-center justify-between px-4 pt-4">
		<button on:click={() => (showInfo = true)}>
			<Icon src={InformationCircle} class="h-6 w-6" style="color: {COLORS.primary}" />
		</button>

		<h1 class="flex-1 text-center font-serif text-lg font-bold whitespace-nowrap sm:text-3xl">
			Heardle – {ARTIST_NAME}
		</h1>

		<div class="flex items-center space-x-2">
			<button on:click={toggleDark}>
				<Icon src={darkMode ? Sun : Moon} class="h-6 w-6" style="color: {COLORS.primary}" />
			</button>
			<button on:click={() => (showHowTo = true)}>
				<Icon src={QuestionMarkCircle} class="h-6 w-6" style="color: {COLORS.accent}" />
			</button>
		</div>
	</div>
	<hr class="mx-4 my-3" style="border-color: {darkMode ? COLORS.background : COLORS.text}" />

	<!-- attempts -->
	<div class="mb-6 flex-shrink-0 space-y-2 px-4">
		{#each attemptInfos as info}
			<div
				class="flex h-12 items-center rounded border px-3 font-semibold"
				style="
					border-color:
						{info.status === 'skip'
					? COLORS.primary
					: info.status === 'wrong'
						? COLORS.accent
						: COLORS.secondary};
					color:
						{info.status === 'skip'
					? COLORS.primary
					: info.status === 'wrong'
						? COLORS.accent
						: COLORS.secondary};
				"
			>
				{#if info.status === 'skip'}▢ Skipped
				{:else if info.status === 'wrong'}☒ {info.title}
				{:else}✓ {info.title}{/if}
			</div>
		{/each}
		{#each Array(maxAttempts - attemptInfos.length) as _}
			<div
				class="h-12 rounded border"
				style="border-color: {darkMode ? COLORS.background : COLORS.text}"
			></div>
		{/each}
	</div>

	<iframe
		bind:this={iframeElement}
		class="hidden"
		src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.url)}`}
		allow="autoplay"
		title="preview player"
	></iframe>

	<!-- hollow progress bar -->
	<div class="mb-4 flex-shrink-0 px-4">
		<div
			class="relative w-full overflow-hidden rounded border"
			style="
				height: 1.25rem;
				border-color: {darkMode ? COLORS.background : COLORS.text}
			"
		>
			<div
				class="absolute top-0 left-0 h-full"
				style="
					width: {fillPercent}%;
					background: {COLORS.primary};
					transition: width 0.1s;
				"
			></div>
			{#each boundaries as b}
				<div
					class="absolute top-0 bottom-0"
					style="
						left: {(b / TOTAL_SECONDS) * 100}%;
						border-left: 1px solid {darkMode ? COLORS.background : COLORS.text};
					"
				></div>
			{/each}
		</div>
		<div class="mt-1 flex justify-between text-xs">
			<span>{formatTime(currentPosition)}</span>
			<span>{formatTime(TOTAL_MS)}</span>
		</div>
	</div>

	<!-- play/pause -->
	<div class="mb-4 flex justify-center">
		<button
			on:click={togglePlayPause}
			class="flex h-16 w-16 items-center justify-center rounded-full border-2 disabled:opacity-50"
			style="border-color: {COLORS.primary}"
		>
			<Icon src={isPlaying ? Pause : Play} class="h-8 w-8" style="color: {COLORS.primary}" solid />
		</button>
	</div>

	<!-- guess & skip/submit or final -->
	{#if !gameOver}
		<div class="mb-4 flex-shrink-0 px-4">
			<input
				bind:this={inputEl}
				type="text"
				placeholder="Type song title…"
				bind:value={userInput}
				on:keydown={onInputKeydown}
				class="w-full rounded border px-3 py-2"
				style="
					border-color: {COLORS.primary};
					background:    {darkMode ? COLORS.text : COLORS.background};
					color:         {darkMode ? COLORS.background : COLORS.text};
				"
			/>
			{#if suggestions.length}
				<ul
					class="mt-1 max-h-36 overflow-y-auto rounded border"
					style="
						border-color: {darkMode ? COLORS.background : COLORS.text};
						background:    {darkMode ? COLORS.text : COLORS.background};
					"
				>
					{#each suggestions as s}
						<li>
							<button
								type="button"
								class="w-full px-3 py-2 text-left"
								style="color: {darkMode ? COLORS.background : COLORS.text}"
								on:click={() => selectSuggestion(s)}
							>
								{s.title} – <span style="opacity: 0.7">{s.artist}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div class="mb-6 flex justify-between px-4">
			<button
				on:click={skipIntro}
				class="rounded px-4 py-2 font-semibold"
				style="background: {COLORS.primary}; color: {COLORS.background}"
			>
				{#if nextIncrementSec > 0}
					Skip (+{nextIncrementSec}s)
				{:else}
					I don't know it
				{/if}
			</button>
			<button
				on:click={submitGuess}
				class="rounded px-4 py-2 font-semibold"
				style="background: {COLORS.accent}; color: {COLORS.background}"
				disabled={!selectedTrack}
			>
				Submit
			</button>
		</div>
	{:else}
		<div
			class="mt-6 text-center text-lg"
			style="color: {darkMode ? COLORS.background : COLORS.text}"
		>
			{message}
		</div>
	{/if}
</div>

<style>
	/* Tailwind in app.css handles all spacing/layout */
</style>
