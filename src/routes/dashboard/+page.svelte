<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/authStore';

	let username = '';

	onMount(() => {
		if (!browser) return;

		// treat either a token or an 'auth' flag as logged-in
		const isAuthed = localStorage.getItem('token') || localStorage.getItem('auth') === '1';
		if (!isAuthed) {
			goto('/auth'); // literal path
			return;
		}
		username = localStorage.getItem('username') || 'user';
	});

	function logout() {
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('auth');
			localStorage.removeItem('username');
		}
		auth.set({ username: null, token: null });
		goto('/auth'); // literal path
	}
</script>

<h1>Dashboard</h1>
<p>Welcome, {username}.</p>
<button on:click={logout}>Logout</button>
