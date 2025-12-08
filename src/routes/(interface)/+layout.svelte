<script>
	import { auth } from '$lib/stores/authStore';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	// styles + icons
	import '$lib/styles/app-nav.css';
	import walletIcon from '$lib/pictures/white-wallet.png';

	// modal components
	import AccountSettingsModal from '$lib/components/AccountSettingsModal.svelte';
	import DeleteAccountModal from '$lib/components/DeleteAccountModal.svelte';

	// single (dark) variants; we turn them white with CSS when active
	import dashboardIcon from '$lib/pictures/dashboard.png';
	import addIcon from '$lib/pictures/add.png';
	import listIcon from '$lib/pictures/list.png';
	import globeIcon from '$lib/pictures/globe.png';
	import exitIcon from '$lib/pictures/exit.png';
	import '../../app.css';

	// active link flags
	$: path = $page.url.pathname;
	$: isDashboard = path.startsWith('/dashboard');
	$: isAdd = path.startsWith('/add-transaction');
	$: isTransactions = path.startsWith('/transactions');
	$: isPrivacy = path.startsWith('/privacy');

	// Delete account modal state
	let showDeleteAccountModal = false;
	let showDeleteConfirmation = false;
	let deleteAccountPassword = '';
	let deleteAccountError = '';
	let isDeleting = false;

	// hydrate auth from localStorage so header shows after refresh
	onMount(() => {
		if (!browser) {
			return;
		}

		const raw = localStorage.getItem('auth');
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') {
					auth.set({ username: parsed?.username ?? null, token: parsed?.token ?? null });
					return;
				}
			} catch {
				// ignore JSON parse errors and fall back to token/username keys
			}
		}

		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');
		if (token || username) {
			auth.set({ token: token ?? null, username: username ?? null });
		}
	});

	function logout() {
		auth.set({ username: null, token: null });
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('auth');
			localStorage.removeItem('username');
			window.location.href = resolve('/auth');
		}
	}

	// Extract the part before @ from email/username
	function getDisplayName(email) {
		if (!email) return 'User';
		const atIndex = email.indexOf('@');
		if (atIndex > -1) {
			return email.substring(0, atIndex);
		}
		return email;
	}

	function openDeleteAccountModal() {
		showDeleteAccountModal = true;
		showDeleteConfirmation = false;
		deleteAccountPassword = '';
		deleteAccountError = '';
	}

	function closeDeleteAccountModal() {
		showDeleteAccountModal = false;
		showDeleteConfirmation = false;
		deleteAccountPassword = '';
		deleteAccountError = '';
	}

	function proceedToDeleteConfirmation() {
		showDeleteConfirmation = true;
		deleteAccountError = '';
	}

	function backToAccountInfo() {
		showDeleteConfirmation = false;
		deleteAccountPassword = '';
		deleteAccountError = '';
	}
</script>

{#if $auth && ($auth.token || $auth.username)}
<nav class="app-nav" aria-label="Main">
	<div class="nav-inner">
		<!-- Brand -->
		<a href={resolve('/dashboard')} class="brand">
			<span class="icon--brand" aria-hidden="true">
				<img src={walletIcon} alt="" class="icon-img" />
			</span>
			<span class="brand-text">Finance Tracker</span>
		</a>

		<!-- Center links -->
		<ul class="nav-links" role="list">
			<li>
				<a
					href={resolve('/dashboard')}
					class="nav-link"
					class:is-active={isDashboard}
					aria-current={isDashboard ? 'page' : undefined}
				>
					<img class="nav-icon" alt="" src={dashboardIcon} />
					<span>Dashboard</span>
				</a>
			</li>

			<li>
				<a
					href={resolve('/add-transaction')}
					class="nav-link"
					class:is-active={isAdd}
					aria-current={isAdd ? 'page' : undefined}
				>
					<img class="nav-icon" alt="" src={addIcon} />
					<span>Add Transaction</span>
				</a>
			</li>

			<li>
				<a
					href={resolve('/transactions')}
					class="nav-link"
					class:is-active={isTransactions}
					aria-current={isTransactions ? 'page' : undefined}
				>
					<img class="nav-icon" alt="" src={listIcon} />
					<span>Transactions</span>
				</a>
			</li>

			<li>
				<a
					href={resolve('/privacy')}
					class="nav-link"
					class:is-active={isPrivacy}
					aria-current={isPrivacy ? 'page' : undefined}
				>
					<img class="nav-icon" alt="" src={globeIcon} />
					<span>Privacy</span>
				</a>
			</li>
		</ul>

		<!-- Right -->
		<div class="nav-right">
			<button type="button" class="user-pill" on:click={openDeleteAccountModal} title="Click to manage account">
				{getDisplayName($auth?.username ?? 'User')}
			</button>
			<button type="button" class="logout" on:click={logout}>
				<img class="nav-icon" alt="" src={exitIcon} />
				<span>Logout</span>
			</button>
		</div>
	</div>
</nav>
{/if}

<!-- Account Settings Modal -->
<AccountSettingsModal
	isOpen={showDeleteAccountModal && !showDeleteConfirmation}
	username={$auth?.username ?? ''}
	onClose={closeDeleteAccountModal}
	onDeleteClick={proceedToDeleteConfirmation}
/>

<!-- Delete Account Modal -->
<DeleteAccountModal
	isOpen={showDeleteConfirmation}
	bind:password={deleteAccountPassword}
	bind:error={deleteAccountError}
	bind:isDeleting
	onBack={backToAccountInfo}
	onClose={closeDeleteAccountModal}
/>

<slot />


