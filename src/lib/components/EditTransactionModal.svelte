<script>
	import '$lib/styles/edit-transaction-modal.css';

	export let isOpen = false;
	export let editForm = {
		id: null,
		type: 'expense',
		amount: 0,
		categoryId: null,
		date: '',
		description: ''
	};
	export let editError = '';
	export let editCategoryOptions = [];
	export let onClose = () => {};
	export let onSubmit = (e) => {};
</script>

{#if isOpen}
	<div class="modal-overlay" role="presentation" on:click={onClose}>
		<div
			class="edit-modal"
			on:click={(e) => e.stopPropagation()}
			on:keydown={(e) => e.key === 'Escape' && onClose()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-title"
			tabindex="-1"
		>
			<header class="edit-modal__header">
				<h2 id="edit-title">Edit Transaction</h2>
				<button class="close-btn" type="button" aria-label="Close" on:click={onClose}>×</button>
			</header>
			<form class="edit-modal__body" on:submit|preventDefault={onSubmit}>
				{#if editError}
					<div class="form-error">{editError}</div>
				{/if}
				<div class="form-section type-section">
					<label class="section-label">Type</label>
					<div class="type-toggle">
						<label class="toggle-option expense">
							<input
								type="radio"
								name="txn-type"
								value="expense"
								checked={editForm.type === 'expense'}
								on:change={() => (editForm = { ...editForm, type: 'expense', categoryId: null })}
							/>
							<span>Expense</span>
						</label>
						<label class="toggle-option income">
							<input
								type="radio"
								name="txn-type"
								value="income"
								checked={editForm.type === 'income'}
								on:change={() => (editForm = { ...editForm, type: 'income', categoryId: null })}
							/>
							<span>Income</span>
						</label>
					</div>
				</div>

				<div class="form-section">
					<label class="section-label" for="edit-amount">Amount</label>
					<input
						type="number"
						min="0"
						step="0.01"
						class="text-input"
						id="edit-amount"
						bind:value={editForm.amount}
						required
					/>
				</div>

				<div class="form-section">
					<label class="section-label" for="edit-category">Category</label>
					<select
						class="text-input"
						id="edit-category"
						bind:value={editForm.categoryId}
						required
					>
						{#if !editCategoryOptions.length}
							<option value="" disabled>Select type first</option>
						{:else}
							{#each editCategoryOptions as c (c.id)}
								<option value={c.id}>{c.name}</option>
							{/each}
						{/if}
					</select>
				</div>

				<div class="form-section">
					<label class="section-label" for="edit-date">Date</label>
					<input
						type="date"
						class="text-input"
						id="edit-date"
						bind:value={editForm.date}
						required
					/>
				</div>

				<div class="form-section">
					<label class="section-label" for="edit-desc">Description (optional)</label>
					<textarea
						class="text-area"
						rows="3"
						id="edit-desc"
						bind:value={editForm.description}
						placeholder="Add a short note"
					></textarea>
				</div>

				<button type="submit" class="primary-btn">
					<span class="plus">＋</span>
					Update Transaction
				</button>
			</form>
		</div>
	</div>
{/if}


