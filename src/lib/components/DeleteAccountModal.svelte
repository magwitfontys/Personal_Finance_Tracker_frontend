<script>
	import '$lib/styles/delete-account-modal.css';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/authStore';

	export let isOpen = false;
	export let password = '';
	export let error = '';
	export let isDeleting = false;
	export let onBack = () => {};
	export let onClose = () => {};

	async function handleDelete() {
		if (!password) {
			error = 'Please enter your password';
			return;
		}

		isDeleting = true;
		error = '';

		try {
			const userId = localStorage.getItem('userId') || '1';
			const res = await fetch(`/api/auth/delete-account`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: parseInt(userId, 10),
					password: password
				})
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to delete account');
			}

			// Clear auth and redirect
			auth.set({ username: null, token: null });
			if (browser) {
				localStorage.removeItem('token');
				localStorage.removeItem('auth');
				localStorage.removeItem('username');
				localStorage.removeItem('userId');
				window.location.href = resolve('/auth');
			}
		} catch (err) {
			console.error('Error deleting account:', err);
			error = err.message || 'Failed to delete account. Please try again.';
			isDeleting = false;
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={onClose} role="presentation">
		<div
			class="modal-content delete-account-modal"
			on:click={(e) => e.stopPropagation()}
			on:keydown={(e) => e.key === 'Escape' && onClose()}
			role="dialog"
			aria-labelledby="delete-confirmation-title"
			aria-modal="true"
			tabindex="-1"
		>
			<h3 id="delete-confirmation-title">⚠️ Delete Account</h3>
			<div class="delete-account-warning">
				<p><strong>This action cannot be undone!</strong></p>
				<p>You are about to permanently delete your account and all associated data (transactions, categories, settings). This process is not reversible.</p>
				<p style="margin-top: 16px;">To confirm, please enter your password:</p>
			</div>

			{#if error}
				<div class="form-error">{error}</div>
			{/if}

			<input
				type="password"
				class="text-input delete-account-input"
				placeholder="Enter your password..."
				bind:value={password}
				disabled={isDeleting}
			/>

			<div class="modal-actions">
				<button
					type="button"
					class="btn-cancel"
					on:click={onBack}
					disabled={isDeleting}
				>
					Back
				</button>
				<button
					type="button"
					class="btn-delete-account"
					on:click={handleDelete}
					disabled={isDeleting || !password}
				>
					{isDeleting ? 'Deleting...' : 'Delete Account'}
				</button>
			</div>
		</div>
	</div>
{/if}
