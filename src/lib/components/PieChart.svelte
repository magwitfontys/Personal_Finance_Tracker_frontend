<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import '$lib/styles/pie-chart.css';
	import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';

	Chart.register(ArcElement, Tooltip, Legend, PieController);

	export let data = [];
	export let labels = [];
	export let title = 'Pie Chart';

	let canvas;
	let chartInstance;

	const colors = [
		'rgba(255, 99, 132, 0.9)',   // Red
		'rgba(54, 162, 235, 0.9)',   // Blue
		'rgba(255, 206, 86, 0.9)',   // Yellow
		'rgba(75, 192, 192, 0.9)',   // Teal
		'rgba(153, 102, 255, 0.9)',  // Purple
		'rgba(255, 159, 64, 0.9)',   // Orange
		'rgba(46, 204, 113, 0.9)',   // Green
		'rgba(231, 76, 60, 0.9)',    // Dark Red
		'rgba(52, 152, 219, 0.9)',   // Light Blue
		'rgba(155, 89, 182, 0.9)'    // Violet
	];

	function getLegendColor(index) {
		return colors[index % colors.length];
	}

	function createChart() {
		if (!canvas) {
			console.warn('[PieChart] Canvas element not found');
			return;
		}
		if (!data || data.length === 0) {
			console.warn('[PieChart] No data provided:', data);
			return;
		}

		try {
			console.log('[PieChart] Creating chart with data:', data, 'labels:', labels);
			const ctx = canvas.getContext('2d');
			chartInstance = new Chart(ctx, {
				type: 'pie',
				data: {
					labels: labels,
					datasets: [
						{
							data: data,
							backgroundColor: colors,
							borderWidth: 0
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							enabled: true,
							callbacks: {
								label: function (context) {
									const label = context.label || '';
									const value = context.parsed || 0;
									const total = context.dataset.data.reduce((a, b) => a + b, 0);
									const percentage = Math.round((value / total) * 100);
									return `${label}: ${percentage}%`;
								}
							}
						}
					}
				}
			});
			console.log('[PieChart] Chart created successfully');
		} catch (err) {
			console.error('[PieChart] Error creating chart:', err);
		}
	}

	onMount(async () => {
		await tick();
		createChart();
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});

	$: if (canvas && data && data.length > 0 && labels && labels.length > 0) {
		if (chartInstance) {
			console.log('[PieChart] Updating existing chart');
			chartInstance.data.labels = labels;
			chartInstance.data.datasets[0].data = data;
			chartInstance.update();
		} else {
			console.log('[PieChart] Creating chart via reactive statement');
			createChart();
		}
	}
</script>

<div class="chart-container">
	<h2 class="chart-title">{title}</h2>
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
	<div class="legend">
		{#each labels as label, i (i)}
			{@const total = data.reduce((a, b) => a + b, 0)}
			{@const percentage = Math.round((data[i] / total) * 100)}
			<div class="legend-item" style="color: {getLegendColor(i)}">
				{label} {percentage}%
			</div>
		{/each}
	</div>
</div>


