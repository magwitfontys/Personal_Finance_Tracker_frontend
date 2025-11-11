<script>
	import { onMount } from 'svelte';
	import '$lib/styles/add-transaction.css';

	/* icons (button only) */
	import addIcon from '$lib/pictures/white-add.png';

	/* local UI state (no API yet) */
	let type = 'expense';        // 'expense' | 'income'
	let amount = '';
	let category = '';           // selected category label
	let date = '';
	let description = '';

	/* dropdown state + options */
	let showCategoryMenu = false;
	const categories = ['Groceries', 'Transportation', 'Utilities', 'Entertainment'];

	onMount(() => {
		// default date = today (yyyy-mm-dd)
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		date = `${yyyy}-${mm}-${dd}`;
	});

	function selectType(next) { type = next; }

	function chooseCategory(c) {
		category = c;
		showCategoryMenu = false;
	}

	function submit(e) {
		e.preventDefault();
		// UI-only preview
		console.log('Preview payload:', { type, amount, category, date, description });
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
						// make toggle keyboard friendly
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							showCategoryMenu = !showCategoryMenu;
						}
						if (e.key === 'Escape') {
							showCategoryMenu = false;
						}
					}}
				>
					<span>{category || 'Select a category'}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>

				{#if showCategoryMenu}
					<ul id="category-panel" class="menu-panel wide" role="listbox" aria-labelledby="category">
						{#each categories as c, i}
							<li>
								<button
									type="button"
									class="menu-item"
									role="option"
									aria-selected={category === c}
									on:click={(e) => {
										e.stopPropagation();
										chooseCategory(c);
									}}
									on:keydown={(e) => {
										// Enter/Space handled by button natively; allow Esc to close
										if (e.key === 'Escape') { showCategoryMenu = false; }
									}}
								>
									<span>{c}</span>
									{#if category === c}<span class="check">✓</span>{/if}
								</button>
							</li>
						{/each}
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
