<script>
	import { auth } from '$lib/stores/authStore';
	import { browser } from '$app/environment';

	function go(path) {
		if (browser) {
			window.location.href = path; // full-page nav; no SvelteKit link checking
		}
	}

	function logout() {
		auth.set({ username: null, token: null });
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('auth');
			localStorage.removeItem('username');
			window.location.href = '/auth';
		}
	}
</script>

<nav style="display:flex;gap:1rem;margin:1rem 0">
	<!-- “Home” goes to dashboard if logged in, otherwise to auth -->
	{#if $auth?.token}
		<button type="button" class="navlink" on:click={() => go('/dashboard')}>Home</button>
	{:else}
		<button type="button" class="navlink" on:click={() => go('/auth')}>Home</button>
	{/if}

	{#if !$auth?.token}
		<button type="button" class="navlink" on:click={() => go('/auth')}>Log in</button>
		<button
			type="button"
			class="navlink"
			on:click={() => go('/auth#register')}
		>
			Register
		</button>
	{/if}

	<span style="margin-left:auto">
		{#if $auth?.username}
			Signed in as <strong>{$auth.username}</strong> •
			<button on:click={logout}>Logout</button>
		{/if}
	</span>
</nav>

<slot />

<style>
	/* Make buttons look like links */
	.navlink {
		all: unset;
		cursor: pointer;
		color: #0ea5e9;
		text-decoration: underline;
	}
	.navlink:focus {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
