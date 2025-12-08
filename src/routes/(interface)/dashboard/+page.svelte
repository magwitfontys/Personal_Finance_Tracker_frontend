<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/authStore';
	import { env } from '$env/dynamic/public';
	import { SvelteMap } from 'svelte/reactivity';
	import BarChart from '$lib/components/BarChart.svelte';
	import PieChart from '$lib/components/PieChart.svelte';
	import '$lib/styles/dashboard.css';

	const API_BASE = (env.PUBLIC_API_BASE || '/api').replace(/\/$/, '');

	let transactions = [];
	let categories = []; // [{ id, name, income }, ...]
	let isLoading = true;

	// Bar chart data
	let barChartLabels = [];
	let barChartIncome = [];
	let barChartExpenses = [];

	// Pie chart data
	let pieChartLabels = [];
	let pieChartData = [];

	function getCategoryNameById(categoryId) {
		const cat = categories.find((c) => c.id === categoryId);
		return cat ? cat.name : 'Unknown';
	}

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

	async function loadTransactions() {
		try {
			const userId = localStorage.getItem('userId') || '1';
			const res = await fetch(`${API_BASE}/transactions?userId=${userId}`);

			if (!res.ok) {
				throw new Error(`Failed to load transactions: ${res.status}`);
			}

			const data = await res.json();
			transactions = data;
			processBarChartData();
			processPieChartData();
		} catch (err) {
			console.error('Error loading transactions:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadCategories() {
		try {
			// Load both income and expense categories
			const [incomeRes, expenseRes] = await Promise.all([
				fetch(`${API_BASE}/categories/income`),
				fetch(`${API_BASE}/categories/outcome`)
			]);

			const incomeData = incomeRes.ok ? await incomeRes.json() : [];
			const expenseData = expenseRes.ok ? await expenseRes.json() : [];

			// Combine and dedupe by id
			const combined = [...incomeData, ...expenseData];
			const map = new SvelteMap();
			combined.forEach((c) => {
				if (!map.has(c.id)) {
					map.set(c.id, c);
				}
			});
			categories = Array.from(map.values());
			console.log('[Dashboard] Loaded categories:', categories);
		} catch (err) {
			console.error('Error loading categories:', err);
		}
	}

	function processBarChartData() {
		// Group transactions by month
		const monthlyData = {};

		transactions.forEach((tx) => {
			const date = new Date(tx.txnDate);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			
			if (!monthlyData[monthKey]) {
				monthlyData[monthKey] = { income: 0, expenses: 0 };
			}

			if (tx.txnType === 'INCOME') {
				monthlyData[monthKey].income += tx.amount;
			} else {
				monthlyData[monthKey].expenses += tx.amount;
			}
		});

		// Sort by month and get last 12 months
		const sortedMonths = Object.keys(monthlyData).sort().slice(-12);

		// Format labels and prepare data
		barChartLabels = sortedMonths.map((monthKey) => {
			const [year, month] = monthKey.split('-');
			const date = new Date(year, parseInt(month) - 1);
			return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		});

		barChartIncome = sortedMonths.map((monthKey) => monthlyData[monthKey].income);
		barChartExpenses = sortedMonths.map((monthKey) => monthlyData[monthKey].expenses);
	}

	function processPieChartData() {
		console.log('[Dashboard] Processing pie chart data...');
		console.log('[Dashboard] Transactions:', transactions);
		console.log('[Dashboard] Categories:', categories);
		
		// Group expenses by category
		const categoryData = {};

		transactions.forEach((tx) => {
			if (tx.txnType === 'EXPENSE') {
				const categoryName = getCategoryNameById(tx.categoryId);
				console.log(`[Dashboard] Transaction ${tx.transactionId}: categoryId=${tx.categoryId}, categoryName=${categoryName}, amount=${tx.amount}`);
				if (!categoryData[categoryName]) {
					categoryData[categoryName] = 0;
				}
				categoryData[categoryName] += tx.amount;
			}
		});

		console.log('[Dashboard] Category data aggregated:', categoryData);

		// Sort by amount descending and get top categories
		const sortedCategories = Object.entries(categoryData)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10); // Limit to 10 categories for pie chart clarity

		pieChartLabels = sortedCategories.map((entry) => entry[0]);
		pieChartData = sortedCategories.map((entry) => entry[1]);
		
		console.log('[Dashboard] Pie chart labels:', pieChartLabels);
		console.log('[Dashboard] Pie chart data:', pieChartData);
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

		// Load categories first, then transactions
		await loadCategories();
		await loadTransactions();
	});
</script>

{#if isLoading}
	<p>Loading...</p>
{:else}
	<div class="dashboard-content">
		<BarChart
			title="Monthly Income vs Expenses"
			labels={barChartLabels}
			incomeData={barChartIncome}
			expenseData={barChartExpenses}
		/>
		<PieChart
			title="Expenses by Category"
			labels={pieChartLabels}
			data={pieChartData}
		/>
	</div>
	<!-- Debug info -->
	<div style="display: none;">
		<p>Pie Chart Labels: {JSON.stringify(pieChartLabels)}</p>
		<p>Pie Chart Data: {JSON.stringify(pieChartData)}</p>
		<p>Categories loaded: {categories.length}</p>
		<p>Transactions loaded: {transactions.length}</p>
	</div>
{/if}
