<script>
	import '$lib/styles/transactions.css';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { SvelteMap } from 'svelte/reactivity';

	/* icons */
	import searchIcon from '$lib/pictures/search.png';
	import filterIcon from '$lib/pictures/filter.png';
	import editIcon from '$lib/pictures/file-edit.png';
	import trashIcon from '$lib/pictures/trash.png';

	// Base for API calls
	const API_BASE = (env.PUBLIC_API_BASE || '/api').replace(/\/$/, '');

	/* transactions from API */
	let transactions = [];
	let transactionsError = '';
	let isLoading = true;

	/* search + filters */
	let q = '';
	let typeFilter = 'all'; // 'all' | 'income' | 'expense'
	let categoryFilter = 'all'; // 'all' | category name

	/* dropdown menu state */
	let showTypeMenu = false;
	let showCategoryMenu = false;

	/* categories from API */
	let categories = []; // [{ id, name, income }, ...]
	let categoriesError = '';

	/* delete confirmation modal */
	let showDeleteModal = false;
	let transactionToDelete = null;

	/* toast notification */
	let showToast = false;
	let toastMessage = '';
	let toastType = 'success'; // 'success' | 'error'
	let toastTimeout = null;

	const fmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});

	// load transactions from API
	async function loadTransactions() {
		isLoading = true;
		transactionsError = '';

		try {
			// Get userId from localStorage (set during login)
			const userId = localStorage.getItem('userId') || '1';
			const res = await fetch(`${API_BASE}/transactions?userId=${userId}`);

			if (!res.ok) {
				throw new Error(`Failed to load transactions: ${res.status}`);
			}

			const data = await res.json();
			
			// Transform backend TransactionDTO to match frontend structure
			transactions = data.map((t) => ({
				id: t.transactionId,
				type: t.txnType.toLowerCase(), // "EXPENSE" -> "expense", "INCOME" -> "income"
				category: getCategoryNameById(t.categoryId),
				title: t.description || 'No description',
				date: t.txnDate,
				amount: t.txnType === 'INCOME' ? t.amount : -Math.abs(t.amount)
			}));
		} catch (err) {
			console.error('Error loading transactions:', err);
			transactionsError = 'Failed to load transactions.';
			transactions = [];
		} finally {
			isLoading = false;
		}
	}

	// Helper to get category name by ID (lookup in loaded categories)
	function getCategoryNameById(categoryId) {
		const cat = categories.find((c) => c.id === categoryId);
		return cat ? cat.name : 'Unknown';
	}

	// load categories based on current type filter
	async function loadCategories(currentType) {
		categoriesError = '';
		categories = [];

		try {
			const wantsIncome = currentType === 'income' || currentType === 'all';
			const wantsExpense = currentType === 'expense' || currentType === 'all';

			const requests = [];
			if (wantsIncome) {
				requests.push(fetch(`${API_BASE}/categories/income`));
			}
			if (wantsExpense) {
				requests.push(fetch(`${API_BASE}/categories/outcome`));
			}

			const responses = await Promise.all(requests);

			let all = [];
			for (const res of responses) {
				if (!res.ok) {
					throw new Error(`Failed to load categories ${res.status}`);
				}
				const data = await res.json();
				if (Array.isArray(data)) {
					all = all.concat(data);
				}
			}

			// dedupe by id using SvelteMap (for svelte/prefer-svelte-reactivity)
			const map = new SvelteMap();
			for (const c of all) {
				if (!map.has(c.id)) {
					map.set(c.id, c);
				}
			}
			categories = Array.from(map.values());
		} catch (err) {
			console.error('Error loading categories', err);
			categoriesError = 'Failed to load categories.';
			categories = [];
		}

		categoryFilter = 'all';
	}

	onMount(async () => {
		await loadCategories(typeFilter);
		await loadTransactions();
	});

	/* derived list */
	$: filtered = transactions.filter((t) => {
		if (typeFilter !== 'all' && t.type !== typeFilter) {
			return false;
		}
		if (categoryFilter !== 'all' && t.category !== categoryFilter) {
			return false;
		}
		if (q && !`${t.category} ${t.title}`.toLowerCase().includes(q.toLowerCase())) {
			return false;
		}
		return true;
	});

	function showToastNotification(message, type = 'success', duration = 4000) {
		if (toastTimeout) clearTimeout(toastTimeout);
		toastMessage = message;
		toastType = type;
		showToast = true;
		toastTimeout = setTimeout(() => {
			showToast = false;
		}, duration);
	}

	function closeToast() {
		if (toastTimeout) clearTimeout(toastTimeout);
		showToast = false;
	}

	function promptDelete(transaction) {
		transactionToDelete = transaction;
		showDeleteModal = true;
	}

	function cancelDelete() {
		showDeleteModal = false;
		transactionToDelete = null;
	}

	async function confirmDelete() {
		if (!transactionToDelete) return;

		try {
			const res = await fetch(`${API_BASE}/transactions/${transactionToDelete.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				throw new Error('Failed to delete transaction');
			}

			// Remove from local state
			transactions = transactions.filter((t) => t.id !== transactionToDelete.id);
			showDeleteModal = false;
			transactionToDelete = null;
			showToastNotification('Transaction deleted successfully!', 'success');
		} catch (err) {
			console.error('Error deleting transaction:', err);
			showToastNotification('Failed to delete transaction', 'error');
		}
	}

	function edit(id) {
		// placeholder, later call API / navigate to edit page
		console.log('edit request', id);
	}

	function closeMenus() {
		showTypeMenu = false;
		showCategoryMenu = false;
	}

	async function selectType(v) {
		typeFilter = v;
		showTypeMenu = false;
		await loadCategories(v);
	}

	function selectCategory(name) {
		categoryFilter = name;
		showCategoryMenu = false;
	}

	/* labels for buttons */
	$: typeLabel =
		typeFilter === 'all'
			? 'All Types'
			: typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1);

	$: catLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter;
</script>

<!-- click-outside to close menus -->
<svelte:window on:click={closeMenus} />

<section class="tx-wrap">
	<div class="tx-card">
		<h2 class="tx-title">Recent Transactions</h2>

		<!-- Toolbar -->
		<div class="tx-toolbar">
			<!-- Search -->
			<label class="search" for="tx-search">
				<img class="icon" src={searchIcon} alt="" />
				<input
					id="tx-search"
					type="search"
					placeholder="Search transactions..."
					bind:value={q}
				/>
			</label>

			<!-- Type dropdown -->
			<div class="menu">
				<button
					type="button"
					class="menu-btn"
					aria-haspopup="listbox"
					aria-expanded={showTypeMenu}
					on:click|stopPropagation={() => {
						showTypeMenu = !showTypeMenu;
						showCategoryMenu = false;
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							showTypeMenu = !showTypeMenu;
							showCategoryMenu = false;
						}
					}}
				>
					<img class="icon" src={filterIcon} alt="" />
					<span>{typeLabel}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showTypeMenu}
					<ul class="menu-panel" role="listbox" aria-label="Type filter">
						<li>
							<button
								type="button"
								class="menu-item"
								role="option"
								aria-selected={typeFilter === 'all'}
								on:click|stopPropagation={() => selectType('all')}
							>
								<span>All Types</span>
								{#if typeFilter === 'all'}
									<span class="check">✓</span>
								{/if}
							</button>
						</li>
						<li>
							<button
								type="button"
								class="menu-item"
								role="option"
								aria-selected={typeFilter === 'income'}
								on:click|stopPropagation={() => selectType('income')}
							>
								<span>Income</span>
								{#if typeFilter === 'income'}
									<span class="check">✓</span>
								{/if}
							</button>
						</li>
						<li>
							<button
								type="button"
								class="menu-item"
								role="option"
								aria-selected={typeFilter === 'expense'}
								on:click|stopPropagation={() => selectType('expense')}
							>
								<span>Expense</span>
								{#if typeFilter === 'expense'}
									<span class="check">✓</span>
								{/if}
							</button>
						</li>
					</ul>
				{/if}
			</div>

			<!-- Category dropdown -->
			<div class="menu">
				<button
					type="button"
					class="menu-btn"
					aria-haspopup="listbox"
					aria-expanded={showCategoryMenu}
					on:click|stopPropagation={() => {
						showCategoryMenu = !showCategoryMenu;
						showTypeMenu = false;
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							showCategoryMenu = !showCategoryMenu;
							showTypeMenu = false;
						}
					}}
				>
					<span>{catLabel}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showCategoryMenu}
					<ul class="menu-panel wide" role="listbox" aria-label="Category filter">
						{#if categoriesError}
							<li>
								<button
									type="button"
									class="menu-item"
									aria-disabled="true"
									on:click|stopPropagation
								>
									{categoriesError}
								</button>
							</li>
						{:else}
							<li>
								<button
									type="button"
									class="menu-item"
									role="option"
									aria-selected={categoryFilter === 'all'}
									on:click|stopPropagation={() => selectCategory('all')}
								>
									<span>All Categories</span>
									{#if categoryFilter === 'all'}
										<span class="check">✓</span>
									{/if}
								</button>
							</li>

							{#if categories.length === 0}
								<li>
									<button
										type="button"
										class="menu-item"
										aria-disabled="true"
										on:click|stopPropagation
									>
										No categories available
									</button>
								</li>
							{:else}
								{#each categories as c (c.id)}
									<li>
										<button
											type="button"
											class="menu-item"
											role="option"
											aria-selected={categoryFilter === c.name}
											on:click|stopPropagation={() => selectCategory(c.name)}
										>
											<span>{c.name}</span>
											{#if categoryFilter === c.name}
												<span class="check">✓</span>
											{/if}
										</button>
									</li>
								{/each}
							{/if}
						{/if}
					</ul>
				{/if}
			</div>
		</div>

		<!-- List -->
		{#if isLoading}
			<p class="empty">Loading transactions...</p>
		{:else if transactionsError}
			<p class="empty" style="color: #e53e3e;">{transactionsError}</p>
		{:else if filtered.length === 0}
			<p class="empty">No transactions found.</p>
		{:else}
			<ul class="tx-list" role="list">
				{#each filtered as t (t.id)}
					<li class="tx-item">
						<div class="left">
							<span class="badge {t.type}">{t.category}</span>
							<span class="date">
								{new Date(t.date).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})}
							</span>
							<div class="title">{t.title}</div>
						</div>

						<div class="right">
							<div class="amount {t.type}">
								{t.type === 'income' ? '+' : '-'}
								{fmt.format(Math.abs(t.amount))}
							</div>
							<button
								type="button"
								class="icon-btn"
								on:click={() => edit(t.id)}
								aria-label="Edit transaction"
							>
								<img class="icon" src={editIcon} alt="" />
							</button>
							<button
								type="button"
								class="icon-btn"
								on:click={() => promptDelete(t)}
								aria-label="Delete transaction"
							>
								<img class="icon" src={trashIcon} alt="" />
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-overlay" on:click={cancelDelete} role="presentation">
		<div
			class="modal-content"
			on:click={(e) => e.stopPropagation()}
			role="dialog"
			aria-labelledby="modal-title"
			aria-modal="true"
		>
			<h3 id="modal-title">Are you sure?</h3>
			<p>This action cannot be undone. This will permanently delete the transaction.</p>
			<div class="modal-actions">
				<button type="button" class="btn-cancel" on:click={cancelDelete}>Cancel</button>
				<button type="button" class="btn-delete" on:click={confirmDelete}>Delete</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notification -->
{#if showToast}
	<div class="toast {toastType}">
		<span class="toast-message">{toastMessage}</span>
		<button class="toast-close" on:click={closeToast} aria-label="Close notification">×</button>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 24px;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-content h3 {
		margin: 0 0 12px 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
	}

	.modal-content p {
		margin: 0 0 24px 0;
		color: #4a5568;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-cancel,
	.btn-delete {
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-cancel {
		background: #e2e8f0;
		color: #2d3748;
	}

	.btn-cancel:hover {
		background: #cbd5e0;
	}

	.btn-delete {
		background: #000;
		color: white;
	}

	.btn-delete:hover {
		background: #2d3748;
	}

	.toast {
		position: fixed !important;
		bottom: 24px !important;
		right: 24px !important;
		background: white;
		border-radius: 12px;
		padding: 16px 20px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 16px;
		min-width: 300px;
		max-width: 400px;
		z-index: 9999 !important;
		animation: slideIn 0.3s ease-out;
		border-left: 4px solid;
	}

	@keyframes slideIn {
		from {
			transform: translateX(400px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.toast.success {
		border-left-color: #10b981;
	}

	.toast.error {
		border-left-color: #ef4444;
	}

	.toast-message {
		flex: 1;
		color: #1a202c;
		font-weight: 500;
		font-size: 0.95rem;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #718096;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
		line-height: 1;
	}

	.toast-close:hover {
		background: #f7fafc;
		color: #2d3748;
	}
</style>
