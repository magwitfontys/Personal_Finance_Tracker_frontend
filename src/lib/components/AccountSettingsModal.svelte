<script>
	import '$lib/styles/account-settings-modal.css';
	import trashWhiteIcon from '$lib/pictures/trash-white.png';

	export let isOpen = false;
	export let username = '';
	export let onClose = () => {};
	export let onDeleteClick = () => {};
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={onClose} role="presentation">
		<div
			class="modal-content delete-account-modal"
			on:click={(e) => e.stopPropagation()}
			on:keydown={(e) => e.key === 'Escape' && onClose()}
			role="dialog"
			aria-labelledby="account-settings-title"
			aria-modal="true"
			tabindex="-1"
		>
			<h3 id="account-settings-title">Account Settings</h3>
			<div class="account-info">
				<p><strong>Email:</strong> {username || 'User'}</p>
			</div>
			<p style="color: #4a5568; margin: 16px 0; font-size: 0.95rem;">
				Manage your account or delete it permanently.
			</p>
			<div class="modal-actions">
				<button
					type="button"
					class="btn-cancel"
					on:click={onClose}
				>
					Close
				</button>
				<button
					type="button"
					class="btn-delete-account-proceed"
					on:click={onDeleteClick}
				>
					<img class="btn-icon" src={trashWhiteIcon} alt="" />
					Delete Account
				</button>
			</div>
		</div>
	</div>
{/if}
