<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/bar-chart.css';
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
						barThickness: 16
					},
					{
						label: 'Expenses',
						data: expenseData,
						backgroundColor: 'rgba(239, 83, 80, 0.9)',
						borderRadius: 4,
						barThickness: 16
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							padding: 15,
							font: {
								size: 14,
								weight: '500'
							},
							color: '#333',
							usePointStyle: true,
							pointStyle: 'circle'
						}
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
							color: '#666'
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
		chartInstance.data.datasets[0].data = incomeData;
		chartInstance.data.datasets[1].data = expenseData;
		
		// Calculate dynamic max value (120% of highest value)
		const maxIncome = Math.max(...incomeData, 0);
		const maxExpense = Math.max(...expenseData, 0);
		const maxValue = Math.max(maxIncome, maxExpense);
		const dynamicMax = maxValue * 1.2;
		
		chartInstance.options.scales.y.max = dynamicMax;
		chartInstance.options.scales.y.ticks.stepSize = undefined; // Let Chart.js calculate steps
		
		chartInstance.update();
	}
</script>

<div class="chart-container">
	<h2 class="chart-title">{title}</h2>
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>


