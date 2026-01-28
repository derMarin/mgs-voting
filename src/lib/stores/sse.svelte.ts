import type { SSEEvent, VotingStatus } from '$lib/types/index.js';

interface SSEState {
	connected: boolean;
	lastEvent: SSEEvent | null;
	activeCategory: {
		id: string;
		name: string;
		status: VotingStatus;
	} | null;
}

function createSSEStore() {
	let state = $state<SSEState>({
		connected: false,
		lastEvent: null,
		activeCategory: null
	});

	let eventSource: EventSource | null = null;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let listeners: Set<(event: SSEEvent) => void> = new Set();

	function connect() {
		if (eventSource?.readyState === EventSource.OPEN) {
			return;
		}

		// Clean up any existing connection
		disconnect();

		eventSource = new EventSource('/api/sse/voting-status');

		eventSource.onopen = () => {
			state.connected = true;
			console.log('SSE connected');
		};

		eventSource.onmessage = (event) => {
			try {
				const rawData = JSON.parse(event.data) as { type: string; [key: string]: unknown };

				// Ignore ping and connected events
				if (rawData.type === 'ping' || rawData.type === 'connected') {
					return;
				}

				const data = rawData as unknown as SSEEvent;
				state.lastEvent = data;

				// Update active category state
				if (data.type === 'voting_status_changed') {
					if (data.status === 'active') {
						state.activeCategory = {
							id: data.categoryId,
							name: data.categoryName,
							status: data.status
						};
					} else {
						state.activeCategory = null;
					}
				}

				// Notify all listeners
				for (const listener of listeners) {
					listener(data);
				}
			} catch (error) {
				console.error('Error parsing SSE event:', error);
			}
		};

		eventSource.onerror = () => {
			state.connected = false;
			console.log('SSE connection error, reconnecting...');

			// Close current connection
			eventSource?.close();
			eventSource = null;

			// Reconnect after delay
			reconnectTimeout = setTimeout(() => {
				connect();
			}, 3000);
		};
	}

	function disconnect() {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}

		state.connected = false;
	}

	function subscribe(callback: (event: SSEEvent) => void): () => void {
		listeners.add(callback);
		return () => {
			listeners.delete(callback);
		};
	}

	return {
		get connected() {
			return state.connected;
		},
		get lastEvent() {
			return state.lastEvent;
		},
		get activeCategory() {
			return state.activeCategory;
		},
		connect,
		disconnect,
		subscribe
	};
}

export const sseStore = createSSEStore();
