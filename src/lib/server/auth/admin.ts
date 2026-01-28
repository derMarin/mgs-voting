import bcrypt from 'bcrypt';
import { db } from '$lib/server/db/index.js';
import { adminSettings } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function getAdminPasswordHash(): Promise<string | null> {
	const setting = await db.query.adminSettings.findFirst({
		where: eq(adminSettings.key, 'admin_password_hash')
	});
	return setting?.value ?? env.ADMIN_PASSWORD_HASH ?? null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
	const existing = await db.query.adminSettings.findFirst({
		where: eq(adminSettings.key, 'admin_password_hash')
	});

	if (existing) {
		await db
			.update(adminSettings)
			.set({ value: hash, updatedAt: new Date() })
			.where(eq(adminSettings.key, 'admin_password_hash'));
	} else {
		await db.insert(adminSettings).values({
			key: 'admin_password_hash',
			value: hash
		});
	}
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
	const hash = await getAdminPasswordHash();

	// Debug logging
	console.log('Password verification:');
	console.log('- Hash from env/db:', hash ? `${hash.substring(0, 20)}...` : 'NULL');
	console.log('- Hash length:', hash?.length);
	console.log('- Hash starts with $2:', hash?.startsWith('$2'));

	if (!hash) {
		console.log('- Result: No hash found');
		return false;
	}

	const result = await bcrypt.compare(password, hash);
	console.log('- Bcrypt compare result:', result);

	return result;
}

export function createAdminSessionCookie(sessionSecret: string): string {
	const sessionData = {
		authenticated: true,
		createdAt: Date.now()
	};

	// Simple session token using HMAC-like approach
	const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
	const signature = Buffer.from(
		`${payload}.${sessionSecret}`.split('').reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0) + ''
	).toString('base64');

	return `${payload}.${signature}`;
}

export function verifyAdminSession(
	cookie: string | undefined,
	sessionSecret: string
): { isValid: boolean; expired: boolean } {
	if (!cookie) {
		return { isValid: false, expired: false };
	}

	try {
		const [payload, signature] = cookie.split('.');
		if (!payload || !signature) {
			return { isValid: false, expired: false };
		}

		// Verify signature
		const expectedSignature = Buffer.from(
			`${payload}.${sessionSecret}`.split('').reduce((a, b) => {
				a = (a << 5) - a + b.charCodeAt(0);
				return a & a;
			}, 0) + ''
		).toString('base64');

		if (signature !== expectedSignature) {
			return { isValid: false, expired: false };
		}

		// Decode and check expiration
		const sessionData = JSON.parse(Buffer.from(payload, 'base64').toString());
		const age = (Date.now() - sessionData.createdAt) / 1000;

		if (age > SESSION_MAX_AGE) {
			return { isValid: false, expired: true };
		}

		return { isValid: sessionData.authenticated === true, expired: false };
	} catch {
		return { isValid: false, expired: false };
	}
}

export function getSessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
	return {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax' as const,
		maxAge
	};
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };
