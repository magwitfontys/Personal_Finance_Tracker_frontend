<script>
	import { auth } from '$lib/stores/authStore';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	// styles + icons
	import '$lib/styles/app-nav.css';
	import walletIcon from '$lib/pictures/white-wallet.png';

	// single (dark) variants — we'll turn them white with CSS when active
	import dashboardIcon from '$lib/pictures/dashboard.png';
	import addIcon from '$lib/pictures/add.png';
	import listIcon from '$lib/pictures/list.png';
	import exitIcon from '$lib/pictures/exit.png';

	// active link flags
	$: path = $page.url.pathname;
	$: isDashboard = path.startsWith('/dashboard');
	$: isAdd = path.startsWith('/add-transaction');
	$: isTransactions = path.startsWith('/transactions');

	// hydrate auth from localStorage so header shows after refresh
	onMount(() => {
		if (!browser) return;

		const raw = localStorage.getItem('auth');
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') {
					auth.set({ username: parsed?.username ?? null, token: parsed?.token ?? null });
					return;
				}
			} catch {}
		}
		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');
		if (token || username) auth.set({ token: token ?? null, username: username ?? null });
	});

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

{#if $auth && ($auth.token || $auth.username)}
<nav class="app-nav" aria-label="Main">
	<div class="nav-inner">
		<!-- Brand -->
		<a href="/dashboard" class="brand">
			<span class="icon--brand" aria-hidden="true">
				<img src={walletIcon} alt="" class="icon-img" />
			</span>
			<span class="brand-text">Finance Tracker</span>
		</a>

		<!-- Center links -->
		<ul class="nav-links" role="list">
			<li>
				<a href="/dashboard"
				   class="nav-link"
				   class:is-active={isDashboard}
				   aria-current={isDashboard ? 'page' : undefined}>
					<img class="nav-icon" alt="" src={dashboardIcon} />
					<span>Dashboard</span>
				</a>
			</li>

			<li>
				<a href="/add-transaction"
				   class="nav-link"
				   class:is-active={isAdd}
				   aria-current={isAdd ? 'page' : undefined}>
					<img class="nav-icon" alt="" src={addIcon} />
					<span>Add Transaction</span>
				</a>
			</li>

			<li>
				<a href="/transactions"
				   class="nav-link"
				   class:is-active={isTransactions}
				   aria-current={isTransactions ? 'page' : undefined}>
					<img class="nav-icon" alt="" src={listIcon} />
					<span>Transactions</span>
				</a>
			</li>
		</ul>

		<!-- Right -->
		<div class="nav-right">
			<span class="user-pill">{$auth?.username ?? 'User'}</span>
			<button type="button" class="logout" on:click={logout}>
				<img class="nav-icon" alt="" src={exitIcon} />
				<span>Logout</span>
			</button>
		</div>
	</div>
</nav>
{/if}

<slot />
