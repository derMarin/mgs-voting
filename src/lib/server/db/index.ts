import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema.js';

let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
	if (_db) return _db;

	const connectionString = env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const client = postgres(connectionString);
	_db = drizzle(client, { schema });
	return _db;
}

// Proxy to lazily initialize the database connection
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
	get(_, prop) {
		return getDb()[prop as keyof PostgresJsDatabase<typeof schema>];
	}
});

export * from './schema.js';
