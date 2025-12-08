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

	let showCategoryMenu = false;

	function chooseCategory(category) {
		editForm = { ...editForm, categoryId: category.id };
		showCategoryMenu = false;
	}

	function getCategoryLabel() {
		const cat = editCategoryOptions.find(option => option.id === editForm.categoryId);
		return cat ? cat.name : 'Select a category';
	}
</script>

<svelte:window on:click={() => (showCategoryMenu = false)} />

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
					<span class="section-label">Type</span>
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
					<div class="menu">
						<button
							id="edit-category"
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
							<span>{getCategoryLabel()}</span>
							<span class="chev" aria-hidden="true">▾</span>
						</button>

						{#if showCategoryMenu}
							<ul
								id="category-panel"
								class="menu-panel wide"
								role="listbox"
								aria-labelledby="edit-category"
							>
								{#if editCategoryOptions.length === 0}
									<li>
										<button type="button" class="menu-item" aria-disabled="true">
											No categories available
										</button>
									</li>
								{:else}
									{#each editCategoryOptions as c (c.id)}
										<li>
											<button
												type="button"
												class="menu-item"
												role="option"
												aria-selected={editForm.categoryId === c.id}
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
												{#if editForm.categoryId === c.id}
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


