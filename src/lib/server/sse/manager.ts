import type { SSEEvent } from '$lib/types/index.js';

type SSEClient = {
	controller: ReadableStreamDefaultController<Uint8Array>;
	lastPing: number;
};

class SSEManager {
	private clients: Map<string, SSEClient> = new Map();
	private pingInterval: ReturnType<typeof setInterval> | null = null;
	private encoder = new TextEncoder();

	constructor() {
		// Start ping interval to keep connections alive
		this.startPingInterval();
	}

	private startPingInterval() {
		if (this.pingInterval) return;

		this.pingInterval = setInterval(() => {
			const now = Date.now();
			const staleThreshold = 30000; // 30 seconds

			// Remove stale connections and ping active ones
			for (const [clientId, client] of this.clients.entries()) {
				if (now - client.lastPing > staleThreshold) {
					this.removeClient(clientId);
				} else {
					this.sendToClient(clientId, { type: 'ping' } as any);
				}
			}
		}, 15000); // Every 15 seconds
	}

	addClient(clientId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
		this.clients.set(clientId, {
			controller,
			lastPing: Date.now()
		});

		// Send initial connection event
		this.sendToClient(clientId, {
			type: 'connected',
			clientId
		} as any);

		console.log(`SSE client connected: ${clientId}. Total clients: ${this.clients.size}`);
	}

	removeClient(clientId: string) {
		const client = this.clients.get(clientId);
		if (client) {
			try {
				client.controller.close();
			} catch {
				// Controller might already be closed
			}
			this.clients.delete(clientId);
			console.log(`SSE client disconnected: ${clientId}. Total clients: ${this.clients.size}`);
		}
	}

	private sendToClient(clientId: string, event: SSEEvent | { type: string; [key: string]: any }) {
		const client = this.clients.get(clientId);
		if (!client) return;

		try {
			const data = `data: ${JSON.stringify(event)}\n\n`;
			client.controller.enqueue(this.encoder.encode(data));
			client.lastPing = Date.now();
		} catch (error) {
			console.error(`Error sending to client ${clientId}:`, error);
			this.removeClient(clientId);
		}
	}

	broadcast(event: SSEEvent) {
		const data = `data: ${JSON.stringify(event)}\n\n`;
		const encoded = this.encoder.encode(data);

		for (const [clientId, client] of this.clients.entries()) {
			try {
				client.controller.enqueue(encoded);
				client.lastPing = Date.now();
			} catch (error) {
				console.error(`Error broadcasting to client ${clientId}:`, error);
				this.removeClient(clientId);
			}
		}

		console.log(`SSE broadcast to ${this.clients.size} clients:`, event.type);
	}

	broadcastVotingStatusChange(categoryId: string, status: string, categoryName: string) {
		this.broadcast({
			type: 'voting_status_changed',
			categoryId,
			status: status as 'idle' | 'active' | 'completed',
			categoryName
		});
	}

	broadcastVoteReceived(categoryId: string, candidateId: string, juryMemberId: string) {
		this.broadcast({
			type: 'vote_received',
			categoryId,
			candidateId,
			juryMemberId
		});
	}

	getClientCount(): number {
		return this.clients.size;
	}

	shutdown() {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		for (const clientId of this.clients.keys()) {
			this.removeClient(clientId);
		}
	}
}

// Singleton instance
export const sseManager = new SSEManager();
