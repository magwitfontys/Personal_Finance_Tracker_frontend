<script>
	import '$lib/styles/transactions.css';

	/* icons */
	import searchIcon from '$lib/pictures/search.png';
	import filterIcon from '$lib/pictures/filter.png';
	import editIcon from '$lib/pictures/file-edit.png';
	import trashIcon from '$lib/pictures/trash.png';

	/* minimal seed data: exactly one expense + one income */
	let transactions = [
		{
			id: crypto?.randomUUID?.() ?? 't1',
			type: 'expense',              // 'expense' | 'income'
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

	/* search + filters (UI-only for now) */
	let q = '';
	let typeFilter = 'all';          // all | income | expense
	let categoryFilter = 'all';

	/* dropdown menu state */
	let showTypeMenu = false;
	let showCategoryMenu = false;

	const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

	/* build categories list dynamically (will just work once API fills) */
	$: categories = Array.from(new Set(transactions.map(t => t.category))).sort();

	/* derive filtered list */
	$: filtered = transactions.filter(t => {
		if (typeFilter !== 'all' && t.type !== typeFilter) return false;
		if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
		if (q && !`${t.category} ${t.title}`.toLowerCase().includes(q.toLowerCase())) return false;
		return true;
	});

	function remove(id) {
		transactions = transactions.filter(t => t.id !== id);
	}

	function edit(id) {
		// placeholder for later – when wired to API/route
		console.log('edit request', id);
	}

	/* simple click-outside to close menus */
	function closeMenus() {
		showTypeMenu = false;
		showCategoryMenu = false;
	}

	function selectType(v) {
		typeFilter = v;
		showTypeMenu = false;
	}

	function selectCategory(v) {
		categoryFilter = v;
		showCategoryMenu = false;
	}

	/* helpers for labels */
	$: typeLabel = typeFilter === 'all'
		? 'All Type'
		: typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1);

	$: catLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter;
</script>

<!-- capture outside clicks -->
<svelte:window on:click={closeMenus} />

<section class="tx-wrap">
	<div class="tx-card">
		<h2 class="tx-title">Recent Transactions</h2>

		<!-- Toolbar -->
		<div class="tx-toolbar">
			<label class="search" on:click|stopPropagation>
				<img class="icon" src={searchIcon} alt="" />
				<input
					type="search"
					placeholder="Search transactions..."
					bind:value={q}
				/>
			</label>

			<!-- Type dropdown -->
			<div class="menu" on:click|stopPropagation>
				<button
					type="button"
					class="menu-btn"
					aria-haspopup="listbox"
					aria-expanded={showTypeMenu}
					on:click={() => { showTypeMenu = !showTypeMenu; showCategoryMenu = false; }}
					on:keyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (showTypeMenu = !showTypeMenu)}
				>
					<img class="icon" src={filterIcon} alt="" />
					<span>{typeLabel}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showTypeMenu}
					<ul class="menu-panel" role="listbox" aria-label="Type filter">
						<li class="menu-item" role="option" aria-selected={typeFilter === 'all'} on:click={() => selectType('all')}>
							<span>All Type</span>
							{#if typeFilter === 'all'}<span class="check">✓</span>{/if}
						</li>
						<li class="menu-item" role="option" aria-selected={typeFilter === 'income'} on:click={() => selectType('income')}>
							<span>Income</span>
							{#if typeFilter === 'income'}<span class="check">✓</span>{/if}
						</li>
						<li class="menu-item" role="option" aria-selected={typeFilter === 'expense'} on:click={() => selectType('expense')}>
							<span>Expense</span>
							{#if typeFilter === 'expense'}<span class="check">✓</span>{/if}
						</li>
					</ul>
				{/if}
			</div>

			<!-- Category dropdown -->
			<div class="menu" on:click|stopPropagation>
				<button
					type="button"
					class="menu-btn"
					aria-haspopup="listbox"
					aria-expanded={showCategoryMenu}
					on:click={() => { showCategoryMenu = !showCategoryMenu; showTypeMenu = false; }}
					on:keyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (showCategoryMenu = !showCategoryMenu)}
				>
					<span>{catLabel}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showCategoryMenu}
					<ul class="menu-panel wide" role="listbox" aria-label="Category filter">
						<li class="menu-item" role="option" aria-selected={categoryFilter === 'all'} on:click={() => selectCategory('all')}>
							<span>All Categories</span>
							{#if categoryFilter === 'all'}<span class="check">✓</span>{/if}
						</li>

						{#each categories as c}
							<li class="menu-item" role="option" aria-selected={categoryFilter === c} on:click={() => selectCategory(c)}>
								<span>{c}</span>
								{#if categoryFilter === c}<span class="check">✓</span>{/if}
							</li>
						{/each}
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
								{new Date(t.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
							</span>
							<div class="title">{t.title}</div>
						</div>

						<div class="right">
							<div class="amount {t.type}">
								{t.type === 'income' ? '+' : '-'}{fmt.format(Math.abs(t.amount))}
							</div>
							<button type="button" class="icon-btn" on:click={() => edit(t.id)} aria-label="Edit">
								<img class="icon" src={editIcon} alt="" />
							</button>
							<button type="button" class="icon-btn" on:click={() => remove(t.id)} aria-label="Delete">
								<img class="icon" src={trashIcon} alt="" />
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
