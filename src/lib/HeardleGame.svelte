<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		ArrowPath,
		Icon,
		InformationCircle,
		Moon,
		Pause,
		Play,
		QuestionMarkCircle,
		Share,
		Sun,
		XMark
	} from 'svelte-hero-icons';
	import {
		ARTIST_NAME,
		getDailyTrack,
		getLocalDateKey,
		normalizeTrackTitle,
		tracks,
		type Track
	} from '$lib/tracks';

	const COLORS = {
		background: '#ffffff',
		panel: '#ffffff',
		text: '#171717',
		muted: '#5f6268',
		primary: '#127fb3',
		secondary: '#c43a84',
		accent: '#f15a24',
		success: '#1f8a5b',
		danger: '#c9342f'
	};

	const todayKey = getLocalDateKey();
	const currentTrack = getDailyTrack(todayKey);
	const storageKey = `maisie-heardle:game:${todayKey}:${currentTrack.slug}`;
	const statsKey = 'maisie-heardle:stats:v1';

	const SEGMENT_INCREMENTS = [2, 1, 2, 3, 4, 5];
	let total = 0;
	const segmentDurations = SEGMENT_INCREMENTS.map((increment) => {
		total += increment * 1000;
		return total;
	});
	const TOTAL_MS = segmentDurations.at(-1)!;
	const TOTAL_SECONDS = TOTAL_MS / 1000;
	const maxAttempts = SEGMENT_INCREMENTS.length;
	const VINYL_SPIN_RATE = 0.10285;
	const SEEK_FLICK_TURNS = 3;
	const SEEK_FLICK_DURATION = 850;

	type AttemptInfo = { status: 'skip' | 'wrong' | 'correct'; title?: string };
	type SavedGame = {
		attemptInfos: AttemptInfo[];
		attemptCount: number;
		gameOver: boolean;
		message: string;
		won: boolean;
		statsRecorded: boolean;
	};
	type Stats = {
		played: number;
		wins: number;
		streak: number;
		maxStreak: number;
		distribution: number[];
	};

	let attemptInfos: AttemptInfo[] = [];
	let attemptCount = 0;
	let gameOver = false;
	let message = '';
	let won = false;
	let statsRecorded = false;
	let stats: Stats = {
		played: 0,
		wins: 0,
		streak: 0,
		maxStreak: 0,
		distribution: Array(maxAttempts).fill(0)
	};

	let iframeElement: HTMLIFrameElement;
	let widget: SoundCloudWidget;
	let widgetReady = false;
	let volume = 80;
	let loading = true;
	let widgetError = '';
	let artworkUrl = '';
	let isPlaying = false;
	let currentPosition = 0;
	let progressInterval: ReturnType<typeof setInterval>;
	let fullDuration = 0;
	let vinylElement: HTMLDivElement;
	let vinylRotation = 0;
	let vinylTransform = 'translateZ(0) rotate(0deg)';
	let vinylSpinTransition = 'none';
	let lastFrameTime = 0;
	let animationFrameId: number;
	let seekAnimationFrameId: number | undefined;
	let vinylSeekAnimation: Animation | undefined;
	let isVinylSeekAnimating = false;
	let isSeekDragging = false;
	let seekDragMoved = false;
	let seekStartPosition = 0;
	let seekLastPosition = 0;
	let seekDragStartX = 0;
	let waveformHeights = [4, 4, 4, 4, 4, 4, 4];
	let waveformInterval: ReturnType<typeof setInterval>;

	let isWarmingUp = false;
	let showHowTo = false;
	let showInfo = false;
	let globalGamesPlayed: number | null = null;
	let darkMode = false;
	let userInput = '';
	let suggestions: Track[] = [];
	let selectedTrack: Track | null = null;
	let inputEl: HTMLInputElement;
	let hydrated = false;
	let shareMessage = '';
	let suggestionArtwork: Record<string, string> = {};
	let requestedSuggestionSlugs = '';

	let timeLeft = '';
	let countdownInterval: ReturnType<typeof setInterval>;
	let attemptHistoryEl: HTMLDivElement;
	let attemptPanelEl: HTMLElement;
	let resultPanelEl: HTMLElement;
	let gameGridEl: HTMLDivElement;
	let gameScrollEl: HTMLDivElement;
	let gameBodyEl: HTMLDivElement;
	let playerWrapEl: HTMLDivElement;
	let vinylColEl: HTMLDivElement;
	let layoutObserver: ResizeObserver | undefined;
	let middleScrollable = false;
	let gameScrollFill = false;

	const boundaries = segmentDurations.map((ms) => ms / 1000).slice(0, -1);
	$: activeLimit = gameOver ? fullDuration || TOTAL_MS : segmentDurations[attemptCount] || TOTAL_MS;
	$: progressDuration = gameOver ? fullDuration || TOTAL_MS : TOTAL_MS;
	$: fillPercent = Math.min((currentPosition / progressDuration) * 100, 100);
	$: unlockedSeconds = Math.round((segmentDurations[attemptCount] || TOTAL_MS) / 1000);
	$: nextIncrementSec =
		attemptCount < SEGMENT_INCREMENTS.length - 1 ? SEGMENT_INCREMENTS[attemptCount + 1] : 0;
	$: remainingAttempts = Array.from(
		{ length: Math.max(maxAttempts - attemptInfos.length, 0) },
		(_, index) => attemptInfos.length + index + 1
	);
	$: canSubmit = Boolean(userInput.trim()) && !gameOver && !loading && !widgetError;
	$: resultLabel = won ? `${attemptCount}/${maxAttempts}` : `X/${maxAttempts}`;
	$: suggestions =
		userInput && !selectedTrack
			? tracks
					.filter((track) =>
						normalizeTrackTitle(track.title).includes(normalizeTrackTitle(userInput))
					)
					.slice(0, 6)
			: [];
	$: if (hydrated) {
		void loadSuggestionArtwork(suggestions);
	}
	$: if (hydrated) {
		saveGame({
			attemptInfos,
			attemptCount,
			gameOver,
			message,
			won,
			statsRecorded
		});
	}

	$: if (typeof window !== 'undefined' && !isVinylSeekAnimating && !isSeekDragging) {
		handlePlayStateChange(isPlaying);
	}

	$: if (typeof window !== 'undefined') {
		driveWaveform(isPlaying);
	}

	$: if (hydrated) {
		void updateGameLayout();
	}

	function getFlexGap(el: HTMLElement): number {
		const styles = getComputedStyle(el);
		return Number.parseFloat(styles.rowGap) || Number.parseFloat(styles.gap) || 0;
	}

	function getMiddleScrollBudget(): number {
		if (!gameBodyEl || !playerWrapEl) return 0;
		const gap = getFlexGap(gameBodyEl) || 12;
		return Math.max(0, gameBodyEl.clientHeight - playerWrapEl.offsetHeight - gap);
	}

	function updateMiddleScrollable() {
		if (
			typeof window === 'undefined' ||
			!gameScrollEl ||
			!playerWrapEl ||
			!gameGridEl ||
			!gameBodyEl
		) {
			middleScrollable = false;
			return;
		}

		middleScrollable = gameGridEl.offsetHeight > getMiddleScrollBudget() + 1;
	}

	async function updateGameLayout() {
		await tick();
		updateMiddleScrollable();
		gameScrollFill = middleScrollable;
		if (middleScrollable) {
			await tick();
			updateMiddleScrollable();
			gameScrollFill = middleScrollable;
		}
	}

	onMount(() => {
		darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		stats = loadStats();
		loadSavedGame();
		const savedVol = localStorage.getItem('heardle-volume');
		if (savedVol !== null) {
			volume = parseInt(savedVol);
		}
		hydrated = true;

		const colorPreference = window.matchMedia('(prefers-color-scheme: dark)');
		const onPreferenceChange = (event: MediaQueryListEvent) => (darkMode = event.matches);
		colorPreference.addEventListener('change', onPreferenceChange);

		updateTime();
		countdownInterval = setInterval(updateTime, 1000);
		void initializeWidget();
		void loadDailyTrackArtwork();
		void loadGlobalGamesPlayed();

		if (typeof ResizeObserver !== 'undefined') {
			layoutObserver = new ResizeObserver(() => updateGameLayout());
		}
		const onResize = () => updateGameLayout();
		window.addEventListener('resize', onResize);

		return () => {
			colorPreference.removeEventListener('change', onPreferenceChange);
			layoutObserver?.disconnect();
			window.removeEventListener('resize', onResize);
		};
	});

	$: if (resultPanelEl && layoutObserver) {
		layoutObserver.observe(resultPanelEl);
		updateGameLayout();
	}

	$: if (vinylColEl && layoutObserver) {
		layoutObserver.observe(vinylColEl);
		updateGameLayout();
	}

	$: if (gameBodyEl && gameGridEl && playerWrapEl && layoutObserver) {
		layoutObserver.observe(gameBodyEl);
		layoutObserver.observe(gameGridEl);
		layoutObserver.observe(playerWrapEl);
		if (attemptHistoryEl) layoutObserver.observe(attemptHistoryEl);
		updateGameLayout();
	}

	async function loadGlobalGamesPlayed() {
		try {
			const res = await fetch('/api/stats/games-played');
			if (res.ok) {
				const data = (await res.json()) as { count?: number };
				globalGamesPlayed = data.count ?? 0;
			} else {
				globalGamesPlayed = -1;
			}
		} catch (err) {
			console.error('Failed to load global games played counter:', err);
			globalGamesPlayed = -1;
		}
	}

	async function recordGlobalGameFinish() {
		const countedKey = `maisie-heardle:global-finish-counted:${todayKey}`;
		if (localStorage.getItem(countedKey)) {
			await loadGlobalGamesPlayed();
			return;
		}

		try {
			const res = await fetch('/api/stats/games-played?increment=1');
			if (res.ok) {
				const data = (await res.json()) as { count?: number };
				globalGamesPlayed = data.count ?? 0;
				localStorage.setItem(countedKey, 'true');
			}
		} catch (err) {
			console.error('Failed to record global games played counter:', err);
		}
	}

	async function loadDailyTrackArtwork() {
		try {
			const response = await fetch(
				`/api/soundcloud/oembed?url=${encodeURIComponent(currentTrack.url)}`
			);
			if (response.ok) {
				const data = (await response.json()) as { thumbnailUrl?: string };
				if (data.thumbnailUrl) {
					artworkUrl = data.thumbnailUrl;
				}
			}
		} catch (error) {
			console.error('Failed to load daily track artwork:', error);
		}
	}

	async function initializeWidget() {
		try {
			await loadSoundCloudApi();
			const soundcloud = window.SC;
			if (!soundcloud) throw new Error('SoundCloud player API did not initialize.');

			widget = soundcloud.Widget(iframeElement);
			bindWidgetEvents(soundcloud);
		} catch (error) {
			loading = false;
			widgetError =
				error instanceof Error
					? error.message
					: 'The SoundCloud player could not be loaded. Please try again.';
		}
	}

	onDestroy(() => {
		stopAllTimers();
		clearInterval(countdownInterval);
		cancelVinylSeekAnimation();
		window.removeEventListener('pointermove', handleSeekPointerMoveWindow);
		window.removeEventListener('pointerup', endSeekDrag);
		window.removeEventListener('pointercancel', endSeekDrag);
		window.removeEventListener('mousemove', handleSeekMouseMoveWindow);
		window.removeEventListener('mouseup', endSeekDrag);
		if (widget?.unbind && window.SC?.Widget?.Events) {
			Object.values(window.SC.Widget.Events).forEach((eventName) => widget.unbind(eventName));
		}
		if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(animationFrameId);
		}
		clearInterval(waveformInterval);
	});

	function driveWaveform(playing: boolean) {
		clearInterval(waveformInterval);
		if (playing) {
			// Seed with an initial burst
			waveformHeights = waveformHeights.map(() => 4 + Math.random() * 24);
			waveformInterval = setInterval(() => {
				waveformHeights = waveformHeights.map((prev) => {
					// Organic: weighted blend of previous height + new random target
					const target = 3 + Math.random() * 28;
					const inertia = 0.3 + Math.random() * 0.35;
					return prev * inertia + target * (1 - inertia);
				});
			}, 120);
		} else {
			waveformHeights = [4, 4, 4, 4, 4, 4, 4];
		}
	}

	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseInt(target.value);
		if (typeof window !== 'undefined') {
			localStorage.setItem('heardle-volume', volume.toString());
		}
		if (widget && widget.setVolume) {
			widget.setVolume(volume);
		}
	}

	function handlePlayStateChange(playing: boolean) {
		if (playing) {
			cancelVinylSeekAnimation();
			lastFrameTime = 0;
			vinylSpinTransition = 'none';
			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(spinVinyl);
			return;
		}

		cancelAnimationFrame(animationFrameId);

		if (gameOver) {
			vinylSpinTransition = 'none';
			return;
		}

		const duration = Math.max(800, Math.min(800 + (vinylRotation / 360) * 300, 2500));
		vinylSpinTransition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
		setVinylRotation(0);
	}

	function spinVinyl(timestamp: number) {
		if (!lastFrameTime) lastFrameTime = timestamp;
		const dt = timestamp - lastFrameTime;
		lastFrameTime = timestamp;

		if (isPlaying) {
			setVinylRotation(vinylRotation + VINYL_SPIN_RATE * dt);
			animationFrameId = requestAnimationFrame(spinVinyl);
		}
	}

	function loadSoundCloudApi() {
		if (window.SC) return Promise.resolve();

		return new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(
				'script[src="https://w.soundcloud.com/player/api.js"]'
			);

			if (existing) {
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error('Failed to load SoundCloud.')), {
					once: true
				});
				return;
			}

			const tag = document.createElement('script');
			tag.src = 'https://w.soundcloud.com/player/api.js';
			tag.async = true;
			tag.onload = () => resolve();
			tag.onerror = () => reject(new Error('Failed to load SoundCloud.'));
			document.head.appendChild(tag);
		});
	}

	function bindWidgetEvents(soundcloud: SoundCloudApi) {
		const events = soundcloud.Widget.Events;

		widget.bind(events.READY, () => {
			widget.setVolume(volume);
			widget.getDuration((duration: number) => {
				fullDuration = duration;
			});
			widget.getCurrentSound((sound: { artwork_url?: string }) => {
				if (sound?.artwork_url) {
					artworkUrl = sound.artwork_url;
				}
			});

			isWarmingUp = true;
			setTimeout(() => {
				widget.play();
				setTimeout(() => {
					widget.pause();
					setTimeout(() => {
						widget.seekTo(0);
						loading = false;
						widgetReady = true;
						isPlaying = false;
						currentPosition = 0;
						isWarmingUp = false;
					}, 200);
				}, 300);
			}, 500);
		});

		widget.bind(events.PLAY, () => {
			if (!isWarmingUp && !isPlaying) startPolling();
		});

		widget.bind(events.PAUSE, () => {
			if (isWarmingUp) return;

			if (isPlaying) stopAllTimers();
		});

		widget.bind(events.FINISH, () => {
			stopAllTimers();
			currentPosition = gameOver ? fullDuration : segmentDurations[attemptCount];
		});

		widget.bind(events.PLAY_PROGRESS, (event) => {
			if (!isPlaying || !event) return;
			const limit = gameOver ? fullDuration : segmentDurations[attemptCount];
			currentPosition = event.currentPosition;
			if (event.currentPosition >= limit) {
				widget.pause();
				currentPosition = limit;
			}
		});

		if (events.ERROR) {
			widget.bind(events.ERROR, () => {
				stopAllTimers();
				loading = false;
				widgetError = 'SoundCloud could not play today’s song. Try reloading the page.';
			});
		}
	}

	function updateTime() {
		const now = new Date();
		const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
		const diff = midnight - now.getTime();
		const h = String(Math.floor(diff / 3_600_000)).padStart(2, '0');
		const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0');
		const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0');
		timeLeft = `${h}:${m}:${s}`;
	}

	function formatTime(ms: number) {
		const seconds = Math.floor(ms / 1000);
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function startPolling() {
		isPlaying = true;
		clearInterval(progressInterval);
		progressInterval = setInterval(() => {
			if (!widget) return;
			widget.getPosition((position: number) => {
				currentPosition = position;
			});
		}, 100);
	}

	function stopAllTimers() {
		isPlaying = false;
		clearInterval(progressInterval);
	}

	function ensurePlayState() {
		if (!widget) return;
		widget.isPaused((paused: boolean) => {
			if (!paused && !isPlaying) {
				startPolling();
			} else if (paused && isPlaying) {
				stopAllTimers();
			}
		});
	}

	function playSegment(seekToStart = true) {
		if (!widgetReady || loading || widgetError) return;
		stopAllTimers();
		if (seekToStart) {
			currentPosition = 0;
			widget.seekTo(0);
		}
		widget.play();
		startPolling();
	}

	function togglePlayPause() {
		if (!widgetReady || loading || widgetError) return;
		ensurePlayState();

		if (isPlaying) {
			widget.pause();
		} else {
			playSegment(!gameOver);
		}
	}

	function cancelVinylSeekAnimation() {
		if (seekAnimationFrameId !== undefined) {
			cancelAnimationFrame(seekAnimationFrameId);
			seekAnimationFrameId = undefined;
		}
		vinylSeekAnimation?.cancel();
		vinylSeekAnimation = undefined;
		isVinylSeekAnimating = false;
		vinylSpinTransition = 'none';
	}

	function setVinylRotation(rotation: number) {
		vinylRotation = rotation;
		vinylTransform = `translateZ(0) rotate(${rotation}deg)`;
		if (vinylElement) {
			vinylElement.style.transform = vinylTransform;
		}
	}

	function spinVinylDuringScrub(deltaPosition: number, fallbackDirection = 1) {
		if (Math.abs(deltaPosition) < 16 && Math.abs(fallbackDirection) < 1) return;
		cancelVinylSeekAnimation();

		const direction =
			deltaPosition === 0 ? Math.sign(fallbackDirection) || 1 : Math.sign(deltaPosition);
		const degrees = Math.min(Math.max(Math.abs(deltaPosition) * 0.04, 12), 90);
		setVinylRotation(vinylRotation + direction * degrees);
	}

	function animateVinylSeekToPosition(targetPosition: number, fromPosition: number) {
		const fromRotation = vinylRotation;
		const deltaPosition = targetPosition - fromPosition;
		const direction = deltaPosition === 0 ? 1 : Math.sign(deltaPosition);
		const targetRotation = fromRotation + direction * SEEK_FLICK_TURNS * 360;

		cancelVinylSeekAnimation();
		cancelAnimationFrame(animationFrameId);
		isVinylSeekAnimating = true;
		vinylSpinTransition = 'none';

		if (vinylElement?.animate) {
			vinylSeekAnimation = vinylElement.animate(
				[
					{ transform: `translateZ(0) rotate(${fromRotation}deg)` },
					{ transform: `translateZ(0) rotate(${targetRotation}deg)` }
				],
				{
					duration: SEEK_FLICK_DURATION,
					easing: 'cubic-bezier(0.05, 0.85, 0.18, 1)',
					fill: 'none'
				}
			);

			vinylSeekAnimation.onfinish = () => {
				setVinylRotation(targetRotation);
				vinylSeekAnimation = undefined;
				isVinylSeekAnimating = false;
				if (isPlaying) {
					lastFrameTime = 0;
					animationFrameId = requestAnimationFrame(spinVinyl);
				}
			};
			vinylSeekAnimation.oncancel = () => {
				vinylSeekAnimation = undefined;
			};
			return;
		}

		const startTime = performance.now();

		const step = (timestamp: number) => {
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / SEEK_FLICK_DURATION, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 4);
			setVinylRotation(fromRotation + (targetRotation - fromRotation) * easedProgress);

			if (progress < 1) {
				seekAnimationFrameId = requestAnimationFrame(step);
				return;
			}

			seekAnimationFrameId = undefined;
			isVinylSeekAnimating = false;
			if (isPlaying) {
				lastFrameTime = 0;
				animationFrameId = requestAnimationFrame(spinVinyl);
			}
		};

		seekAnimationFrameId = requestAnimationFrame(step);
	}

	function syncVinylToPosition(position: number, animate: boolean, fromPosition = currentPosition) {
		if (animate) {
			animateVinylSeekToPosition(position, fromPosition);
		} else {
			const deltaPosition = position - fromPosition;
			if (Math.abs(deltaPosition) >= 16) {
				spinVinylDuringScrub(deltaPosition);
			}
		}
	}

	function positionFromSeekEvent(event: MouseEvent | PointerEvent, element: HTMLElement) {
		const bounds = element.getBoundingClientRect();
		const ratio = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
		return ratio * (fullDuration || TOTAL_MS);
	}

	let seekRailEl: HTMLElement | undefined;

	function updateSeekFromPointer(event: PointerEvent | MouseEvent) {
		if (!seekRailEl || !fullDuration) return;
		const nextPosition = positionFromSeekEvent(event, seekRailEl);
		const deltaPosition = nextPosition - seekLastPosition;
		currentPosition = nextPosition;
		spinVinylDuringScrub(deltaPosition, event.movementX);
		seekLastPosition = nextPosition;
	}

	function endSeekDrag(event: PointerEvent | MouseEvent) {
		if (!isSeekDragging || !fullDuration || !seekRailEl) return;

		window.removeEventListener('pointermove', handleSeekPointerMoveWindow);
		window.removeEventListener('pointerup', endSeekDrag);
		window.removeEventListener('pointercancel', endSeekDrag);
		window.removeEventListener('mousemove', handleSeekMouseMoveWindow);
		window.removeEventListener('mouseup', endSeekDrag);

		const nextPosition = positionFromSeekEvent(event, seekRailEl);

		if (seekDragMoved) {
			seekToPosition(nextPosition, { animateVinyl: true });
		} else {
			currentPosition = seekStartPosition;
			seekToPosition(nextPosition, { animateVinyl: true });
		}

		isSeekDragging = false;
		seekRailEl = undefined;
	}

	function handleSeekPointerMoveWindow(event: PointerEvent) {
		if (!isSeekDragging) return;
		if (Math.abs(event.clientX - seekDragStartX) > 2) {
			seekDragMoved = true;
		}
		updateSeekFromPointer(event);
	}

	function handleSeekMouseMoveWindow(event: MouseEvent) {
		if (!isSeekDragging) return;
		if (Math.abs(event.clientX - seekDragStartX) > 2) {
			seekDragMoved = true;
		}
		updateSeekFromPointer(event);
	}

	function handleSeekPointerDown(event: PointerEvent) {
		if (isSeekDragging || !widgetReady || !gameOver || !fullDuration) return;
		event.preventDefault();

		seekRailEl = event.currentTarget as HTMLElement;
		isSeekDragging = true;
		seekDragMoved = false;
		seekDragStartX = event.clientX;
		seekStartPosition = currentPosition;
		seekLastPosition = currentPosition;

		window.addEventListener('pointermove', handleSeekPointerMoveWindow);
		window.addEventListener('pointerup', endSeekDrag);
		window.addEventListener('pointercancel', endSeekDrag);
	}

	function handleSeekMouseDown(event: MouseEvent) {
		if (isSeekDragging || !widgetReady || !gameOver || !fullDuration) return;
		event.preventDefault();

		seekRailEl = event.currentTarget as HTMLElement;
		isSeekDragging = true;
		seekDragMoved = false;
		seekDragStartX = event.clientX;
		seekStartPosition = currentPosition;
		seekLastPosition = currentPosition;

		window.addEventListener('mousemove', handleSeekMouseMoveWindow);
		window.addEventListener('mouseup', endSeekDrag);
	}

	function rewindSong() {
		if (!widgetReady || !gameOver) return;
		const wasPlaying = isPlaying;
		seekToPosition(0);
		if (wasPlaying) setTimeout(() => widget.play(), 150);
	}

	function seekFinishedSong(event: MouseEvent | KeyboardEvent) {
		if (!widgetReady || !gameOver || !fullDuration) return;

		let ratio: number;

		if (event instanceof KeyboardEvent) {
			const step = event.shiftKey ? 10_000 : 5_000;
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				seekToPosition(currentPosition - step);
				return;
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				seekToPosition(currentPosition + step);
				return;
			}
			if (event.key === 'Home') {
				event.preventDefault();
				seekToPosition(0);
				return;
			}
			if (event.key === 'End') {
				event.preventDefault();
				seekToPosition(fullDuration);
				return;
			}
			return;
		}

		const bounds =
			event.currentTarget instanceof HTMLElement
				? event.currentTarget.getBoundingClientRect()
				: null;
		if (!bounds) return;

		ratio = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
		seekToPosition(ratio * fullDuration);
	}

	function seekToPosition(
		position: number,
		options: { animateVinyl?: boolean; seekWidget?: boolean } = {}
	) {
		const { animateVinyl = true, seekWidget = true } = options;
		const duration = fullDuration || TOTAL_MS;
		const nextPosition = Math.min(Math.max(position, 0), duration);
		const wasPlaying = isPlaying;
		const previousPosition = currentPosition;
		currentPosition = nextPosition;

		if (seekWidget) {
			widget.seekTo(nextPosition);
		}

		if (gameOver) {
			syncVinylToPosition(nextPosition, animateVinyl, previousPosition);
		}

		if (wasPlaying) {
			setTimeout(() => widget.play(), 75);
		}
	}

	function skipIntro() {
		if (!widgetReady || gameOver || widgetError) return;

		attemptInfos = [...attemptInfos, { status: 'skip' }];
		attemptCount += 1;
		clearGuess();

		if (attemptCount >= maxAttempts) {
			finishGame(false);
			return;
		}

		if (!isPlaying) {
			currentPosition = 0;
			playSegment(true);
		}
	}

	function submitGuess() {
		if (!canSubmit) return;

		const exactMatch = tracks.find(
			(track) => normalizeTrackTitle(track.title) === normalizeTrackTitle(userInput)
		);
		const guessedTrack = selectedTrack || exactMatch || suggestions[0];
		if (!guessedTrack) return;

		attemptCount += 1;
		if (normalizeTrackTitle(guessedTrack.title) === normalizeTrackTitle(currentTrack.title)) {
			attemptInfos = [...attemptInfos, { status: 'correct', title: currentTrack.title }];
			finishGame(true);
			return;
		}

		attemptInfos = [...attemptInfos, { status: 'wrong', title: guessedTrack.title }];
		clearGuess();

		if (attemptCount >= maxAttempts) {
			finishGame(false);
		} else {
			stopAllTimers();
			widget?.pause();
			currentPosition = 0;
		}
	}

	function finishGame(didWin: boolean) {
		won = didWin;
		gameOver = true;
		message = didWin
			? `Correct. It was “${currentTrack.title}.”`
			: `Out of tries. It was “${currentTrack.title}.”`;
		stopAllTimers();
		widget?.pause();

		if (didWin) {
			currentPosition = 0;
			widget?.seekTo(0);
			syncVinylToPosition(0, false);
		} else {
			currentPosition = fullDuration || segmentDurations[attemptCount - 1] || TOTAL_MS;
			syncVinylToPosition(currentPosition, false);
		}

		if (!statsRecorded) {
			stats = recordStats(didWin, attemptCount);
			statsRecorded = true;
			void recordGlobalGameFinish();
		}
	}

	function clearGuess() {
		userInput = '';
		selectedTrack = null;
		shareMessage = '';
	}

	async function loadSuggestionArtwork(nextSuggestions: Track[]) {
		const slugKey = nextSuggestions.map((track) => track.slug).join('|');
		if (slugKey === requestedSuggestionSlugs) return;
		requestedSuggestionSlugs = slugKey;

		const missing = nextSuggestions.filter((track) => suggestionArtwork[track.slug] === undefined);
		if (!missing.length) return;

		const entries = await Promise.all(
			missing.map(async (track) => {
				try {
					const response = await fetch(
						`/api/soundcloud/oembed?url=${encodeURIComponent(track.url)}`
					);
					if (!response.ok) return [track.slug, ''] as const;
					const data = (await response.json()) as { thumbnailUrl?: string };
					return [track.slug, data.thumbnailUrl ?? ''] as const;
				} catch {
					return [track.slug, ''] as const;
				}
			})
		);

		suggestionArtwork = {
			...suggestionArtwork,
			...Object.fromEntries(entries)
		};
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && canSubmit) {
			event.preventDefault();
			submitGuess();
		}
	}

	function selectSuggestion(track: Track) {
		selectedTrack = track;
		userInput = track.title;
		suggestions = [];
		inputEl.blur();
	}

	async function shareResult() {
		shareMessage = '';
		const text = buildShareText();

		try {
			if (navigator.share) {
				await navigator.share({ text });
				shareMessage = 'Shared.';
				return;
			}

			await navigator.clipboard.writeText(text);
			shareMessage = 'Copied result.';
		} catch {
			shareMessage = 'Could not share from this browser.';
		}
	}

	function buildShareText() {
		const rows = attemptInfos
			.map((attempt) => {
				if (attempt.status === 'correct') return '🟩';
				if (attempt.status === 'wrong') return '🟥';
				return '🟦';
			})
			.join('');

		return `Heardle - ${ARTIST_NAME} ${todayKey} ${resultLabel}\n${rows}\n${window?.location?.origin ?? ''}`;
	}

	function loadSavedGame() {
		try {
			const saved = localStorage.getItem(storageKey);
			if (!saved) return;

			const parsed = JSON.parse(saved) as SavedGame;
			attemptInfos = Array.isArray(parsed.attemptInfos) ? parsed.attemptInfos : [];
			attemptCount = Math.min(Math.max(parsed.attemptCount || 0, 0), maxAttempts);
			gameOver = Boolean(parsed.gameOver);
			message = parsed.message || '';
			won = Boolean(parsed.won);
			statsRecorded = Boolean(parsed.statsRecorded);
		} catch {
			localStorage.removeItem(storageKey);
		}
	}

	function saveGame(game: SavedGame) {
		localStorage.setItem(storageKey, JSON.stringify(game));
	}

	function loadStats(): Stats {
		try {
			const saved = localStorage.getItem(statsKey);
			if (!saved) throw new Error('No stats yet.');
			const parsed = JSON.parse(saved) as Stats;
			return {
				played: parsed.played || 0,
				wins: parsed.wins || 0,
				streak: parsed.streak || 0,
				maxStreak: parsed.maxStreak || 0,
				distribution: Array.from(
					{ length: maxAttempts },
					(_, index) => parsed.distribution?.[index] || 0
				)
			};
		} catch {
			return {
				played: 0,
				wins: 0,
				streak: 0,
				maxStreak: 0,
				distribution: Array(maxAttempts).fill(0)
			};
		}
	}

	function recordStats(didWin: boolean, attempts: number) {
		const nextStats = {
			...stats,
			played: stats.played + 1,
			wins: stats.wins + (didWin ? 1 : 0),
			streak: didWin ? stats.streak + 1 : 0,
			maxStreak: didWin ? Math.max(stats.maxStreak, stats.streak + 1) : stats.maxStreak,
			distribution: [...stats.distribution]
		};

		if (didWin) nextStats.distribution[Math.max(Math.min(attempts - 1, maxAttempts - 1), 0)] += 1;
		localStorage.setItem(statsKey, JSON.stringify(nextStats));
		return nextStats;
	}
</script>

{#if showHowTo}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="how-to-title"
			class="w-full max-w-md rounded-lg border p-6 shadow-2xl"
			style="background: {darkMode ? '#1f1f1f' : COLORS.panel}; color: {darkMode
				? '#fffaf7'
				: COLORS.text}; border-color: {COLORS.primary}"
		>
			<div class="mb-5 flex items-start justify-between gap-4">
				<h2 id="how-to-title" class="text-2xl font-extrabold">How to play</h2>
				<button
					type="button"
					aria-label="Close how to play"
					class="rounded-full p-1 transition hover:scale-105"
					on:click={() => (showHowTo = false)}
				>
					<Icon src={XMark} class="h-6 w-6" />
				</button>
			</div>
			<ol class="space-y-3 text-sm leading-6">
				<li><strong>1.</strong> Press play and identify the song from the unlocked snippet.</li>
				<li><strong>2.</strong> A skip or wrong guess unlocks a longer clip from the start.</li>
				<li><strong>3.</strong> Finish in as few attempts as possible and share your result.</li>
			</ol>
		</div>
	</div>
{/if}

{#if showInfo}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="info-title"
			class="w-full max-w-lg rounded-lg border p-6 shadow-2xl"
			style="background: {darkMode ? '#1f1f1f' : COLORS.panel}; color: {darkMode
				? '#fffaf7'
				: COLORS.text}; border-color: {COLORS.secondary}"
		>
			<div class="mb-5 flex items-start justify-between gap-4">
				<div>
					<p class="text-xs font-bold uppercase" style="color: {COLORS.secondary}">
						Daily artist Heardle
					</p>
					<h2 id="info-title" class="text-2xl font-extrabold">{ARTIST_NAME}</h2>
				</div>
				<button
					type="button"
					aria-label="Close info"
					class="rounded-full p-1 transition hover:scale-105"
					on:click={() => (showInfo = false)}
				>
					<Icon src={XMark} class="h-6 w-6" />
				</button>
			</div>

			<div class="grid grid-cols-3 gap-3 text-center">
				<div class="rounded border p-3" style="border-color: {COLORS.primary}">
					<div class="text-2xl font-extrabold">{stats.played}</div>
					<div class="text-xs uppercase" style="color: {COLORS.muted}">Played</div>
				</div>
				<div class="rounded border p-3" style="border-color: {COLORS.secondary}">
					<div class="text-2xl font-extrabold">
						{stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}%
					</div>
					<div class="text-xs uppercase" style="color: {COLORS.muted}">Wins</div>
				</div>
				<div class="rounded border p-3" style="border-color: {COLORS.accent}">
					<div class="text-2xl font-extrabold">{stats.streak}</div>
					<div class="text-xs uppercase" style="color: {COLORS.muted}">Streak</div>
				</div>
			</div>

			<p class="mt-5 text-sm leading-6">
				Songs belong to {ARTIST_NAME}. This app stores only your local game progress and local stats
				in this browser.
			</p>
			<p class="mt-3 text-sm">
				Next track in <strong>{timeLeft}</strong>
			</p>
			<a
				href="https://github.com/SoPat712/maisie-heardle"
				target="_blank"
				rel="noopener noreferrer"
				class="mt-5 inline-flex text-sm font-semibold underline"
				style="color: {COLORS.primary}"
			>
				View source
			</a>
		</div>
	</div>
{/if}

<main
	class={`heardle-page h-[100dvh] overflow-hidden px-3 py-2 sm:px-6 sm:py-4 md:px-8 ${darkMode ? 'heardle-dark' : ''}`}
>
	<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
		<header class="deck-header flex-shrink-0">
			<div class="flex items-center gap-2">
				<button
					type="button"
					aria-label="Game information and stats"
					title="Info and stats"
					class="deck-icon-button"
					on:click={() => (showInfo = true)}
				>
					<Icon src={InformationCircle} class="h-5 w-5" />
				</button>
				<button
					type="button"
					aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}
					title={darkMode ? 'Light mode' : 'Dark mode'}
					class="deck-icon-button deck-icon-button-alt"
					on:click={() => (darkMode = !darkMode)}
				>
					<Icon src={darkMode ? Sun : Moon} class="h-5 w-5" />
				</button>
			</div>

			<div class="deck-title min-w-0 text-center">
				<p class="deck-kicker">Daily listening test</p>
				<h1 class="truncate text-xl font-extrabold sm:text-2xl">Heardle - {ARTIST_NAME}</h1>
				<p class="text-xs">New song in {timeLeft}</p>
			</div>

			<div class="flex items-center gap-2.5 sm:gap-3.5">
				<div class="flex flex-col items-end text-right leading-none select-none">
					<span
						class="mb-1 text-[8px] font-extrabold tracking-widest text-zinc-500 uppercase sm:text-[9px]"
						>Played</span
					>
					<span
						class="text-sm font-black tracking-tight sm:text-base"
						style="color: {COLORS.primary}"
					>
						{globalGamesPlayed === null
							? '...'
							: globalGamesPlayed < 0
								? '—'
								: globalGamesPlayed.toLocaleString()}
					</span>
				</div>

				<button
					type="button"
					aria-label="How to play"
					title="How to play"
					class="deck-icon-button"
					on:click={() => (showHowTo = true)}
				>
					<Icon src={QuestionMarkCircle} class="h-5 w-5" />
				</button>
			</div>
		</header>

		<div
			bind:this={gameBodyEl}
			class="game-body relative mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:mt-4"
		>
			<iframe
				bind:this={iframeElement}
				src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.url)}&show_artwork=false&visual=false`}
				class="soundcloud-player"
				allow="autoplay"
				title="SoundCloud preview player"
			></iframe>
			<div
				bind:this={gameScrollEl}
				class="game-scroll min-h-0 pr-1"
				class:game-scroll-fill={gameScrollFill}
				class:game-scroll-ended={gameOver}
				class:game-scroll-scrollable={middleScrollable}
			>
				<div
					bind:this={gameGridEl}
					class="game-grid flex min-h-0 flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-x-6 lg:gap-y-4"
				>
					<div class="left-col order-1 flex min-h-0 w-full flex-col lg:col-span-6">
						<section
							bind:this={attemptPanelEl}
							class="attempt-panel min-h-0 w-full"
							class:attempt-panel-game-over={gameOver}
						>
							<p class="status-strip">
								<span class="status-chip">
									{gameOver ? 'Answer revealed' : `${unlockedSeconds}s unlocked`}
								</span>
								<span class="status-note">
									{gameOver ? 'Full playback' : `${maxAttempts - attemptCount} guesses left`}
								</span>
							</p>

							<div
								bind:this={attemptHistoryEl}
								class="attempt-history space-y-1.5 sm:space-y-2"
								aria-label="Guess history"
							>
								{#each attemptInfos as info, index (`${index}-${info.status}-${info.title ?? 'skip'}`)}
									<div
										class="attempt-row attempt-row-filled flex h-8 items-center justify-between rounded px-3 text-xs font-semibold sm:h-10 sm:text-sm md:h-11"
										style="
									--attempt-color: {info.status === 'skip'
											? COLORS.primary
											: info.status === 'wrong'
												? COLORS.danger
												: COLORS.success};
									color: {info.status === 'skip'
											? COLORS.primary
											: info.status === 'wrong'
												? COLORS.danger
												: COLORS.success};
								"
									>
										<span class="truncate pr-4">
											{#if info.status === 'skip'}Skipped
											{:else if info.status === 'wrong'}{info.title}
											{:else}{info.title}{/if}
										</span>
										<span class="flex-shrink-0 text-[10px] uppercase">Try {index + 1}</span>
									</div>
								{/each}
								{#each remainingAttempts as attemptNumber (attemptNumber)}
									<div
										class="attempt-row attempt-row-empty flex h-8 items-center rounded px-3 text-xs sm:h-10 sm:text-sm md:h-11"
									>
										Attempt {attemptNumber}
									</div>
								{/each}
							</div>
						</section>
					</div>

					<!-- Right Column: Spinning Vinyl Player (Desktop only) -->
					<div
						bind:this={vinylColEl}
						class="vinyl-col order-2 hidden min-h-0 w-full flex-col lg:col-span-6 lg:flex"
					>
						<div class="vinyl-turntable-container flex h-full w-full flex-col">
							<div
								class="turntable-base relative flex h-[440px] w-full items-center justify-center rounded-2xl shadow-xl transition-all duration-300 select-none"
								style="
							background: {darkMode ? '#1e1e1e' : '#f7f8f7'};
							border: 1px solid var(--deck-border);
						"
							>
								<!-- Vintage Start/Stop (Play/Pause) Button (top left) -->
								<div
									class="absolute top-6 left-8 z-40 flex flex-col items-center gap-1 select-none"
									style="width: 28px;"
								>
									<span class="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase"
										>Start</span
									>
									<button
										type="button"
										on:click={togglePlayPause}
										disabled={loading || Boolean(widgetError)}
										class="vintage-play-btn flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:outline-none"
										aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
										title={isPlaying ? 'Pause' : 'Play'}
									>
										<div
											class="flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150"
											class:active-btn={isPlaying}
											style="
										background: linear-gradient(180deg, #f3f4f6 0%, #d1d5db 40%, #9ca3af 100%);
										border-color: #9ca3af;
										box-shadow: 0 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6);
									"
										>
											{#if isPlaying}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="#374151"
													class="h-3 w-3"
												>
													<path
														fill-rule="evenodd"
														d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
														clip-rule="evenodd"
													/>
												</svg>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="#374151"
													class="ml-0.5 h-3.5 w-3.5"
												>
													<path
														fill-rule="evenodd"
														d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
														clip-rule="evenodd"
													/>
												</svg>
											{/if}
										</div>
									</button>
								</div>

								<!-- Platter (clickable to toggle play/pause as a fallback) -->
								<button
									type="button"
									on:click={togglePlayPause}
									disabled={loading || Boolean(widgetError)}
									class="platter absolute z-30 flex h-[400px] w-[400px] cursor-pointer items-center justify-center rounded-full border focus:outline-none"
									style="
								left: 40px;
								top: 20px;
								background: #0d5b84;
								box-shadow: inset 0 4px 10px rgba(0,0,0,0.35), 0 1px 3px rgba(255,255,255,0.08);
								border-color: {darkMode ? '#27272a' : '#3f3f46'};
							"
									title={isPlaying ? 'Pause' : 'Play'}
								>
									<!-- Vinyl record wrapper -->
									<div
										class="relative flex h-[360px] w-[360px] items-center justify-center overflow-hidden rounded-full"
									>
										<!-- Vinyl record (spins) -->
										<div
											bind:this={vinylElement}
											class="vinyl-record absolute inset-0 flex items-center justify-center rounded-full shadow-lg"
											style="transform: {vinylTransform}; transition: {vinylSpinTransition};"
										>
											<!-- Track separators (wider gaps) -->
											<div
												class="pointer-events-none absolute inset-[36px] rounded-full border border-black/30"
											></div>
											<div
												class="pointer-events-none absolute inset-[72px] rounded-full border border-black/30"
											></div>
											<div
												class="pointer-events-none absolute inset-[108px] rounded-full border border-black/30"
											></div>

											<!-- Vinyl Center Label (spins with record) -->
											<div
												class="vinyl-label absolute top-1/2 left-1/2 z-10 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-black/25"
												style="background: linear-gradient(135deg, {COLORS.primary}, {COLORS.secondary});"
											>
												{#if gameOver && artworkUrl}
													<img
														src={artworkUrl.replace('-large', '-t500x500')}
														alt="Artwork"
														class="h-full w-full object-cover"
													/>
												{:else}
													<div
														class="absolute inset-0 flex flex-col items-center justify-between py-6 text-center text-white uppercase select-none"
													>
														<span class="mt-1.5 text-[17px] font-black tracking-[0.25em]"
															>Heardle</span
														>
														<span class="mb-1 text-[8px] font-bold tracking-[0.3em] opacity-80"
															>Maisie Peters</span
														>
													</div>
												{/if}
											</div>
										</div>

										<!-- Stationary light reflection overlay (sheen stays still) -->
										<div
											class="vinyl-sheen pointer-events-none absolute inset-0 z-20 rounded-full"
										></div>
									</div>

									<!-- Spindle center peg (STATIONARY in center of platter) -->
									<div
										class="absolute top-1/2 left-1/2 z-30 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-md"
										style="
									background: {darkMode ? '#27272a' : '#d4d4d8'};
									border-color: {darkMode ? '#3f3f46' : '#a1a1aa'};
								"
									>
										<!-- Small center peg tip -->
										<div class="h-1.5 w-1.5 rounded-full bg-zinc-900"></div>
									</div>
								</button>

								<!-- Tonearm (S-shaped arm with pivot at 445,70 on a 480x440 canvas) -->
								<div class="tonearm pointer-events-none absolute inset-0 z-40 h-full w-full">
									<svg
										viewBox="0 0 480 440"
										class="h-full w-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
									>
										<defs>
											<!-- Metallic linear gradient for the chrome tonearm -->
											<linearGradient id="chrome-grad" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" stop-color="#f3f4f6" />
												<stop offset="30%" stop-color="#9ca3af" />
												<stop offset="50%" stop-color="#ffffff" />
												<stop offset="70%" stop-color="#4b5563" />
												<stop offset="100%" stop-color="#e5e7eb" />
											</linearGradient>
											<!-- Darker metallic for pivot and weight -->
											<linearGradient id="dark-metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
												<stop offset="0%" stop-color="#71717a" />
												<stop offset="50%" stop-color="#3f3f46" />
												<stop offset="100%" stop-color="#18181b" />
											</linearGradient>
										</defs>

										<!-- 1. Tonearm base / Rest cradle (STATIONARY) -->
										<!-- Gimbal base -->
										<circle
											cx="445"
											cy="70"
											r="22"
											fill="url(#dark-metal-grad)"
											stroke="#111"
											stroke-width="2"
										/>
										<circle cx="445" cy="70" r="14" fill="#18181b" stroke="#333" stroke-width="1" />
										<!-- Arm Rest structure -->
										<!-- Post -->
										<line
											x1="452"
											y1="200"
											x2="452"
											y2="225"
											stroke="#4b5563"
											stroke-width="3"
											stroke-linecap="round"
										/>
										<!-- U-clip cradle -->
										<path
											d="M 444 200 Q 452 206 460 200"
											fill="none"
											stroke="#4b5563"
											stroke-width="2.5"
											stroke-linecap="round"
										/>

										<!-- 2. Rotating Tonearm Assembly -->
										<g
											style="transform: rotate({isPlaying
												? '22deg'
												: '0deg'}); transform-origin: 445px 70px; transition: transform 750ms cubic-bezier(0.25, 1, 0.5, 1);"
										>
											<!-- Counterweight shaft (extends behind pivot) -->
											<line
												x1="445"
												y1="70"
												x2="440"
												y2="30"
												stroke="#9ca3af"
												stroke-width="4.5"
												stroke-linecap="round"
											/>
											<!-- Counterweight dial ring -->
											<rect
												x="430"
												y="24"
												width="20"
												height="12"
												rx="2"
												fill="url(#dark-metal-grad)"
												stroke="#111"
												stroke-width="1.5"
											/>
											<!-- Counterweight weight block -->
											<rect
												x="432"
												y="16"
												width="16"
												height="8"
												rx="1"
												fill="#09090b"
												stroke="#333"
												stroke-width="1"
											/>

											<!-- Metallic 2-segment straight Tonearm tube -->
											<path
												d="M 445 70 L 456 180 L 445 235"
												stroke="url(#chrome-grad)"
												stroke-width="3.5"
												fill="none"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>

											<!-- Cartridge collar connector -->
											<circle
												cx="445"
												cy="235"
												r="3.5"
												fill="#3f3f46"
												stroke="#111"
												stroke-width="0.5"
											/>

											<!-- Headshell (Classic Technics style angled cartridge) -->
											<!-- Headshell body -->
											<path
												d="M 443 235 L 448 235 L 441 257 L 435 255 Z"
												fill="#1f2937"
												stroke="#111"
												stroke-width="0.75"
											/>
											<!-- Finger lift (curving to the right) -->
											<path
												d="M 447 241 C 454 241, 456 245, 455 249"
												fill="none"
												stroke="#9ca3af"
												stroke-width="1"
												stroke-linecap="round"
											/>
											<!-- Stylus body (orange accent cartridge tip) -->
											<polygon
												points="435,255 441,257 439,261 435,260"
												fill={COLORS.accent}
												stroke="#111"
												stroke-width="0.5"
											/>
											<!-- Tiny metallic stylus tip/needle -->
											<line x1="435" y1="260" x2="433" y2="262" stroke="#d1d5db" stroke-width="1" />
										</g>
									</svg>
								</div>

								<!-- Dynamic Island Waveform (bottom right) -->
								<div
									class="pointer-events-none absolute right-8 bottom-6 z-40 flex h-10 w-24 items-center justify-center gap-1.5 select-none"
								>
									{#each waveformHeights as h, i (i)}
										<div
											class="waveform-bar rounded-full"
											style="
										background: {COLORS.accent};
										width: 5px;
										height: {h}px;
										transition: height 130ms ease-out;
									"
										></div>
									{/each}
								</div>

								<!-- Vintage Volume Fader (bottom left, vertical) -->
								<div
									class="absolute bottom-6 left-8 z-40 flex flex-col items-center gap-1 select-none"
									style="width: 28px;"
								>
									<span class="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase"
										>Vol</span
									>
									<div class="relative flex h-20 w-8 items-center justify-center">
										<input
											type="range"
											min="0"
											max="100"
											step="1"
											value={volume}
											on:input={handleVolumeChange}
											disabled={loading || Boolean(widgetError)}
											class="vintage-slider cursor-pointer"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{#if gameOver}
				<div bind:this={playerWrapEl} class="end-game-dock flex-shrink-0">
					<section
						bind:this={resultPanelEl}
						class="result-panel dock-result rounded p-3 sm:p-4"
						style="--result-color: {won ? COLORS.success : COLORS.danger}"
					>
						<div class="flex gap-3 sm:gap-4">
							{#if artworkUrl}
								<img
									src={artworkUrl.replace('-large', '-t500x500')}
									alt="{currentTrack.title} cover"
									class="dock-result-art h-14 w-14 flex-shrink-0 rounded object-cover shadow-md sm:h-16 sm:w-16 lg:h-20 lg:w-20"
								/>
							{/if}
							<div class="min-w-0 flex-1">
								<p
									class="text-xs font-bold uppercase"
									style="color: {won ? COLORS.success : COLORS.danger}"
								>
									{won ? 'Solved' : 'Revealed'}
									{resultLabel}
								</p>
								<h2 class="truncate text-base font-extrabold sm:text-lg lg:text-xl">
									{currentTrack.title}
								</h2>
								<p
									class="line-clamp-2 text-xs sm:text-sm"
									style="color: {darkMode ? '#cfc7c1' : COLORS.muted}"
								>
									{message}
								</p>
								<a
									href={`https://song.link/${currentTrack.url}`}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-1 inline-flex text-xs font-semibold underline sm:text-sm"
									style="color: {COLORS.primary}"
								>
									Open song links
								</a>
							</div>
						</div>

						<div class="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
							<button
								type="button"
								class="share-button inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95 sm:px-4 sm:py-2 sm:text-sm"
								on:click={shareResult}
							>
								<Icon src={Share} class="h-4 w-4 sm:h-5 sm:w-5" />
								Share result
							</button>
							{#if shareMessage}
								<span class="text-xs font-medium sm:text-sm" aria-live="polite">{shareMessage}</span
								>
							{/if}
						</div>
					</section>

					<section class="control-deck dock-controls">
						{#if widgetError}
							<div
								class="mb-3 rounded border p-3 text-xs sm:text-sm"
								role="alert"
								style="border-color: {COLORS.danger}; color: {COLORS.danger}; background: {darkMode
									? '#2b1717'
									: '#fff1ef'}"
							>
								{widgetError}
							</div>
						{/if}

						<div
							class="progress-rail relative mb-1.5 h-5 w-full overflow-hidden rounded sm:mb-2 sm:h-7"
							aria-label="Audio progress"
						>
							<div
								class="absolute top-0 left-0 h-full transition-[width] duration-100"
								style="width: {fillPercent}%; background: {COLORS.accent};"
							></div>
							<button
								type="button"
								class="seek-slider absolute inset-0 z-20 h-full w-full cursor-pointer bg-transparent focus:ring-2 focus:outline-none"
								style="--tw-ring-color: {COLORS.primary}; touch-action: none;"
								aria-label="Seek finished song"
								aria-valuemin="0"
								aria-valuemax={Math.round((fullDuration || TOTAL_MS) / 1000)}
								aria-valuenow={Math.round(currentPosition / 1000)}
								role="slider"
								title="Seek song"
								on:pointerdown={handleSeekPointerDown}
								on:mousedown={handleSeekMouseDown}
								on:keydown={seekFinishedSong}
							></button>
						</div>

						<div
							class="flex justify-between text-xs"
							style="color: {darkMode ? '#cfc7c1' : COLORS.muted}"
						>
							<span>{formatTime(currentPosition)}</span>
							<span>{formatTime(progressDuration)}</span>
						</div>

						<div class="mt-2 flex items-center justify-center gap-4 lg:hidden">
							<button
								type="button"
								on:click={rewindSong}
								class="flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-105 disabled:opacity-50 sm:h-12 sm:w-12"
								style="border-color: {loading ? '#888888' : COLORS.primary}; color: {loading
									? '#888888'
									: COLORS.primary}"
								disabled={loading}
								aria-label="Restart song from beginning"
								title="Restart song"
							>
								<Icon src={ArrowPath} class="h-4 w-4 sm:h-6 sm:w-6" />
							</button>
							<button
								type="button"
								on:click={togglePlayPause}
								class="flex h-12 w-12 items-center justify-center rounded-full border-2 transition hover:scale-105 disabled:opacity-50 sm:h-16 sm:w-16"
								style="border-color: {loading || widgetError
									? '#888888'
									: COLORS.accent}; color: {loading || widgetError ? '#888888' : COLORS.accent}"
								disabled={loading || Boolean(widgetError)}
								aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
								title={isPlaying ? 'Pause' : 'Play'}
							>
								<Icon src={isPlaying ? Pause : Play} class="h-6 w-6 sm:h-8 sm:w-8" />
							</button>
						</div>

						{#if loading && !widgetError}
							<p
								class="mt-2 animate-pulse text-center text-xs sm:text-sm"
								style="color: {darkMode ? '#cfc7c1' : COLORS.muted}"
								aria-live="polite"
							>
								Loading today’s song...
							</p>
						{/if}
					</section>
				</div>
			{:else}
				<div bind:this={playerWrapEl} class="player-wrap flex-shrink-0">
					<!-- Control Deck (Audio player controls & input) -->
					<section class="control-deck">
						{#if widgetError}
							<div
								class="mb-3 rounded border p-3 text-xs sm:text-sm"
								role="alert"
								style="border-color: {COLORS.danger}; color: {COLORS.danger}; background: {darkMode
									? '#2b1717'
									: '#fff1ef'}"
							>
								{widgetError}
							</div>
						{/if}

						<div
							class="progress-rail relative mb-1.5 h-5 w-full overflow-hidden rounded sm:mb-2 sm:h-7"
							aria-label="Audio progress"
						>
							{#if !gameOver}
								{#each segmentDurations as segmentEnd, index (segmentEnd)}
									{@const segmentStart = index === 0 ? 0 : segmentDurations[index - 1]}
									{@const isUnlocked = index <= attemptCount}
									<div
										class="absolute top-0 h-full transition-all duration-500 ease-out"
										style="
									left: {(segmentStart / TOTAL_MS) * 100}%;
									width: {isUnlocked ? ((segmentEnd - segmentStart) / TOTAL_MS) * 100 : 0}%;
									background: {darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(18,127,179,0.12)'};
								"
									></div>
								{/each}
							{/if}
							<div
								class="absolute top-0 left-0 h-full transition-[width] duration-100"
								style="width: {fillPercent}%; background: {COLORS.accent};"
							></div>
							{#if !gameOver}
								{#each boundaries as boundary (boundary)}
									<div
										class="absolute top-0 bottom-0"
										style="left: {(boundary / TOTAL_SECONDS) *
											100}%; border-left:1px solid {darkMode
											? '#fffaf7'
											: COLORS.text}; opacity: 0.35;"
									></div>
								{/each}
							{/if}
							{#if gameOver}
								<button
									type="button"
									class="seek-slider absolute inset-0 z-20 h-full w-full cursor-pointer bg-transparent focus:ring-2 focus:outline-none"
									style="--tw-ring-color: {COLORS.primary}; touch-action: none;"
									aria-label="Seek finished song"
									aria-valuemin="0"
									aria-valuemax={Math.round((fullDuration || TOTAL_MS) / 1000)}
									aria-valuenow={Math.round(currentPosition / 1000)}
									role="slider"
									title="Seek song"
									on:pointerdown={handleSeekPointerDown}
									on:mousedown={handleSeekMouseDown}
									on:keydown={seekFinishedSong}
								></button>
							{/if}
						</div>

						<div
							class="mb-2 flex justify-between text-xs sm:mb-4"
							style="color: {darkMode ? '#cfc7c1' : COLORS.muted}"
						>
							<span>{formatTime(currentPosition)}</span>
							<span>{formatTime(progressDuration)}</span>
						</div>

						<div class="mb-3 flex items-center justify-center gap-4 sm:mb-4">
							{#if gameOver}
								<button
									type="button"
									on:click={rewindSong}
									class="flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:scale-105 disabled:opacity-50 sm:h-12 sm:w-12 lg:hidden"
									style="border-color: {loading ? '#888888' : COLORS.primary}; color: {loading
										? '#888888'
										: COLORS.primary}"
									disabled={loading}
									aria-label="Restart song from beginning"
									title="Restart song"
								>
									<Icon src={ArrowPath} class="h-4 w-4 sm:h-6 sm:w-6" />
								</button>
							{/if}
							<button
								type="button"
								on:click={togglePlayPause}
								class="flex h-12 w-12 items-center justify-center rounded-full border-2 transition hover:scale-105 disabled:opacity-50 sm:h-16 sm:w-16 lg:hidden"
								style="border-color: {loading || widgetError
									? '#888888'
									: COLORS.accent}; color: {loading || widgetError ? '#888888' : COLORS.accent}"
								disabled={loading || Boolean(widgetError)}
								aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
								title={isPlaying ? 'Pause' : 'Play'}
							>
								<Icon src={isPlaying ? Pause : Play} class="h-6 w-6 sm:h-8 sm:w-8" />
							</button>
						</div>

						{#if loading && !widgetError}
							<p
								class="mb-3 animate-pulse text-center text-xs sm:text-sm"
								style="color: {darkMode ? '#cfc7c1' : COLORS.muted}"
								aria-live="polite"
							>
								Loading today’s song...
							</p>
						{/if}

						{#if !gameOver}
							<div class="relative mb-3 overflow-visible">
								<label for="guess-input" class="sr-only">Song title</label>
								<input
									id="guess-input"
									bind:this={inputEl}
									type="text"
									placeholder="Type a song title..."
									bind:value={userInput}
									on:keydown={onInputKeydown}
									on:focus={() => (selectedTrack = null)}
									autocomplete="off"
									class="w-full rounded border px-3 py-2 text-sm transition outline-none focus:ring-2 sm:px-4 sm:py-3 sm:text-base"
									style="border-color: {COLORS.primary}; background: {darkMode
										? '#1d1d1d'
										: COLORS.panel}; color: {darkMode
										? '#fffaf7'
										: COLORS.text}; --tw-ring-color: {COLORS.primary}"
								/>
								{#if suggestions.length}
									<ul
										class="absolute bottom-full left-0 z-10 mb-2 max-h-48 w-full overflow-y-auto rounded border shadow-lg sm:max-h-72"
										style="border-color: {darkMode ? '#3d3d3d' : '#dcdcdc'}; background: {darkMode
											? '#1d1d1d'
											: COLORS.panel}"
									>
										{#each suggestions as suggestion (suggestion.slug)}
											<li>
												<button
													type="button"
													class="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition hover:bg-black/5 sm:text-sm"
													style="color: {darkMode ? '#fffaf7' : COLORS.text}"
													on:click={() => selectSuggestion(suggestion)}
												>
													{#if suggestionArtwork[suggestion.slug]}
														<img
															src={suggestionArtwork[suggestion.slug]}
															alt=""
															class="h-9 w-9 flex-none rounded object-cover sm:h-11 sm:w-11"
															loading="lazy"
														/>
													{:else}
														<span
															class="flex h-9 w-9 flex-none items-center justify-center rounded text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
															style="background: {COLORS.primary}"
														>
															{suggestion.title.slice(0, 1)}
														</span>
													{/if}
													<span class="min-w-0">
														<span class="block truncate font-semibold">{suggestion.title}</span>
														<span
															class="block truncate text-[10px] sm:text-xs"
															style="color: {darkMode ? '#bbb' : COLORS.muted}"
														>
															{suggestion.artist}
														</span>
													</span>
												</button>
											</li>
										{/each}
									</ul>
								{/if}
							</div>

							<div class="flex gap-2 sm:gap-3">
								<button
									type="button"
									on:click={skipIntro}
									class="flex-1 rounded px-3 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
									style="background: {COLORS.primary}"
									disabled={loading || Boolean(widgetError)}
								>
									{#if nextIncrementSec > 0}Skip (+{nextIncrementSec}s){:else}I don’t know it{/if}
								</button>
								<button
									type="button"
									on:click={submitGuess}
									class="flex-1 rounded px-3 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
									style="background: {COLORS.secondary}"
									disabled={!canSubmit}
								>
									Submit
								</button>
							</div>
						{/if}
					</section>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	.heardle-page {
		--page-bg: #f7f8f7;
		--page-fg: #171717;
		--deck-bg: rgba(255, 255, 255, 0.92);
		--deck-border: #d9dcdf;
		--deck-muted: #5f6268;
		--deck-shadow: 0 18px 45px rgba(20, 24, 28, 0.08);
		--primary: #127fb3;
		--secondary: #c43a84;
		--accent: #f15a24;
		--rail-bg: #ffffff;
		--empty-row: #f7f8f7;
		background: var(--page-bg);
		color: var(--page-fg);
	}

	.heardle-page.heardle-dark {
		--page-bg: #121212;
		--page-fg: #fffaf7;
		--deck-bg: rgba(29, 29, 29, 0.92);
		--deck-border: #36393d;
		--deck-muted: #bbb;
		--deck-shadow: 0 18px 45px rgba(0, 0, 0, 0.26);
		--rail-bg: #171717;
		--empty-row: #191919;
		background: var(--page-bg);
	}

	.deck-header,
	.attempt-panel,
	.control-deck,
	.result-panel {
		background: var(--deck-bg);
		border: 1px solid var(--deck-border);
		border-radius: 8px;
		box-shadow: var(--deck-shadow);
	}

	.deck-header {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		padding: 12px;
		flex-shrink: 0;
	}

	.game-body {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
	}

	.soundcloud-player {
		position: absolute;
		width: 0;
		height: 0;
		border: 0;
		overflow: hidden;
		visibility: hidden;
	}

	.game-scroll {
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
	}

	.game-scroll.game-scroll-fill {
		flex: 1 1 auto;
		min-height: 0;
	}

	.game-scroll.game-scroll-scrollable {
		overflow-y: auto;
	}

	@media (min-width: 1024px) {
		.game-scroll.game-scroll-ended:not(.game-scroll-scrollable) {
			overflow: hidden;
		}

		.game-scroll.game-scroll-fill.game-scroll-ended:not(.game-scroll-scrollable) {
			overflow: hidden;
		}
	}

	.game-scroll:not(.game-scroll-fill) {
		flex: 0 1 auto;
		overflow: visible;
	}

	@media (max-width: 1023px) {
		.game-scroll {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
		}
	}

	.game-grid {
		align-content: start;
	}

	.left-col,
	.vinyl-col {
		min-width: 0;
	}

	@media (min-width: 1024px) {
		.left-col,
		.vinyl-col,
		.attempt-panel,
		.turntable-base {
			width: 100%;
		}

		.vinyl-turntable-container {
			height: 440px;
		}
	}

	.player-wrap {
		flex-shrink: 0;
		width: 100%;
	}

	.end-game-dock {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		width: 100%;
		align-items: stretch;
	}

	@media (min-width: 1024px) {
		.end-game-dock {
			grid-template-columns: repeat(12, minmax(0, 1fr));
			column-gap: 24px;
		}

		.dock-result {
			grid-column: 1 / span 6;
			min-height: 100%;
		}

		.dock-controls {
			grid-column: 7 / span 6;
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-height: 100%;
		}
	}

	.deck-title {
		color: var(--page-fg);
	}

	.deck-title p {
		color: var(--deck-muted);
	}

	.deck-kicker {
		margin: 0 0 2px;
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.deck-icon-button {
		display: inline-flex;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--deck-border);
		border-radius: 8px;
		background: var(--rail-bg);
		color: var(--primary);
		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease;
	}

	.deck-icon-button-alt {
		color: var(--secondary);
	}

	.deck-icon-button:hover {
		transform: translateY(-1px);
		border-color: currentColor;
	}

	.attempt-panel {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	@media (min-width: 1024px) {
		.attempt-panel {
			height: 440px;
			flex-grow: 0;
			display: flex;
			flex-direction: column;
		}

		.attempt-history {
			display: flex;
			flex-direction: column;
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
		}

		.attempt-row {
			flex-grow: 1;
			font-size: 1.1rem !important;
			min-height: 2.25rem;
		}
	}

	.attempt-panel,
	.control-deck {
		padding: 10px;
	}

	@media (min-width: 640px) {
		.attempt-panel,
		.control-deck {
			padding: 16px;
		}
	}

	@media (min-width: 768px) {
		.deck-header {
			padding: 16px 18px;
		}

		.attempt-panel,
		.control-deck {
			padding: 22px;
		}
	}

	.status-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
		font-size: 0.9rem;
	}

	.status-chip {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		padding: 5px 10px;
		background: var(--primary);
		color: #fff;
		font-weight: 800;
	}

	.status-note {
		color: var(--deck-muted);
		font-weight: 650;
	}

	.attempt-row {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--deck-border);
		background: var(--rail-bg);
	}

	.attempt-row-filled {
		border-color: var(--attempt-color);
		background: linear-gradient(90deg, var(--attempt-color) 0 6px, transparent 6px), var(--rail-bg);
		padding-left: 16px;
	}

	.attempt-row-empty {
		border-style: dashed;
		background: var(--empty-row);
		color: var(--deck-muted);
	}

	.result-panel {
		border-color: var(--result-color);
	}

	.control-deck {
		border-top: 4px solid var(--accent);
	}

	.progress-rail {
		border: 1px solid var(--deck-border);
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.06), transparent 45%), var(--rail-bg);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.14);
	}

	.share-button {
		background: var(--secondary);
	}

	@media (min-width: 768px) {
		.attempt-row {
			min-height: 52px;
			font-size: 0.98rem;
		}

		.progress-rail {
			height: 34px;
		}
	}

	@media (max-width: 520px) {
		.deck-header {
			gap: 8px;
			padding: 10px;
		}

		.deck-icon-button {
			width: 36px;
			height: 36px;
		}

		.deck-kicker {
			display: none;
		}

		.status-strip {
			align-items: flex-start;
			flex-direction: column;
			gap: 6px;
		}
	}

	/* Spinning Vinyl Record Player Styles */
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.waveform-bar.animating {
		animation: waveform-bounce ease-in-out infinite;
	}

	@keyframes waveform-bounce {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: 28px;
		}
	}

	/* Vintage Vertical Volume Fader */
	.vintage-slider {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		outline: none;
		position: absolute;
		width: 80px; /* matches fader container height */
		height: 20px; /* matches fader container width */
		margin: 0;
		padding: 0;
		/* Rotate -90deg so left(0) is bottom, right(100) is top */
		transform: rotate(-90deg);
		transform-origin: center center;
	}
	.vintage-slider::-webkit-slider-runnable-track {
		width: 100%;
		height: 4px;
		background: #111113;
		border: 1px solid #333336;
		border-radius: 2px;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);
	}
	.vintage-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 18px;
		/* Gradient horizontal so line appears vertical after rotation */
		background: linear-gradient(
			90deg,
			#e4e4e7 0%,
			#a1a1aa 35%,
			#ef4444 45%,
			#ef4444 55%,
			#71717a 65%,
			#3f3f46 100%
		);
		border: 1px solid #18181b;
		border-radius: 1.5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
		cursor: pointer;
		margin-top: -7px;
	}
	.vintage-slider::-moz-range-track {
		width: 100%;
		height: 4px;
		background: #111113;
		border: 1px solid #333336;
		border-radius: 2px;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);
	}
	.vintage-slider::-moz-range-thumb {
		width: 10px;
		height: 18px;
		background: linear-gradient(
			90deg,
			#e4e4e7 0%,
			#a1a1aa 35%,
			#ef4444 45%,
			#ef4444 55%,
			#71717a 65%,
			#3f3f46 100%
		);
		border: 1px solid #18181b;
		border-radius: 1.5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
		cursor: pointer;
	}

	/* Vintage Tactile Play Button */
	.vintage-play-btn {
		cursor: pointer;
		background: #09090b;
	}
	.vintage-play-btn:hover > div {
		background: linear-gradient(180deg, #ffffff 0%, #e5e7eb 40%, #d1d5db 100%) !important;
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
	}
	.vintage-play-btn:active > div,
	.vintage-play-btn > div.active-btn {
		transform: scale(0.95) translateY(1px);
		background: linear-gradient(180deg, #d1d5db 0%, #9ca3af 40%, #6b7280 100%) !important;
		border-color: #6b7280 !important;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4) !important;
	}
	.vintage-play-btn:disabled {
		cursor: default;
		opacity: 0.3;
	}

	.vinyl-record {
		transform-origin: center center;
		will-change: transform;
		backface-visibility: hidden;
		background:
			radial-gradient(circle, #2d2d2d 20%, transparent 20%),
			repeating-radial-gradient(circle, #202024 0px, #111113 1px, #202024 2px);
		box-shadow:
			0 0 0 2px rgba(0, 0, 0, 0.6),
			inset 0 0 20px rgba(0, 0, 0, 0.95),
			0 12px 28px rgba(0, 0, 0, 0.65);
	}

	.vinyl-sheen {
		background: conic-gradient(
			from 120deg,
			transparent 0%,
			rgba(255, 255, 255, 0.04) 8%,
			rgba(255, 255, 255, 0.12) 15%,
			rgba(255, 255, 255, 0.04) 22%,
			transparent 30%,
			transparent 50%,
			rgba(255, 255, 255, 0.04) 58%,
			rgba(255, 255, 255, 0.12) 65%,
			rgba(255, 255, 255, 0.04) 72%,
			transparent 80%,
			transparent 100%
		);
		mix-blend-mode: screen;
		opacity: 0.85;
	}

	.vinyl-label {
		box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.35);
	}

	.platter {
		box-shadow:
			inset 0 6px 15px rgba(0, 0, 0, 0.95),
			0 1px 3px rgba(255, 255, 255, 0.08);
	}
</style>
