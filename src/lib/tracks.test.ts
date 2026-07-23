import { describe, expect, it } from 'vitest';
import { getDailyTrack, getLocalDateKey, normalizeTrackTitle, tracks } from '$lib/tracks';

describe('daily track selection', () => {
	it('returns the same track for the same calendar date', () => {
		expect(getDailyTrack('2026-07-22')).toEqual(getDailyTrack('2026-07-22'));
	});

	it('keeps published dates stable', () => {
		expect(getDailyTrack('2026-07-22').slug).toBe('this-is-on-you-1');
		expect(getDailyTrack('2026-07-23').slug).toBe('body-better');
	});

	it('rejects invalid date keys', () => {
		expect(() => getDailyTrack('07/22/2026')).toThrow('Invalid date key');
	});

	it('has unique answer titles and slugs', () => {
		expect(new Set(tracks.map((track) => track.slug)).size).toBe(tracks.length);
		expect(new Set(tracks.map((track) => normalizeTrackTitle(track.title))).size).toBe(
			tracks.length
		);
	});
});

describe('local date keys', () => {
	it('formats dates without depending on UTC conversion', () => {
		expect(getLocalDateKey(new Date(2026, 6, 2, 23, 30))).toBe('2026-07-02');
	});
});
