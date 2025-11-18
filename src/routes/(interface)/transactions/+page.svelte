<script>
	import '$lib/styles/transactions.css';
	import { onMount } from 'svelte';
	import { PUBLIC_API_BASE } from '$env/static/public';
	import { SvelteMap } from 'svelte/reactivity';

	/* icons */
	import searchIcon from '$lib/pictures/search.png';
	import filterIcon from '$lib/pictures/filter.png';
	import editIcon from '$lib/pictures/file-edit.png';
	import trashIcon from '$lib/pictures/trash.png';

	// Base for API calls
	const API_BASE = (PUBLIC_API_BASE || '/api').replace(/\/$/, '');

	/* temporary mock data */
	let transactions = [
		{
			id: crypto?.randomUUID?.() ?? 't1',
			type: 'expense',
			category: 'Groceries',
			title: 'Weekly shopping',
			date: '2024-01-15',
			amount: -250
		},
		{
			id: crypto?.randomUUID?.() ?? 't2',
			type: 'income',
			category: 'Salary',
			title: 'Monthly salary',
			date: '2024-01-01',
			amount: 3200
		}
	];

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

	const fmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});

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

	function remove(id) {
		transactions = transactions.filter((t) => t.id !== id);
	}

	function edit(id) {
		// placeholder – later we will navigate to edit page / call API
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
		{#if filtered.length === 0}
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
								on:click={() => remove(t.id)}
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
