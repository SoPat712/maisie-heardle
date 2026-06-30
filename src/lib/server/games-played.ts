import { getStore } from '@netlify/blobs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const STORE_NAME = 'maisie-heardle';
const COUNTER_KEY = 'games-played';
const LOCAL_FILE = join(process.cwd(), '.data', 'games-played.json');

async function readLocalCount(): Promise<number> {
	try {
		const raw = await readFile(LOCAL_FILE, 'utf8');
		const parsed = JSON.parse(raw) as { count?: number };
		return Number.isFinite(parsed.count) ? parsed.count! : 0;
	} catch {
		return 0;
	}
}

async function writeLocalCount(count: number): Promise<number> {
	await mkdir(join(process.cwd(), '.data'), { recursive: true });
	await writeFile(LOCAL_FILE, JSON.stringify({ count }), 'utf8');
	return count;
}

async function readNetlifyCount(): Promise<number> {
	const store = getStore({ name: STORE_NAME, consistency: 'strong' });
	const value = await store.get(COUNTER_KEY);
	if (!value) return 0;
	const count = Number.parseInt(value, 10);
	return Number.isFinite(count) ? count : 0;
}

async function incrementNetlifyCount(): Promise<number> {
	const store = getStore({ name: STORE_NAME, consistency: 'strong' });
	const next = (await readNetlifyCount()) + 1;
	await store.set(COUNTER_KEY, String(next));
	return next;
}

async function withNetlifyBlobs<T>(fn: () => Promise<T>): Promise<T | null> {
	try {
		return await fn();
	} catch (error) {
		if (error instanceof Error && error.name === 'MissingBlobsEnvironmentError') {
			return null;
		}
		throw error;
	}
}

export async function getGamesPlayedCount(increment = false): Promise<number> {
	const netlifyCount = await withNetlifyBlobs(async () => {
		if (increment) return incrementNetlifyCount();
		return readNetlifyCount();
	});

	if (netlifyCount !== null) return netlifyCount;

	const localCount = await readLocalCount();
	if (increment) return writeLocalCount(localCount + 1);
	return localCount;
}
