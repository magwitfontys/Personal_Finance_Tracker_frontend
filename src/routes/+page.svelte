<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	onMount(() => {
		if (!browser) return;
		const token = localStorage.getItem('token') || (localStorage.getItem('auth') === '1' ? '1' : '');

		// Use explicit if/else and standard navigation (avoids goto() check)
		if (token) {
			window.location.replace('/dashboard');
		} else {
			window.location.replace('/auth');
		}
	});
</script>

<p>Redirecting…</p>
