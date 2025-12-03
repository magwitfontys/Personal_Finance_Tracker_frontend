<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		BarController
	} from 'chart.js';

	Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController);

	export let incomeData = [];
	export let expenseData = [];
	export let labels = [];
	export let title = 'Bar Chart';

	let canvas;
	let chartInstance;

	onMount(() => {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Income',
						data: incomeData,
						backgroundColor: 'rgba(102, 187, 106, 0.9)',
						borderRadius: 4,
						barThickness: 50
					},
					{
						label: 'Expenses',
						data: expenseData,
						backgroundColor: 'rgba(239, 83, 80, 0.9)',
						borderRadius: 4,
						barThickness: 50
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
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						padding: 12,
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: 'rgba(0, 0, 0, 0.1)',
						borderWidth: 1
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						ticks: {
							font: {
								size: 13
							},
							color: '#666'
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0, 0, 0, 0.05)',
							drawBorder: false
						},
						ticks: {
							font: {
								size: 12
							},
							color: '#666',
							stepSize: 850
						},
						max: 3400
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
		chartInstance.data.datasets[0].data = incomeData;
		chartInstance.data.datasets[1].data = expenseData;
		chartInstance.update();
	}
</script>

<div class="chart-container">
	<h2 class="chart-title">{title}</h2>
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
	.chart-container {
		width: 100%;
		max-width: 700px;
		background: white;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.chart-title {
		font-size: 20px;
		font-weight: 500;
		margin: 0 0 20px 0;
		color: #333;
	}

	.chart-wrapper {
		width: 100%;
		height: 350px;
	}
</style>
