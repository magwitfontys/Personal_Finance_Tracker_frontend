<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	onMount(() => {
		if (!browser) return;
		const token = localStorage.getItem('token') || (localStorage.getItem('auth') === '1' ? '1' : '');
		goto(token ? '/dashboard' : '/auth'); // literal paths
	});
</script>

<p>Redirecting…</p>
