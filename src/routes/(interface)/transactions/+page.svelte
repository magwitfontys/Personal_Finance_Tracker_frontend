<script>
	import '$lib/styles/transactions.css';
	import '$lib/styles/transactions-page.css';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { SvelteMap } from 'svelte/reactivity';
	import EditTransactionModal from '$lib/components/EditTransactionModal.svelte';

	/* icons */
	import searchIcon from '$lib/pictures/search.png';
	import filterIcon from '$lib/pictures/filter.png';
	import editIcon from '$lib/pictures/file-edit.png';
	import trashIcon from '$lib/pictures/trash.png';
	import warningIcon from '$lib/pictures/triangle-warning.png';

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

	/* delete all transactions modal */
	let showDeleteAllModal = false;
	let deleteAllConfirmation = '';
	let deleteAllError = '';
	let isDeleting = false;

	/* edit transaction modal */
	let showEditModal = false;
	let editError = '';
	let editForm = {
		id: null,
		type: 'expense',
		amount: 0,
		categoryId: null,
		date: '',
		description: ''
	};

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

	// categories available for the current edit selection
	$: editCategoryOptions = categories.filter((c) =>
		editForm.type === 'income' ? c.income : !c.income
	);

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

	function findCategoryIdByName(name, type) {
		const target = categories.find((c) => c.name === name && ((type === 'income' && c.income) || (type === 'expense' && !c.income)));
		return target ? target.id : null;
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

	function openDeleteAllModal() {
		showDeleteAllModal = true;
		deleteAllConfirmation = '';
		deleteAllError = '';
	}

	function closeDeleteAllModal() {
		showDeleteAllModal = false;
		deleteAllConfirmation = '';
		deleteAllError = '';
	}

	async function confirmDeleteAll() {
		const requiredText = 'Delete all transactions';

		if (deleteAllConfirmation !== requiredText) {
			deleteAllError = `Please type the exact text: "${requiredText}"`;
			return;
		}

		isDeleting = true;
		deleteAllError = '';

		try {
			const userId = localStorage.getItem('userId') || '1';
			const res = await fetch(`${API_BASE}/transactions/delete-all?userId=${userId}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				throw new Error('Failed to delete all transactions');
			}

			// Clear all transactions from local state
			transactions = [];
			showDeleteAllModal = false;
			deleteAllConfirmation = '';
			showToastNotification('All transactions deleted successfully!', 'success');
		} catch (err) {
			console.error('Error deleting all transactions:', err);
			deleteAllError = 'Failed to delete all transactions. Please try again.';
			showToastNotification('Failed to delete all transactions', 'error');
		} finally {
			isDeleting = false;
		}
	}

	function edit(id) {
		const tx = transactions.find((t) => t.id === id);
		if (!tx) return;

		editError = '';
		const categoryId = findCategoryIdByName(tx.category, tx.type);
		const fallbackCategoryId = categoryId ?? editCategoryOptions.find((c) => (tx.type === 'income' ? c.income : !c.income))?.id ?? null;
		editForm = {
			id: tx.id,
			type: tx.type,
			amount: Math.abs(tx.amount),
			categoryId: fallbackCategoryId,
			date: tx.date,
			description: tx.title === 'No description' ? '' : tx.title
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editError = '';
	}

	async function submitEdit(event) {
		event.preventDefault();
		if (!editForm.id) return;

		try {
			const userId = localStorage.getItem('userId') || '1';
			const payload = {
				transactionId: editForm.id,
				userId: parseInt(userId, 10),
				categoryId: editForm.categoryId,
				amount: Number(editForm.amount),
				txnType: editForm.type.toUpperCase(),
				txnDate: editForm.date,
				description: editForm.description?.trim() || ''
			};

			const res = await fetch(`${API_BASE}/transactions/${editForm.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				throw new Error('Failed to update transaction');
			}

			// update local state
			transactions = transactions.map((t) =>
				t.id === editForm.id
					? {
						...t,
						type: editForm.type,
						category: categories.find((c) => c.id === editForm.categoryId)?.name || t.category,
						date: editForm.date,
						amount: editForm.type === 'income' ? Number(editForm.amount) : -Math.abs(Number(editForm.amount)),
						title: editForm.description || 'No description'
					}
					: t
			);

			showToastNotification('Transaction updated successfully', 'success');
			showEditModal = false;
		} catch (err) {
			console.error('Error updating transaction:', err);
			editError = 'Failed to update transaction. Please try again.';
			showToastNotification('Failed to update transaction', 'error');
		}
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
		<div class="tx-header">
			<h2 class="tx-title">Recent Transactions</h2>
			<button
				type="button"
				class="delete-all-icon-btn"
				on:click={openDeleteAllModal}
				aria-label="Delete all transactions"
				title="Delete all transactions"
			>
				<img class="icon" src={trashIcon} alt="" />
			</button>
		</div>

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
			on:keydown={(e) => e.key === 'Escape' && (showDeleteModal = false)}
			role="dialog"
			aria-labelledby="modal-title"
			aria-modal="true"
			tabindex="-1"
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

<!-- Edit Transaction Modal -->
<EditTransactionModal
	isOpen={showEditModal}
	bind:editForm
	{editError}
	{editCategoryOptions}
	onClose={closeEditModal}
	onSubmit={submitEdit}
/>

<!-- Delete All Transactions Modal -->
{#if showDeleteAllModal}
	<div class="modal-overlay" on:click={closeDeleteAllModal} role="presentation">
		<div
			class="modal-content delete-all-modal"
			on:click={(e) => e.stopPropagation()}
			on:keydown={(e) => e.key === 'Escape' && closeDeleteAllModal()}
			role="dialog"
			aria-labelledby="delete-all-title"
			aria-modal="true"
			tabindex="-1"
		>
			<h3 id="delete-all-title">
				<img src={warningIcon} alt="Warning" class="warning-icon" />
				Delete All Transactions
			</h3>
			<div class="delete-all-warning">
				<p><strong>This action cannot be undone!</strong></p>
				<p>You are about to permanently delete <strong>all</strong> of your transactions. This process is not reversible.</p>
				<p style="margin-top: 16px;">If you are absolutely sure you want to delete all your transactions, please type the following text in the field below:</p>
				<div class="required-text">Delete all transactions</div>
			</div>

			{#if deleteAllError}
				<div class="form-error">{deleteAllError}</div>
			{/if}

			<input
				type="text"
				class="text-input delete-all-input"
				placeholder="Type the confirmation text here..."
				bind:value={deleteAllConfirmation}
				disabled={isDeleting}
			/>

			<div class="modal-actions">
				<button
					type="button"
					class="btn-cancel"
					on:click={closeDeleteAllModal}
					disabled={isDeleting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn-delete-all"
					on:click={confirmDeleteAll}
					disabled={isDeleting || deleteAllConfirmation !== 'Delete all transactions'}
				>
					{isDeleting ? 'Deleting...' : 'Delete All Transactions'}
				</button>
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


