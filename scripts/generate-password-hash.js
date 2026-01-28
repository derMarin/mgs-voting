#!/usr/bin/env node

import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('Enter the admin password: ', async (password) => {
	if (!password || password.length < 8) {
		console.error('Password must be at least 8 characters long');
		process.exit(1);
	}

	const hash = await bcrypt.hash(password, 10);
	console.log('\nGenerated bcrypt hash:');
	console.log(hash);
	console.log('\nAdd this to your .env file as:');
	console.log(`ADMIN_PASSWORD_HASH=${hash}`);

	rl.close();
});
