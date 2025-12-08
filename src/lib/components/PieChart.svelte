<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/pie-chart.css';
	import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

	Chart.register(ArcElement, Tooltip, Legend);

	export let data = [];
	export let labels = [];
	export let title = 'Pie Chart';

	let canvas;
	let chartInstance;

	const colors = [
		'rgba(139, 128, 204, 0.9)', // Purple
		'rgba(255, 152, 77, 0.9)', // Orange
		'rgba(255, 221, 77, 0.9)', // Yellow
		'rgba(140, 184, 164, 0.9)', // Teal
		'rgba(102, 153, 204, 0.9)', // Blue
		'rgba(255, 102, 102, 0.9)' // Red
	];

	function getLegendColor(index) {
		return colors[index % colors.length];
	}

	onMount(() => {
		if (!canvas) return;

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
				maintainAspectRatio: true,
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
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});

	$: if (chartInstance) {
		chartInstance.data.labels = labels;
		chartInstance.data.datasets[0].data = data;
		chartInstance.update();
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


