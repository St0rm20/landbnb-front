import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Metric {
    icon: string;
    value: string;
    label: string;
}

@Component({
    selector: 'app-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class StatisticsComponent implements OnInit, AfterViewInit {
    dropdownOpen = false;

    metrics: Metric[] = [
        {
            icon: 'fas fa-dollar-sign',
            value: '$15,300',
            label: 'Ingresos totales'
        },
        {
            icon: 'fas fa-calendar-check',
            value: '45',
            label: 'Reservas confirmadas'
        },
        {
            icon: 'fas fa-chart-pie',
            value: '85%',
            label: 'Tasa de ocupación'
        }
    ];

    private chart: Chart | null = null;

    ngOnInit(): void {
        // Inicialización básica
    }

    ngAfterViewInit(): void {
        this.createChart();
    }

    createChart(): void {
        const canvas = document.getElementById('ingresosChart') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(185, 116, 121, 0.6)');
        gradient.addColorStop(1, 'rgba(185, 116, 121, 0.1)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'],
                datasets: [{
                    label: 'Ingresos',
                    data: [3000, 5000, 2300, 4500, 6200, 7100],
                    backgroundColor: gradient,
                    borderColor: 'rgba(185, 116, 121, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(185, 116, 121, 1)',
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 10,
                        cornerRadius: 8
                    }
                }
            }
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    toggleDropdown(event: Event): void {
        event.preventDefault();
        this.dropdownOpen = !this.dropdownOpen;
    }
}