<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/authStore';
	import { env } from '$env/dynamic/public';
	import { SvelteMap, SvelteDate } from 'svelte/reactivity';
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

	// Timeframe filter for pie chart
	let timeframe = 'lifetime'; // '1m' | '3m' | '1y' | 'lifetime'
	let showTimeframeMenu = false;

	// Robust outside-click handler: close only when clicking outside the dropdown trigger/panel
	function handleWindowClick(e) {
		// If menu isn't open, nothing to do
		if (!showTimeframeMenu) return;
		const path = e.composedPath ? e.composedPath() : [];
		const clickedInsideMenu = path.some((el) => {
			if (!el || !el.classList) return false;
			return el.classList.contains('timeframe-menu') || el.classList.contains('timeframe-btn') || el.classList.contains('timeframe-panel') || el.classList.contains('timeframe-item');
		});
		if (!clickedInsideMenu) {
			showTimeframeMenu = false;
		}
	}

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
		
		// Apply timeframe filter for pie chart
		let filteredTx = transactions;
		if (timeframe !== 'lifetime') {
			const now = new SvelteDate();
			let startDate;
			switch (timeframe) {
				case '1m':
					startDate = new SvelteDate(now);
					startDate.setMonth(startDate.getMonth() - 1);
					break;
				case '3m':
					startDate = new SvelteDate(now);
					startDate.setMonth(startDate.getMonth() - 3);
					break;
				case '1y':
					startDate = new SvelteDate(now);
					startDate.setFullYear(startDate.getFullYear() - 1);
					break;
			}
			filteredTx = transactions.filter((tx) => {
				const d = new Date(tx.txnDate);
				return d >= startDate && d <= now;
			});
		}

		// Group expenses by category
		const categoryData = {};

		filteredTx.forEach((tx) => {
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

	function selectTimeframe(tf) {
		timeframe = tf;
		showTimeframeMenu = false;
		processPieChartData();
	}

	$: timeframeLabel =
		timeframe === '1m' ? '1 month' : timeframe === '3m' ? '3 months' : timeframe === '1y' ? '1 year' : 'Lifetime';
</script>

<!-- click-outside to close timeframe menu -->
<svelte:window on:click={handleWindowClick} />

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

		<!-- Wrap pie chart and place dropdown inside its box (top-right) -->
		<div class="chart-box" style="position: relative;">
			<div class="timeframe-menu">
				<button
					type="button"
					class="timeframe-btn"
					aria-haspopup="listbox"
					aria-expanded={showTimeframeMenu}
					on:click|stopPropagation={() => { showTimeframeMenu = !showTimeframeMenu; }}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTimeframeMenu = !showTimeframeMenu; }
					}}
				>
					<span>{timeframeLabel}</span>
					<span class="chev" aria-hidden="true">▾</span>
				</button>
							{#if showTimeframeMenu}
								<ul class="timeframe-panel" role="listbox" aria-label="Timeframe" on:click|stopPropagation on:keydown|stopPropagation>
						<li>
							<button type="button" class="timeframe-item" role="option" aria-selected={timeframe === '1m'} on:click|stopPropagation={() => selectTimeframe('1m')}>
								<span>1 month</span>
								{#if timeframe === '1m'}<span class="check">✓</span>{/if}
							</button>
						</li>
						<li>
							<button type="button" class="timeframe-item" role="option" aria-selected={timeframe === '3m'} on:click|stopPropagation={() => selectTimeframe('3m')}>
								<span>3 months</span>
								{#if timeframe === '3m'}<span class="check">✓</span>{/if}
							</button>
						</li>
						<li>
							<button type="button" class="timeframe-item" role="option" aria-selected={timeframe === '1y'} on:click|stopPropagation={() => selectTimeframe('1y')}>
								<span>1 year</span>
								{#if timeframe === '1y'}<span class="check">✓</span>{/if}
							</button>
						</li>
						<li>
							<button type="button" class="timeframe-item" role="option" aria-selected={timeframe === 'lifetime'} on:click|stopPropagation={() => selectTimeframe('lifetime')}>
								<span>Lifetime</span>
								{#if timeframe === 'lifetime'}<span class="check">✓</span>{/if}
							</button>
						</li>
					</ul>
				{/if}
			</div>

			<PieChart
				title="Expenses by Category"
				labels={pieChartLabels}
				data={pieChartData}
			/>
		</div>
	</div>

<style>
	/* Timeframe dropdown - isolated styles to prevent conflicts */
	.timeframe-menu {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 100;
	}

	.timeframe-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid #d9dbe0;
		background: #f3f3f6;
		border-radius: 12px;
		cursor: pointer;
		font: inherit;
		color: #111;
		line-height: 1.1;
		transition: border 0.15s ease, background 0.15s ease;
	}

	.timeframe-btn:hover {
		background: #e8e8ec;
	}

	.timeframe-btn:focus-visible {
		outline: none;
		border-color: #111;
		box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
	}

	.timeframe-btn .chev {
		opacity: 0.6;
		font-size: 0.8rem;
	}

	.timeframe-panel {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		min-width: 190px;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 14px;
		box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
		padding: 0.25rem 0;
		z-index: 200;
		list-style: none;
		margin: 0;
	}

	.timeframe-panel li {
		list-style: none;
	}

	.timeframe-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 1rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: #111;
		transition: background 0.12s ease;
	}

	.timeframe-item:hover {
		background: #f7f7fa;
	}

	.timeframe-item[aria-selected="true"] {
		background: #f0f0f5;
		font-weight: 500;
	}

	.timeframe-item .check {
		color: #111;
		font-weight: 600;
	}
</style>
	<!-- Debug info -->
	<div style="display: none;">
		<p>Pie Chart Labels: {JSON.stringify(pieChartLabels)}</p>
		<p>Pie Chart Data: {JSON.stringify(pieChartData)}</p>
		<p>Categories loaded: {categories.length}</p>
		<p>Transactions loaded: {transactions.length}</p>
	</div>
{/if}
