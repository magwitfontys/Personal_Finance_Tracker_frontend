<script>
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import '$lib/styles/add-transaction.css';

	/* icons (button only) */
	import addIcon from '$lib/pictures/white-add.png';

	// Base for API calls (fallback to /api when env is not set)
	const API_BASE = (env.PUBLIC_API_BASE || '/api').replace(/\/$/, '');

	/* local UI state */
	let type = 'expense'; // 'expense' | 'income'
	let amount = '';
	let categoryLabel = ''; // what we show in the button
	let categoryId = null; // what we will send to backend later
	let date = '';
	let description = '';

	/* dropdown state + options from API */
	let showCategoryMenu = false;
	let categories = []; // [{ id, name, income }, ...]
	let categoriesError = '';

	/* toast notification */
	let showToast = false;
	let toastMessage = '';
	let toastType = 'success'; // 'success' | 'error'
	let toastTimeout = null;

	onMount(async () => {
		// default date = today (yyyy-mm-dd)
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		date = `${yyyy}-${mm}-${dd}`;

		// load initial categories for default type ("expense" => outcome)
		await loadCategories(type);
	});

	async function loadCategories(currentType) {
		categoriesError = '';

		try {
			// backend: /api/categories/income or /api/categories/outcome
			const suffix = currentType === 'income' ? '/categories/income' : '/categories/outcome';
			const res = await fetch(`${API_BASE}${suffix}`);

			if (!res.ok) {
				console.error('Failed to load categories', res.status);
				categoriesError = 'Failed to load categories.';
				categories = [];
				return;
			}

			const data = await res.json();
			categories = Array.isArray(data) ? data : [];
		} catch (err) {
			console.error('Error loading categories', err);
			categoriesError = 'Error loading categories.';
			categories = [];
		}

		// reset selection whenever we reload categories
		categoryLabel = '';
		categoryId = null;
	}

	function selectType(next) {
		type = next;
		loadCategories(next);
	}

	function chooseCategory(c) {
		categoryLabel = c.name;
		categoryId = c.id; // CategoryDTO has "id"
		showCategoryMenu = false;
	}

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

	async function submit(e) {
		e.preventDefault();
		
		// Basic validation
		if (!amount || !categoryId || !date) {
			showToastNotification('Please fill in all required fields', 'error');
			return;
		}

		// Get userId from localStorage (set during login)
		const userId = parseInt(localStorage.getItem('userId') || '1', 10);

		// Build payload matching backend TransactionDTO
		const payload = {
			userId: userId,
			categoryId: categoryId,
			amount: parseFloat(amount),
			txnType: type.toUpperCase(), // "expense" -> "EXPENSE" or "income" -> "INCOME"
			txnDate: date,
			description: description || null
		};

		try {
			const res = await fetch(`${API_BASE}/transactions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to create transaction');
			}

			const created = await res.json();
			console.log('Transaction created:', created);

			// Reset form
			amount = '';
			categoryLabel = '';
			categoryId = null;
			description = '';
			// Keep type and date as is

			showToastNotification('Transaction added successfully!', 'success');
		} catch (err) {
			console.error('Error creating transaction:', err);
			showToastNotification('Failed to add transaction: ' + err.message, 'error');
		}
	}
</script>

<!-- click-outside to close the dropdown -->
<svelte:window on:click={() => (showCategoryMenu = false)} />

<section class="page-wrap">
	<form class="card" on:submit|preventDefault={submit}>
		<h2 class="card-title">Add Transaction</h2>

		<!-- Type -->
		<div class="field">
			<fieldset class="fieldset">
				<legend class="label">Type</legend>
				<div class="type-toggle" role="tablist" aria-label="Transaction type">
					<button
						type="button"
						class="chip expense"
						class:active={type === 'expense'}
						on:click={() => selectType('expense')}
						aria-pressed={type === 'expense'}
					>
						<span class="dot"></span>
						<span class="chip-text expense-text">Expense</span>
					</button>

					<button
						type="button"
						class="chip income"
						class:active={type === 'income'}
						on:click={() => selectType('income')}
						aria-pressed={type === 'income'}
					>
						<span class="dot"></span>
						<span class="chip-text income-text">Income</span>
					</button>
				</div>
			</fieldset>
		</div>

		<!-- Amount -->
		<div class="field">
			<label class="label" for="amount">Amount</label>
			<input
				id="amount"
				class="input"
				type="number"
				inputmode="decimal"
				step="0.01"
				placeholder="0.00"
				bind:value={amount}
				min="0"
			/>
		</div>

		<!-- Category (custom dropdown) -->
		<div class="field">
			<label class="label" for="category">Category</label>

			<div class="menu">
				<button
					id="category"
					type="button"
					class="menu-btn"
					aria-haspopup="listbox"
					aria-expanded={showCategoryMenu}
					aria-controls="category-panel"
					on:click={(e) => {
						e.stopPropagation();
						showCategoryMenu = !showCategoryMenu;
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							showCategoryMenu = !showCategoryMenu;
						}
						if (e.key === 'Escape') {
							showCategoryMenu = false;
						}
					}}
				>
					<span>{categoryLabel || 'Select a category'}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showCategoryMenu}
					<ul
						id="category-panel"
						class="menu-panel wide"
						role="listbox"
						aria-labelledby="category"
					>
						{#if categoriesError}
							<li>
								<button type="button" class="menu-item" aria-disabled="true">
									{categoriesError}
								</button>
							</li>
						{:else if categories.length === 0}
							<li>
								<button type="button" class="menu-item" aria-disabled="true">
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
										aria-selected={categoryId === c.id}
										on:click={(e) => {
											e.stopPropagation();
											chooseCategory(c);
										}}
										on:keydown={(e) => {
											if (e.key === 'Escape') {
												showCategoryMenu = false;
											}
										}}
									>
										<span>{c.name}</span>
										{#if categoryId === c.id}
											<span class="check">✓</span>
										{/if}
									</button>
								</li>
							{/each}
						{/if}
					</ul>
				{/if}
			</div>
		</div>

		<!-- Date -->
		<div class="field">
			<label class="label" for="date">Date</label>
			<input id="date" class="input" type="date" bind:value={date} />
		</div>

		<!-- Description -->
		<div class="field">
			<label class="label" for="description">Description (optional)</label>
			<textarea
				id="description"
				class="textarea"
				placeholder="Enter description..."
				rows="3"
				bind:value={description}
			></textarea>
		</div>

		<!-- Submit -->
		<div class="actions">
			<button class="btn-primary" type="submit">
				<img class="btn-icon" alt="" src={addIcon} />
				<span>Add Transaction</span>
			</button>
		</div>
	</form>
</section>

<!-- Toast Notification -->
{#if showToast}
	<div class="toast {toastType}">
		<span class="toast-message">{toastMessage}</span>
		<button class="toast-close" on:click={closeToast} aria-label="Close notification">×</button>
	</div>
{/if}

<style>
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
