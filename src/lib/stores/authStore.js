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
