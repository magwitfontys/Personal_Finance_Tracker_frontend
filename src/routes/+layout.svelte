<script>
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	function logout() {
		// clear store + browser storage
		auth.set({ username: null, token: null });
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('token');
			localStorage.removeItem('auth');
			localStorage.removeItem('username');
		}
		goto('/auth'); // literal path (resolves at build)
	}
</script>

<nav style="display:flex;gap:1rem;margin:1rem 0">
	<!-- Home: render a literal link based on auth state (no dynamic href) -->
	{#if $auth?.token}
		<a href="/dashboard">Home</a>
	{:else}
		<a href="/auth">Home</a>
	{/if}

	{#if !$auth?.token}
		<a href="/auth">Log in</a>
		<a href="/auth#register">Register</a>
	{/if}

	<span style="margin-left:auto">
		{#if $auth?.username}
			Signed in as <strong>{$auth.username}</strong> •
			<button on:click={logout}>Logout</button>
		{/if}
	</span>
</nav>

<slot />
