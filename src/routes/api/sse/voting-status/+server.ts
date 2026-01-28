import type { RequestHandler } from './$types.js';
import { sseManager } from '$lib/server/sse/manager.js';
import { v4 as uuidv4 } from 'uuid';

export const GET: RequestHandler = async ({ request }) => {
	const clientId = uuidv4();

	const stream = new ReadableStream({
		start(controller) {
			sseManager.addClient(clientId, controller);
		},
		cancel() {
			sseManager.removeClient(clientId);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no' // For nginx
		}
	});
};
