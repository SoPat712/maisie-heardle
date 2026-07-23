import { getLocalDateKey } from '$lib/tracks';

export type Stats = {
	played: number;
	wins: number;
	streak: number;
	maxStreak: number;
	distribution: number[];
	lastPlayedDate?: string;
};

export function createEmptyStats(maxAttempts: number): Stats {
	return {
		played: 0,
		wins: 0,
		streak: 0,
		maxStreak: 0,
		distribution: Array(maxAttempts).fill(0)
	};
}

export function calculateNextStats(
	stats: Stats,
	didWin: boolean,
	attempts: number,
	todayKey: string,
	maxAttempts: number
): Stats {
	const previousDate = new Date(`${todayKey}T12:00:00`);
	previousDate.setDate(previousDate.getDate() - 1);
	const playedYesterday = stats.lastPlayedDate === getLocalDateKey(previousDate);
	const nextStreak = didWin ? (playedYesterday ? stats.streak + 1 : 1) : 0;
	const distribution = Array.from(
		{ length: maxAttempts },
		(_, index) => stats.distribution[index] || 0
	);

	if (didWin) {
		distribution[Math.max(Math.min(attempts - 1, maxAttempts - 1), 0)] += 1;
	}

	return {
		...stats,
		played: stats.played + 1,
		wins: stats.wins + (didWin ? 1 : 0),
		streak: nextStreak,
		maxStreak: Math.max(stats.maxStreak, nextStreak),
		distribution,
		lastPlayedDate: todayKey
	};
}
