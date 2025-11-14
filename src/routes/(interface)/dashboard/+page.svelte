<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/authStore';

	let username = '';

	function readAuthFromLocalStorage() {
		if (!browser) return null;

		// Preferred: JSON object in "auth"
		const raw = localStorage.getItem('auth');
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object' && (parsed.token || parsed.username)) {
					return { token: parsed.token ?? null, username: parsed.username ?? null };
				}
			} catch {
				// ignore bad JSON
			}
		}

		// Legacy fallback: separate keys
		const token = localStorage.getItem('token');
		const uname = localStorage.getItem('username');
		if (token || uname) return { token: token ?? null, username: uname ?? null };

		// Very old fallback: string "1"
		if (localStorage.getItem('auth') === '1') return { token: '1', username: null };

		return null;
	}

	onMount(() => {
		if (!browser) return;

		const a = readAuthFromLocalStorage();
		if (!a) {
			// Not authenticated -> go to login
			window.location.replace('/auth');
			return;
		}

		// We are authenticated -> reflect in store + page
		auth.set({ token: a.token ?? null, username: a.username ?? null });
		username = a.username ?? 'User';
	});
</script>

<h1>Dashboard</h1>
<p>Welcome, {username}.</p>
