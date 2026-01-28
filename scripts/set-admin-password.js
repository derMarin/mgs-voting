#!/usr/bin/env node

import bcrypt from 'bcrypt';
import readline from 'readline';
import postgres from 'postgres';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root@127.0.0.1:5432/mgs-voting';

rl.question('Enter the admin password: ', async (password) => {
	if (!password || password.length < 8) {
		console.error('Password must be at least 8 characters long');
		process.exit(1);
	}

	const hash = await bcrypt.hash(password, 10);
	console.log('\nGenerated bcrypt hash:');
	console.log(hash);
	console.log('Hash length:', hash.length);

	const sql = postgres(DATABASE_URL);

	try {
		// Check if entry exists
		const existing = await sql`
			SELECT id FROM admin_settings WHERE key = 'admin_password_hash'
		`;

		if (existing.length > 0) {
			await sql`
				UPDATE admin_settings
				SET value = ${hash}, updated_at = NOW()
				WHERE key = 'admin_password_hash'
			`;
			console.log('\nPassword hash updated in database.');
		} else {
			await sql`
				INSERT INTO admin_settings (id, key, value, created_at, updated_at)
				VALUES (gen_random_uuid(), 'admin_password_hash', ${hash}, NOW(), NOW())
			`;
			console.log('\nPassword hash inserted into database.');
		}

		console.log('You can now remove ADMIN_PASSWORD_HASH from your .env file.');
	} catch (error) {
		console.error('Database error:', error.message);
		process.exit(1);
	} finally {
		await sql.end();
		rl.close();
	}
});
