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
<nav class="app-nav">
	<div class="nav-inner">
		<!-- Brand (left) -->
		<a href="/dashboard" class="brand">
			<!-- icon placeholder - wire later via CSS background-image -->
			<span class="icon icon--brand" aria-hidden="true"></span>
			<span class="brand-text">Finance Tracker</span>
		</a>

		<!-- Center links -->
		<ul class="nav-links">
			<li>
				<a
					href="/dashboard"
					class="nav-link {path.startsWith('/dashboard') ? 'is-active' : ''}"
					aria-current={path.startsWith('/dashboard') ? 'page' : undefined}
				>
					<span class="icon icon--dashboard" aria-hidden="true"></span>
					<span>Dashboard</span>
				</a>
			</li>

			<li>
				<a
					href="/transactions/add"
					class="nav-link {path.startsWith('/transactions/add') ? 'is-active' : ''}"
					aria-current={path.startsWith('/transactions/add') ? 'page' : undefined}
				>
					<span class="icon icon--add" aria-hidden="true"></span>
					<span>Add Transaction</span>
				</a>
			</li>

			<li>
				<a
					href="/transactions"
					class="nav-link {path === '/transactions' ? 'is-active' : ''}"
					aria-current={path === '/transactions' ? 'page' : undefined}
				>
					<span class="icon icon--transactions" aria-hidden="true"></span>
					<span>Transactions</span>
				</a>
			</li>
		</ul>

		<!-- Right section -->
		<div class="nav-right">
			<span class="user-pill">{$auth?.username ?? 'User'}</span>
			<button type="button" class="logout" on:click={logout}>
				<span class="icon icon--logout" aria-hidden="true"></span>
				<span>Logout</span>
			</button>
		</div>
	</div>
</nav>
{/if}

<slot />
