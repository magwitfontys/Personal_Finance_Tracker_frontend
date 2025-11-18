<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	function readAuthFromLocalStorage() {
		if (!browser) {
			return null;
		}

		const raw = localStorage.getItem('auth');
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object' && (parsed.token || parsed.username)) {
					return { token: parsed.token ?? null, username: parsed.username ?? null };
				}
			} catch (error) {
				// ignore invalid JSON and fall back to token/username keys
			}
		}

		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');
		if (token || username) {
			return { token: token ?? null, username: username ?? null };
		}

		if (localStorage.getItem('auth') === '1') {
			return { token: '1', username: null };
		}

		return null;
	}

	onMount(() => {
		if (!browser) {
			return;
		}

		const a = readAuthFromLocalStorage();
		if (a) {
			window.location.replace('/dashboard');
		} else {
			window.location.replace('/auth');
		}
	});
</script>

<p>Redirecting…</p>
