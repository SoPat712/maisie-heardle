import { describe, expect, it } from 'vitest';
import { calculateNextStats, createEmptyStats } from '$lib/game-state';

describe('game statistics', () => {
	it('starts a streak with a win', () => {
		const stats = calculateNextStats(createEmptyStats(6), true, 2, '2026-07-20', 6);

		expect(stats).toMatchObject({
			played: 1,
			wins: 1,
			streak: 1,
			maxStreak: 1,
			lastPlayedDate: '2026-07-20'
		});
		expect(stats.distribution).toEqual([0, 1, 0, 0, 0, 0]);
	});

	it('continues a streak only on consecutive days', () => {
		const first = calculateNextStats(createEmptyStats(6), true, 1, '2026-07-20', 6);
		const consecutive = calculateNextStats(first, true, 3, '2026-07-21', 6);
		const afterGap = calculateNextStats(consecutive, true, 1, '2026-07-23', 6);

		expect(consecutive.streak).toBe(2);
		expect(afterGap.streak).toBe(1);
		expect(afterGap.maxStreak).toBe(2);
	});

	it('resets a streak after a loss', () => {
		const winning = calculateNextStats(createEmptyStats(6), true, 1, '2026-07-20', 6);
		const losing = calculateNextStats(winning, false, 6, '2026-07-21', 6);

		expect(losing.streak).toBe(0);
		expect(losing.wins).toBe(1);
		expect(losing.distribution).toEqual([1, 0, 0, 0, 0, 0]);
	});
});
