<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import moment from 'moment';
	import seedrandom from 'seedrandom';
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
		text: '#121212',
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
		// { title: 'Lost The Breakup', slug: 'lost-the-breakup-1' },
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

	// ─── SEED & PICK TRACK ────────────────────────────────────────────────────────
	const todaySeed = moment().format('YYYYMMDD');

	const rng = seedrandom(todaySeed);

	const currentTrack = tracks[Math.floor(rng() * tracks.length)];

	// ─── SEGMENTS ───────────────────────────────────────────────────────────────
	const SEGMENT_INCREMENTS = [2, 1, 2, 3, 4, 5]; // seconds
	let total = 0;
	const segmentDurations = SEGMENT_INCREMENTS.map((inc) => {
		total += inc * 1000;
		return total;
	});
	const TOTAL_MS = segmentDurations.at(-1)!;
	const TOTAL_SECONDS = TOTAL_MS / 1000;
	const maxAttempts = SEGMENT_INCREMENTS.length;
	$: boundaries = segmentDurations.map((ms) => ms / 1000).slice(0, -1);

	// ─── STATE&TIMERS ─────────────────────────────────────────────────────────
	type Info = { status: 'skip' | 'wrong' | 'correct'; title?: string };
	let attemptInfos: Info[] = [];
	let attemptCount = 0;
	let gameOver = false;
	let message = '';

	let iframeElement: HTMLIFrameElement;
	let widget: any;
	let widgetReady = false;
	let loading = true;
	let artworkUrl = '';
	let isPlaying = false;
	let currentPosition = 0;
	let snippetTimeout: ReturnType<typeof setTimeout>;
	let progressInterval: ReturnType<typeof setInterval>;
	let fullDuration = 0;

	let skipInProgress = false;

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

	// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
	let timeLeft = '';
	let countdownInterval: ReturnType<typeof setInterval>;
	function updateTime() {
		const now = new Date();
		const midnight = new Date(now);
		midnight.setHours(24, 0, 0, 0);
		const diff = midnight.getTime() - now.getTime();
		const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
		const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
		const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
		timeLeft = `${h}:${m}:${s}`;
	}

	// ─── FILL%&NEXTSEGMENT ───────────────────────────────────────────────────
	let fillPercent = 0;
	$: {
		const raw = gameOver
			? (currentPosition / fullDuration) * 100
			: (currentPosition / TOTAL_MS) * 100;
		fillPercent = raw > 100 ? 100 : raw;
	}
	$: nextIncrementSec =
		attemptCount < SEGMENT_INCREMENTS.length - 1 ? SEGMENT_INCREMENTS[attemptCount + 1] : 0;

	function formatTime(ms: number) {
		const s = Math.floor(ms / 1000);
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	}

	function startPolling() {
		isPlaying = true;
		skipInProgress = false; // clear guard once new snippet starts
		clearInterval(progressInterval);
		progressInterval = setInterval(() => {
			widget.getPosition((pos: number) => {
				currentPosition = pos;
			});
		}, 100);
	}

	function stopAllTimers() {
		isPlaying = false;
		clearInterval(progressInterval);
		clearTimeout(snippetTimeout);
	}

	// ─── WIDGET SET‑UP ───────────────────────────────────────────────────────────
	onMount(async () => {
		// load SC API if missing
		if (typeof window.SC === 'undefined') {
			await new Promise<void>((resolve, reject) => {
				const tag = document.createElement('script');
				tag.src = 'https://w.soundcloud.com/player/api.js';
				tag.async = true;
				tag.onload = () => resolve();
				tag.onerror = () => reject(new Error('Failed to load SC API'));
				document.head.appendChild(tag);
			});
		}

		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) => (darkMode = e.matches));

		updateTime();
		countdownInterval = setInterval(updateTime, 1000);

		widget = SC.Widget(iframeElement);

		// READY
		widget.bind(SC.Widget.Events.READY, () => {
			widget.getDuration((d: number) => (fullDuration = d));
			widget.getCurrentSound((sound: any) => {
				artworkUrl = sound.artwork_url || '';
			});
			// warm up
			setTimeout(() => {
				widget.play();
				widget.pause();
				widget.seekTo(0);
				loading = false;
				widgetReady = true;
			}, 750);
		});

		// PAUSE
		widget.bind(SC.Widget.Events.PAUSE, () => {
			if (skipInProgress) {
				stopAllTimers(); // clean up polling + timeouts

				playSegment(); // startPolling() in there will clear skipInProgress
				return;
			}

			/* Normal user pause or end‑of‑snippet pause */
			stopAllTimers();
		});

		// FINISH
		widget.bind(SC.Widget.Events.FINISH, stopAllTimers);

		// PLAY_PROGRESS
		widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: { currentPosition: number }) => {
			if (!isPlaying) return;
			const limit = gameOver ? fullDuration : segmentDurations[attemptCount];
			currentPosition = e.currentPosition;
			if (e.currentPosition >= limit) {
				widget.pause(); // will call PAUSE -> stopAllTimers
				currentPosition = limit;
			}
		});
	});

	onDestroy(() => {
		stopAllTimers();
		clearInterval(countdownInterval);
		if (widget?.unbind) Object.values(SC.Widget.Events).forEach((ev) => widget.unbind(ev));
	});

	// ─── GAME ACTIONS ───────────────────────────────────────────────────────────
	function playSegment() {
		if (!widgetReady || loading) return;
		stopAllTimers();
		currentPosition = 0;
		widget.seekTo(0);
		widget.play();
		startPolling();
	}

	function togglePlayPause() {
		if (!widgetReady || loading) return;
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

		if (attemptCount >= maxAttempts) {
			revealAnswer();
			return; // nothing more to do
		}

		if (isPlaying) {
			skipInProgress = true;
			clearTimeout(snippetTimeout);
			widget.pause(); // PAUSE handler will launch the next snippet
		} else {
			stopAllTimers(); // just in case something is still polling
			currentPosition = 0;
			playSegment();
		}
	}

	function submitGuess() {
		if (!widgetReady || gameOver || !userInput) return;
		if (!selectedTrack && suggestions.length) {
			selectedTrack =
				suggestions.find((t) => t.title.toLowerCase() === userInput.toLowerCase()) ||
				suggestions[0];
		}
		if (!selectedTrack) return;

		attemptCount++;
		const ans = currentTrack.title.toLowerCase();
		if (selectedTrack.title.toLowerCase() === ans) {
			attemptInfos = [...attemptInfos, { status: 'correct', title: currentTrack.title }];
			gameOver = true;
			message = `✅ Correct! It was “${currentTrack.title}.” You got it ${
				attemptCount === maxAttempts
					? 'on the last try! Close one!'
					: `in ${attemptCount} ${attemptCount === 1 ? 'try' : 'tries'}.`
			}`;
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
			submitGuess();
		}
	}

	function selectSuggestion(s: Track) {
		selectedTrack = s;
		userInput = s.title;
		suggestions = [];
		inputEl.blur();
	}

	$: suggestions =
		userInput && !selectedTrack
			? tracks.filter((t) => t.title.toLowerCase().includes(userInput.toLowerCase())).slice(0, 5)
			: [];
</script>

<!-- How to Play Modal -->
{#if showHowTo}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/40"></div>
		<div
			class="relative w-4/5 max-w-md rounded-lg p-8 text-center"
			style="
        background: {darkMode ? COLORS.text : COLORS.background};
        color:      {darkMode ? COLORS.background : COLORS.text}
      "
		>
			<h2 class="mb-4 text-2xl font-bold uppercase" style="color: {COLORS.primary}">How to Play</h2>
			<ul class="space-y-4 text-base">
				<li>🎵 Play the snippet.</li>
				<li>🔊 Skips & wrongs unlock more.</li>
				<li>👍 Guess in as few tries as possible!</li>
			</ul>
			<button
				class="mt-6 rounded px-6 py-2 font-semibold"
				style="
          background: {COLORS.primary};
          color:      {darkMode ? COLORS.text : COLORS.background}
        "
				on:click={() => (showHowTo = false)}
			>
				Close
			</button>
		</div>
	</div>
{/if}

<!-- Info Modal -->
{#if showInfo}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/40"></div>
		<div
			class="relative w-4/5 max-w-md space-y-4 rounded-lg p-8"
			style="background:{darkMode ? COLORS.text : COLORS.background}; color:{darkMode
				? COLORS.background
				: COLORS.text}"
		>
			<p class="font-semibold">{ARTIST_NAME} – Test your knowledge!</p>
			<p>All songs used are copyrighted and belong to {ARTIST_NAME}.</p>
			<p>I do not, and never will, collect any of your personal data.</p>

			<hr class="my-4" style="border-color:{darkMode ? COLORS.background : COLORS.text}" />

			<p class="text-xs" style="color:{COLORS.accent}">
				Prepared with SoundCloud, Svelte, Tailwind CSS, Inter font, svelte-hero-icons, and moment.js<br
				/>
				Game version: 3.1.0
			</p>

			<!-- Added links -->
			<p class="text-xs">
				<a
					href="https://github.com/SoPat712/maisie-heardle"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-{COLORS.primary}"
				>
					View Source on GitHub
				</a>
			</p>
			<p class="text-xs">
				<a
					href="https://joshpatra.me/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-{COLORS.primary}"
				>
					My Portfolio
				</a>
			</p>

			<p class="text-sm italic">New track in <strong>{timeLeft}</strong></p>
			<button
				class="mt-4 rounded px-6 py-2 font-semibold"
				style="background:{COLORS.primary}; color:{darkMode ? COLORS.text : COLORS.background}"
				on:click={() => (showInfo = false)}
			>
				Close
			</button>
		</div>
	</div>
{/if}

<!-- Main UI -->
<div
	class="fixed inset-0 flex flex-col overflow-y-auto"
	style="
    background: {darkMode ? COLORS.text : COLORS.background};
    color:      {darkMode ? COLORS.background : COLORS.text}
  "
>
	<!-- Header -->
	<div class="flex items-center justify-between px-4 pt-4">
		<div class="flex space-x-2">
			<button on:click={() => (showInfo = true)}>
				<Icon src={InformationCircle} class="h-6 w-6" style="color: {COLORS.primary}" />
			</button>
			<button on:click={toggleDark}>
				<Icon src={darkMode ? Sun : Moon} class="h-6 w-6" style="color: {COLORS.primary}" />
			</button>
		</div>
		<h1 class="flex-1 text-center font-serif text-lg font-bold whitespace-nowrap sm:text-3xl">
			Heardle – {ARTIST_NAME}
		</h1>
		<button on:click={() => (showHowTo = true)}>
			<Icon src={QuestionMarkCircle} class="h-6 w-6" style="color: {COLORS.secondary}" />
		</button>
	</div>

	<hr class="mx-4 my-3" style="border-color: {darkMode ? COLORS.background : COLORS.text}" />

	<!-- Attempts -->
	{#if !gameOver}
		<div class="mb-6 space-y-2 px-4">
			{#each attemptInfos as info}
				<div
					class="flex h-12 items-center rounded border px-3 font-semibold"
					style="
            border-color: {info.status === 'skip'
						? COLORS.primary
						: info.status === 'wrong'
							? COLORS.accent
							: COLORS.secondary};
            color: {info.status === 'skip'
						? COLORS.primary
						: info.status === 'wrong'
							? COLORS.accent
							: COLORS.secondary}
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
	{/if}

	<!-- Win/Lose Card -->
	{#if gameOver}
		<div class="mb-6 px-4">
			<a
				href={`https://song.link/${currentTrack.url}`}
				target="_blank"
				rel="noopener"
				class={`flex items-center overflow-hidden rounded-lg border-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
				style="border-color: {COLORS.primary}"
			>
				{#if artworkUrl}
					<img
						src={artworkUrl.replace('-large', '-t500x500')}
						alt="{currentTrack.title} cover"
						class="h-16 w-16 flex-shrink-0 object-cover"
					/>
				{/if}
				<div class="px-4 py-2">
					<div class="font-semibold" style="color: {COLORS.primary}">{currentTrack.title}</div>
					<div class="text-sm" style="color: {COLORS.accent}">{ARTIST_NAME}</div>
				</div>
			</a>
			<p class="mt-4 text-center font-medium">{message}</p>
		</div>
	{/if}

	<!-- Invisible iframe for mobile autoplay -->
	<iframe
		bind:this={iframeElement}
		src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.url)}`}
		style="position:absolute; width:0; height:0; border:0; overflow:hidden; visibility:hidden;"
		allow="autoplay"
		title="preview player"
	></iframe>

	<!-- Bottom‑pinned controls -->
	<div class="mt-auto px-4 pb-4">
		<!-- Progress bar -->
		<div
			class="relative mb-2 w-full overflow-hidden rounded border"
			style="height:1.25rem; border-color: {darkMode ? COLORS.background : COLORS.text}"
		>
			<div
				class="absolute top-0 left-0 h-full transition-[width] duration-100"
				style="width: {fillPercent}%; background: {COLORS.accent}"
			></div>
			{#if !gameOver}
				{#each boundaries as b}
					<div
						class="absolute top-0 bottom-0"
						style="left: {(b / TOTAL_SECONDS) * 100}%; border-left:1px solid {darkMode
							? COLORS.background
							: COLORS.text}"
					></div>
				{/each}
			{/if}
		</div>
		<div class="mb-4 flex justify-between text-xs">
			<span>{formatTime(currentPosition)}</span>
			<span>{formatTime(gameOver ? fullDuration : TOTAL_MS)}</span>
		</div>

		<!-- Play/Pause -->
		<div class="mb-4 flex justify-center">
			<button
				on:click={togglePlayPause}
				class="flex h-16 w-16 items-center justify-center rounded-full border-2 disabled:opacity-50"
				style="border-color: {loading ? '#888888' : COLORS.accent}"
				disabled={loading}
			>
				<Icon
					src={isPlaying ? Pause : Play}
					class="h-8 w-8"
					style="color: {loading ? '#888888' : COLORS.accent}"
				/>
			</button>
		</div>

		<!-- Guess & Skip/Submit -->
		{#if !gameOver}
			<div class="relative mb-4 overflow-visible">
				<input
					bind:this={inputEl}
					type="text"
					placeholder="Type song title…"
					bind:value={userInput}
					on:keydown={onInputKeydown}
					on:focus={() => (selectedTrack = null)}
					class="w-full rounded border px-3 py-2"
					style="border-color: {COLORS.primary}; background: {darkMode
						? COLORS.text
						: COLORS.background}; color: {darkMode ? COLORS.background : COLORS.text}"
				/>
				{#if suggestions.length}
					<ul
						class="absolute bottom-full left-0 z-10 mb-1 max-h-36 w-full overflow-y-auto rounded border"
						style="border-color: {darkMode ? COLORS.background : COLORS.text}; background: {darkMode
							? COLORS.text
							: COLORS.background}"
					>
						{#each suggestions as s}
							<li>
								<button
									type="button"
									class="w-full px-3 py-2 text-left"
									style="color: {darkMode ? COLORS.background : COLORS.text}"
									on:click={() => selectSuggestion(s)}
								>
									{s.title} – <span style="opacity:0.7">{s.artist}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<div class="flex justify-between">
				<button
					on:click={skipIntro}
					class="rounded px-4 py-2 font-semibold"
					style="background: {COLORS.primary}; color: {COLORS.background}"
				>
					{#if nextIncrementSec > 0}Skip (+{nextIncrementSec}s){:else}I don't know it{/if}
				</button>
				<button
					on:click={submitGuess}
					class="rounded px-4 py-2 font-semibold"
					style="background: {COLORS.secondary}; color: {COLORS.background}"
					disabled={!userInput}
				>
					Submit
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Tailwind in app.css handles spacing/layout */
</style>
