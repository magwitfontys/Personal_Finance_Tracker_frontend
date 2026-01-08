import { writable } from 'svelte/store';

export const auth = writable({ username: null, token: null });

if (typeof window !== 'undefined') {
	let hydrated = false;

	try {
		const raw = localStorage.getItem('auth');
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				auth.set({
					username: parsed?.username ?? null,
					token: parsed?.token ?? null
				});
				hydrated = true;
			}
		}
	} catch {
		// ignore bad JSON
	}

	if (!hydrated) {
		// Fallback to separate legacy keys
		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');
		if (token || username) {
			auth.set({ token: token ?? null, username: username ?? null });
			hydrated = true;
		}
	}

	// Verify session with backend on initialization
	// If backend is down or user not found, clear the stored credentials
	if (hydrated) {
		const userId = localStorage.getItem('userId');
		if (userId) {
			verifySessionWithBackend(userId).catch(() => {
				// Backend unreachable or session invalid - clear stored credentials
				clearAuth();
			});
		}
	}

	// Keep localStorage in sync and always store a proper JSON object
	auth.subscribe((v) => {
		try {
			const safe = {
				username: v?.username ?? null,
				token: v?.token ?? null
			};
			localStorage.setItem('auth', JSON.stringify(safe));

			// (optional) keep legacy keys aligned if your app still reads them elsewhere
			if (safe.token !== null) localStorage.setItem('token', safe.token);
			else localStorage.removeItem('token');

			if (safe.username !== null) localStorage.setItem('username', safe.username);
			else localStorage.removeItem('username');
		} catch {
			/* ignore write errors */
		}
	});
}

/**
 * Verify session with backend
 * Throws an error if verification fails
 */
async function verifySessionWithBackend(userId) {
	try {
		const apiBase = typeof window !== 'undefined' ? window.location.origin : '';
		const response = await fetch(`${apiBase}/api/auth/verify?userId=${encodeURIComponent(userId)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			throw new Error(`Backend verification failed with status ${response.status}`);
		}

		return await response.json();
	} catch (err) {
		console.warn('Session verification failed:', err.message);
		throw err;
	}
}

/**
 * Clear all authentication data from localStorage
 */
function clearAuth() {
	auth.set({ username: null, token: null });
	if (typeof window !== 'undefined') {
		localStorage.removeItem('auth');
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('userId');
	}
}
