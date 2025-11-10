<script>
	import { auth } from '$lib/stores/authStore';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	// bring in the CSS from a separate file
	import '$lib/styles/app-nav.css';

	// track current path for "active" link styling
	$: path = $page.url.pathname;

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

{#if $auth?.token}
<header class="app-nav">
	<div class="nav-inner">
		<!-- Brand (left) -->
		<a href="/dashboard" class="brand">
			<!-- emoji placeholder – swap for your icon later -->
			<span class="icon icon--brand" aria-hidden="true">💼</span>
			<span class="brand-text">Finance Tracker</span>
		</a>

		<!-- Center links -->
		<nav class="nav-links" aria-label="Primary">
			<a
				href="/dashboard"
				class="nav-link"
				data-active={path === '/dashboard'}
				aria-current={path === '/dashboard' ? 'page' : undefined}
			>Dashboard</a>

			<a
				href="/add-transaction"
				class="nav-link"
				data-active={path.startsWith('/add-transaction')}
				aria-current={path.startsWith('/add-transaction') ? 'page' : undefined}
			>Add Transaction</a>

			<a
				href="/transactions"
				class="nav-link"
				data-active={path.startsWith('/transactions')}
				aria-current={path.startsWith('/transactions') ? 'page' : undefined}
			>Transactions</a>
		</nav>

		<!-- Right side actions -->
		<div class="nav-actions">
			<span class="user-chip" title={$auth?.username ?? ''}>{$auth?.username}</span>
			<button class="logout-btn" type="button" on:click={logout}>Logout</button>
		</div>
	</div>
</header>
{/if}
