<script>
	import { auth } from '$lib/stores/authStore';
	import { browser } from '$app/environment';

	function logout() {
		auth.set({ username: null, token: null });
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('auth');
			localStorage.removeItem('username');
			// full navigation to avoid link-checker on goto()
			window.location.href = '/auth';
		}
	}
</script>

<nav style="display:flex;gap:1rem;margin:1rem 0">
	<!-- Render literal links; rel="external" bypasses SvelteKit link checker -->
	{#if $auth?.token}
		<a href="/dashboard" rel="external">Home</a>
	{:else}
		<a href="/auth" rel="external">Home</a>
	{/if}

	{#if !$auth?.token}
		<a href="/auth" rel="external">Log in</a>
		<a href="/auth#register" rel="external">Register</a>
	{/if}

	<span style="margin-left:auto">
		{#if $auth?.username}
			Signed in as <strong>{$auth.username}</strong> •
			<button on:click={logout}>Logout</button>
		{/if}
	</span>
</nav>

<slot />
