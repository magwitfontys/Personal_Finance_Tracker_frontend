<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_API_BASE } from '$env/static/public';
	import { auth } from '$lib/stores/authStore';

	let username = '';

	// Use PUBLIC_API_BASE if provided, otherwise default to '/api'.
	// Dev: Vite proxies /api -> http://localhost:8081
	// Docker: nginx proxies /api -> backend:8081/api
	const API_BASE = (PUBLIC_API_BASE || '/api').replace(/\/$/, '');

	let allCategories = [];
	let incomeCategories = [];
	let outcomeCategories = [];
	let categoriesError = '';

	function readAuthFromLocalStorage() {
		if (!browser) return null;

		// Preferred: JSON object in "auth"
		const raw = localStorage.getItem('auth');
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object' && (parsed.token || parsed.username)) {
					return { token: parsed.token ?? null, username: parsed.username ?? null };
				}
			} catch {
				// ignore bad JSON
			}
		}

		// Legacy fallback: separate keys
		const token = localStorage.getItem('token');
		const uname = localStorage.getItem('username');
		if (token || uname) return { token: token ?? null, username: uname ?? null };

		// Very old fallback: string "1"
		if (localStorage.getItem('auth') === '1') return { token: '1', username: null };

		return null;
	}

	async function loadCategoriesFromApi() {
		categoriesError = '';

		try {
			const [allRes, incomeRes, outcomeRes] = await Promise.all([
				fetch(`${API_BASE}/categories`),
				fetch(`${API_BASE}/categories/income`),
				fetch(`${API_BASE}/categories/outcome`)
			]);

			if (!allRes.ok || !incomeRes.ok || !outcomeRes.ok) {
				console.error('Bad response from categories API', {
					all: allRes.status,
					income: incomeRes.status,
					outcome: outcomeRes.status
				});
				categoriesError = 'Failed to load categories from API.';
				allCategories = [];
				incomeCategories = [];
				outcomeCategories = [];
				return;
			}

			allCategories = await allRes.json();
			incomeCategories = await incomeRes.json();
			outcomeCategories = await outcomeRes.json();
		} catch (err) {
			console.error('Error loading categories from API', err);
			categoriesError = 'Error loading categories from API.';
			allCategories = [];
			incomeCategories = [];
			outcomeCategories = [];
		}
	}

	onMount(async () => {
		if (!browser) return;

		const a = readAuthFromLocalStorage();
		if (!a) {
			// Not authenticated -> go to login
			window.location.replace('/auth');
			return;
		}

		// We are authenticated -> reflect in store + page
		auth.set({ token: a.token ?? null, username: a.username ?? null });
		username = a.username ?? 'User';

		// now test the API
		await loadCategoriesFromApi();
	});
</script>

<h1>Dashboard</h1>
<p>Welcome, {username}.</p>

{#if categoriesError}
	<p style="color: red; margin-top: 1rem;">{categoriesError}</p>
{/if}

<section style="margin-top: 1.5rem;">
	<h2>All categories (API)</h2>
	{#if allCategories.length === 0}
		<p>No categories found.</p>
	{:else}
		<ul>
			{#each allCategories as c}
				<li>
					{c.name}
					{#if c.income !== undefined}
						&nbsp;({c.income ? 'income' : 'outcome'})
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section style="margin-top: 1.5rem;">
	<h2>Income categories (API)</h2>
	{#if incomeCategories.length === 0}
		<p>No income categories.</p>
	{:else}
		<ul>
			{#each incomeCategories as c}
				<li>{c.name}</li>
			{/each}
		</ul>
	{/if}
</section>

<section style="margin-top: 1.5rem;">
	<h2>Outcome categories (API)</h2>
	{#if outcomeCategories.length === 0}
		<p>No outcome categories.</p>
	{:else}
		<ul>
			{#each outcomeCategories as c}
				<li>{c.name}</li>
			{/each}
		</ul>
	{/if}
</section>
