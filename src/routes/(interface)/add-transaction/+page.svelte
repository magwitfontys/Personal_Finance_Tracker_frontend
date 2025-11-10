<script>
	import { onMount } from 'svelte';
	import '$lib/styles/add-transaction.css';

	// icons (purely visual)
	import addIcon from '$lib/pictures/white-add.png';

	// local UI state (no API here yet)
	let type = 'expense';        // 'expense' | 'income'
	let amount = '';
	let category = '';
	let date = '';
	let description = '';

	onMount(() => {
		// default date = today (yyyy-mm-dd) so it works with <input type="date">
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		date = `${yyyy}-${mm}-${dd}`;
	});

	function selectType(next) { type = next; }

	function submit(e) {
		e.preventDefault();
		// UI-only for now—no API call.
		console.log('Preview payload:', { type, amount, category, date, description });
	}
</script>

<section class="page-wrap">
	<form class="card" on:submit|preventDefault={submit}>
		<h2 class="card-title">Add Transaction</h2>

		<!-- Type (use fieldset/legend instead of label so a11y is happy) -->
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
				aria-describedby="amountHelp"
			/>
			<div id="amountHelp" class="help"></div>
		</div>

		<!-- Category -->
		<div class="field">
			<label class="label" for="category">Category</label>
			<select id="category" class="select" bind:value={category}>
				<option value="" disabled selected>Select a category</option>
				<!-- placeholder options for now; will be loaded from API later -->
				<option value="groceries">Groceries</option>
				<option value="transportation">Transportation</option>
				<option value="utilities">Utilities</option>
				<option value="entertainment">Entertainment</option>
			</select>
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
